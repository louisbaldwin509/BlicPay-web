import React, { useState } from 'react';
import {
  Bell, Wallet, ArrowUpRight, ArrowDownLeft, Clock, Settings, Home,
  ArrowLeftRight, Plus, Check, Copy, ChevronRight, ArrowLeft, ShieldCheck,
  DollarSign, Smartphone, Banknote, X, AlertCircle, Building2, Eye, EyeOff, RefreshCw, Users, BadgeCheck, PiggyBank,
  Lock, Calendar, Percent, TrendingUp, HandCoins, Globe, Camera, User, LogOut, Phone, Mail, Search, Star, FileText
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
    reader.onerror = () => reject(new Error('Nou pa t ka li foto a.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Foto a domaje oswa nan yon fòma nou pa sipòte.'));
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

const methods = [
  { id: 'moncash', name: 'Mon Cash', desc: 'Depoze kach nan pwen Digicel ou', color: '#1E9E7C', icon: DollarSign, logo: '/logos/moncash.jpg', kind: 'mobile' },
  { id: 'natcash', name: 'NatCash', desc: 'Depoze ak bous mobil NatCash ou', color: '#1C6FBF', icon: Smartphone, logo: '/logos/natcash.jpg', kind: 'mobile' },
  { id: 'usdt', name: 'USDT', desc: 'Depoze dola ameriken an stablecoin (Tether)', color: '#0E9E86', icon: Banknote, logo: '/logos/usdt.jpg', kind: 'crypto', comingSoon: true },
  { id: 'zelle', name: 'Zelle', desc: 'Depoze dirèkteman soti nan kont labank ou', color: '#6D3FD1', icon: ArrowLeftRight, logo: '/logos/zelle.png', kind: 'bank', comingSoon: true },
  { id: 'biwo', name: 'Nan biwo', desc: 'Ale peye kach nan yonn nan biwo nou yo', color: '#946115', icon: Building2, logo: null, kind: 'office' },
];

const offices = [
  'Delmas 33, Pòtoprens',
  'Petyonvil, Ri Grand-Rue',
  'Okap, Centre-vil',
];

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
    tileDeposit: 'Depoze', tileWithdraw: 'Retrè', tileTransfer: 'Transfere',
    tileSol: 'BLIC Sòl', tileDepo: 'BLIC Depo', tileGoal: 'Depo Ak Objektif', tileLoan: 'Prè',
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
    lp_footAbout: 'Apwopo nou', lp_footSupport: 'Sipò', lp_footEmailPh: '[imèl sipò isit la]',
    lp_footTerms: 'Kondisyon Sèvis', lp_footPrivacy: 'Politik Konfidansyalite',
    lp_footRights: 'Tout dwa rezève.',
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
    tileDeposit: 'Dépôt', tileWithdraw: 'Retrait', tileTransfer: 'Transfert',
    tileSol: 'BLIC Sòl', tileDepo: 'BLIC Dépo', tileGoal: 'Dépôt Objectif', tileLoan: 'Prêt',
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
    lp_footAbout: 'À propos', lp_footSupport: 'Support', lp_footEmailPh: '[email de support ici]',
    lp_footTerms: 'Conditions d\'utilisation', lp_footPrivacy: 'Politique de confidentialité',
    lp_footRights: 'Tous droits réservés.',
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
    tileDeposit: 'Deposit', tileWithdraw: 'Withdraw', tileTransfer: 'Transfer',
    tileSol: 'BLIC Sòl', tileDepo: 'BLIC Depo', tileGoal: 'Goal Deposit', tileLoan: 'Loan',
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
    lp_footAbout: 'About us', lp_footSupport: 'Support', lp_footEmailPh: '[support email here]',
    lp_footTerms: 'Terms of Service', lp_footPrivacy: 'Privacy Policy',
    lp_footRights: 'All rights reserved.',
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

function SolWheel({ group, selected, onSelect }) {
  const n = group.members.length;
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
        {group.members.map((m, i) => {
          const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          const isTurn = i === group.currentTurn;
          const hasReceived = i < group.currentTurn;
          const isSel = selected === m.id;
          return (
            <g key={m.id} style={{ cursor: 'pointer' }} onClick={() => onSelect(m.id)}>
              {isTurn && (
                <circle cx={x} cy={y} r="23" fill="none" stroke={C.sky} strokeWidth="1.5" opacity="0.5">
                  <animate attributeName="r" values="19;26;19" dur="2.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;0.05;0.5" dur="2.4s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                cx={x} cy={y} r="18"
                fill={isTurn ? 'url(#turnGrad)' : hasReceived ? '#E4F5EF' : C.card}
                stroke={isSel ? C.navy : isTurn ? 'transparent' : hasReceived ? C.mint : C.border}
                strokeWidth={isSel ? 2 : 1}
              />
              <text x={x} y={y + 4} textAnchor="middle" fontSize="10.5" fontWeight="600"
                fill={isTurn ? '#fff' : hasReceived ? C.mint : C.ink} style={{ fontFamily: 'Inter, sans-serif' }}>
                {initials(m.name)}
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
          POT SIKL {group.cycle}
        </text>
        <text x={cx} y={cy + 13} textAnchor="middle" fontSize="15" fontWeight="700" fill={C.ink} style={fontMono}>
          {(group.amount * n).toLocaleString('fr-FR')}
        </text>
      </svg>
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
    { name: 'MonCash', color: '#E4032E', logo: '/logos/moncash.jpg' },
    { name: 'NatCash', color: '#0072BC', logo: '/logos/natcash.jpg' },
    { name: 'USDT', color: '#26A17B', logo: '/logos/usdt.jpg' },
    { name: 'Zelle', color: '#6D1ED4', logo: '/logos/zelle.png' },
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
            <span style={{ ...fontDisplay, fontWeight: 800, fontSize: 18 }}>BLIC<span style={{ color: C.sky }}>Pay</span></span>
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
          <img src="/hero-mockup.png" alt="Aplikasyon BLICPay sou telefòn ak òdinatè"
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
                blicpayht.com
              </div>
              <div style={{ width: 30 }} />
            </div>
            {/* app nav — dark bar (logo + notifications + avatar) then light icon nav row, matching the reference */}
            <div className="flex items-center justify-between px-6 py-3" style={{ background: '#0F2038' }}>
              <div className="flex items-center gap-2">
                <Logo size={20} />
                <span style={{ ...fontDisplay, fontWeight: 800, fontSize: 13, color: '#fff' }}>BLIC<span style={{ color: C.sky }}>Pay</span></span>
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
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.75)' }}>SOLDE KONT</p>
                <p style={{ ...fontDisplay, fontWeight: 800, fontSize: 26, color: '#fff', marginTop: 4 }}>45,200 HTG</p>
                <div className="mt-4 flex gap-2">
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>Depo</span>
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>Retrè</span>
                </div>
              </div>
              {/* quick links */}
              <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <p className="text-xs font-bold" style={{ color: C.muted }}>AKSÈ RAPID</p>
                <div className="mt-3 grid grid-cols-4 gap-3">
                  {[
                    { icon: ArrowLeftRight, label: 'Transfè', fillable: false },
                    { icon: Users, label: 'Sòl', fillable: true },
                    { icon: PiggyBank, label: 'Objektif', fillable: true },
                    { icon: HandCoins, label: 'Prè', fillable: true },
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
                <p className="text-xs font-bold" style={{ color: C.muted }}>AKTIVITE RESAN</p>
                <div className="mt-3 space-y-2">
                  {[{ n: 'Depo MonCash', a: '+2,500 HTG', pos: true }, { n: 'Kotizasyon Sòl Basic #3', a: '−1,000 HTG', pos: false }].map((t) => (
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
                  <p className="text-xs font-bold" style={{ color: C.muted }}>BLIC SÒL</p>
                  <span className="text-[10px] font-semibold" style={{ color: C.sky }}>{tr('lp_stat1')}: 90</span>
                </div>
                <div className="mt-3 p-3 rounded-xl" style={{ background: C.bg }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Sòl Basic #3</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#E4F5EF', color: C.mint }}>7/10</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: C.border }}>
                    <div style={{ width: '70%', height: '100%', background: `linear-gradient(90deg, ${C.navy}, ${C.sky})` }} />
                  </div>
                  <p className="mt-2 text-[10px]" style={{ color: C.muted }}>Chak semenn · 1,000 HTG pa moun</p>
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
                        <p style={{ ...fontDisplay, fontWeight: 800, fontSize: 17, color: '#fff', lineHeight: 1 }}>BLIC<span style={{ fontStyle: 'italic' }}>Pay</span></p>
                        <p className="mt-1" style={{ fontSize: 7, color: 'rgba(255,255,255,0.8)', letterSpacing: 0.8 }}>| GLOBAL | SEKIRIZE | DIJITAL |</p>
                      </div>
                    </div>

                    {/* card number, spaced like a real card */}
                    <p className="mt-6 relative" style={{ color: '#fff', letterSpacing: 2, fontFamily: 'monospace', fontSize: 16, fontWeight: 500 }}>
                      1234 5678 9012 3456
                    </p>

                    <div className="mt-4 flex items-end justify-between relative">
                      <div>
                        <p className="flex items-baseline gap-1.5">
                          <span style={{ fontSize: 6, color: 'rgba(255,255,255,0.75)' }}>EXRID</span>
                          <span style={{ fontSize: 11, color: '#fff', fontFamily: 'monospace' }}>12/99</span>
                        </p>
                        <p className="mt-1" style={{ fontSize: 10, color: '#fff', letterSpacing: 0.5 }}>KLIYAN BLICPAY</p>
                      </div>
                      {/* Mastercard-style dual-circle mark, deliberately blurred to avoid reproducing the trademark clearly */}
                      <div className="text-right">
                        <div style={{ filter: 'blur(3.5px)', opacity: 0.85, position: 'relative', width: 34, height: 20, marginLeft: 'auto' }}>
                          <div style={{ position: 'absolute', left: 0, width: 20, height: 20, borderRadius: '50%', background: '#EB5757' }} />
                          <div style={{ position: 'absolute', left: 12, width: 20, height: 20, borderRadius: '50%', background: '#F2A93B' }} />
                        </div>
                        <p className="mt-1" style={{ fontSize: 7, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 }}>DEBIT</p>
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
                      <span className="text-xs font-bold text-white">Sòl Standard #5</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>6/10</span>
                    </div>
                    <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.25)' }}>
                      <div style={{ width: '60%', height: '100%', background: '#fff' }} />
                    </div>
                    <p className="mt-2 text-[10px]" style={{ color: 'rgba(255,255,255,0.8)' }}>Chak 15 jou · 2,500 HTG</p>
                  </div>
                  <button className="mt-3 w-full py-2.5 rounded-xl text-xs font-bold text-white" style={{ background: C.mint }}>Mande antre</button>
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
              { name: 'MonCash', logo: '/logos/moncash.jpg' },
              { name: 'NatCash', logo: '/logos/natcash.jpg' },
              { name: 'USDT', logo: '/logos/usdt.jpg' },
              { name: 'Zelle', logo: '/logos/zelle.png' },
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
                    <span className="text-xs font-bold" style={{ color: '#fff' }}>BLICPay</span>
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
            { tint: '#FBF0F2' }, { tint: '#EFF7F0' }, { tint: '#F4F6FA' },
            { tint: '#F4F6FA' }, { tint: '#FBF3EA' }, { tint: '#F4F6FA' },
          ].map((s, i) => (
            <Reveal key={i} delay={(i % 3) * 100} className="lp-masonry-item">
              <div className="p-6 rounded-2xl flex flex-col" style={{ background: s.tint }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(255,255,255,0.7)', color: C.navy }}>?</div>
                  <span className="text-sm font-bold" style={{ color: C.muted }}>{tr('lp_testiName')}</span>
                </div>
                <p className="text-sm leading-relaxed flex-1" style={{ color: C.ink }}>"{tr('lp_testiQuote')}"</p>
                <div className="mt-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold">{tr('lp_testiName')}</p>
                    <p className="text-[11px]" style={{ color: C.muted }}>{tr('lp_testiRole')}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#fff' }}>
                    <Star size={11} color={C.amber} fill={C.amber} /> 5.0
                  </span>
                </div>
              </div>
            </Reveal>
          ))}
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
              <span style={{ ...fontDisplay, fontWeight: 800, fontSize: 16 }}>BLIC<span style={{ color: C.sky }}>Pay</span></span>
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
              {[tr('lp_footAbout'), tr('lp_footSupport')].map((l) => (
                <span key={l} className="text-xs" style={{ color: C.ink }}>{l}</span>
              ))}
              <span className="text-xs" style={{ color: C.muted }}>{tr('lp_footEmailPh')}</span>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase" style={{ color: C.muted, letterSpacing: 0.6 }}>{tr('lp_footLegal')}</p>
            <div className="mt-3.5 flex flex-col gap-2.5">
              {[tr('lp_footTerms'), tr('lp_footPrivacy')].map((l) => (
                <span key={l} className="text-xs" style={{ color: C.ink }}>{l}</span>
              ))}
            </div>
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${C.border}` }}>
          <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <p className="text-xs" style={{ color: C.muted }}>© {new Date().getFullYear()} BLICPay. {tr('lp_footRights')}</p>
          </div>
          <div className="max-w-6xl mx-auto px-6 pb-6">
            <p className="text-[11px] leading-relaxed" style={{ color: C.muted, maxWidth: 640 }}>
              {tr('lp_footDisclaimer')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}



export default function BlicPayApp() {
  const [view, setView] = useState('landing');
  const [lang, setLang] = useState('ht');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const tr = (key) => T[lang]?.[key] ?? T.ht[key] ?? key;
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
  const [kycStatus, setKycStatus] = useState('pa verifye'); // 'pa verifye' | 'annatant' | 'verifye'
  const [kycDocType, setKycDocType] = useState('paspò');
  const [kycStep, setKycStep] = useState('entwo'); // 'entwo' | 'fòm' — montre egzanp anvan telechajman
  const [kycFile, setKycFile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
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
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [balance, setBalance] = useState(0);
  const [hideBalance, setHideBalance] = useState(true);
  const [promoIndex, setPromoIndex] = useState(0);
  const PROMO_SLIDES = [
    {
      icon: Users, title: 'Envite yon zanmi, genyen',
      desc: 'Chak zanmi ki ouvri yon kont BLICPay ba w yon bonis sou pwochen depo w.',
      action: () => flash('Fonksyon envitasyon ap vini.'), cta: 'Wè plis',
    },
    {
      icon: Users, title: '90 gwoup BLIC Sòl louvri',
      desc: 'Antre nan yon gwoup Sòl nan nivo Basic, Standard oswa Premium jodi a.',
      action: () => openSolSection(), cta: 'Gade gwoup yo',
    },
    {
      icon: Lock, title: 'Kat BLICPay ap vini',
      desc: 'N ap travay sou yon patenarya pou ofri kat vityèl ak fizik pou peye nenpòt kote.',
      action: () => flash('Detay kat la ap vini talè.'), cta: 'Aprann plis',
    },
    {
      icon: PiggyBank, title: 'Fikse yon objektif epay',
      desc: 'Kreye yon objektif e swiv pwogrè w chak fwa ou mete lajan.',
      action: () => setView('termdepo'), cta: 'Kòmanse',
    },
  ];
  React.useEffect(() => {
    const timer = setInterval(() => {
      setPromoIndex((i) => (i + 1) % PROMO_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

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
      loadNotifications(saved.token);
      apiFetch('/pin/status', { token: saved.token })
        .then(({ hasPin: hp }) => {
          setHasPin(hp);
          if (hp) setAppLocked(true);
        })
        .catch(() => {});
      if (cameFromMoncashSuccess) {
        setTimeout(() => flash('Depo MonCash ou konfime — li ajoute nan balans ou.'), 400);
      } else if (cameFromMoncashFailure) {
        setTimeout(() => flash('Depo MonCash la pa t reyisi — eseye ankò.', 'error'), 400);
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
  const [loadingBiwoBranches, setLoadingBiwoBranches] = useState(false);
  const [selectedBiwoBranch, setSelectedBiwoBranch] = useState('');
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
        date: new Date(t.createdAt).toLocaleDateString('fr-FR'),
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
    setSelectedMethod(null);
    setReference(null);
    setView('deposit');
  }

  function startWithdraw() {
    setAmount('');
    setFlowKind('withdraw');
    setSelectedMethod(null);
    setReference(null);
    setView('deposit');
  }

  async function pickMethod(m) {
    if (m.comingSoon) {
      flash(`${m.name} ap disponib byento.`);
      return;
    }
    if (!amount || Number(amount) <= 0) {
      flash('Antre yon montan anvan.');
      return;
    }
    if (flowKind === 'deposit' && Number(amount) < 100) {
      flash('Montan minimòm pou yon depo se 100 HTG.');
      return;
    }
    if (flowKind === 'withdraw' && Number(amount) < 250) {
      flash('Montan minimòm pou yon retrè se 250 HTG.');
      return;
    }

    if (m.id === 'biwo') {
      setSelectedMethod(m);
      setSelectedBiwoBranch('');
      setBiwoBranchScreen(true);
      if (biwoBranches.length === 0) {
        setLoadingBiwoBranches(true);
        try {
          const { branches } = await apiFetch('/branches', { token });
          setBiwoBranches(branches);
        } catch (err) {
          flash(err.message || 'Nou pa t ka chaje lis siikisal yo.', 'error');
        } finally {
          setLoadingBiwoBranches(false);
        }
      }
      return;
    }

    if (flowKind === 'withdraw') {
      if (Number(amount) > balance) {
        flash('Ou pa gen ase lajan pou retrè sa a.');
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
        flash(err.message || 'Nou pa t ka kalkile frè a.', 'error');
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
        flash(err.message || 'Nou pa t ka kòmanse peman MonCash la.', 'error');
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
  async function confirmBiwoBranch() {
    if (!selectedBiwoBranch) {
      flash('Chwazi yon siikisal.');
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
        flash(err.message || 'Nou pa t ka kalkile frè a.', 'error');
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
      flash(err.message || 'Nou pa t ka soumèt demand lan.', 'error');
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
        reader.onerror = () => reject(new Error('Nou pa t ka li foto a.'));
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
      flash('Antre ID tranzaksyon an.');
      return;
    }
    if (!natcashProofFile) {
      flash('Ajoute yon foto resi a.');
      return;
    }
    setNatcashSubmitting(true);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = () => reject(new Error('Nou pa t ka li foto a.'));
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
      flash(err.message || 'Nou pa t ka soumèt depo a.', 'error');
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
          body: { amount: pendingWithdraw.amount, method: pendingWithdraw.method.id, pin, branch: pendingWithdraw.branch },
        });
        setReference(withdrawal.reference);
        setBalance((b) => b - withdrawal.amount - (withdrawal.fee || 0));
        setTx((t) => [{ id: withdrawal.id, method: pendingWithdraw.method.name, amount: withdrawal.amount, fee: withdrawal.fee, ts: Date.now(), status: 'annatant', date: 'jodi a', type: 'retrè' }, ...t]);
        setPinScreen(null);
        setPinDigits('');
        setPendingWithdraw(null);
        setView('confirm');
      }
    } catch (err) {
      setPinError(err.message || 'Kòd PIN la pa kòrèk.');
      setPinDigits('');
    } finally {
      setPinBusy(false);
    }
  }

  async function submitPinSetup() {
    if (!pinSetupPassword) {
      setPinError('Antre modpas kont ou pou konfime.');
      return;
    }
    if (pinDigits.length !== 4) {
      setPinError('Kòd PIN la dwe gen 4 chif.');
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
        flash('Kòd PIN ou kreye.');
      }
    } catch (err) {
      setPinError(err.message || 'Nou pa t ka kreye PIN la.');
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
  }

  async function sendTransfer() {
    if (!transferId.trim()) {
      flash('Antre ID kliyan k ap resevwa a.');
      return;
    }
    if (!transferAmount || Number(transferAmount) <= 0) {
      flash('Antre yon montan valab.');
      return;
    }
    if (Number(transferAmount) > balance) {
      flash('Ou pa gen ase lajan pou transfè sa a.');
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
        method: `Transfè bay ${transferId}`,
        amount: Number(transferAmount),
        ts: Date.now(), status: 'konfime',
        date: 'jodi a',
        type: 'transfè',
      }, ...t]);
      flash('Transfè a fèt.');
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
      flash('Bay pòch la yon non.');
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
      flash('Pòch la kreye.');
    }).catch((err) => flash(err.message, 'error'));
  }

  async function addMoneyToPocket() {
    const amt = Number(addMoneyAmount);
    const pocket = pockets.find((p) => p.id === addMoneyPocketId);
    if (!pocket) {
      flash('Chwazi yon pòch.');
      return;
    }
    if (!amt || amt <= 0) {
      flash('Antre yon montan valab.');
      return;
    }
    if (amt > balance) {
      flash('Ou pa gen ase nan kont prensipal la.');
      return;
    }
    setAddMoneyProcessing(true);
    try {
      const { pocket: updated } = await apiFetch(`/pockets/${pocket.id}/deposit`, { method: 'POST', token, body: { amount: amt } });
      setBalance((b) => b - amt);
      setPockets((ps) => ps.map((p) => p.id === pocket.id ? updated : p));
      setTx((t) => [{ id: 'pk-' + Date.now(), method: `Epay nan ${pocket.name}`, amount: amt, ts: Date.now(), status: 'konfime', date: nowLabel(), type: 'transfè', pocketId: pocket.id, kind: 'epay' }, ...t]);
      setAddMoneyAmount('');
      setShowAddMoney(false);
      flash('Lajan an ajoute nan pòch la.');
    } catch (err) {
      flash(err.message, 'error');
    } finally {
      setAddMoneyProcessing(false);
    }
  }

  function createGoalDeposit() {
    if (!newGoalName.trim()) {
      flash('Bay objektif la yon non.');
      return;
    }
    if (!newGoalTarget || Number(newGoalTarget) <= 0) {
      flash('Antre yon montan objektif valab.');
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
      flash('Objektif kreye.');
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
      flash('Antre yon montan valab.');
      return;
    }
    if (amt > balance) {
      flash('Ou pa gen ase nan kont prensipal la.');
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
        id: 'gd-tx-' + Date.now(), method: `Depo Ak Objektif — ${gd.name}`, amount: amt,
        ts: Date.now(), status: 'konfime', date: nowLabel(), type: 'transfè',
      }, ...t]);
      setAddGoalAmount('');
      flash(reached ? 'Objektif la atenn! Ou ka retire lajan an kounye a.' : 'Lajan an ajoute nan objektif la.');
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
        id: 'gd-out-' + Date.now(), method: `Objektif fini — ${gd.name}`, amount: gd.current,
        ts: Date.now(), status: 'konfime', date: nowLabel(), type: 'depo',
      }, ...t]);
      setView('termdepo');
      flash('Lajan an tounen nan kont prensipal ou.');
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
        id: 'gd-em-' + Date.now(), method: `Retrè ijans — ${gd.name} (frè 4.5%)`, amount: net,
        ts: Date.now(), status: 'konfime', date: nowLabel(), type: 'depo',
      }, ...t]);
      setShowEmergency(false);
      setView('termdepo');
      flash(`Retrè ijans fèt — ${money(fee)} kenbe kòm frè.`);
    } catch (err) {
      flash(err.message, 'error');
    } finally {
      setGoalProcessing(false);
    }
  }

  async function requestLoan() {
    const amt = Number(newLoanAmount);
    if (!amt || amt <= 0) {
      flash('Antre yon montan valab.');
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
      flash('Demand prè a voye — n ap egzamine li.');
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
          id: 'ln-tx-' + Date.now(), method: 'Prè apwouve', amount: loan.amount,
          ts: Date.now(), status: 'konfime', date: nowLabel(), type: 'depo',
        }, ...t]);
        flash('Prè a apwouve — lajan an nan kont ou.');
      } else if (fresh.status === 'rejected') {
        flash('Demand prè a refize.');
      } else {
        flash('Pa gen chanjman — l ap tann toujou.');
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
      flash('Ou pa gen ase nan kont prensipal la pou vèsman sa a.');
      return;
    }
    setLoanProcessing(true);
    try {
      const { finished } = await apiFetch(`/loans/${loan.id}/pay-installment`, { method: 'POST', token, body: {} });
      setBalance((b) => b - next.amount);
      setTx((t) => [{
        id: 'ln-pay-' + Date.now(), method: `Vèsman prè ${next.n}/${loan.months}`, amount: next.amount,
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
      flash(finished ? 'Prè a peye nèt!' : 'Vèsman anrejistre.');
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
      flash('Antre yon montan valab.');
      return;
    }

    setPocketProcessing(true);
    try {
      if (pocketMode === 'deposit') {
        if (amt > balance) { flash('Ou pa gen ase nan kont prensipal la.'); setPocketProcessing(false); return; }
        const { pocket: updated } = await apiFetch(`/pockets/${pocket.id}/deposit`, { method: 'POST', token, body: { amount: amt } });
        setBalance((b) => b - amt);
        setPockets((ps) => ps.map((p) => p.id === activePocketId ? updated : p));
        setTx((t) => [{ id: 'pk-' + Date.now(), method: `Epay nan ${pocket.name}`, amount: amt, ts: Date.now(), status: 'konfime', date: nowLabel(), type: 'transfè', pocketId: pocket.id, kind: 'epay' }, ...t]);
        flash('Lajan an mete nan pòch la.');
      } else if (pocketMode === 'spend') {
        if (amt > pocket.balance) { flash('Pa gen ase lajan nan pòch sa a.'); setPocketProcessing(false); return; }
        const { pocket: updated } = await apiFetch(`/pockets/${pocket.id}/spend`, { method: 'POST', token, body: { amount: amt } });
        setPockets((ps) => ps.map((p) => p.id === activePocketId ? updated : p));
        setTx((t) => [{ id: 'pk-' + Date.now(), method: `Retrè soti nan ${pocket.name}`, amount: amt, ts: Date.now(), status: 'konfime', date: nowLabel(), type: 'retrè', pocketId: pocket.id, kind: 'depanse' }, ...t]);
        flash('Depans anrejistre.');
      } else if (pocketMode === 'transfer') {
        if (amt > pocket.balance) { flash('Pa gen ase lajan nan pòch sa a.'); setPocketProcessing(false); return; }
        const { pocket: updated } = await apiFetch(`/pockets/${pocket.id}/transfer`, { method: 'POST', token, body: { amount: amt, to: pocketTransferTarget } });
        if (pocketTransferTarget === 'main') {
          setBalance((b) => b + amt);
          setPockets((ps) => ps.map((p) => p.id === activePocketId ? updated : p));
          setTx((t) => [{ id: 'pk-' + Date.now(), method: `Transfè soti nan ${pocket.name} bay Kont prensipal`, amount: amt, ts: Date.now(), status: 'konfime', date: nowLabel(), type: 'depo', pocketId: pocket.id, kind: 'transfè-soti' }, ...t]);
        } else {
          const destName = pockets.find((p) => p.id === pocketTransferTarget)?.name;
          setPockets((ps) => ps.map((p) => {
            if (p.id === activePocketId) return updated;
            if (p.id === pocketTransferTarget) return { ...p, balance: p.balance + amt };
            return p;
          }));
          setTx((t) => [
            { id: 'pk-' + Date.now(), method: `Transfè soti nan ${pocket.name} bay ${destName}`, amount: amt, ts: Date.now(), status: 'konfime', date: nowLabel(), type: 'transfè', pocketId: pocket.id, kind: 'transfè-soti' },
            { id: 'pk-' + Date.now() + '-r', method: `Transfè resevwa soti nan ${pocket.name}`, amount: amt, ts: Date.now(), status: 'konfime', date: nowLabel(), type: 'depo', pocketId: pocketTransferTarget, kind: 'transfè-antre' },
            ...t,
          ]);
        }
        flash('Transfè fèt.');
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
    flash('Pwofil ou mizajou.');
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
    await new Promise((r) => setTimeout(r, 800));
    setSupportSending(false);
    setSupportSent(true);
    setSupportSubject('');
    setSupportMessage('');
    flash(tr('supportSentMsg'));
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
      flash(e.message || 'Nou pa t ka kòmanse verifikasyon an. Eseye ankò.', 'error');
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
    } catch (e) {
      console.error('KYC status load error:', e);
      // Kite estati a jan li te ye a olye fè kliyan an panse li bezwen resoumèt.
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
    if (mins < 1) return 'kounye a';
    if (mins < 60) return `sa gen ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `sa gen ${hours}h`;
    const days = Math.floor(hours / 24);
    return `sa gen ${days}j`;
  }

  async function checkKycStatus() {
    setRefreshing(true);
    try {
      const data = await apiFetch('/kyc/didit/status', { token });
      const s = data.verification?.status;
      setKycStatus(s === 'approved' ? 'verifye' : s === 'pending' ? 'annatant' : 'pa verifye');
      if (s === 'approved') flash('Kont ou verifye kounye a.');
      else if (s === 'rejected') flash(data.verification?.rejectionReason || 'Demand verifikasyon w refize — eseye ankò.', 'error');
      else flash('Pa gen chanjman.', 'info');
    } catch (e) {
      flash(e.message || 'Nou pa t ka verifye estati a.', 'error');
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
          flash('Pa gen nouvo chanjman.');
        } else {
          let confirmedAmount = 0;
          setTx((list) => list.map((t) => {
            if (t.status === 'annatant') { confirmedAmount += t.amount; return { ...t, status: 'konfime' }; }
            return t;
          }));
          setBalance((b) => b + confirmedAmount);
          flash('Estati depo yo mizajou.');
        }
        return;
      }
      await loadWallet(token);
      if (previouslyPending === 0) {
        flash('Pa gen nouvo chanjman.');
      } else {
        flash('Estati depo yo mizajou.');
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
      flash(e.message || 'Nou pa t ka chaje gwoup Sòl yo.', 'error');
    } finally {
      setLoadingSol(false);
    }
  }

  async function loadMySol() {
    try {
      const { memberships } = await apiFetch('/sol/my', { token });
      setMySolMemberships(memberships);
    } catch (e) {
      flash(e.message || 'Nou pa t ka chaje Sòl ou yo.', 'error');
    }
  }

  async function requestJoinSol(gid) {
    setSolJoinProcessing(gid);
    try {
      await apiFetch(`/sol/groups/${gid}/request`, { method: 'POST', token });
      flash('Demand ou voye — peye frè entegrasyon an pou admin ka egzamine l.');
      await Promise.all([loadSolGroups(), loadMySol()]);
    } catch (e) {
      flash(e.message || 'Nou pa t ka voye demand lan.', 'error');
    } finally {
      setSolJoinProcessing(null);
    }
  }

  async function payIntegrationFee(membershipId) {
    setSolFeeProcessing(membershipId);
    try {
      const { fee } = await apiFetch(`/sol/memberships/${membershipId}/pay-integration-fee`, { method: 'POST', token });
      setBalance((b) => b - fee);
      flash('Frè entegrasyon peye — n ap tann admin apwouve demand ou.');
      await loadMySol();
    } catch (e) {
      flash(e.message || 'Nou pa t ka trete peman an.', 'error');
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
      flash(e.message || 'Nou pa t ka chaje dokiman an.', 'error');
    }
  }

  const userSolMembership = mySolMemberships.find((m) => m.groupId === activeSolGroupId || m.group?.id === activeSolGroupId);
  const userSolGroup = userSolMembership?.group || solGroups.find((g) => g.id === activeSolGroupId);


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

      <div className={view === 'landing' ? 'w-full min-h-full' : 'max-w-md mx-auto min-h-full'} style={{ background: C.bg }}>
        {view === 'landing' ? (
          <LandingPage onStart={() => setView('auth')} lang={lang} setLang={setLang} tr={tr} />
        ) : (
        <>

        {/* HEADER */}
        {view !== 'auth' && view !== 'forgotpassword' && (
          <div className="flex items-center justify-between px-5 pt-6 pb-2">
            <div className="flex items-center gap-2">
              <Logo size={28} />
              <span style={{ ...fontDisplay, fontWeight: 800, fontSize: 18 }}>
                BLIC<span style={{ color: C.sky }}>Pay</span>
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
                <button onClick={openNotifPanel} aria-label="Notifikasyon"
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
                      <p className="text-xs font-bold uppercase px-4 pt-3.5 pb-2" style={{ color: C.muted }}>Notifikasyon</p>
                      {notifications.length === 0 ? (
                        <p className="text-sm px-4 pb-4" style={{ color: C.muted }}>Ou pa gen notifikasyon.</p>
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
                BLIC<span style={{ color: C.sky }}>Pay</span>
              </h1>
              <p className="mt-1 text-xs tracking-wide" style={{ color: C.muted }}>GLOBAL · SECURE · DIGITAL</p>
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

        {view === 'dashboard' && (
          <div className="fadein px-5 pb-28 pt-2">
            <p className="text-sm mt-2" style={{ color: C.muted }}>{tr('welcome')}</p>
            <div className="flex items-center gap-1.5">
              <h1 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>{user?.fullName || '...'}</h1>
              {kycStatus === 'verifye' && (
                <span title="Kont verifye (KYC)"><BadgeCheck size={19} color={C.sky} fill={C.navy} /></span>
              )}
              {kycStatus === 'annatant' && (
                <Badge tone="amber">Annatant</Badge>
              )}
              {kycStatus === 'pa verifye' && (
                <button onClick={() => { setKycStep('entwo'); setView('kyc'); }} className="text-xs font-semibold underline" style={{ color: C.navy }}>
                  Verifye kont ou
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-xs" style={{ ...fontMono, color: C.muted }}>ID: {getClientId(user)}</p>
              <button onClick={() => { navigator.clipboard?.writeText(getClientId(user)); flash('ID kopye.'); }} aria-label="Kopye ID">
                <Copy size={12} color={C.muted} />
              </button>
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
                    <button onClick={() => setHideBalance((h) => !h)} aria-label={hideBalance ? 'Montre sòld' : 'Kache sòld'}>
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
                  <button onClick={refreshTransactions} aria-label="Rafrechi sòld"
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <RefreshCw size={13} color="#fff" style={refreshing ? { animation: 'spin 0.8s linear infinite' } : undefined} />
                  </button>
                </div>
                <p className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{tr('accountLabel')} · •••• 8455</p>
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
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: C.amber, color: '#fff' }}>Talè</span>
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#E6F0FB' }}>
                  <HandCoins size={16} color={C.navy} fill={C.navy} strokeWidth={1.4} />
                </div>
                <span className="text-xs font-semibold">{tr('tileLoan')}</span>
              </button>
            </div>

            {/* kyc banner */}
            {kycStatus !== 'verifye' && (
              <div className="mt-4 p-4 rounded-xl flex items-center gap-3" style={{ background: '#FBF0DE', border: `1px solid #F0D9A8` }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: '#F0D9A8' }}>
                  <ShieldCheck size={16} color="#946115" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: '#946115' }}>
                    {kycStatus === 'annatant' ? 'N ap verifye dokiman ou' : 'Verifye kont ou'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#946115' }}>
                    {kycStatus === 'annatant' ? 'Sa ka pran kèk moman.' : 'Ajoute yon pyès idantite pou dekaplaf kont ou.'}
                  </p>
                </div>
                {kycStatus === 'annatant' ? (
                  <button onClick={checkKycStatus} aria-label="Tcheke estati"
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: '#fff' }}>
                    <RefreshCw size={14} color="#946115" style={refreshing ? { animation: 'spin 0.8s linear infinite' } : undefined} />
                  </button>
                ) : (
                  <button onClick={() => { setKycStep('entwo'); setView('kyc'); }}
                    className="text-xs font-semibold px-3 py-2 rounded-lg shrink-0" style={{ background: '#946115', color: '#fff' }}>
                    Kòmanse
                  </button>
                )}
              </div>
            )}

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
                <button key={i} onClick={() => setPromoIndex(i)} aria-label={`Wè ofr ${i + 1}`}
                  className="rounded-full transition-all" style={{
                    width: i === promoIndex ? 16 : 6, height: 6,
                    background: i === promoIndex ? C.navy : C.border,
                  }} />
              ))}
            </div>

            {/* transactions */}
            <div className="mt-7 flex items-center justify-between">
              <h3 className="font-semibold text-sm" style={{ color: C.muted }}>{tr('recentTx')}</h3>
              <Clock size={14} color={C.muted} />
            </div>
            <div className="mt-3 rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
              {tx.length === 0 && (
                <p className="text-sm p-5" style={{ color: C.muted, background: C.card }}>{tr('noTx')}</p>
              )}
              {tx.map((t, i) => {
                const isOutgoing = t.type === 'retrè' || t.type === 'transfè';
                return (
                  <div key={t.id} className="flex items-center justify-between px-4 py-3.5"
                    style={{ background: C.card, borderTop: i ? `1px solid ${C.border}` : 'none' }}>
                    <div>
                      <p className="text-sm font-semibold">{t.method}</p>
                      <p className="text-xs mt-0.5" style={{ color: C.muted }}>{t.date}</p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm" style={{ ...fontMono, color: isOutgoing ? C.danger : C.ink }}>
                        {isOutgoing ? '-' : '+'}{money(t.amount)}
                      </span>
                      <Badge tone={t.status === 'konfime' ? 'mint' : t.status === 'rejte' ? 'danger' : 'amber'}>
                        {t.status === 'konfime' ? 'Konfime' : t.status === 'rejte' ? 'Rejte' : 'Annatant'}
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
              <ArrowLeft size={15} /> Retounen
            </button>

            {solSubView === 'mine' && (
              <>
                <div className="flex items-center justify-between">
                  <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>Sòl <em style={{ fontStyle: 'italic', color: C.sky }}>mwen yo</em></h2>
                  <button onClick={() => setSolSubView('browse')} className="text-xs font-semibold" style={{ color: C.navy }}>
                    + Antre nan yon lòt
                  </button>
                </div>
                <p className="mt-1.5 text-sm" style={{ color: C.muted }}>Ou gen {mySolMemberships.length} demand/adezyon Sòl.</p>
                <button onClick={openSolDocuments} className="mt-2 text-xs font-semibold flex items-center gap-1" style={{ color: C.navy }}>
                  <FileText size={13} /> Dokiman Sòl mwen yo
                </button>
                <div className="mt-5 space-y-3">
                  {loadingSol ? (
                    <p className="text-sm p-6 text-center" style={{ color: C.muted }}>Ap chaje...</p>
                  ) : mySolMemberships.length === 0 ? (
                    <p className="text-sm p-5 rounded-xl" style={{ color: C.muted, background: C.card, border: `1px solid ${C.border}` }}>Ou poko gen okenn demand Sòl.</p>
                  ) : mySolMemberships.map((m) => (
                    <div key={m.id} className="p-4 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                      <button onClick={() => openSolDetail(m.group.id)} className="bp-btn w-full text-left flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm">{m.group.name}</h3>
                            <Badge tone={m.group.tier === 'Premium' ? 'premium' : m.group.tier === 'Standard' ? 'navy' : 'muted'}>{m.group.tier}</Badge>
                          </div>
                          <p className="mt-1 text-xs" style={{ color: C.muted }}>
                            {m.group.frequency} · {money(m.group.amount)}
                          </p>
                          <Badge tone={m.status === 'approved' ? 'mint' : m.status === 'rejected' ? 'danger' : 'amber'}>
                            {m.status === 'approved' ? 'Manm apwouve' : m.status === 'rejected' ? 'Refize' : 'Annatant'}
                          </Badge>
                          {m.currentContribution && (
                            <Badge tone={m.currentContribution.status === 'paid' ? 'mint' : m.currentContribution.status === 'overdue' ? 'danger' : 'amber'}>
                              {m.currentContribution.status === 'paid' ? 'Kotizasyon peye ✓'
                                : m.currentContribution.status === 'overdue' ? 'Kotizasyon an reta serye'
                                : m.currentContribution.status === 'late' ? 'Kotizasyon an reta'
                                : 'Kotizasyon ap tann'}
                            </Badge>
                          )}
                        </div>
                        <ChevronRight size={16} color={C.muted} />
                      </button>

                      {m.status === 'pending' && (
                        m.integrationFeePaid ? (
                          <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg" style={{ background: '#E4F5EF' }}>
                            <Check size={14} color={C.mint} />
                            <p className="text-xs font-semibold" style={{ color: C.mint }}>Frè entegrasyon peye — n ap tann admin</p>
                          </div>
                        ) : (
                          <button onClick={() => payIntegrationFee(m.id)} disabled={solFeeProcessing === m.id}
                            className="bp-btn mt-3 w-full py-2.5 rounded-lg text-sm font-semibold text-white"
                            style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, opacity: solFeeProcessing === m.id ? 0.7 : 1 }}>
                            {solFeeProcessing === m.id ? 'Ap trete...' : `Peye frè entegrasyon an (${money(m.integrationFee)})`}
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
                <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>BLIC <em style={{ fontStyle: 'italic', color: C.sky }}>Sòl</em></h2>
                <p className="mt-1.5 text-sm" style={{ color: C.muted }}>
                  {mySolMemberships.length > 0 ? 'Ou ka antre nan plizyè sòl an menm tan.' : 'Ou poko manm okenn sòl. Chwazi youn pou kòmanse.'}
                </p>

                <a href="https://blicpayht.com/BLIC_Global_Fiche_Solde_Remplissable.pdf" target="_blank" rel="noreferrer"
                  className="bp-btn mt-3 flex items-center gap-2.5 p-3 rounded-xl" style={{ background: '#E6F0FB' }}>
                  <FileText size={16} color={C.navy} className="shrink-0" />
                  <div className="text-left">
                    <p className="text-xs font-semibold" style={{ color: C.navy }}>Telechaje fòm enskripsyon an</p>
                    <p className="text-xs mt-0.5" style={{ color: C.muted }}>Ranpli l epi voye l pa email, WhatsApp, oswa nan biwo a.</p>
                  </div>
                </a>

                <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                  {SOL_FREQUENCIES.map((f) => (
                    <button key={f.id} onClick={() => setSolFreqFilter(f.id)}
                      className="bp-btn shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold"
                      style={solFreqFilter === f.id
                        ? { background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, color: '#fff' }
                        : { background: C.card, color: C.muted, border: `1px solid ${C.border}` }}>
                      {f.label}
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
                    <p className="text-sm p-6 text-center" style={{ color: C.muted }}>Ap chaje...</p>
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
                        <p className="mt-1.5 text-xs" style={{ color: C.muted }}>{g.frequency} · {money(g.amount)} pa moun</p>
                        <div className="mt-1.5 flex items-center justify-between rounded-lg px-2.5 py-1.5" style={{ background: C.bg }}>
                          <span className="text-xs" style={{ color: C.muted }}>Frè entegrasyon</span>
                          <span className="text-xs font-semibold" style={{ color: C.ink }}>{money(g.integrationFee)}</span>
                        </div>
                        {!alreadyIn && (
                          <p className="mt-1.5 text-xs font-medium" style={{ color: !g.isOpen ? C.muted : C.amber }}>
                            {!g.isOpen ? <><Lock size={11} className="inline mr-1" />Fèmen pou kounye a</> : `${g.maxMembers - g.memberCount} plas ki rete`}
                          </p>
                        )}
                        {alreadyIn ? (
                          <button onClick={() => openSolDetail(g.id)}
                            className="bp-btn mt-3 w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5"
                            style={{ background: C.bg, color: C.navy, border: `1px solid ${C.border}` }}>
                            {g.myStatus === 'approved' ? 'Deja manm' : g.myStatus === 'rejected' ? 'Demand refize' : 'Demand annatant'} — wè detay <ChevronRight size={14} />
                          </button>
                        ) : (
                          <button onClick={() => requestJoinSol(g.id)} disabled={!g.isOpen || solJoinProcessing === g.id}
                            className="bp-btn mt-3 w-full py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-1.5"
                            style={{ background: !g.isOpen ? C.border : `linear-gradient(135deg, ${C.navy}, ${C.sky})`, color: !g.isOpen ? C.muted : '#fff', cursor: !g.isOpen ? 'not-allowed' : 'pointer', opacity: solJoinProcessing === g.id ? 0.7 : 1 }}>
                            {solJoinProcessing === g.id ? 'Ap voye...' : !g.isOpen ? <><Lock size={13} /> Fèmen pou kounye a</> : <>Antre nan sòl la <ChevronRight size={14} /></>}
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
                <p className="mt-1 text-sm" style={{ color: C.muted }}>{userSolGroup.frequency} · {money(userSolGroup.amount)} pa moun</p>

                {userSolMembership && (
                  <div className="mt-4 p-4 rounded-xl flex items-center gap-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                    <Badge tone={userSolMembership.status === 'approved' ? 'mint' : userSolMembership.status === 'rejected' ? 'danger' : 'amber'}>
                      {userSolMembership.status === 'approved' ? 'Manm apwouve' : userSolMembership.status === 'rejected' ? 'Demand refize' : 'Demand annatant'}
                    </Badge>
                    {userSolMembership.status === 'approved' && userSolMembership.turnIndex != null && (
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0" style={{ background: C.navy, color: '#fff' }}>
                          {userSolMembership.turnIndex + 1}
                        </div>
                        <p className="text-xs" style={{ color: C.muted }}>Pozisyon ou nan wotasyon an</p>
                      </div>
                    )}
                  </div>
                )}

                {userSolMembership?.status === 'pending' && (
                  userSolMembership.integrationFeePaid ? (
                    <div className="mt-3 flex items-center gap-2 p-3 rounded-xl" style={{ background: '#E4F5EF' }}>
                      <Check size={15} color={C.mint} />
                      <p className="text-sm font-semibold" style={{ color: C.mint }}>Frè entegrasyon peye — n ap tann admin egzamine demand ou</p>
                    </div>
                  ) : (
                    <button onClick={() => payIntegrationFee(userSolMembership.id)} disabled={solFeeProcessing === userSolMembership.id}
                      className="bp-btn mt-3 w-full py-3 rounded-xl text-sm font-semibold text-white"
                      style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, opacity: solFeeProcessing === userSolMembership.id ? 0.7 : 1 }}>
                      {solFeeProcessing === userSolMembership.id ? 'Ap trete...' : `Peye frè entegrasyon an (${money(userSolMembership.integrationFee)})`}
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
                        {userSolMembership.currentContribution.status === 'paid' ? 'Kotizasyon mwa sa a peye ✓'
                          : userSolMembership.currentContribution.status === 'overdue' ? 'Kotizasyon an reta serye'
                          : userSolMembership.currentContribution.status === 'late' ? 'Kotizasyon an reta'
                          : 'Kotizasyon mwa sa a ap tann'}
                      </p>
                      <p className="text-sm font-semibold" style={{ color: C.ink }}>
                        {money(userSolMembership.currentContribution.amount + (userSolMembership.currentContribution.penaltyAmount || 0))}
                      </p>
                    </div>
                    {userSolMembership.currentContribution.penaltyAmount > 0 && (
                      <p className="mt-1 text-xs" style={{ color: '#946115' }}>
                        Sa gen ladan {money(userSolMembership.currentContribution.penaltyAmount)} penalite pou reta.
                      </p>
                    )}
                    {userSolMembership.currentContribution.status === 'overdue' && (
                      <p className="mt-1 text-xs" style={{ color: C.danger }}>
                        Delè gras la pase — yon admin BLICPay ap kontakte w byento.
                      </p>
                    )}
                  </div>
                )}

                {userSolMembership?.currentPeriodDates ? (
                  <div className="mt-3 flex items-start gap-2 text-xs p-3 rounded-lg" style={{ background: '#E6F0FB', color: C.navy }}>
                    <Calendar size={15} className="shrink-0 mt-0.5" />
                    <div>
                      <p>Dat limit kotizasyon: <strong>{userSolMembership.currentPeriodDates.deadline}</strong></p>
                      <p className="mt-0.5">Dat prevwa vèsman: <strong>{userSolMembership.currentPeriodDates.payoutDate}</strong></p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex items-start gap-2 text-xs p-3 rounded-lg" style={{ background: '#FBF0DE', color: '#946115' }}>
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    Dat ak montan peman rotasyon an ap anonse pa BLICPay pita.
                  </div>
                )}

                <button onClick={openSolDocuments}
                  className="bp-btn mt-4 w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
                  style={{ background: C.card, color: C.navy, border: `1px solid ${C.border}` }}>
                  <FileText size={15} /> Dokiman Sòl mwen yo
                </button>
              </>
            )}

            {solSubView === 'documents' && (
              <>
                <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>Dokiman <em style={{ fontStyle: 'italic', color: C.sky }}>Sòl mwen yo</em></h2>
                <p className="mt-1.5 text-sm" style={{ color: C.muted }}>Dokiman ou siyen pou chak Sòl — ou ka gade yo, ou pa ka modifye yo.</p>

                <a href="https://blicpayht.com/BLIC_Global_Fiche_Solde_Remplissable.pdf" target="_blank" rel="noreferrer"
                  className="bp-btn mt-3 flex items-center gap-2.5 p-3 rounded-xl" style={{ background: '#E6F0FB' }}>
                  <FileText size={16} color={C.navy} className="shrink-0" />
                  <div className="text-left">
                    <p className="text-xs font-semibold" style={{ color: C.navy }}>Telechaje fòm enskripsyon an</p>
                    <p className="text-xs mt-0.5" style={{ color: C.muted }}>Ranpli l epi voye l pa email, WhatsApp, oswa nan biwo a.</p>
                  </div>
                </a>

                <div className="mt-5 space-y-4">
                  {mySolMemberships.length === 0 ? (
                    <p className="text-sm p-5 rounded-xl" style={{ color: C.muted, background: C.card, border: `1px solid ${C.border}` }}>Ou poko gen okenn demand Sòl.</p>
                  ) : mySolMemberships.map((m) => (
                    <div key={m.id} className="p-4 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{m.group.name}</h3>
                        <Badge tone={m.formApproved ? 'mint' : 'amber'}>{m.formApproved ? 'Konfime' : 'Annatant'}</Badge>
                      </div>
                      {(m.documents || []).length === 0 ? (
                        <p className="mt-2 text-xs" style={{ color: C.muted }}>Poko gen dokiman telechaje pou Sòl sa a.</p>
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
                              <span className="text-xs" style={{ color: C.muted }}>{new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}</span>
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
                      Dokiman sa a se yon fichye PDF — louvri l pou ka gade l byen.
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
                          flash('Nou pa t ka louvri dokiman an.', 'error');
                        }
                      }}
                      className="bp-btn px-5 py-3 rounded-xl text-sm font-semibold text-white"
                      style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})` }}>
                      Louvri dokiman an
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
                      <span className="text-white text-sm font-semibold">BLICPay Sekirite</span>
                    </div>
                    {pinScreen === 'withdraw' && pendingWithdraw ? (
                      <>
                        <p style={{ position: 'relative', margin: '16px 0 0', color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>Konfime retrè</p>
                        <p style={{ position: 'relative', margin: '2px 0 0', color: '#fff', fontSize: 28, fontWeight: 700 }}>{money(pendingWithdraw.amount)}</p>
                        <p style={{ position: 'relative', margin: '2px 0 0', color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>Vè {pendingWithdraw.method.name}</p>
                        <div style={{ position: 'relative', marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                          <div className="flex items-center justify-between">
                            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11.5 }}>Frè</span>
                            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11.5 }}>{pendingWithdraw.fee > 0 ? money(pendingWithdraw.fee) : 'Gratis'}</span>
                          </div>
                          <div className="flex items-center justify-between" style={{ marginTop: 2 }}>
                            <span style={{ color: '#fff', fontSize: 12.5, fontWeight: 600 }}>Total ki soti nan balans ou</span>
                            <span style={{ color: '#fff', fontSize: 12.5, fontWeight: 700 }}>{money(pendingWithdraw.amount + (pendingWithdraw.fee || 0))}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <p style={{ position: 'relative', margin: '16px 0 0', color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>Premye etap</p>
                        <p style={{ position: 'relative', margin: '2px 0 0', color: '#fff', fontSize: 18, fontWeight: 700 }}>Kreye kòd PIN ou</p>
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
                    <p style={{ position: 'relative', margin: '12px 0 0', color: '#fff', fontSize: 15, fontWeight: 600 }}>Byenvini, {(user?.fullName || '').split(' ')[0]}</p>
                    <p style={{ position: 'relative', margin: '3px 0 0', color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>BLICPay</p>
                  </div>
                )}

                <div style={{ padding: '22px 20px 24px' }}>
                  {pinScreen === 'setup' && (
                    <input type="password" value={pinSetupPassword} onChange={(e) => setPinSetupPassword(e.target.value)}
                      placeholder="Modpas kont ou (pou konfime)"
                      className="w-full mb-4 px-3 py-2.5 rounded-lg text-sm" style={{ border: `1px solid ${C.border}` }} />
                  )}

                  <p className="text-center text-sm mb-3.5" style={{ color: C.ink }}>
                    {pinScreen === 'setup' ? 'Chwazi yon kòd PIN 4 chif' : pinScreen === 'unlock' ? 'Antre kòd PIN ou pou kontinye' : 'Antre kòd PIN 4 chif ou'}
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
                      {pinBusy ? 'Ap konfime...' : 'Kreye kòd PIN'}
                    </button>
                  )}

                  {pinScreen === 'unlock' ? (
                    <button onClick={() => { localStorage.removeItem('blicpay_session'); window.location.reload(); }}
                      className="mt-4 w-full text-center text-xs font-semibold" style={{ color: C.navy, background: 'transparent', border: 'none' }}>
                      Sòti — konekte ak modpas ou pito
                    </button>
                  ) : (
                    <button onClick={cancelPinScreen} className="mt-4 w-full text-center text-xs font-semibold" style={{ color: C.muted, background: 'transparent', border: 'none' }}>
                      Anile
                    </button>
                  )}

                  <div className="flex items-center justify-center gap-1.5 mt-4">
                    <Lock size={12} color={C.muted} />
                    <p className="text-xs" style={{ color: C.muted }}>Kòd sa a rete ant ou ak BLICPay sèlman</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}


        {view === 'kyc' && kycStep === 'entwo' && (
          <div className="fadein px-5 pb-10 pt-2">
            <button onClick={() => setView('dashboard')} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
              <ArrowLeft size={15} /> Retounen
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})` }}>
                <ShieldCheck size={28} color="#fff" />
              </div>
              <h2 className="mt-3" style={{ ...fontDisplay, fontWeight: 800, fontSize: 20 }}>Verifye <em style={{ fontStyle: 'italic', color: C.sky }}>idantite ou</em></h2>
              <p className="mt-1.5 text-sm max-w-xs" style={{ color: C.muted }}>
                Nou sèvi ak yon patnè sekirize (Didit) pou verifye dokiman w ak yon foto vivan — pran sèlman kèk minit.
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
                'Prepare paspò w, CIN, oswa lisans chofè w.',
                'Ou pral pran yon foto dokiman an ak yon selfi vivan sou platfòm Didit.',
                'Rezilta a rive an kèk minit — men yon admin BLICPay dwe konfime l anvan kont ou verifye nèt.',
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
              {kycSubmitting ? 'Ap prepare...' : 'Kòmanse verifikasyon'}
            </button>
            <p className="mt-3 text-xs text-center" style={{ color: C.muted }}>
              Ou pral kite BLICPay pou yon moman pou konplete verifikasyon an sou Didit.
            </p>
          </div>
        )}

        {view === 'kyc' && kycStep === 'retou' && (
          <div className="fadein px-5 pb-10 pt-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: C.mint }}>
              <Check size={38} color="#fff" />
            </div>
            <h2 className="mt-5" style={{ ...fontDisplay, fontWeight: 800, fontSize: 21 }}>
              Verifikasyon <em style={{ fontStyle: 'italic', color: C.mint }}>resevwa</em>
            </h2>
            <p className="mt-2 text-sm max-w-xs" style={{ color: C.muted }}>
              Nou resevwa rezilta verifikasyon w. Yon admin BLICPay ap egzamine l anvan konfimasyon final — sa ka pran kèk moman jiska kèk èdtan.
            </p>

            <div className="mt-7 w-full max-w-xs p-4 rounded-xl text-left" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <p className="text-xs font-bold uppercase" style={{ color: C.muted }}>Pwochèn etap</p>
              <div className="mt-3 flex items-start gap-2.5">
                <Badge tone="amber">1</Badge>
                <p className="text-sm mt-0.5">Admin BLICPay ap egzamine rapò verifikasyon an.</p>
              </div>
              <div className="mt-2.5 flex items-start gap-2.5">
                <Badge tone="amber">2</Badge>
                <p className="text-sm mt-0.5">W ap resevwa yon notifikasyon lè estati w chanje.</p>
              </div>
            </div>

            <button onClick={() => setView('dashboard')}
              className="bp-btn mt-8 w-full max-w-xs py-3.5 rounded-xl font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})` }}>
              Retounen nan akèy
            </button>
          </div>
        )}

        {view === 'blicdepo' && (
          <div className="fadein px-5 pb-10 pt-2">
            <button onClick={() => setView('dashboard')} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
              <ArrowLeft size={15} /> Retounen
            </button>
            <div className="flex items-center justify-between">
              <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>BLIC <em style={{ fontStyle: 'italic', color: C.sky }}>Depo</em></h2>
              <button onClick={() => { setShowNewPocket((s) => !s); setShowAddMoney(false); }} className="text-xs font-semibold flex items-center gap-1" style={{ color: C.navy }}>
                <Plus size={13} /> Nouvo pòch
              </button>
            </div>
            <p className="mt-1.5 text-sm" style={{ color: C.muted }}>Epay, transfere, epi retire lajan ou nan pòch separe.</p>

            <button onClick={() => {
              setAddMoneyPocketId(pockets[0]?.id || null);
              setAddMoneyAmount('');
              setShowAddMoney((s) => !s);
              setShowNewPocket(false);
            }}
              className="bp-btn mt-4 w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})` }}>
              <ArrowDownLeft size={16} /> Ajoute lajan
            </button>

            {showAddMoney && (
              <div className="mt-3 p-4 rounded-xl space-y-2.5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                {pockets.length === 0 ? (
                  <p className="text-sm" style={{ color: C.muted }}>Kreye yon pòch anvan pou ka ajoute lajan.</p>
                ) : (
                  <>
                    <p className="text-xs font-semibold" style={{ color: C.muted }}>NAN KIYÈS PÒCH</p>
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
                <p className="text-xs font-semibold pt-1" style={{ color: C.muted }}>MONTAN (SOTI NAN KONT PRENSIPAL)</p>
                <div className="relative">
                  <input value={addMoneyAmount} onChange={(e) => setAddMoneyAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="0.00" inputMode="decimal"
                    className="w-full pl-3.5 pr-14 py-2.5 rounded-lg text-sm font-semibold"
                    style={{ background: C.bg, border: `1px solid ${C.border}`, ...fontMono }} />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-semibold text-xs" style={{ color: C.muted }}>HTG</span>
                </div>
                <p className="text-xs" style={{ color: C.muted }}>
                  Sòld disponib: <span style={{ ...fontMono, color: C.ink, fontWeight: 600 }}>{money(balance)}</span>
                </p>
                <button onClick={addMoneyToPocket} disabled={addMoneyProcessing}
                  className="bp-btn w-full py-2.5 rounded-lg text-sm font-semibold text-white"
                  style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, opacity: addMoneyProcessing ? 0.7 : 1 }}>
                  {addMoneyProcessing ? 'Ap trete...' : 'Konfime'}
                </button>
                  </>
                )}
              </div>
            )}

            {showNewPocket && (
              <div className="mt-4 p-4 rounded-xl space-y-2.5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <input value={newPocketName} onChange={(e) => setNewPocketName(e.target.value)}
                  placeholder="Non pòch la (egz. Lekòl)"
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm" style={{ background: C.bg, border: `1px solid ${C.border}` }} />
                <input value={newPocketTarget} onChange={(e) => setNewPocketTarget(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Objektif an HTG (opsyonèl)"
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm" style={{ background: C.bg, border: `1px solid ${C.border}` }} />
                <button onClick={createPocket}
                  className="bp-btn w-full py-2.5 rounded-lg text-sm font-semibold text-white"
                  style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})` }}>
                  Kreye pòch la
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
                        <p className="mt-1.5 text-xs" style={{ color: C.muted }}>{pct}% sou objektif {money(p.target)}</p>
                      </>
                    ) : (
                      <p className="mt-1.5 text-xs" style={{ color: C.muted }}>Pa gen objektif mete</p>
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
                <ArrowLeft size={15} /> Retounen
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
                    <p className="mt-1.5 text-xs" style={{ color: C.muted }}>{pct}% sou objektif {money(pocket.target)}</p>
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
                    <span className="text-xs font-semibold">Epay</span>
                  </button>
                  <button onClick={() => setPocketMode('transfer')} className="bp-btn rounded-xl p-3 flex flex-col items-center gap-2 text-center"
                    style={{ background: C.card, border: `1px solid ${C.border}` }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#E6F0FB' }}>
                      <ArrowLeftRight size={16} color={C.navy} />
                    </div>
                    <span className="text-xs font-semibold">Transfere</span>
                  </button>
                  <button onClick={() => setPocketMode('spend')} className="bp-btn rounded-xl p-3 flex flex-col items-center gap-2 text-center"
                    style={{ background: C.card, border: `1px solid ${C.border}` }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#FBEAEA' }}>
                      <ArrowUpRight size={16} color={C.danger} />
                    </div>
                    <span className="text-xs font-semibold">Retire</span>
                  </button>
                </div>
              ) : (
                <div className="mt-6">
                  <p className="text-xs font-semibold mb-1.5" style={{ color: C.muted }}>
                    {pocketMode === 'deposit' ? 'MONTAN POU EPAY (SOTI NAN KONT PRENSIPAL)'
                      : pocketMode === 'spend' ? 'MONTAN POU RETIRE'
                      : 'MONTAN POU TRANSFERE'}
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
                      <p className="text-xs font-semibold mt-4 mb-1.5" style={{ color: C.muted }}>KOTE POU VOYE L</p>
                      <div className="space-y-2">
                        <button onClick={() => setPocketTransferTarget('main')}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm"
                          style={{ background: C.card, border: `1px solid ${pocketTransferTarget === 'main' ? C.navy : C.border}` }}>
                          Kont prensipal
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
                      Anile
                    </button>
                    <button onClick={confirmPocketAction} disabled={pocketProcessing}
                      className="bp-btn flex-1 py-3 rounded-xl font-semibold text-sm text-white"
                      style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, opacity: pocketProcessing ? 0.7 : 1 }}>
                      {pocketProcessing ? 'Ap trete...' : 'Konfime'}
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-7 flex items-center justify-between">
                <h3 className="font-semibold text-sm" style={{ color: C.muted }}>ISTWA TRANZAKSYON</h3>
              </div>
              <div className="mt-3 rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                {pocketTx.length === 0 ? (
                  <p className="text-sm p-4" style={{ color: C.muted, background: C.card }}>Pa gen tranzaksyon nan pòch sa a.</p>
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
                          <p className="text-sm font-medium">{t.method}</p>
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
              <ArrowLeft size={15} /> Retounen
            </button>
            <div className="flex items-center justify-between">
              <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>Depo Ak <em style={{ fontStyle: 'italic', color: C.sky }}>Objektif</em></h2>
              <button onClick={() => setView('termdepo-new')} className="text-xs font-semibold flex items-center gap-1" style={{ color: C.navy }}>
                <Plus size={13} /> Nouvo objektif
              </button>
            </div>
            <p className="mt-1.5 text-sm" style={{ color: C.muted }}>
              Fikse yon objektif — lajan an rete bloke jistan ou atenn li.
            </p>

            <div className="mt-5 space-y-3">
              {goalDeposits.length === 0 && (
                <p className="text-sm p-4 rounded-xl" style={{ color: C.muted, background: C.card, border: `1px solid ${C.border}` }}>
                  Ou poko gen okenn objektif.
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
                      <Badge tone={reached ? 'mint' : 'premium'}>{reached ? 'Atenn' : 'Bloke'}</Badge>
                    </div>
                    <p className="mt-2.5" style={{ ...fontMono, fontSize: 18, fontWeight: 600 }}>{money(gd.current)}</p>
                    <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: C.bg }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: reached ? C.mint : '#6D3FD1' }} />
                    </div>
                    <p className="mt-1.5 text-xs" style={{ color: C.muted }}>{pct}% sou objektif {money(gd.target)}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {view === 'termdepo-new' && (
          <div className="fadein px-5 pb-10 pt-2">
            <button onClick={() => setView('termdepo')} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
              <ArrowLeft size={15} /> Retounen
            </button>
            <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>Nouvo <em style={{ fontStyle: 'italic', color: C.sky }}>Objektif</em></h2>
            <p className="mt-1.5 text-sm" style={{ color: C.muted }}>Bay objektif la yon non ak yon montan pou atenn.</p>

            <p className="text-xs font-semibold mt-6 mb-2" style={{ color: C.muted }}>NON OBJEKTIF LA</p>
            <input value={newGoalName} onChange={(e) => setNewGoalName(e.target.value)}
              placeholder="Egz. Machin, Lekòl, Kay..."
              className="w-full px-4 py-3.5 rounded-xl text-sm" style={{ background: C.card, border: `1px solid ${C.border}` }} />

            <p className="text-xs font-semibold mt-5 mb-2" style={{ color: C.muted }}>MONTAN OBJEKTIF LA</p>
            <div className="relative">
              <input value={newGoalTarget} onChange={(e) => setNewGoalTarget(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="0.00" inputMode="decimal"
                className="w-full pl-4 pr-16 py-3.5 rounded-xl text-lg font-semibold"
                style={{ background: C.card, border: `1px solid ${C.border}`, ...fontMono }} />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-sm" style={{ color: C.muted }}>HTG</span>
            </div>

            <div className="mt-4 flex items-start gap-2 text-xs p-3 rounded-lg" style={{ background: '#FBF0DE', color: '#946115' }}>
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              Lajan ou mete la a ap rete bloke — pa gen retrè ni transfè jistan ou atenn montan objektif la.
            </div>

            <button onClick={createGoalDeposit}
              className="bp-btn mt-5 w-full py-3.5 rounded-xl font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})` }}>
              Kreye objektif la
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
                <ArrowLeft size={15} /> Retounen
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
                  <p className="mt-1.5 text-xs" style={{ color: C.muted }}>{pct}% sou objektif {money(gd.target)}</p>
                </div>
              </div>

              {reached ? (
                <>
                  <div className="mt-5 flex items-start gap-2 text-xs p-3 rounded-lg" style={{ background: '#E4F5EF', color: C.mint }}>
                    <Check size={15} className="shrink-0 mt-0.5" />
                    Objektif la atenn — lajan an disponib kounye a.
                  </div>
                  <button onClick={() => withdrawGoal(gd.id)} disabled={goalProcessing}
                    className="bp-btn mt-4 w-full py-3.5 rounded-xl font-semibold text-white"
                    style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, opacity: goalProcessing ? 0.7 : 1 }}>
                    {goalProcessing ? 'Ap trete...' : 'Retire nan kont prensipal'}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold mt-6 mb-2" style={{ color: C.muted }}>AJOUTE LAJAN (SOTI NAN KONT PRENSIPAL)</p>
                  <div className="relative">
                    <input value={addGoalAmount} onChange={(e) => setAddGoalAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                      placeholder="0.00" inputMode="decimal"
                      className="w-full pl-4 pr-16 py-3.5 rounded-xl text-lg font-semibold"
                      style={{ background: C.card, border: `1px solid ${C.border}`, ...fontMono }} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-sm" style={{ color: C.muted }}>HTG</span>
                  </div>
                  <p className="mt-2 text-xs" style={{ color: C.muted }}>
                    Sòld disponib: <span style={{ ...fontMono, color: C.ink, fontWeight: 600 }}>{money(balance)}</span>
                  </p>
                  <div className="mt-4 flex items-start gap-2 text-xs p-3 rounded-lg" style={{ background: '#FBF0DE', color: '#946115' }}>
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    Ou pa ka retire ni transfere lajan sa a jistan objektif la atenn. Nan ka ijans gen yon frè 4,5 % kap soti sou montan w ap retire a.
                  </div>
                  <button onClick={addToGoal} disabled={goalProcessing}
                    className="bp-btn mt-4 w-full py-3.5 rounded-xl font-semibold text-white"
                    style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, opacity: goalProcessing ? 0.7 : 1 }}>
                    {goalProcessing ? 'Ap trete...' : 'Ajoute nan objektif la'}
                  </button>

                  {gd.current > 0 && (
                    !showEmergency ? (
                      <button onClick={() => setShowEmergency(true)}
                        className="bp-btn mt-2.5 w-full py-3 rounded-xl font-semibold text-sm"
                        style={{ border: `1px solid ${C.border}`, color: C.danger }}>
                        Retrè ijans (frè 4.5%)
                      </button>
                    ) : (
                      <div className="mt-3 p-4 rounded-xl" style={{ background: '#FBEAEA', border: `1px solid #F3CFCC` }}>
                        <p className="text-xs font-semibold" style={{ color: C.danger }}>RETRÈ IJANS</p>
                        <p className="mt-1.5 text-xs" style={{ color: '#8A3530' }}>
                          Yon frè 4.5% ap prelve sou lajan ki nan objektif la si ou retire l anvan li atenn.
                        </p>
                        <div className="mt-3 space-y-1.5 text-sm">
                          <div className="flex items-center justify-between">
                            <span style={{ color: '#8A3530' }}>Lajan nan objektif la</span>
                            <span style={fontMono}>{money(gd.current)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span style={{ color: '#8A3530' }}>Frè (4.5%)</span>
                            <span style={{ ...fontMono, color: C.danger }}>-{money(Math.round(gd.current * EMERGENCY_FEE_RATE))}</span>
                          </div>
                          <div className="flex items-center justify-between pt-1.5" style={{ borderTop: '1px solid #F3CFCC' }}>
                            <span className="font-semibold" style={{ color: '#8A3530' }}>Ou ap resevwa</span>
                            <span style={{ ...fontMono, fontWeight: 700 }}>{money(gd.current - Math.round(gd.current * EMERGENCY_FEE_RATE))}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button onClick={() => setShowEmergency(false)}
                            className="bp-btn flex-1 py-2.5 rounded-lg text-xs font-semibold" style={{ border: `1px solid ${C.border}`, color: C.muted }}>
                            Anile
                          </button>
                          <button onClick={() => emergencyWithdrawGoal(gd.id)} disabled={goalProcessing}
                            className="bp-btn flex-1 py-2.5 rounded-lg text-xs font-semibold text-white"
                            style={{ background: C.danger, opacity: goalProcessing ? 0.7 : 1 }}>
                            {goalProcessing ? 'Ap trete...' : 'Konfime retrè ijans'}
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
              <ArrowLeft size={15} /> Retounen
            </button>

            {!loan && (
              <div className="flex flex-col items-center text-center pt-10">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#E6F0FB' }}>
                  <HandCoins size={28} color={C.navy} />
                </div>
                <h2 className="mt-4" style={{ ...fontDisplay, fontWeight: 800, fontSize: 20 }}>
                  BLIC Prè <em style={{ fontStyle: 'italic', color: C.sky }}>ap vini talè</em>
                </h2>
                <p className="mt-2 text-sm max-w-xs" style={{ color: C.muted }}>
                  N ap travay pou mete fonksyonalite sa a disponib. Rete branche — n ap avize w lè li pare.
                </p>
                <Badge tone="amber">Talè</Badge>
              </div>
            )}

            {loan && loan.status === 'annatant' && (
              <>
                <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>Demand <em style={{ fontStyle: 'italic', color: C.sky }}>Prè</em></h2>
                <div className="mt-5 p-5 rounded-2xl text-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ background: '#FBF0DE' }}>
                    <Clock size={24} color={C.amber} />
                  </div>
                  <p className="mt-3 font-semibold text-sm">N ap egzamine demand ou</p>
                  <p className="mt-1 text-xs" style={{ color: C.muted }}>{money(loan.amount)} · {loan.months} mwa</p>
                  <button onClick={checkLoanStatus}
                    className="bp-btn mt-4 w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                    style={{ border: `1px solid ${C.border}`, color: C.muted }}>
                    <RefreshCw size={13} style={checkingLoan ? { animation: 'spin 0.8s linear infinite' } : undefined} />
                    {checkingLoan ? 'Ap tcheke...' : 'Tcheke estati'}
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
                    Prè <em style={{ fontStyle: 'italic', color: C.sky }}>{loan.status === 'fini' ? 'Peye' : 'Aktif'}</em>
                  </h2>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                      <p className="text-xs" style={{ color: C.muted }}>Kapital</p>
                      <p className="mt-1" style={{ ...fontMono, fontSize: 17, fontWeight: 600 }}>{money(loan.amount)}</p>
                    </div>
                    <div className="p-4 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                      <p className="text-xs" style={{ color: C.muted }}>Vèsman chak mwa</p>
                      <p className="mt-1" style={{ ...fontMono, fontSize: 17, fontWeight: 600 }}>{money(loan.installmentAmount)}</p>
                    </div>
                  </div>

                  <div className="mt-4 p-4 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                    <div className="flex items-center justify-between text-xs" style={{ color: C.muted }}>
                      <span>Pwogrè ranbousman</span>
                      <span>{paidCount}/{loan.months} vèsman</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: C.bg }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: loan.status === 'fini' ? C.mint : C.navy }} />
                    </div>
                  </div>

                  {loan.status === 'fini' ? (
                    <div className="mt-4 flex items-start gap-2 text-xs p-3 rounded-lg" style={{ background: '#E4F5EF', color: C.mint }}>
                      <Check size={15} className="shrink-0 mt-0.5" />
                      Prè a peye nèt. Ou ka mande yon lòt lè ou vle.
                    </div>
                  ) : (
                    <button onClick={payLoanInstallment} disabled={loanProcessing}
                      className="bp-btn mt-4 w-full py-3.5 rounded-xl font-semibold text-white"
                      style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, opacity: loanProcessing ? 0.7 : 1 }}>
                      {loanProcessing ? 'Ap trete...' : `Peye vèsman ${next?.n} (${money(next?.amount || 0)})`}
                    </button>
                  )}

                  <h3 className="font-semibold text-sm mt-7 mb-3" style={{ color: C.muted }}>ECHEANSYE</h3>
                  <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                    {loan.installments.map((i, idx) => (
                      <div key={i.n} className="flex items-center justify-between px-4 py-3"
                        style={{ background: C.card, borderTop: idx ? `1px solid ${C.border}` : 'none' }}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ background: i.status === 'peye' ? '#E4F5EF' : '#EEF1F6' }}>
                            {i.status === 'peye' ? <Check size={14} color={C.mint} /> : <Clock size={14} color={C.muted} />}
                          </div>
                          <span className="text-sm font-medium">Vèsman {i.n} · {i.month}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span style={fontMono} className="text-sm">{money(i.amount)}</span>
                          <Badge tone={i.status === 'peye' ? 'mint' : 'muted'}>{i.status === 'peye' ? 'Peye' : 'Annatant'}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {loan.status === 'fini' && (
                    <button onClick={() => { setLoan(null); }}
                      className="bp-btn mt-5 w-full py-3 rounded-xl font-semibold text-sm"
                      style={{ border: `1px solid ${C.border}`, color: C.navy }}>
                      Mande yon nouvo prè
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
                  {kycStatus === 'verifye' && <BadgeCheck size={15} color={C.sky} fill={C.navy} />}
                </div>
                <p className="text-xs mt-0.5" style={{ color: C.muted }}>{user?.phone}</p>
                <button onClick={() => { navigator.clipboard?.writeText(getClientId(user)); flash('ID kopye.'); }}
                  className="flex items-center gap-1 mt-0.5" style={{ ...fontMono, color: C.navy }}>
                  <span className="text-xs">ID: {getClientId(user)}</span>
                  <Copy size={11} />
                </button>
              </div>
              <Badge tone={kycStatus === 'verifye' ? 'mint' : kycStatus === 'annatant' ? 'amber' : 'muted'}>
                {kycStatus === 'verifye' ? 'Verifye' : kycStatus === 'annatant' ? 'Annatant' : 'Pa verifye'}
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
              <button onClick={() => { setKycStep('entwo'); setView('kyc'); }}
                className="w-full flex items-center justify-between px-4 py-3.5" style={{ background: C.card, borderTop: `1px solid ${C.border}` }}>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={16} color={C.muted} />
                  <span className="text-sm font-medium">KYC</span>
                </div>
                <ChevronRight size={15} color={C.muted} />
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
              <button onClick={() => flash('Fonksyon sa a ap vini.')}
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
              <span className="text-sm" style={{ color: C.muted }}>BLICPay</span>
              <span className="text-sm" style={{ ...fontMono, color: C.muted }}>v1.0.0</span>
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
              <a href="tel:+50928000000"
                className="bp-btn w-full flex items-center gap-3 p-3.5 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: '#E6F0FB' }}>
                  <Phone size={17} color={C.navy} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{tr('callUs')}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.muted }}>+509 2800 0000</p>
                </div>
                <ChevronRight size={16} color={C.muted} />
              </a>
              <a href="https://wa.me/50928000000" target="_blank" rel="noopener noreferrer"
                className="bp-btn w-full flex items-center gap-3 p-3.5 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: '#E4F5EF' }}>
                  <Smartphone size={17} color={C.mint} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{tr('chatWhatsapp')}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.muted }}>+509 2800 0000</p>
                </div>
                <ChevronRight size={16} color={C.muted} />
              </a>
              <a href="mailto:sipò@blicpay.com"
                className="bp-btn w-full flex items-center gap-3 p-3.5 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: '#F4EBFF' }}>
                  <Mail size={17} color="#6D3FD1" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{tr('emailUs')}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.muted }}>sipò@blicpay.com</p>
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
                  <option value="lot">{lang === 'fr' ? 'Autre' : lang === 'en' ? 'Other' : 'Lòt'}</option>
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
                ) : filtered.map((t, i) => {
                  const outgoing = t.type === 'retrè' || t.type === 'transfè';
                  return (
                    <div key={t.id} className="flex items-center justify-between px-4 py-3.5"
                      style={{ background: C.card, borderTop: i ? `1px solid ${C.border}` : 'none' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: outgoing ? '#FBEAEA' : '#E4F5EF' }}>
                          {outgoing ? <ArrowUpRight size={15} color={C.danger} /> : <ArrowDownLeft size={15} color={C.mint} />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{t.method}</p>
                          <p className="text-xs mt-0.5" style={{ color: C.muted }}>{t.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm" style={{ ...fontMono, color: outgoing ? C.danger : C.ink }}>
                          {outgoing ? '-' : '+'}{money(t.amount)}
                        </span>
                        <Badge tone={t.status === 'konfime' ? 'mint' : 'amber'}>
                          {t.status === 'konfime' ? 'Konfime' : 'Annatant'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {view === 'transfer' && (
          <div className="fadein px-5 pb-10 pt-2">
            <button onClick={() => setView('dashboard')} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
              <ArrowLeft size={15} /> Retounen
            </button>
            <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>Transfere <em style={{ fontStyle: 'italic', color: C.sky }}>lajan</em></h2>
            <p className="mt-1.5 text-sm" style={{ color: C.muted }}>Voye HTG bay yon lòt itilizatè BLICPay avèk ID kliyan li.</p>

            <div className="mt-6 space-y-3">
              <div>
                <p className="text-xs font-semibold mb-1.5" style={{ color: C.muted }}>ID KLIYAN DESTINATÈ</p>
                <input
                  value={transferId}
                  onChange={(e) => setTransferId(e.target.value.toUpperCase())}
                  placeholder="BP-______"
                  className="w-full px-4 py-3.5 rounded-xl text-sm"
                  style={{ ...fontMono, background: C.card, border: `1px solid ${C.border}` }}
                />
                <p className="mt-1.5 text-xs" style={{ color: C.muted }}>
                  Chak kliyan gen yon ID pa yo — ou ka jwenn pa w la nan Paramèt.
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1.5" style={{ color: C.muted }}>MONTAN</p>
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
              Sòld disponib: <span style={{ ...fontMono, color: C.ink, fontWeight: 600 }}>{money(balance)}</span>
            </p>

            <button onClick={sendTransfer} disabled={transferProcessing}
              className="bp-btn mt-6 w-full py-3.5 rounded-xl font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, opacity: transferProcessing ? 0.7 : 1 }}>
              {transferProcessing ? 'Ap voye...' : 'Voye lajan an'}
            </button>
          </div>
        )}

        {view === 'deposit' && !natcashProofScreen && !biwoBranchScreen && (
          <div className="fadein px-5 pb-10 pt-2">
            <button onClick={() => setView('dashboard')} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
              <ArrowLeft size={15} /> Retounen
            </button>
            <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>
              Konbyen ou vle <em style={{ fontStyle: 'italic', color: C.sky }}>{flowKind === 'withdraw' ? 'retire?' : 'depoze?'}</em>
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

            <h3 className="mt-7 font-semibold text-sm" style={{ color: C.muted }}>CHWAZI METÒD DEPO</h3>
            <div className="mt-3 space-y-2.5">
              {methods.map((m) => (
                <button key={m.id} onClick={() => pickMethod(m)} disabled={processing}
                  className="bp-btn w-full flex items-center gap-3 p-3.5 rounded-xl text-left"
                  style={{ background: C.card, border: `1px solid ${C.border}`, opacity: processing || m.comingSoon ? 0.6 : 1 }}>
                  <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 overflow-hidden" style={{ background: m.logo ? '#fff' : m.color, border: m.logo ? `1px solid ${C.border}` : 'none' }}>
                    {m.logo ? <img src={m.logo} alt={m.name} className="w-full h-full object-cover" /> : <m.icon size={19} color="#fff" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{m.name}</p>
                      {m.comingSoon && <Badge tone="amber">Coming soon</Badge>}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: C.muted }}>{m.desc}</p>
                  </div>
                  {!m.comingSoon && (processing && selectedMethod?.id === m.id
                    ? <RefreshCw size={16} color={C.muted} style={{ animation: 'spin 0.8s linear infinite' }} />
                    : <ChevronRight size={16} color={C.muted} />)}
                </button>
              ))}
            </div>
          </div>
        )}

        {view === 'deposit' && biwoBranchScreen && (
          <div className="fadein px-5 pb-10 pt-2">
            <button onClick={() => setBiwoBranchScreen(false)} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
              <ArrowLeft size={15} /> Chanje metòd
            </button>

            <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>
              Chwazi <em style={{ fontStyle: 'italic', color: C.sky }}>siikisal</em> la
            </h2>
            <p className="mt-1.5 text-sm" style={{ color: C.muted }}>
              {money(Number(amount))} · {flowKind === 'withdraw' ? 'Retrè' : 'Depo'} nan biwo
            </p>

            {loadingBiwoBranches ? (
              <p className="mt-6 text-sm text-center" style={{ color: C.muted }}>Ap chaje...</p>
            ) : biwoBranches.length === 0 ? (
              <p className="mt-6 text-sm p-4 rounded-xl" style={{ color: C.muted, background: C.card, border: `1px solid ${C.border}` }}>
                Pa gen okenn siikisal disponib toujou.
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

            <button onClick={confirmBiwoBranch} disabled={!selectedBiwoBranch || processing}
              className="bp-btn mt-6 w-full py-3.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, opacity: (!selectedBiwoBranch || processing) ? 0.6 : 1 }}>
              {processing ? 'Ap trete...' : 'Kontinye'}
            </button>
          </div>
        )}

        {view === 'deposit' && natcashProofScreen && (
          <div className="fadein px-5 pb-10 pt-2">
            <button onClick={() => setNatcashProofScreen(false)} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
              <ArrowLeft size={15} /> Chanje metòd
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden" style={{ background: '#fff', border: `1px solid ${C.border}` }}>
                <img src="/logos/natcash.jpg" alt="NatCash" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 19 }}>Depo NatCash</h2>
                <p className="text-xs" style={{ color: C.muted }}>{money(Number(amount))}</p>
              </div>
            </div>

            <p className="mt-4 text-xs p-3 rounded-lg" style={{ background: '#E6F0FB', color: C.navy }}>
              Voye {money(Number(amount))} sou nimewo NatCash BLICPay a, epi ajoute ID tranzaksyon an ak yon kapti resi a anba a.
            </p>

            <label className="block mt-4 text-xs font-semibold" style={{ color: C.muted }}>ID TRANZAKSYON AN</label>
            <input
              value={natcashTransactionId}
              onChange={(e) => setNatcashTransactionId(e.target.value)}
              placeholder="Egzanp: TXN123456789"
              className="w-full mt-1.5 px-3.5 py-3 rounded-xl text-sm"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
            />

            <label className="block mt-4 text-xs font-semibold" style={{ color: C.muted }}>KAPTI RESI A</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onNatcashFileSelected(e.target.files?.[0] || null)}
              className="w-full mt-1.5 text-xs"
            />
            {natcashScanning && (
              <p className="mt-1.5 text-xs flex items-center gap-1.5" style={{ color: C.muted }}>
                <RefreshCw size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> Ap li resi a pou ranpli chan yo otomatikman...
              </p>
            )}

            <button onClick={submitNatcashDeposit} disabled={natcashSubmitting}
              className="bp-btn mt-6 w-full py-3.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, opacity: natcashSubmitting ? 0.7 : 1 }}>
              {natcashSubmitting ? 'Ap verifye resi a...' : 'Soumèt depo a'}
            </button>
          </div>
        )}

        {view === 'confirm' && selectedMethod && (
          <div className="fadein px-5 pb-10 pt-2">
            <button onClick={() => setView('deposit')} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
              <ArrowLeft size={15} /> Chanje metòd
            </button>

            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden" style={{ background: selectedMethod.logo ? '#fff' : selectedMethod.color, border: selectedMethod.logo ? `1px solid ${C.border}` : 'none' }}>
                {selectedMethod.logo ? <img src={selectedMethod.logo} alt={selectedMethod.name} className="w-full h-full object-cover" /> : <selectedMethod.icon size={26} color="#fff" />}
              </div>
              <h2 className="mt-4" style={{ ...fontDisplay, fontWeight: 800, fontSize: 20 }}>
                {flowKind === 'withdraw' ? 'Retrè ' : 'Depo '}<em style={{ fontStyle: 'italic', color: C.sky }}>{selectedMethod.name}</em>
              </h2>
              <p className="mt-1 text-sm" style={{ color: C.muted }}>Montan: <span style={{ ...fontMono, color: C.ink, fontWeight: 600 }}>{money(Number(amount))}</span></p>
            </div>

            <div className="mt-6 rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              {selectedMethod.kind === 'mobile' && (
                <>
                  <p className="text-sm" style={{ color: C.muted }}>
                    Ajoute nimewo sa a nan bous mobil {selectedMethod.name} ou epi otorize depo a:
                  </p>
                  <div className="mt-3 flex items-center justify-between py-3 px-3 rounded-lg" style={{ background: C.bg }}>
                    <span style={{ ...fontMono, fontSize: 17 }}>+509 4000 1212</span>
                    <button onClick={() => { navigator.clipboard?.writeText('+50940001212'); flash('Nimewo kopye.'); }}>
                      <Copy size={16} color={C.muted} />
                    </button>
                  </div>
                </>
              )}
              {selectedMethod.kind === 'crypto' && (
                <>
                  <p className="text-sm" style={{ color: C.muted }}>Voye USDT (rezo TRC20) nan adrès sa a:</p>
                  <div className="mt-3 flex items-center justify-between py-3 px-3 rounded-lg" style={{ background: C.bg }}>
                    <span style={{ ...fontMono, fontSize: 12 }}>TXn9pQz4Rk8s2LmVw7Ht3FybGc1DqEo6Rp</span>
                    <button onClick={() => { navigator.clipboard?.writeText('TXn9pQz4Rk8s2LmVw7Ht3FybGc1DqEo6Rp'); flash('Adrès kopye.'); }}>
                      <Copy size={16} color={C.muted} />
                    </button>
                  </div>
                </>
              )}
              {selectedMethod.kind === 'bank' && (
                <>
                  <p className="text-sm" style={{ color: C.muted }}>Voye depo a ak Zelle nan imèl sa a:</p>
                  <div className="mt-3 flex items-center justify-between py-3 px-3 rounded-lg" style={{ background: C.bg }}>
                    <span style={{ ...fontMono, fontSize: 14 }}>paiement@blicpay.com</span>
                    <button onClick={() => { navigator.clipboard?.writeText('paiement@blicpay.com'); flash('Imèl kopye.'); }}>
                      <Copy size={16} color={C.muted} />
                    </button>
                  </div>
                </>
              )}
              {selectedMethod.kind === 'office' && (
                <>
                  <p className="text-sm" style={{ color: C.muted }}>
                    {flowKind === 'withdraw'
                      ? 'Prezante kòd referans sa a nan youn nan biwo nou yo pou resevwa kach ou:'
                      : 'Prezante kòd referans sa a lè w ap peye kach nan youn nan biwo nou yo:'}
                  </p>
                  <div className="mt-3 flex items-center justify-between py-3 px-3 rounded-lg" style={{ background: C.bg }}>
                    <span style={{ ...fontMono, fontSize: 17, letterSpacing: 1 }}>{reference}</span>
                    <button onClick={() => { navigator.clipboard?.writeText(reference); flash('Referans kopye.'); }}>
                      <Copy size={16} color={C.muted} />
                    </button>
                  </div>
                  <p className="mt-4 text-xs font-semibold" style={{ color: C.muted }}>BIWO DISPONIB</p>
                  <div className="mt-2 space-y-1.5">
                    {offices.map((o) => (
                      <div key={o} className="flex items-center gap-2 text-sm">
                        <Building2 size={14} color={C.muted} />
                        {o}
                      </div>
                    ))}
                  </div>
                </>
              )}
              {selectedMethod.kind !== 'office' && (
                <p className="mt-3 text-xs" style={{ ...fontMono, color: C.muted }}>Referans: {reference}</p>
              )}
            </div>

            <div className="mt-4 flex items-start gap-2 text-xs p-3 rounded-lg" style={{ background: '#FBF0DE', color: '#946115' }}>
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              {flowKind === 'withdraw'
                ? 'Retrè a ap parèt kòm "Annatant" jistan yon admin konfime li nan biwo a.'
                : 'Depo a ap parèt kòm "Annatant" jistan nou konfime li resevwa.'}
            </div>

            <button onClick={() => setView('dashboard')}
              className="bp-btn mt-6 w-full py-3.5 rounded-xl font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})` }}>
              Bon
            </button>
          </div>
        )}

        {/* bottom nav */}
        {view === 'dashboard' && (
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
