import React, { useState } from 'react';
import {
  Bell, Wallet, ArrowUpRight, ArrowDownLeft, Clock, Settings, Home,
  ArrowLeftRight, Plus, Check, Copy, ChevronRight, ArrowLeft, ShieldCheck,
  DollarSign, Smartphone, Banknote, X, AlertCircle, Building2, Eye, EyeOff, RefreshCw, Users, BadgeCheck, PiggyBank,
  Lock, Calendar, Percent, TrendingUp, HandCoins, Globe, Camera, User, LogOut, Phone, Mail, Search
} from 'lucide-react';

// Coupe l'URL réelle de ton backend ici une fois qu'il est déployé
// (Railway, Render, etc.) — ex: "https://blicpay-api.up.railway.app"
const API_BASE_URL = 'https://blicpay-backend-production.up.railway.app';

// Petit client HTTP partagé. Ajoute automatiquement le token JWT quand il
// y en a un, et lève une erreur avec le message renvoyé par l'API en cas
// d'échec pour que les écrans puissent l'afficher directement.
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
  { id: 'moncash', name: 'Mon Cash', desc: 'Depoze kach nan pwen Digicel ou', color: '#1E9E7C', icon: DollarSign, kind: 'mobile', comingSoon: true },
  { id: 'natcash', name: 'NatCash', desc: 'Depoze ak bous mobil NatCash ou', color: '#1C6FBF', icon: Smartphone, kind: 'mobile', comingSoon: true },
  { id: 'usdt', name: 'USDT', desc: 'Depoze dola ameriken an stablecoin (Tether)', color: '#0E9E86', icon: Banknote, kind: 'crypto', comingSoon: true },
  { id: 'zelle', name: 'Zelle', desc: 'Depoze dirèkteman soti nan kont labank ou', color: '#6D3FD1', icon: ArrowLeftRight, kind: 'bank', comingSoon: true },
  { id: 'biwo', name: 'Nan biwo', desc: 'Ale peye kach nan yonn nan biwo nou yo', color: '#946115', icon: Building2, kind: 'office' },
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
  },
};

