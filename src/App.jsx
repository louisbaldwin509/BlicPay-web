import React, { useState } from 'react';
import BusinessApp from './business/BusinessApp.jsx';
import ReceiveQR from './ReceiveQR.jsx';
import { CATEGORY_ART } from './CategoryArt.jsx';
import { WEB_DICT } from './i18n/webDict.js';

// Lang aktif la (ht | fr | en) — mete ajou nan chak rann BlicPayApp.
// tt("tèks kreyòl", ...valè) → tradiksyon an fr/en (oswa kreyòl la menm si pa jwenn).
let CURRENT_LANG = 'ht';
const LANG_IDX = { fr: 0, en: 1 };
function tt(s, ...args) {
  // "tèks@@kontèks" — menm tèks kreyòl, sans diferan (egz. Verifye = vèb oswa adjektif).
  let out = typeof s === 'string' && s.includes('@@') ? s.split('@@')[0] : s;
  if (CURRENT_LANG !== 'ht' && typeof s === 'string') {
    const row = WEB_DICT[s];
    if (row && row[LANG_IDX[CURRENT_LANG]]) out = row[LANG_IDX[CURRENT_LANG]];
  }
  if (args.length) out = String(out).replace(/\{(\d+)\}/g, (m, i) => (args[i] ?? m));
  return out;
}
import {
  Bell, Wallet, ArrowUpRight, ArrowDownLeft, Clock, Settings, Home,
  ArrowLeftRight, Plus, Check, Copy, ChevronRight, ArrowLeft, ShieldCheck,
  DollarSign, Smartphone, Banknote, X, AlertCircle, Building2, Eye, EyeOff, RefreshCw, Users, BadgeCheck, PiggyBank,
  Lock, Calendar, Percent, TrendingUp, HandCoins, Globe, Camera, User, LogOut, Phone, Mail, Search, Star, FileText, QrCode
} from 'lucide-react';

// Coupe l'URL réelle de ton backend ici une fois qu'il est déployé
// (Railway, Render, etc.) — ex: "https://blicpay-api.up.railway.app"
const API_BASE_URL = 'https://api.blicpayht.com';

// Separe yon "data URL" (egzanp "data:image/jpeg;base64,xxxx") an de pati:
// [mimeType, done base64 la san prefiks la] — sèvi pou voye foto KYC yo bay backend la.
function splitDataUrl(dataUrl) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || '');
  return match ? [match[1], match[2]] : ['image/jpeg', dataUrl || ''];
}

// Redwi ak konprese yon foto (egzanp: yon selfi telefòn ki ka fè 5-10Mo)
// anvan nou konvèti l an data URL — sa anpeche demand KYC a echwe an silans
// akoz yon foto ki twò gwo pou sèvè a aksepte.
function compressImageFile(file, maxDim = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(tt("Nou pa t ka li foto a.")));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error(tt("Foto a domaje oswa nan yon fòma nou pa sipòte.")));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Analize yon dataURL pou detekte foto ki twò flou oswa ki gen move limyè
// (twò fè nwa oswa twò klere/eksponaj). Sèvi ak yon vèsyon piti gri nan
// imaj la pou rezilta a rapid, san pa gen depandans deyò.
function analyzeImageQuality(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onerror = () => resolve({ ok: true }); // pa bloke si nou pa ka analize l
    img.onload = () => {
      const w = 160;
      const h = Math.max(1, Math.round((img.height / img.width) * w));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      let data;
      try {
        data = ctx.getImageData(0, 0, w, h).data;
      } catch {
        resolve({ ok: true });
        return;
      }

      const gray = new Float32Array(w * h);
      let sumBrightness = 0;
      for (let i = 0, p = 0; i < data.length; i += 4, p++) {
        const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        gray[p] = g;
        sumBrightness += g;
      }
      const brightness = sumBrightness / gray.length;

      // Varyans Laplasyen — yon foto klè gen anpil kontras bò kwen yo (varyans
      // segondè); yon foto flou gen tras plis lis, kidonk varyans ba.
      let sum = 0, sumSq = 0, n = 0;
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = y * w + x;
          const lap =
            gray[idx - 1] + gray[idx + 1] + gray[idx - w] + gray[idx + w] - 4 * gray[idx];
          sum += lap;
          sumSq += lap * lap;
          n++;
        }
      }
      const mean = sum / n;
      const variance = sumSq / n - mean * mean;

      if (brightness < 45) {
        resolve({ ok: false, reason: 'Foto a twò fè nwa. Al nan yon kote ki gen plis limyè epi eseye ankò.' });
      } else if (brightness > 235) {
        resolve({ ok: false, reason: 'Foto a twò klere (twòp limyè/flach). Eseye ankò san flach dirèk.' });
      } else if (variance < 18) {
        resolve({ ok: false, reason: 'Foto a two flou. Kenbe telefòn nan fiks epi eseye ankò.' });
      } else {
        resolve({ ok: true });
      }
    };
    img.src = dataUrl;
  });
}


async function apiFetch(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-BLIC-Lang': CURRENT_LANG,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Yon bagay pa mache. Eseye ankò.');
  }
  return data;
}

const C = {
  bg: '#F4F6FA',
  card: '#FFFFFF',
  border: '#E6E9F0',
  ink: '#0B1B33',
  muted: '#6B7684',
  navy: '#143A73',
  sky: '#29B6E8',
  mint: '#1E9E7C',
  amber: '#D98B1D',
  danger: '#D14343',
};

const fontDisplay = { fontFamily: "'Manrope', sans-serif" };
const fontMono = { fontFamily: "'IBM Plex Mono', monospace" };

// Etikèt lizib pou chak tip demand admin ka kreye nan VerificationRequest.
const VR_TYPE_LABELS = {
  address_proof: 'Prèv adrès',
  income_proof: 'Prèv revni',
  identity_reverify: 'Refè verifikasyon idantite',
  other: 'Lòt dokiman',
};

// Etikèt + koulè pou tip tranzaksyon an (depo/retrè/transfè) — montre nan
// istorik la akote metòd la (egzanp "MonCash") pou li klè ki sans lajan an mouve.
const TX_TYPE_LABELS = {
  depo: { label: 'Depo', color: '#1E9E7C' },
  retrè: { label: 'Retrè', color: '#D14343' },
  transfè: { label: 'Transfè', color: '#143A73' },
};

// Kategori metòd depo/retrè yo — ekran an montre yo pa gwoup olye yon sèl blòk.
// Pou ajoute yon nouvo metòd: mete `kind` li ('mobile' | 'bank' | 'crypto' | 'office').
const METHOD_CATEGORIES = [
  { id: 'mobile', kinds: ['mobile'], tint: 'linear-gradient(160deg, #E8F7FE 0%, #D3EEFB 100%)' },
  { id: 'bank', kinds: ['bank'], tint: 'linear-gradient(160deg, #EEF3FB 0%, #DCE6F5 100%)' },
  { id: 'other', kinds: ['crypto', 'office'], tint: 'linear-gradient(160deg, #EAF8F2 0%, #D4F0E4 100%)' },
];

const methods = [
  { id: 'moncash', name: 'Mon Cash', desc: 'Depoze kach nan pwen Digicel ou', color: '#1E9E7C', icon: DollarSign, logo: '/logos/moncash-icon.png', kind: 'mobile' },
  { id: 'natcash', name: 'NatCash', desc: 'Depoze ak bous mobil NatCash ou', color: '#1C6FBF', icon: Smartphone, logo: '/logos/natcash-icon.png', kind: 'mobile' },
  { id: 'usdt', name: 'USDT', desc: 'Depoze dola ameriken an stablecoin (Tether)', color: '#0E9E86', icon: Banknote, logo: '/logos/usdt-icon.png', kind: 'crypto', comingSoon: true },
  { id: 'zelle', name: 'Zelle', desc: 'Depoze dirèkteman soti nan kont labank ou', color: '#6D3FD1', icon: ArrowLeftRight, logo: '/logos/zelle-icon.png', kind: 'bank', comingSoon: true },
  { id: 'biwo', name: 'Nan biwo', desc: 'Ale peye kach nan yonn nan biwo nou yo', color: '#946115', icon: Building2, logo: null, kind: 'office' },
];


// Jwenn logo yon metòd (MonCash, NatCash, elt.) apati non li kòm li anrejistre
// nan yon tranzaksyon (`t.method`). Retounen null pou "Nan biwo" (pa gen logo)
// ak pou tranzaksyon Transfè/Pòch ki gen deskripsyon olye yon non metòd egzat
// — nan ka sa yo, UI a retounen sou flèch antre/sòti a kòm repli.
function getMethodLogo(methodName) {
  const m = methods.find((x) => x.name === methodName);
  return m?.logo || null;
}

const DEMO_TOKEN = 'demo-token';
const demoUser = { fullName: 'Jean Baptiste', phone: '+509 3811 2244', balance: 10000, verified: true, clientId: 'BP-100234' };
const demoTx = [
  { id: 't1', method: 'Mon Cash', amount: 5000, status: 'konfime', date: '3 out', ts: Date.now() - 5 * 86400000 },
  { id: 't2', method: 'NatCash', amount: 2500, status: 'konfime', date: '29 jiyè', ts: Date.now() - 10 * 86400000 },
  { id: 't3', method: 'USDT', amount: 100, status: 'konfime', date: '20 jiyè', ts: Date.now() - 19 * 86400000 },
];

const initialPockets = [
  { id: 'p1', name: 'Ijans', balance: 2000, target: 10000 },
  { id: 'p2', name: 'Vwayaj', balance: 500, target: 5000 },
];

const initialGoalDeposits = [
  { id: 'gd1', name: 'Machin', target: 50000, current: 50000, status: 'rive' },
];

const LOAN_PLANS = [
  { months: 3, rate: 0.08 },
  { months: 6, rate: 0.14 },
  { months: 12, rate: 0.24 },
];

const LANGS = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ht', label: 'Kreyòl Ayisyen', flag: '🇭🇹' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
];

const T = {
  ht: {
    welcome: 'Byenveni,',
    balanceLabel: 'SÒLD TOTAL',
    accountLabel: 'Kont BLICPay',
    navHome: 'Akèy', navHistory: 'Istwa', navTransfer: 'Transfè', navSettings: 'Paramèt',
    tileDeposit: 'Depoze', tileWithdraw: 'Retrè', tileTransfer: 'Transfere', tileReceive: 'Resevwa', myQr: 'QR mwen',
    tileSol: 'BLIC Sòl', tileDepo: 'BLIC Depo', tileGoal: 'Depo Ak Objektif', tileLoan: 'Prè',
    lp_mockBalance: 'SOLDE KONT', lp_mockQuickAccess: 'AKSÈ RAPID', lp_mockGoalShort: 'Objektif',
    lp_mockRecentActivity: 'AKTIVITE RESAN', lp_mockDepositMoncash: 'Depo MonCash', lp_mockSolContribution: 'Kotizasyon Sòl Basic #3',
    lp_mockWeeklyDesc: 'Chak semenn · 1,000 HTG pa moun', lp_mockBiweeklyDesc: 'Chak 15 jou · 2,500 HTG', lp_mockRequestJoin: 'Mande antre',
    lp_cardTagline: '| GLOBAL | SEKIRIZE | DIJITAL |', lp_cardHolder: 'KLIYAN BLICPAY',
    recentTx: 'TRANZAKSYON REZAN',
    loginTab: 'Konekte', registerTab: 'Kreye kont',
    fullNamePh: 'Non konplè', phonePh: 'Nimewo telefòn', passwordPh: 'Modpas',
    lastNamePh: 'Non', firstNamePh: 'Prenon', emailPh: 'Imèl',
    addressPh: 'Adrès', cityPh: 'Vil', departmentPh: 'Depatman',
    countryPh: 'Peyi',
    countries: ['Ayiti'],
    loginBtn: 'Konekte', registerBtn: 'Kreye kont', waitBtn: 'Tann...',
    demoBtn: 'Wè demo a (san backend)',
    langLabel: 'Lang',
    settingsTitle: 'Paramèt', accountSection: 'KONT', prefsSection: 'PREFERANS',
    supportSection: 'SIPÒ', aboutSection: 'APWOPO',
    editProfile: 'Modifye pwofil', changePassword: 'Chanje modpas',
    hideBalanceDefault: 'Kache sòld pa default', contactSupport: 'Kontakte sipò', faq: 'Kesyon Frekan',
    saveBtn: 'Sove',
    currentPasswordPh: 'Modpas aktyèl', newPasswordPh: 'Nouvo modpas', confirmNewPasswordPh: 'Konfime nouvo modpas',
    pwChangedMsg: 'Modpas ou chanje.', errCurrentPassword: 'Antre modpas aktyèl ou.',
    supportSubtitle: 'Nou la pou ede w. Chwazi kijan ou vle kontakte nou.',
    callUs: 'Rele nou', chatWhatsapp: 'Chat sou WhatsApp', emailUs: 'Voye imèl',
    sendMsgTitle: 'OSWA VOYE YON MESAJ', subjectPh: 'Sijè a', messagePh: 'Ekri mesaj ou a...',
    sendBtn: 'Voye mesaj la', supportSentMsg: 'Mesaj ou voye — n ap reponn ou byento.',
    errSubject: 'Chwazi yon sijè.', errMessage: 'Ekri yon mesaj.',
    forgotPasswordLink: 'Bliye modpas?', forgotTitle: 'Reyajiste modpas',
    forgotStep1Sub: 'Antre nimewo telefòn kont ou pou resevwa yon kòd.',
    sendCodeBtn: 'Voye kòd la', forgotStep2Sub: 'Antre kòd nou voye a, ansanm ak nouvo modpas ou.',
    codePh: 'Kòd (6 chif)', resetPasswordBtn: 'Chanje modpas la',
    resetSuccessMsg: 'Modpas ou chanje — konekte ak nouvo modpas la.',
    errCode: 'Antre kòd la.',
    historyTitle: 'Istwa', filterAll: 'Tout', filterIn: 'Antre', filterOut: 'Soti',
    searchPh: 'Chèche pa non...', noResults: 'Pa gen okenn rezilta.',
    statusAll: 'Tout Estati', statusConfirmed: 'Konfime', statusPending: 'Annatant',
    dateFrom: 'Depi', dateTo: 'Jiska', clearDates: 'Efase dat yo',
    logout: 'Dekonekte',
    noTx: 'Pa gen tranzaksyon.',
    stepInfo: 'Enfòmasyon pèsonèl', stepPassword: 'Modpas', stepTerms: 'Kondisyon',
    confirmPasswordPh: 'Konfime modpas', next: 'Kontinye', back: 'Retounen',
    termsText: 'Mwen aksepte Kondisyon Itilizasyon ak Politik Konfidansyalite BLICPay yo.',
    createAccountBtn: 'Kreye kont mwen', reviewInfo: 'Verifye enfòmasyon w yo',
    errFullName: 'Antre non ou.', errPhone: 'Antre yon nimewo telefòn.',
    errPasswordShort: 'Modpas la dwe gen omwen 6 karaktè.', errPasswordMatch: 'Modpas yo pa menm.',
    errTerms: 'Ou dwe aksepte kondisyon yo pou kontinye.',
    lp_badge: 'Platfòm Finans Pèsonèl', lp_h1a: 'Platfòm Modèn Pou', lp_h1b: 'Jesyon Lajan Ou.', lp_h1italic: 'Libere lajan ou.',
    lp_sub: 'Depo, retrè, transfè, prè, epay ak sistèm sòl tradisyonèl la — tout nan yon sèl aplikasyon, kèlkeswa kote w ye.',
    lp_start: 'Kòmanse kounye a', lp_login: 'Konekte', lp_signup: 'Kreye kont',
    lp_methods: 'Metòd Depo Ki Sipòte',
    cat_mobile: 'Mobile wallet', cat_bank: 'Bank', cat_other: 'Lòt', cat_soon: 'Byento',
    chooseCatDeposit: 'Chwazi kijan pou w depoze', chooseCatWithdraw: 'Chwazi kijan pou w retire',
    lp_stat1: 'gwoup BLIC Sòl', lp_stat2: 'fason pou depoze', lp_stat3: 'plan prè disponib', lp_stat4: 'nivo Sòl (Basic/Standard/Premium)',
    lp_featEyebrow: 'FONKSYONALITE', lp_featTitle: 'Tout sa ou bezwen, *nan yon sèl kote*.', lp_featSub: 'Yon platfòm pou chak aspè lajan ou — pou ou menm oswa fanmi w.',
    lp_f1t: 'Sistèm tradisyonèl la, *tounen dijital*.', lp_f1d: '90 gwoup nan 3 nivo (Basic, Standard, Premium) ak 3 frekans pou ekonomize an gwoup.',
    lp_f2t: 'Yon objektif, *toujou vizib*.', lp_f2d: 'Fikse yon sib epay epi swiv pwogrè w chak fwa ou mete lajan.',
    lp_f3t: 'Prè rapid, *san tèt chaje*.', lp_f3d: 'Mande yon prè ak plan 3, 6 oswa 12 mwa, ak vèsman klè chak peryòd.',
    lp_f4t: 'Voye lajan, *an segond*.', lp_f4d: 'Voye lajan bay yon lòt kliyan BLICPay dirèkteman ak ID kliyan li.',
    lp_f5t: 'Separe lajan w, *fasil*.', lp_f5d: 'Kreye plizyè "pòch" pou separe lajan w — Ijans, Vwayaj, elatriye.',
    lp_f6t: 'Verifye w *yon sèl fwa*.', lp_f6d: 'Konte idantite w verifye pou plis sekirite ak plis limit sou kont ou.',
    lp_howEyebrow: 'KIJAN LI MACHE', lp_howTitle: 'Tou pare, *an kèk minit*.', lp_howSub: 'Twa etap senp pou kòmanse jere lajan w.',
    lp_s1t: 'Kreye kont ou', lp_s1d: 'Antre non w, telefòn ou, ak yon modpas. Sa pran mwens pase 2 minit.',
    lp_s2t: 'Depoze lajan', lp_s2d: 'Chwazi MonCash, NatCash, USDT, Zelle, oswa yon depo nan biwo pou mete lajan nan kont ou.',
    lp_s3t: 'Jere lajan w', lp_s3d: 'Voye, resevwa, epay, mande yon prè, oswa antre nan yon gwoup BLIC Sòl — tout nan yon sèl kote.',
    lp_solEyebrow: 'BLIC SÒL', lp_solTitle: 'Chwazi nivo w, *jan ou vle*.', lp_solSub: 'Twa nivo, twa frekans — chwazi sa ki fè w byen.',
    lp_solNivo: 'Nivo', lp_solSemenn: 'Chak semenn', lp_solKenzenn: 'Chak 15 jou', lp_solMwa: 'Chak mwa',
    lp_solNote: 'Chak gwoup gen 10 plas. Yon frè sèvis 2% aplike sou chak vèsman lè yon manm resevwa tou li.',
    lp_reachH1a: 'Aksè', lp_reachH1b: 'Kèlkeswa Kote Ou Ye', lp_reachSub: 'Yon sèl aplikasyon web, aksesib sou telefòn ak òdinatè, san limit orè.',
    lp_reachStat1: '90', lp_reachLabel1: 'gwoup BLIC Sòl',
    lp_reachStat2: '5', lp_reachLabel2: 'metòd depo',
    lp_reachStat3: '24/7', lp_reachLabel3: 'aksè an liy',
    lp_reachStat4: '3', lp_reachLabel4: 'lang disponib',
    lp_testiEyebrow: 'TEMWAYAJ', lp_testiTitle: 'Bati pou grandi, *pwouve pa kliyan*.',
    lp_testiQuote: '[Kòmantè kliyan an ap parèt isit la]', lp_testiName: '[Non Kliyan]', lp_testiRole: 'Kliyan BLICPay',
    lp_testi1Name: 'Pierre', lp_testi1Role: 'Kliyan BLICPay', lp_testi1Quote: 'M ap tann kat entènasyonal BLICPay a ak tout kè m — aplikasyon an deja fasilite lavi m anpil.',
    lp_testi2Name: 'Joseph', lp_testi2Role: 'Kliyan BLICPay', lp_testi2Quote: 'Mwen renmen aplikasyon BLICPay a — li senp e li rapid.',
    lp_testi3Name: 'Louidor', lp_testi3Role: 'Kliyan BLICPay', lp_testi3Quote: 'Yon aplikasyon m renmen anpil, li fè tout bagay pi fasil pou mwen.',
    lp_testi4Name: 'Julienne', lp_testi4Role: 'Kliyan BLICPay', lp_testi4Quote: 'BLIC Depo ede m mete lajan an kote pou objektif mwen yo — mwen renmen sa anpil.',
    lp_testi5Name: 'Martha', lp_testi5Role: 'Kliyan BLICPay', lp_testi5Quote: 'Mwen renmen fason gwoup Sòl yo fonksyone sou BLICPay — li fasil pou swiv.',
    lp_testi6Name: 'Salomon', lp_testi6Role: 'Kliyan BLICPay', lp_testi6Quote: 'Mwen renmen konsèp BLICPay a anpil.',
    lp_secEyebrow: 'SEKIRITE', lp_secTitle: 'Sekirize e fyab, *chak etap*.', lp_secSub: 'Nou pran pwoteksyon kont ou oserye, ak plizyè kouch verifikasyon pou chak aksyon ki enplike lajan.',
    lp_sec1t: 'Modpas Chifre', lp_sec1d: 'Chak kont pwoteje ak yon sistèm chifreman modèn.',
    lp_sec2t: 'Verifikasyon KYC', lp_sec2d: 'Idantite verifye pou plis limit ak sekirite.',
    lp_sec3t: 'Depo Egzamine', lp_sec3d: 'Chak depo revize anvan li konte nan balans ou.',
    lp_sec4t: 'Sipèvizyon Admin', lp_sec4d: 'Yon ekip veye sou operasyon sansib yo.',
    lp_faqEyebrow: 'FAQ', lp_faqTitle: 'Kesyon moun poze, *repons klè*.',
    lp_q1: 'Kisa BLICPay ye?', lp_a1: 'BLICPay se yon aplikasyon pou jere lajan w — depo, retrè, transfè, epay, ak sistèm sòl tradisyonèl la, tout nan yon sèl kote, sou telefòn oswa òdinatè w.',
    lp_q2: 'Kijan pou m kreye yon kont?', lp_a2: 'Klike sou "Kreye kont", antre non w, telefòn ou, ak yon modpas. Kont ou pare pou itilize imedyatman — ou ka verifye idantite w apre pou plis limit.',
    lp_q3: 'Ki jan pou m depoze lajan?', lp_a3: 'Ou ka depoze via MonCash, NatCash, USDT, Zelle, oswa dirèkteman nan yon biwo BLICPay. Chak depo verifye anvan li konte nan balans ou.',
    lp_q4: 'Kisa BLIC Sòl ye?', lp_a4: 'Se yon vèsyon dijital sistèm sòl tradisyonèl la — ou antre nan yon gwoup, chak moun kontribye regilyèman, epi chak moun resevwa tou li nan wotasyon an.',
    lp_q5: 'Èske lajan m an sekirite?', lp_a5: 'Chak kont pwoteje ak modpas ak yon sistèm otantifikasyon sekirize. Nou rekòmande verifye idantite w (KYC) pou plis pwoteksyon.',
    lp_ctaTitle: 'Sote etap bank tradisyonèl la, *pou tout bon*.', lp_ctaSub: 'Kreye kont ou gratis an mwens pase 2 minit.', lp_ctaBtn: 'Kreye kont mwen',
    lp_footDesc: 'Yon aplikasyon pou jere lajan w — depo, transfè, epay, prè ak sistèm sòl tradisyonèl la, tout nan yon sèl kote.',
    lp_footMadeIn: '🇭🇹 Fèt an Ayiti',
    lp_footProduits: 'Pwodwi', lp_footCompany: 'Konpayi', lp_footLegal: 'Legal',
    lp_footAbout: 'Apwopo nou', lp_footSupport: 'Sipò',
    lp_footTerms: 'Kondisyon Sèvis', lp_footPrivacy: 'Politik Konfidansyalite',
    lp_footRights: 'Tout dwa rezève.',
    lp_aboutBody: 'BLICPay se yon platfòm fentèk ki fèt an Ayiti pou Ayisyen. Nou senplifye jan moun jere lajan yo — depoze, retire, transfere, epay pou yon objektif, patisipe nan yon gwoup BLIC Sòl dijital, oswa mande yon ti prè — tout sa nan yon sèl aplikasyon senp, rapid, e sekirize. Misyon nou se fè sèvis finansye vin aksesib pou tout moun, kèlkeswa kote yo ye an Ayiti.',
    lp_supportBody: 'Ou gen yon kesyon oswa yon pwoblèm ak kont ou? Kontakte nou dirèkteman:',
    lp_termsBody: "1. Akseptasyon kondisyon yo\nAn kreye oswa itilize yon kont BLICPay, ou aksepte kondisyon sèvis sa yo.\n\n2. Kalifikasyon\nOu dwe gen omwen 18 an epi bay enfòmasyon egzat pou kreye yon kont.\n\n3. Responsabilite kont ou\nOu responsab pou konfidansyalite modpas ak kòd PIN ou. Kontakte nou imedyatman si ou sispèk yon aksè san otorizasyon.\n\n4. Frè\nSèten operasyon (retrè, entegrasyon Sòl) gen frè ki afiche klèman anvan ou konfime yo.\n\n5. Sèvis Sòl ak Prè\nBLICPay òganize men pa garanti pèfòmans gwoup Sòl yo — chak manm responsab kotizasyon pa li. Prè yo sipoze apwobasyon admin.\n\n6. Itilizasyon entèdi\nOu pa ka itilize BLICPay pou aktivite ilegal, fwod, oswa blanchi lajan.\n\n7. Sispansyon ak sitèminasyon\nBLICPay ka sispann oswa fèmen yon kont ki vyole kondisyon sa yo.\n\n8. Chanjman\nNou ka modifye kondisyon sa yo — n ap enfòme ou de chanjman enpòtan.",
    lp_privacyBody: "1. Enfòmasyon nou kolekte\nNon, telefòn, adrès, dokiman idantifikasyon (pou verifikasyon KYC), ak istorik tranzaksyon ou.\n\n2. Poukisa nou kolekte yo\nPou kreye ak jere kont ou, verifye idantite ou (obligasyon regilasyon), trete tranzaksyon, ak ofri sipò.\n\n3. Pataj enfòmasyon\nNou pa vann done ou. Nou ka pataje enfòmasyon ak otorite regilasyon si lalwa mande sa.\n\n4. Sekirite\nDone sansib yo (modpas, kòd PIN) chifre. Aksè entèn limite a pèsonèl otorize.\n\n5. Konsèvasyon\nNou kenbe done ou pandan kont ou aktif, ak pou yon peryòd apre fèmti pou obligasyon legal.\n\n6. Dwa ou\nOu ka mande wè oswa korije enfòmasyon ou genyen nan BLICPay — kontakte sipò pou sa.",
    lp_navFeatures: 'Fonksyonalite', lp_navSol: 'BLIC Sòl', lp_navHow: 'Kijan li mache', lp_navFaq: 'FAQ',
    lp_cardBadge: 'PWOCHÈNMAN', lp_cardTitle: 'Kat BLICPay ap vini', lp_cardSub: 'N ap travay sou yon patenarya pou ofri kat vityèl ak fizik — pou peye online ak nenpòt kote kat aksepte.',
    lp_trust1: 'Kont pwoteje', lp_trust2: 'Verifikasyon KYC', lp_trust3: 'Sipò rapid',
    lp_show1Title: 'Antre nan yon gwoup, *an kèk segond*.', lp_show1Sub: 'Chwazi nivo w, mande antre, epi swiv pwogrè gwoup ou an tan reyèl.',
    lp_show2Title: 'Chak alèt, *lamenm*.', lp_show2Sub: 'Depo, retrè, kotizasyon Sòl — resevwa chak alèt lamenm.',
    lp_footDisclaimer: 'BLICPay LLC se yon platfòm finansye rekonèt e anrejistre nan Ministè Kòmès ak Endistri Ayiti. Kesyon? Kontakte ekip sipò nou an.',
  },
  fr: {
    welcome: 'Bienvenue,',
    balanceLabel: 'SOLDE TOTAL',
    accountLabel: 'Compte BLICPay',
    navHome: 'Accueil', navHistory: 'Historique', navTransfer: 'Transfert', navSettings: 'Paramètres',
    tileDeposit: 'Dépôt', tileWithdraw: 'Retrait', tileTransfer: 'Transfert', tileReceive: 'Recevoir', myQr: 'Mon QR',
    tileSol: 'BLIC Sòl', tileDepo: 'BLIC Dépo', tileGoal: 'Dépôt Objectif', tileLoan: 'Prêt',
    lp_mockBalance: 'SOLDE DU COMPTE', lp_mockQuickAccess: 'ACCÈS RAPIDE', lp_mockGoalShort: 'Objectif',
    lp_mockRecentActivity: 'ACTIVITÉ RÉCENTE', lp_mockDepositMoncash: 'Dépôt MonCash', lp_mockSolContribution: 'Cotisation Sòl Basic #3',
    lp_mockWeeklyDesc: 'Chaque semaine · 1 000 HTG par personne', lp_mockBiweeklyDesc: 'Tous les 15 jours · 2 500 HTG', lp_mockRequestJoin: 'Demander à rejoindre',
    lp_cardTagline: '| GLOBAL | SÉCURISÉ | DIGITAL |', lp_cardHolder: 'CLIENT BLICPAY',
    recentTx: 'TRANSACTIONS RÉCENTES',
    loginTab: 'Connexion', registerTab: 'Créer un compte',
    fullNamePh: 'Nom complet', phonePh: 'Numéro de téléphone', passwordPh: 'Mot de passe',
    lastNamePh: 'Nom', firstNamePh: 'Prénom', emailPh: 'E-mail',
    addressPh: 'Adresse', cityPh: 'Ville', departmentPh: 'Département',
    countryPh: 'Pays',
    countries: ['Haïti'],
    loginBtn: 'Se connecter', registerBtn: 'Créer un compte', waitBtn: 'Patientez...',
    demoBtn: 'Voir la démo (sans backend)',
    langLabel: 'Langue',
    settingsTitle: 'Paramètres', accountSection: 'COMPTE', prefsSection: 'PRÉFÉRENCES',
    supportSection: 'ASSISTANCE', aboutSection: 'À PROPOS',
    editProfile: 'Modifier le profil', changePassword: 'Changer le mot de passe',
    hideBalanceDefault: 'Masquer le solde par défaut', contactSupport: 'Contacter le support', faq: 'Questions Fréquentes',
    saveBtn: 'Enregistrer',
    currentPasswordPh: 'Mot de passe actuel', newPasswordPh: 'Nouveau mot de passe', confirmNewPasswordPh: 'Confirmer le nouveau mot de passe',
    pwChangedMsg: 'Votre mot de passe a été changé.', errCurrentPassword: 'Entrez votre mot de passe actuel.',
    supportSubtitle: 'Nous sommes là pour vous aider. Choisissez comment nous contacter.',
    callUs: 'Nous appeler', chatWhatsapp: 'Discuter sur WhatsApp', emailUs: 'Envoyer un e-mail',
    sendMsgTitle: 'OU ENVOYER UN MESSAGE', subjectPh: 'Sujet', messagePh: 'Écrivez votre message...',
    sendBtn: 'Envoyer le message', supportSentMsg: 'Message envoyé — nous vous répondrons bientôt.',
    errSubject: 'Choisissez un sujet.', errMessage: 'Écrivez un message.',
    forgotPasswordLink: 'Mot de passe oublié ?', forgotTitle: 'Réinitialiser le mot de passe',
    forgotStep1Sub: 'Entrez le numéro de téléphone de votre compte pour recevoir un code.',
    sendCodeBtn: 'Envoyer le code', forgotStep2Sub: 'Entrez le code reçu, ainsi que votre nouveau mot de passe.',
    codePh: 'Code (6 chiffres)', resetPasswordBtn: 'Changer le mot de passe',
    resetSuccessMsg: 'Mot de passe changé — connectez-vous avec le nouveau.',
    errCode: 'Entrez le code.',
    historyTitle: 'Historique', filterAll: 'Tout', filterIn: 'Entrées', filterOut: 'Sorties',
    searchPh: 'Rechercher par nom...', noResults: 'Aucun résultat.',
    statusAll: 'Tous statuts', statusConfirmed: 'Confirmé', statusPending: 'En attente',
    dateFrom: 'Du', dateTo: 'Au', clearDates: 'Effacer les dates',
    logout: 'Déconnexion',
    noTx: 'Aucune transaction.',
    stepInfo: 'Informations personnelles', stepPassword: 'Mot de passe', stepTerms: 'Conditions',
    confirmPasswordPh: 'Confirmer le mot de passe', next: 'Continuer', back: 'Retour',
    termsText: "J'accepte les Conditions d'utilisation et la Politique de confidentialité de BLICPay.",
    createAccountBtn: 'Créer mon compte', reviewInfo: 'Vérifiez vos informations',
    errFullName: 'Entrez votre nom.', errPhone: 'Entrez un numéro de téléphone.',
    errPasswordShort: 'Le mot de passe doit contenir au moins 6 caractères.', errPasswordMatch: 'Les mots de passe ne correspondent pas.',
    errTerms: 'Vous devez accepter les conditions pour continuer.',
    lp_badge: 'Plateforme Finance Personnelle', lp_h1a: 'La Plateforme Moderne Pour', lp_h1b: 'Gérer Votre Argent.', lp_h1italic: 'Libérez votre argent.',
    lp_sub: 'Dépôt, retrait, transfert, prêt, épargne et le système sòl traditionnel — tout dans une seule application, où que vous soyez.',
    lp_start: 'Commencer maintenant', lp_login: 'Connexion', lp_signup: 'Créer un compte',
    lp_methods: 'Méthodes de dépôt prises en charge',
    cat_mobile: 'Mobile wallet', cat_bank: 'Banque', cat_other: 'Autres', cat_soon: 'Bientôt',
    chooseCatDeposit: 'Choisissez comment déposer', chooseCatWithdraw: 'Choisissez comment retirer',
    lp_stat1: 'groupes BLIC Sòl', lp_stat2: 'moyens de dépôt', lp_stat3: 'plans de prêt disponibles', lp_stat4: 'niveaux Sòl (Basic/Standard/Premium)',
    lp_featEyebrow: 'FONCTIONNALITÉS', lp_featTitle: 'Tout ce dont vous avez besoin, *en un seul endroit*.', lp_featSub: 'Une plateforme pour chaque aspect de votre argent — pour vous ou votre famille.',
    lp_f1t: 'Le système traditionnel, *devenu digital*.', lp_f1d: '90 groupes répartis en 3 niveaux (Basic, Standard, Premium) et 3 fréquences pour épargner en groupe.',
    lp_f2t: 'Un objectif, *toujours visible*.', lp_f2d: 'Fixez un objectif d\'épargne et suivez votre progression à chaque dépôt.',
    lp_f3t: 'Un prêt rapide, *sans tracas*.', lp_f3d: 'Demandez un prêt avec un plan de 3, 6 ou 12 mois, et des versements clairs à chaque échéance.',
    lp_f4t: 'Envoyez de l\'argent, *en secondes*.', lp_f4d: 'Envoyez de l\'argent directement à un autre client BLICPay avec son ID client.',
    lp_f5t: 'Organisez votre argent, *facilement*.', lp_f5d: 'Créez plusieurs "poches" pour organiser votre argent — Urgence, Voyage, etc.',
    lp_f6t: 'Vérifiez-vous, *une seule fois*.', lp_f6d: 'Vérifiez votre identité pour plus de sécurité et des limites plus élevées sur votre compte.',
    lp_howEyebrow: 'COMMENT ÇA MARCHE', lp_howTitle: 'Prêt, *en quelques minutes*.', lp_howSub: 'Trois étapes simples pour commencer à gérer votre argent.',
    lp_s1t: 'Créez votre compte', lp_s1d: 'Entrez votre nom, votre téléphone et un mot de passe. Cela prend moins de 2 minutes.',
    lp_s2t: 'Déposez de l\'argent', lp_s2d: 'Choisissez MonCash, NatCash, USDT, Zelle, ou un dépôt en agence pour approvisionner votre compte.',
    lp_s3t: 'Gérez votre argent', lp_s3d: 'Envoyez, recevez, épargnez, demandez un prêt, ou rejoignez un groupe BLIC Sòl — tout au même endroit.',
    lp_solEyebrow: 'BLIC SÒL', lp_solTitle: 'Choisissez le niveau, *à votre façon*.', lp_solSub: 'Trois niveaux, trois fréquences — choisissez ce qui vous convient.',
    lp_solNivo: 'Niveau', lp_solSemenn: 'Chaque semaine', lp_solKenzenn: 'Tous les 15 jours', lp_solMwa: 'Chaque mois',
    lp_solNote: 'Chaque groupe compte 10 places. Des frais de service de 2% s\'appliquent à chaque versement lorsqu\'un membre reçoit sa part.',
    lp_reachH1a: 'Accès', lp_reachH1b: 'Où Que Vous Soyez', lp_reachSub: 'Une seule application web, accessible sur téléphone et ordinateur, sans limite d\'horaire.',
    lp_reachStat1: '90', lp_reachLabel1: 'groupes BLIC Sòl',
    lp_reachStat2: '5', lp_reachLabel2: 'méthodes de dépôt',
    lp_reachStat3: '24/7', lp_reachLabel3: 'accès en ligne',
    lp_reachStat4: '3', lp_reachLabel4: 'langues disponibles',
    lp_testiEyebrow: 'TÉMOIGNAGES', lp_testiTitle: 'Conçu pour grandir, *approuvé par nos clients*.',
    lp_testiQuote: '[Le commentaire du client apparaîtra ici]', lp_testiName: '[Nom du client]', lp_testiRole: 'Client BLICPay',
    lp_testi1Name: 'Pierre', lp_testi1Role: 'Client BLICPay', lp_testi1Quote: "J'ai vraiment hâte de recevoir la carte internationale BLICPay ! L'application me facilite déjà beaucoup la vie.",
    lp_testi2Name: 'Joseph', lp_testi2Role: 'Client BLICPay', lp_testi2Quote: "J'adore l'application BLICPay — simple et rapide.",
    lp_testi3Name: 'Louidor', lp_testi3Role: 'Client BLICPay', lp_testi3Quote: "Une application que j'apprécie beaucoup, elle me simplifie vraiment la vie.",
    lp_testi4Name: 'Julienne', lp_testi4Role: 'Client BLICPay', lp_testi4Quote: "BLIC Depo m'aide à mettre de l'argent de côté pour mes objectifs — j'adore cette fonctionnalité.",
    lp_testi5Name: 'Martha', lp_testi5Role: 'Client BLICPay', lp_testi5Quote: "J'aime beaucoup le fonctionnement des groupes Sòl sur BLICPay — c'est facile à suivre.",
    lp_testi6Name: 'Salomon', lp_testi6Role: 'Client BLICPay', lp_testi6Quote: "J'aime beaucoup le concept de BLICPay.",
    lp_secEyebrow: 'SÉCURITÉ', lp_secTitle: 'Sécurisé et fiable, *à chaque étape*.', lp_secSub: 'Nous prenons la protection de votre compte au sérieux, avec plusieurs niveaux de vérification pour chaque action impliquant de l\'argent.',
    lp_sec1t: 'Mot de passe chiffré', lp_sec1d: 'Chaque compte est protégé par un système de chiffrement moderne.',
    lp_sec2t: 'Vérification KYC', lp_sec2d: 'Identité vérifiée pour plus de limites et de sécurité.',
    lp_sec3t: 'Dépôts examinés', lp_sec3d: 'Chaque dépôt est vérifié avant d\'être crédité.',
    lp_sec4t: 'Supervision admin', lp_sec4d: 'Une équipe surveille les opérations sensibles.',
    lp_faqEyebrow: 'FAQ', lp_faqTitle: 'Questions posées, *réponses claires*.',
    lp_q1: 'Qu\'est-ce que BLICPay ?', lp_a1: 'BLICPay est une application pour gérer votre argent — dépôt, retrait, transfert, épargne, et le système sòl traditionnel, tout en un seul endroit, sur téléphone ou ordinateur.',
    lp_q2: 'Comment créer un compte ?', lp_a2: 'Cliquez sur "Créer un compte", entrez votre nom, votre téléphone et un mot de passe. Votre compte est prêt immédiatement — vous pouvez vérifier votre identité ensuite pour plus de limites.',
    lp_q3: 'Comment déposer de l\'argent ?', lp_a3: 'Vous pouvez déposer via MonCash, NatCash, USDT, Zelle, ou directement dans une agence BLICPay. Chaque dépôt est vérifié avant d\'être crédité.',
    lp_q4: 'Qu\'est-ce que BLIC Sòl ?', lp_a4: 'C\'est une version numérique du système sòl traditionnel — vous rejoignez un groupe, chacun contribue régulièrement, et chacun reçoit sa part à tour de rôle.',
    lp_q5: 'Mon argent est-il en sécurité ?', lp_a5: 'Chaque compte est protégé par un mot de passe et un système d\'authentification sécurisé. Nous recommandons de vérifier votre identité (KYC) pour plus de protection.',
    lp_ctaTitle: 'Sautez l\'étape de la banque traditionnelle, *pour de bon*.', lp_ctaSub: 'Créez votre compte gratuitement en moins de 2 minutes.', lp_ctaBtn: 'Créer mon compte',
    lp_footDesc: 'Une application pour gérer votre argent — dépôt, transfert, épargne, prêt et le système sòl traditionnel, tout en un seul endroit.',
    lp_footMadeIn: '🇭🇹 Fait en Haïti',
    lp_footProduits: 'Produits', lp_footCompany: 'Entreprise', lp_footLegal: 'Légal',
    lp_footAbout: 'À propos', lp_footSupport: 'Support',
    lp_footTerms: 'Conditions d\'utilisation', lp_footPrivacy: 'Politique de confidentialité',
    lp_footRights: 'Tous droits réservés.',
    lp_aboutBody: "BLICPay est une plateforme fintech conçue en Haïti pour les Haïtiens. Nous simplifions la gestion de l'argent — déposer, retirer, transférer, épargner pour un objectif, participer à un groupe BLIC Sòl numérique, ou demander un petit prêt — tout cela dans une seule application simple, rapide et sécurisée. Notre mission est de rendre les services financiers accessibles à tous, partout en Haïti.",
    lp_supportBody: 'Une question ou un problème avec votre compte ? Contactez-nous directement :',
    lp_termsBody: "1. Acceptation des conditions\nEn créant ou en utilisant un compte BLICPay, vous acceptez ces conditions de service.\n\n2. Éligibilité\nVous devez avoir au moins 18 ans et fournir des informations exactes pour créer un compte.\n\n3. Responsabilité du compte\nVous êtes responsable de la confidentialité de votre mot de passe et de votre code PIN. Contactez-nous immédiatement si vous soupçonnez un accès non autorisé.\n\n4. Frais\nCertaines opérations (retraits, intégration Sòl) comportent des frais clairement affichés avant confirmation.\n\n5. Services Sòl et Prêt\nBLICPay organise mais ne garantit pas la performance des groupes Sòl — chaque membre est responsable de sa propre cotisation. Les prêts sont soumis à l'approbation d'un administrateur.\n\n6. Utilisation interdite\nVous ne pouvez pas utiliser BLICPay pour des activités illégales, frauduleuses ou de blanchiment d'argent.\n\n7. Suspension et résiliation\nBLICPay peut suspendre ou fermer un compte qui viole ces conditions.\n\n8. Modifications\nNous pouvons modifier ces conditions — nous vous informerons de tout changement important.",
    lp_privacyBody: "1. Informations que nous collectons\nNom, téléphone, adresse, documents d'identité (pour la vérification KYC), et historique de vos transactions.\n\n2. Pourquoi nous les collectons\nPour créer et gérer votre compte, vérifier votre identité (obligation réglementaire), traiter les transactions, et offrir un support.\n\n3. Partage des informations\nNous ne vendons pas vos données. Nous pouvons partager des informations avec les autorités réglementaires si la loi l'exige.\n\n4. Sécurité\nLes données sensibles (mot de passe, code PIN) sont chiffrées. L'accès interne est limité au personnel autorisé.\n\n5. Conservation\nNous conservons vos données tant que votre compte est actif, et pour une période après sa fermeture pour des obligations légales.\n\n6. Vos droits\nVous pouvez demander à consulter ou corriger les informations que BLICPay détient sur vous — contactez le support pour cela.",
    lp_navFeatures: 'Fonctionnalités', lp_navSol: 'BLIC Sòl', lp_navHow: 'Comment ça marche', lp_navFaq: 'FAQ',
    lp_cardBadge: 'À VENIR', lp_cardTitle: 'La carte BLICPay arrive', lp_cardSub: 'Nous travaillons sur un partenariat pour offrir des cartes virtuelles et physiques — pour payer en ligne et partout où les cartes sont acceptées.',
    lp_trust1: 'Compte protégé', lp_trust2: 'Vérification KYC', lp_trust3: 'Support rapide',
    lp_show1Title: 'Rejoignez un groupe, *en quelques secondes*.', lp_show1Sub: 'Choisissez votre niveau, demandez à rejoindre, et suivez la progression du groupe en temps réel.',
    lp_show2Title: 'Chaque alerte, *à l\'instant*.', lp_show2Sub: 'Dépôt, retrait, cotisation Sòl — recevez chaque alerte immédiatement.',
    lp_footDisclaimer: 'BLICPay LLC est une plateforme financière reconnue et enregistrée auprès du Ministère du Commerce et de l\'Industrie d\'Haïti. Des questions ? Contactez notre équipe de support.',
  },
  en: {
    welcome: 'Welcome,',
    balanceLabel: 'TOTAL BALANCE',
    accountLabel: 'BLICPay Account',
    navHome: 'Home', navHistory: 'History', navTransfer: 'Transfer', navSettings: 'Settings',
    tileDeposit: 'Deposit', tileWithdraw: 'Withdraw', tileTransfer: 'Transfer', tileReceive: 'Receive', myQr: 'My QR',
    tileSol: 'BLIC Sòl', tileDepo: 'BLIC Depo', tileGoal: 'Goal Deposit', tileLoan: 'Loan',
    lp_mockBalance: 'ACCOUNT BALANCE', lp_mockQuickAccess: 'QUICK ACCESS', lp_mockGoalShort: 'Goal',
    lp_mockRecentActivity: 'RECENT ACTIVITY', lp_mockDepositMoncash: 'MonCash deposit', lp_mockSolContribution: 'Sòl Basic #3 contribution',
    lp_mockWeeklyDesc: 'Weekly · 1,000 HTG per person', lp_mockBiweeklyDesc: 'Every 15 days · 2,500 HTG', lp_mockRequestJoin: 'Request to join',
    lp_cardTagline: '| GLOBAL | SECURE | DIGITAL |', lp_cardHolder: 'BLICPAY CUSTOMER',
    recentTx: 'RECENT TRANSACTIONS',
    loginTab: 'Log In', registerTab: 'Sign Up',
    fullNamePh: 'Full name', phonePh: 'Phone number', passwordPh: 'Password',
    lastNamePh: 'Last name', firstNamePh: 'First name', emailPh: 'Email',
    addressPh: 'Address', cityPh: 'City', departmentPh: 'Department',
    countryPh: 'Country',
    countries: ['Haiti'],
    loginBtn: 'Log In', registerBtn: 'Sign Up', waitBtn: 'Please wait...',
    demoBtn: 'View demo (no backend)',
    langLabel: 'Language',
    settingsTitle: 'Settings', accountSection: 'ACCOUNT', prefsSection: 'PREFERENCES',
    supportSection: 'SUPPORT', aboutSection: 'ABOUT',
    editProfile: 'Edit profile', changePassword: 'Change password',
    hideBalanceDefault: 'Hide balance by default', contactSupport: 'Contact support', faq: 'FAQ',
    saveBtn: 'Save',
    currentPasswordPh: 'Current password', newPasswordPh: 'New password', confirmNewPasswordPh: 'Confirm new password',
    pwChangedMsg: 'Your password has been changed.', errCurrentPassword: 'Enter your current password.',
    supportSubtitle: "We're here to help. Choose how you'd like to reach us.",
    callUs: 'Call us', chatWhatsapp: 'Chat on WhatsApp', emailUs: 'Email us',
    sendMsgTitle: 'OR SEND A MESSAGE', subjectPh: 'Subject', messagePh: 'Write your message...',
    sendBtn: 'Send message', supportSentMsg: "Message sent — we'll get back to you soon.",
    errSubject: 'Choose a subject.', errMessage: 'Write a message.',
    forgotPasswordLink: 'Forgot password?', forgotTitle: 'Reset password',
    forgotStep1Sub: 'Enter your account phone number to receive a code.',
    sendCodeBtn: 'Send code', forgotStep2Sub: 'Enter the code you received, along with your new password.',
    codePh: 'Code (6 digits)', resetPasswordBtn: 'Change password',
    resetSuccessMsg: 'Password changed — log in with the new one.',
    errCode: 'Enter the code.',
    historyTitle: 'History', filterAll: 'All', filterIn: 'In', filterOut: 'Out',
    searchPh: 'Search by name...', noResults: 'No results.',
    statusAll: 'All statuses', statusConfirmed: 'Confirmed', statusPending: 'Pending',
    dateFrom: 'From', dateTo: 'To', clearDates: 'Clear dates',
    logout: 'Log out',
    noTx: 'No transactions.',
    stepInfo: 'Personal information', stepPassword: 'Password', stepTerms: 'Terms',
    confirmPasswordPh: 'Confirm password', next: 'Continue', back: 'Back',
    termsText: "I accept BLICPay's Terms of Service and Privacy Policy.",
    createAccountBtn: 'Create my account', reviewInfo: 'Review your information',
    errFullName: 'Enter your name.', errPhone: 'Enter a phone number.',
    errPasswordShort: 'Password must be at least 6 characters.', errPasswordMatch: 'Passwords do not match.',
    errTerms: 'You must accept the terms to continue.',
    lp_badge: 'Personal Finance Platform', lp_h1a: 'The Modern Platform For', lp_h1b: 'Managing Your Money.', lp_h1italic: 'Free your money.',
    lp_sub: 'Deposits, withdrawals, transfers, loans, savings, and the traditional sòl system — all in one app, wherever you are.',
    lp_start: 'Get started now', lp_login: 'Log in', lp_signup: 'Sign up',
    lp_methods: 'Supported Deposit Methods',
    cat_mobile: 'Mobile wallet', cat_bank: 'Bank', cat_other: 'Other', cat_soon: 'Soon',
    chooseCatDeposit: 'Choose how to deposit', chooseCatWithdraw: 'Choose how to withdraw',
    lp_stat1: 'BLIC Sòl groups', lp_stat2: 'deposit methods', lp_stat3: 'loan plans available', lp_stat4: 'Sòl tiers (Basic/Standard/Premium)',
    lp_featEyebrow: 'FEATURES', lp_featTitle: 'Everything you need, *all in one place*.', lp_featSub: 'A platform for every part of your money — for you or your family.',
    lp_f1t: 'The traditional system, *now digital*.', lp_f1d: '90 groups across 3 tiers (Basic, Standard, Premium) and 3 frequencies to save together.',
    lp_f2t: 'One goal, *always visible*.', lp_f2d: 'Set a savings target and track your progress every time you deposit.',
    lp_f3t: 'A fast loan, *no hassle*.', lp_f3d: 'Request a loan with a 3, 6, or 12-month plan, with clear installments each period.',
    lp_f4t: 'Send money, *in seconds*.', lp_f4d: 'Send money directly to another BLICPay customer using their client ID.',
    lp_f5t: 'Organize your money, *easily*.', lp_f5d: 'Create multiple "pockets" to organize your money — Emergency, Travel, and more.',
    lp_f6t: 'Verify once, *use everywhere*.', lp_f6d: 'Verify your identity for more security and higher limits on your account.',
    lp_howEyebrow: 'HOW IT WORKS', lp_howTitle: 'Ready, *in minutes*.', lp_howSub: 'Three simple steps to start managing your money.',
    lp_s1t: 'Create your account', lp_s1d: 'Enter your name, phone number, and a password. It takes less than 2 minutes.',
    lp_s2t: 'Deposit money', lp_s2d: 'Choose MonCash, NatCash, USDT, Zelle, or an in-branch deposit to fund your account.',
    lp_s3t: 'Manage your money', lp_s3d: 'Send, receive, save, request a loan, or join a BLIC Sòl group — all in one place.',
    lp_solEyebrow: 'BLIC SÒL', lp_solTitle: 'Choose your tier, *your way*.', lp_solSub: 'Three tiers, three frequencies — choose what works for you.',
    lp_solNivo: 'Tier', lp_solSemenn: 'Weekly', lp_solKenzenn: 'Every 15 days', lp_solMwa: 'Monthly',
    lp_solNote: 'Each group has 10 spots. A 2% service fee applies to each payout when a member receives their share.',
    lp_reachH1a: 'Access', lp_reachH1b: 'Wherever You Are', lp_reachSub: 'A single web app, accessible on phone and computer, with no time limits.',
    lp_reachStat1: '90', lp_reachLabel1: 'BLIC Sòl groups',
    lp_reachStat2: '5', lp_reachLabel2: 'deposit methods',
    lp_reachStat3: '24/7', lp_reachLabel3: 'online access',
    lp_reachStat4: '3', lp_reachLabel4: 'languages available',
    lp_testiEyebrow: 'TESTIMONIALS', lp_testiTitle: 'Built to grow, *proven by customers*.',
    lp_testiQuote: '[Customer comment will appear here]', lp_testiName: '[Customer Name]', lp_testiRole: 'BLICPay Customer',
    lp_testi1Name: 'Pierre', lp_testi1Role: 'BLICPay Customer', lp_testi1Quote: "I can't wait to get my hands on the BLICPay international card — the app already makes my life so much easier.",
    lp_testi2Name: 'Joseph', lp_testi2Role: 'BLICPay Customer', lp_testi2Quote: 'I love the BLICPay app — simple and fast.',
    lp_testi3Name: 'Louidor', lp_testi3Role: 'BLICPay Customer', lp_testi3Quote: 'An app I really enjoy using, it makes everything so much easier.',
    lp_testi4Name: 'Julienne', lp_testi4Role: 'BLICPay Customer', lp_testi4Quote: 'BLIC Depo helps me set money aside for my goals — I love this feature.',
    lp_testi5Name: 'Martha', lp_testi5Role: 'BLICPay Customer', lp_testi5Quote: 'I really like how the Sòl groups work on BLICPay — easy to keep track of.',
    lp_testi6Name: 'Salomon', lp_testi6Role: 'BLICPay Customer', lp_testi6Quote: 'I really like the concept behind BLICPay.',
    lp_secEyebrow: 'SECURITY', lp_secTitle: 'Secure and reliable, *every step*.', lp_secSub: 'We take protecting your account seriously, with multiple layers of verification for every money-related action.',
    lp_sec1t: 'Encrypted Password', lp_sec1d: 'Every account is protected with modern encryption.',
    lp_sec2t: 'KYC Verification', lp_sec2d: 'Verified identity for higher limits and more security.',
    lp_sec3t: 'Reviewed Deposits', lp_sec3d: 'Every deposit is reviewed before it counts toward your balance.',
    lp_sec4t: 'Admin Oversight', lp_sec4d: 'A team monitors sensitive operations.',
    lp_faqEyebrow: 'FAQ', lp_faqTitle: 'Questions asked, *answers made clear*.',
    lp_q1: 'What is BLICPay?', lp_a1: 'BLICPay is an app for managing your money — deposits, withdrawals, transfers, savings, and the traditional sòl system, all in one place, on your phone or computer.',
    lp_q2: 'How do I create an account?', lp_a2: 'Click "Sign up", enter your name, phone number, and a password. Your account is ready to use immediately — you can verify your identity afterward for higher limits.',
    lp_q3: 'How do I deposit money?', lp_a3: 'You can deposit via MonCash, NatCash, USDT, Zelle, or directly at a BLICPay branch. Every deposit is verified before it counts toward your balance.',
    lp_q4: 'What is BLIC Sòl?', lp_a4: 'It\'s a digital version of the traditional sòl system — you join a group, everyone contributes regularly, and each member receives their payout in turn.',
    lp_q5: 'Is my money safe?', lp_a5: 'Every account is protected by a password and a secure authentication system. We recommend verifying your identity (KYC) for additional protection.',
    lp_ctaTitle: 'Skip the traditional bank, *for good*.', lp_ctaSub: 'Create your account for free in less than 2 minutes.', lp_ctaBtn: 'Create my account',
    lp_footDesc: 'An app for managing your money — deposits, transfers, savings, loans, and the traditional sòl system, all in one place.',
    lp_footMadeIn: '🇭🇹 Made in Haiti',
    lp_footProduits: 'Products', lp_footCompany: 'Company', lp_footLegal: 'Legal',
    lp_footAbout: 'About us', lp_footSupport: 'Support',
    lp_footTerms: 'Terms of Service', lp_footPrivacy: 'Privacy Policy',
    lp_footRights: 'All rights reserved.',
    lp_aboutBody: "BLICPay is a fintech platform built in Haiti, for Haitians. We simplify how people manage money — deposit, withdraw, transfer, save toward a goal, join a digital BLIC Sòl group, or request a small loan — all in one simple, fast, and secure app. Our mission is to make financial services accessible to everyone, everywhere in Haiti.",
    lp_supportBody: "Have a question or an issue with your account? Contact us directly:",
    lp_termsBody: "1. Acceptance of Terms\nBy creating or using a BLICPay account, you agree to these terms of service.\n\n2. Eligibility\nYou must be at least 18 years old and provide accurate information to create an account.\n\n3. Account Responsibility\nYou are responsible for keeping your password and PIN code confidential. Contact us immediately if you suspect unauthorized access.\n\n4. Fees\nCertain operations (withdrawals, Sòl integration) carry fees that are clearly shown before you confirm them.\n\n5. Sòl and Loan Services\nBLICPay organizes but does not guarantee the performance of Sòl groups — each member is responsible for their own contribution. Loans are subject to admin approval.\n\n6. Prohibited Use\nYou may not use BLICPay for illegal activity, fraud, or money laundering.\n\n7. Suspension and Termination\nBLICPay may suspend or close an account that violates these terms.\n\n8. Changes\nWe may update these terms — we will notify you of any significant changes.",
    lp_privacyBody: "1. Information We Collect\nName, phone number, address, identification documents (for KYC verification), and your transaction history.\n\n2. Why We Collect It\nTo create and manage your account, verify your identity (a regulatory requirement), process transactions, and provide support.\n\n3. Information Sharing\nWe do not sell your data. We may share information with regulatory authorities where required by law.\n\n4. Security\nSensitive data (password, PIN code) is encrypted. Internal access is limited to authorized personnel.\n\n5. Retention\nWe keep your data while your account is active, and for a period afterward to meet legal obligations.\n\n6. Your Rights\nYou can ask to view or correct the information BLICPay holds about you — contact support for that.",
    lp_navFeatures: 'Features', lp_navSol: 'BLIC Sòl', lp_navHow: 'How it works', lp_navFaq: 'FAQ',
    lp_cardBadge: 'COMING SOON', lp_cardTitle: 'The BLICPay Card is coming', lp_cardSub: 'We\'re working on a partnership to offer virtual and physical cards — for online payments and anywhere cards are accepted.',
    lp_trust1: 'Protected account', lp_trust2: 'KYC verification', lp_trust3: 'Fast support',
    lp_show1Title: 'Join a group, *in seconds*.', lp_show1Sub: 'Choose your tier, request to join, and track your group\'s progress in real time.',
    lp_show2Title: 'Every alert, *instantly*.', lp_show2Sub: 'Deposits, withdrawals, Sòl payments — get every alert right away.',
    lp_footDisclaimer: 'BLICPay LLC is a financial platform recognized and registered with the Haitian Ministry of Commerce and Industry. Questions? Contact our support team.',
  },
};

