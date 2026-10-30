// Paj akèy piblik BLICPay — konsantre sou: kont rechajab, transfè BLICPay → BLICPay,
// peman (QR), ak kat vityèl/fizik. (Sòl, prè ak epay yo retire nan BLICPay.)
import React, { useEffect, useState } from 'react';
import {
  ArrowRight, ArrowLeftRight, BadgeCheck, Building2, Check, ChevronDown, CreditCard, Globe, Lock, Menu,
  Phone, QrCode, ShieldCheck, Smartphone, Sparkles, Wallet, X, Fingerprint, Zap, ScanLine, Store,
} from 'lucide-react';

const C = {
  ink: '#0B1B33', muted: '#5D6B7E', border: '#E6EAF1', bg: '#F5F8FC',
  navy: '#143A73', navyDeep: '#0A1F45', sky: '#29B6E8', mint: '#1E9E7C', amber: '#D98B1D',
};
const display = { fontFamily: "'Manrope', sans-serif" };

// [kreyòl, français, english]
const D = {
  navFeatures: ['Sèvis', 'Services', 'Services'],
  navCard: ['Kat', 'Carte', 'Card'],
  navHow: ['Kijan l mache', 'Comment ça marche', 'How it works'],
  navBusiness: ['Antrepriz', 'Entreprises', 'Business'],
  navFaq: ['FAQ', 'FAQ', 'FAQ'],
  login: ['Konekte', 'Se connecter', 'Sign in'],
  signup: ['Kreye kont', 'Créer un compte', 'Create account'],
  badge: ['Kont dijital • Kat • Transfè', 'Compte numérique • Carte • Transferts', 'Digital account • Card • Transfers'],
  h1a: ['Lajan ou,', 'Votre argent,', 'Your money,'],
  h1b: ['toujou avè w.', 'toujours avec vous.', 'always with you.'],
  sub: ['Rechaje kont BLICPay ou ak MonCash, NatCash oswa nan biwo, voye lajan bay lòt kliyan BLICPay an segonn, epi peye ak kat ou.', 'Rechargez votre compte BLICPay par MonCash, NatCash ou en agence, envoyez de l’argent aux autres clients BLICPay en quelques secondes et payez avec votre carte.', 'Top up your BLICPay account with MonCash, NatCash or at a branch, send money to other BLICPay users in seconds, and pay with your card.'],
  start: ['Kòmanse gratis', 'Commencer gratuitement', 'Get started free'],
  trust1: ['Idantite verifye (KYC)', 'Identité vérifiée (KYC)', 'Verified identity (KYC)'],
  trust2: ['Kòd PIN sou chak operasyon', 'Code PIN à chaque opération', 'PIN on every operation'],
  trust3: ['Done chifre', 'Données chiffrées', 'Encrypted data'],
  heroBalance: ['Balans disponib', 'Solde disponible', 'Available balance'],
  heroReceived: ['Transfè resevwa', 'Transfert reçu', 'Transfer received'],
  soon: ['Byento', 'Bientôt', 'Coming soon'],

  featEyebrow: ['Sèvis yo', 'Nos services', 'What you get'],
  featTitle: ['Tout sa w bezwen pou peye, voye ak resevwa.', 'Tout pour payer, envoyer et recevoir.', 'Everything to pay, send and receive.'],
  featSub: ['Yon sèl kont, yon sèl aplikasyon — sou telefòn ak sou òdinatè.', 'Un seul compte, une seule application — sur téléphone et ordinateur.', 'One account, one app — on your phone and your computer.'],
  f1t: ['Rechaje kont ou', 'Rechargez votre compte', 'Top up your account'],
  f1d: ['MonCash, NatCash oswa kach nan youn nan biwo BLICPay yo.', 'MonCash, NatCash ou espèces dans une agence BLICPay.', 'MonCash, NatCash or cash at a BLICPay branch.'],
  f2t: ['Transfè BLICPay → BLICPay', 'Transferts BLICPay → BLICPay', 'BLICPay → BLICPay transfers'],
  f2d: ['Voye lajan bay nenpòt kliyan BLICPay ak ID li — imedyat e san frè.', 'Envoyez de l’argent à tout client BLICPay avec son ID — instantané et sans frais.', 'Send money to any BLICPay user with their ID — instant and free.'],
  f3t: ['Peye ak resevwa pa QR', 'Payez et encaissez par QR', 'Pay and get paid by QR'],
  f3d: ['Chak kont gen pwòp kòd QR li. Eskane, konfime ak PIN — fini.', 'Chaque compte a son propre QR code. Scannez, confirmez avec le PIN — c’est fait.', 'Every account has its own QR code. Scan, confirm with your PIN — done.'],
  f4t: ['Kat vityèl', 'Carte virtuelle', 'Virtual card'],
  f4d: ['Pou achte sou entènèt ak balans BLICPay ou.', 'Pour acheter en ligne avec votre solde BLICPay.', 'Shop online with your BLICPay balance.'],
  f5t: ['Kat fizik', 'Carte physique', 'Physical card'],
  f5d: ['Peye nan magazen ak menm kont lan.', 'Payez en magasin avec le même compte.', 'Pay in stores from the same account.'],
  f6t: ['Kont antrepriz', 'Comptes entreprise', 'Business accounts'],
  f6d: ['Resevwa peman kliyan, plafon pi wo ak yon tablo bò konplè.', 'Encaissez vos clients, plafonds plus élevés et tableau de bord complet.', 'Collect customer payments, higher limits and a full dashboard.'],

  cardEyebrow: ['Kat BLICPay', 'Carte BLICPay', 'BLICPay card'],
  cardTitle: ['Twa kat, yon sèl kont.', 'Trois cartes, un seul compte.', 'Three cards, one account.'],
  cardSub: ['Basic, Standard ak Premium — kat la itilize balans BLICPay ou dirèkteman. Ou rechaje, ou peye: pa gen kredi, pa gen sipriz.', 'Basic, Standard et Premium — la carte utilise directement votre solde BLICPay. Vous rechargez, vous payez : pas de crédit, pas de surprise.', 'Basic, Standard and Premium — the card spends your BLICPay balance directly. Top up, then pay: no credit, no surprises.'],
  card1: ['Kat vityèl lan disponib tousuit nan aplikasyon an', 'Carte virtuelle disponible immédiatement dans l’application', 'Virtual card available instantly in the app'],
  card2: ['Bloke / debloke kat ou nenpòt lè', 'Bloquez / débloquez votre carte à tout moment', 'Freeze / unfreeze your card anytime'],
  card3: ['Chak peman parèt an tan reyèl nan istorik ou', 'Chaque paiement apparaît en temps réel dans l’historique', 'Every payment shows up in real time in your history'],
  cardNote: ['Kat yo ap lanse byento ak yon bank patnè — enskri kounye a pou w pami premye yo.', 'Les cartes seront lancées prochainement avec une banque partenaire — inscrivez-vous pour être parmi les premiers.', 'Cards launch soon with a partner bank — sign up now to be among the first.'],

  howEyebrow: ['Kijan l mache', 'Comment ça marche', 'How it works'],
  howTitle: ['Twa etap pou kòmanse.', 'Trois étapes pour commencer.', 'Three steps to get started.'],
  s1t: ['Kreye kont ou', 'Créez votre compte', 'Create your account'],
  s1d: ['Nimewo telefòn ak yon modpas, epi verifye idantite w an kèk minit.', 'Numéro de téléphone et mot de passe, puis vérifiez votre identité en quelques minutes.', 'Phone number and a password, then verify your identity in minutes.'],
  s2t: ['Rechaje', 'Rechargez', 'Top up'],
  s2d: ['Ajoute lajan ak MonCash, NatCash oswa nan biwo.', 'Ajoutez de l’argent par MonCash, NatCash ou en agence.', 'Add money with MonCash, NatCash or at a branch.'],
  s3t: ['Peye ak voye', 'Payez et envoyez', 'Pay and send'],
  s3d: ['Transfere bay lòt kliyan, peye pa QR, epi byento ak kat ou.', 'Transférez à d’autres clients, payez par QR, et bientôt avec votre carte.', 'Transfer to other users, pay by QR, and soon with your card.'],
  methods: ['Fason pou rechaje', 'Moyens de recharge', 'Ways to top up'],
  branch: ['Biwo BLICPay', 'Agence BLICPay', 'BLICPay branch'],

  secEyebrow: ['Sekirite', 'Sécurité', 'Security'],
  secTitle: ['Konstwi pou pwoteje lajan ou.', 'Conçu pour protéger votre argent.', 'Built to protect your money.'],
  sec1t: ['Verifikasyon idantite', 'Vérification d’identité', 'Identity verification'],
  sec1d: ['Pyès idantite + selfi vivan ak patnè nou Didit, epi yon admin konfime.', 'Pièce d’identité + selfie en direct avec notre partenaire Didit, puis validation par un admin.', 'ID document + live selfie with our partner Didit, then admin approval.'],
  sec2t: ['PIN sou chak operasyon', 'PIN à chaque opération', 'PIN on every operation'],
  sec2d: ['Okenn transfè ni retrè san kòd PIN 4 chif ou.', 'Aucun transfert ni retrait sans votre code PIN à 4 chiffres.', 'No transfer or withdrawal without your 4-digit PIN.'],
  sec3t: ['Plafon ak siveyans', 'Plafonds et surveillance', 'Limits and monitoring'],
  sec3d: ['Plafon jounen/semèn/mwa ak verifikasyon manyèl sou retrè yo.', 'Plafonds journaliers/hebdomadaires/mensuels et contrôle manuel des retraits.', 'Daily/weekly/monthly limits and manual review of withdrawals.'],
  sec4t: ['Done chifre', 'Données chiffrées', 'Encrypted data'],
  sec4d: ['Modpas ak PIN chifre; nou pa janm vann done ou.', 'Mots de passe et PIN chiffrés ; nous ne vendons jamais vos données.', 'Passwords and PINs are encrypted; we never sell your data.'],

  bizEyebrow: ['Pou antrepriz', 'Pour les entreprises', 'For businesses'],
  bizTitle: ['Resevwa peman kliyan ou yo ak BLICPay.', 'Encaissez vos clients avec BLICPay.', 'Get paid by your customers with BLICPay.'],
  bizSub: ['Louvri yon kont antrepriz, voye dokiman legal ou yo, epi resevwa peman pa QR ak yon tablo bò pwofesyonèl.', 'Ouvrez un compte entreprise, envoyez vos documents légaux, puis encaissez par QR avec un tableau de bord professionnel.', 'Open a business account, upload your legal documents, then collect payments by QR with a professional dashboard.'],
  biz1: ['QR pou chak antrepriz', 'QR code par entreprise', 'A QR code for every business'],
  biz2: ['Plafon antrepriz pi wo', 'Plafonds entreprise plus élevés', 'Higher business limits'],
  biz3: ['Analiz ak ekspòtasyon CSV', 'Analyses et export CSV', 'Analytics and CSV export'],
  bizCta: ['Louvri yon kont antrepriz', 'Ouvrir un compte entreprise', 'Open a business account'],

  faqTitle: ['Kesyon moun poze', 'Questions fréquentes', 'Frequently asked questions'],
  q1: ['Kisa BLICPay ye?', 'Qu’est-ce que BLICPay ?', 'What is BLICPay?'],
  a1: ['BLICPay se yon kont dijital ou rechaje, ki pèmèt ou voye lajan bay lòt kliyan BLICPay, peye pa QR, epi byento peye ak yon kat vityèl oswa fizik.', 'BLICPay est un compte numérique rechargeable qui permet d’envoyer de l’argent aux autres clients BLICPay, de payer par QR et, bientôt, de payer avec une carte virtuelle ou physique.', 'BLICPay is a rechargeable digital account to send money to other BLICPay users, pay by QR and, soon, pay with a virtual or physical card.'],
  q2: ['Kijan pou m rechaje kont mwen?', 'Comment recharger mon compte ?', 'How do I top up my account?'],
  a2: ['Ak MonCash, NatCash, oswa an kach nan youn nan biwo BLICPay yo. Balans ou ajou depi depo a konfime.', 'Par MonCash, NatCash, ou en espèces dans une agence BLICPay. Votre solde est mis à jour dès que le dépôt est confirmé.', 'With MonCash, NatCash, or cash at a BLICPay branch. Your balance updates as soon as the deposit is confirmed.'],
  q3: ['Èske transfè ant kliyan BLICPay gen frè?', 'Les transferts entre clients BLICPay sont-ils payants ?', 'Are transfers between BLICPay users free?'],
  a3: ['Non. Transfè BLICPay → BLICPay yo gratis e imedyat. Retrè yo gen yon ti frè ki toujou afiche anvan ou konfime.', 'Non. Les transferts BLICPay → BLICPay sont gratuits et instantanés. Les retraits ont de petits frais, toujours affichés avant confirmation.', 'No. BLICPay → BLICPay transfers are free and instant. Withdrawals carry a small fee, always shown before you confirm.'],
  q4: ['Kilè kat yo ap disponib?', 'Quand les cartes seront-elles disponibles ?', 'When will the cards be available?'],
  a4: ['N ap lanse kat yo byento ak yon bank patnè. Kliyan ki gen yon kont verifye ap premye resevwa yo.', 'Les cartes seront lancées prochainement avec une banque partenaire. Les clients au compte vérifié les recevront en premier.', 'Cards launch soon with a partner bank. Customers with a verified account will get them first.'],
  q5: ['Èske lajan m an sekirite?', 'Mon argent est-il en sécurité ?', 'Is my money safe?'],
  a5: ['Chak kont verifye (KYC), chak operasyon mande PIN ou, epi retrè yo verifye pa ekip nou an anvan yo soti.', 'Chaque compte est vérifié (KYC), chaque opération demande votre PIN, et les retraits sont contrôlés par notre équipe.', 'Every account is verified (KYC), every operation requires your PIN, and withdrawals are reviewed by our team.'],

  ctaTitle: ['Kòmanse ak BLICPay jodi a.', 'Commencez avec BLICPay aujourd’hui.', 'Start with BLICPay today.'],
  ctaSub: ['Kreye kont ou an 2 minit — gratis.', 'Créez votre compte en 2 minutes — gratuit.', 'Create your account in 2 minutes — free.'],

  footDesc: ['Kont dijital, transfè ak kat pou Ayisyen.', 'Compte numérique, transferts et cartes pour les Haïtiens.', 'Digital account, transfers and cards for Haitians.'],
  footCompany: ['Konpayi', 'Entreprise', 'Company'],
  footLegal: ['Legal', 'Mentions légales', 'Legal'],
  about: ['Konsènan nou', 'À propos', 'About us'],
  support: ['Sipò', 'Support', 'Support'],
  terms: ['Kondisyon itilizasyon', 'Conditions d’utilisation', 'Terms of use'],
  privacy: ['Konfidansyalite', 'Confidentialité', 'Privacy'],
  rights: ['Tout dwa rezève.', 'Tous droits réservés.', 'All rights reserved.'],
  disclaimer: ['BLICPay LLC se yon platfòm finansye rekonèt e anrejistre nan Ministè Kòmès ak Endistri Ayiti. Kat yo ap emèt pa yon bank patnè lè yo disponib.', 'BLICPay LLC est une plateforme financière reconnue et enregistrée auprès du Ministère du Commerce et de l’Industrie d’Haïti. Les cartes seront émises par une banque partenaire lorsqu’elles seront disponibles.', 'BLICPay LLC is a financial platform recognized and registered with the Haitian Ministry of Commerce and Industry. Cards will be issued by a partner bank once available.'],
  aboutBody: ['BLICPay se yon platfòm fentèk ki fèt pou Ayisyen. Nou bay yon kont dijital ou ka rechaje fasilman, transfè imedyat ant kliyan BLICPay, peman pa QR pou moun ak antrepriz, epi byento kat vityèl ak fizik. Misyon nou: fè peman dijital vin senp, rapid e sekirize pou tout moun.', 'BLICPay est une plateforme fintech conçue pour les Haïtiens. Nous offrons un compte numérique facile à recharger, des transferts instantanés entre clients BLICPay, des paiements par QR pour particuliers et entreprises, et bientôt des cartes virtuelles et physiques. Notre mission : rendre le paiement numérique simple, rapide et sûr pour tous.', 'BLICPay is a fintech platform built for Haitians. We offer an easy-to-fund digital account, instant transfers between BLICPay users, QR payments for people and businesses, and soon virtual and physical cards. Our mission: make digital payments simple, fast and safe for everyone.'],
  supportBody: ['Ou gen yon kesyon oswa yon pwoblèm ak kont ou? Kontakte nou dirèkteman:', 'Une question ou un problème avec votre compte ? Contactez-nous directement :', 'A question or an issue with your account? Contact us directly:'],
  call: ['Rele nou', 'Appelez-nous', 'Call us'],
  whatsapp: ['Ekri nou sou WhatsApp', 'Écrivez-nous sur WhatsApp', 'Message us on WhatsApp'],
  termsBody: [
    '1. Akseptasyon\nAn kreye oswa itilize yon kont BLICPay, ou aksepte kondisyon sa yo.\n\n2. Kalifikasyon\nOu dwe gen omwen 18 an epi bay enfòmasyon egzat. Yon verifikasyon idantite (KYC) obligatwa pou sèten operasyon.\n\n3. Kont ou\nOu responsab konfidansyalite modpas ak kòd PIN ou. Kontakte nou imedyatman si ou sispèk yon aksè san otorizasyon.\n\n4. Rechaj, transfè ak retrè\nBalans ou se lajan ou rechaje. Transfè BLICPay → BLICPay yo gratis. Retrè yo gen frè ki toujou afiche anvan konfimasyon, epi yo sijè a plafon.\n\n5. Kat\nKat BLICPay yo ap emèt pa yon bank patnè, sijè a kondisyon pa l, lè yo disponib.\n\n6. Itilizasyon entèdi\nOkenn aktivite ilegal, fwod oswa blanchi lajan.\n\n7. Sispansyon\nBLICPay ka sispann oswa fèmen yon kont ki vyole kondisyon sa yo.\n\n8. Chanjman\nNou ka modifye kondisyon sa yo — n ap enfòme w de chanjman enpòtan.',
    '1. Acceptation\nEn créant ou en utilisant un compte BLICPay, vous acceptez ces conditions.\n\n2. Éligibilité\nVous devez avoir au moins 18 ans et fournir des informations exactes. Une vérification d’identité (KYC) est obligatoire pour certaines opérations.\n\n3. Votre compte\nVous êtes responsable de la confidentialité de votre mot de passe et de votre PIN. Contactez-nous immédiatement en cas d’accès non autorisé.\n\n4. Recharges, transferts et retraits\nVotre solde correspond à l’argent que vous avez rechargé. Les transferts BLICPay → BLICPay sont gratuits. Les retraits comportent des frais toujours affichés avant confirmation et sont soumis à des plafonds.\n\n5. Cartes\nLes cartes BLICPay seront émises par une banque partenaire, selon ses propres conditions, lorsqu’elles seront disponibles.\n\n6. Usages interdits\nAucune activité illégale, fraude ou blanchiment d’argent.\n\n7. Suspension\nBLICPay peut suspendre ou fermer un compte qui enfreint ces conditions.\n\n8. Modifications\nNous pouvons modifier ces conditions — vous serez informé des changements importants.',
    '1. Acceptance\nBy creating or using a BLICPay account, you accept these terms.\n\n2. Eligibility\nYou must be at least 18 and provide accurate information. Identity verification (KYC) is required for some operations.\n\n3. Your account\nYou are responsible for keeping your password and PIN confidential. Contact us immediately if you suspect unauthorized access.\n\n4. Top-ups, transfers and withdrawals\nYour balance is the money you have added. BLICPay → BLICPay transfers are free. Withdrawals carry fees always shown before you confirm and are subject to limits.\n\n5. Cards\nBLICPay cards will be issued by a partner bank, under its own terms, once available.\n\n6. Prohibited use\nNo illegal activity, fraud or money laundering.\n\n7. Suspension\nBLICPay may suspend or close an account that breaches these terms.\n\n8. Changes\nWe may update these terms — we will tell you about important changes.',
  ],
  privacyBody: [
    '1. Enfòmasyon nou kolekte\nNon, telefòn, adrès, dokiman idantite (pou KYC) ak istorik tranzaksyon ou.\n\n2. Poukisa\nPou jere kont ou, verifye idantite ou (obligasyon regilasyon), trete tranzaksyon ak ofri sipò.\n\n3. Pataj\nNou pa vann done ou. Nou ka pataje enfòmasyon ak patnè ki nesesè pou sèvis la (verifikasyon idantite, bank patnè pou kat yo) oswa ak otorite si lalwa mande sa.\n\n4. Sekirite\nModpas ak PIN chifre; aksè entèn limite.\n\n5. Konsèvasyon\nNou kenbe done ou pandan kont ou aktif epi pou peryòd lalwa mande apre fèmti.\n\n6. Dwa ou\nOu ka mande wè, korije oswa efase done ou — kontakte sipò.',
    '1. Données collectées\nNom, téléphone, adresse, pièces d’identité (pour le KYC) et historique de vos transactions.\n\n2. Finalités\nGérer votre compte, vérifier votre identité (obligation réglementaire), traiter les transactions et offrir un support.\n\n3. Partage\nNous ne vendons pas vos données. Nous pouvons les partager avec les partenaires nécessaires au service (vérification d’identité, banque partenaire des cartes) ou avec les autorités si la loi l’exige.\n\n4. Sécurité\nMots de passe et PIN chiffrés ; accès interne limité.\n\n5. Conservation\nNous conservons vos données tant que votre compte est actif, puis pendant la durée exigée par la loi.\n\n6. Vos droits\nVous pouvez demander l’accès, la correction ou la suppression de vos données — contactez le support.',
    '1. Data we collect\nName, phone, address, identity documents (for KYC) and your transaction history.\n\n2. Why\nTo run your account, verify your identity (a regulatory requirement), process transactions and provide support.\n\n3. Sharing\nWe do not sell your data. We may share it with partners needed to provide the service (identity verification, the card-issuing partner bank) or with authorities where the law requires.\n\n4. Security\nPasswords and PINs are encrypted; internal access is limited.\n\n5. Retention\nWe keep your data while your account is active and for the period required by law afterwards.\n\n6. Your rights\nYou can ask to access, correct or delete your data — contact support.',
  ],
};