const initialSolGroups = [
  {
    id: 'basic',
    tier: 'Basic',
    name: 'Sòl Basic',
    amount: 1000,
    frequency: 'Chak mwa',
    maxMembers: 10,
    cycle: 3,
    currentTurn: 0,
    myPayments: [
      { month: 'Jen 2026', status: 'peye' },
      { month: 'Jiyè 2026', status: 'peye' },
      { month: 'Out 2026', status: 'peye' },
    ],
    members: [
      { id: 'm1', name: 'Jean Baptiste' },
      { id: 'm2', name: 'Marie Joseph' },
      { id: 'm3', name: 'Pierre Louis' },
      { id: 'm4', name: 'Nadège Charles' },
      { id: 'm5', name: 'Wilner Étienne' },
    ],
  },
  {
    id: 'standard',
    tier: 'Standard',
    name: 'Sòl Standard',
    amount: 5000,
    frequency: 'Chak mwa',
    maxMembers: 10,
    cycle: 4,
    currentTurn: 1,
    myPayments: [
      { month: 'Me 2026', status: 'peye' },
      { month: 'Jen 2026', status: 'peye' },
      { month: 'Jiyè 2026', status: 'peye' },
      { month: 'Out 2026', status: 'peye' },
    ],
    members: [
      { id: 'm6', name: 'Roseline Fleurant' },
      { id: 'm7', name: 'Samuel Augustin' },
      { id: 'm8', name: 'Kettelie Dorsainvil' },
      { id: 'm9', name: 'Fabiola Registre' },
      { id: 'm10', name: 'Mackenson Jean' },
      { id: 'm11', name: 'Guerline Noël' },
    ],
  },
  {
    id: 'premium',
    tier: 'Premium',
    name: 'Sòl Premium',
    amount: 15000,
    frequency: 'Chak mwa',
    maxMembers: 10,
    cycle: 2,
    currentTurn: 3,
    myPayments: [
      { month: 'Jiyè 2026', status: 'peye' },
      { month: 'Out 2026', status: 'annatant' },
    ],
    members: [
      { id: 'm12', name: 'Ronald Michel' },
      { id: 'm13', name: 'Stéphanie Volcy' },
      { id: 'm14', name: 'Jimmy Prophète' },
      { id: 'm15', name: 'Anaïse Sylvain' },
      { id: 'm16', name: 'Yvenson Alcéus' },
      { id: 'm17', name: 'Darline Métellus' },
      { id: 'm18', name: 'Wisly Casséus' },
      { id: 'm19', name: 'Chantale Beauvoir' },
      { id: 'm20', name: 'Frantz Similien' },
      { id: 'm21', name: 'Jean Baptiste' },
    ],
  },
];

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
function isSolPaymentWindowOpen() {
  const day = new Date().getDate();
  return day >= 25 && day <= 28;
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

export default function BlicPayApp() {
  const [view, setView] = useState('auth');
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
  const [kycFile, setKycFile] = useState(null);
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
  const [solGroups, setSolGroups] = useState(initialSolGroups);
  const [joinedSolIds, setJoinedSolIds] = useState(['premium']);
  const [activeSolGroupId, setActiveSolGroupId] = useState(null);
  const [solSubView, setSolSubView] = useState('browse'); // 'browse' | 'mine' | 'detail'
  const [selectedSolMember, setSelectedSolMember] = useState(null);
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

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }

  async function loadWallet(authToken) {
    if (authToken === DEMO_TOKEN) return; // handled directly by enterDemoMode
    setLoadingWallet(true);
    try {
      const [{ balance: bal }, { transactions }] = await Promise.all([
        apiFetch('/wallet/balance', { token: authToken }),
        apiFetch('/wallet/transactions', { token: authToken }),
      ]);
      setBalance(bal);
      setTx(transactions.map((t) => ({
        id: t.id,
        method: methods.find((m) => m.id === t.method)?.name || t.method,
        amount: t.amount,
        status: t.status === 'confirmed' ? 'konfime' : t.status === 'rejected' ? 'rejte' : 'annatant',
        date: new Date(t.createdAt).toLocaleDateString('fr-FR'),
      })));
    } catch (err) {
      flash(err.message);
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
      setKycStatus('pa verifye'); // backend pa gen vre KYC ankò — kòmanse toujou pa verifye
      setBalance(newUser.balance);
      setView('dashboard');
      await loadWallet(newToken);
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

    if (flowKind === 'withdraw') {
      if (Number(amount) > balance) {
        flash('Ou pa gen ase lajan pou retrè sa a.');
        return;
      }
      setSelectedMethod(m);
      setProcessing(true);
      await new Promise((r) => setTimeout(r, 700));
      const fakeRef = 'RET-' + Math.floor(Math.random() * 90000 + 10000);
      setReference(fakeRef);
      setBalance((b) => b - Number(amount));
      setTx((t) => [{ id: 'wd-' + Date.now(), method: m.name, amount: Number(amount), ts: Date.now(), status: 'annatant', date: 'jodi a', type: 'retrè' }, ...t]);
      setProcessing(false);
      setView('confirm');
      return;
    }

    setSelectedMethod(m);
    setReference(null);
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
      flash(err.message);
    } finally {
      setProcessing(false);
    }
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
    await new Promise((r) => setTimeout(r, 700));
    setBalance((b) => b - Number(transferAmount));
    setTx((t) => [{
      id: 'tr-' + Date.now(),
      method: `Transfè bay ${transferId}`,
      amount: Number(transferAmount),
      ts: Date.now(), status: 'konfime',
      date: 'jodi a',
      type: 'transfè',
    }, ...t]);
    setTransferProcessing(false);
    flash('Transfè a fèt.');
    setTransferId('');
    setTransferAmount('');
    setView('dashboard');
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
    const id = 'p-' + Date.now();
    setPockets((ps) => [...ps, { id, name: newPocketName.trim(), balance: 0, target: newPocketTarget ? Number(newPocketTarget) : null }]);
    setNewPocketName('');
    setNewPocketTarget('');
    setShowNewPocket(false);
    flash('Pòch la kreye.');
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
    await new Promise((r) => setTimeout(r, 700));
    setBalance((b) => b - amt);
    setPockets((ps) => ps.map((p) => p.id === pocket.id ? { ...p, balance: p.balance + amt } : p));
    setTx((t) => [{ id: 'pk-' + Date.now(), method: `Epay nan ${pocket.name}`, amount: amt, ts: Date.now(), status: 'konfime', date: nowLabel(), type: 'transfè', pocketId: pocket.id, kind: 'epay' }, ...t]);
    setAddMoneyProcessing(false);
    setAddMoneyAmount('');
    setShowAddMoney(false);
    flash('Lajan an ajoute nan pòch la.');
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
    const gd = {
      id: 'gd-' + Date.now(),
      name: newGoalName.trim(),
      target: Number(newGoalTarget),
      current: 0,
      status: 'aktif',
    };
    setGoalDeposits((list) => [gd, ...list]);
    setNewGoalName('');
    setNewGoalTarget('');
    setView('termdepo');
    flash('Objektif kreye.');
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
    await new Promise((r) => setTimeout(r, 700));
    setBalance((b) => b - amt);
    const newCurrent = gd.current + amt;
    const reached = newCurrent >= gd.target;
    setGoalDeposits((list) => list.map((g) => g.id === gd.id
      ? { ...g, current: newCurrent, status: reached ? 'rive' : 'aktif' }
      : g));
    setTx((t) => [{
      id: 'gd-tx-' + Date.now(), method: `Depo Ak Objektif — ${gd.name}`, amount: amt,
      ts: Date.now(), status: 'konfime', date: nowLabel(), type: 'transfè',
    }, ...t]);
    setGoalProcessing(false);
    setAddGoalAmount('');
    flash(reached ? 'Objektif la atenn! Ou ka retire lajan an kounye a.' : 'Lajan an ajoute nan objektif la.');
  }

  async function withdrawGoal(id) {
    const gd = goalDeposits.find((g) => g.id === id);
    if (!gd || gd.status !== 'rive') return;
    setGoalProcessing(true);
    await new Promise((r) => setTimeout(r, 800));
    setBalance((b) => b + gd.current);
    setGoalDeposits((list) => list.filter((g) => g.id !== id));
    setTx((t) => [{
      id: 'gd-out-' + Date.now(), method: `Objektif fini — ${gd.name}`, amount: gd.current,
      ts: Date.now(), status: 'konfime', date: nowLabel(), type: 'depo',
    }, ...t]);
    setGoalProcessing(false);
    setView('termdepo');
    flash('Lajan an tounen nan kont prensipal ou.');
  }

  const EMERGENCY_FEE_RATE = 0.045;

  async function emergencyWithdrawGoal(id) {
    const gd = goalDeposits.find((g) => g.id === id);
    if (!gd || gd.current <= 0) return;
    const fee = Math.round(gd.current * EMERGENCY_FEE_RATE);
    const net = gd.current - fee;
    setGoalProcessing(true);
    await new Promise((r) => setTimeout(r, 800));
    setBalance((b) => b + net);
    setGoalDeposits((list) => list.filter((g) => g.id !== id));
    setTx((t) => [{
      id: 'gd-em-' + Date.now(), method: `Retrè ijans — ${gd.name} (frè 4.5%)`, amount: net,
      ts: Date.now(), status: 'konfime', date: nowLabel(), type: 'depo',
    }, ...t]);
    setGoalProcessing(false);
    setShowEmergency(false);
    setView('termdepo');
    flash(`Retrè ijans fèt — ${money(fee)} kenbe kòm frè.`);
  }

  async function requestLoan() {
    const amt = Number(newLoanAmount);
    if (!amt || amt <= 0) {
      flash('Antre yon montan valab.');
      return;
    }
    const plan = LOAN_PLANS[newLoanPlanIdx];
    setLoanProcessing(true);
    await new Promise((r) => setTimeout(r, 900));
    const totalDue = Math.round(amt * (1 + plan.rate));
    const installmentAmount = Math.round(totalDue / plan.months);
    const installments = Array.from({ length: plan.months }, (_, i) => ({
      n: i + 1,
      month: addMonths(CURRENT_CYCLE_MONTH, i + 1),
      amount: installmentAmount,
      ts: Date.now(), status: 'annatant',
    }));
    setLoan({
      id: 'ln-' + Date.now(),
      amount: amt,
      months: plan.months,
      rate: plan.rate,
      totalDue,
      installmentAmount,
      installments,
      ts: Date.now(), status: 'annatant',
    });
    setLoanProcessing(false);
    setNewLoanAmount('');
    setView('loan');
    flash('Demand prè a voye — n ap egzamine li.');
  }

  async function checkLoanStatus() {
    if (!loan || loan.status !== 'annatant') return;
    setCheckingLoan(true);
    await new Promise((r) => setTimeout(r, 1000));
    setCheckingLoan(false);
    setLoan((l) => ({ ...l, status: 'aktif' }));
    setBalance((b) => b + loan.amount);
    setTx((t) => [{
      id: 'ln-tx-' + Date.now(), method: 'Prè apwouve', amount: loan.amount,
      ts: Date.now(), status: 'konfime', date: nowLabel(), type: 'depo',
    }, ...t]);
    flash('Prè a apwouve — lajan an nan kont ou.');
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
    await new Promise((r) => setTimeout(r, 700));
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
      updated.status = updated.installments.every((i) => i.status === 'peye') ? 'fini' : 'aktif';
      return updated;
    });
    setLoanProcessing(false);
    flash(next.n === loan.months ? 'Prè a peye nèt!' : 'Vèsman anrejistre.');
  }

  async function confirmPocketAction() {
    const amt = Number(pocketAmount);
    const pocket = pockets.find((p) => p.id === activePocketId);
    if (!pocket) return;
    if (!amt || amt <= 0) {
      flash('Antre yon montan valab.');
      return;
    }

    if (pocketMode === 'deposit') {
      if (amt > balance) { flash('Ou pa gen ase nan kont prensipal la.'); return; }
      setPocketProcessing(true);
      await new Promise((r) => setTimeout(r, 700));
      setBalance((b) => b - amt);
      setPockets((ps) => ps.map((p) => p.id === activePocketId ? { ...p, balance: p.balance + amt } : p));
      setTx((t) => [{ id: 'pk-' + Date.now(), method: `Epay nan ${pocket.name}`, amount: amt, ts: Date.now(), status: 'konfime', date: nowLabel(), type: 'transfè', pocketId: pocket.id, kind: 'epay' }, ...t]);
      flash('Lajan an mete nan pòch la.');
    } else if (pocketMode === 'spend') {
      if (amt > pocket.balance) { flash('Pa gen ase lajan nan pòch sa a.'); return; }
      setPocketProcessing(true);
      await new Promise((r) => setTimeout(r, 700));
      setPockets((ps) => ps.map((p) => p.id === activePocketId ? { ...p, balance: p.balance - amt } : p));
      setTx((t) => [{ id: 'pk-' + Date.now(), method: `Retrè soti nan ${pocket.name}`, amount: amt, ts: Date.now(), status: 'konfime', date: nowLabel(), type: 'retrè', pocketId: pocket.id, kind: 'depanse' }, ...t]);
      flash('Depans anrejistre.');
    } else if (pocketMode === 'transfer') {
      if (amt > pocket.balance) { flash('Pa gen ase lajan nan pòch sa a.'); return; }
      setPocketProcessing(true);
      await new Promise((r) => setTimeout(r, 700));
      if (pocketTransferTarget === 'main') {
        setBalance((b) => b + amt);
        setPockets((ps) => ps.map((p) => p.id === activePocketId ? { ...p, balance: p.balance - amt } : p));
        setTx((t) => [{ id: 'pk-' + Date.now(), method: `Transfè soti nan ${pocket.name} bay Kont prensipal`, amount: amt, ts: Date.now(), status: 'konfime', date: nowLabel(), type: 'depo', pocketId: pocket.id, kind: 'transfè-soti' }, ...t]);
      } else {
        const destName = pockets.find((p) => p.id === pocketTransferTarget)?.name;
        setPockets((ps) => ps.map((p) => {
          if (p.id === activePocketId) return { ...p, balance: p.balance - amt };
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
    setPocketProcessing(false);
    setPocketMode(null);
    setPocketAmount('');
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

  async function submitKyc() {
    if (!kycFile) {
      flash('Ajoute yon foto dokiman ou anvan.');
      return;
    }
    if (!kycSelfieFile) {
      flash('Pran yon selfi anvan.');
      return;
    }
    setKycSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));
    setKycSubmitting(false);
    setKycStatus('annatant');
    setView('dashboard');
    flash('Dokiman ou voye — n ap verifye l.');
  }

  async function checkKycStatus() {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 900));
    setRefreshing(false);
    if (kycStatus === 'annatant') {
      setKycStatus('verifye');
      flash('Kont ou verifye kounye a.');
    } else {
      flash('Pa gen chanjman.');
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
      flash(err.message);
    } finally {
      setRefreshing(false);
    }
  }

  function joinSolGroup(gid) {
    const target = solGroups.find((g) => g.id === gid);
    if (target && target.members.length >= target.maxMembers) {
      flash('Sòl sa a konplè.');
      return;
    }
    if (!joinedSolIds.includes(gid)) {
      setSolGroups((gs) => gs.map((g) => g.id === gid
        ? { ...g, members: [...g.members, { id: 'me-' + Date.now(), name: user?.fullName || 'Ou' }] }
        : g));
      setJoinedSolIds((ids) => [...ids, gid]);
      flash('Ou antre nan sòl la.');
    }
    openSolDetail(gid);
  }

  function openSolDetail(gid) {
    setActiveSolGroupId(gid);
    setSelectedSolMember(null);
    setSolSubView('detail');
  }

  function openSolSection() {
    setSolSubView(joinedSolIds.length > 0 ? 'mine' : 'browse');
    setView('sol');
  }

  const userSolGroup = solGroups.find((g) => g.id === activeSolGroupId);

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
        <div className="fixed top-4 right-4 z-50 fadein px-4 py-3 rounded-xl text-sm flex items-center gap-2 shadow-lg"
          style={{ background: C.card, border: `1px solid ${C.border}`, color: C.ink }}>
          <Check size={16} color={C.mint} /> {toast}
        </div>
      )}

      <div className="max-w-md mx-auto min-h-full" style={{ background: C.bg }}>

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
              <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <Bell size={16} color={C.muted} />
              </button>
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
                <button onClick={() => setView('kyc')} className="text-xs font-semibold underline" style={{ color: C.navy }}>
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
                  <Users size={16} color={C.amber} />
                </div>
                <span className="text-xs font-semibold">{tr('tileSol')}</span>
              </button>
              <button onClick={() => setView('blicdepo')} className="bp-btn rounded-xl p-3 flex flex-col items-center gap-2 text-center"
                style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#E4F5EF' }}>
                  <PiggyBank size={16} color={C.mint} />
                </div>
                <span className="text-xs font-semibold">{tr('tileDepo')}</span>
              </button>
              <button onClick={() => setView('termdepo')} className="bp-btn rounded-xl p-3 flex flex-col items-center gap-2 text-center"
                style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#F4EBFF' }}>
                  <Lock size={16} color="#6D3FD1" />
                </div>
                <span className="text-xs font-semibold">{tr('tileGoal')}</span>
              </button>
              <button onClick={() => setView('loan')} className="bp-btn rounded-xl p-3 flex flex-col items-center gap-2 text-center"
                style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#E6F0FB' }}>
                  <HandCoins size={16} color={C.navy} />
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
                  <button onClick={() => setView('kyc')}
                    className="text-xs font-semibold px-3 py-2 rounded-lg shrink-0" style={{ background: '#946115', color: '#fff' }}>
                    Kòmanse
                  </button>
                )}
              </div>
            )}

            {/* promo banner */}
            <div className="mt-4 rounded-2xl p-5 relative overflow-hidden" style={{ background: C.navy }}>
              <ShieldCheck size={100} style={{ position: 'absolute', right: -14, bottom: -18, opacity: 0.14 }} color="#fff" />
              <p className="font-extrabold text-white" style={{ ...fontDisplay, fontSize: 17 }}>Envite yon zanmi, genyen</p>
              <p className="mt-1.5 text-sm max-w-[75%]" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Chak zanmi ki ouvri yon kont BLICPay ba w yon bonis sou pwochen depo w.
              </p>
              <button onClick={() => flash('Fonksyon envitasyon ap vini.')}
                className="bp-btn mt-3.5 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5"
                style={{ background: '#fff', color: C.navy }}>
                Wè plis <ChevronRight size={14} />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.border }} />
              <span className="w-4 h-1.5 rounded-full" style={{ background: C.navy }} />
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
                      <Badge tone={t.status === 'konfime' ? 'mint' : 'amber'}>
                        {t.status === 'konfime' ? 'Konfime' : 'Annatant'}
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
                if (solSubView === 'detail') setSolSubView(joinedSolIds.length > 0 ? 'mine' : 'browse');
                else if (solSubView === 'browse' && joinedSolIds.length > 0) setSolSubView('mine');
                else setView('dashboard');
              }}
              className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
              <ArrowLeft size={15} /> Retounen
            </button>

            {solSubView === 'mine' && (
              <>
                <div className="flex items-center justify-between">
                  <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>Sòl mwen yo</h2>
                  <button onClick={() => setSolSubView('browse')} className="text-xs font-semibold" style={{ color: C.navy }}>
                    + Antre nan yon lòt
                  </button>
                </div>
                <p className="mt-1.5 text-sm" style={{ color: C.muted }}>Ou fè pati {joinedSolIds.length} sòl.</p>
                <p className="mt-1 text-xs font-medium" style={{ color: isSolPaymentWindowOpen() ? C.mint : C.amber }}>
                  {isSolPaymentWindowOpen() ? 'Fenèt peman an louvri kounye a.' : 'Peman yo fèt ant 25 ak 28 chak mwa.'}
                </p>
                <div className="mt-5 space-y-3">
                  {solGroups.filter((g) => joinedSolIds.includes(g.id)).map((g) => {
                    const myIdx = g.members.findIndex((m) => m.name === user?.fullName);
                    return (
                      <button key={g.id} onClick={() => openSolDetail(g.id)}
                        className="bp-btn w-full p-4 rounded-xl text-left flex items-center justify-between"
                        style={{ background: C.card, border: `1px solid ${C.border}` }}>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm">{g.name}</h3>
                            <Badge tone={g.tier === 'Premium' ? 'premium' : g.tier === 'Standard' ? 'navy' : 'muted'}>{g.tier}</Badge>
                          </div>
                          <p className="mt-1 text-xs" style={{ color: C.muted }}>
                            {g.frequency} · {money(g.amount)}
                          </p>
                          {myIdx !== -1 && (
                            <p className="mt-1 text-xs font-semibold" style={{ color: C.navy }}>
                              Ou ap resevwa: {memberPayoutMonth(g, myIdx)}
                            </p>
                          )}
                        </div>
                        <ChevronRight size={16} color={C.muted} />
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {solSubView === 'browse' && (
              <>
                <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>BLIC Sòl</h2>
                <p className="mt-1.5 text-sm" style={{ color: C.muted }}>
                  {joinedSolIds.length > 0 ? 'Ou ka antre nan plizyè sòl an menm tan.' : 'Ou poko manm okenn sòl. Chwazi youn pou kòmanse.'}
                </p>
                <div className="mt-5 space-y-3">
                  {solGroups.map((g) => {
                    const spotsLeft = g.maxMembers - g.members.length;
                    const isFull = spotsLeft <= 0;
                    const alreadyIn = joinedSolIds.includes(g.id);
                    return (
                      <div key={g.id} className="p-4 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm">{g.name}</h3>
                            <Badge tone={g.tier === 'Premium' ? 'premium' : g.tier === 'Standard' ? 'navy' : 'muted'}>{g.tier}</Badge>
                          </div>
                          <Badge tone={isFull ? 'mint' : 'muted'}>{g.members.length}/{g.maxMembers}</Badge>
                        </div>
                        <p className="mt-1.5 text-xs" style={{ color: C.muted }}>{g.frequency} · {money(g.amount)} pa moun</p>
                        {!alreadyIn && (
                          <p className="mt-1 text-xs font-medium" style={{ color: isFull ? C.mint : C.amber }}>
                            {isFull ? 'Sòl la konplè — li ka demare' : `${spotsLeft} plas ki rete pou l demare`}
                          </p>
                        )}
                        {alreadyIn ? (
                          <button onClick={() => openSolDetail(g.id)}
                            className="bp-btn mt-3 w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5"
                            style={{ background: C.bg, color: C.navy, border: `1px solid ${C.border}` }}>
                            Deja manm — wè detay <ChevronRight size={14} />
                          </button>
                        ) : (
                          <button onClick={() => joinSolGroup(g.id)} disabled={isFull}
                            className="bp-btn mt-3 w-full py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-1.5"
                            style={{ background: isFull ? C.border : `linear-gradient(135deg, ${C.navy}, ${C.sky})`, color: isFull ? C.muted : '#fff', cursor: isFull ? 'not-allowed' : 'pointer' }}>
                            {isFull ? 'Pa gen plas ankò' : <>Antre nan sòl la <ChevronRight size={14} /></>}
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
                <p className="mt-1 text-sm" style={{ color: C.muted }}>Sikl {userSolGroup.cycle} · {userSolGroup.frequency}</p>

                <div className="mt-5 p-5 rounded-2xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                  <SolWheel group={userSolGroup} selected={selectedSolMember} onSelect={setSelectedSolMember} />
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: C.muted }}>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})` }} /> Kounye a
                    </span>
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: C.muted }}>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: C.mint }} /> Deja resevwa
                    </span>
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: C.muted }}>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ border: `1.5px solid ${C.border}` }} /> Poko rive
                    </span>
                  </div>
                  {selectedSolMember && (() => {
                    const idx = userSolGroup.members.findIndex((m) => m.id === selectedSolMember);
                    const isNow = idx === userSolGroup.currentTurn;
                    const hasReceived = idx < userSolGroup.currentTurn;
                    return (
                      <p className="text-center text-xs mt-3" style={{ color: C.muted }}>
                        <span style={{ color: C.ink, fontWeight: 600 }}>{userSolGroup.members[idx]?.name}</span>
                        {isNow
                          ? ' ap resevwa pòch la sikl sa a.'
                          : hasReceived
                            ? <> deja resevwa pòch li an <span style={{ color: C.mint, fontWeight: 600 }}>{memberPayoutMonth(userSolGroup, idx)}</span>.</>
                            : ` ap resevwa pòch li an ${memberPayoutMonth(userSolGroup, idx)}.`}
                      </p>
                    );
                  })()}
                </div>

                {(() => {
                  const myIdx = userSolGroup.members.findIndex((m) => m.name === user?.fullName);
                  if (myIdx === -1) return null;
                  return (
                    <div className="mt-4 p-4 rounded-xl flex items-center gap-3" style={{ background: '#E6F0FB', border: `1px solid #C7DEF5` }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: C.navy }}>
                        <Wallet size={17} color="#fff" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: C.navy }}>MWA OU AP RESEVWA MEN PAW LA</p>
                        <p className="text-sm font-bold mt-0.5" style={{ color: C.navy }}>{memberPayoutMonth(userSolGroup, myIdx)}</p>
                      </div>
                    </div>
                  );
                })()}

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                    <p className="text-xs" style={{ color: C.muted }}>Kotizasyon</p>
                    <p className="mt-1" style={{ ...fontMono, fontSize: 17, fontWeight: 600 }}>{money(userSolGroup.amount)}</p>
                  </div>
                  <div className="p-4 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                    <p className="text-xs" style={{ color: C.muted }}>Manm</p>
                    <p className="mt-1 text-sm font-semibold">
                      {userSolGroup.members.length}/{userSolGroup.maxMembers}
                      {userSolGroup.members.length < userSolGroup.maxMembers && (
                        <span className="font-normal" style={{ color: C.amber }}> · {userSolGroup.maxMembers - userSolGroup.members.length} plas rete</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <h3 className="font-semibold text-sm" style={{ color: C.muted }}>ISTWA PEMAN OU</h3>
                </div>
                <div className="mt-3 rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                  {(userSolGroup.myPayments || []).length === 0 ? (
                    <p className="text-sm p-4" style={{ color: C.muted, background: C.card }}>Ou poko fè okenn peman.</p>
                  ) : userSolGroup.myPayments.map((p, i) => (
                    <div key={p.month} className="flex items-center justify-between px-4 py-3"
                      style={{ background: C.card, borderTop: i ? `1px solid ${C.border}` : 'none' }}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ background: p.status === 'peye' ? '#E4F5EF' : p.status === 'annatant' ? '#FBF0DE' : '#FBEAEA' }}>
                          {p.status === 'peye'
                            ? <Check size={14} color={C.mint} />
                            : p.status === 'annatant'
                              ? <Clock size={14} color={C.amber} />
                              : <X size={14} color={C.danger} />}
                        </div>
                        <span className="text-sm font-medium">{p.month}</span>
                      </div>
                      <Badge tone={p.status === 'peye' ? 'mint' : p.status === 'annatant' ? 'amber' : 'danger'}>
                        {p.status === 'peye' ? 'Peye' : p.status === 'annatant' ? 'Annatant' : 'Manke'}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-start gap-2 text-xs p-3 rounded-lg"
                  style={{ background: isSolPaymentWindowOpen() ? '#E4F5EF' : '#FBF0DE', color: isSolPaymentWindowOpen() ? C.mint : '#946115' }}>
                  <Calendar size={15} className="shrink-0 mt-0.5" />
                  {isSolPaymentWindowOpen()
                    ? 'Fenèt peman an louvri kounye a — peye anvan 28 la.'
                    : 'Peman yo fèt sèlman ant 25 ak 28 chak mwa.'}
                </div>

                <button onClick={startDeposit}
                  className="bp-btn mt-3 w-full py-3.5 rounded-xl font-semibold text-white"
                  style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})` }}>
                  Peye
                </button>
              </>
            )}
          </div>
        )}

        {view === 'kyc' && (
          <div className="fadein px-5 pb-10 pt-2">
            <button onClick={() => setView('dashboard')} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
              <ArrowLeft size={15} /> Retounen
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})` }}>
                <ShieldCheck size={28} color="#fff" />
              </div>
              <h2 className="mt-3" style={{ ...fontDisplay, fontWeight: 800, fontSize: 20 }}>Verifye idantite ou</h2>
              <p className="mt-1.5 text-sm max-w-xs" style={{ color: C.muted }}>
                Nou bezwen konfime idantite ou anvan ou ka fè plis operasyon sou kont BLICPay ou.
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

            <p className="mt-6 text-xs font-semibold" style={{ color: C.muted }}>TIP DOKIMAN</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {['paspò', 'ID nasyonal', 'lisans chofè'].map((doc) => (
                <button key={doc} onClick={() => setKycDocType(doc)}
                  className="bp-btn py-2.5 rounded-lg text-xs font-semibold capitalize"
                  style={{
                    background: kycDocType === doc ? C.navy : C.card,
                    color: kycDocType === doc ? '#fff' : C.ink,
                    border: `1px solid ${kycDocType === doc ? C.navy : C.border}`,
                  }}>
                  {doc}
                </button>
              ))}
            </div>

            <p className="mt-5 text-xs font-semibold" style={{ color: C.muted }}>FOTO DOKIMAN AN</p>
            <label className="mt-2 flex flex-col items-center justify-center gap-2 rounded-xl cursor-pointer"
              style={{ background: C.card, border: `1.5px dashed ${C.border}`, padding: kycFile ? 0 : '32px 16px', overflow: 'hidden' }}>
              {kycFile ? (
                <img src={kycFile} alt="Dokiman" className="w-full max-h-48 object-cover" />
              ) : (
                <>
                  <Building2 size={22} color={C.muted} />
                  <span className="text-xs font-medium" style={{ color: C.muted }}>Tape pou ajoute yon foto</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setKycFile(URL.createObjectURL(file));
                }} />
            </label>

            <p className="mt-5 text-xs font-semibold" style={{ color: C.muted }}>SELFI</p>
            <p className="mt-0.5 text-xs" style={{ color: C.muted }}>
              Pran yon foto figi ou ki klè, san linèt solèy ni chapo, pou nou ka konpare l ak dokiman an.
            </p>
            <label className="mt-2 flex flex-col items-center justify-center gap-2 mx-auto cursor-pointer rounded-full"
              style={{
                background: C.card, border: `1.5px dashed ${C.border}`, overflow: 'hidden',
                width: 168, height: 168,
              }}>
              {kycSelfieFile ? (
                <img src={kycSelfieFile} alt="Selfi" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Camera size={24} color={C.muted} />
                  <span className="text-xs font-medium px-4 text-center" style={{ color: C.muted }}>Tape pou pran selfi</span>
                </>
              )}
              <input type="file" accept="image/*" capture="user" className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setKycSelfieFile(URL.createObjectURL(file));
                }} />
            </label>

            <button onClick={submitKyc} disabled={kycSubmitting}
              className="bp-btn mt-6 w-full py-3.5 rounded-xl font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, opacity: kycSubmitting ? 0.7 : 1 }}>
              {kycSubmitting ? 'Ap voye...' : 'Voye pou verifikasyon'}
            </button>
          </div>
        )}

        {view === 'blicdepo' && (
          <div className="fadein px-5 pb-10 pt-2">
            <button onClick={() => setView('dashboard')} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
              <ArrowLeft size={15} /> Retounen
            </button>
            <div className="flex items-center justify-between">
              <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>BLIC Depo</h2>
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
              <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>Depo Ak Objektif</h2>
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
            <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>Nouvo Objektif</h2>
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
              <>
                <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>Mande yon Prè</h2>
                <p className="mt-1.5 text-sm" style={{ color: C.muted }}>Chwazi konbyen tan pou peye prè a.</p>

                <p className="text-xs font-semibold mt-6 mb-2" style={{ color: C.muted }}>DIRE</p>
                <div className="grid grid-cols-3 gap-2">
                  {LOAN_PLANS.map((plan, i) => (
                    <button key={plan.months} onClick={() => setNewLoanPlanIdx(i)}
                      className="bp-btn py-3 rounded-lg text-center"
                      style={{
                        background: newLoanPlanIdx === i ? C.navy : C.card,
                        border: `1px solid ${newLoanPlanIdx === i ? C.navy : C.border}`,
                      }}>
                      <p className="text-sm font-bold" style={{ color: newLoanPlanIdx === i ? '#fff' : C.ink }}>{plan.months} mwa</p>
                      <p className="text-xs mt-0.5" style={{ color: newLoanPlanIdx === i ? 'rgba(255,255,255,0.8)' : C.muted }}>
                        {Math.round(plan.rate * 100)}%
                      </p>
                    </button>
                  ))}
                </div>

                <p className="text-xs font-semibold mt-6 mb-2" style={{ color: C.muted }}>MONTAN PRÈ A</p>
                <div className="relative">
                  <input value={newLoanAmount} onChange={(e) => setNewLoanAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="0.00" inputMode="decimal"
                    className="w-full pl-4 pr-16 py-3.5 rounded-xl text-lg font-semibold"
                    style={{ background: C.card, border: `1px solid ${C.border}`, ...fontMono }} />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-sm" style={{ color: C.muted }}>HTG</span>
                </div>

                {newLoanAmount && Number(newLoanAmount) > 0 && (() => {
                  const plan = LOAN_PLANS[newLoanPlanIdx];
                  const total = Math.round(Number(newLoanAmount) * (1 + plan.rate));
                  const inst = Math.round(total / plan.months);
                  return (
                    <div className="mt-4 p-4 rounded-xl" style={{ background: '#E6F0FB' }}>
                      <div className="flex items-center justify-between text-sm">
                        <span style={{ color: C.navy }}>Total pou peye</span>
                        <span style={{ ...fontMono, fontWeight: 700, color: C.navy }}>{money(total)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1.5">
                        <span style={{ color: C.navy }}>Vèsman chak mwa</span>
                        <span style={{ ...fontMono, fontWeight: 600, color: C.navy }}>{money(inst)}</span>
                      </div>
                    </div>
                  );
                })()}

                <div className="mt-4 flex items-start gap-2 text-xs p-3 rounded-lg" style={{ background: '#FBF0DE', color: '#946115' }}>
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  Demand lan ap egzamine anvan lajan an antre nan kont ou.
                </div>

                <button onClick={requestLoan} disabled={loanProcessing}
                  className="bp-btn mt-5 w-full py-3.5 rounded-xl font-semibold text-white"
                  style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, opacity: loanProcessing ? 0.7 : 1 }}>
                  {loanProcessing ? 'Ap voye...' : 'Mande prè a'}
                </button>
              </>
            )}

            {loan && loan.status === 'annatant' && (
              <>
                <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>Demand Prè</h2>
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
                    {loan.status === 'fini' ? 'Prè Peye' : 'Prè Aktif'}
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
              <button onClick={() => setView('kyc')}
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
              <span className="text-sm" style={{ ...fontMono, color: C.muted }}>v1.0.0 (Pwototip)</span>
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
            <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>Transfere lajan</h2>
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

        {view === 'deposit' && (
          <div className="fadein px-5 pb-10 pt-2">
            <button onClick={() => setView('dashboard')} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
              <ArrowLeft size={15} /> Retounen
            </button>
            <h2 style={{ ...fontDisplay, fontWeight: 800, fontSize: 22 }}>
              {flowKind === 'withdraw' ? 'Konbyen ou vle retire?' : 'Konbyen ou vle depoze?'}
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
                  <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: m.color }}>
                    <m.icon size={19} color="#fff" />
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

        {view === 'confirm' && selectedMethod && (
          <div className="fadein px-5 pb-10 pt-2">
            <button onClick={() => setView('deposit')} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
              <ArrowLeft size={15} /> Chanje metòd
            </button>

            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: selectedMethod.color }}>
                <selectedMethod.icon size={26} color="#fff" />
              </div>
              <h2 className="mt-4" style={{ ...fontDisplay, fontWeight: 800, fontSize: 20 }}>
                {flowKind === 'withdraw' ? `Retrè ${selectedMethod.name}` : `Depo ${selectedMethod.name}`}
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
          <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto flex items-center justify-between px-6 py-3"
            style={{ background: C.card, borderTop: `1px solid ${C.border}` }}>
            <button className="flex flex-col items-center gap-1" style={{ color: C.navy }}>
              <Home size={19} /><span className="text-[10px] font-medium">{tr('navHome')}</span>
            </button>
            <button onClick={() => setView('history')} className="flex flex-col items-center gap-1" style={{ color: C.muted }}>
              <Clock size={19} /><span className="text-[10px] font-medium">{tr('navHistory')}</span>
            </button>
            <button onClick={startDeposit} className="w-12 h-12 rounded-full flex items-center justify-center -mt-6"
              style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})` }}>
              <Plus size={22} color="#fff" />
            </button>
            <button onClick={() => setView('transfer')} className="flex flex-col items-center gap-1" style={{ color: C.muted }}>
              <ArrowLeftRight size={19} /><span className="text-[10px] font-medium">{tr('navTransfer')}</span>
            </button>
            <button onClick={() => setView('settings')} className="flex flex-col items-center gap-1" style={{ color: C.muted }}>
              <Settings size={19} /><span className="text-[10px] font-medium">{tr('navSettings')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