// 3 tier (Basic/Standard/Premium) × 3 frekans (semenn/15 jou/mwa) × 10 sòl chak, tout vid pou kòmanse.
const SOL_TIERS = [
  { id: 'basic', name: 'Basic' },
  { id: 'standard', name: 'Standard' },
  { id: 'premium', name: 'Premium' },
];

const SOL_FREQUENCIES = [
  { id: 'semenn', label: 'Chak semenn', amounts: { basic: 1000, standard: 2500, premium: 5000 } },
  { id: 'kenzenn', label: 'Chak 15 jou', amounts: { basic: 4000, standard: 8000, premium: 10000 } },
  { id: 'mwa', label: 'Chak mwa', amounts: { basic: 10000, standard: 15000, premium: 20000 } },
];

function generateSolGroups() {
  const groups = [];
  SOL_FREQUENCIES.forEach((freq) => {
    SOL_TIERS.forEach((tier) => {
      for (let i = 1; i <= 10; i++) {
        groups.push({
          id: `${freq.id}-${tier.id}-${i}`,
          tierId: tier.id,
          tier: tier.name,
          frequencyId: freq.id,
          frequency: freq.label,
          name: `Sòl ${tier.name} #${i}`,
          order: i,
          amount: freq.amounts[tier.id],
          maxMembers: 10,
          cycle: 1,
          currentTurn: 0,
          myPayments: [],
          members: [],
        });
      }
    });
  });
  return groups;
}
// Yon Sòl fèmen pou nouvo manm toutotan tout Sòl anvan l (menm nivo, menm frekans) poko konplè.
function isSolGroupOpen(allGroups, group) {
  if (group.members.length >= group.maxMembers) return false;
  return allGroups
    .filter((g) => g.tierId === group.tierId && g.frequencyId === group.frequencyId && g.order < group.order)
    .every((g) => g.members.length >= g.maxMembers);
}
const initialSolGroups = generateSolGroups();

function money(n) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' HTG';
}
function initials(name) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}
function getClientId(u) {
  if (!u) return '—';
  if (u.clientId) return u.clientId;
  const raw = (u.id || u.phone || '000000').toString().replace(/\D/g, '');
  return 'BP-' + (raw.slice(-6) || '000000').padStart(6, '0');
}

function nowLabel() {
  return new Date().toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}
// Mwa sikl an kou a — tout sòl yo senkronize sou menm mwa a nan demo a.
const CURRENT_CYCLE_MONTH = 'Out 2026';
const MONTHS_HT = ['Janvye', 'Fevriye', 'Mas', 'Avril', 'Me', 'Jen', 'Jiyè', 'Out', 'Septanm', 'Oktòb', 'Novanm', 'Desanm'];

function addMonths(monthLabel, offset) {
  const [name, yearStr] = monthLabel.split(' ');
  let idx = MONTHS_HT.indexOf(name) + offset;
  let year = parseInt(yearStr, 10) + Math.floor(idx / 12);
  idx = ((idx % 12) + 12) % 12;
  return `${MONTHS_HT[idx]} ${year}`;
}

// Chak manm gen pwòp mwa pa yo dapre pozisyon yo nan wotasyon an.
function memberPayoutMonth(group, memberIndex) {
  return addMonths(CURRENT_CYCLE_MONTH, memberIndex - group.currentTurn);
}

// Vèsyon jeneral pou sòl ki gen frekans semenn / 15 jou / mwa (pa itilize CURRENT_CYCLE_MONTH,
// li baze sou dat reyèl jodi a paske sòl yo kounye a kòmanse vid e ranpli nan tan reyèl).
function addPeriod(date, frequencyId, offset) {
  const d = new Date(date);
  if (frequencyId === 'semenn') d.setDate(d.getDate() + 7 * offset);
  else if (frequencyId === 'kenzenn') d.setDate(d.getDate() + 15 * offset);
  else d.setMonth(d.getMonth() + offset);
  return d;
}
function periodLabel(date, frequencyId) {
  if (frequencyId === 'mwa') return `${MONTHS_HT[date.getMonth()]} ${date.getFullYear()}`;
  return `${date.getDate()} ${MONTHS_HT[date.getMonth()]}`;
}
function memberPayoutPeriod(group, memberIndex) {
  const offset = memberIndex - group.currentTurn;
  if (group.frequencyId === 'semenn') {
    // Kotizasyon yo fèt vandredi; lajan an vèse bay moun k ap resevwa a Lendi apre a.
    const friday = new Date(currentPeriodKey('semenn'));
    friday.setDate(friday.getDate() + 7 * offset + 3);
    return `Lendi ${friday.getDate()} ${MONTHS_HT[friday.getMonth()]}`;
  }
  return periodLabel(addPeriod(new Date(), group.frequencyId, offset), group.frequencyId);
}
// Frè sèvis BLICPay pran sou chak vèsman — 2% sou total pòch la, prelve lè yon moun resevwa tou li.
const SOL_FEE_RATE = 0.02;
function solPayoutAmounts(group) {
  const gross = group.amount * group.maxMembers;
  const fee = Math.round(gross * SOL_FEE_RATE);
  return { gross, fee, net: gross - fee };
}
function isSolPaymentWindowOpen(frequencyId) {
  const now = new Date();
  const day = now.getDate();
  if (frequencyId === 'semenn') return now.getDay() === 5; // vandredi sèlman — se obligatwa
  if (frequencyId === 'kenzenn') return (day >= 13 && day <= 15) || day >= 28;
  return day >= 25 && day <= 28;
}
function solWindowMessage(frequencyId) {
  if (frequencyId === 'semenn') return 'Pèman semèn nan dwe fèt obligatwa nan Vandredi.';
  if (frequencyId === 'kenzenn') return 'Peman yo fèt ant 13-15 oswa apre 28 chak 15 jou.';
  return 'Peman yo fèt ant 25 ak 28 chak mwa.';
}

// Idantifyan peryòd aktyèl la, pou nou ka swiv kiyès ki peye pou peryòd sa a.
// Pou "semenn", peryòd la chanje chak vandredi (dat vandredi ki pi pre a sèvi kòm kle a).
function currentPeriodKey(frequencyId) {
  const now = new Date();
  if (frequencyId === 'mwa') return `${now.getFullYear()}-${now.getMonth()}`;
  if (frequencyId === 'kenzenn') return `${now.getFullYear()}-${now.getMonth()}-${now.getDate() <= 15 ? 'A' : 'B'}`;
  const d = new Date(now);
  const day = d.getDay();
  const diffToFriday = day >= 5 ? day - 5 : day + 2;
  d.setDate(d.getDate() - diffToFriday);
  return d.toISOString().slice(0, 10);
}
function hasMemberPaid(member, frequencyId) {
  return member?.lastPaidPeriod === currentPeriodKey(frequencyId);
}

function Logo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="shieldGrad" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor={C.navy} />
          <stop offset="100%" stopColor={C.sky} />
        </linearGradient>
      </defs>
      <path d="M24 3 L42 10 V22 C42 33 34.5 41.5 24 45 C13.5 41.5 6 33 6 22 V10 Z" fill="url(#shieldGrad)" />
      <rect x="17" y="18" width="9" height="9" rx="2" fill="none" stroke="#fff" strokeWidth="2" />
      <path d="M13 30 L33 15" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <path d="M27 15 H33 V21" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// Roa sikilè ki montre pwogrè wotasyon an — ANONIM: pa gen non pèsonn ki
// parèt, sèlman nimewo pozisyon yo, konsistan ak chwa konfidansyalite
// backend lan deja fè (chak kliyan sèlman ka wè pwòp adezyon pa li).
// `myTurnIndex` sèlman itilize pou make PWÒP pozisyon kliyan an — pa gen
// okenn lòt done sou lòt manm yo.
function SolWheel({ maxMembers, currentTurn, myTurnIndex, potAmount }) {
  const n = maxMembers;
  const size = 260;
  const cx = size / 2, cy = size / 2, r = 96;
  return (
    <div style={{ position: 'relative', width: size, height: size }} className="mx-auto">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <defs>
          <linearGradient id="turnGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={C.navy} />
            <stop offset="100%" stopColor={C.sky} />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.border} strokeWidth="1.5" strokeDasharray="2 6" />
        {Array.from({ length: n }, (_, i) => {
          const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          const isTurn = i === currentTurn;
          const hasReceived = i < currentTurn;
          const isMine = i === myTurnIndex;
          return (
            <g key={i}>
              {isTurn && (
                <circle cx={x} cy={y} r="23" fill="none" stroke={C.sky} strokeWidth="1.5" opacity="0.5">
                  <animate attributeName="r" values="19;26;19" dur="2.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;0.05;0.5" dur="2.4s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                cx={x} cy={y} r="18"
                fill={isTurn ? 'url(#turnGrad)' : hasReceived ? '#E4F5EF' : C.card}
                stroke={isMine ? C.gold : isTurn ? 'transparent' : hasReceived ? C.mint : C.border}
                strokeWidth={isMine ? 2.5 : 1}
              />
              <text x={x} y={y + 4} textAnchor="middle" fontSize="10.5" fontWeight="600"
                fill={isTurn ? '#fff' : hasReceived ? C.mint : C.ink} style={{ fontFamily: 'Inter, sans-serif' }}>
                {i + 1}
              </text>
              {hasReceived && (
                <g transform={`translate(${x + 11}, ${y - 11})`}>
                  <circle r="7" fill={C.mint} stroke="#fff" strokeWidth="1.5" />
                  <path d="M -3 0 L -1 2.2 L 3.2 -2.5" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              )}
            </g>
          );
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="9.5" fill={C.muted} style={{ fontFamily: 'Inter, sans-serif' }}>
          {tt("POT LA VO")}
        </text>
        <text x={cx} y={cy + 13} textAnchor="middle" fontSize="15" fontWeight="700" fill={C.ink} style={fontMono}>
          {(potAmount || 0).toLocaleString('fr-FR')}
        </text>
      </svg>
      {myTurnIndex != null && (
        <div className="flex items-center justify-center gap-1.5" style={{ marginTop: 6 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', border: `2px solid ${C.gold}`, display: 'inline-block' }} />
          <span className="text-xs" style={{ color: C.muted }}>{tt("Sa se pozisyon OU — lòt sèk yo anonim")}</span>
        </div>
      )}
    </div>
  );
}

function Badge({ children, tone = 'muted' }) {
  const map = {
    muted: { bg: '#EEF1F6', fg: C.muted },
    mint: { bg: '#E4F5EF', fg: C.mint },
    amber: { bg: '#FBF0DE', fg: '#946115' },
    navy: { bg: '#E6F0FB', fg: C.navy },
    premium: { bg: '#F4EBFF', fg: '#6D3FD1' },
    danger: { bg: '#FBEAEA', fg: C.danger },
  };
  const s = map[tone];
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: s.bg, color: s.fg }}>
      {children}
    </span>
  );
}

// Hook senp ki fè yon eleman "parèt" ak yon ti animasyon lè li antre nan ekran an pandan defile.
function useReveal() {
  const ref = React.useRef(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

// Rann yon tit ki gen *mo* ant zetwal an italik, pou estil kout ak aksan.
function EmphTitle({ text, style }) {
  const parts = text.split(/\*(.+?)\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? <em key={i} style={{ fontStyle: 'italic', ...style }}>{part}</em> : part
      )}
    </>
  );
}

function Reveal({ children, delay = 0, className = '' }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0) scale(1)' : 'translateY(32px) scale(0.97)',
      transition: `opacity .8s ease ${delay}ms, transform .8s cubic-bezier(.16,1,.3,1) ${delay}ms`,
      willChange: 'opacity, transform',
    }}>
      {children}
    </div>
  );
}

// Chif ki konte pou rive nan valè final li lè seksyon an vizib.
function CountUp({ target, suffix = '' }) {
  const [ref, visible] = useReveal();
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    if (!visible) return;
    const num = Number(target);
    const duration = 900;
    const start = performance.now();
    let raf;
    function tick(now) {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(num * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, target]);
  return <span ref={ref}>{val}{suffix}</span>;
}