const IDX = { ht: 0, fr: 1, en: 2 };
const LANGS = [['ht', 'Kreyòl', '🇭🇹'], ['fr', 'Français', '🇫🇷'], ['en', 'English', '🇺🇸']];

function Logo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs><linearGradient id="lpl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#29B6E8" /><stop offset="1" stopColor="#143A73" /></linearGradient></defs>
      <path d="M24 3 L42 10 V22 C42 33 34.5 41.5 24 45 C13.5 41.5 6 33 6 22 V10 Z" fill="url(#lpl)" />
      <path d="M16 25 l6 6 l11 -12" stroke="#fff" strokeWidth="4.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Reveal({ children, delay = 0, className = '' }) {
  const ref = React.useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setOn(true); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{ opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(18px)', transition: `opacity .7s ease ${delay}ms, transform .7s cubic-bezier(.16,1,.3,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

function CardImg({ src, style, className = '' }) {
  return (
    <div className={`absolute rounded-2xl overflow-hidden ${className}`} style={{ aspectRatio: '1.586', backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center', boxShadow: '0 30px 60px -20px rgba(10,31,69,.55)', ...style }}>
    </div>
  );
}

export default function Landing({ onStart, lang, setLang }) {
  const i = IDX[lang] ?? 0;
  const t = (k) => (Array.isArray(D[k]) ? D[k][i] : k);
  const [menu, setMenu] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [faq, setFaq] = useState(0);
  const [modal, setModal] = useState(null);

  const FEATURES = [
    [Wallet, 'f1', '#E6F6FD', C.sky],
    [ArrowLeftRight, 'f2', '#E6F0FB', C.navy],
    [QrCode, 'f3', '#E4F5EF', C.mint],
    [CreditCard, 'f4', '#EEF0FF', '#4F46E5', true],
    [CreditCard, 'f5', '#F1F2F4', '#111827', true],
    [Store, 'f6', '#FDF3E3', C.amber],
  ];
  const NAV = [['services', 'navFeatures'], ['card', 'navCard'], ['how', 'navHow'], ['business', 'navBusiness'], ['faq', 'navFaq']];
  const go = (id) => { setMenu(false); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };

  return (
    <div style={{ background: '#fff', color: C.ink, overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=Inter:wght@400;500;600&display=swap');
        html { scroll-behavior: smooth; }
        .lp2-btn { transition: transform .18s ease, box-shadow .18s ease, filter .18s ease; }
        .lp2-btn:hover { transform: translateY(-2px); filter: brightness(1.05); }
        .lp2-card { transition: transform .25s ease, box-shadow .25s ease; }
        .lp2-card:hover { transform: translateY(-4px); box-shadow: 0 18px 40px -18px rgba(11,27,51,.25); }
        @keyframes lp2Float { 0%,100% { transform: translateY(0) rotate(var(--r)); } 50% { transform: translateY(-12px) rotate(var(--r)); } }
        .lp2-float { animation: lp2Float 7s ease-in-out infinite; }
        .lp2-grid { background-image: radial-gradient(rgba(20,58,115,.08) 1px, transparent 1px); background-size: 22px 22px; }
      `}</style>

      {/* NAV */}
      <header className="sticky top-0 z-40 border-b" style={{ background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(12px)', borderColor: C.border }}>
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center gap-6">
          <a href="#top" className="flex items-center gap-2 shrink-0" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <img src="/brand/logo-full.png" alt="BLICPay" style={{ height: 42, width: 'auto' }} />
          </a>
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium" style={{ color: C.muted }}>
            {NAV.map(([id, k]) => <button key={id} onClick={() => go(id)} className="hover:text-[#0B1B33]">{t(k)}</button>)}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setLangOpen((v) => !v)} className="h-10 px-3 rounded-full border flex items-center gap-1.5 text-sm font-semibold" style={{ borderColor: C.border }} aria-label="Language">
                <Globe size={16} /><span className="uppercase">{lang}</span>
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-2xl border bg-white shadow-xl p-1.5 z-50" style={{ borderColor: C.border }}>
                  {LANGS.map(([code, label, flag]) => (
                    <button key={code} onClick={() => { setLang(code); setLangOpen(false); }} className="w-full text-left px-3 py-2 rounded-xl text-sm flex items-center gap-2" style={lang === code ? { background: '#E6F6FD', color: C.navy, fontWeight: 600 } : {}}>
                      <span>{flag}</span>{label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={onStart} className="hidden sm:block h-10 px-4 rounded-full text-sm font-semibold" style={{ color: C.navy }}>{t('login')}</button>
            <button onClick={onStart} className="lp2-btn h-10 px-5 rounded-full text-sm font-bold text-white" style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})` }}>{t('signup')}</button>
            <button onClick={() => setMenu((v) => !v)} className="lg:hidden w-10 h-10 rounded-full border flex items-center justify-center" style={{ borderColor: C.border }} aria-label="Menu">
              {menu ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {menu && (
          <div className="lg:hidden border-t px-5 py-3 flex flex-col" style={{ borderColor: C.border }}>
            {NAV.map(([id, k]) => <button key={id} onClick={() => go(id)} className="text-left py-2.5 font-medium">{t(k)}</button>)}
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="top" className="relative">
        <div className="absolute inset-0 lp2-grid" style={{ maskImage: 'linear-gradient(180deg, #000 30%, transparent)' }} />
        <div className="absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(41,182,232,.22), transparent 65%)' }} />
        <div className="relative max-w-6xl mx-auto px-5 pt-14 pb-20 lg:pt-20 lg:pb-28 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border" style={{ borderColor: '#CDE8F8', background: '#F0F9FE', color: C.navy }}>
                <Sparkles size={14} color={C.sky} />{t('badge')}
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-5 text-[40px] leading-[1.05] sm:text-[56px] tracking-tight" style={{ ...display, fontWeight: 800 }}>
                {t('h1a')}<br />
                <span style={{ background: `linear-gradient(90deg, ${C.navy}, ${C.sky})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{t('h1b')}</span>
              </h1>
            </Reveal>
            <Reveal delay={160}><p className="mt-5 text-lg leading-relaxed max-w-xl" style={{ color: C.muted }}>{t('sub')}</p></Reveal>
            <Reveal delay={240}>
              <div className="mt-8 flex flex-wrap gap-3">
                <button onClick={onStart} className="lp2-btn h-12 px-6 rounded-full font-bold text-white flex items-center gap-2" style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, boxShadow: '0 12px 30px -10px rgba(20,58,115,.6)' }}>
                  {t('start')}<ArrowRight size={18} />
                </button>
                <button onClick={onStart} className="lp2-btn h-12 px-6 rounded-full font-semibold border" style={{ borderColor: C.border }}>{t('login')}</button>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm" style={{ color: C.muted }}>
                {[[BadgeCheck, 'trust1'], [Lock, 'trust2'], [ShieldCheck, 'trust3']].map(([Icon, k]) => (
                  <span key={k} className="inline-flex items-center gap-1.5"><Icon size={16} color={C.mint} />{t(k)}</span>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Vizyèl kat */}
          <Reveal delay={200} className="relative h-[360px] sm:h-[420px]">
            <CardImg src="/cards/card-world.jpg" name="Standard" className="lp2-float w-[62%] left-[2%] top-[8%]" style={{ '--r': '-12deg', transform: 'rotate(-12deg)' }} />
            <CardImg src="/cards/card-ocean.jpg" name="Basic" className="lp2-float w-[62%] right-[2%] top-[2%]" style={{ '--r': '9deg', transform: 'rotate(9deg)', animationDelay: '1.2s' }} />
            <CardImg src="/cards/card-shield.jpg" name="Premium" className="lp2-float w-[70%] left-[15%] top-[30%]" style={{ '--r': '-2deg', transform: 'rotate(-2deg)', animationDelay: '.6s' }} />
            <div className="absolute left-0 bottom-2 sm:bottom-6 rounded-2xl bg-white border px-4 py-3 shadow-xl flex items-center gap-3" style={{ borderColor: C.border }}>
              <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#E4F5EF' }}><ArrowLeftRight size={18} color={C.mint} /></span>
              <div>
                <p className="text-[11px]" style={{ color: C.muted }}>{t('heroReceived')}</p>
                <p className="text-sm font-bold" style={{ color: C.mint }}>+ 2 500 HTG</p>
              </div>
            </div>
            <div className="absolute right-0 bottom-10 sm:bottom-16 rounded-2xl px-4 py-3 shadow-xl text-white" style={{ background: C.navyDeep }}>
              <p className="text-[11px] opacity-70">{t('heroBalance')}</p>
              <p className="text-lg font-bold" style={display}>48 750 <span className="text-xs opacity-70">HTG</span></p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* SÈVIS */}
      <section id="services" className="py-20 lg:py-28" style={{ background: C.bg }}>
        <div className="max-w-6xl mx-auto px-5">
          <Reveal>
            <p className="text-sm font-bold uppercase tracking-widest" style={{ color: C.sky }}>{t('featEyebrow')}</p>
            <h2 className="mt-3 text-3xl sm:text-[42px] leading-tight max-w-2xl tracking-tight" style={{ ...display, fontWeight: 800 }}>{t('featTitle')}</h2>
            <p className="mt-3 text-lg" style={{ color: C.muted }}>{t('featSub')}</p>
          </Reveal>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(([Icon, k, bg, fg, soon], n) => (
              <Reveal key={k} delay={n * 70}>
                <div className="lp2-card h-full rounded-3xl bg-white border p-6" style={{ borderColor: C.border }}>
                  <div className="flex items-start justify-between">
                    <span className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: bg }}><Icon size={22} color={fg} /></span>
                    {soon && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: '#FDF3E3', color: C.amber }}>{t('soon')}</span>}
                  </div>
                  <h3 className="mt-5 text-lg font-bold" style={display}>{t(`${k}t`)}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: C.muted }}>{t(`${k}d`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* KAT */}
      <section id="card" className="py-20 lg:py-28 relative overflow-hidden" style={{ background: `linear-gradient(160deg, ${C.navyDeep} 0%, #0E2E66 60%, #154C9C 100%)`, color: '#fff' }}>
        <div className="absolute -left-40 -bottom-40 w-[480px] h-[480px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(41,182,232,.25), transparent 65%)' }} />
        <div className="relative max-w-6xl mx-auto px-5 grid lg:grid-cols-2 gap-14 items-center">
          <Reveal>
            <p className="text-sm font-bold uppercase tracking-widest" style={{ color: '#7DE3FF' }}>{t('cardEyebrow')}</p>
            <h2 className="mt-3 text-3xl sm:text-[42px] leading-tight tracking-tight" style={{ ...display, fontWeight: 800 }}>{t('cardTitle')}</h2>
            <p className="mt-4 text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,.75)' }}>{t('cardSub')}</p>
            <ul className="mt-7 space-y-3.5">
              {['card1', 'card2', 'card3'].map((k) => (
                <li key={k} className="flex items-start gap-3">
                  <span className="mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(41,182,232,.25)' }}><Check size={14} color="#7DE3FF" /></span>
                  <span style={{ color: 'rgba(255,255,255,.9)' }}>{t(k)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-7 text-sm inline-flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)' }}>
              <Sparkles size={15} color="#F5C04A" />{t('cardNote')}
            </p>
          </Reveal>
          <Reveal delay={150}>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-5 max-w-md mx-auto">
              {[['/cards/card-ocean.jpg', 'Basic'], ['/cards/card-world.jpg', 'Standard'], ['/cards/card-shield.jpg', 'Premium']].map(([src, name], n) => (
                <div key={name} className="relative" style={{ marginLeft: `${n * 6}%` }}>
                  <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: '1.586', backgroundImage: `url(${src})`, backgroundSize: 'cover', boxShadow: '0 24px 50px -20px rgba(0,0,0,.6)' }}>
                    <span className="absolute top-3 right-3 text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,0,0,.35)', color: '#fff' }}>{name}</span>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* KIJAN L MACHE */}
      <section id="how" className="py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-5">
          <Reveal className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest" style={{ color: C.sky }}>{t('howEyebrow')}</p>
            <h2 className="mt-3 text-3xl sm:text-[42px] tracking-tight" style={{ ...display, fontWeight: 800 }}>{t('howTitle')}</h2>
          </Reveal>
          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {[[Fingerprint, 's1'], [Wallet, 's2'], [Zap, 's3']].map(([Icon, k], n) => (
              <Reveal key={k} delay={n * 100}>
                <div className="relative rounded-3xl border p-7 h-full" style={{ borderColor: C.border }}>
                  <span className="absolute -top-4 left-7 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})` }}>{n + 1}</span>
                  <Icon size={26} color={C.navy} className="mt-2" />
                  <h3 className="mt-4 text-lg font-bold" style={display}>{t(`${k}t`)}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: C.muted }}>{t(`${k}d`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={200}>
            <div className="mt-12 rounded-3xl border p-6 flex flex-col md:flex-row md:items-center gap-5" style={{ borderColor: C.border, background: C.bg }}>
              <p className="text-sm font-bold uppercase tracking-widest shrink-0" style={{ color: C.muted }}>{t('methods')}</p>
              <div className="flex flex-wrap gap-3">
                {[['/logos/moncash-wide.png', 'MonCash'], ['/logos/natcash-wide.png', 'NatCash']].map(([src, name]) => (
                  <span key={name} className="h-11 px-4 rounded-xl bg-white border flex items-center" style={{ borderColor: C.border }}><img src={src} alt={name} className="h-6 w-auto" /></span>
                ))}
                <span className="h-11 px-4 rounded-xl bg-white border flex items-center gap-2 text-sm font-semibold" style={{ borderColor: C.border }}><Building2 size={18} color={C.amber} />{t('branch')}</span>
                {[['Unibank', '/logos/unibank-icon.png'], ['Sogebank', '/logos/sogebank-icon.png']].map(([bank, logo]) => (
                  <span key={bank} className="h-11 pl-1.5 pr-3 rounded-xl bg-white border flex items-center gap-2 text-sm" style={{ borderColor: C.border }}>
                    <img src={logo} alt={bank} className="h-8 w-8 rounded-lg" /><span className="font-semibold">{bank}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#FDF3E3', color: C.amber }}>{t('soon')}</span>
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* SEKIRITE */}
      <section className="py-20 lg:py-28" style={{ background: C.bg }}>
        <div className="max-w-6xl mx-auto px-5 grid lg:grid-cols-[1fr_1.4fr] gap-12 items-start">
          <Reveal>
            <p className="text-sm font-bold uppercase tracking-widest" style={{ color: C.sky }}>{t('secEyebrow')}</p>
            <h2 className="mt-3 text-3xl sm:text-[42px] leading-tight tracking-tight" style={{ ...display, fontWeight: 800 }}>{t('secTitle')}</h2>
            <div className="mt-8 w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`, boxShadow: '0 20px 40px -16px rgba(20,58,115,.6)' }}>
              <ShieldCheck size={38} color="#fff" />
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 gap-5">
            {[[ScanLine, 'sec1'], [Lock, 'sec2'], [BadgeCheck, 'sec3'], [ShieldCheck, 'sec4']].map(([Icon, k], n) => (
              <Reveal key={k} delay={n * 80}>
                <div className="lp2-card rounded-3xl bg-white border p-6 h-full" style={{ borderColor: C.border }}>
                  <Icon size={24} color={C.navy} />
                  <h3 className="mt-4 font-bold" style={display}>{t(`${k}t`)}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed" style={{ color: C.muted }}>{t(`${k}d`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ANTREPRIZ */}
      <section id="business" className="py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-5">
          <Reveal>
            <div className="rounded-[32px] p-8 sm:p-12 grid lg:grid-cols-2 gap-10 items-center border" style={{ borderColor: C.border, background: 'linear-gradient(135deg, #FFFFFF 0%, #EEF6FD 100%)' }}>
              <div>
                <p className="text-sm font-bold uppercase tracking-widest" style={{ color: C.amber }}>{t('bizEyebrow')}</p>
                <h2 className="mt-3 text-3xl sm:text-4xl leading-tight tracking-tight" style={{ ...display, fontWeight: 800 }}>{t('bizTitle')}</h2>
                <p className="mt-4 leading-relaxed" style={{ color: C.muted }}>{t('bizSub')}</p>
                <button onClick={onStart} className="lp2-btn mt-7 h-12 px-6 rounded-full font-bold text-white inline-flex items-center gap-2" style={{ background: C.navy }}>
                  {t('bizCta')}<ArrowRight size={18} />
                </button>
              </div>
              <div className="space-y-3">
                {[[QrCode, 'biz1'], [Zap, 'biz2'], [Smartphone, 'biz3']].map(([Icon, k]) => (
                  <div key={k} className="flex items-center gap-4 rounded-2xl bg-white border p-4" style={{ borderColor: C.border }}>
                    <span className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#FDF3E3' }}><Icon size={20} color={C.amber} /></span>
                    <span className="font-semibold">{t(k)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 lg:py-24" style={{ background: C.bg }}>
        <div className="max-w-3xl mx-auto px-5">
          <Reveal className="text-center"><h2 className="text-3xl sm:text-4xl tracking-tight" style={{ ...display, fontWeight: 800 }}>{t('faqTitle')}</h2></Reveal>
          <div className="mt-10 space-y-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="rounded-2xl bg-white border" style={{ borderColor: C.border }}>
                <button onClick={() => setFaq(faq === n ? 0 : n)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-semibold">
                  {t(`q${n}`)}
                  <ChevronDown size={18} style={{ transform: faq === n ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                </button>
                {faq === n && <p className="px-5 pb-5 text-sm leading-relaxed" style={{ color: C.muted }}>{t(`a${n}`)}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-5">
          <Reveal>
            <div className="rounded-[32px] px-8 py-14 text-center text-white relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.sky})` }}>
              <div className="absolute inset-0 opacity-20 lp2-grid" />
              <h2 className="relative text-3xl sm:text-4xl tracking-tight" style={{ ...display, fontWeight: 800 }}>{t('ctaTitle')}</h2>
              <p className="relative mt-3 opacity-85">{t('ctaSub')}</p>
              <button onClick={onStart} className="lp2-btn relative mt-8 h-12 px-7 rounded-full font-bold inline-flex items-center gap-2" style={{ background: '#fff', color: C.navy }}>
                {t('signup')}<ArrowRight size={18} />
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t" style={{ borderColor: C.border }}>
        <div className="max-w-6xl mx-auto px-5 py-12 grid sm:grid-cols-3 gap-8">
          <div>
            <img src="/brand/logo-full.png" alt="BLICPay" style={{ height: 46, width: 'auto' }} />
            <p className="mt-3 text-sm" style={{ color: C.muted }}>{t('footDesc')}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: C.muted }}>{t('footCompany')}</p>
            <div className="mt-3 flex flex-col gap-2 text-sm items-start">
              <button onClick={() => setModal('about')}>{t('about')}</button>
              <button onClick={() => setModal('support')}>{t('support')}</button>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: C.muted }}>{t('footLegal')}</p>
            <div className="mt-3 flex flex-col gap-2 text-sm items-start">
              <button onClick={() => setModal('terms')}>{t('terms')}</button>
              <button onClick={() => setModal('privacy')}>{t('privacy')}</button>
            </div>
          </div>
        </div>
        <div className="border-t" style={{ borderColor: C.border }}>
          <div className="max-w-6xl mx-auto px-5 py-6 text-xs leading-relaxed" style={{ color: C.muted }}>
            <p>{t('disclaimer')}</p>
            <p className="mt-2">© {new Date().getFullYear()} BLICPay LLC. {t('rights')}</p>
          </div>
        </div>
      </footer>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6" style={{ background: 'rgba(11,27,51,.5)' }} onClick={() => setModal(null)}>
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={display}>{t(modal === 'about' ? 'about' : modal === 'support' ? 'support' : modal)}</h3>
              <button onClick={() => setModal(null)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: C.bg }} aria-label="Close"><X size={17} /></button>
            </div>
            {modal === 'about' && <p className="text-sm leading-relaxed">{t('aboutBody')}</p>}
            {modal === 'support' && (
              <div className="flex flex-col gap-2.5">
                <p className="text-sm" style={{ color: C.muted }}>{t('supportBody')}</p>
                <a href="tel:+13073460474" className="flex items-center gap-3 rounded-xl border p-3.5" style={{ borderColor: C.border }}><Phone size={18} color={C.navy} /><span className="text-sm font-semibold">{t('call')} · +1 307 346 0474</span></a>
                <a href="https://wa.me/13073460474" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border p-3.5" style={{ borderColor: C.border }}><Smartphone size={18} color={C.mint} /><span className="text-sm font-semibold">{t('whatsapp')}</span></a>
              </div>
            )}
            {modal === 'terms' && <p className="text-sm leading-relaxed whitespace-pre-line">{t('termsBody')}</p>}
            {modal === 'privacy' && <p className="text-sm leading-relaxed whitespace-pre-line">{t('privacyBody')}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