function LandingPage({ onStart, lang, setLang, tr }) {
  const [openFaq, setOpenFaq] = useState(null);
  const [footerModal, setFooterModal] = useState(null); // null | 'about' | 'support' | 'terms' | 'privacy'
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const FEATURES = [
    { icon: Users, title: tr('lp_f1t'), desc: tr('lp_f1d'), fillable: true, accent: C.amber, bg: '#FBF0DE' },
    { icon: PiggyBank, title: tr('lp_f2t'), desc: tr('lp_f2d'), fillable: true, accent: C.mint, bg: '#E4F5EF' },
    { icon: HandCoins, title: tr('lp_f3t'), desc: tr('lp_f3d'), fillable: true, accent: C.navy, bg: '#E6F0FB' },
    { icon: ArrowLeftRight, title: tr('lp_f4t'), desc: tr('lp_f4d'), fillable: false, accent: C.sky, bg: '#E6F0FB' },
    { icon: Wallet, title: tr('lp_f5t'), desc: tr('lp_f5d'), fillable: true, accent: '#6D3FD1', bg: '#F4EBFF' },
    { icon: ShieldCheck, title: tr('lp_f6t'), desc: tr('lp_f6d'), fillable: true, accent: C.mint, bg: '#E4F5EF' },
  ];
  const [F0Icon, F1Icon, F2Icon, F3Icon, F4Icon, F5Icon] = FEATURES.map((f) => f.icon);

  const DEPOSIT_METHODS = [
    { name: 'MonCash', color: '#E4032E', logo: '/logos/moncash-wide.png' },
    { name: 'NatCash', color: '#0072BC', logo: '/logos/natcash-wide.png' },
    { name: 'USDT', color: '#26A17B', logo: '/logos/usdt-wide.png' },
    { name: 'Zelle', color: '#6D1ED4', logo: '/logos/zelle-wide.png' },
    { name: 'Depo Biwo', color: C.navy, logo: null },
  ];

  const FAQS = [
    { q: tr('lp_q1'), a: tr('lp_a1') },
    { q: tr('lp_q2'), a: tr('lp_a2') },
    { q: tr('lp_q3'), a: tr('lp_a3') },
    { q: tr('lp_q4'), a: tr('lp_a4') },
    { q: tr('lp_q5'), a: tr('lp_a5') },
  ];

  const currentLang = LANGS.find((l) => l.code === lang) || LANGS[1];

  return (
    <div style={{ background: '#FFFFFF', color: C.ink, overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=Inter:wght@400;500;600&display=swap');
        html { scroll-behavior: smooth; scroll-snap-type: y proximity; }
        .lp-snap { scroll-snap-align: start; scroll-snap-stop: normal; }
        .lp-btn { transition: all .18s ease; }
        .lp-btn:hover { filter: brightness(1.05); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(12,68,124,0.22); }
        .lp-btn:active { transform: translateY(0) scale(0.98); }
        .lp-btn:hover .lp-arrow { transform: translateX(3px); }
        .lp-arrow { transition: transform .18s ease; display: inline-block; }
        .lp-card { transition: all .25s ease; }
        .lp-card:hover { transform: translateY(-4px); box-shadow: 0 14px 30px rgba(11,27,51,0.09); border-color: transparent !important; }
        .lp-card:hover .lp-feat-arrow { opacity: 1 !important; transform: translateX(0) !important; }
        @keyframes lpFloat { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-14px) rotate(3deg); } }
        @keyframes lpFloatSlow { 0%,100% { transform: translateY(0); } 50% { transform: translateY(18px); } }
        @keyframes lpPulse { 0%,100% { opacity: .5; transform: scale(1); } 50% { opacity: .8; transform: scale(1.08); } }
        @keyframes lpTicker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .lp-blob1 { animation: lpFloat 7s ease-in-out infinite; }
        .lp-blob2 { animation: lpFloatSlow 9s ease-in-out infinite; }
        .lp-badge-pill { animation: lpPulse 3.5s ease-in-out infinite; }
        .lp-mock { animation: lpFloatSlow 6s ease-in-out infinite; }
        .lp-faq-body { animation: fadein .25s ease; }
        .lp-masonry { column-count: 1; column-gap: 20px; }
        @media (min-width: 768px) { .lp-masonry { column-count: 3; } }
        .lp-masonry-item { break-inside: avoid; margin-bottom: 20px; display: block; }
        .lp-crystal { position: relative; overflow: hidden; }
        .lp-crystal::before {
          content: ''; position: absolute; top: -60%; left: -30%; width: 60%; height: 220%;
          background: linear-gradient(115deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 45%, rgba(255,255,255,0) 60%);
          transform: rotate(20deg); pointer-events: none;
        }
        .lp-crystal::after {
          content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
          background: linear-gradient(160deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 30%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.12) 100%);
        }
        .lp-nav-link { position: relative; }
        .lp-nav-link::after { content: ''; position: absolute; left: 0; bottom: -3px; width: 0; height: 2px; background: ${C.sky}; transition: width .2s ease; }
        .lp-nav-link:hover::after { width: 100%; }
      `}</style>

      {/* Nav */}
      <div className="sticky top-0 z-30" style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={28} />
            <span style={{ ...fontDisplay, fontWeight: 800, fontSize: 18 }}>{tt("BLIC")}<span style={{ color: C.sky }}>{tt("Pay")}</span></span>
          </div>
          <div className="hidden md:flex items-center gap-7">
            <a href="#features" className="lp-nav-link text-sm font-medium" style={{ color: C.ink }}>{tr('lp_navFeatures')}</a>
            <a href="#sol" className="lp-nav-link text-sm font-medium" style={{ color: C.ink }}>{tr('lp_navSol')}</a>
            <a href="#how" className="lp-nav-link text-sm font-medium" style={{ color: C.ink }}>{tr('lp_navHow')}</a>
            <a href="#faq" className="lp-nav-link text-sm font-medium" style={{ color: C.ink }}>{tr('lp_navFaq')}</a>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setLangMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg" style={{ color: C.ink }}>
                <span>{currentLang.flag}</span>
                <ChevronRight size={13} color={C.muted} style={{ transform: langMenuOpen ? 'rotate(90deg)' : 'rotate(90deg)', transition: 'transform .2s' }} />
              </button>
              {langMenuOpen && (
                <div className="absolute right-0 mt-1 rounded-xl overflow-hidden z-40" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 8px 24px rgba(11,27,51,0.12)', minWidth: 160 }}>
                  {LANGS.map((l) => (
                    <button key={l.code} onClick={() => { setLang(l.code); setLangMenuOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left"
                      style={{ background: lang === l.code ? C.bg : 'transparent', color: C.ink }}>
                      <span>{l.flag}</span> {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={onStart} className="lp-nav-link text-sm font-semibold px-4 py-2" style={{ color: C.navy }}>{tr('lp_login')}</button>
            <button onClick={onStart} className="lp-btn text-sm font-semibold px-5 py-2.5 rounded-full text-white"
              style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})` }}>
              {tr('lp_signup')}
            </button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-10 grid md:grid-cols-2 gap-12 items-center lp-snap">
        <div className="lp-blob1" style={{ position: 'absolute', top: -40, right: 40, width: 140, height: 140, borderRadius: '50%', background: `radial-gradient(circle, ${C.sky}22, transparent 70%)`, zIndex: 0 }} />
        <div className="lp-blob2" style={{ position: 'absolute', bottom: -20, left: -20, width: 180, height: 180, borderRadius: '50%', background: `radial-gradient(circle, ${C.mint}18, transparent 70%)`, zIndex: 0 }} />

        <Reveal className="relative">
          <span className="lp-badge-pill inline-flex items-center gap-2.5 mb-6" style={{ color: C.navy, letterSpacing: 1.5 }}>
            <span className="w-2 h-2 rounded-full" style={{ background: C.mint }} />
            <span className="text-xs font-bold uppercase">{tr('lp_badge')}</span>
          </span>
          <h1 style={{ ...fontDisplay, fontWeight: 800, fontSize: 58, lineHeight: 1.02, letterSpacing: -1, color: C.ink }}>
            {tr('lp_h1a')} {tr('lp_h1b')}
          </h1>
          <p style={{ ...fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 50, lineHeight: 1.05, color: C.sky, marginTop: 6 }}>
            {tr('lp_h1italic')}
          </p>
          <p className="mt-6 text-base leading-relaxed" style={{ color: C.muted, maxWidth: 440 }}>
            {tr('lp_sub')}
          </p>
          <div className="mt-9 flex items-center gap-3">
            <button onClick={onStart} className="lp-btn px-7 py-4 rounded-full font-bold text-sm flex items-center gap-1.5"
              style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, color: '#fff' }}>
              {tr('lp_start')} <ChevronRight size={15} className="lp-arrow" />
            </button>
            <button onClick={onStart} className="lp-btn px-7 py-4 rounded-full font-bold text-sm" style={{ border: `1.5px solid ${C.border}`, color: C.ink, background: 'transparent' }}>
              {tr('lp_login')}
            </button>
          </div>

          <div className="mt-6 flex items-center gap-4 flex-wrap">
            {[[Lock, tr('lp_trust1')], [ShieldCheck, tr('lp_trust2')], [Clock, tr('lp_trust3')]].map(([Icon, label]) => (
              <span key={label} className="inline-flex items-center gap-1.5 text-xs" style={{ color: C.muted }}>
                <Icon size={13} color={C.sky} /> {label}
              </span>
            ))}
          </div>
          <div className="mt-10">
            <p className="text-[11px] font-bold uppercase mb-3" style={{ color: C.muted, letterSpacing: 0.6 }}>{tr('lp_methods')}</p>
            <div className="flex items-center gap-2 flex-wrap">
              {DEPOSIT_METHODS.map((m) => (
                <span key={m.name} className="inline-flex items-center gap-2 text-xs font-semibold pl-2 pr-3.5 py-1.5 rounded-lg" style={{ background: C.card, border: `1px solid ${C.border}`, color: C.ink }}>
                  {m.logo ? (
                    <img src={m.logo} alt={m.name} className="rounded" style={{ height: 18, width: 'auto', maxWidth: 46, objectFit: 'contain' }} />
                  ) : (
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.color, display: 'inline-block' }} />
                  )}
                  {m.name}
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={150} className="relative">
          <img src="/hero-mockup.png" alt={tt("Aplikasyon BLICPay sou telefòn ak òdinatè")}
            className="lp-mock w-full h-auto md:w-[135%]" style={{ display: 'block', margin: '0 auto' }} />
        </Reveal>
      </div>



      <div className="lp-snap" style={{ background: '#FAFBFC', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
      <Reveal>
        <div className="max-w-5xl mx-auto px-6 py-14">
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}`, boxShadow: '0 20px 50px rgba(11,27,51,0.10)' }}>
            {/* browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3" style={{ background: '#1A2B45' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57', display: 'inline-block' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E', display: 'inline-block' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840', display: 'inline-block' }} />
              <div className="mx-auto px-4 py-1 rounded-md text-[10px]" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                {tt("blicpayht.com")}
              </div>
              <div style={{ width: 30 }} />
            </div>
            {/* app nav — dark bar (logo + notifications + avatar) then light icon nav row, matching the reference */}
            <div className="flex items-center justify-between px-6 py-3" style={{ background: '#0F2038' }}>
              <div className="flex items-center gap-2">
                <Logo size={20} />
                <span style={{ ...fontDisplay, fontWeight: 800, fontSize: 13, color: '#fff' }}>{tt("BLIC")}<span style={{ color: C.sky }}>{tt("Pay")}</span></span>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Bell size={16} color="rgba(255,255,255,0.75)" />
                  <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold flex items-center justify-center rounded-full" style={{ width: 13, height: 13, background: '#E4032E', color: '#fff' }}>3</span>
                </div>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: C.sky, color: '#fff' }}>BL</div>
              </div>
            </div>
            <div className="flex items-center justify-around px-4 py-3" style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}>
              {[
                { icon: Home, label: 'Akèy', active: false },
                { icon: Users, label: 'BLIC Sòl', active: true },
                { icon: ArrowLeftRight, label: 'Transfè', active: false },
                { icon: HandCoins, label: 'Prè', active: false },
                { icon: Settings, label: 'Paramèt', active: false },
              ].map((n) => (
                <div key={n.label} className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center justify-center rounded-full transition-all" style={{
                    width: 34, height: 34,
                    background: n.active ? `linear-gradient(135deg, ${C.navy}, ${C.sky})` : 'transparent',
                  }}>
                    <n.icon size={16} fill={n.active ? '#fff' : C.muted} strokeWidth={1.5} color={n.active ? '#fff' : C.muted} />
                  </div>
                  <span className="text-[9px] font-semibold" style={{ color: n.active ? C.navy : C.muted }}>{n.label}</span>
                </div>
              ))}
            </div>
            {/* dashboard body */}
            <div className="p-5 md:p-6 grid md:grid-cols-2 gap-5" style={{ background: C.bg }}>
              {/* wallet card */}
              <div className="rounded-2xl p-5" style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})` }}>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.75)' }}>{tr('lp_mockBalance')}</p>
                <p style={{ ...fontDisplay, fontWeight: 800, fontSize: 26, color: '#fff', marginTop: 4 }}>{tt("45,200 HTG")}</p>
                <div className="mt-4 flex gap-2">
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>{tr('tileDeposit')}</span>
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>{tr('tileWithdraw')}</span>
                </div>
              </div>
              {/* quick links */}
              <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <p className="text-xs font-bold" style={{ color: C.muted }}>{tr('lp_mockQuickAccess')}</p>
                <div className="mt-3 grid grid-cols-4 gap-3">
                  {[
                    { icon: ArrowLeftRight, label: tr('tileTransfer'), fillable: false },
                    { icon: Users, label: 'Sòl', fillable: true },
                    { icon: PiggyBank, label: tr('lp_mockGoalShort'), fillable: true },
                    { icon: HandCoins, label: tr('tileLoan'), fillable: true },
                  ].map((a) => (
                    <div key={a.label} className="flex flex-col items-center gap-1.5">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#E6F0FB' }}>
                        <a.icon size={15} color={C.navy} fill={a.fillable ? C.navy : 'none'} strokeWidth={a.fillable ? 1.4 : 2} />
                      </div>
                      <span className="text-[10px] font-medium" style={{ color: C.muted }}>{a.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* recent activity */}
              <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <p className="text-xs font-bold" style={{ color: C.muted }}>{tr('lp_mockRecentActivity')}</p>
                <div className="mt-3 space-y-2">
                  {[{ n: tr('lp_mockDepositMoncash'), a: '+2,500 HTG', pos: true }, { n: tr('lp_mockSolContribution'), a: '−1,000 HTG', pos: false }].map((t) => (
                    <div key={t.n} className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ background: C.bg }}>
                      <span className="text-xs font-medium">{t.n}</span>
                      <span className="text-xs font-semibold" style={{ color: t.pos ? C.mint : C.ink }}>{t.a}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* BLIC Sòl panel — showcasing the real 90-group structure */}
              <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold" style={{ color: C.muted }}>{tt("BLIC SÒL")}</p>
                  <span className="text-[10px] font-semibold" style={{ color: C.sky }}>{tr('lp_stat1')}: 90</span>
                </div>
                <div className="mt-3 p-3 rounded-xl" style={{ background: C.bg }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{tt("Sòl Basic #3")}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#E4F5EF', color: C.mint }}>7/10</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: C.border }}>
                    <div style={{ width: '70%', height: '100%', background: `linear-gradient(90deg, ${C.navy}, ${C.sky})` }} />
                  </div>
                  <p className="mt-2 text-[10px]" style={{ color: C.muted }}>{tr('lp_mockWeeklyDesc')}</p>
                </div>
              </div>
              {/* Upcoming card feature — closely matches the reference layout, Mastercard-style mark blurred */}
              <div className="rounded-2xl p-5 md:col-span-2" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="grid md:grid-cols-2 gap-6 items-center">
                  <div>
                    <span className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-full mb-2" style={{ background: '#FBF0DE', color: '#946115', letterSpacing: 0.5 }}>
                      {tr('lp_cardBadge')}
                    </span>
                    <p className="text-sm font-bold">{tr('lp_cardTitle')}</p>
                    <p className="mt-1.5 text-xs leading-relaxed" style={{ color: C.muted }}>{tr('lp_cardSub')}</p>
                  </div>

                  <div className="relative mx-auto" style={{
                    maxWidth: 320, aspectRatio: '1.586', borderRadius: 16, padding: 22,
                    background: `linear-gradient(135deg, ${C.navy} 0%, ${C.sky} 100%)`,
                    boxShadow: '0 16px 32px rgba(11,27,51,0.28)', overflow: 'hidden',
                  }}>
                    <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />

                    {/* top row: logo icon (with chip stacked below it) + wordmark/tagline, matching the reference layout */}
                    <div className="flex items-start gap-2.5 relative">
                      <div>
                        <svg width="30" height="30" viewBox="0 0 48 48">
                          <path d="M24 3 L42 10 V22 C42 33 34.5 41.5 24 45 C13.5 41.5 6 33 6 22 V10 Z" fill="rgba(255,255,255,0.25)" />
                          <path d="M13 30 L33 15" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
                          <path d="M27 15 H33 V21" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </svg>
                        {/* EMV chip, stacked under the logo like the reference */}
                        <div className="mt-2" style={{ width: 28, height: 21, borderRadius: 4, background: 'linear-gradient(135deg, #E9D28C, #C9A857)' }}>
                          <div style={{ margin: 2.5, border: '1px solid rgba(0,0,0,0.25)', borderRadius: 2, height: 16 }} />
                        </div>
                      </div>
                      <div className="pt-0.5">
                        <p style={{ ...fontDisplay, fontWeight: 800, fontSize: 17, color: '#fff', lineHeight: 1 }}>{tt("BLIC")}<span style={{ fontStyle: 'italic' }}>{tt("Pay")}</span></p>
                        <p className="mt-1" style={{ fontSize: 7, color: 'rgba(255,255,255,0.8)', letterSpacing: 0.8 }}>{tr('lp_cardTagline')}</p>
                      </div>
                    </div>

                    {/* card number, spaced like a real card */}
                    <p className="mt-6 relative" style={{ color: '#fff', letterSpacing: 2, fontFamily: 'monospace', fontSize: 16, fontWeight: 500 }}>
                      1234 5678 9012 3456
                    </p>

                    <div className="mt-4 flex items-end justify-between relative">
                      <div>
                        <p className="flex items-baseline gap-1.5">
                          <span style={{ fontSize: 6, color: 'rgba(255,255,255,0.75)' }}>{tt("EXRID")}</span>
                          <span style={{ fontSize: 11, color: '#fff', fontFamily: 'monospace' }}>12/99</span>
                        </p>
                        <p className="mt-1" style={{ fontSize: 10, color: '#fff', letterSpacing: 0.5 }}>{tr('lp_cardHolder')}</p>
                      </div>
                      {/* Mastercard-style dual-circle mark, deliberately blurred to avoid reproducing the trademark clearly */}
                      <div className="text-right">
                        <div style={{ filter: 'blur(3.5px)', opacity: 0.85, position: 'relative', width: 34, height: 20, marginLeft: 'auto' }}>
                          <div style={{ position: 'absolute', left: 0, width: 20, height: 20, borderRadius: '50%', background: '#EB5757' }} />
                          <div style={{ position: 'absolute', left: 12, width: 20, height: 20, borderRadius: '50%', background: '#F2A93B' }} />
                        </div>
                        <p className="mt-1" style={{ fontSize: 7, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 }}>{tt("DEBIT")}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
      </div>

      <div id="features" className="max-w-6xl mx-auto px-6 py-20">
        <Reveal className="text-center max-w-xl mx-auto">
          <span className="text-xs font-bold tracking-wide" style={{ color: C.sky }}>{tr('lp_featEyebrow')}</span>
          <h2 className="mt-2" style={{ ...fontDisplay, fontWeight: 800, fontSize: 30 }}><EmphTitle text={tr('lp_featTitle')} style={{ color: C.sky }} /></h2>
          <p className="mt-3 text-sm" style={{ color: C.muted }}>{tr('lp_featSub')}</p>
        </Reveal>
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-5" style={{ gridAutoRows: 'minmax(90px, auto)' }}>
          {/* Large featured card — BLIC Sòl */}
          <Reveal delay={0} className="col-span-2 md:col-span-2 row-span-2">
            <div className="lp-card p-7 rounded-3xl h-full relative flex flex-col justify-between" style={{ background: `linear-gradient(160deg, ${C.navy}, ${C.sky})`, boxShadow: '0 8px 24px rgba(12,68,124,0.18)', minHeight: 260 }}>
              <div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <Users size={22} color="#fff" fill="#fff" strokeWidth={1.4} />
                </div>
                <h3 className="font-bold" style={{ ...fontDisplay, fontSize: 26, lineHeight: 1.15, color: '#fff' }}><EmphTitle text={FEATURES[0].title} style={{ color: C.sky }} /></h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)', maxWidth: 320 }}>{FEATURES[0].desc}</p>
              </div>
              <div className="mt-6 flex items-center gap-2">
                {['Basic', 'Standard', 'Premium'].map((t) => (
                  <span key={t} className="text-[11px] font-semibold px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>{t}</span>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Depo Objektif — wide */}
          <Reveal delay={80} className="col-span-2 md:col-span-2">
            <div className="lp-card p-6 rounded-3xl h-full relative" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 4px 16px rgba(11,27,51,0.05)', minHeight: 90 }}>
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: FEATURES[1].bg }}>
                  <F1Icon size={20} color={FEATURES[1].accent} fill={FEATURES[1].accent} strokeWidth={1.4} />
                </div>
                <div>
                  <h3 className="font-bold" style={{ fontSize: 18, lineHeight: 1.2 }}><EmphTitle text={FEATURES[1].title} style={{ color: FEATURES[1].accent }} /></h3>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: C.muted }}>{FEATURES[1].desc}</p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Prè */}
          <Reveal delay={120} className="col-span-1 md:col-span-1">
            <div className="lp-card p-5 rounded-3xl h-full relative" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 4px 16px rgba(11,27,51,0.05)', minHeight: 150 }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: FEATURES[2].bg }}>
                <F2Icon size={20} color={FEATURES[2].accent} fill={FEATURES[2].accent} strokeWidth={1.4} />
              </div>
              <h3 className="font-bold" style={{ fontSize: 18, lineHeight: 1.2 }}><EmphTitle text={FEATURES[2].title} style={{ color: FEATURES[2].accent }} /></h3>
              <p className="mt-1.5 text-xs leading-relaxed" style={{ color: C.muted }}>{FEATURES[2].desc}</p>
            </div>
          </Reveal>

          {/* Transfè */}
          <Reveal delay={160} className="col-span-1 md:col-span-1">
            <div className="lp-card p-5 rounded-3xl h-full relative" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 4px 16px rgba(11,27,51,0.05)', minHeight: 150 }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: FEATURES[3].bg }}>
                <F3Icon size={20} color={FEATURES[3].accent} strokeWidth={2} />
              </div>
              <h3 className="font-bold" style={{ fontSize: 18, lineHeight: 1.2 }}><EmphTitle text={FEATURES[3].title} style={{ color: FEATURES[3].accent }} /></h3>
              <p className="mt-1.5 text-xs leading-relaxed" style={{ color: C.muted }}>{FEATURES[3].desc}</p>
            </div>
          </Reveal>

          {/* BLIC Depo */}
          <Reveal delay={200} className="col-span-1 md:col-span-2">
            <div className="lp-card p-6 rounded-3xl h-full relative" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 4px 16px rgba(11,27,51,0.05)', minHeight: 130 }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: FEATURES[4].bg }}>
                <F4Icon size={20} color={FEATURES[4].accent} fill={FEATURES[4].accent} strokeWidth={1.4} />
              </div>
              <h3 className="font-bold" style={{ fontSize: 18, lineHeight: 1.2 }}><EmphTitle text={FEATURES[4].title} style={{ color: FEATURES[4].accent }} /></h3>
              <p className="mt-1.5 text-xs leading-relaxed" style={{ color: C.muted }}>{FEATURES[4].desc}</p>
            </div>
          </Reveal>

          {/* Verifikasyon KYC */}
          <Reveal delay={240} className="col-span-1 md:col-span-2">
            <div className="lp-card p-6 rounded-3xl h-full relative" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 4px 16px rgba(11,27,51,0.05)', minHeight: 130 }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: FEATURES[5].bg }}>
                <F5Icon size={20} color={FEATURES[5].accent} fill={FEATURES[5].accent} strokeWidth={1.4} />
              </div>
              <h3 className="font-bold" style={{ fontSize: 18, lineHeight: 1.2 }}><EmphTitle text={FEATURES[5].title} style={{ color: FEATURES[5].accent }} /></h3>
              <p className="mt-1.5 text-xs leading-relaxed" style={{ color: C.muted }}>{FEATURES[5].desc}</p>
            </div>
          </Reveal>
        </div>

        {/* Two-column phone showcase — real features, not the coming-soon card */}
        <div className="mt-8 grid md:grid-cols-2 gap-5">
          <Reveal delay={100}>
            <div className="rounded-3xl p-8 overflow-hidden relative" style={{ background: '#EEF3FB', minHeight: 420 }}>
              <h3 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22, maxWidth: 260 }}><EmphTitle text={tr('lp_show1Title')} style={{ color: C.sky }} /></h3>
              <p className="mt-2 text-sm" style={{ color: C.muted, maxWidth: 260 }}>{tr('lp_show1Sub')}</p>
              <div className="mx-auto mt-6" style={{
                width: 220, borderRadius: 26, border: '8px solid #0B1B33', background: '#fff',
                boxShadow: '0 20px 40px rgba(11,27,51,0.18)', overflow: 'hidden',
              }}>
                <div className="px-4 pt-3 pb-2 flex items-center justify-between text-[10px] font-semibold" style={{ color: C.ink }}>
                  <span>9:41</span><span style={{ width: 60, height: 16, borderRadius: 10, background: '#0B1B33' }} /><span>••••</span>
                </div>
                <div className="px-4 pb-5">
                  <div className="rounded-2xl p-4" style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})` }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{tt("Sòl Standard #5")}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>6/10</span>
                    </div>
                    <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.25)' }}>
                      <div style={{ width: '60%', height: '100%', background: '#fff' }} />
                    </div>
                    <p className="mt-2 text-[10px]" style={{ color: 'rgba(255,255,255,0.8)' }}>{tr('lp_mockBiweeklyDesc')}</p>
                  </div>
                  <button className="mt-3 w-full py-2.5 rounded-xl text-xs font-bold text-white" style={{ background: C.mint }}>{tr('lp_mockRequestJoin')}</button>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="rounded-3xl p-8 overflow-hidden relative" style={{ background: `linear-gradient(160deg, ${C.navy}, ${C.sky})`, minHeight: 420 }}>
              <h3 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22, maxWidth: 260, color: '#fff' }}><EmphTitle text={tr('lp_show2Title')} style={{ color: '#fff', textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.5)' }} /></h3>
              <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.75)', maxWidth: 260 }}>{tr('lp_show2Sub')}</p>
              <div className="mx-auto mt-6" style={{
                width: 220, borderRadius: 26, border: '8px solid #0B1B33', background: `linear-gradient(180deg, #1a3a5c, #0c447c)`,
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)', overflow: 'hidden', padding: '14px 12px',
              }}>
                <p className="text-center text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>9:41</p>
                {[
                  { t: 'Depo resevwa', d: 'Ou resevwa 2,500 HTG pa MonCash.', time: '2mn' },
                  { t: 'Kotizasyon Sòl', d: 'Peman 2,500 HTG konfime pou Sòl #5.', time: '1j' },
                ].map((n) => (
                  <div key={n.t} className="mt-2 rounded-xl p-2.5 flex items-start gap-2" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)' }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: '#fff' }}>
                      <Bell size={11} color={C.navy} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-white">{n.t}</span>
                        <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{n.time}</span>
                      </div>
                      <p className="text-[9px] leading-snug" style={{ color: 'rgba(255,255,255,0.75)' }}>{n.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Scrolling partner strip — real authorized partner logos in white chips for contrast */}
      <div className="overflow-hidden py-4 lp-snap" style={{ background: '#0F2038' }}>
        <div className="flex items-center gap-6" style={{ width: 'max-content', animation: 'lpTicker 24s linear infinite' }}>
          {[...Array(2)].flatMap((_, dup) =>
            [
              { name: 'MonCash', logo: '/logos/moncash-wide.png' },
              { name: 'NatCash', logo: '/logos/natcash-wide.png' },
              { name: 'USDT', logo: '/logos/usdt-wide.png' },
              { name: 'Zelle', logo: '/logos/zelle-wide.png' },
              { name: 'BLICPay', logo: null },
            ].map((p, i) => (
              <span key={dup + '-' + i} className="inline-flex items-center gap-2.5 px-3">
                {p.logo ? (
                  <span className="rounded-md flex items-center justify-center px-2 py-1.5" style={{ background: '#fff' }}>
                    <img src={p.logo} alt={p.name} style={{ height: 16, width: 'auto', maxWidth: 52, objectFit: 'contain', display: 'block' }} />
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Logo size={16} />
                    <span className="text-xs font-bold" style={{ color: '#fff' }}>{tt("BLICPay")}</span>
                  </span>
                )}
              </span>
            ))
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="lp-snap" style={{ background: '#FAFBFC', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
      <div id="how" className="max-w-6xl mx-auto px-6 py-20">
        <Reveal className="text-center max-w-xl mx-auto">
          <span className="text-xs font-bold tracking-wide" style={{ color: C.sky }}>{tr('lp_howEyebrow')}</span>
          <h2 className="mt-2" style={{ ...fontDisplay, fontWeight: 800, fontSize: 30 }}><EmphTitle text={tr('lp_howTitle')} style={{ color: C.sky }} /></h2>
          <p className="mt-3 text-sm" style={{ color: C.muted }}>{tr('lp_howSub')}</p>
        </Reveal>
        <div className="mt-14 relative grid md:grid-cols-3 gap-6">
          {/* connecting line behind the step badges, desktop only */}
          <div className="hidden md:block absolute" style={{ top: 28, left: '16.5%', right: '16.5%', height: 2, background: `linear-gradient(90deg, ${C.border}, ${C.sky}, ${C.border})` }} />
          {[
            { n: '01', title: tr('lp_s1t'), desc: tr('lp_s1d'), icon: User },
            { n: '02', title: tr('lp_s2t'), desc: tr('lp_s2d'), icon: Wallet },
            { n: '03', title: tr('lp_s3t'), desc: tr('lp_s3d'), icon: TrendingUp },
          ].map((s, i) => (
            <Reveal key={s.n} delay={i * 100} className="relative">
              <div className="relative p-6 pt-0 rounded-2xl h-full" style={{ background: 'transparent' }}>
                <div className="relative mx-auto md:mx-0 mb-5 flex items-center justify-center rounded-full"
                  style={{ width: 56, height: 56, background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, boxShadow: '0 8px 20px rgba(12,68,124,0.25)' }}>
                  <s.icon size={22} color="#fff" />
                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full text-[10px] font-bold"
                    style={{ width: 22, height: 22, background: '#fff', color: C.navy, border: `2px solid ${C.sky}` }}>{s.n}</span>
                </div>
                <div className="text-center md:text-left rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                  <h3 className="font-bold text-sm">{s.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed" style={{ color: C.muted }}>{s.desc}</p>
                </div>
              </div>
              {i < 2 && (
                <div className="hidden md:flex absolute items-center justify-center" style={{ top: 18, right: -30, width: 24, height: 24 }}>
                  <ChevronRight size={20} color={C.sky} />
                </div>
              )}
            </Reveal>
          ))}
        </div>
      </div>
      </div>

      {/* Sòl tier comparison table */}
      <div id="sol" className="max-w-4xl mx-auto px-6 py-20 lp-snap">
        <Reveal className="text-center max-w-xl mx-auto">
          <span className="text-xs font-bold tracking-wide" style={{ color: C.sky }}>{tr('lp_solEyebrow')}</span>
          <h2 className="mt-2" style={{ ...fontDisplay, fontWeight: 800, fontSize: 30 }}><EmphTitle text={tr('lp_solTitle')} style={{ color: C.sky }} /></h2>
          <p className="mt-3 text-sm" style={{ color: C.muted }}>{tr('lp_solSub')}</p>
        </Reveal>
        <Reveal delay={100}>
          <div className="mt-10 rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}`, background: C.card }}>
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  <th className="text-left text-xs font-bold px-5 py-3.5" style={{ color: C.muted }}>{tr('lp_solNivo')}</th>
                  <th className="text-center text-xs font-bold px-5 py-3.5" style={{ color: C.muted }}>{tr('lp_solSemenn')}</th>
                  <th className="text-center text-xs font-bold px-5 py-3.5" style={{ color: C.muted }}>{tr('lp_solKenzenn')}</th>
                  <th className="text-center text-xs font-bold px-5 py-3.5" style={{ color: C.muted }}>{tr('lp_solMwa')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { tier: 'Basic', semenn: '1,000', kenzenn: '4,000', mwa: '10,000' },
                  { tier: 'Standard', semenn: '2,500', kenzenn: '8,000', mwa: '15,000' },
                  { tier: 'Premium', semenn: '5,000', kenzenn: '10,000', mwa: '20,000' },
                ].map((row) => (
                  <tr key={row.tier} style={{ borderTop: `1px solid ${C.border}` }}>
                    <td className="px-5 py-3.5 text-sm font-semibold">{row.tier}</td>
                    <td className="px-5 py-3.5 text-sm text-center" style={{ color: C.muted }}>{row.semenn} HTG</td>
                    <td className="px-5 py-3.5 text-sm text-center" style={{ color: C.muted }}>{row.kenzenn} HTG</td>
                    <td className="px-5 py-3.5 text-sm text-center" style={{ color: C.muted }}>{row.mwa} HTG</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </div>

      <div className="lp-snap" style={{ background: '#FAFBFC', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
      <div className="max-w-6xl mx-auto px-6 py-16">
        <Reveal className="text-center max-w-xl mx-auto">
          <span className="text-xs font-bold tracking-wide" style={{ color: C.sky }}>{tr('lp_testiEyebrow')}</span>
          <h2 className="mt-2" style={{ ...fontDisplay, fontWeight: 800, fontSize: 30 }}><EmphTitle text={tr('lp_testiTitle')} style={{ color: C.sky }} /></h2>
        </Reveal>
        <div className="mt-10 lp-masonry">
          {[
            { n: 1, tint: '#FBF0F2' }, { n: 2, tint: '#EFF7F0' }, { n: 3, tint: '#F4F6FA' },
            { n: 4, tint: '#FBF3EA' }, { n: 5, tint: '#F4F6FA' }, { n: 6, tint: '#EFF0FB' },
          ].map((s, i) => {
            const name = tr(`lp_testi${s.n}Name`);
            const initials = name.slice(0, 2).toUpperCase();
            return (
              <Reveal key={i} delay={(i % 3) * 100} className="lp-masonry-item">
                <div className="p-6 rounded-2xl flex flex-col" style={{ background: s.tint }}>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(255,255,255,0.7)', color: C.navy }}>{initials}</div>
                    <span className="text-sm font-bold" style={{ color: C.muted }}>{name}</span>
                  </div>
                  <p className="text-sm leading-relaxed flex-1" style={{ color: C.ink }}>"{tr(`lp_testi${s.n}Quote`)}"</p>
                  <div className="mt-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold">{name}</p>
                      <p className="text-[11px]" style={{ color: C.muted }}>{tr(`lp_testi${s.n}Role`)}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#fff' }}>
                      <Star size={11} color={C.amber} fill={C.amber} /> 5.0
                    </span>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
      </div>

      {/* Security / trust — honest claims only */}
      <div className="max-w-6xl mx-auto px-6 py-16 lp-snap">
        <Reveal>
          <div className="rounded-3xl p-10 md:p-12 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky} 55%, #6D3FD1)` }}>
            {/* colorful blurred shapes behind the glass cards */}
            <div style={{ position: 'absolute', top: -60, right: -40, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', filter: 'blur(10px)' }} />
            <div style={{ position: 'absolute', bottom: -80, left: -60, width: 240, height: 240, borderRadius: '50%', background: `${C.mint}55`, filter: 'blur(20px)' }} />
            <div className="grid md:grid-cols-2 gap-12 items-center relative">
              <div>
                <span className="text-xs font-bold tracking-wide" style={{ color: '#fff', letterSpacing: 0.6, opacity: 0.85 }}>{tr('lp_secEyebrow')}</span>
                <h2 className="mt-2" style={{ ...fontDisplay, fontWeight: 800, fontSize: 28, letterSpacing: -0.3, color: '#fff' }}><EmphTitle text={tr('lp_secTitle')} style={{ textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.5)' }} /></h2>
                <p className="mt-4 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)', maxWidth: 380 }}>
                  {tr('lp_secSub')}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Lock, t: tr('lp_sec1t'), d: tr('lp_sec1d') },
                  { icon: ShieldCheck, t: tr('lp_sec2t'), d: tr('lp_sec2d') },
                  { icon: BadgeCheck, t: tr('lp_sec3t'), d: tr('lp_sec3d') },
                  { icon: Users, t: tr('lp_sec4t'), d: tr('lp_sec4d') },
                ].map((s) => (
                  <div key={s.t} className="lp-crystal p-4 rounded-xl" style={{
                    background: 'linear-gradient(160deg, rgba(255,255,255,0.22), rgba(255,255,255,0.06))',
                    backdropFilter: 'blur(16px) saturate(140%)', WebkitBackdropFilter: 'blur(16px) saturate(140%)',
                    border: '1.5px solid rgba(255,255,255,0.4)',
                    boxShadow: '0 10px 30px rgba(11,27,51,0.2), inset 0 1px 1px rgba(255,255,255,0.5)',
                  }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: 'rgba(255,255,255,0.25)' }}>
                      <s.icon size={16} color="#fff" fill="#fff" strokeWidth={1.4} />
                    </div>
                    <p className="text-xs font-bold" style={{ color: '#fff' }}>{s.t}</p>
                    <p className="mt-1 text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>{s.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      <div id="faq" className="max-w-3xl mx-auto px-6 py-20 lp-snap">
        <Reveal>
          <span className="block text-center text-xs font-bold tracking-wide" style={{ color: C.sky }}>{tr('lp_faqEyebrow')}</span>
          <h2 className="text-center mt-2" style={{ ...fontDisplay, fontWeight: 800, fontSize: 30 }}><EmphTitle text={tr('lp_faqTitle')} style={{ color: C.sky }} /></h2>
        </Reveal>
        <div className="mt-8 space-y-3">
          {FAQS.map((f, i) => (
            <Reveal key={i} delay={i * 60}>
              <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left">
                  <span className="text-sm font-semibold">{f.q}</span>
                  <ChevronRight size={16} color={C.muted} style={{ transform: openFaq === i ? 'rotate(90deg)' : 'none', transition: 'transform .25s ease' }} />
                </button>
                {openFaq === i && (
                  <p className="lp-faq-body px-5 pb-4 text-sm" style={{ color: C.muted }}>{f.a}</p>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <Reveal>
        <div className="max-w-6xl mx-auto px-6 pb-16 lp-snap">
          <div className="rounded-3xl p-10 text-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})` }}>
            <div className="lp-blob1" style={{ position: 'absolute', top: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            <div className="lp-blob2" style={{ position: 'absolute', bottom: -40, right: -20, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
            <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 26, color: '#fff', position: 'relative' }}><EmphTitle text={tr('lp_ctaTitle')} style={{ color: '#fff', textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.5)' }} /></h2>
            <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.85)', position: 'relative' }}>{tr('lp_ctaSub')}</p>
            <button onClick={onStart} className="lp-btn mt-6 px-7 py-3.5 rounded-xl font-semibold text-sm flex items-center gap-1.5 mx-auto" style={{ background: '#fff', color: C.navy, position: 'relative' }}>
              {tr('lp_ctaBtn')} <ChevronRight size={15} className="lp-arrow" />
            </button>
          </div>
        </div>
      </Reveal>

      <div style={{ borderTop: `1px solid ${C.border}`, background: C.card }}>
        <div className="max-w-6xl mx-auto px-6 py-14 grid md:grid-cols-5 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <Logo size={26} />
              <span style={{ ...fontDisplay, fontWeight: 800, fontSize: 16 }}>{tt("BLIC")}<span style={{ color: C.sky }}>{tt("Pay")}</span></span>
            </div>
            <p className="mt-3 text-xs leading-relaxed" style={{ color: C.muted, maxWidth: 260 }}>
              {tr('lp_footDesc')}
            </p>
            <p className="mt-4 text-xs font-semibold" style={{ color: C.navy }}>{tr('lp_footMadeIn')}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase" style={{ color: C.muted, letterSpacing: 0.6 }}>{tr('lp_footProduits')}</p>
            <div className="mt-3.5 flex flex-col gap-2.5">
              {['BLIC Sòl', tr('tileGoal'), tr('tileLoan'), tr('navTransfer'), tr('tileDepo')].map((l) => (
                <button key={l} onClick={onStart} className="text-xs text-left" style={{ color: C.ink, background: 'none', border: 'none', cursor: 'pointer' }}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase" style={{ color: C.muted, letterSpacing: 0.6 }}>{tr('lp_footCompany')}</p>
            <div className="mt-3.5 flex flex-col gap-2.5">
              <button onClick={() => setFooterModal('about')} className="text-xs text-left" style={{ color: C.ink, background: 'none', border: 'none', cursor: 'pointer' }}>{tr('lp_footAbout')}</button>
              <button onClick={() => setFooterModal('support')} className="text-xs text-left" style={{ color: C.ink, background: 'none', border: 'none', cursor: 'pointer' }}>{tr('lp_footSupport')}</button>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase" style={{ color: C.muted, letterSpacing: 0.6 }}>{tr('lp_footLegal')}</p>
            <div className="mt-3.5 flex flex-col gap-2.5">
              <button onClick={() => setFooterModal('terms')} className="text-xs text-left" style={{ color: C.ink, background: 'none', border: 'none', cursor: 'pointer' }}>{tr('lp_footTerms')}</button>
              <button onClick={() => setFooterModal('privacy')} className="text-xs text-left" style={{ color: C.ink, background: 'none', border: 'none', cursor: 'pointer' }}>{tr('lp_footPrivacy')}</button>
            </div>
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${C.border}` }}>
          <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <p className="text-xs" style={{ color: C.muted }}>© {new Date().getFullYear()} {tt("BLICPay.")} {tr('lp_footRights')}</p>
          </div>
          <div className="max-w-6xl mx-auto px-6 pb-6">
            <p className="text-[11px] leading-relaxed" style={{ color: C.muted, maxWidth: 640 }}>
              {tr('lp_footDisclaimer')}
            </p>
          </div>
        </div>
      </div>

      {footerModal && (
        <>
          <div onClick={() => setFooterModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(11,27,51,0.55)', zIndex: 60 }} />
          <div className="fadein" style={{
            position: 'fixed', top: '4%', bottom: '4%', left: '50%', transform: 'translateX(-50%)',
            width: '90%', maxWidth: 560, background: C.card, borderRadius: 20, zIndex: 61,
            overflowY: 'auto', padding: '28px 26px',
          }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
              <h3 style={{ ...fontDisplay, fontWeight: 800, fontSize: 19 }}>
                {footerModal === 'about' && tr('lp_footAbout')}
                {footerModal === 'support' && tr('lp_footSupport')}
                {footerModal === 'terms' && tr('lp_footTerms')}
                {footerModal === 'privacy' && tr('lp_footPrivacy')}
              </h3>
              <button onClick={() => setFooterModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.bg }}>
                <X size={15} color={C.muted} />
              </button>
            </div>

            {footerModal === 'about' && (
              <p className="text-sm leading-relaxed" style={{ color: C.ink }}>{tr('lp_aboutBody')}</p>
            )}

            {footerModal === 'support' && (
              <div className="flex flex-col" style={{ gap: 10 }}>
                <p className="text-sm" style={{ color: C.muted, marginBottom: 4 }}>{tr('lp_supportBody')}</p>
                <a href="tel:+13073460474" className="flex items-center gap-3 rounded-xl" style={{ padding: '13px 16px', background: C.bg, border: `1px solid ${C.border}` }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: '#E6F0FB' }}><Phone size={16} color={C.navy} /></div>
                  <div><p className="text-sm font-semibold">{tr('callUs')}</p><p className="text-xs" style={{ color: C.muted }}>+1 307 346 0474</p></div>
                </a>
                <a href="https://wa.me/13073460474" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl" style={{ padding: '13px 16px', background: C.bg, border: `1px solid ${C.border}` }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: '#E4F5EF' }}><Smartphone size={16} color={C.mint} /></div>
                  <div><p className="text-sm font-semibold">{tr('chatWhatsapp')}</p><p className="text-xs" style={{ color: C.muted }}>+1 307 346 0474</p></div>
                </a>
              </div>
            )}

            {(footerModal === 'terms' || footerModal === 'privacy') && (
              <>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: C.ink }}>
                  {footerModal === 'terms' ? tr('lp_termsBody') : tr('lp_privacyBody')}
                </p>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}



export default function BlicPayApp() {
  const [view, setView] = useState('landing');
  const [lang, setLangState] = useState(() => {
    try { const v = localStorage.getItem('blicpay_lang'); return ['ht', 'fr', 'en'].includes(v) ? v : 'ht'; } catch { return 'ht'; }
  });
  const setLang = (l) => { setLangState(l); try { localStorage.setItem('blicpay_lang', l); } catch { /* pa gen anyen pou fè */ } };
  CURRENT_LANG = lang;
  const [showLangPicker, setShowLangPicker] = useState(false);
  const tr = (key) => T[lang]?.[key] ?? T.ht[key] ?? key;
  const [appOpenFaq, setAppOpenFaq] = useState(null); // akòdeyon FAQ nan Sipò — apa de openFaq nan LandingPage
  const APP_FAQS = [
    { q: tr('lp_q1'), a: tr('lp_a1') },
    { q: tr('lp_q2'), a: tr('lp_a2') },
    { q: tr('lp_q3'), a: tr('lp_a3') },
    { q: tr('lp_q4'), a: tr('lp_a4') },
    { q: tr('lp_q5'), a: tr('lp_a5') },
  ];
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authForm, setAuthForm] = useState({
    lastName: '', firstName: '', phone: '', email: '',
    country: '', address: '', city: '', department: '', password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registerStep, setRegisterStep] = useState(1);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [kycStatus, setKycStatus] = useState('pa verifye'); // estati DÈNYE demand la : 'pa verifye' | 'annatant' | 'verifye'
  const [accountVerified, setAccountVerified] = useState(false); // badge PÈMANAN kont lan (User.verified) — pa depann de dènye demand lan
  const [verificationRequests, setVerificationRequests] = useState([]); // demand admin voye pou dokiman siplemantè (prèv adrès, elt.) — apa de KYC
  const [vrActive, setVrActive] = useState(null); // demand ki louvri pou telechajman kounye a
  const [vrBusy, setVrBusy] = useState(false);
  const [vrError, setVrError] = useState('');
  const [kycDocType, setKycDocType] = useState('paspò');
  const [kycStep, setKycStep] = useState('entwo'); // 'entwo' | 'fòm' — montre egzanp anvan telechajman
  const [kycFile, setKycFile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showMyQr, setShowMyQr] = useState(false); // kòd QR pèsonèl (resevwa lajan)
  const [methodCat, setMethodCat] = useState(null); // kategori metòd chwazi (null = otomatik)
  const [kycSelfieFile, setKycSelfieFile] = useState(null);
  const [profile, setProfile] = useState({
    firstName: '', lastName: '', email: '', address: '', city: '', country: '', department: '',
  });
  const [profileForm, setProfileForm] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSending, setSupportSending] = useState(false);
  const [supportSent, setSupportSent] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSending, setForgotSending] = useState(false);
  const [forgotDone, setForgotDone] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [historyQuery, setHistoryQuery] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');
  const [historyVisibleCount, setHistoryVisibleCount] = useState(10); // pajinasyon: 10 tranzaksyon alafwa
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [balance, setBalance] = useState(0);
  const [hideBalance, setHideBalance] = useState(true);
  const [promoIndex, setPromoIndex] = useState(0);
  const PROMO_SLIDES = [
    {
      icon: Users, title: tt("Envite yon zanmi, genyen"),
      desc: tt("Chak zanmi ki ouvri yon kont BLICPay ba w yon bonis sou pwochen depo w."),
      action: () => flash(tt("Fonksyon envitasyon ap vini.")), cta: tt("Wè plis"),
    },
    {
      icon: Users, title: '90 gwoup BLIC Sòl louvri',
      desc: tt("Antre nan yon gwoup Sòl nan nivo Basic, Standard oswa Premium jodi a."),
      action: () => openSolSection(), cta: tt("Gade gwoup yo"),
    },
    {
      icon: Lock, title: tt("Kat BLICPay ap vini"),
      desc: tt("N ap travay sou yon patenarya pou ofri kat vityèl ak fizik pou peye nenpòt kote."),
      action: () => flash(tt("Detay kat la ap vini talè.")), cta: tt("Aprann plis"),
    },
    {
      icon: PiggyBank, title: tt("Fikse yon objektif epay"),
      desc: tt("Kreye yon objektif e swiv pwogrè w chak fwa ou mete lajan."),
      action: () => setView('termdepo'), cta: tt("Kòmanse"),
    },
  ];
  React.useEffect(() => {
    const timer = setInterval(() => {
      setPromoIndex((i) => (i + 1) % PROMO_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Retabli pajinasyon an a 10 chak fwa yon filt chanje — san sa, yon lis 10
  // ta ka rete parèt apre yon rechèch ki gen mwens rezilta pase sa.
  React.useEffect(() => {
    setHistoryVisibleCount(10);
  }, [historyFilter, historyQuery, historyStatusFilter, historyDateFrom, historyDateTo]);

  // Restore sesyon an si li te sove (localStorage) — sa nesesè paske
  // verifikasyon Didit fè navigatè a kite sit la epi retounen, sa ta dekonekte
  // kliyan an si sesyon an te sèlman nan memwa. Nou tcheke tou si nou sot
  // retounen soti nan Didit (/kyc-retou) pou montre ekran konfimasyon an.
  React.useEffect(() => {
    const cameFromDidit = window.location.pathname.startsWith('/kyc-retou');
    const cameFromMoncashSuccess = window.location.pathname.startsWith('/depo-konfime');
    const cameFromMoncashFailure = window.location.pathname.startsWith('/depo-echwe');
    if (cameFromDidit || cameFromMoncashSuccess || cameFromMoncashFailure) {
      window.history.replaceState(null, '', '/');
    }
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem('blicpay_session') || 'null');
    } catch { /* done sove a domaje — inyore l */ }

    if (saved?.token && saved?.user) {
      setToken(saved.token);
      setUser(saved.user);
      setBalance(saved.user.balance);
      setView(cameFromDidit ? 'kyc' : 'dashboard');
      if (cameFromDidit) setKycStep('retou');
      loadWallet(saved.token);
      loadKycStatusSilently(saved.token);
      loadVerificationRequests(saved.token);
      loadNotifications(saved.token);
      apiFetch('/pin/status', { token: saved.token })
        .then(({ hasPin: hp }) => {
          setHasPin(hp);
          if (hp) {
            setAppLocked(true);
            setPinScreen('unlock');
          }
        })
        .catch(() => {});
      if (cameFromMoncashSuccess) {
        setTimeout(() => flash(tt("Depo MonCash ou konfime — li ajoute nan balans ou.")), 400);
      } else if (cameFromMoncashFailure) {
        setTimeout(() => flash(tt("Depo MonCash la pa t reyisi — eseye ankò."), 'error'), 400);
      }
    }
  }, []);

  const [tx, setTx] = useState([]);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [amount, setAmount] = useState('');
  const [flowKind, setFlowKind] = useState('deposit'); // 'deposit' | 'withdraw'
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [reference, setReference] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const [navToast, setNavToast] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [appLocked, setAppLocked] = useState(false);
  const [pinScreen, setPinScreen] = useState(null); // null | 'unlock' | 'withdraw' | 'setup'
  const [pinDigits, setPinDigits] = useState('');
  const [pinError, setPinError] = useState(null);
  const [pinBusy, setPinBusy] = useState(false);
  const [pendingWithdraw, setPendingWithdraw] = useState(null);
  const [pinSetupPassword, setPinSetupPassword] = useState('');
  const [solGroups, setSolGroups] = useState([]);
  const [mySolMemberships, setMySolMemberships] = useState([]);
  const [loadingSol, setLoadingSol] = useState(false);
  const [activeSolGroupId, setActiveSolGroupId] = useState(null);
  const [solSubView, setSolSubView] = useState('browse'); // 'browse' | 'mine' | 'detail' | 'documents'
  const [solJoinProcessing, setSolJoinProcessing] = useState(null);
  const [solFeeProcessing, setSolFeeProcessing] = useState(null);
  const [natcashProofScreen, setNatcashProofScreen] = useState(false);
  const [natcashTransactionId, setNatcashTransactionId] = useState('');
  const [natcashProofFile, setNatcashProofFile] = useState(null);
  const [natcashSubmitting, setNatcashSubmitting] = useState(false);
  const [natcashScanning, setNatcashScanning] = useState(false);
  const [biwoBranchScreen, setBiwoBranchScreen] = useState(false);
  const [biwoBranches, setBiwoBranches] = useState([]);
  const [biwoBranchDetails, setBiwoBranchDetails] = useState([]); // [{name, address}] pou lis biwo yo ak vrè adrès
  const [loadingBiwoBranches, setLoadingBiwoBranches] = useState(false);
  const [selectedBiwoBranch, setSelectedBiwoBranch] = useState('');
  const [destinationNumberScreen, setDestinationNumberScreen] = useState(false);
  const [destinationNumber, setDestinationNumber] = useState('');
  const [destinationName, setDestinationName] = useState('');
  const [viewingSolDocument, setViewingSolDocument] = useState(null);
  const [solFreqFilter, setSolFreqFilter] = useState('semenn');
  const [solTierFilter, setSolTierFilter] = useState('basic');
  const [transferId, setTransferId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferProcessing, setTransferProcessing] = useState(false);
  const [pockets, setPockets] = useState(initialPockets);
  const [activePocketId, setActivePocketId] = useState(null);
  const [pocketMode, setPocketMode] = useState(null); // null | 'deposit' | 'transfer' | 'spend'
  const [pocketAmount, setPocketAmount] = useState('');
  const [pocketTransferTarget, setPocketTransferTarget] = useState('main');
  const [pocketProcessing, setPocketProcessing] = useState(false);
  const [showNewPocket, setShowNewPocket] = useState(false);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addMoneyPocketId, setAddMoneyPocketId] = useState(null);
  const [addMoneyAmount, setAddMoneyAmount] = useState('');
  const [addMoneyProcessing, setAddMoneyProcessing] = useState(false);
  const [newPocketName, setNewPocketName] = useState('');
  const [newPocketTarget, setNewPocketTarget] = useState('');
  const [goalDeposits, setGoalDeposits] = useState(initialGoalDeposits);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [goalProcessing, setGoalProcessing] = useState(false);
  const [activeGoalId, setActiveGoalId] = useState(null);
  const [addGoalAmount, setAddGoalAmount] = useState('');
  const [showEmergency, setShowEmergency] = useState(false);
  const [loan, setLoan] = useState(null);
  const [newLoanAmount, setNewLoanAmount] = useState('');
  const [newLoanPlanIdx, setNewLoanPlanIdx] = useState(0);
  const [loanProcessing, setLoanProcessing] = useState(false);
  const [checkingLoan, setCheckingLoan] = useState(false);

  function flash(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }

  async function loadWallet(authToken) {
    if (authToken === DEMO_TOKEN) return; // handled directly by enterDemoMode
    setLoadingWallet(true);
    try {
      const [{ balance: bal }, { transactions }, { pockets: p }, { goals }, { loans }] = await Promise.all([
        apiFetch('/wallet/balance', { token: authToken }),
        apiFetch('/wallet/transactions', { token: authToken }),
        apiFetch('/pockets', { token: authToken }),
        apiFetch('/goals', { token: authToken }),
        apiFetch('/loans/my', { token: authToken }),
      ]);
      setBalance(bal);
      setTx(transactions.map((t) => ({
        id: t.id,
        type: t.type,
        method: methods.find((m) => m.id === t.method)?.name || t.method,
        amount: t.amount,
        status: t.status === 'confirmed' ? 'konfime' : t.status === 'rejected' ? 'rejte' : 'annatant',
        date: new Date(t.createdAt).toLocaleDateString(CURRENT_LANG === 'en' ? 'en-US' : 'fr-FR'),
      })));
      setPockets(p);
      setGoalDeposits(goals.map((g) => ({
        id: g.id, name: g.title, target: g.target, current: g.saved,
        status: g.status === 'completed' ? 'rive' : g.status === 'withdrawn' ? 'fini' : 'aktif',
      })));
      const activeLoan = loans.find((l) => l.status === 'pending' || l.status === 'active');
      setLoan(activeLoan ? {
        id: activeLoan.id, amount: activeLoan.amount, months: activeLoan.months, rate: activeLoan.rate,
        totalDue: activeLoan.totalDue, installmentAmount: activeLoan.installmentAmount,
        installments: (activeLoan.installments || []).map((i) => ({ n: i.n, amount: i.amount, status: i.status === 'paid' ? 'peye' : 'annatant' })),
        ts: Date.now(), status: activeLoan.status === 'active' ? 'aktif' : 'annatant',
      } : null);
    } catch (err) {
      flash(err.message, 'error');
    } finally {
      setLoadingWallet(false);
    }
  }

  function enterDemoMode() {
    setToken(DEMO_TOKEN);
    setUser(demoUser);
    setKycStatus('pa verifye');
    setBalance(demoUser.balance);
    setTx(demoTx);
    setProfile({
      firstName: 'Jean', lastName: 'Baptiste', email: 'jean.baptiste@example.com',
      address: '12 Ri Panamerikèn', city: 'Pòtoprens', country: 'Ayiti', department: 'Ouès',
    });
    setView('dashboard');
  }

  async function handleAuthSubmit() {
    setAuthError('');
    if (!authForm.phone.trim() || !authForm.password) {
      setAuthError(tr('errPhone'));
      return;
    }
    setAuthLoading(true);
    try {
      const { token: newToken, user: newUser } = await apiFetch('/auth/login', {
        method: 'POST',
        body: { phone: authForm.phone, password: authForm.password },
      });
      setToken(newToken);
      setUser(newUser);
      setBalance(newUser.balance);
      setView('dashboard');
      try {
        localStorage.setItem('blicpay_session', JSON.stringify({ token: newToken, user: newUser }));
      } catch { /* localStorage endispoinib — kontinye san sove sesyon an */ }
      await loadWallet(newToken);
      await loadKycStatusSilently(newToken);
      await loadVerificationRequests(newToken);
      await loadNotifications(newToken);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  function goRegisterStep(step) {
    setAuthError('');
    if (step > registerStep) {
      if (registerStep === 1) {
        if (!authForm.lastName.trim() || !authForm.firstName.trim()) { setAuthError(tr('errFullName')); return; }
        if (!authForm.phone.trim()) { setAuthError(tr('errPhone')); return; }
      }
      if (registerStep === 2) {
        if (authForm.password.length < 6) { setAuthError(tr('errPasswordShort')); return; }
        if (authForm.password !== confirmPassword) { setAuthError(tr('errPasswordMatch')); return; }
      }
    }
    setRegisterStep(step);
  }

  async function submitRegistration() {
    setAuthError('');
    if (!acceptedTerms) {
      setAuthError(tr('errTerms'));
      return;
    }
    setAuthLoading(true);
    try {
      const { token: newToken, user: newUser } = await apiFetch('/auth/register', {
        method: 'POST',
        body: { ...authForm, fullName: `${authForm.firstName} ${authForm.lastName}`.trim() },
      });
      setToken(newToken);
      setUser(newUser);
      setKycStatus('pa verifye');
      setBalance(newUser.balance);
      setProfile({
        firstName: authForm.firstName, lastName: authForm.lastName, email: authForm.email,
        address: authForm.address, city: authForm.city, country: authForm.country, department: authForm.department,
      });
      setView('dashboard');
      try {
        localStorage.setItem('blicpay_session', JSON.stringify({ token: newToken, user: newUser }));
      } catch { /* localStorage endispoinib — kontinye san sove sesyon an */ }
      await loadWallet(newToken);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
    setTx([]);
    setBalance(0);
    try {
      localStorage.removeItem('blicpay_session');
    } catch { /* pa gen anyen pou fè si localStorage pa disponib */ }
    setAuthForm({
      lastName: '', firstName: '', phone: '', email: '',
      country: '', address: '', city: '', department: '', password: '',
    });
    setConfirmPassword('');
    setRegisterStep(1);
    setAcceptedTerms(false);
    setAuthMode('login');
    setView('auth');
  }

  function startDeposit() {
    setAmount('');
    setFlowKind('deposit');
    setMethodCat(null);
    setSelectedMethod(null);
    setReference(null);
    setView('deposit');
  }

  function startWithdraw() {
    setAmount('');
    setFlowKind('withdraw');
    setMethodCat(null);
    setSelectedMethod(null);
    setReference(null);
    setView('deposit');
  }

  async function pickMethod(m) {
    // MonCash/NatCash pa disponib pou DEPO tan pou tan — kont machann yo
    // poko reyèl, sèlman retrè MonCash/NatCash ap fonksyone kounye a.
    const depositDisabled = flowKind === 'deposit' && (m.id === 'moncash' || m.id === 'natcash');
    if (m.comingSoon || depositDisabled) {
      flash(tt("{0} ap disponib byento pou depo.", m.name));
      return;
    }
    if (!amount || Number(amount) <= 0) {
      flash(tt("Antre yon montan anvan."));
      return;
    }
    if (flowKind === 'deposit' && Number(amount) < 100) {
      flash(tt("Montan minimòm pou yon depo se 100 HTG."));
      return;
    }
    if (flowKind === 'withdraw' && Number(amount) < 250) {
      flash(tt("Montan minimòm pou yon retrè se 250 HTG."));
      return;
    }

    if (m.id === 'biwo') {
      setSelectedMethod(m);
      setSelectedBiwoBranch('');
      setBiwoBranchScreen(true);
      if (biwoBranches.length === 0) {
        setLoadingBiwoBranches(true);
        try {
          const { branches, branchDetails } = await apiFetch('/branches', { token });
          setBiwoBranches(branches);
          setBiwoBranchDetails(branchDetails || []);
        } catch (err) {
          flash(err.message || tt("Nou pa t ka chaje lis siikisal yo."), 'error');
        } finally {
          setLoadingBiwoBranches(false);
        }
      }
      return;
    }

    if (flowKind === 'withdraw' && (m.id === 'moncash' || m.id === 'natcash')) {
      if (Number(amount) > balance) {
        flash(tt("Ou pa gen ase lajan pou retrè sa a."));
        return;
      }
      setSelectedMethod(m);
      setDestinationNumber('');
      setDestinationName('');
      setDestinationNumberScreen(true);
      return;
    }

    if (flowKind === 'withdraw') {
      if (Number(amount) > balance) {
        flash(tt("Ou pa gen ase lajan pou retrè sa a."));
        return;
      }
      setSelectedMethod(m);
      setProcessing(true);
      try {
        const { fee } = await apiFetch(`/withdrawals/fee-preview?amount=${Number(amount)}`, { token });
        setPendingWithdraw({ amount: Number(amount), method: m, fee });
        setPinDigits('');
        setPinError(null);
        setPinScreen(hasPin ? 'withdraw' : 'setup');
      } catch (err) {
        flash(err.message || tt("Nou pa t ka kalkile frè a."), 'error');
      } finally {
        setProcessing(false);
      }
      return;
    }

    setSelectedMethod(m);
    setReference(null);

    if (flowKind === 'deposit' && m.id === 'moncash') {
      setProcessing(true);
      try {
        const { paymentUrl } = await apiFetch('/deposits/moncash/start', {
          method: 'POST',
          token,
          body: { amount: Number(amount) },
        });
        window.location.href = paymentUrl;
      } catch (err) {
        flash(err.message || tt("Nou pa t ka kòmanse peman MonCash la."), 'error');
        setProcessing(false);
      }
      return;
    }

    if (flowKind === 'deposit' && m.id === 'natcash') {
      setNatcashTransactionId('');
      setNatcashProofFile(null);
      setNatcashProofScreen(true);
      return;
    }

    setProcessing(true);
    try {
      if (token === DEMO_TOKEN) {
        await new Promise((r) => setTimeout(r, 700));
        const fakeRef = 'SOL-DEMO' + Math.floor(Math.random() * 9000 + 1000);
        setReference(fakeRef);
        setTx((t) => [{ id: 'demo-' + Date.now(), method: m.name, amount: Number(amount), ts: Date.now(), status: 'annatant', date: 'jodi a' }, ...t]);
        setView('confirm');
        return;
      }
      const { deposit } = await apiFetch('/deposits', {
        method: 'POST',
        token,
        body: { amount: Number(amount), method: m.id },
      });
      setReference(deposit.reference);
      setTx((t) => [{
        id: deposit.id,
        method: m.name,
        amount: deposit.amount,
        ts: Date.now(), status: 'annatant',
        date: 'jodi a',
      }, ...t]);
      setView('confirm');
    } catch (err) {
      flash(err.message, 'error');
    } finally {
      setProcessing(false);
    }
  }

  // Kliyan an fin chwazi siikisal la — kontinye selon si se yon depo (kreye
  // demand lan tousuit) oswa yon retrè (montre ekran PIN ak frè a).
  // Kliyan an fin bay nimewo kote pou voye lajan an — kontinye nan ekran PIN
  // an, tankou yon retrè nòmal, men ak nimewo a anrejistre pou admin/ajan an.
  async function confirmDestinationNumber() {
    if (!destinationNumber.trim()) {
      flash(tt("Antre nimewo a."));
      return;
    }
    if (!destinationName.trim()) {
      flash(tt("Antre non ki sou kont lan."));
      return;
    }
    setProcessing(true);
    try {
      const { fee } = await apiFetch(`/withdrawals/fee-preview?amount=${Number(amount)}`, { token });
      setPendingWithdraw({ amount: Number(amount), method: selectedMethod, fee, destinationNumber: destinationNumber.trim(), destinationName: destinationName.trim() });
      setPinDigits('');
      setPinError(null);
      setDestinationNumberScreen(false);
      setPinScreen(hasPin ? 'withdraw' : 'setup');
    } catch (err) {
      flash(err.message || tt("Nou pa t ka kalkile frè a."), 'error');
    } finally {
      setProcessing(false);
    }
  }

  async function confirmBiwoBranch() {
    if (!selectedBiwoBranch) {
      flash(tt("Chwazi yon siikisal."));
      return;
    }

    if (flowKind === 'withdraw') {
      setProcessing(true);
      try {
        const { fee } = await apiFetch(`/withdrawals/fee-preview?amount=${Number(amount)}`, { token });
        setPendingWithdraw({ amount: Number(amount), method: selectedMethod, fee, branch: selectedBiwoBranch });
        setPinDigits('');
        setPinError(null);
        setBiwoBranchScreen(false);
        setPinScreen(hasPin ? 'withdraw' : 'setup');
      } catch (err) {
        flash(err.message || tt("Nou pa t ka kalkile frè a."), 'error');
      } finally {
        setProcessing(false);
      }
      return;
    }

    setProcessing(true);
    try {
      const { deposit } = await apiFetch('/deposits', {
        method: 'POST',
        token,
        body: { amount: Number(amount), method: 'biwo', branch: selectedBiwoBranch },
      });
      setReference(deposit.reference);
      setTx((t) => [{ id: deposit.id, method: selectedMethod.name, amount: deposit.amount, ts: Date.now(), status: 'annatant', date: 'jodi a' }, ...t]);
      setBiwoBranchScreen(false);
      setView('confirm');
    } catch (err) {
      flash(err.message || tt("Nou pa t ka soumèt demand lan."), 'error');
    } finally {
      setProcessing(false);
    }
  }

  // Konvèti foto resi a an base64 epi soumèt li ansanm ak montan/ID
  // tranzaksyon an. Backend la fè verifikasyon OCR AVAN li kreye depo a —
  // si ID la pa koresponn ak sa ki nan resi a, demand lan BLOKE net.
  // Lè kliyan an chwazi foto a, nou eskane l tousuit pou pwopoze ID ak
  // montan an otomatikman — li ka toujou korije yo anvan li soumèt.
  async function onNatcashFileSelected(file) {
    setNatcashProofFile(file);
    if (!file) return;

    setNatcashScanning(true);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = () => reject(new Error(tt("Nou pa t ka li foto a.")));
        reader.readAsDataURL(file);
      });

      const { suggestedTransactionId, suggestedAmount } = await apiFetch('/deposits/natcash/scan', {
        method: 'POST',
        token,
        body: { proofImage: base64, proofMimeType: file.type },
      });

      if (suggestedTransactionId) setNatcashTransactionId(suggestedTransactionId);
      if (suggestedAmount) setAmount(String(suggestedAmount));
    } catch (err) {
      // Echèk otomatik la pa grav — kliyan an ka toujou ranpli chan yo alamen.
    } finally {
      setNatcashScanning(false);
    }
  }

  async function submitNatcashDeposit() {
    if (!natcashTransactionId.trim()) {
      flash(tt("Antre ID tranzaksyon an."));
      return;
    }
    if (!natcashProofFile) {
      flash(tt("Ajoute yon foto resi a."));
      return;
    }
    setNatcashSubmitting(true);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = () => reject(new Error(tt("Nou pa t ka li foto a.")));
        reader.readAsDataURL(natcashProofFile);
      });

      const { deposit } = await apiFetch('/deposits/natcash', {
        method: 'POST',
        token,
        body: {
          amount: Number(amount),
          transactionId: natcashTransactionId.trim(),
          proofImage: base64,
          proofMimeType: natcashProofFile.type,
        },
      });

      setSelectedMethod(methods.find((m) => m.id === 'natcash'));
      setReference(deposit.reference);
      setTx((t) => [{ id: deposit.id, method: 'NatCash', amount: deposit.amount, ts: Date.now(), status: 'annatant', date: 'jodi a' }, ...t]);
      setNatcashProofScreen(false);
      setView('confirm');
    } catch (err) {
      flash(err.message || tt("Nou pa t ka soumèt depo a."), 'error');
    } finally {
      setNatcashSubmitting(false);
    }
  }

  // Ekran PIN nan itilize pou 3 bagay: reverouye app la (kliyan deja gen
  // sesyon), konfime yon retrè (kliyan deja gen yon PIN), oswa kreye premye
  // PIN la (kliyan poko gen youn, nesesè anvan premye retrè li).
  function pinDigitPress(d) {
    if (pinBusy || pinDigits.length >= 4) return;
    const next = pinDigits + d;
    setPinDigits(next);
    setPinError(null);
    if (next.length === 4) submitPin(next);
  }

  function pinBackspace() {
    if (pinBusy) return;
    setPinDigits((d) => d.slice(0, -1));
  }

  async function submitPin(pin) {
    setPinBusy(true);
    try {
      if (pinScreen === 'unlock') {
        await apiFetch('/pin/verify', { method: 'POST', token, body: { pin } });
        setAppLocked(false);
        setPinScreen(null);
        setPinDigits('');
      } else if (pinScreen === 'withdraw' && pendingWithdraw) {
        const { withdrawal } = await apiFetch('/withdrawals', {
          method: 'POST',
          token,
          body: { amount: pendingWithdraw.amount, method: pendingWithdraw.method.id, pin, branch: pendingWithdraw.branch, destinationNumber: pendingWithdraw.destinationNumber, destinationName: pendingWithdraw.destinationName },
        });
        setReference(withdrawal.reference);
        setBalance((b) => b - withdrawal.amount - (withdrawal.fee || 0));
        setTx((t) => [{ id: withdrawal.id, method: pendingWithdraw.method.name, amount: withdrawal.amount, fee: withdrawal.fee, ts: Date.now(), status: 'annatant', date: 'jodi a', type: 'retrè' }, ...t]);
        setPinScreen(null);
        setPinDigits('');
        setPendingWithdraw(null);
        setView('confirm');
      } else {
        // Cas imprévu : ne devrait jamais arriver — mais si ça arrive,
        // on le signale au lieu de rester silencieux.
        console.error('submitPin appelé avec un état inattendu:', { pinScreen, pendingWithdraw });
        setPinError(tt("Yon bagay pa mache. Eseye fèmen epi louvri app la ankò."));
        setPinDigits('');
      }
    } catch (err) {
      setPinError(err.message || tt("Kòd PIN la pa kòrèk."));
      setPinDigits('');
    } finally {
      setPinBusy(false);
    }
  }

  async function submitPinSetup() {
    if (!pinSetupPassword) {
      setPinError(tt("Antre modpas kont ou pou konfime."));
      return;
    }
    if (pinDigits.length !== 4) {
      setPinError(tt("Kòd PIN la dwe gen 4 chif."));
      return;
    }
    setPinBusy(true);
    try {
      await apiFetch('/pin/set', { method: 'POST', token, body: { password: pinSetupPassword, pin: pinDigits } });
      setHasPin(true);
      setPinSetupPassword('');
      if (pendingWithdraw) {
        // Sèvi ak menm PIN la kliyan sot kreye a pou konfime retrè k ap tann lan.
        const pinToUse = pinDigits;
        setPinDigits('');
        setPinScreen('withdraw');
        await submitPin(pinToUse);
      } else {
        setPinScreen(null);
        setPinDigits('');
        flash(tt("Kòd PIN ou kreye."));
      }
    } catch (err) {
      setPinError(err.message || tt("Nou pa t ka kreye PIN la."));
    } finally {
      setPinBusy(false);
    }
  }

  function cancelPinScreen() {
    setPinScreen(null);
    setPinDigits('');
    setPinError(null);
    setPinSetupPassword('');
    setPendingWithdraw(null);
    // Si on annule un écran de déverrouillage, il faut aussi déverrouiller,
    // sinon l'app reste bloquée avec appLocked=true et pinScreen=null.
    if (appLocked) setAppLocked(false);
  }

  async function sendTransfer() {
    if (!transferId.trim()) {
      flash(tt("Antre ID kliyan k ap resevwa a."));
      return;
    }
    if (!transferAmount || Number(transferAmount) <= 0) {
      flash(tt("Antre yon montan valab."));
      return;
    }
    if (Number(transferAmount) > balance) {
      flash(tt("Ou pa gen ase lajan pou transfè sa a."));
      return;
    }
    setTransferProcessing(true);
    try {
      await apiFetch('/transfers', {
        method: 'POST',
        token,
        body: { clientId: transferId.trim(), amount: Number(transferAmount) },
      });
      setBalance((b) => b - Number(transferAmount));
      setTx((t) => [{
        id: 'tr-' + Date.now(),
        method: tt("Transfè bay {0}", transferId),
        amount: Number(transferAmount),
        ts: Date.now(), status: 'konfime',
        date: 'jodi a',
        type: 'transfè',
      }, ...t]);
      flash(tt("Transfè a fèt."));
      setTransferId('');
      setTransferAmount('');
      setView('dashboard');
    } catch (err) {
      flash(err.message, 'error');
    } finally {
      setTransferProcessing(false);
    }
  }

  function openPocket(id) {
    setActivePocketId(id);
    setPocketMode(null);
    setPocketAmount('');
    setPocketTransferTarget('main');
    setView('blicdepo-detail');
  }

  function createPocket() {
    if (!newPocketName.trim()) {
      flash(tt("Bay pòch la yon non."));
      return;
    }
    apiFetch('/pockets', {
      method: 'POST',
      token,
      body: { name: newPocketName.trim(), target: newPocketTarget ? Number(newPocketTarget) : null },
    }).then(({ pocket }) => {
      setPockets((ps) => [...ps, pocket]);
      setNewPocketName('');
      setNewPocketTarget('');
      setShowNewPocket(false);
      flash(tt("Pòch la kreye."));
    }).catch((err) => flash(err.message, 'error'));
  }

  async function addMoneyToPocket() {
    const amt = Number(addMoneyAmount);
    const pocket = pockets.find((p) => p.id === addMoneyPocketId);
    if (!pocket) {
      flash(tt("Chwazi yon pòch."));
      return;
    }
    if (!amt || amt <= 0) {
      flash(tt("Antre yon montan valab."));
      return;
    }
    if (amt > balance) {
      flash(tt("Ou pa gen ase nan kont prensipal la."));
      return;
    }
    setAddMoneyProcessing(true);
    try {
      const { pocket: updated } = await apiFetch(`/pockets/${pocket.id}/deposit`, { method: 'POST', token, body: { amount: amt } });
      setBalance((b) => b - amt);
      setPockets((ps) => ps.map((p) => p.id === pocket.id ? updated : p));
      setTx((t) => [{ id: 'pk-' + Date.now(), method: tt("Epay nan {0}", pocket.name), amount: amt, ts: Date.now(), status: 'konfime', date: nowLabel(), type: 'transfè', pocketId: pocket.id, kind: 'epay' }, ...t]);
      setAddMoneyAmount('');
      setShowAddMoney(false);
      flash(tt("Lajan an ajoute nan pòch la."));
    } catch (err) {
      flash(err.message, 'error');
    } finally {
      setAddMoneyProcessing(false);
    }
  }

  function createGoalDeposit() {
    if (!newGoalName.trim()) {
      flash(tt("Bay objektif la yon non."));
      return;
    }
    if (!newGoalTarget || Number(newGoalTarget) <= 0) {
      flash(tt("Antre yon montan objektif valab."));
      return;
    }
    apiFetch('/goals', {
      method: 'POST',
      token,
      body: { title: newGoalName.trim(), target: Number(newGoalTarget) },
    }).then(({ goal }) => {
      setGoalDeposits((list) => [{ id: goal.id, name: goal.title, target: goal.target, current: goal.saved, status: goal.status === 'completed' ? 'rive' : 'aktif' }, ...list]);
      setNewGoalName('');
      setNewGoalTarget('');
      setView('termdepo');
      flash(tt("Objektif kreye."));
    }).catch((err) => flash(err.message, 'error'));
  }

  function openGoal(id) {
    setActiveGoalId(id);
    setAddGoalAmount('');
    setShowEmergency(false);
    setView('termdepo-detail');
  }

  async function addToGoal() {
    const amt = Number(addGoalAmount);
    const gd = goalDeposits.find((g) => g.id === activeGoalId);
    if (!gd) return;
    if (!amt || amt <= 0) {
      flash(tt("Antre yon montan valab."));
      return;
    }
    if (amt > balance) {
      flash(tt("Ou pa gen ase nan kont prensipal la."));
      return;
    }
    setGoalProcessing(true);
    try {
      const { goal } = await apiFetch(`/goals/${gd.id}/deposit`, { method: 'POST', token, body: { amount: amt } });
      setBalance((b) => b - amt);
      const reached = goal.status === 'completed';
      setGoalDeposits((list) => list.map((g) => g.id === gd.id
        ? { ...g, current: goal.saved, status: reached ? 'rive' : 'aktif' }
        : g));
      setTx((t) => [{
        id: 'gd-tx-' + Date.now(), method: tt("Depo Ak Objektif — {0}", gd.name), amount: amt,
        ts: Date.now(), status: 'konfime', date: nowLabel(), type: 'transfè',
      }, ...t]);
      setAddGoalAmount('');
      flash(reached ? tt("Objektif la atenn! Ou ka retire lajan an kounye a.") : tt("Lajan an ajoute nan objektif la."));
    } catch (err) {
      flash(err.message, 'error');
    } finally {
      setGoalProcessing(false);
    }
  }

  async function withdrawGoal(id) {
    const gd = goalDeposits.find((g) => g.id === id);
    if (!gd || gd.status !== 'rive') return;
    setGoalProcessing(true);
    try {
      const { goal } = await apiFetch(`/goals/${id}/withdraw`, { method: 'POST', token, body: {} });
      setBalance((b) => b + gd.current);
      setGoalDeposits((list) => list.filter((g) => g.id !== id));
      setTx((t) => [{
        id: 'gd-out-' + Date.now(), method: tt("Objektif fini — {0}", gd.name), amount: gd.current,
        ts: Date.now(), status: 'konfime', date: nowLabel(), type: 'depo',
      }, ...t]);
      setView('termdepo');
      flash(tt("Lajan an tounen nan kont prensipal ou."));
    } catch (err) {
      flash(err.message, 'error');
    } finally {
      setGoalProcessing(false);
    }
  }

  const EMERGENCY_FEE_RATE = 0.045;

  async function emergencyWithdrawGoal(id) {
    const gd = goalDeposits.find((g) => g.id === id);
    if (!gd || gd.current <= 0) return;
    setGoalProcessing(true);
    try {
      const { fee, net } = await apiFetch(`/goals/${id}/withdraw`, { method: 'POST', token, body: { emergency: true } });
      setBalance((b) => b + net);
      setGoalDeposits((list) => list.filter((g) => g.id !== id));
      setTx((t) => [{
        id: 'gd-em-' + Date.now(), method: tt("Retrè ijans — {0} (frè 4.5%)", gd.name), amount: net,
        ts: Date.now(), status: 'konfime', date: nowLabel(), type: 'depo',
      }, ...t]);
      setShowEmergency(false);
      setView('termdepo');
      flash(tt("Retrè ijans fèt — {0} kenbe kòm frè.", money(fee)));
    } catch (err) {
      flash(err.message, 'error');
    } finally {
      setGoalProcessing(false);
    }
  }

  async function requestLoan() {
    const amt = Number(newLoanAmount);
    if (!amt || amt <= 0) {
      flash(tt("Antre yon montan valab."));
      return;
    }
    setLoanProcessing(true);
    try {
      const { loan: created } = await apiFetch('/loans/request', {
        method: 'POST', token, body: { amount: amt, planIdx: newLoanPlanIdx },
      });
      setLoan({
        id: created.id,
        amount: created.amount,
        months: created.months,
        rate: created.rate,
        totalDue: created.totalDue,
        installmentAmount: created.installmentAmount,
        installments: [],
        ts: Date.now(), status: 'annatant',
      });
      setNewLoanAmount('');
      setView('loan');
      flash(tt("Demand prè a voye — n ap egzamine li."));
    } catch (err) {
      flash(err.message, 'error');
    } finally {
      setLoanProcessing(false);
    }
  }

  // Verifye vre estati prè a bò kote sèvè a — okenn admin ki apwouve l pa
  // vle di li otomatikman aktif; nou jis li estati reyèl la.
  async function checkLoanStatus() {
    if (!loan || loan.status !== 'annatant') return;
    setCheckingLoan(true);
    try {
      const { loans } = await apiFetch('/loans/my', { token });
      const fresh = loans.find((l) => l.id === loan.id);
      if (!fresh) { setCheckingLoan(false); return; }
      if (fresh.status === 'active' && loan.status !== 'active') {
        setBalance((b) => b + loan.amount);
        setTx((t) => [{
          id: 'ln-tx-' + Date.now(), method: tt("Prè apwouve"), amount: loan.amount,
          ts: Date.now(), status: 'konfime', date: nowLabel(), type: 'depo',
        }, ...t]);
        flash(tt("Prè a apwouve — lajan an nan kont ou."));
      } else if (fresh.status === 'rejected') {
        flash(tt("Demand prè a refize."));
      } else {
        flash(tt("Pa gen chanjman — l ap tann toujou."));
      }
      setLoan((l) => ({
        ...l,
        status: fresh.status === 'active' ? 'aktif' : fresh.status === 'rejected' ? 'refize' : 'annatant',
        installments: (fresh.installments || []).map((i) => ({ n: i.n, amount: i.amount, status: i.status === 'paid' ? 'peye' : 'annatant', ts: Date.now() })),
      }));
    } catch (err) {
      flash(err.message, 'error');
    } finally {
      setCheckingLoan(false);
    }
  }

  async function payLoanInstallment() {
    if (!loan) return;
    const next = loan.installments.find((i) => i.status === 'annatant');
    if (!next) return;
    if (next.amount > balance) {
      flash(tt("Ou pa gen ase nan kont prensipal la pou vèsman sa a."));
      return;
    }
    setLoanProcessing(true);
    try {
      const { finished } = await apiFetch(`/loans/${loan.id}/pay-installment`, { method: 'POST', token, body: {} });
      setBalance((b) => b - next.amount);
      setTx((t) => [{
        id: 'ln-pay-' + Date.now(), method: tt("Vèsman prè {0}/{1}", next.n, loan.months), amount: next.amount,
        ts: Date.now(), status: 'konfime', date: nowLabel(), type: 'retrè',
      }, ...t]);
      setLoan((l) => {
        const updated = {
          ...l,
          installments: l.installments.map((i) => i.n === next.n ? { ...i, status: 'peye' } : i),
        };
        updated.status = finished ? 'fini' : 'aktif';
        return updated;
      });
      flash(finished ? tt("Prè a peye nèt!") : tt("Vèsman anrejistre."));
    } catch (err) {
      flash(err.message, 'error');
    } finally {
      setLoanProcessing(false);
    }
  }

  async function confirmPocketAction() {
    const amt = Number(pocketAmount);
    const pocket = pockets.find((p) => p.id === activePocketId);
    if (!pocket) return;
    if (!amt || amt <= 0) {
      flash(tt("Antre yon montan valab."));
      return;
    }

    setPocketProcessing(true);
    try {
      if (pocketMode === 'deposit') {
        if (amt > balance) { flash(tt("Ou pa gen ase nan kont prensipal la.")); setPocketProcessing(false); return; }
        const { pocket: updated } = await apiFetch(`/pockets/${pocket.id}/deposit`, { method: 'POST', token, body: { amount: amt } });
        setBalance((b) => b - amt);
        setPockets((ps) => ps.map((p) => p.id === activePocketId ? updated : p));
        setTx((t) => [{ id: 'pk-' + Date.now(), method: tt("Epay nan {0}", pocket.name), amount: amt, ts: Date.now(), status: 'konfime', date: nowLabel(), type: 'transfè', pocketId: pocket.id, kind: 'epay' }, ...t]);
        flash(tt("Lajan an mete nan pòch la."));
      } else if (pocketMode === 'spend') {
        if (amt > pocket.balance) { flash(tt("Pa gen ase lajan nan pòch sa a.")); setPocketProcessing(false); return; }
        const { pocket: updated } = await apiFetch(`/pockets/${pocket.id}/spend`, { method: 'POST', token, body: { amount: amt } });
        setPockets((ps) => ps.map((p) => p.id === activePocketId ? updated : p));
        setTx((t) => [{ id: 'pk-' + Date.now(), method: tt("Retrè soti nan {0}", pocket.name), amount: amt, ts: Date.now(), status: 'konfime', date: nowLabel(), type: 'retrè', pocketId: pocket.id, kind: 'depanse' }, ...t]);
        flash(tt("Depans anrejistre."));
      } else if (pocketMode === 'transfer') {
        if (amt > pocket.balance) { flash(tt("Pa gen ase lajan nan pòch sa a.")); setPocketProcessing(false); return; }
        const { pocket: updated } = await apiFetch(`/pockets/${pocket.id}/transfer`, { method: 'POST', token, body: { amount: amt, to: pocketTransferTarget } });
        if (pocketTransferTarget === 'main') {
          setBalance((b) => b + amt);
          setPockets((ps) => ps.map((p) => p.id === activePocketId ? updated : p));
          setTx((t) => [{ id: 'pk-' + Date.now(), method: tt("Transfè soti nan {0} bay Kont prensipal", pocket.name), amount: amt, ts: Date.now(), status: 'konfime', date: nowLabel(), type: 'depo', pocketId: pocket.id, kind: 'transfè-soti' }, ...t]);
        } else {
          const destName = pockets.find((p) => p.id === pocketTransferTarget)?.name;
          setPockets((ps) => ps.map((p) => {
            if (p.id === activePocketId) return updated;
            if (p.id === pocketTransferTarget) return { ...p, balance: p.balance + amt };
            return p;
          }));
          setTx((t) => [
            { id: 'pk-' + Date.now(), method: tt("Transfè soti nan {0} bay {1}", pocket.name, destName), amount: amt, ts: Date.now(), status: 'konfime', date: nowLabel(), type: 'transfè', pocketId: pocket.id, kind: 'transfè-soti' },
            { id: 'pk-' + Date.now() + '-r', method: tt("Transfè resevwa soti nan {0}", pocket.name), amount: amt, ts: Date.now(), status: 'konfime', date: nowLabel(), type: 'depo', pocketId: pocketTransferTarget, kind: 'transfè-antre' },
            ...t,
          ]);
        }
        flash(tt("Transfè fèt."));
      }
      setPocketMode(null);
      setPocketAmount('');
    } catch (err) {
      flash(err.message, 'error');
    } finally {
      setPocketProcessing(false);
    }
  }

  function openEditProfile() {
    setProfileForm({ ...profile, phone: user?.phone || '' });
    setView('editprofile');
  }

  async function saveProfile() {
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      flash(tr('errFullName'));
      return;
    }
    setProfileSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    const fullName = `${profileForm.firstName} ${profileForm.lastName}`.trim();
    setUser((u) => ({ ...u, fullName, phone: profileForm.phone }));
    setProfile({
      firstName: profileForm.firstName, lastName: profileForm.lastName, email: profileForm.email,
      address: profileForm.address, city: profileForm.city, country: profileForm.country, department: profileForm.department,
    });
    setProfileSaving(false);
    setView('settings');
    flash(tt("Pwofil ou mizajou."));
  }

  async function submitChangePassword() {
    setPwError('');
    if (!pwForm.current) {
      setPwError(tr('errCurrentPassword'));
      return;
    }
    if (pwForm.next.length < 6) {
      setPwError(tr('errPasswordShort'));
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError(tr('errPasswordMatch'));
      return;
    }
    setPwSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setPwSaving(false);
    setPwForm({ current: '', next: '', confirm: '' });
    setView('settings');
    flash(tr('pwChangedMsg'));
  }

  async function submitSupportMessage() {
    if (!supportSubject) {
      flash(tr('errSubject'));
      return;
    }
    if (!supportMessage.trim()) {
      flash(tr('errMessage'));
      return;
    }
    setSupportSending(true);
    try {
      await apiFetch('/support', {
        method: 'POST', token, body: { subject: supportSubject, message: supportMessage.trim() },
      });
      setSupportSent(true);
      setSupportSubject('');
      setSupportMessage('');
      flash(tr('supportSentMsg'));
    } catch (err) {
      flash(err.message || tt("Nou pa t ka voye mesaj ou a."), 'error');
    } finally {
      setSupportSending(false);
    }
  }

  async function sendResetCode() {
    setForgotError('');
    if (!forgotPhone.trim()) {
      setForgotError(tr('errPhone'));
      return;
    }
    setForgotSending(true);
    await new Promise((r) => setTimeout(r, 800));
    setForgotSending(false);
    setForgotStep(2);
    flash(tr('sendCodeBtn') + ' ✓');
  }

  async function resetPassword() {
    setForgotError('');
    if (!forgotCode.trim()) {
      setForgotError(tr('errCode'));
      return;
    }
    if (forgotNewPassword.length < 6) {
      setForgotError(tr('errPasswordShort'));
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError(tr('errPasswordMatch'));
      return;
    }
    setForgotSending(true);
    await new Promise((r) => setTimeout(r, 800));
    setForgotSending(false);
    setForgotDone(true);
    flash(tr('resetSuccessMsg'));
  }

  function closeForgotPassword() {
    setView('auth');
    setAuthMode('login');
    setForgotStep(1);
    setForgotPhone('');
    setForgotCode('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotError('');
    setForgotDone(false);
  }

  async function startDiditVerification() {
    setKycSubmitting(true);
    try {
      const data = await apiFetch('/kyc/didit/start', { method: 'POST', token });
      // Sove sesyon an anvan n ale — nou bezwen l toujou la lè Didit voye
      // kliyan an retounen sou sit la (wè restorasyon sesyon nan useEffect pi wo).
      try {
        localStorage.setItem('blicpay_session', JSON.stringify({ token, user }));
      } catch { /* pa gen anyen pou fè si localStorage pa disponib */ }
      window.location.href = data.url;
    } catch (e) {
      console.error('Didit start error:', e);
      flash(e.message || tt("Nou pa t ka kòmanse verifikasyon an. Eseye ankò."), 'error');
      setKycSubmitting(false);
    }
  }

  // Chaje estati KYC an silans — sèvi apre konneksyon oswa restorasyon sesyon,
  // san mesaj flash paske se pa yon aksyon kliyan te mande dirèkteman.
  async function loadKycStatusSilently(tok) {
    try {
      const data = await apiFetch('/kyc/didit/status', { token: tok });
      const s = data.verification?.status;
      setKycStatus(s === 'approved' ? 'verifye' : s === 'pending' ? 'annatant' : 'pa verifye');
      // "verified" a soti nan kont lan (badge PÈMANAN) — pa mele l ak estati
      // dènye demand lan, ki ka retounen 'annatant' menm apre yon kont deja apwouve.
      setAccountVerified(!!data.verified);
    } catch (e) {
      console.error('KYC status load error:', e);
      // Kite estati a jan li te ye a olye fè kliyan an panse li bezwen resoumèt.
    }
  }

  // Demand SIPLEMANTÈ yon admin ka kreye pou YON kliyan presizeman (prèv
  // adrès, revni, oswa mande l refè verifikasyon idantite a) — endepandan
  // de badge KYC prensipal la (accountVerified pa chanje pou sa a).
  async function loadVerificationRequests(tok) {
    try {
      const data = await apiFetch('/verification-requests', { token: tok });
      setVerificationRequests(data.requests || []);
    } catch (e) {
      console.error('Verification requests load error:', e);
    }
  }

  async function submitVerificationRequest(id, file) {
    setVrBusy(true);
    setVrError('');
    try {
      let fileData = null;
      let fileMimeType = null;
      if (file) {
        const dataUrl = file.type?.startsWith('image/')
          ? await compressImageFile(file)
          : await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onerror = () => reject(new Error(tt("Nou pa t ka li fichye a.")));
              reader.onload = () => resolve(reader.result);
              reader.readAsDataURL(file);
            });
        const [mime, base64] = splitDataUrl(dataUrl);
        fileMimeType = mime;
        fileData = base64;
      }
      await apiFetch(`/verification-requests/${id}/submit`, {
        method: 'POST', token, body: { fileData, fileMimeType },
      });
      setVrActive(null);
      flash(tt("Dokiman ou voye — n ap egzamine l."));
      await loadVerificationRequests(token);
    } catch (e) {
      setVrError(e.message || tt("Nou pa t ka voye dokiman an."));
    } finally {
      setVrBusy(false);
    }
  }

  async function loadNotifications(tok = token) {
    try {
      const data = await apiFetch('/notifications', { token: tok });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (e) {
      console.error('Notifications load error:', e);
    }
  }

  async function openNotifPanel() {
    const next = !showNotifPanel;
    setShowNotifPanel(next);
    if (next) {
      await loadNotifications();
      if (unreadCount > 0) {
        try {
          await apiFetch('/notifications/read-all', { method: 'PATCH', token });
          setUnreadCount(0);
          setNotifications((ns) => ns.map((n) => ({ ...n, read: true })));
        } catch (e) {
          console.error('Notifications read-all error:', e);
        }
      }
    }
  }

  function timeAgo(dateStr) {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return tt("kounye a");
    if (mins < 60) return tt("sa gen {0} min", mins);
    const hours = Math.floor(mins / 60);
    if (hours < 24) return tt("sa gen {0}h", hours);
    const days = Math.floor(hours / 24);
    return tt("sa gen {0}j", days);
  }

  async function checkKycStatus() {
    setRefreshing(true);
    try {
      const data = await apiFetch('/kyc/didit/status', { token });
      const s = data.verification?.status;
      setKycStatus(s === 'approved' ? 'verifye' : s === 'pending' ? 'annatant' : 'pa verifye');
      setAccountVerified(!!data.verified);
      if (data.verified) flash(tt("Kont ou verifye kounye a."));
      else if (s === 'rejected') flash(data.verification?.rejectionReason || tt("Demand verifikasyon w refize — eseye ankò."), 'error');
      else flash(tt("Pa gen chanjman."), 'info');
    } catch (e) {
      flash(e.message || tt("Nou pa t ka verifye estati a."), 'error');
    } finally {
      setRefreshing(false);
    }
  }

  async function refreshTransactions() {
    setRefreshing(true);
    try {
      const previouslyPending = tx.filter((t) => t.status === 'annatant').length;
      if (token === DEMO_TOKEN) {
        await new Promise((r) => setTimeout(r, 700));
        if (previouslyPending === 0) {
          flash(tt("Pa gen nouvo chanjman."));
        } else {
          let confirmedAmount = 0;
          setTx((list) => list.map((t) => {
            if (t.status === 'annatant') { confirmedAmount += t.amount; return { ...t, status: 'konfime' }; }
            return t;
          }));
          setBalance((b) => b + confirmedAmount);
          flash(tt("Estati depo yo mizajou."));
        }
        return;
      }
      await loadWallet(token);
      if (previouslyPending === 0) {
        flash(tt("Pa gen nouvo chanjman."));
      } else {
        flash(tt("Estati depo yo mizajou."));
      }
    } catch (err) {
      flash(err.message, 'error');
    } finally {
      setRefreshing(false);
    }
  }

  async function loadSolGroups() {
    setLoadingSol(true);
    try {
      const { groups } = await apiFetch('/sol/groups', { token });
      setSolGroups(groups);
    } catch (e) {
      flash(e.message || tt("Nou pa t ka chaje gwoup Sòl yo."), 'error');
    } finally {
      setLoadingSol(false);
    }
  }

  async function loadMySol() {
    try {
      const { memberships } = await apiFetch('/sol/my', { token });
      setMySolMemberships(memberships);
    } catch (e) {
      flash(e.message || tt("Nou pa t ka chaje Sòl ou yo."), 'error');
    }
  }

  async function requestJoinSol(gid) {
    setSolJoinProcessing(gid);
    try {
      await apiFetch(`/sol/groups/${gid}/request`, { method: 'POST', token });
      flash(tt("Demand ou voye — peye frè entegrasyon an kounye a pou admin ka egzamine l."));
      await Promise.all([loadSolGroups(), loadMySol()]);
      // Voye kliyan an dirèkteman kote bouton "peye frè a" ye a — pa kite l
      // sou paj gwoup yo ak sèlman yon mesaj k ap disparèt pou l sonje pita.
      setSolSubView('mine');
    } catch (e) {
      flash(e.message || tt("Nou pa t ka voye demand lan."), 'error');
    } finally {
      setSolJoinProcessing(null);
    }
  }

  async function payIntegrationFee(membershipId) {
    setSolFeeProcessing(membershipId);
    try {
      const { fee } = await apiFetch(`/sol/memberships/${membershipId}/pay-integration-fee`, { method: 'POST', token });
      setBalance((b) => b - fee);
      flash(tt("Frè entegrasyon peye — n ap tann admin apwouve demand ou."));
      await loadMySol();
    } catch (e) {
      flash(e.message || tt("Nou pa t ka trete peman an."), 'error');
    } finally {
      setSolFeeProcessing(null);
    }
  }

  function openSolDetail(gid) {
    setActiveSolGroupId(gid);
    setSolSubView('detail');
  }

  async function openSolSection() {
    setView('sol');
    setSolSubView(mySolMemberships.length > 0 ? 'mine' : 'browse');
    await Promise.all([loadSolGroups(), loadMySol()]);
  }

  async function openSolDocuments() {
    setSolSubView('documents');
    await loadMySol();
  }

  async function viewSolDocument(docId) {
    try {
      const { document: doc } = await apiFetch(`/sol/documents/${docId}`, { token });
      setViewingSolDocument(doc);
    } catch (e) {
      flash(e.message || tt("Nou pa t ka chaje dokiman an."), 'error');
    }
  }

  const userSolMembership = mySolMemberships.find((m) => m.groupId === activeSolGroupId || m.group?.id === activeSolGroupId);
  const userSolGroup = userSolMembership?.group || solGroups.find((g) => g.id === activeSolGroupId);


  // Kont antrepriz: tablo bò lajè (stil "Monetra") olye tablo bò telefòn nan.
  const isBizDash = view === 'dashboard' && !!token && token !== DEMO_TOKEN && user?.accountType === 'business';

  return (
    <div style={{ background: C.bg, minHeight: '100%', color: C.ink }} className="w-full">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');
        * { font-family: 'Inter', sans-serif; box-sizing: border-box; }
        .bp-btn { transition: all .15s ease; }
        .bp-btn:hover { filter: brightness(1.04); }
        .bp-btn:active { transform: scale(0.98); }
        @keyframes fadein { from { opacity:0; transform: translateY(8px);} to {opacity:1; transform:translateY(0);} }
        .fadein { animation: fadein .3s ease; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input:focus { outline: none; border-color: ${C.sky} !important; }
      `}</style>

      {toast && (
        <div className="fixed top-4 left-4 right-4 z-50 fadein px-4 py-3.5 rounded-xl text-sm flex items-center gap-2.5 shadow-lg mx-auto"
          style={{
            background: toast.type === 'error' ? '#FBEAEA' : toast.type === 'info' ? '#E6F0FB' : '#E4F5EF',
            border: `1px solid ${toast.type === 'error' ? '#F3C9C9' : toast.type === 'info' ? '#BFDBF7' : '#BFE7D8'}`,
            color: toast.type === 'error' ? '#8C3535' : toast.type === 'info' ? C.navy : '#2E6B57',
            maxWidth: 420,
          }}>
          {toast.type === 'error' ? (
            <AlertCircle size={17} color={C.danger} className="shrink-0" />
          ) : toast.type === 'info' ? (
            <Bell size={16} color={C.navy} className="shrink-0" />
          ) : (
            <Check size={17} color={C.mint} className="shrink-0" />
          )}
          <span className="flex-1">{toast.msg}</span>
        </div>
      )}

      <div className={view === 'landing' || isBizDash ? 'w-full min-h-full' : 'max-w-md mx-auto min-h-full'} style={{ background: C.bg }}>
        {view === 'landing' ? (
          <LandingPage onStart={() => setView('auth')} lang={lang} setLang={setLang} tr={tr} />
        ) : (
        <>

        {showMyQr && !isBizDash && view === 'dashboard' && (
          <ReceiveQR user={user} lang={lang} flash={flash} onClose={() => setShowMyQr(false)} />
        )}

        {isBizDash && (
          <BusinessApp
            token={token} user={user} lang={lang} setLang={setLang} balance={balance} apiFetch={apiFetch} flash={flash}
            notifications={notifications} unreadCount={unreadCount} showNotif={showNotifPanel} onToggleNotif={openNotifPanel}
            onDeposit={startDeposit} onWithdraw={startWithdraw} onTransfer={() => setView('transfer')}
            onKyc={() => { setKycStep('entwo'); setView('kyc'); }}
            onSettings={() => setView('settings')} onSupport={() => { setSupportSent(false); setView('support'); }}
            onChangePassword={() => { setPwForm({ current: '', next: '', confirm: '' }); setPwError(''); setView('changepassword'); }}
            onLogout={logout}
          />
        )}

        {/* HEADER */}
        {view !== 'auth' && view !== 'forgotpassword' && !isBizDash && (
          <div className="flex items-center justify-between px-5 pt-6 pb-2">
            <div className="flex items-center gap-2">
              <Logo size={28} />
              <span style={{ ...fontDisplay, fontWeight: 800, fontSize: 18 }}>
                {tt("BLIC")}<span style={{ color: C.sky }}>{tt("Pay")}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowLangPicker((s) => !s)} aria-label={tr('langLabel')}
                className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <Globe size={15} color={C.muted} />
              </button>
              <button onClick={() => setView('settings')} aria-label={tr('navSettings')}
                className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <Settings size={15} color={C.muted} />
              </button>
              <div className="relative">
                <button onClick={openNotifPanel} aria-label={tt("Notifikasyon")}
                  className="w-9 h-9 rounded-full flex items-center justify-center relative" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                  <Bell size={16} color={C.muted} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 text-[9px] font-bold flex items-center justify-center rounded-full"
                      style={{ width: 15, height: 15, background: C.danger, color: '#fff' }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifPanel && (
                  <>
                    <div onClick={() => setShowNotifPanel(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                    <div className="fadein" style={{
                      position: 'absolute', right: 0, top: 44, width: 300, maxHeight: 360, overflowY: 'auto',
                      background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, zIndex: 41,
                      boxShadow: '0 8px 24px rgba(11,27,51,0.15)',
                    }}>
                      <p className="text-xs font-bold uppercase px-4 pt-3.5 pb-2" style={{ color: C.muted }}>{tt("Notifikasyon")}</p>
                      {notifications.length === 0 ? (
                        <p className="text-sm px-4 pb-4" style={{ color: C.muted }}>{tt("Ou pa gen notifikasyon.")}</p>
                      ) : notifications.map((n, i) => (
                        <div key={n.id} className="px-4 py-3" style={{ borderTop: i ? `1px solid ${C.border}` : 'none' }}>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold">{n.title}</p>
                            {!n.read && <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: C.sky }} />}
                          </div>
                          <p className="mt-0.5 text-xs" style={{ color: C.muted }}>{n.body}</p>
                          <p className="mt-1 text-[11px]" style={{ color: C.muted }}>{timeAgo(n.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {showLangPicker && (
          <div className="fixed inset-0 z-50" onClick={() => setShowLangPicker(false)}>
            <div className="absolute right-5 top-16 w-48 rounded-xl overflow-hidden fadein"
              style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 8px 24px rgba(11,27,51,0.12)' }}
              onClick={(e) => e.stopPropagation()}>
              {LANGS.map((l) => (
                <button key={l.code} onClick={() => { setLang(l.code); setShowLangPicker(false); }}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm"
                  style={{ background: lang === l.code ? C.bg : 'transparent', color: C.ink }}>
                  <span className="flex items-center gap-2"><span>{l.flag}</span> {l.label}</span>
                  {lang === l.code && <Check size={14} color={C.navy} />}
                </button>
              ))}
            </div>
          </div>
        )}

        {view === 'auth' && (
          <div className="fadein px-6 pt-16 pb-10 relative">
            <button onClick={() => setShowLangPicker((s) => !s)}
              className="absolute right-5 top-6 flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
              style={{ background: C.card, border: `1px solid ${C.border}`, color: C.muted }}>
              <span>{LANGS.find((l) => l.code === lang)?.flag}</span> {LANGS.find((l) => l.code === lang)?.label}
            </button>
            <div className="flex flex-col items-center text-center">
              <Logo size={44} />
              <h1 className="mt-3" style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>
                {tt("BLIC")}<span style={{ color: C.sky }}>{tt("Pay")}</span>
              </h1>
              <p className="mt-1 text-xs tracking-wide" style={{ color: C.muted }}>{tt("GLOBAL · SECURE · DIGITAL")}</p>
            </div>

            <div className="mt-8 flex rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
              <button onClick={() => { setAuthMode('login'); setAuthError(''); }}
                className="flex-1 py-2.5 text-sm font-semibold"
                style={{ background: authMode === 'login' ? C.navy : C.card, color: authMode === 'login' ? '#fff' : C.muted }}>
                {tr('loginTab')}
              </button>
              <button onClick={() => { setAuthMode('register'); setAuthError(''); setRegisterStep(1); }}
                className="flex-1 py-2.5 text-sm font-semibold"
                style={{ background: authMode === 'register' ? C.navy : C.card, color: authMode === 'register' ? '#fff' : C.muted }}>
                {tr('registerTab')}
              </button>
            </div>

            {authMode === 'login' ? (
              <>
                <div className="mt-5 space-y-3">
                  <input placeholder={tr('phonePh')} value={authForm.phone}
                    onChange={(e) => setAuthForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg text-sm" style={{ background: C.card, border: `1px solid ${C.border}` }} />
                  <input placeholder={tr('passwordPh')} type="password" value={authForm.password}
                    onChange={(e) => setAuthForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg text-sm" style={{ background: C.card, border: `1px solid ${C.border}` }} />
                </div>

                {authError && (
                  <p className="mt-3 text-xs flex items-center gap-1.5" style={{ color: C.danger }}>
                    <AlertCircle size={13} /> {authError}
                  </p>
                )}

                <button onClick={handleAuthSubmit} disabled={authLoading}
                  className="bp-btn mt-5 w-full py-3.5 rounded-xl font-semibold text-white"
                  style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, opacity: authLoading ? 0.7 : 1 }}>
                  {authLoading ? tr('waitBtn') : tr('loginBtn')}
                </button>
                <button onClick={() => {
                  setForgotStep(1); setForgotPhone(''); setForgotCode('');
                  setForgotNewPassword(''); setForgotConfirmPassword(''); setForgotError(''); setForgotDone(false);
                  setView('forgotpassword');
                }}
                  className="mt-3 w-full text-center text-xs font-semibold" style={{ color: C.navy }}>
                  {tr('forgotPasswordLink')}
                </button>
              </>
            ) : (
              <>
                {/* step indicator */}
                <div className="flex items-center justify-center gap-2 mt-6">
                  {[1, 2, 3].map((s) => (
                    <React.Fragment key={s}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          background: s <= registerStep ? C.navy : C.card,
                          color: s <= registerStep ? '#fff' : C.muted,
                          border: `1px solid ${s <= registerStep ? C.navy : C.border}`,
                        }}>
                        {s < registerStep ? <Check size={12} /> : s}
                      </div>
                      {s < 3 && <div className="w-6 h-0.5" style={{ background: s < registerStep ? C.navy : C.border }} />}
                    </React.Fragment>
                  ))}
                </div>
                <p className="text-center text-xs font-semibold mt-2" style={{ color: C.muted }}>
                  {registerStep === 1 ? tr('stepInfo') : registerStep === 2 ? tr('stepPassword') : tr('stepTerms')}
                </p>

                {registerStep === 1 && (
                  <div className="mt-5 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input placeholder={tr('lastNamePh')} value={authForm.lastName}
                        onChange={(e) => setAuthForm((f) => ({ ...f, lastName: e.target.value }))}
                        className="w-full px-4 py-3 rounded-lg text-sm" style={{ background: C.card, border: `1px solid ${C.border}` }} />
                      <input placeholder={tr('firstNamePh')} value={authForm.firstName}
                        onChange={(e) => setAuthForm((f) => ({ ...f, firstName: e.target.value }))}
                        className="w-full px-4 py-3 rounded-lg text-sm" style={{ background: C.card, border: `1px solid ${C.border}` }} />
                    </div>
                    <input placeholder={tr('phonePh')} value={authForm.phone}
                      onChange={(e) => setAuthForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg text-sm" style={{ background: C.card, border: `1px solid ${C.border}` }} />
                    <input placeholder={tr('emailPh')} type="email" value={authForm.email}
                      onChange={(e) => setAuthForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg text-sm" style={{ background: C.card, border: `1px solid ${C.border}` }} />
                    <input placeholder={tr('addressPh')} value={authForm.address}
                      onChange={(e) => setAuthForm((f) => ({ ...f, address: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg text-sm" style={{ background: C.card, border: `1px solid ${C.border}` }} />
                    <div className="grid grid-cols-2 gap-3">
                      <input placeholder={tr('cityPh')} value={authForm.city}
                        onChange={(e) => setAuthForm((f) => ({ ...f, city: e.target.value }))}
                        className="w-full px-4 py-3 rounded-lg text-sm" style={{ background: C.card, border: `1px solid ${C.border}` }} />
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none">🇭🇹</span>
                        <select value={authForm.country}
                          onChange={(e) => setAuthForm((f) => ({ ...f, country: e.target.value }))}
                          className="w-full pl-9 pr-3 py-3 rounded-lg text-sm appearance-none"
                          style={{ background: C.card, border: `1px solid ${C.border}`, color: authForm.country ? C.ink : C.muted }}>
                          <option value="" disabled>{tr('countryPh')}</option>
                          {tr('countries').map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <input placeholder={tr('departmentPh')} value={authForm.department}
                      onChange={(e) => setAuthForm((f) => ({ ...f, department: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg text-sm" style={{ background: C.card, border: `1px solid ${C.border}` }} />
                  </div>
                )}

                {registerStep === 2 && (
                  <div className="mt-5 space-y-3">
                    <input placeholder={tr('passwordPh')} type="password" value={authForm.password}
                      onChange={(e) => setAuthForm((f) => ({ ...f, password: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg text-sm" style={{ background: C.card, border: `1px solid ${C.border}` }} />
                    <input placeholder={tr('confirmPasswordPh')} type="password" value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg text-sm" style={{ background: C.card, border: `1px solid ${C.border}` }} />
                  </div>
                )}

                {registerStep === 3 && (
                  <div className="mt-5">
                    <p className="text-xs font-semibold mb-2" style={{ color: C.muted }}>{tr('reviewInfo')}</p>
                    <div className="rounded-xl p-4 space-y-2 text-sm" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                      <div className="flex items-center justify-between">
                        <span style={{ color: C.muted }}>{tr('fullNamePh')}</span>
                        <span className="font-medium">{authForm.firstName} {authForm.lastName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ color: C.muted }}>{tr('phonePh')}</span>
                        <span className="font-medium">{authForm.phone}</span>
                      </div>
                      {authForm.email && (
                        <div className="flex items-center justify-between">
                          <span style={{ color: C.muted }}>{tr('emailPh')}</span>
                          <span className="font-medium">{authForm.email}</span>
                        </div>
                      )}
                      {authForm.address && (
                        <div className="flex items-center justify-between">
                          <span style={{ color: C.muted }}>{tr('addressPh')}</span>
                          <span className="font-medium">{authForm.address}</span>
                        </div>
                      )}
                      {(authForm.city || authForm.country) && (
                        <div className="flex items-center justify-between">
                          <span style={{ color: C.muted }}>{tr('cityPh')} / {tr('countryPh')}</span>
                          <span className="font-medium">
                            {[authForm.city, authForm.country && `🇭🇹 ${authForm.country}`].filter(Boolean).join(' · ')}
                          </span>
                        </div>
                      )}
                      {authForm.department && (
                        <div className="flex items-center justify-between">
                          <span style={{ color: C.muted }}>{tr('departmentPh')}</span>
                          <span className="font-medium">{authForm.department}</span>
                        </div>
                      )}
                    </div>
                    <label className="mt-4 flex items-start gap-2.5 cursor-pointer">
                      <input type="checkbox" checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-0.5" style={{ width: 16, height: 16, accentColor: C.navy }} />
                      <span className="text-xs" style={{ color: C.muted }}>{tr('termsText')}</span>
                    </label>
                  </div>
                )}

                {authError && (
                  <p className="mt-3 text-xs flex items-center gap-1.5" style={{ color: C.danger }}>
                    <AlertCircle size={13} /> {authError}
                  </p>
                )}

                <div className="flex gap-2.5 mt-5">
                  {registerStep > 1 && (
                    <button onClick={() => goRegisterStep(registerStep - 1)}
                      className="bp-btn py-3.5 px-5 rounded-xl font-semibold text-sm"
                      style={{ border: `1px solid ${C.border}`, color: C.muted }}>
                      {tr('back')}
                    </button>
                  )}
                  {registerStep < 3 ? (
                    <button onClick={() => goRegisterStep(registerStep + 1)}
                      className="bp-btn flex-1 py-3.5 rounded-xl font-semibold text-white"
                      style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})` }}>
                      {tr('next')}
                    </button>
                  ) : (
                    <button onClick={submitRegistration} disabled={authLoading}
                      className="bp-btn flex-1 py-3.5 rounded-xl font-semibold text-white"
                      style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, opacity: authLoading ? 0.7 : 1 }}>
                      {authLoading ? tr('waitBtn') : tr('createAccountBtn')}
                    </button>
                  )}
                </div>
              </>
            )}

          </div>
        )}

        {view === 'forgotpassword' && (
          <div className="fadein px-6 pt-16 pb-10">
            <div className="flex flex-col items-center text-center">
              <Logo size={44} />
              <h1 className="mt-3" style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>{tr('forgotTitle')}</h1>
            </div>

            {forgotDone ? (
              <div className="mt-8 p-5 rounded-xl text-center" style={{ background: '#E4F5EF' }}>
                <Check size={24} color={C.mint} className="mx-auto" />
                <p className="mt-2 text-sm font-semibold" style={{ color: C.mint }}>{tr('resetSuccessMsg')}</p>
                <button onClick={closeForgotPassword}
                  className="bp-btn mt-4 w-full py-3 rounded-xl font-semibold text-sm text-white"
                  style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})` }}>
                  {tr('loginTab')}
                </button>
              </div>
            ) : forgotStep === 1 ? (
              <>
                <p className="mt-6 text-sm text-center" style={{ color: C.muted }}>{tr('forgotStep1Sub')}</p>
                <input placeholder={tr('phonePh')} value={forgotPhone}
                  onChange={(e) => setForgotPhone(e.target.value)}
                  className="w-full mt-5 px-4 py-3 rounded-lg text-sm" style={{ background: C.card, border: `1px solid ${C.border}` }} />
                {forgotError && (
                  <p className="mt-3 text-xs flex items-center gap-1.5" style={{ color: C.danger }}>
                    <AlertCircle size={13} /> {forgotError}
                  </p>
                )}
                <button onClick={sendResetCode} disabled={forgotSending}
                  className="bp-btn mt-5 w-full py-3.5 rounded-xl font-semibold text-white"
                  style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, opacity: forgotSending ? 0.7 : 1 }}>
                  {forgotSending ? tr('waitBtn') : tr('sendCodeBtn')}
                </button>
              </>
            ) : (
              <>
                <p className="mt-6 text-sm text-center" style={{ color: C.muted }}>{tr('forgotStep2Sub')}</p>
                <div className="mt-5 space-y-3">
                  <input placeholder={tr('codePh')} value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value.replace(/[^0-9]/g, ''))}
                    inputMode="numeric" maxLength={6}
                    className="w-full px-4 py-3 rounded-lg text-sm text-center tracking-widest" style={{ ...fontMono, background: C.card, border: `1px solid ${C.border}` }} />
                  <input placeholder={tr('newPasswordPh')} type="password" value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-sm" style={{ background: C.card, border: `1px solid ${C.border}` }} />
                  <input placeholder={tr('confirmNewPasswordPh')} type="password" value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-sm" style={{ background: C.card, border: `1px solid ${C.border}` }} />
                </div>
                {forgotError && (
                  <p className="mt-3 text-xs flex items-center gap-1.5" style={{ color: C.danger }}>
                    <AlertCircle size={13} /> {forgotError}
                  </p>
                )}
                <button onClick={resetPassword} disabled={forgotSending}
                  className="bp-btn mt-5 w-full py-3.5 rounded-xl font-semibold text-white"
                  style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, opacity: forgotSending ? 0.7 : 1 }}>
                  {forgotSending ? tr('waitBtn') : tr('resetPasswordBtn')}
                </button>
              </>
            )}

            {!forgotDone && (
              <button onClick={closeForgotPassword}
                className="mt-4 w-full text-center text-xs font-semibold" style={{ color: C.muted }}>
                {tr('back')}
              </button>
            )}
          </div>
        )}

        {view === 'dashboard' && !isBizDash && (
          <div className="fadein px-5 pb-28 pt-2">
            <p className="text-sm mt-2" style={{ color: C.muted }}>{tr('welcome')}</p>
            <div className="flex items-center gap-1.5">
              <h1 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>{user?.fullName || '...'}</h1>
              {accountVerified ? (
                <span title={tt("Kont verifye (KYC)")}><BadgeCheck size={19} color={C.sky} fill={C.navy} /></span>
              ) : kycStatus === 'annatant' ? (
                <Badge tone="amber">{tt("Annatant")}</Badge>
              ) : (
                <button onClick={() => { setKycStep('entwo'); setView('kyc'); }} className="text-xs font-semibold underline" style={{ color: C.navy }}>
                  {tt("Verifye kont ou")}
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-xs" style={{ ...fontMono, color: C.muted }}>ID: {getClientId(user)}</p>
              <button onClick={() => { navigator.clipboard?.writeText(getClientId(user)); flash(tt("ID kopye.")); }} aria-label={tt("Kopye ID")}>
                <Copy size={12} color={C.muted} />
              </button>
              {user?.clientId && (
                <button onClick={() => setShowMyQr(true)} className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                  style={{ background: '#E6F0FB', color: C.navy }}>
                  <QrCode size={11} /> {tr('myQr')}
                </button>
              )}
            </div>

            {/* balance card */}
            <div className="mt-5 rounded-2xl p-5 relative overflow-hidden" style={{
              background: `linear-gradient(135deg, ${C.navy}, #1C6FBF 55%, ${C.sky})`,
            }}>
              <svg width="140" height="140" viewBox="0 0 48 48" style={{ position: 'absolute', right: -20, top: -20, opacity: 0.12 }}>
                <path d="M24 3 L42 10 V22 C42 33 34.5 41.5 24 45 C13.5 41.5 6 33 6 22 V10 Z" fill="#fff" />
              </svg>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wide" style={{ color: 'rgba(255,255,255,0.75)' }}>{tr('balanceLabel')}</span>
                  <div className="flex items-center gap-2.5">
                    <button onClick={() => setHideBalance((h) => !h)} aria-label={hideBalance ? tt("Montre sòld") : tt("Kache sòld")}>
                      {hideBalance
                        ? <EyeOff size={16} color="rgba(255,255,255,0.75)" />
                        : <Eye size={16} color="rgba(255,255,255,0.75)" />}
                    </button>
                    <ShieldCheck size={16} color="rgba(255,255,255,0.75)" />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2.5">
                  <p style={{ ...fontMono, fontSize: 32, fontWeight: 500, color: '#fff' }}>
                    {hideBalance ? '••••••' : money(balance)}
                  </p>
                  <button onClick={refreshTransactions} aria-label={tt("Rafrechi sòld")}
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <RefreshCw size={13} color="#fff" style={refreshing ? { animation: 'spin 0.8s linear infinite' } : undefined} />
                  </button>
                </div>
                <p className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{tr('accountLabel')} · •••• {getClientId(user).slice(-4)}</p>
                <div className="mt-4 flex gap-2.5">
                  <button onClick={startDeposit} className="bp-btn flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: '#fff', color: C.navy }}>
                    <ArrowDownLeft size={14} /> {tr('tileDeposit')}
                  </button>
                  <button onClick={startWithdraw} className="bp-btn flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}>
                    <ArrowUpRight size={14} /> {tr('tileWithdraw')}
                  </button>
                </div>
              </div>
            </div>

            {/* quick actions */}
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <button onClick={startDeposit} className="bp-btn rounded-xl p-3 flex flex-col items-center gap-2 text-center"
                style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#E4F5EF' }}>
                  <ArrowDownLeft size={16} color={C.mint} />
                </div>
                <span className="text-xs font-semibold">{tr('tileDeposit')}</span>
              </button>
              <button onClick={startWithdraw} className="bp-btn rounded-xl p-3 flex flex-col items-center gap-2 text-center"
                style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#FBEAEA' }}>
                  <ArrowUpRight size={16} color={C.danger} />
                </div>
                <span className="text-xs font-semibold">{tr('tileWithdraw')}</span>
              </button>
              <button onClick={() => setView('transfer')} className="bp-btn rounded-xl p-3 flex flex-col items-center gap-2 text-center"
                style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#E6F0FB' }}>
                  <ArrowLeftRight size={16} color={C.navy} />
                </div>
                <span className="text-xs font-semibold">{tr('tileTransfer')}</span>
              </button>
              {user?.clientId && (
                <button onClick={() => setShowMyQr(true)} className="bp-btn rounded-xl p-3 flex flex-col items-center gap-2 text-center"
                  style={{ background: C.card, border: `1px solid ${C.border}` }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#E6F6FD' }}>
                    <QrCode size={16} color={C.navy} />
                  </div>
                  <span className="text-xs font-semibold">{tr('tileReceive')}</span>
                </button>
              )}
              <button onClick={openSolSection} className="bp-btn rounded-xl p-3 flex flex-col items-center gap-2 text-center"
                style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#FBF0DE' }}>
                  <Users size={16} color={C.amber} fill={C.amber} strokeWidth={1.4} />
                </div>
                <span className="text-xs font-semibold">{tr('tileSol')}</span>
              </button>
              <button onClick={() => setView('blicdepo')} className="bp-btn rounded-xl p-3 flex flex-col items-center gap-2 text-center"
                style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#E4F5EF' }}>
                  <PiggyBank size={16} color={C.mint} fill={C.mint} strokeWidth={1.4} />
                </div>
                <span className="text-xs font-semibold">{tr('tileDepo')}</span>
              </button>
              <button onClick={() => setView('termdepo')} className="bp-btn rounded-xl p-3 flex flex-col items-center gap-2 text-center"
                style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#F4EBFF' }}>
                  <Lock size={16} color="#6D3FD1" fill="#6D3FD1" strokeWidth={1.4} />
                </div>
                <span className="text-xs font-semibold">{tr('tileGoal')}</span>
              </button>
              <button onClick={() => setView('loan')} className="bp-btn rounded-xl p-3 flex flex-col items-center gap-2 text-center relative"
                style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: C.amber, color: '#fff' }}>{tt("Talè")}</span>
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#E6F0FB' }}>
                  <HandCoins size={16} color={C.navy} fill={C.navy} strokeWidth={1.4} />
                </div>
                <span className="text-xs font-semibold">{tr('tileLoan')}</span>
              </button>
            </div>

            {/* kyc banner — baze sou accountVerified (pa kycStatus) pou l pa parèt
                ankò pou yon kliyan deja verifye ki ta relanse yon nouvo demand */}
            {!accountVerified && (
              <div className="mt-4 p-4 rounded-xl flex items-center gap-3" style={{ background: '#FBF0DE', border: `1px solid #F0D9A8` }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: '#F0D9A8' }}>
                  <ShieldCheck size={16} color="#946115" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: '#946115' }}>
                    {kycStatus === 'annatant' ? tt("N ap verifye dokiman ou") : tt("Verifye kont ou")}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#946115' }}>
                    {kycStatus === 'annatant' ? tt("Sa ka pran kèk moman.") : tt("Ajoute yon pyès idantite pou dekaplaf kont ou.")}
                  </p>
                </div>
                {kycStatus === 'annatant' ? (
                  <button onClick={checkKycStatus} aria-label={tt("Tcheke estati")}
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: '#fff' }}>
                    <RefreshCw size={14} color="#946115" style={refreshing ? { animation: 'spin 0.8s linear infinite' } : undefined} />
                  </button>
                ) : (
                  <button onClick={() => { setKycStep('entwo'); setView('kyc'); }}
                    className="text-xs font-semibold px-3 py-2 rounded-lg shrink-0" style={{ background: '#946115', color: '#fff' }}>
                    {tt("Kòmanse")}
                  </button>
                )}
              </div>
            )}

            {/* verification-request banner — demand SIPLEMANTÈ admin kreye pou
                YON kliyan presizeman (prèv adrès, elt.), apa de badge KYC prensipal la */}
            {verificationRequests.filter((r) => r.status === 'requested' || r.status === 'rejected').map((r) => (
              <div key={r.id} className="mt-4 p-4 rounded-xl flex items-center gap-3" style={{ background: '#FBEAEA', border: `1px solid #F0C0C0` }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: '#F0C0C0' }}>
                  <FileText size={16} color={C.danger} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: C.danger }}>
                    {tt(VR_TYPE_LABELS[r.type]) || tt("Dokiman mande")}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: C.danger }}>
                    {r.status === 'rejected' ? (r.rejectionReason || tt("Refize — eseye ankò.")) : (r.note || tt("Yon admin mande sa a."))}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (r.type === 'identity_reverify') { submitVerificationRequest(r.id, null); setKycStep('entwo'); setView('kyc'); }
                    else { setVrError(''); setVrActive(r); }
                  }}
                  className="text-xs font-semibold px-3 py-2 rounded-lg shrink-0" style={{ background: C.danger, color: '#fff' }}>
                  {r.type === 'identity_reverify' ? tt("Kòmanse") : tt("Voye")}
                </button>
              </div>
            ))}
            {verificationRequests.filter((r) => r.status === 'submitted').map((r) => (
              <div key={r.id} className="mt-4 p-4 rounded-xl flex items-center gap-3" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: '#EEF1F6' }}>
                  <Clock size={16} color={C.muted} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: C.navy }}>{tt(VR_TYPE_LABELS[r.type]) || tt("Dokiman voye")}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.muted }}>{tt("N ap egzamine sa ou voye a.")}</p>
                </div>
              </div>
            ))}

            {/* promo carousel — cycles automatically through several ads/services */}
            <div className="mt-4 rounded-2xl p-5 relative overflow-hidden" style={{ background: C.navy, transition: 'background 0.3s' }}>
              {(() => {
                const slide = PROMO_SLIDES[promoIndex];
                const Icon = slide.icon;
                return (
                  <>
                    <Icon size={100} style={{ position: 'absolute', right: -14, bottom: -18, opacity: 0.14 }} color="#fff" />
                    <p className="font-extrabold text-white" style={{ ...fontDisplay, fontSize: 17 }}>{slide.title}</p>
                    <p className="mt-1.5 text-sm max-w-[75%]" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      {slide.desc}
                    </p>
                    <button onClick={slide.action}
                      className="bp-btn mt-3.5 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5"
                      style={{ background: '#fff', color: C.navy }}>
                      {slide.cta} <ChevronRight size={14} />
                    </button>
                  </>
                );
              })()}
            </div>
            <div className="mt-3 flex items-center justify-center gap-1.5">
              {PROMO_SLIDES.map((_, i) => (
                <button key={i} onClick={() => setPromoIndex(i)} aria-label={tt("Wè ofr {0}", i + 1)}
                  className="rounded-full transition-all" style={{
                    width: i === promoIndex ? 16 : 6, height: 6,
                    background: i === promoIndex ? C.navy : C.border,
                  }} />
              ))}
            </div>

            {/* transactions — sèlman 5 pi resan yo, "Wè tout" mennen nan
                istorik konplè a ki gen pwòp pajinasyon 10 pa 10 */}
            <div className="mt-7 flex items-center justify-between">
              <h3 className="font-semibold text-sm" style={{ color: C.muted }}>{tr('recentTx')}</h3>
              {tx.length > 5 ? (
                <button onClick={() => setView('history')} className="text-xs font-semibold" style={{ color: C.navy }}>
                  {tt("Wè tout")}
                </button>
              ) : (
                <Clock size={14} color={C.muted} />
              )}
            </div>
            <div className="mt-3 rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
              {tx.length === 0 && (
                <p className="text-sm p-5" style={{ color: C.muted, background: C.card }}>{tr('noTx')}</p>
              )}
              {tx.slice(0, 5).map((t, i) => {
                const isOutgoing = t.type === 'retrè' || t.type === 'transfè';
                const logo = getMethodLogo(t.method);
                return (
                  <div key={t.id} className="flex items-center justify-between px-4 py-3.5"
                    style={{ background: C.card, borderTop: i ? `1px solid ${C.border}` : 'none' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
                        style={{ background: logo ? '#fff' : t.type === 'transfè' ? '#E6F0FB' : isOutgoing ? '#FBEAEA' : '#E4F5EF', border: logo ? `1px solid ${C.border}` : 'none' }}>
                        {logo ? (
                          <img src={logo} alt={t.method} className="w-full h-full object-cover" />
                        ) : t.type === 'transfè' ? (
                          <ArrowLeftRight size={15} color={C.navy} />
                        ) : isOutgoing ? (
                          <ArrowUpRight size={15} color={C.danger} />
                        ) : (
                          <ArrowDownLeft size={15} color={C.mint} />
                        )}
                      </div>
                      <div>
                      <p className="text-sm font-semibold">{tt(t.method)}</p>
                      <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                        {t.date}
                        {TX_TYPE_LABELS[t.type] && (
                          <> · <span style={{ color: TX_TYPE_LABELS[t.type].color, fontWeight: 600 }}>{tt(TX_TYPE_LABELS[t.type].label)}</span></>
                        )}
                      </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm" style={{ ...fontMono, color: isOutgoing ? C.danger : C.ink }}>
                        {isOutgoing ? '-' : '+'}{money(t.amount)}
                      </span>
                      <Badge tone={t.status === 'konfime' ? 'mint' : t.status === 'rejte' ? 'danger' : 'amber'}>
                        {t.status === 'konfime' ? tt("Konfime") : t.status === 'rejte' ? tt("Rejte") : tt("Annatant")}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'sol' && (
          <div className="fadein px-5 pb-10 pt-2">
            <button
              onClick={() => {
                if (solSubView === 'documents') setSolSubView(mySolMemberships.length > 0 ? 'mine' : 'browse');
                else if (solSubView === 'detail') setSolSubView(mySolMemberships.length > 0 ? 'mine' : 'browse');
                else if (solSubView === 'browse' && mySolMemberships.length > 0) setSolSubView('mine');
                else setView('dashboard');
              }}
              className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
              <ArrowLeft size={15} /> {tt("Retounen")}
            </button>

            {solSubView === 'mine' && (
              <>
                <div className="flex items-center justify-between">
                  <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>{tt("Sòl")} <em style={{ fontStyle: 'italic', color: C.sky }}>{tt("mwen yo")}</em></h2>
                  <button onClick={() => setSolSubView('browse')} className="text-xs font-semibold" style={{ color: C.navy }}>
                    {tt("+ Antre nan yon lòt")}
                  </button>
                </div>
                <p className="mt-1.5 text-sm" style={{ color: C.muted }}>{tt("Ou gen")} {mySolMemberships.length} {tt("demand/adezyon Sòl.")}</p>
                <button onClick={openSolDocuments} className="mt-2 text-xs font-semibold flex items-center gap-1" style={{ color: C.navy }}>
                  <FileText size={13} /> {tt("Dokiman Sòl mwen yo")}
                </button>
                <div className="mt-5 space-y-3">
                  {loadingSol ? (
                    <p className="text-sm p-6 text-center" style={{ color: C.muted }}>{tt("Ap chaje...")}</p>
                  ) : mySolMemberships.length === 0 ? (
                    <p className="text-sm p-5 rounded-xl" style={{ color: C.muted, background: C.card, border: `1px solid ${C.border}` }}>{tt("Ou poko gen okenn demand Sòl.")}</p>
                  ) : mySolMemberships.map((m) => (
                    <div key={m.id} className="p-4 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                      <button onClick={() => openSolDetail(m.group.id)} className="bp-btn w-full text-left flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm">{m.group.name}</h3>
                            <Badge tone={m.group.tier === 'Premium' ? 'premium' : m.group.tier === 'Standard' ? 'navy' : 'muted'}>{m.group.tier}</Badge>
                          </div>
                          <p className="mt-1 text-xs" style={{ color: C.muted }}>
                            {tt(m.group.frequency)} · {money(m.group.amount)}
                          </p>
                          <Badge tone={m.status === 'approved' ? 'mint' : m.status === 'rejected' ? 'danger' : 'amber'}>
                            {m.status === 'approved' ? tt("Manm apwouve") : m.status === 'rejected' ? tt("Refize") : tt("Annatant")}
                          </Badge>
                          {m.currentContribution && (
                            <Badge tone={m.currentContribution.status === 'paid' ? 'mint' : m.currentContribution.status === 'overdue' ? 'danger' : 'amber'}>
                              {m.currentContribution.status === 'paid' ? tt("Kotizasyon peye ✓")
                                : m.currentContribution.status === 'overdue' ? tt("Kotizasyon an reta serye")
                                : m.currentContribution.status === 'late' ? tt("Kotizasyon an reta")
                                : tt("Kotizasyon ap tann")}
                            </Badge>
                          )}
                        </div>
                        <ChevronRight size={16} color={C.muted} />
                      </button>

                      {m.status === 'pending' && (
                        m.integrationFeePaid ? (
                          <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg" style={{ background: '#E4F5EF' }}>
                            <Check size={14} color={C.mint} />
                            <p className="text-xs font-semibold" style={{ color: C.mint }}>{tt("Frè entegrasyon peye — n ap tann admin")}</p>
                          </div>
                        ) : (
                          <button onClick={() => payIntegrationFee(m.id)} disabled={solFeeProcessing === m.id}
                            className="bp-btn mt-3 w-full py-2.5 rounded-lg text-sm font-semibold text-white"
                            style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, opacity: solFeeProcessing === m.id ? 0.7 : 1 }}>
                            {solFeeProcessing === m.id ? tt("Ap trete...") : tt("Peye frè entegrasyon an ({0})", money(m.integrationFee))}
                          </button>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {solSubView === 'browse' && (
              <>
                <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>{tt("BLIC")} <em style={{ fontStyle: 'italic', color: C.sky }}>{tt("Sòl")}</em></h2>
                <p className="mt-1.5 text-sm" style={{ color: C.muted }}>
                  {mySolMemberships.length > 0 ? tt("Ou ka antre nan plizyè sòl an menm tan.") : tt("Ou poko manm okenn sòl. Chwazi youn pou kòmanse.")}
                </p>

                <a href="https://blicpayht.com/BLIC_Global_Fiche_Solde_Remplissable.pdf" target="_blank" rel="noreferrer"
                  className="bp-btn mt-3 flex items-center gap-2.5 p-3 rounded-xl" style={{ background: '#E6F0FB' }}>
                  <FileText size={16} color={C.navy} className="shrink-0" />
                  <div className="text-left">
                    <p className="text-xs font-semibold" style={{ color: C.navy }}>{tt("Telechaje fòm enskripsyon an")}</p>
                    <p className="text-xs mt-0.5" style={{ color: C.muted }}>{tt("Ranpli l epi voye l pa email, WhatsApp, oswa nan biwo a.")}</p>
                  </div>
                </a>

                <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                  {SOL_FREQUENCIES.map((f) => (
                    <button key={f.id} onClick={() => setSolFreqFilter(f.id)}
                      className="bp-btn shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold"
                      style={solFreqFilter === f.id
                        ? { background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, color: '#fff' }
                        : { background: C.card, color: C.muted, border: `1px solid ${C.border}` }}>
                      {tt(f.label)}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                  {SOL_TIERS.map((t) => (
                    <button key={t.id} onClick={() => setSolTierFilter(t.id)}
                      className="bp-btn shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold"
                      style={solTierFilter === t.id
                        ? { background: C.ink, color: '#fff' }
                        : { background: C.card, color: C.muted, border: `1px solid ${C.border}` }}>
                      {t.name}
                    </button>
                  ))}
                </div>

                <div className="mt-4 space-y-3">
                  {loadingSol ? (
                    <p className="text-sm p-6 text-center" style={{ color: C.muted }}>{tt("Ap chaje...")}</p>
                  ) : solGroups.filter((g) => g.frequencyId === solFreqFilter && g.tierId === solTierFilter).map((g) => {
                    const isFull = !g.isOpen && g.myStatus !== 'approved' && g.myStatus !== 'pending';
                    const alreadyIn = !!g.myStatus;
                    return (
                      <div key={g.id} className="p-4 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}`, opacity: (!g.isOpen && !alreadyIn) ? 0.65 : 1 }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm">{g.name}</h3>
                            <Badge tone={g.tier === 'Premium' ? 'premium' : g.tier === 'Standard' ? 'navy' : 'muted'}>{g.tier}</Badge>
                          </div>
                          <Badge tone={!g.isOpen && !alreadyIn ? 'mint' : 'muted'}>{g.memberCount}/{g.maxMembers}</Badge>
                        </div>
                        <p className="mt-1.5 text-xs" style={{ color: C.muted }}>{tt(g.frequency)} · {money(g.amount)} {tt("pa moun")}</p>
                        <div className="mt-1.5 flex items-center justify-between rounded-lg px-2.5 py-1.5" style={{ background: C.bg }}>
                          <span className="text-xs" style={{ color: C.muted }}>{tt("Frè entegrasyon")}</span>
                          <span className="text-xs font-semibold" style={{ color: C.ink }}>{money(g.integrationFee)}</span>
                        </div>
                        {!alreadyIn && (
                          <p className="mt-1.5 text-xs font-medium" style={{ color: !g.isOpen ? C.muted : C.amber }}>
                            {!g.isOpen ? <><Lock size={11} className="inline mr-1" />{tt("Fèmen pou kounye a")}</> : tt("{0} plas ki rete", g.maxMembers - g.memberCount)}
                          </p>
                        )}
                        {alreadyIn ? (
                          <button onClick={() => openSolDetail(g.id)}
                            className="bp-btn mt-3 w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5"
                            style={{ background: C.bg, color: C.navy, border: `1px solid ${C.border}` }}>
                            {g.myStatus === 'approved' ? tt("Deja manm") : g.myStatus === 'rejected' ? tt("Demand refize") : tt("Demand annatant")} {tt("— wè detay")} <ChevronRight size={14} />
                          </button>
                        ) : (
                          <button onClick={() => requestJoinSol(g.id)} disabled={!g.isOpen || solJoinProcessing === g.id}
                            className="bp-btn mt-3 w-full py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-1.5"
                            style={{ background: !g.isOpen ? C.border : `linear-gradient(135deg, ${C.navy}, ${C.sky})`, color: !g.isOpen ? C.muted : '#fff', cursor: !g.isOpen ? 'not-allowed' : 'pointer', opacity: solJoinProcessing === g.id ? 0.7 : 1 }}>
                            {solJoinProcessing === g.id ? tt("Ap voye...") : !g.isOpen ? <><Lock size={13} /> {tt("Fèmen pou kounye a")}</> : <>{tt("Antre nan sòl la")} <ChevronRight size={14} /></>}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {solSubView === 'detail' && userSolGroup && (
              <>
                <div className="flex items-center gap-2">
                  <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>{userSolGroup.name}</h2>
                  <Badge tone={userSolGroup.tier === 'Premium' ? 'premium' : userSolGroup.tier === 'Standard' ? 'navy' : 'muted'}>
                    {userSolGroup.tier}
                  </Badge>
                </div>
                <p className="mt-1 text-sm" style={{ color: C.muted }}>{tt(userSolGroup.frequency)} · {money(userSolGroup.amount)} {tt("pa moun")}</p>

                {userSolMembership && (
                  <div className="mt-4 p-4 rounded-xl flex items-center gap-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                    <Badge tone={userSolMembership.status === 'approved' ? 'mint' : userSolMembership.status === 'rejected' ? 'danger' : 'amber'}>
                      {userSolMembership.status === 'approved' ? tt("Manm apwouve") : userSolMembership.status === 'rejected' ? tt("Demand refize") : tt("Demand annatant")}
                    </Badge>
                    {userSolMembership.status === 'approved' && userSolMembership.turnIndex != null && (
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0" style={{ background: C.navy, color: '#fff' }}>
                          {userSolMembership.turnIndex + 1}
                        </div>
                        <p className="text-xs" style={{ color: C.muted }}>{tt("Pozisyon ou nan wotasyon an")}</p>
                      </div>
                    )}
                  </div>
                )}

                {userSolMembership?.status === 'approved' && userSolMembership.turnIndex != null && (
                  <div className="mt-4 p-4 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                    <SolWheel
                      maxMembers={userSolGroup.maxMembers}
                      currentTurn={userSolGroup.currentTurn || 0}
                      myTurnIndex={userSolMembership.turnIndex}
                      potAmount={userSolGroup.amount * userSolGroup.maxMembers}
                    />
                  </div>
                )}

                {userSolMembership?.status === 'pending' && (
                  userSolMembership.integrationFeePaid ? (
                    <div className="mt-3 flex items-center gap-2 p-3 rounded-xl" style={{ background: '#E4F5EF' }}>
                      <Check size={15} color={C.mint} />
                      <p className="text-sm font-semibold" style={{ color: C.mint }}>{tt("Frè entegrasyon peye — n ap tann admin egzamine demand ou")}</p>
                    </div>
                  ) : (
                    <button onClick={() => payIntegrationFee(userSolMembership.id)} disabled={solFeeProcessing === userSolMembership.id}
                      className="bp-btn mt-3 w-full py-3 rounded-xl text-sm font-semibold text-white"
                      style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, opacity: solFeeProcessing === userSolMembership.id ? 0.7 : 1 }}>
                      {solFeeProcessing === userSolMembership.id ? tt("Ap trete...") : tt("Peye frè entegrasyon an ({0})", money(userSolMembership.integrationFee))}
                    </button>
                  )
                )}

                {userSolMembership?.currentContribution && (
                  <div className="mt-3 p-4 rounded-xl" style={{
                    background: userSolMembership.currentContribution.status === 'paid' ? '#E4F5EF' : userSolMembership.currentContribution.status === 'overdue' ? '#FBEAEA' : '#FBF0DE',
                  }}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold" style={{
                        color: userSolMembership.currentContribution.status === 'paid' ? C.mint : userSolMembership.currentContribution.status === 'overdue' ? C.danger : '#946115',
                      }}>
                        {userSolMembership.currentContribution.status === 'paid' ? tt("Kotizasyon mwa sa a peye ✓")
                          : userSolMembership.currentContribution.status === 'overdue' ? tt("Kotizasyon an reta serye")
                          : userSolMembership.currentContribution.status === 'late' ? tt("Kotizasyon an reta")
                          : tt("Kotizasyon mwa sa a ap tann")}
                      </p>
                      <p className="text-sm font-semibold" style={{ color: C.ink }}>
                        {money(userSolMembership.currentContribution.amount + (userSolMembership.currentContribution.penaltyAmount || 0))}
                      </p>
                    </div>
                    {userSolMembership.currentContribution.penaltyAmount > 0 && (
                      <p className="mt-1 text-xs" style={{ color: '#946115' }}>
                        {tt("Sa gen ladan")} {money(userSolMembership.currentContribution.penaltyAmount)} {tt("penalite pou reta.")}
                      </p>
                    )}
                    {userSolMembership.currentContribution.status === 'overdue' && (
                      <p className="mt-1 text-xs" style={{ color: C.danger }}>
                        {tt("Delè gras la pase — yon admin BLICPay ap kontakte w byento.")}
                      </p>
                    )}
                  </div>
                )}

                {userSolMembership?.currentPeriodDates ? (
                  <div className="mt-3 flex items-start gap-2 text-xs p-3 rounded-lg" style={{ background: '#E6F0FB', color: C.navy }}>
                    <Calendar size={15} className="shrink-0 mt-0.5" />
                    <div>
                      <p>{tt("Dat limit kotizasyon:")} <strong>{userSolMembership.currentPeriodDates.deadline}</strong></p>
                      <p className="mt-0.5">{tt("Dat prevwa vèsman:")} <strong>{userSolMembership.currentPeriodDates.payoutDate}</strong></p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex items-start gap-2 text-xs p-3 rounded-lg" style={{ background: '#FBF0DE', color: '#946115' }}>
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    {tt("Dat ak montan peman rotasyon an ap anonse pa BLICPay pita.")}
                  </div>
                )}

                <button onClick={openSolDocuments}
                  className="bp-btn mt-4 w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
                  style={{ background: C.card, color: C.navy, border: `1px solid ${C.border}` }}>
                  <FileText size={15} /> {tt("Dokiman Sòl mwen yo")}
                </button>
              </>
            )}

            {solSubView === 'documents' && (
              <>
                <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>{tt("Dokiman")} <em style={{ fontStyle: 'italic', color: C.sky }}>{tt("Sòl mwen yo")}</em></h2>
                <p className="mt-1.5 text-sm" style={{ color: C.muted }}>{tt("Dokiman ou siyen pou chak Sòl — ou ka gade yo, ou pa ka modifye yo.")}</p>

                <a href="https://blicpayht.com/BLIC_Global_Fiche_Solde_Remplissable.pdf" target="_blank" rel="noreferrer"
                  className="bp-btn mt-3 flex items-center gap-2.5 p-3 rounded-xl" style={{ background: '#E6F0FB' }}>
                  <FileText size={16} color={C.navy} className="shrink-0" />
                  <div className="text-left">
                    <p className="text-xs font-semibold" style={{ color: C.navy }}>{tt("Telechaje fòm enskripsyon an")}</p>
                    <p className="text-xs mt-0.5" style={{ color: C.muted }}>{tt("Ranpli l epi voye l pa email, WhatsApp, oswa nan biwo a.")}</p>
                  </div>
                </a>

                <div className="mt-5 space-y-4">
                  {mySolMemberships.length === 0 ? (
                    <p className="text-sm p-5 rounded-xl" style={{ color: C.muted, background: C.card, border: `1px solid ${C.border}` }}>{tt("Ou poko gen okenn demand Sòl.")}</p>
                  ) : mySolMemberships.map((m) => (
                    <div key={m.id} className="p-4 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{m.group.name}</h3>
                        <Badge tone={m.formApproved ? 'mint' : 'amber'}>{m.formApproved ? tt("Konfime") : tt("Annatant")}</Badge>
                      </div>
                      {(m.documents || []).length === 0 ? (
                        <p className="mt-2 text-xs" style={{ color: C.muted }}>{tt("Poko gen dokiman telechaje pou Sòl sa a.")}</p>
                      ) : (
                        <div className="mt-2.5 flex flex-col gap-2">
                          {m.documents.map((doc) => (
                            <button key={doc.id} onClick={() => viewSolDocument(doc.id)}
                              className="bp-btn flex items-center justify-between px-3 py-2.5 rounded-lg"
                              style={{ background: C.bg }}>
                              <div className="flex items-center gap-2">
                                <FileText size={14} color={C.navy} />
                                <span className="text-xs font-medium">{doc.title}</span>
                              </div>
                              <span className="text-xs" style={{ color: C.muted }}>{new Date(doc.uploadedAt).toLocaleDateString(CURRENT_LANG === 'en' ? 'en-US' : 'fr-FR')}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {vrActive && (
          <>
            <div onClick={() => !vrBusy && setVrActive(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(11,27,51,0.5)', zIndex: 50 }} />
            <div className="fadein" style={{
              position: 'fixed', left: '5%', right: '5%', bottom: '8%', background: C.card,
              borderRadius: 16, zIndex: 51, padding: 20, maxWidth: 420, margin: '0 auto',
            }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold">{tt(VR_TYPE_LABELS[vrActive.type]) || tt("Voye dokiman")}</p>
                <button onClick={() => !vrBusy && setVrActive(null)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.bg }}>
                  <X size={14} color={C.muted} />
                </button>
              </div>
              {vrActive.note && <p className="text-xs mb-3" style={{ color: C.muted }}>{vrActive.note}</p>}
              {vrError && <p className="text-xs mb-3" style={{ color: C.danger }}>{vrError}</p>}
              <label className="flex flex-col items-center justify-center gap-2 rounded-xl py-8 cursor-pointer"
                style={{ border: `1.5px dashed ${C.border}`, background: C.bg }}>
                <FileText size={22} color={C.muted} />
                <span className="text-xs font-semibold" style={{ color: C.navy }}>{tt("Chwazi yon foto oswa PDF")}</span>
                <input type="file" accept="image/*,application/pdf" className="hidden" disabled={vrBusy}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) submitVerificationRequest(vrActive.id, f); }} />
              </label>
              {vrBusy && <p className="text-xs text-center mt-3" style={{ color: C.muted }}>{tt("Ap voye...")}</p>}
            </div>
          </>
        )}

        {viewingSolDocument && (
          <>
            <div onClick={() => setViewingSolDocument(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(11,27,51,0.5)', zIndex: 50 }} />
            <div className="fadein" style={{
              position: 'fixed', top: '8%', left: '5%', right: '5%', bottom: '8%', background: C.card,
              borderRadius: 16, zIndex: 51, display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
                <p className="text-sm font-semibold">{viewingSolDocument.title}</p>
                <button onClick={() => setViewingSolDocument(null)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.bg }}>
                  <X size={14} color={C.muted} />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-3" style={{ background: C.bg }}>
                {viewingSolDocument.fileMimeType?.startsWith('image/') ? (
                  <img src={`data:${viewingSolDocument.fileMimeType};base64,${viewingSolDocument.fileData}`} alt={viewingSolDocument.title}
                    className="w-full rounded-lg" />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 py-10">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                      <FileText size={28} color={C.navy} />
                    </div>
                    <p className="text-sm text-center px-6" style={{ color: C.muted }}>
                      {tt("Dokiman sa a se yon fichye PDF — louvri l pou ka gade l byen.")}
                    </p>
                    <button
                      onClick={() => {
                        try {
                          const byteChars = atob(viewingSolDocument.fileData);
                          const byteNumbers = new Array(byteChars.length);
                          for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
                          const blob = new Blob([new Uint8Array(byteNumbers)], { type: viewingSolDocument.fileMimeType });
                          const url = URL.createObjectURL(blob);
                          window.open(url, '_blank');
                        } catch (e) {
                          flash(tt("Nou pa t ka louvri dokiman an."), 'error');
                        }
                      }}
                      className="bp-btn px-5 py-3 rounded-xl text-sm font-semibold text-white"
                      style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})` }}>
                      {tt("Louvri dokiman an")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {(appLocked || pinScreen) && (
          <>
            <div style={{ position: 'fixed', inset: 0, background: appLocked && !pinScreen ? C.bg : 'rgba(11,27,51,0.55)', zIndex: 60 }} />
            <div className="fadein" style={{
              position: 'fixed', inset: 0, zIndex: 61, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
            }}>
              <div style={{ width: '100%', maxWidth: 340, background: C.card, borderRadius: 20, overflow: 'hidden' }}>

                {(pinScreen === 'withdraw' || pinScreen === 'setup') ? (
                  <div style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, padding: '26px 20px 22px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: -30, right: -30, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                    <div style={{ position: 'absolute', bottom: -40, left: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                    <div className="flex items-center gap-2" style={{ position: 'relative' }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.18)' }}>
                        <ShieldCheck size={15} color="#fff" />
                      </div>
                      <span className="text-white text-sm font-semibold">{tt("BLICPay Sekirite")}</span>
                    </div>
                    {pinScreen === 'withdraw' && pendingWithdraw ? (
                      <>
                        <p style={{ position: 'relative', margin: '16px 0 0', color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>{tt("Konfime retrè")}</p>
                        <p style={{ position: 'relative', margin: '2px 0 0', color: '#fff', fontSize: 28, fontWeight: 700 }}>{money(pendingWithdraw.amount)}</p>
                        <p style={{ position: 'relative', margin: '2px 0 0', color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>{tt("Vè")} {pendingWithdraw.method.name}</p>
                        <div style={{ position: 'relative', marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                          <div className="flex items-center justify-between">
                            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11.5 }}>{tt("Frè")}</span>
                            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11.5 }}>{pendingWithdraw.fee > 0 ? money(pendingWithdraw.fee) : tt("Gratis")}</span>
                          </div>
                          <div className="flex items-center justify-between" style={{ marginTop: 2 }}>
                            <span style={{ color: '#fff', fontSize: 12.5, fontWeight: 600 }}>{tt("Total ki soti nan balans ou")}</span>
                            <span style={{ color: '#fff', fontSize: 12.5, fontWeight: 700 }}>{money(pendingWithdraw.amount + (pendingWithdraw.fee || 0))}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <p style={{ position: 'relative', margin: '16px 0 0', color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>{tt("Premye etap")}</p>
                        <p style={{ position: 'relative', margin: '2px 0 0', color: '#fff', fontSize: 18, fontWeight: 700 }}>{tt("Kreye kòd PIN ou")}</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, padding: '32px 20px 30px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: -40, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                    <div style={{ position: 'absolute', bottom: -30, right: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                    <div className="w-15 h-15 rounded-full flex items-center justify-center mx-auto" style={{ position: 'relative', width: 60, height: 60, background: 'rgba(255,255,255,0.15)', fontSize: 20, fontWeight: 700, color: '#fff' }}>
                      {(user?.fullName || '').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <p style={{ position: 'relative', margin: '12px 0 0', color: '#fff', fontSize: 15, fontWeight: 600 }}>{tt("Byenvini,")} {(user?.fullName || '').split(' ')[0]}</p>
                    <p style={{ position: 'relative', margin: '3px 0 0', color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>{tt("BLICPay")}</p>
                  </div>
                )}

                <div style={{ padding: '22px 20px 24px' }}>
                  {pinScreen === 'setup' && (
                    <input type="password" value={pinSetupPassword} onChange={(e) => setPinSetupPassword(e.target.value)}
                      placeholder={tt("Modpas kont ou (pou konfime)")}
                      className="w-full mb-4 px-3 py-2.5 rounded-lg text-sm" style={{ border: `1px solid ${C.border}` }} />
                  )}

                  <p className="text-center text-sm mb-3.5" style={{ color: C.ink }}>
                    {pinScreen === 'setup' ? tt("Chwazi yon kòd PIN 4 chif") : pinScreen === 'unlock' ? tt("Antre kòd PIN ou pou kontinye") : tt("Antre kòd PIN 4 chif ou")}
                  </p>

                  <div className="flex justify-center gap-3.5 mb-5">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} style={{
                        width: 14, height: 14, borderRadius: '50%',
                        background: i < pinDigits.length ? C.navy : 'transparent',
                        border: i < pinDigits.length ? 'none' : `1.5px solid ${C.border}`,
                      }} />
                    ))}
                  </div>

                  {pinError && <p className="text-center text-xs mb-3" style={{ color: C.danger }}>{pinError}</p>}

                  <div className="grid grid-cols-3 gap-2.5">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                      <button key={d} onClick={() => pinDigitPress(d)} disabled={pinBusy}
                        className="bp-btn rounded-xl text-lg font-semibold" style={{ height: 54, border: `0.5px solid ${C.border}`, background: '#fff', color: C.ink }}>
                        {d}
                      </button>
                    ))}
                    <div />
                    <button onClick={() => pinDigitPress('0')} disabled={pinBusy}
                      className="bp-btn rounded-xl text-lg font-semibold" style={{ height: 54, border: `0.5px solid ${C.border}`, background: '#fff', color: C.ink }}>
                      0
                    </button>
                    <button onClick={pinBackspace} disabled={pinBusy}
                      className="bp-btn rounded-xl flex items-center justify-center" style={{ height: 54, border: 'none', background: 'transparent' }}>
                      <X size={18} color={C.muted} />
                    </button>
                  </div>

                  {pinScreen === 'setup' && (
                    <button onClick={submitPinSetup} disabled={pinBusy}
                      className="bp-btn mt-4 w-full py-2.5 rounded-lg text-sm font-semibold text-white"
                      style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, opacity: pinBusy ? 0.7 : 1 }}>
                      {pinBusy ? tt("Ap konfime...") : tt("Kreye kòd PIN")}
                    </button>
                  )}

                  {pinScreen === 'unlock' ? (
                    <button onClick={() => { localStorage.removeItem('blicpay_session'); window.location.reload(); }}
                      className="mt-4 w-full text-center text-xs font-semibold" style={{ color: C.navy, background: 'transparent', border: 'none' }}>
                      {tt("Sòti — konekte ak modpas ou pito")}
                    </button>
                  ) : (
                    <button onClick={cancelPinScreen} className="mt-4 w-full text-center text-xs font-semibold" style={{ color: C.muted, background: 'transparent', border: 'none' }}>
                      {tt("Anile")}
                    </button>
                  )}

                  <div className="flex items-center justify-center gap-1.5 mt-4">
                    <Lock size={12} color={C.muted} />
                    <p className="text-xs" style={{ color: C.muted }}>{tt("Kòd sa a rete ant ou ak BLICPay sèlman")}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}


        {view === 'kyc' && kycStep === 'entwo' && (
          <div className="fadein px-5 pb-10 pt-2">
            <button onClick={() => setView('dashboard')} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
              <ArrowLeft size={15} /> {tt("Retounen")}
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})` }}>
                <ShieldCheck size={28} color="#fff" />
              </div>
              <h2 className="mt-3" style={{ ...fontDisplay, fontWeight: 800, fontSize: 20 }}>{tt("Verifye@@verb")} <em style={{ fontStyle: 'italic', color: C.sky }}>{tt("idantite ou")}</em></h2>
              <p className="mt-1.5 text-sm max-w-xs" style={{ color: C.muted }}>
                {tt("Nou sèvi ak yon patnè sekirize (Didit) pou verifye dokiman w ak yon foto vivan — pran sèlman kèk minit.")}
              </p>
            </div>

            <div className="mt-6 p-4 rounded-xl flex items-center gap-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: C.bg }}>
                <span style={{ ...fontDisplay, fontWeight: 700, color: C.navy }}>
                  {(user?.fullName || 'JB').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold">{user?.fullName}</p>
                <p className="text-xs mt-0.5" style={{ color: C.muted }}>{user?.phone}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              {[
                tt("Prepare paspò w, CIN, oswa lisans chofè w."),
                tt("Ou pral pran yon foto dokiman an ak yon selfi vivan sou platfòm Didit."),
                tt("Rezilta a rive an kèk minit — men yon admin BLICPay dwe konfime l anvan kont ou verifye nèt."),
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: C.bg }}>
                    <span className="text-xs font-bold" style={{ color: C.navy }}>{i + 1}</span>
                  </div>
                  <p className="text-sm" style={{ color: C.ink }}>{tip}</p>
                </div>
              ))}
            </div>

            <button onClick={startDiditVerification} disabled={kycSubmitting}
              className="bp-btn mt-7 w-full py-3.5 rounded-xl font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, opacity: kycSubmitting ? 0.7 : 1 }}>
              {kycSubmitting ? tt("Ap prepare...") : tt("Kòmanse verifikasyon")}
            </button>
            <p className="mt-3 text-xs text-center" style={{ color: C.muted }}>
              {tt("Ou pral kite BLICPay pou yon moman pou konplete verifikasyon an sou Didit.")}
            </p>
          </div>
        )}

        {view === 'kyc' && kycStep === 'retou' && (
          <div className="fadein px-5 pb-10 pt-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: C.mint }}>
              <Check size={38} color="#fff" />
            </div>
            <h2 className="mt-5" style={{ ...fontDisplay, fontWeight: 800, fontSize: 21 }}>
              {tt("Verifikasyon")} <em style={{ fontStyle: 'italic', color: C.mint }}>{tt("resevwa")}</em>
            </h2>
            <p className="mt-2 text-sm max-w-xs" style={{ color: C.muted }}>
              {tt("Nou resevwa rezilta verifikasyon w. Yon admin BLICPay ap egzamine l anvan konfimasyon final — sa ka pran kèk moman jiska kèk èdtan.")}
            </p>

            <div className="mt-7 w-full max-w-xs p-4 rounded-xl text-left" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <p className="text-xs font-bold uppercase" style={{ color: C.muted }}>{tt("Pwochèn etap")}</p>
              <div className="mt-3 flex items-start gap-2.5">
                <Badge tone="amber">1</Badge>
                <p className="text-sm mt-0.5">{tt("Admin BLICPay ap egzamine rapò verifikasyon an.")}</p>
              </div>
              <div className="mt-2.5 flex items-start gap-2.5">
                <Badge tone="amber">2</Badge>
                <p className="text-sm mt-0.5">{tt("W ap resevwa yon notifikasyon lè estati w chanje.")}</p>
              </div>
            </div>

            <button onClick={() => setView('dashboard')}
              className="bp-btn mt-8 w-full max-w-xs py-3.5 rounded-xl font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})` }}>
              {tt("Retounen nan akèy")}
            </button>
          </div>
        )}

        {view === 'blicdepo' && (
          <div className="fadein px-5 pb-10 pt-2">
            <button onClick={() => setView('dashboard')} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
              <ArrowLeft size={15} /> {tt("Retounen")}
            </button>
            <div className="flex items-center justify-between">
              <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>{tt("BLIC")} <em style={{ fontStyle: 'italic', color: C.sky }}>{tt("Depo")}</em></h2>
              <button onClick={() => { setShowNewPocket((s) => !s); setShowAddMoney(false); }} className="text-xs font-semibold flex items-center gap-1" style={{ color: C.navy }}>
                <Plus size={13} /> {tt("Nouvo pòch")}
              </button>
            </div>
            <p className="mt-1.5 text-sm" style={{ color: C.muted }}>{tt("Epay, transfere, epi retire lajan ou nan pòch separe.")}</p>

            <button onClick={() => {
              setAddMoneyPocketId(pockets[0]?.id || null);
              setAddMoneyAmount('');
              setShowAddMoney((s) => !s);
              setShowNewPocket(false);
            }}
              className="bp-btn mt-4 w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})` }}>
              <ArrowDownLeft size={16} /> {tt("Ajoute lajan")}
            </button>

            {showAddMoney && (
              <div className="mt-3 p-4 rounded-xl space-y-2.5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                {pockets.length === 0 ? (
                  <p className="text-sm" style={{ color: C.muted }}>{tt("Kreye yon pòch anvan pou ka ajoute lajan.")}</p>
                ) : (
                  <>
                    <p className="text-xs font-semibold" style={{ color: C.muted }}>{tt("NAN KIYÈS PÒCH")}</p>
                <div className="space-y-2">
                  {pockets.map((p) => (
                    <button key={p.id} onClick={() => setAddMoneyPocketId(p.id)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm"
                      style={{ background: C.bg, border: `1px solid ${addMoneyPocketId === p.id ? C.navy : C.border}` }}>
                      {p.name}
                      {addMoneyPocketId === p.id && <Check size={15} color={C.navy} />}
                    </button>
                  ))}
                </div>
                <p className="text-xs font-semibold pt-1" style={{ color: C.muted }}>{tt("MONTAN (SOTI NAN KONT PRENSIPAL)")}</p>
                <div className="relative">
                  <input value={addMoneyAmount} onChange={(e) => setAddMoneyAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="0.00" inputMode="decimal"
                    className="w-full pl-3.5 pr-14 py-2.5 rounded-lg text-sm font-semibold"
                    style={{ background: C.bg, border: `1px solid ${C.border}`, ...fontMono }} />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-semibold text-xs" style={{ color: C.muted }}>HTG</span>
                </div>
                <p className="text-xs" style={{ color: C.muted }}>
                  {tt("Sòld disponib:")} <span style={{ ...fontMono, color: C.ink, fontWeight: 600 }}>{money(balance)}</span>
                </p>
                <button onClick={addMoneyToPocket} disabled={addMoneyProcessing}
                  className="bp-btn w-full py-2.5 rounded-lg text-sm font-semibold text-white"
                  style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, opacity: addMoneyProcessing ? 0.7 : 1 }}>
                  {addMoneyProcessing ? tt("Ap trete...") : tt("Konfime@@btn")}
                </button>
                  </>
                )}
              </div>
            )}

            {showNewPocket && (
              <div className="mt-4 p-4 rounded-xl space-y-2.5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <input value={newPocketName} onChange={(e) => setNewPocketName(e.target.value)}
                  placeholder={tt("Non pòch la (egz. Lekòl)")}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm" style={{ background: C.bg, border: `1px solid ${C.border}` }} />
                <input value={newPocketTarget} onChange={(e) => setNewPocketTarget(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder={tt("Objektif an HTG (opsyonèl)")}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm" style={{ background: C.bg, border: `1px solid ${C.border}` }} />
                <button onClick={createPocket}
                  className="bp-btn w-full py-2.5 rounded-lg text-sm font-semibold text-white"
                  style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})` }}>
                  {tt("Kreye pòch la")}
                </button>
              </div>
            )}

            <div className="mt-5 space-y-3">
              {pockets.map((p) => {
                const pct = p.target ? Math.min(100, Math.round((p.balance / p.target) * 100)) : null;
                return (
                  <button key={p.id} onClick={() => openPocket(p.id)}
                    className="bp-btn w-full p-4 rounded-xl text-left"
                    style={{ background: C.card, border: `1px solid ${C.border}` }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#E4F5EF' }}>
                          <PiggyBank size={16} color={C.mint} />
                        </div>
                        <span className="text-sm font-semibold">{p.name}</span>
                      </div>
                      <ChevronRight size={16} color={C.muted} />
                    </div>
                    <p className="mt-2.5" style={{ ...fontMono, fontSize: 18, fontWeight: 600 }}>{money(p.balance)}</p>
                    {p.target ? (
                      <>
                        <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: C.bg }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: C.mint }} />
                        </div>
                        <p className="mt-1.5 text-xs" style={{ color: C.muted }}>{pct}{tt("% sou objektif")} {money(p.target)}</p>
                      </>
                    ) : (
                      <p className="mt-1.5 text-xs" style={{ color: C.muted }}>{tt("Pa gen objektif mete")}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {view === 'blicdepo-detail' && (() => {
          const pocket = pockets.find((p) => p.id === activePocketId);
          if (!pocket) return null;
          const pct = pocket.target ? Math.min(100, Math.round((pocket.balance / pocket.target) * 100)) : null;
          const otherPockets = pockets.filter((p) => p.id !== pocket.id);
          const pocketTx = tx.filter((t) => t.pocketId === pocket.id);
          return (
            <div className="fadein px-5 pb-10 pt-2">
              <button onClick={() => { setPocketMode(null); setView('blicdepo'); }} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
                <ArrowLeft size={15} /> {tt("Retounen")}
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#E4F5EF' }}>
                  <PiggyBank size={24} color={C.mint} />
                </div>
                <h2 className="mt-3" style={{ ...fontDisplay, fontWeight: 800, fontSize: 20 }}>{pocket.name}</h2>
                <p className="mt-1" style={{ ...fontMono, fontSize: 26, fontWeight: 600 }}>{money(pocket.balance)}</p>
                {pocket.target && (
                  <div className="w-full mt-3">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.bg }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: C.mint }} />
                    </div>
                    <p className="mt-1.5 text-xs" style={{ color: C.muted }}>{pct}{tt("% sou objektif")} {money(pocket.target)}</p>
                  </div>
                )}
              </div>

              {!pocketMode ? (
                <div className="mt-6 grid grid-cols-3 gap-2.5">
                  <button onClick={() => setPocketMode('deposit')} className="bp-btn rounded-xl p-3 flex flex-col items-center gap-2 text-center"
                    style={{ background: C.card, border: `1px solid ${C.border}` }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#E4F5EF' }}>
                      <ArrowDownLeft size={16} color={C.mint} />
                    </div>
                    <span className="text-xs font-semibold">{tt("Epay")}</span>
                  </button>
                  <button onClick={() => setPocketMode('transfer')} className="bp-btn rounded-xl p-3 flex flex-col items-center gap-2 text-center"
                    style={{ background: C.card, border: `1px solid ${C.border}` }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#E6F0FB' }}>
                      <ArrowLeftRight size={16} color={C.navy} />
                    </div>
                    <span className="text-xs font-semibold">{tt("Transfere")}</span>
                  </button>
                  <button onClick={() => setPocketMode('spend')} className="bp-btn rounded-xl p-3 flex flex-col items-center gap-2 text-center"
                    style={{ background: C.card, border: `1px solid ${C.border}` }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#FBEAEA' }}>
                      <ArrowUpRight size={16} color={C.danger} />
                    </div>
                    <span className="text-xs font-semibold">{tt("Retire")}</span>
                  </button>
                </div>
              ) : (
                <div className="mt-6">
                  <p className="text-xs font-semibold mb-1.5" style={{ color: C.muted }}>
                    {pocketMode === 'deposit' ? tt("MONTAN POU EPAY (SOTI NAN KONT PRENSIPAL)")
                      : pocketMode === 'spend' ? tt("MONTAN POU RETIRE")
                      : tt("MONTAN POU TRANSFERE")}
                  </p>
                  <div className="relative">
                    <input value={pocketAmount} onChange={(e) => setPocketAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                      placeholder="0.00" inputMode="decimal"
                      className="w-full pl-4 pr-16 py-3.5 rounded-xl text-lg font-semibold"
                      style={{ background: C.card, border: `1px solid ${C.border}`, ...fontMono }} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-sm" style={{ color: C.muted }}>HTG</span>
                  </div>

                  {pocketMode === 'transfer' && (
                    <>
                      <p className="text-xs font-semibold mt-4 mb-1.5" style={{ color: C.muted }}>{tt("KOTE POU VOYE L")}</p>
                      <div className="space-y-2">
                        <button onClick={() => setPocketTransferTarget('main')}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm"
                          style={{ background: C.card, border: `1px solid ${pocketTransferTarget === 'main' ? C.navy : C.border}` }}>
                          {tt("Kont prensipal")}
                          {pocketTransferTarget === 'main' && <Check size={15} color={C.navy} />}
                        </button>
                        {otherPockets.map((p) => (
                          <button key={p.id} onClick={() => setPocketTransferTarget(p.id)}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm"
                            style={{ background: C.card, border: `1px solid ${pocketTransferTarget === p.id ? C.navy : C.border}` }}>
                            {p.name}
                            {pocketTransferTarget === p.id && <Check size={15} color={C.navy} />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="flex gap-2.5 mt-5">
                    <button onClick={() => setPocketMode(null)}
                      className="bp-btn flex-1 py-3 rounded-xl font-semibold text-sm" style={{ border: `1px solid ${C.border}`, color: C.muted }}>
                      {tt("Anile")}
                    </button>
                    <button onClick={confirmPocketAction} disabled={pocketProcessing}
                      className="bp-btn flex-1 py-3 rounded-xl font-semibold text-sm text-white"
                      style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, opacity: pocketProcessing ? 0.7 : 1 }}>
                      {pocketProcessing ? tt("Ap trete...") : tt("Konfime@@btn")}
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-7 flex items-center justify-between">
                <h3 className="font-semibold text-sm" style={{ color: C.muted }}>{tt("ISTWA TRANZAKSYON")}</h3>
              </div>
              <div className="mt-3 rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                {pocketTx.length === 0 ? (
                  <p className="text-sm p-4" style={{ color: C.muted, background: C.card }}>{tt("Pa gen tranzaksyon nan pòch sa a.")}</p>
                ) : pocketTx.map((t, i) => {
                  const isOutgoing = t.kind === 'depanse' || t.kind === 'transfè-soti';
                  const KindIcon = t.kind === 'epay' ? ArrowDownLeft
                    : t.kind === 'depanse' ? ArrowUpRight
                    : t.kind === 'transfè-soti' ? ArrowLeftRight
                    : ArrowDownLeft;
                  return (
                    <div key={t.id} className="flex items-center justify-between px-4 py-3.5"
                      style={{ background: C.card, borderTop: i ? `1px solid ${C.border}` : 'none' }}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: isOutgoing ? '#FBEAEA' : '#E4F5EF' }}>
                          <KindIcon size={13} color={isOutgoing ? C.danger : C.mint} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{tt(t.method)}</p>
                          <p className="text-xs mt-0.5" style={{ color: C.muted }}>{t.date}</p>
                        </div>
                      </div>
                      <span className="text-sm" style={{ ...fontMono, color: isOutgoing ? C.danger : C.ink }}>
                        {isOutgoing ? '-' : '+'}{money(t.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {view === 'termdepo' && (
          <div className="fadein px-5 pb-10 pt-2">
            <button onClick={() => setView('dashboard')} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
              <ArrowLeft size={15} /> {tt("Retounen")}
            </button>
            <div className="flex items-center justify-between">
              <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>{tt("Depo Ak")} <em style={{ fontStyle: 'italic', color: C.sky }}>{tt("Objektif")}</em></h2>
              <button onClick={() => setView('termdepo-new')} className="text-xs font-semibold flex items-center gap-1" style={{ color: C.navy }}>
                <Plus size={13} /> {tt("Nouvo objektif")}
              </button>
            </div>
            <p className="mt-1.5 text-sm" style={{ color: C.muted }}>
              {tt("Fikse yon objektif — lajan an rete bloke jistan ou atenn li.")}
            </p>

            <div className="mt-5 space-y-3">
              {goalDeposits.length === 0 && (
                <p className="text-sm p-4 rounded-xl" style={{ color: C.muted, background: C.card, border: `1px solid ${C.border}` }}>
                  {tt("Ou poko gen okenn objektif.")}
                </p>
              )}
              {goalDeposits.map((gd) => {
                const pct = Math.min(100, Math.round((gd.current / gd.target) * 100));
                const reached = gd.status === 'rive';
                return (
                  <button key={gd.id} onClick={() => openGoal(gd.id)}
                    className="bp-btn w-full p-4 rounded-xl text-left"
                    style={{ background: C.card, border: `1px solid ${C.border}` }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: reached ? '#E4F5EF' : '#F4EBFF' }}>
                          {reached ? <Check size={16} color={C.mint} /> : <Lock size={16} color="#6D3FD1" />}
                        </div>
                        <span className="text-sm font-semibold">{gd.name}</span>
                      </div>
                      <Badge tone={reached ? 'mint' : 'premium'}>{reached ? tt("Atenn") : tt("Bloke")}</Badge>
                    </div>
                    <p className="mt-2.5" style={{ ...fontMono, fontSize: 18, fontWeight: 600 }}>{money(gd.current)}</p>
                    <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: C.bg }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: reached ? C.mint : '#6D3FD1' }} />
                    </div>
                    <p className="mt-1.5 text-xs" style={{ color: C.muted }}>{pct}{tt("% sou objektif")} {money(gd.target)}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {view === 'termdepo-new' && (
          <div className="fadein px-5 pb-10 pt-2">
            <button onClick={() => setView('termdepo')} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
              <ArrowLeft size={15} /> {tt("Retounen")}
            </button>
            <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>{tt("Nouvo")} <em style={{ fontStyle: 'italic', color: C.sky }}>{tt("Objektif")}</em></h2>
            <p className="mt-1.5 text-sm" style={{ color: C.muted }}>{tt("Bay objektif la yon non ak yon montan pou atenn.")}</p>

            <p className="text-xs font-semibold mt-6 mb-2" style={{ color: C.muted }}>{tt("NON OBJEKTIF LA")}</p>
            <input value={newGoalName} onChange={(e) => setNewGoalName(e.target.value)}
              placeholder={tt("Egz. Machin, Lekòl, Kay...")}
              className="w-full px-4 py-3.5 rounded-xl text-sm" style={{ background: C.card, border: `1px solid ${C.border}` }} />

            <p className="text-xs font-semibold mt-5 mb-2" style={{ color: C.muted }}>{tt("MONTAN OBJEKTIF LA")}</p>
            <div className="relative">
              <input value={newGoalTarget} onChange={(e) => setNewGoalTarget(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="0.00" inputMode="decimal"
                className="w-full pl-4 pr-16 py-3.5 rounded-xl text-lg font-semibold"
                style={{ background: C.card, border: `1px solid ${C.border}`, ...fontMono }} />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-sm" style={{ color: C.muted }}>HTG</span>
            </div>

            <div className="mt-4 flex items-start gap-2 text-xs p-3 rounded-lg" style={{ background: '#FBF0DE', color: '#946115' }}>
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              {tt("Lajan ou mete la a ap rete bloke — pa gen retrè ni transfè jistan ou atenn montan objektif la.")}
            </div>

            <button onClick={createGoalDeposit}
              className="bp-btn mt-5 w-full py-3.5 rounded-xl font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})` }}>
              {tt("Kreye objektif la")}
            </button>
          </div>
        )}

        {view === 'termdepo-detail' && (() => {
          const gd = goalDeposits.find((g) => g.id === activeGoalId);
          if (!gd) return null;
          const pct = Math.min(100, Math.round((gd.current / gd.target) * 100));
          const reached = gd.status === 'rive';
          return (
            <div className="fadein px-5 pb-10 pt-2">
              <button onClick={() => setView('termdepo')} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
                <ArrowLeft size={15} /> {tt("Retounen")}
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: reached ? '#E4F5EF' : '#F4EBFF' }}>
                  {reached ? <Check size={24} color={C.mint} /> : <Lock size={24} color="#6D3FD1" />}
                </div>
                <h2 className="mt-3" style={{ ...fontDisplay, fontWeight: 800, fontSize: 20 }}>{gd.name}</h2>
                <p className="mt-1" style={{ ...fontMono, fontSize: 26, fontWeight: 600 }}>{money(gd.current)}</p>
                <div className="w-full mt-3">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.bg }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: reached ? C.mint : '#6D3FD1' }} />
                  </div>
                  <p className="mt-1.5 text-xs" style={{ color: C.muted }}>{pct}{tt("% sou objektif")} {money(gd.target)}</p>
                </div>
              </div>

              {reached ? (
                <>
                  <div className="mt-5 flex items-start gap-2 text-xs p-3 rounded-lg" style={{ background: '#E4F5EF', color: C.mint }}>
                    <Check size={15} className="shrink-0 mt-0.5" />
                    {tt("Objektif la atenn — lajan an disponib kounye a.")}
                  </div>
                  <button onClick={() => withdrawGoal(gd.id)} disabled={goalProcessing}
                    className="bp-btn mt-4 w-full py-3.5 rounded-xl font-semibold text-white"
                    style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, opacity: goalProcessing ? 0.7 : 1 }}>
                    {goalProcessing ? tt("Ap trete...") : tt("Retire nan kont prensipal")}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold mt-6 mb-2" style={{ color: C.muted }}>{tt("AJOUTE LAJAN (SOTI NAN KONT PRENSIPAL)")}</p>
                  <div className="relative">
                    <input value={addGoalAmount} onChange={(e) => setAddGoalAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                      placeholder="0.00" inputMode="decimal"
                      className="w-full pl-4 pr-16 py-3.5 rounded-xl text-lg font-semibold"
                      style={{ background: C.card, border: `1px solid ${C.border}`, ...fontMono }} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-sm" style={{ color: C.muted }}>HTG</span>
                  </div>
                  <p className="mt-2 text-xs" style={{ color: C.muted }}>
                    {tt("Sòld disponib:")} <span style={{ ...fontMono, color: C.ink, fontWeight: 600 }}>{money(balance)}</span>
                  </p>
                  <div className="mt-4 flex items-start gap-2 text-xs p-3 rounded-lg" style={{ background: '#FBF0DE', color: '#946115' }}>
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    {tt("Ou pa ka retire ni transfere lajan sa a jistan objektif la atenn. Nan ka ijans gen yon frè 4,5 % kap soti sou montan w ap retire a.")}
                  </div>
                  <button onClick={addToGoal} disabled={goalProcessing}
                    className="bp-btn mt-4 w-full py-3.5 rounded-xl font-semibold text-white"
                    style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, opacity: goalProcessing ? 0.7 : 1 }}>
                    {goalProcessing ? tt("Ap trete...") : tt("Ajoute nan objektif la")}
                  </button>

                  {gd.current > 0 && (
                    !showEmergency ? (
                      <button onClick={() => setShowEmergency(true)}
                        className="bp-btn mt-2.5 w-full py-3 rounded-xl font-semibold text-sm"
                        style={{ border: `1px solid ${C.border}`, color: C.danger }}>
                        {tt("Retrè ijans (frè 4.5%)")}
                      </button>
                    ) : (
                      <div className="mt-3 p-4 rounded-xl" style={{ background: '#FBEAEA', border: `1px solid #F3CFCC` }}>
                        <p className="text-xs font-semibold" style={{ color: C.danger }}>{tt("RETRÈ IJANS")}</p>
                        <p className="mt-1.5 text-xs" style={{ color: '#8A3530' }}>
                          {tt("Yon frè 4.5% ap prelve sou lajan ki nan objektif la si ou retire l anvan li atenn.")}
                        </p>
                        <div className="mt-3 space-y-1.5 text-sm">
                          <div className="flex items-center justify-between">
                            <span style={{ color: '#8A3530' }}>{tt("Lajan nan objektif la")}</span>
                            <span style={fontMono}>{money(gd.current)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span style={{ color: '#8A3530' }}>{tt("Frè (4.5%)")}</span>
                            <span style={{ ...fontMono, color: C.danger }}>-{money(Math.round(gd.current * EMERGENCY_FEE_RATE))}</span>
                          </div>
                          <div className="flex items-center justify-between pt-1.5" style={{ borderTop: '1px solid #F3CFCC' }}>
                            <span className="font-semibold" style={{ color: '#8A3530' }}>{tt("Ou ap resevwa")}</span>
                            <span style={{ ...fontMono, fontWeight: 700 }}>{money(gd.current - Math.round(gd.current * EMERGENCY_FEE_RATE))}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button onClick={() => setShowEmergency(false)}
                            className="bp-btn flex-1 py-2.5 rounded-lg text-xs font-semibold" style={{ border: `1px solid ${C.border}`, color: C.muted }}>
                            {tt("Anile")}
                          </button>
                          <button onClick={() => emergencyWithdrawGoal(gd.id)} disabled={goalProcessing}
                            className="bp-btn flex-1 py-2.5 rounded-lg text-xs font-semibold text-white"
                            style={{ background: C.danger, opacity: goalProcessing ? 0.7 : 1 }}>
                            {goalProcessing ? tt("Ap trete...") : tt("Konfime retrè ijans")}
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </>
              )}
            </div>
          );
        })()}

        {view === 'loan' && (
          <div className="fadein px-5 pb-10 pt-2">
            <button onClick={() => setView('dashboard')} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
              <ArrowLeft size={15} /> {tt("Retounen")}
            </button>

            {!loan && (
              <div className="flex flex-col items-center text-center pt-10">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#E6F0FB' }}>
                  <HandCoins size={28} color={C.navy} />
                </div>
                <h2 className="mt-4" style={{ ...fontDisplay, fontWeight: 800, fontSize: 20 }}>
                  {tt("BLIC Prè")} <em style={{ fontStyle: 'italic', color: C.sky }}>{tt("ap vini talè")}</em>
                </h2>
                <p className="mt-2 text-sm max-w-xs" style={{ color: C.muted }}>
                  {tt("N ap travay pou mete fonksyonalite sa a disponib. Rete branche — n ap avize w lè li pare.")}
                </p>
                <Badge tone="amber">{tt("Talè")}</Badge>
              </div>
            )}

            {loan && loan.status === 'annatant' && (
              <>
                <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>{tt("Demand")} <em style={{ fontStyle: 'italic', color: C.sky }}>{tt("Prè")}</em></h2>
                <div className="mt-5 p-5 rounded-2xl text-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ background: '#FBF0DE' }}>
                    <Clock size={24} color={C.amber} />
                  </div>
                  <p className="mt-3 font-semibold text-sm">{tt("N ap egzamine demand ou")}</p>
                  <p className="mt-1 text-xs" style={{ color: C.muted }}>{money(loan.amount)} · {loan.months} {tt("mwa")}</p>
                  <button onClick={checkLoanStatus}
                    className="bp-btn mt-4 w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                    style={{ border: `1px solid ${C.border}`, color: C.muted }}>
                    <RefreshCw size={13} style={checkingLoan ? { animation: 'spin 0.8s linear infinite' } : undefined} />
                    {checkingLoan ? tt("Ap tcheke...") : tt("Tcheke estati")}
                  </button>
                </div>
              </>
            )}

            {loan && (loan.status === 'aktif' || loan.status === 'fini') && (() => {
              const paidCount = loan.installments.filter((i) => i.status === 'peye').length;
              const pct = Math.round((paidCount / loan.months) * 100);
              const next = loan.installments.find((i) => i.status === 'annatant');
              return (
                <>
                  <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>
                    {tt("Prè")} <em style={{ fontStyle: 'italic', color: C.sky }}>{loan.status === 'fini' ? tt("Peye") : tt("Aktif")}</em>
                  </h2>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                      <p className="text-xs" style={{ color: C.muted }}>{tt("Kapital")}</p>
                      <p className="mt-1" style={{ ...fontMono, fontSize: 17, fontWeight: 600 }}>{money(loan.amount)}</p>
                    </div>
                    <div className="p-4 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                      <p className="text-xs" style={{ color: C.muted }}>{tt("Vèsman chak mwa")}</p>
                      <p className="mt-1" style={{ ...fontMono, fontSize: 17, fontWeight: 600 }}>{money(loan.installmentAmount)}</p>
                    </div>
                  </div>

                  <div className="mt-4 p-4 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                    <div className="flex items-center justify-between text-xs" style={{ color: C.muted }}>
                      <span>{tt("Pwogrè ranbousman")}</span>
                      <span>{paidCount}/{loan.months} {tt("vèsman")}</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: C.bg }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: loan.status === 'fini' ? C.mint : C.navy }} />
                    </div>
                  </div>

                  {loan.status === 'fini' ? (
                    <div className="mt-4 flex items-start gap-2 text-xs p-3 rounded-lg" style={{ background: '#E4F5EF', color: C.mint }}>
                      <Check size={15} className="shrink-0 mt-0.5" />
                      {tt("Prè a peye nèt. Ou ka mande yon lòt lè ou vle.")}
                    </div>
                  ) : (
                    <button onClick={payLoanInstallment} disabled={loanProcessing}
                      className="bp-btn mt-4 w-full py-3.5 rounded-xl font-semibold text-white"
                      style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, opacity: loanProcessing ? 0.7 : 1 }}>
                      {loanProcessing ? tt("Ap trete...") : tt("Peye vèsman {0} ({1})", next?.n, money(next?.amount || 0))}
                    </button>
                  )}

                  <h3 className="font-semibold text-sm mt-7 mb-3" style={{ color: C.muted }}>{tt("ECHEANSYE")}</h3>
                  <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                    {loan.installments.map((i, idx) => (
                      <div key={i.n} className="flex items-center justify-between px-4 py-3"
                        style={{ background: C.card, borderTop: idx ? `1px solid ${C.border}` : 'none' }}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ background: i.status === 'peye' ? '#E4F5EF' : '#EEF1F6' }}>
                            {i.status === 'peye' ? <Check size={14} color={C.mint} /> : <Clock size={14} color={C.muted} />}
                          </div>
                          <span className="text-sm font-medium">{tt("Vèsman")} {i.n} · {i.month}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span style={fontMono} className="text-sm">{money(i.amount)}</span>
                          <Badge tone={i.status === 'peye' ? 'mint' : 'muted'}>{i.status === 'peye' ? tt("Peye") : tt("Annatant")}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {loan.status === 'fini' && (
                    <button onClick={() => { setLoan(null); }}
                      className="bp-btn mt-5 w-full py-3 rounded-xl font-semibold text-sm"
                      style={{ border: `1px solid ${C.border}`, color: C.navy }}>
                      {tt("Mande yon nouvo prè")}
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {view === 'settings' && (
          <div className="fadein px-5 pb-10 pt-2">
            <button onClick={() => setView('dashboard')} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
              <ArrowLeft size={15} /> {tr('back')}
            </button>
            <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>{tr('settingsTitle')}</h2>

            {/* profile card */}
            <div className="mt-5 p-4 rounded-xl flex items-center gap-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})` }}>
                <span style={{ ...fontDisplay, fontWeight: 700, color: '#fff' }}>{initials(user?.fullName || 'JB')}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold">{user?.fullName}</p>
                  {accountVerified && <BadgeCheck size={15} color={C.sky} fill={C.navy} />}
                </div>
                <p className="text-xs mt-0.5" style={{ color: C.muted }}>{user?.phone}</p>
                <button onClick={() => { navigator.clipboard?.writeText(getClientId(user)); flash(tt("ID kopye.")); }}
                  className="flex items-center gap-1 mt-0.5" style={{ ...fontMono, color: C.navy }}>
                  <span className="text-xs">ID: {getClientId(user)}</span>
                  <Copy size={11} />
                </button>
              </div>
              <Badge tone={accountVerified ? 'mint' : kycStatus === 'annatant' ? 'amber' : 'muted'}>
                {accountVerified ? tt("Verifye") : kycStatus === 'annatant' ? tt("Annatant") : tt("Pa verifye")}
              </Badge>
            </div>

            {/* account section */}
            <p className="mt-6 text-xs font-semibold" style={{ color: C.muted }}>{tr('accountSection')}</p>
            <div className="mt-2 rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
              <button onClick={openEditProfile}
                className="w-full flex items-center justify-between px-4 py-3.5" style={{ background: C.card }}>
                <div className="flex items-center gap-2.5">
                  <User size={16} color={C.muted} />
                  <span className="text-sm font-medium">{tr('editProfile')}</span>
                </div>
                <ChevronRight size={15} color={C.muted} />
              </button>
              <button onClick={() => { if (!accountVerified) { setKycStep('entwo'); setView('kyc'); } }}
                disabled={accountVerified}
                className="w-full flex items-center justify-between px-4 py-3.5" style={{ background: C.card, borderTop: `1px solid ${C.border}`, opacity: accountVerified ? 0.55 : 1, cursor: accountVerified ? 'default' : 'pointer' }}>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={16} color={C.muted} />
                  <span className="text-sm font-medium">KYC</span>
                </div>
                {accountVerified ? (
                  <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: C.mint }}>
                    <BadgeCheck size={14} /> {tt("Verifye")}
                  </span>
                ) : (
                  <ChevronRight size={15} color={C.muted} />
                )}
              </button>
              <button onClick={() => { setPwForm({ current: '', next: '', confirm: '' }); setPwError(''); setView('changepassword'); }}
                className="w-full flex items-center justify-between px-4 py-3.5" style={{ background: C.card, borderTop: `1px solid ${C.border}` }}>
                <div className="flex items-center gap-2.5">
                  <Lock size={16} color={C.muted} />
                  <span className="text-sm font-medium">{tr('changePassword')}</span>
                </div>
                <ChevronRight size={15} color={C.muted} />
              </button>
            </div>

            {/* preferences section */}
            <p className="mt-6 text-xs font-semibold" style={{ color: C.muted }}>{tr('prefsSection')}</p>
            <div className="mt-2 rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
              <button onClick={() => setShowLangPicker(true)}
                className="w-full flex items-center justify-between px-4 py-3.5" style={{ background: C.card }}>
                <div className="flex items-center gap-2.5">
                  <Globe size={16} color={C.muted} />
                  <span className="text-sm font-medium">{tr('langLabel')}</span>
                </div>
                <div className="flex items-center gap-1.5" style={{ color: C.muted }}>
                  <span className="text-sm">{LANGS.find((l) => l.code === lang)?.flag} {LANGS.find((l) => l.code === lang)?.label}</span>
                  <ChevronRight size={15} />
                </div>
              </button>
              <div className="w-full flex items-center justify-between px-4 py-3.5" style={{ background: C.card, borderTop: `1px solid ${C.border}` }}>
                <div className="flex items-center gap-2.5">
                  <Eye size={16} color={C.muted} />
                  <span className="text-sm font-medium">{tr('hideBalanceDefault')}</span>
                </div>
                <button onClick={() => setHideBalance((h) => !h)}
                  className="w-11 h-6 rounded-full relative transition-colors"
                  style={{ background: hideBalance ? C.navy : C.border }}>
                  <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                    style={{ left: hideBalance ? 22 : 2 }} />
                </button>
              </div>
            </div>

            {/* support section */}
            <p className="mt-6 text-xs font-semibold" style={{ color: C.muted }}>{tr('supportSection')}</p>
            <div className="mt-2 rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
              <button onClick={() => { setSupportSent(false); setView('support'); }}
                className="w-full flex items-center justify-between px-4 py-3.5" style={{ background: C.card }}>
                <div className="flex items-center gap-2.5">
                  <Bell size={16} color={C.muted} />
                  <span className="text-sm font-medium">{tr('contactSupport')}</span>
                </div>
                <ChevronRight size={15} color={C.muted} />
              </button>
              <button onClick={() => { setAppOpenFaq(null); setView('faq'); }}
                className="w-full flex items-center justify-between px-4 py-3.5" style={{ background: C.card, borderTop: `1px solid ${C.border}` }}>
                <div className="flex items-center gap-2.5">
                  <AlertCircle size={16} color={C.muted} />
                  <span className="text-sm font-medium">{tr('faq')}</span>
                </div>
                <ChevronRight size={15} color={C.muted} />
              </button>
            </div>

            {/* about section */}
            <p className="mt-6 text-xs font-semibold" style={{ color: C.muted }}>{tr('aboutSection')}</p>
            <div className="mt-2 p-4 rounded-xl flex items-center justify-between" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <span className="text-sm" style={{ color: C.muted }}>{tt("BLICPay")}</span>
              <span className="text-sm" style={{ ...fontMono, color: C.muted }}>{tt("v1.0.0")}</span>
            </div>

            <button onClick={logout}
              className="bp-btn mt-6 w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
              style={{ border: `1px solid #F3CFCC`, color: C.danger }}>
              <LogOut size={16} /> {tr('logout')}
            </button>
          </div>
        )}

        {view === 'editprofile' && profileForm && (
          <div className="fadein px-5 pb-10 pt-2">
            <button onClick={() => setView('settings')} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
              <ArrowLeft size={15} /> {tr('back')}
            </button>
            <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>{tr('editProfile')}</h2>

            <div className="mt-5 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})` }}>
                <span style={{ ...fontDisplay, fontWeight: 700, fontSize: 18, color: '#fff' }}>
                  {initials(`${profileForm.firstName} ${profileForm.lastName}`)}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input placeholder={tr('lastNamePh')} value={profileForm.lastName}
                  onChange={(e) => setProfileForm((f) => ({ ...f, lastName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg text-sm" style={{ background: C.card, border: `1px solid ${C.border}` }} />
                <input placeholder={tr('firstNamePh')} value={profileForm.firstName}
                  onChange={(e) => setProfileForm((f) => ({ ...f, firstName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg text-sm" style={{ background: C.card, border: `1px solid ${C.border}` }} />
              </div>
              <input placeholder={tr('phonePh')} value={profileForm.phone}
                onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg text-sm" style={{ background: C.card, border: `1px solid ${C.border}` }} />
              <input placeholder={tr('emailPh')} type="email" value={profileForm.email}
                onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg text-sm" style={{ background: C.card, border: `1px solid ${C.border}` }} />
              <input placeholder={tr('addressPh')} value={profileForm.address}
                onChange={(e) => setProfileForm((f) => ({ ...f, address: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg text-sm" style={{ background: C.card, border: `1px solid ${C.border}` }} />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder={tr('cityPh')} value={profileForm.city}
                  onChange={(e) => setProfileForm((f) => ({ ...f, city: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg text-sm" style={{ background: C.card, border: `1px solid ${C.border}` }} />
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none">🇭🇹</span>
                  <select value={profileForm.country}
                    onChange={(e) => setProfileForm((f) => ({ ...f, country: e.target.value }))}
                    className="w-full pl-9 pr-3 py-3 rounded-lg text-sm appearance-none"
                    style={{ background: C.card, border: `1px solid ${C.border}`, color: profileForm.country ? C.ink : C.muted }}>
                    <option value="" disabled>{tr('countryPh')}</option>
                    {tr('countries').map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <input placeholder={tr('departmentPh')} value={profileForm.department}
                onChange={(e) => setProfileForm((f) => ({ ...f, department: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg text-sm" style={{ background: C.card, border: `1px solid ${C.border}` }} />
            </div>

            <button onClick={saveProfile} disabled={profileSaving}
              className="bp-btn mt-6 w-full py-3.5 rounded-xl font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, opacity: profileSaving ? 0.7 : 1 }}>
              {profileSaving ? tr('waitBtn') : tr('saveBtn')}
            </button>
          </div>
        )}

        {view === 'changepassword' && (
          <div className="fadein px-5 pb-10 pt-2">
            <button onClick={() => setView('settings')} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
              <ArrowLeft size={15} /> {tr('back')}
            </button>
            <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>{tr('changePassword')}</h2>

            <div className="mt-6 space-y-3">
              <input placeholder={tr('currentPasswordPh')} type="password" value={pwForm.current}
                onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg text-sm" style={{ background: C.card, border: `1px solid ${C.border}` }} />
              <input placeholder={tr('newPasswordPh')} type="password" value={pwForm.next}
                onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg text-sm" style={{ background: C.card, border: `1px solid ${C.border}` }} />
              <input placeholder={tr('confirmNewPasswordPh')} type="password" value={pwForm.confirm}
                onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg text-sm" style={{ background: C.card, border: `1px solid ${C.border}` }} />
            </div>

            {pwError && (
              <p className="mt-3 text-xs flex items-center gap-1.5" style={{ color: C.danger }}>
                <AlertCircle size={13} /> {pwError}
              </p>
            )}

            <button onClick={submitChangePassword} disabled={pwSaving}
              className="bp-btn mt-5 w-full py-3.5 rounded-xl font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, opacity: pwSaving ? 0.7 : 1 }}>
              {pwSaving ? tr('waitBtn') : tr('saveBtn')}
            </button>
          </div>
        )}

        {view === 'support' && (
          <div className="fadein px-5 pb-10 pt-2">
            <button onClick={() => setView('settings')} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
              <ArrowLeft size={15} /> {tr('back')}
            </button>
            <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>{tr('contactSupport')}</h2>
            <p className="mt-1.5 text-sm" style={{ color: C.muted }}>{tr('supportSubtitle')}</p>

            <div className="mt-5 space-y-2.5">
              <a href="tel:+13073460474"
                className="bp-btn w-full flex items-center gap-3 p-3.5 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: '#E6F0FB' }}>
                  <Phone size={17} color={C.navy} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{tr('callUs')}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.muted }}>+1 307 346 0474</p>
                </div>
                <ChevronRight size={16} color={C.muted} />
              </a>
              <a href="https://wa.me/13073460474" target="_blank" rel="noopener noreferrer"
                className="bp-btn w-full flex items-center gap-3 p-3.5 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: '#E4F5EF' }}>
                  <Smartphone size={17} color={C.mint} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{tr('chatWhatsapp')}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.muted }}>+1 307 346 0474</p>
                </div>
                <ChevronRight size={16} color={C.muted} />
              </a>
            </div>

            <p className="mt-7 text-xs font-semibold" style={{ color: C.muted }}>{tr('sendMsgTitle')}</p>

            {supportSent ? (
              <div className="mt-3 p-5 rounded-xl text-center" style={{ background: '#E4F5EF' }}>
                <Check size={22} color={C.mint} className="mx-auto" />
                <p className="mt-2 text-sm font-semibold" style={{ color: C.mint }}>{tr('supportSentMsg')}</p>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <select value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-sm"
                  style={{ background: C.card, border: `1px solid ${C.border}`, color: supportSubject ? C.ink : C.muted }}>
                  <option value="" disabled>{tr('subjectPh')}</option>
                  <option value="kont">{tr('accountSection')}</option>
                  <option value="depo">{tr('tileDeposit')}</option>
                  <option value="sol">{tr('tileSol')}</option>
                  <option value="pre">{tr('tileLoan')}</option>
                  <option value="lot">{lang === 'fr' ? tt("Autre") : lang === 'en' ? tt("Other") : tt("Lòt")}</option>
                </select>
                <textarea value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder={tr('messagePh')} rows={4}
                  className="w-full px-4 py-3 rounded-lg text-sm resize-none"
                  style={{ background: C.card, border: `1px solid ${C.border}` }} />
                <button onClick={submitSupportMessage} disabled={supportSending}
                  className="bp-btn w-full py-3.5 rounded-xl font-semibold text-white"
                  style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, opacity: supportSending ? 0.7 : 1 }}>
                  {supportSending ? tr('waitBtn') : tr('sendBtn')}
                </button>
              </div>
            )}
          </div>
        )}

        {view === 'faq' && (
          <div className="fadein px-5 pb-10 pt-2">
            <button onClick={() => setView('settings')} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
              <ArrowLeft size={15} /> {tr('back')}
            </button>
            <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>{tr('faq')}</h2>

            <div className="mt-5 space-y-2.5">
              {APP_FAQS.map((f, i) => (
                <div key={i} className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                  <button onClick={() => setAppOpenFaq(appOpenFaq === i ? null : i)} className="w-full flex items-center justify-between px-4 py-3.5 text-left">
                    <span className="text-sm font-semibold">{f.q}</span>
                    <ChevronRight size={15} color={C.muted} style={{ transform: appOpenFaq === i ? 'rotate(90deg)' : 'none', transition: 'transform .25s ease' }} />
                  </button>
                  {appOpenFaq === i && (
                    <p className="px-4 pb-3.5 text-sm" style={{ color: C.muted }}>{f.a}</p>
                  )}
                </div>
              ))}
            </div>

            <p className="mt-6 text-xs text-center" style={{ color: C.muted }}>
              {lang === 'fr' ? tt("Vous ne trouvez pas votre réponse ?") : lang === 'en' ? tt("Can't find your answer?") : tt("Ou pa jwenn repons ou?")}{' '}
              <button onClick={() => { setSupportSent(false); setView('support'); }} className="font-semibold underline" style={{ color: C.navy }}>
                {tr('contactSupport')}
              </button>
            </p>
          </div>
        )}

        {view === 'history' && (() => {
          const filtered = tx.filter((t) => {
            const outgoing = t.type === 'retrè' || t.type === 'transfè';
            if (historyFilter === 'in' && outgoing) return false;
            if (historyFilter === 'out' && !outgoing) return false;
            if (historyQuery && !t.method.toLowerCase().includes(historyQuery.toLowerCase())) return false;
            if (historyStatusFilter === 'confirmed' && t.status !== 'konfime') return false;
            if (historyStatusFilter === 'pending' && t.status === 'konfime') return false;
            if (t.ts && historyDateFrom) {
              const fromTs = new Date(`${historyDateFrom}T00:00:00`).getTime();
              if (t.ts < fromTs) return false;
            }
            if (t.ts && historyDateTo) {
              const toTs = new Date(`${historyDateTo}T23:59:59`).getTime();
              if (t.ts > toTs) return false;
            }
            return true;
          });
          return (
            <div className="fadein px-5 pb-10 pt-2">
              <button onClick={() => setView('dashboard')} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
                <ArrowLeft size={15} /> {tr('back')}
              </button>
              <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>{tr('historyTitle')}</h2>

              <div className="relative mt-4">
                <Search size={14} color={C.muted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input value={historyQuery} onChange={(e) => setHistoryQuery(e.target.value)}
                  placeholder={tr('searchPh')}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm" style={{ background: C.card, border: `1px solid ${C.border}` }} />
              </div>

              <div className="flex items-center gap-2 mt-3">
                {['all', 'in', 'out'].map((f) => (
                  <button key={f} onClick={() => setHistoryFilter(f)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold"
                    style={{
                      background: historyFilter === f ? C.navy : C.card,
                      color: historyFilter === f ? '#fff' : C.muted,
                      border: `1px solid ${historyFilter === f ? C.navy : C.border}`,
                    }}>
                    {f === 'all' ? tr('filterAll') : f === 'in' ? tr('filterIn') : tr('filterOut')}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-2 overflow-x-auto">
                {['all', 'confirmed', 'pending'].map((f) => (
                  <button key={f} onClick={() => setHistoryStatusFilter(f)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0"
                    style={{
                      background: historyStatusFilter === f ? '#E6F0FB' : C.card,
                      color: historyStatusFilter === f ? C.navy : C.muted,
                      border: `1px solid ${historyStatusFilter === f ? C.navy : C.border}`,
                    }}>
                    {f === 'all' ? tr('statusAll') : f === 'confirmed' ? tr('statusConfirmed') : tr('statusPending')}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1">
                  <p className="text-xs font-semibold mb-1" style={{ color: C.muted }}>{tr('dateFrom')}</p>
                  <div className="relative">
                    <Calendar size={13} color={C.muted} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="date" value={historyDateFrom} max={historyDateTo || undefined}
                      onChange={(e) => setHistoryDateFrom(e.target.value)}
                      className="w-full pl-8 pr-2 py-2 rounded-lg text-xs"
                      style={{ background: C.card, border: `1px solid ${C.border}`, color: C.ink }} />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold mb-1" style={{ color: C.muted }}>{tr('dateTo')}</p>
                  <div className="relative">
                    <Calendar size={13} color={C.muted} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="date" value={historyDateTo} min={historyDateFrom || undefined}
                      onChange={(e) => setHistoryDateTo(e.target.value)}
                      className="w-full pl-8 pr-2 py-2 rounded-lg text-xs"
                      style={{ background: C.card, border: `1px solid ${C.border}`, color: C.ink }} />
                  </div>
                </div>
              </div>
              {(historyDateFrom || historyDateTo) && (
                <button onClick={() => { setHistoryDateFrom(''); setHistoryDateTo(''); }}
                  className="mt-2 text-xs font-semibold" style={{ color: C.danger }}>
                  {tr('clearDates')}
                </button>
              )}

              <div className="mt-4 rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                {filtered.length === 0 ? (
                  <p className="text-sm p-5" style={{ color: C.muted, background: C.card }}>{tr('noResults')}</p>
                ) : filtered.slice(0, historyVisibleCount).map((t, i) => {
                  const outgoing = t.type === 'retrè' || t.type === 'transfè';
                  const logo = getMethodLogo(t.method);
                  return (
                    <div key={t.id} className="flex items-center justify-between px-4 py-3.5"
                      style={{ background: C.card, borderTop: i ? `1px solid ${C.border}` : 'none' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
                          style={{ background: logo ? '#fff' : t.type === 'transfè' ? '#E6F0FB' : outgoing ? '#FBEAEA' : '#E4F5EF', border: logo ? `1px solid ${C.border}` : 'none' }}>
                          {logo ? (
                            <img src={logo} alt={t.method} className="w-full h-full object-cover" />
                          ) : t.type === 'transfè' ? (
                            <ArrowLeftRight size={15} color={C.navy} />
                          ) : outgoing ? (
                            <ArrowUpRight size={15} color={C.danger} />
                          ) : (
                            <ArrowDownLeft size={15} color={C.mint} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{tt(t.method)}</p>
                          <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                            {t.date}
                            {TX_TYPE_LABELS[t.type] && (
                              <> · <span style={{ color: TX_TYPE_LABELS[t.type].color, fontWeight: 600 }}>{tt(TX_TYPE_LABELS[t.type].label)}</span></>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm" style={{ ...fontMono, color: outgoing ? C.danger : C.ink }}>
                          {outgoing ? '-' : '+'}{money(t.amount)}
                        </span>
                        <Badge tone={t.status === 'konfime' ? 'mint' : 'amber'}>
                          {t.status === 'konfime' ? tt("Konfime") : tt("Annatant")}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filtered.length > historyVisibleCount && (
                <button onClick={() => setHistoryVisibleCount((n) => n + 10)}
                  className="mt-3 w-full py-3 rounded-xl text-sm font-semibold"
                  style={{ background: C.card, border: `1px solid ${C.border}`, color: C.navy }}>
                  {tt("Wè 10 lòt (")}{filtered.length - historyVisibleCount} {tt("rete)")}
                </button>
              )}
            </div>
          );
        })()}

        {view === 'transfer' && (
          <div className="fadein px-5 pb-10 pt-2">
            <button onClick={() => setView('dashboard')} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
              <ArrowLeft size={15} /> {tt("Retounen")}
            </button>
            <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>{tt("Transfere")} <em style={{ fontStyle: 'italic', color: C.sky }}>{tt("lajan")}</em></h2>
            <p className="mt-1.5 text-sm" style={{ color: C.muted }}>{tt("Voye HTG bay yon lòt itilizatè BLICPay avèk ID kliyan li.")}</p>

            <div className="mt-6 space-y-3">
              <div>
                <p className="text-xs font-semibold mb-1.5" style={{ color: C.muted }}>{tt("ID KLIYAN DESTINATÈ")}</p>
                <input
                  value={transferId}
                  onChange={(e) => setTransferId(e.target.value.toUpperCase())}
                  placeholder={tt("BP-______")}
                  className="w-full px-4 py-3.5 rounded-xl text-sm"
                  style={{ ...fontMono, background: C.card, border: `1px solid ${C.border}` }}
                />
                <p className="mt-1.5 text-xs" style={{ color: C.muted }}>
                  {tt("Chak kliyan gen yon ID pa yo — ou ka jwenn pa w la nan Paramèt.")}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1.5" style={{ color: C.muted }}>{tt("MONTAN")}</p>
                <div className="relative">
                  <input
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="0.00"
                    inputMode="decimal"
                    className="w-full pl-4 pr-16 py-3.5 rounded-xl text-lg font-semibold"
                    style={{ background: C.card, border: `1px solid ${C.border}`, ...fontMono }}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-sm" style={{ color: C.muted }}>HTG</span>
                </div>
              </div>
            </div>

            <p className="mt-3 text-xs" style={{ color: C.muted }}>
              {tt("Sòld disponib:")} <span style={{ ...fontMono, color: C.ink, fontWeight: 600 }}>{money(balance)}</span>
            </p>

            <button onClick={sendTransfer} disabled={transferProcessing}
              className="bp-btn mt-6 w-full py-3.5 rounded-xl font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, opacity: transferProcessing ? 0.7 : 1 }}>
              {transferProcessing ? tt("Ap voye...") : tt("Voye lajan an")}
            </button>
          </div>
        )}

        {view === 'deposit' && !natcashProofScreen && !biwoBranchScreen && !destinationNumberScreen && (
          <div className="fadein px-5 pb-10 pt-2">
            <button onClick={() => setView('dashboard')} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
              <ArrowLeft size={15} /> {tt("Retounen")}
            </button>
            <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>
              {tt("Konbyen ou vle")} <em style={{ fontStyle: 'italic', color: C.sky }}>{flowKind === 'withdraw' ? tt("retire?") : tt("depoze?")}</em>
            </h2>

            <div className="mt-4 relative">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="0.00"
                inputMode="decimal"
                className="w-full pl-4 pr-16 py-3.5 rounded-xl text-lg font-semibold"
                style={{ background: C.card, border: `1px solid ${C.border}`, ...fontMono }}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-sm" style={{ color: C.muted }}>HTG</span>
            </div>

            {(() => {
              // Yon metòd disponib pou flux sa a (depo oswa retrè)?
              const isOff = (m) => m.comingSoon || (flowKind === 'deposit' && (m.id === 'moncash' || m.id === 'natcash'));
              const cats = METHOD_CATEGORIES.map((c) => {
                const list = methods.filter((m) => c.kinds.includes(m.kind));
                return { ...c, list, available: list.filter((m) => !isOff(m)).length };
              }).filter((c) => c.list.length > 0);
              const active = cats.find((c) => c.id === methodCat) || cats.find((c) => c.available > 0) || cats[0];
              return (
                <>
                  <h3 className="mt-7 font-semibold text-sm uppercase" style={{ color: C.muted }}>{flowKind === 'withdraw' ? tr('chooseCatWithdraw') : tr('chooseCatDeposit')}</h3>
                  <div className="mt-3 grid grid-cols-3 gap-2.5">
                    {cats.map((c) => {
                      const on = c.id === active.id;
                      const Art = CATEGORY_ART[c.id];
                      return (
                        <button key={c.id} onClick={() => setMethodCat(c.id)}
                          className="relative rounded-[22px] p-[2px] text-center transition-all duration-200"
                          style={{
                            background: on ? `linear-gradient(135deg, ${C.navy}, ${C.sky})` : C.border,
                            boxShadow: on ? '0 10px 24px -8px rgba(20,58,115,.45)' : '0 1px 2px rgba(11,27,51,.04)',
                            transform: on ? 'translateY(-2px)' : 'none',
                          }}>
                          <div className="h-full rounded-[20px] px-2 pt-2.5 pb-3 flex flex-col items-center" style={{ background: '#fff' }}>
                            <div className="w-full rounded-2xl flex items-center justify-center py-2" style={{ background: c.tint }}>
                              <div style={{ opacity: on ? 1 : 0.85, transform: on ? 'scale(1.06)' : 'scale(1)', transition: 'all .2s' }}><Art size={52} /></div>
                            </div>
                            <span className="mt-2 text-[13px] font-bold leading-tight" style={{ color: on ? C.navy : C.ink }}>{tr('cat_' + c.id)}</span>
                            {c.available === 0 ? (
                              <span className="mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#FDF3E3', color: C.amber }}>{tr('cat_soon')}</span>
                            ) : (
                              <span className="mt-1 text-[10px] font-medium leading-snug" style={{ color: C.muted }}>{c.list.map((m) => m.name).join(' · ')}</span>
                            )}
                          </div>
                          {on && (
                            <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center shadow-md"
                              style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, border: '2px solid #fff' }}>
                              <Check size={12} color="#fff" strokeWidth={3} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
            <div className="mt-4 space-y-2.5">
              {active.list.map((m) => {
                const depositDisabled = flowKind === 'deposit' && (m.id === 'moncash' || m.id === 'natcash');
                const disabled = m.comingSoon || depositDisabled;
                return (
                  <button key={m.id} onClick={() => pickMethod(m)} disabled={processing}
                    className="bp-btn w-full flex items-center gap-3 p-3.5 rounded-xl text-left"
                    style={{ background: C.card, border: `1px solid ${C.border}`, opacity: processing || disabled ? 0.6 : 1 }}>
                    <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 overflow-hidden" style={{ background: m.logo ? '#fff' : m.color, border: m.logo ? `1px solid ${C.border}` : 'none' }}>
                      {m.logo ? <img src={m.logo} alt={m.name} className="w-full h-full object-cover" /> : <m.icon size={19} color="#fff" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{tt(m.name)}</p>
                        {disabled && <Badge tone="amber">{flowKind === 'deposit' && depositDisabled ? tt("Sèlman pou retrè") : tt("Coming soon")}</Badge>}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: C.muted }}>{tt(m.desc)}</p>
                    </div>
                    {!disabled && (processing && selectedMethod?.id === m.id
                      ? <RefreshCw size={16} color={C.muted} style={{ animation: 'spin 0.8s linear infinite' }} />
                      : <ChevronRight size={16} color={C.muted} />)}
                  </button>
                );
              })}
            </div>
                </>
              );
            })()}
          </div>
        )}

        {view === 'deposit' && destinationNumberScreen && (
          <div className="fadein px-5 pb-10 pt-2">
            <button onClick={() => setDestinationNumberScreen(false)} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
              <ArrowLeft size={15} /> {tt("Chanje metòd")}
            </button>

            <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>
              {tt("Nimewo")} <em style={{ fontStyle: 'italic', color: C.sky }}>{tt(selectedMethod?.name)}</em> {tt("ou")}
            </h2>
            <p className="mt-1.5 text-sm" style={{ color: C.muted }}>
              {money(Number(amount))} {tt("· Kote pou nou voye lajan an")}
            </p>

            <label className="block mt-5 text-xs font-semibold" style={{ color: C.muted }}>
              {tt("NIMEWO")} {selectedMethod?.name?.toUpperCase()} {tt("OU@@caps")}
            </label>
            <input
              value={destinationNumber}
              onChange={(e) => setDestinationNumber(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder={tt("Egzanp: 50912345678")}
              inputMode="numeric"
              className="w-full mt-1.5 px-3.5 py-3 rounded-xl text-sm"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
            />
            <p className="mt-2 text-xs" style={{ color: C.muted }}>
              {tt("Verifye nimewo a byen — nou pral voye lajan an dirèkteman la.")}
            </p>

            <label className="block mt-4 text-xs font-semibold" style={{ color: C.muted }}>
              {tt("NON KI SOU KONT")} {selectedMethod?.name?.toUpperCase()} {tt("SA A")}
            </label>
            <input
              value={destinationName}
              onChange={(e) => setDestinationName(e.target.value)}
              placeholder={tt("Non konplè")}
              className="w-full mt-1.5 px-3.5 py-3 rounded-xl text-sm"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
            />
            <p className="mt-2 text-xs" style={{ color: C.muted }}>
              {tt("Dwe menm non ak sou pwòp kont ou — pou sekirite.")}
            </p>

            <button onClick={confirmDestinationNumber} disabled={!destinationNumber.trim() || !destinationName.trim() || processing}
              className="bp-btn mt-6 w-full py-3.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, opacity: (!destinationNumber.trim() || !destinationName.trim() || processing) ? 0.6 : 1 }}>
              {processing ? tt("Ap trete...") : tt("Kontinye")}
            </button>
          </div>
        )}

        {view === 'deposit' && biwoBranchScreen && (
          <div className="fadein px-5 pb-10 pt-2">
            <button onClick={() => setBiwoBranchScreen(false)} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
              <ArrowLeft size={15} /> {tt("Chanje metòd")}
            </button>

            <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>
              {tt("Chwazi")} <em style={{ fontStyle: 'italic', color: C.sky }}>{tt("siikisal")}</em> {tt("la")}
            </h2>
            <p className="mt-1.5 text-sm" style={{ color: C.muted }}>
              {money(Number(amount))} · {flowKind === 'withdraw' ? tt("Retrè") : tt("Depo")} {tt("nan biwo")}
            </p>

            {loadingBiwoBranches ? (
              <p className="mt-6 text-sm text-center" style={{ color: C.muted }}>{tt("Ap chaje...")}</p>
            ) : biwoBranches.length === 0 ? (
              <p className="mt-6 text-sm p-4 rounded-xl" style={{ color: C.muted, background: C.card, border: `1px solid ${C.border}` }}>
                {tt("Pa gen okenn siikisal disponib toujou.")}
              </p>
            ) : (
              <div className="mt-5 space-y-2.5">
                {biwoBranches.map((b) => (
                  <button key={b} onClick={() => setSelectedBiwoBranch(b)}
                    className="bp-btn w-full flex items-center justify-between p-3.5 rounded-xl text-left"
                    style={{
                      background: C.card,
                      border: selectedBiwoBranch === b ? `2px solid ${C.navy}` : `1px solid ${C.border}`,
                    }}>
                    <span className="text-sm font-semibold">{b}</span>
                    {selectedBiwoBranch === b && <Check size={16} color={C.navy} />}
                  </button>
                ))}
              </div>
            )}

            {flowKind === 'withdraw' && user?.clientId && (
              <div className="mt-5 p-3.5 rounded-xl" style={{ background: '#E6F0FB', border: `1px solid ${C.border}` }}>
                <p className="text-xs" style={{ color: C.navy }}>
                  {tt("Nan biwo a, ajan an ap mande kòd BLICPay ou pou verifye idantite w:")}
                </p>
                <p className="mt-1 text-base font-bold" style={{ ...fontMono, color: C.navy }}>{user.clientId}</p>
              </div>
            )}

            <button onClick={confirmBiwoBranch} disabled={!selectedBiwoBranch || processing}
              className="bp-btn mt-6 w-full py-3.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, opacity: (!selectedBiwoBranch || processing) ? 0.6 : 1 }}>
              {processing ? tt("Ap trete...") : tt("Kontinye")}
            </button>
          </div>
        )}

        {view === 'deposit' && natcashProofScreen && (
          <div className="fadein px-5 pb-10 pt-2">
            <button onClick={() => setNatcashProofScreen(false)} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
              <ArrowLeft size={15} /> {tt("Chanje metòd")}
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden" style={{ background: '#fff', border: `1px solid ${C.border}` }}>
                <img src="/logos/natcash-icon.png" alt={tt("NatCash")} className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 19 }}>{tt("Depo NatCash")}</h2>
                <p className="text-xs" style={{ color: C.muted }}>{money(Number(amount))}</p>
              </div>
            </div>

            <p className="mt-4 text-xs p-3 rounded-lg" style={{ background: '#E6F0FB', color: C.navy }}>
              {tt("Voye")} {money(Number(amount))} {tt("sou nimewo NatCash BLICPay a, epi ajoute ID tranzaksyon an ak yon kapti resi a anba a.")}
            </p>

            <label className="block mt-4 text-xs font-semibold" style={{ color: C.muted }}>{tt("ID TRANZAKSYON AN")}</label>
            <input
              value={natcashTransactionId}
              onChange={(e) => setNatcashTransactionId(e.target.value)}
              placeholder={tt("Egzanp: TXN123456789")}
              className="w-full mt-1.5 px-3.5 py-3 rounded-xl text-sm"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
            />

            <label className="block mt-4 text-xs font-semibold" style={{ color: C.muted }}>{tt("KAPTI RESI A")}</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onNatcashFileSelected(e.target.files?.[0] || null)}
              className="w-full mt-1.5 text-xs"
            />
            {natcashScanning && (
              <p className="mt-1.5 text-xs flex items-center gap-1.5" style={{ color: C.muted }}>
                <RefreshCw size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> {tt("Ap li resi a pou ranpli chan yo otomatikman...")}
              </p>
            )}

            <button onClick={submitNatcashDeposit} disabled={natcashSubmitting}
              className="bp-btn mt-6 w-full py-3.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, opacity: natcashSubmitting ? 0.7 : 1 }}>
              {natcashSubmitting ? tt("Ap verifye resi a...") : tt("Soumèt depo a")}
            </button>
          </div>
        )}

        {view === 'confirm' && selectedMethod && (
          <div className="fadein px-5 pb-10 pt-2">
            <button onClick={() => setView('deposit')} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
              <ArrowLeft size={15} /> {tt("Chanje metòd")}
            </button>

            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden" style={{ background: selectedMethod.logo ? '#fff' : selectedMethod.color, border: selectedMethod.logo ? `1px solid ${C.border}` : 'none' }}>
                {selectedMethod.logo ? <img src={selectedMethod.logo} alt={selectedMethod.name} className="w-full h-full object-cover" /> : <selectedMethod.icon size={26} color="#fff" />}
              </div>
              <h2 className="mt-4" style={{ ...fontDisplay, fontWeight: 800, fontSize: 20 }}>
                {flowKind === 'withdraw' ? tt("Retrè ") : tt("Depo ")}<em style={{ fontStyle: 'italic', color: C.sky }}>{tt(selectedMethod.name)}</em>
              </h2>
              <p className="mt-1 text-sm" style={{ color: C.muted }}>{tt("Montan:")} <span style={{ ...fontMono, color: C.ink, fontWeight: 600 }}>{money(Number(amount))}</span></p>
            </div>

            <div className="mt-6 rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              {selectedMethod.kind === 'mobile' && (
                <>
                  <p className="text-sm" style={{ color: C.muted }}>
                    {tt("Ajoute nimewo sa a nan bous mobil")} {selectedMethod.name} {tt("ou epi otorize depo a:")}
                  </p>
                  <div className="mt-3 flex items-center justify-between py-3 px-3 rounded-lg" style={{ background: C.bg }}>
                    <span style={{ ...fontMono, fontSize: 17 }}>+509 4000 1212</span>
                    <button onClick={() => { navigator.clipboard?.writeText('+50940001212'); flash(tt("Nimewo kopye.")); }}>
                      <Copy size={16} color={C.muted} />
                    </button>
                  </div>
                </>
              )}
              {selectedMethod.kind === 'crypto' && (
                <>
                  <p className="text-sm" style={{ color: C.muted }}>{tt("Voye USDT (rezo TRC20) nan adrès sa a:")}</p>
                  <div className="mt-3 flex items-center justify-between py-3 px-3 rounded-lg" style={{ background: C.bg }}>
                    <span style={{ ...fontMono, fontSize: 12 }}>{tt("TXn9pQz4Rk8s2LmVw7Ht3FybGc1DqEo6Rp")}</span>
                    <button onClick={() => { navigator.clipboard?.writeText('TXn9pQz4Rk8s2LmVw7Ht3FybGc1DqEo6Rp'); flash(tt("Adrès kopye.")); }}>
                      <Copy size={16} color={C.muted} />
                    </button>
                  </div>
                </>
              )}
              {selectedMethod.kind === 'bank' && (
                <>
                  <p className="text-sm" style={{ color: C.muted }}>{tt("Voye depo a ak Zelle nan imèl sa a:")}</p>
                  <div className="mt-3 flex items-center justify-between py-3 px-3 rounded-lg" style={{ background: C.bg }}>
                    <span style={{ ...fontMono, fontSize: 14 }}>{tt("paiement@blicpay.com")}</span>
                    <button onClick={() => { navigator.clipboard?.writeText('paiement@blicpay.com'); flash(tt("Imèl kopye.")); }}>
                      <Copy size={16} color={C.muted} />
                    </button>
                  </div>
                </>
              )}
              {selectedMethod.kind === 'office' && (
                <>
                  <p className="text-sm" style={{ color: C.muted }}>
                    {flowKind === 'withdraw'
                      ? tt("Prezante kòd referans sa a nan youn nan biwo nou yo pou resevwa kach ou:")
                      : tt("Prezante kòd referans sa a lè w ap peye kach nan youn nan biwo nou yo:")}
                  </p>
                  <div className="mt-3 flex items-center justify-between py-3 px-3 rounded-lg" style={{ background: C.bg }}>
                    <span style={{ ...fontMono, fontSize: 17, letterSpacing: 1 }}>{reference}</span>
                    <button onClick={() => { navigator.clipboard?.writeText(reference); flash(tt("Referans kopye.")); }}>
                      <Copy size={16} color={C.muted} />
                    </button>
                  </div>
                  <p className="mt-4 text-xs font-semibold" style={{ color: C.muted }}>{tt("BIWO DISPONIB")}</p>
                  <div className="mt-2 space-y-1.5">
                    {biwoBranchDetails.length > 0 ? biwoBranchDetails.map((b) => (
                      <div key={b.name} className="flex items-start gap-2 text-sm">
                        <Building2 size={14} color={C.muted} className="mt-0.5 shrink-0" />
                        <span>{b.name}{b.address ? ` — ${b.address}` : ''}</span>
                      </div>
                    )) : biwoBranches.map((name) => (
                      <div key={name} className="flex items-center gap-2 text-sm">
                        <Building2 size={14} color={C.muted} />
                        {name}
                      </div>
                    ))}
                  </div>
                </>
              )}
              {selectedMethod.kind !== 'office' && (
                <p className="mt-3 text-xs" style={{ ...fontMono, color: C.muted }}>{tt("Referans:")} {reference}</p>
              )}
            </div>

            <div className="mt-4 flex items-start gap-2 text-xs p-3 rounded-lg" style={{ background: '#FBF0DE', color: '#946115' }}>
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              {flowKind === 'withdraw'
                ? tt("Retrè a ap parèt kòm \"Annatant\" jistan yon admin konfime li nan biwo a.")
                : tt("Depo a ap parèt kòm \"Annatant\" jistan nou konfime li resevwa.")}
            </div>

            <button onClick={() => setView('dashboard')}
              className="bp-btn mt-6 w-full py-3.5 rounded-xl font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})` }}>
              {tt("Bon")}
            </button>
          </div>
        )}

        {/* bottom nav */}
        {view === 'dashboard' && !isBizDash && (
          <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto flex items-center justify-between px-6 py-2.5"
            style={{ background: C.card, borderTop: `1px solid ${C.border}` }}>
            <button className="flex flex-col items-center gap-1.5">
              <div className="flex items-center justify-center rounded-full" style={{ width: 34, height: 34, background: `linear-gradient(135deg, ${C.navy}, ${C.sky})` }}>
                <Home size={16} fill="#fff" strokeWidth={1.5} color="#fff" />
              </div>
              <span className="text-[10px] font-semibold" style={{ color: C.navy }}>{tr('navHome')}</span>
            </button>
            <button onClick={() => setView('history')} className="flex flex-col items-center gap-1.5">
              <div className="flex items-center justify-center" style={{ width: 34, height: 34 }}>
                <Clock size={18} fill={C.muted} strokeWidth={1.2} color={C.muted} />
              </div>
              <span className="text-[10px] font-medium" style={{ color: C.muted }}>{tr('navHistory')}</span>
            </button>
            <button onClick={startDeposit} className="w-12 h-12 rounded-full flex items-center justify-center -mt-6"
              style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, boxShadow: '0 8px 20px rgba(12,68,124,0.35)' }}>
              <Plus size={22} color="#fff" strokeWidth={2.4} />
            </button>
            <button onClick={() => setView('transfer')} className="flex flex-col items-center gap-1.5">
              <div className="flex items-center justify-center" style={{ width: 34, height: 34 }}>
                <ArrowLeftRight size={18} strokeWidth={2} color={C.muted} />
              </div>
              <span className="text-[10px] font-medium" style={{ color: C.muted }}>{tr('navTransfer')}</span>
            </button>
            <button onClick={() => setView('settings')} className="flex flex-col items-center gap-1.5">
              <div className="flex items-center justify-center" style={{ width: 34, height: 34 }}>
                <Settings size={18} fill={C.muted} strokeWidth={1.2} color={C.muted} />
              </div>
              <span className="text-[10px] font-medium" style={{ color: C.muted }}>{tr('navSettings')}</span>
            </button>
          </div>
        )}
      </>
      )}
      </div>
    </div>
  );
}
