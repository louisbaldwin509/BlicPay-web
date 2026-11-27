// Paj akèy piblik BLICPay — konsantre sou: kont rechajab, transfè BLICPay → BLICPay,
// peman (QR), ak kat vityèl/fizik. (Sòl, prè ak epay yo retire nan BLICPay.)
import React, { useEffect, useState } from 'react';
import {
  ArrowRight, ArrowLeftRight, BadgeCheck, Building2, Check, ChevronDown, CreditCard, Globe, Lock, Menu,
  Phone, QrCode, ShieldCheck, Smartphone, Sparkles, Wallet, X, Fingerprint, Zap, ScanLine, Store,
  Briefcase, UserRound, ChevronRight, ArrowDownLeft, ArrowUpRight, Bell, Home, Clock, Banknote, LayoutGrid, Plus, Eye } from 'lucide-react';
// Paj sit la ak adrès yo
const PAGE_PATH = { home: '/', plans: '/comptes', card: '/carte', business: '/entreprises', security: '/securite', help: '/aide', about: '/a-propos', terms: '/conditions', privacy: '/confidentialite' };
const PATH_PAGE = Object.fromEntries(Object.entries(PAGE_PATH).map(([k, v]) => [v, k]));
// Ikòn plan yo (Personnel / Pro / Entreprise)
const PLAN_ICON = { personal: UserRound, pro: Store, business: Building2 };
const PLAN_GRAD = {
  personal: 'linear-gradient(135deg, #3CC4F0 0%, #1B78D6 100%)',
  pro: 'linear-gradient(135deg, #FFC85A 0%, #E8901C 100%)',
  business: 'linear-gradient(135deg, #2557A8 0%, #0A1F45 100%)',
};
const PLAN_SHADOW = {
  personal: '0 10px 22px -10px rgba(27,120,214,.7)',
  pro: '0 10px 22px -10px rgba(232,144,28,.8)',
  business: '0 10px 22px -10px rgba(10,31,69,.7)',
};

const C = {
  ink: '#0B1B33', muted: '#5D6B7E', border: '#E6EAF1', bg: '#F5F8FC',
  navy: '#143A73', navyDeep: '#0A1F45', night: '#06122B', sky: '#0891B2', cyan: '#22D3EE', mint: '#0E9F8A', amber: '#0891B2',
};
const display = { fontFamily: "'Manrope', sans-serif" };

// [kreyòl, français, english]
const D = {
  hpHi: ['Bonjou Isabelle', 'Bonjour Isabelle', 'Hello Isabelle'],
  hpTagline: ['Lajan w, an sekirite, toupatou.', 'Votre argent, en sécurité, partout.', 'Your money, safe, everywhere.'],
  hpWithdraw: ['Retrè', 'Retrait', 'Withdraw'],
  hpMore: ['Plis', 'Plus', 'More'],
  hpCardTitle: ['Kat vityèl BLICPay', 'Carte virtuelle BLICPay', 'BLICPay virtual card'],
  hpCardSoon: ['Byento disponib — peye an liy ak balans ou.', 'Bientôt disponible — payez en ligne avec votre solde.', 'Coming soon — pay online with your balance.'],
  hpSee: ['Wè', 'Voir', 'See'],
  hpHello: ['Bonjou 👋', 'Bonjour 👋', 'Hello 👋'],
  hpDeposit: ['Depoze', 'Déposer', 'Deposit'],
  hpSend: ['Voye', 'Envoyer', 'Send'],
  hpPay: ['Peye', 'Payer', 'Pay'],
  hpReceive: ['Resevwa', 'Recevoir', 'Receive'],
  hpRecent: ['Dènye tranzaksyon', 'Dernières transactions', 'Recent transactions'],
  hpAll: ['Wè tout', 'Tout voir', 'See all'],
  hpTx1: ['Rechaj MonCash', 'Recharge MonCash', 'MonCash top-up'],
  hpTx1s: ['Jodi a · 10:24', 'Aujourd’hui · 10:24', 'Today · 10:24'],
  hpTx2: ['Transfè bay Jean P.', 'Transfert à Jean P.', 'Transfer to Jean P.'],
  hpTx2s: ['Jodi a · 09:02', 'Aujourd’hui · 09:02', 'Today · 09:02'],
  hpTx3: ['Peman QR · Boutik Lakay', 'Paiement QR · Boutik Lakay', 'QR payment · Boutik Lakay'],
  hpTx3s: ['Yè · 17:40', 'Hier · 17:40', 'Yesterday · 17:40'],
  hpPaid: ['Peman QR', 'Paiement QR', 'QR payment'],
  hpPaidSub: ['Reyisi an 2 segonn', 'Réussi en 2 secondes', 'Done in 2 seconds'],
  navHome: ['Akèy', 'Accueil', 'Home'],
  navSecurity: ['Sekirite', 'Sécurité', 'Security'],
  navHelp: ['Èd', 'Aide', 'Help'],
  footProducts: ['Pwodwi', 'Produits', 'Products'],
  phPlansT: ['Yon kont pou chak bezwen', 'Un compte pour chaque besoin', 'An account for every need'],
  phPlansS: ['Pèsonèl, pwofesyonèl oswa antrepriz — pri klè, san abònman, san sipriz.', 'Personnel, professionnel ou entreprise — des tarifs clairs, sans abonnement ni surprise.', 'Personal, professional or business — clear pricing, no subscription, no surprises.'],
  phCardT: ['Kat BLICPay', 'La carte BLICPay', 'The BLICPay card'],
  phCardS: ['Peye sou entènèt toupatou nan mond lan ak lajan ki sou kont BLICPay ou.', 'Payez en ligne partout dans le monde avec l’argent de votre compte BLICPay.', 'Pay online worldwide with the money in your BLICPay account.'],
  phBizT: ['BLICPay pou biznis', 'BLICPay pour les professionnels', 'BLICPay for business'],
  phBizS: ['Resevwa peman kliyan w yo pa QR, swiv lavant ou epi bay kliyan w konfyans.', 'Encaissez vos clients par QR, suivez vos ventes et inspirez confiance.', 'Get paid by QR, track your sales and build trust.'],
  phSecT: ['Sekirite w se priyorite nou', 'Votre sécurité, notre priorité', 'Your security comes first'],
  phSecS: ['Lajan w ak done w pwoteje nan chak etap, depi ouvèti kont lan jiska chak peman.', 'Votre argent et vos données sont protégés à chaque étape, de l’ouverture du compte à chaque paiement.', 'Your money and data are protected at every step, from sign-up to every payment.'],
  phHelpT: ['Kijan nou ka ede w?', 'Comment pouvons-nous vous aider ?', 'How can we help?'],
  phHelpS: ['Repons pou kesyon yo poze plis, ak yon ekip ki la pou ou.', 'Les réponses aux questions fréquentes, et une équipe à votre écoute.', 'Answers to common questions, and a team that’s here for you.'],
  phAboutS: ['Kiyès nou ye ak sa n ap bati pou Ayiti.', 'Qui nous sommes et ce que nous construisons pour Haïti.', 'Who we are and what we’re building for Haiti.'],
  phLegalS: ['Dènye mizajou: novanm 2026', 'Dernière mise à jour : novembre 2026', 'Last updated: November 2026'],
  tzPlansT: ['Chwazi kont ki fè pou ou', 'Choisissez le compte qui vous ressemble', 'Choose the account that fits you'],
  tzSee: ['Wè detay yo', 'Voir le détail', 'See details'],
  tzComparePlans: ['Konpare kont yo', 'Comparer les comptes', 'Compare accounts'],
  tzCardBtn: ['Dekouvri kat la', 'Découvrir la carte', 'Discover the card'],
  tzSecBtn: ['Aprann plis sou sekirite', 'En savoir plus sur la sécurité', 'Learn more about security'],
  tzBizBtn: ['Dekouvri BLICPay biznis', 'Découvrir l’offre pro', 'Discover the business offer'],
  whereT: ['Kote w ka itilize l', 'Où l’utiliser', 'Where to use it'],
  whereH: ['Tout sit ak aplikasyon ou renmen yo', 'Tous vos sites et applications préférés', 'All your favorite sites and apps'],
  whereS: ['Sou sit ak aplikasyon ki aksepte kat entènasyonal, pa egzanp:', 'Sur les sites et applications qui acceptent les cartes internationales, par exemple :', 'On websites and apps that accept international cards, for example:'],
  whereNote: ['Non mak sa yo se pwopriyete mèt yo. BLICPay pa gen okenn lyen avèk yo. Kat la ap disponib byento.', 'Ces marques appartiennent à leurs propriétaires respectifs et ne sont pas affiliées à BLICPay. Carte disponible prochainement.', 'These brands belong to their respective owners and are not affiliated with BLICPay. Card coming soon.'],
  helpContactT: ['Ou pa jwenn repons ou?', 'Vous ne trouvez pas votre réponse ?', 'Can’t find your answer?'],
  navFeatures: ['Sèvis', 'Services', 'Services'],
  navCard: ['Kat', 'Carte', 'Card'],
  navHow: ['Kijan l mache', 'Comment ça marche', 'How it works'],
  navBusiness: ['Antrepriz', 'Entreprises', 'Business'],
  navFaq: ['FAQ', 'FAQ', 'FAQ'],
  navPlans: ['Kont yo', 'Comptes', 'Accounts'],
  plEyebrow: ['Kont BLICPay', 'Comptes BLICPay', 'BLICPay accounts'],
  plTitle: ['Yon kont pou chak bezwen.', 'Un compte pour chaque besoin.', 'An account for every need.'],
  plSub: ['Pou lavi chak jou, pou aktivite w oswa pou antrepriz ou — pri klè, san sipriz.', 'Pour le quotidien, pour votre activité ou pour votre entreprise — des tarifs clairs, sans surprise.', 'For everyday life, your trade or your company — clear pricing, no surprises.'],
  plPro: ['Pwofesyonèl', 'Professionnel', 'Professional'],
  plTagP: ['Pou ou', 'Pour vous', 'For you'],
  plTagPro: ['Pou aktivite w', 'Pour votre activité', 'For your trade'],
  plTagB: ['Pou sosyete w', 'Pour votre société', 'For your company'],
  plIncl: ['Sa ki ladan l', 'Ce qui est inclus', 'What’s included'],
  plPlusP: ['Tout kont Pèsonèl la, plis:', 'Tout le compte Personnel, plus :', 'Everything in Personal, plus:'],
  plPlusPro: ['Tout kont Pwo a, plis:', 'Tout le compte Pro, plus :', 'Everything in Pro, plus:'],
  plOnce: ['yon sèl fwa', 'une seule fois', 'one-time'],
  plForever: ['pou toujou', 'pour toujours', 'forever'],
  plNoSub: ['San abònman · san frè kache', 'Sans abonnement · sans frais cachés', 'No subscription · no hidden fees'],
  tr1: ['San abònman, san frè kache', 'Sans abonnement, sans frais cachés', 'No subscription, no hidden fees'],
  tr1s: ['Ou peye frè ouvèti a yon sèl fwa, se tout.', 'Vous payez l’ouverture une seule fois, c’est tout.', 'You pay the opening fee once, that’s it.'],
  tr2: ['Peye an goud', 'Payé en gourdes', 'Paid in gourdes'],
  tr2s: ['Selon to BRH jou a — ak balans ou, MonCash oswa NatCash.', 'Au taux BRH du jour — par solde, MonCash ou NatCash.', 'At the daily BRH rate — by balance, MonCash or NatCash.'],
  tr3: ['Verifikasyon sekirize', 'Vérification sécurisée', 'Secure verification'],
  tr3s: ['Dokiman w yo chifre epi verifye pa ekip nou.', 'Vos documents sont chiffrés et vérifiés par notre équipe.', 'Your documents are encrypted and reviewed by our team.'],
  gPrice: ['Pri', 'Tarifs', 'Pricing'],
  gPay: ['Peman', 'Paiements', 'Payments'],
  gTrust: ['Vizibilite ak konfyans', 'Visibilité & confiance', 'Visibility & trust'],
  gVerif: ['Verifikasyon', 'Vérification', 'Verification'],
  vNoneW: ['Okenn', 'Aucun', 'None'],
  plChoose: ['Chwazi', 'Choisir', 'Choose'],
  plProFor: ['Pou moun k ap vann oswa k ap bay yon sèvis pou kont yo.', 'Pour ceux qui vendent ou offrent un service à leur compte.', 'For anyone who sells or offers a service on their own.'],
  plProPrice: ['100 $ US', '100 $ US', 'US$100'],
  plOpenPro: ['Louvri yon kont pwo', 'Ouvrir un compte pro', 'Open a pro account'],
  pr1: ['Kliyan w peye w an eskanen QR ou — pa gen pwoblèm monnen ankò', 'Vos clients vous paient en scannant votre QR — fini les problèmes de monnaie', 'Customers pay by scanning your QR — no more change problems'],
  pr2: ['Kliyan w wè non biznis ou lè y ap peye, pa non pèsonèl ou', 'Vos clients voient le nom de votre activité, pas votre nom personnel', 'Customers see your business name, not your personal name'],
  pr3: ['Badj « Pro verifye » ki bay kliyan w konfyans', 'Badge « Pro vérifié » qui rassure vos clients', '“Verified Pro” badge that builds customer trust'],
  pr4: ['Tablo bò: vant jodi a, vant mwa a, pi bon kliyan w yo', 'Tableau de bord : ventes du jour, du mois, vos meilleurs clients', 'Dashboard: today’s and monthly sales, your best customers'],
  pr5: ['Plafon pi wo pou vant ou ak founisè w', 'Plafonds plus élevés pour vos ventes et vos fournisseurs', 'Higher limits for your sales and suppliers'],
  pr6: ['Menm san lokal: vandè Instagram/WhatsApp, chofè, atizan', 'Même sans local : vendeurs Instagram/WhatsApp, chauffeurs, artisans', 'Even without premises: Instagram/WhatsApp sellers, drivers, artisans'],
  vProQr: ['QR pwo', 'QR pro', 'Pro QR'],
  vProCheck: ['NIF + adrès + relve + prèv aktivite', 'NIF + adresse + relevé + preuve d’activité', 'NIF + address + statement + proof of activity'],
  r12: ['Plafon retrè', 'Plafonds de retrait', 'Withdrawal limits'],
  vStd: ['Estanda', 'Standard', 'Standard'],
  vHigh: ['Pi wo', 'Élevés', 'Higher'],
  vHighest: ['Pi wo nèt', 'Les plus élevés', 'Highest'],
  plPersonal: ['Pèsonèl', 'Personnel', 'Personal'],
  plPersonalFor: ['Pou jere lajan w chak jou, san tèt chaje.', 'Pour gérer votre argent au quotidien, sans tracas.', 'To manage your everyday money, hassle-free.'],
  plFree: ['Gratis', 'Gratuit', 'Free'],
  plFreeSub: ['Pa gen frè ouvèti, pa gen abònman', 'Ni frais d’ouverture, ni abonnement', 'No opening fee, no subscription'],
  plBusiness: ['Antrepriz', 'Entreprise', 'Business'],
  plBusinessFor: ['Pou sosyete anrejistre ki vle grandi.', 'Pour les sociétés enregistrées qui voient grand.', 'For registered companies ready to grow.'],
  plBizPrice: ['500 $ US', '500 $ US', 'US$500'],
  plBizPriceSub: ['Frè ouvèti yon sèl fwa — pa gen abònman', 'Frais d’ouverture unique — sans abonnement', 'One-time opening fee — no subscription'],
  plPopular: ['Pi popilè', 'Le plus choisi', 'Most popular'],
  plOpenPersonal: ['Louvri yon kont pèsonèl', 'Ouvrir un compte personnel', 'Open a personal account'],
  plOpenBusiness: ['Louvri yon kont antrepriz', 'Ouvrir un compte entreprise', 'Open a business account'],
  p1: ['Voye lajan bay fanmi w an 2 segonn — gratis', 'Envoyez de l’argent à vos proches en 2 secondes — gratuitement', 'Send money to loved ones in 2 seconds — free'],
  p2: ['Rechaje ak MonCash, NatCash oswa nan ajans', 'Rechargez avec MonCash, NatCash ou en agence', 'Top up with MonCash, NatCash or at a branch'],
  p3: ['Resevwa lajan ak kòd QR pèsonèl ou', 'Recevez de l’argent avec votre QR code personnel', 'Receive money with your personal QR code'],
  p4: ['Swiv chak goud: istorik detaye chak operasyon', 'Suivez chaque gourde : historique détaillé de chaque opération', 'Track every gourde: detailed history of every transaction'],
  p5: ['Kont pwoteje pa PIN, Face ID ak kòd pa imèl', 'Compte protégé par PIN, Face ID et code par e-mail', 'Protected by PIN, Face ID and email codes'],
  p6: ['Kat BLICPay vityèl ak fizik — byento', 'Carte BLICPay virtuelle et physique — bientôt', 'Virtual and physical BLICPay card — coming soon'],
  b1: ['Tout sa kont Pwo a bay, sou non sosyete w', 'Tout le compte Pro, au nom de votre société', 'Everything in Pro, in your company’s name'],
  b2: ['Plafon ki pi wo yo pou gwo volim', 'Les plafonds les plus élevés, pour les gros volumes', 'Our highest limits, for large volumes'],
  b3: ['Verifikasyon ofisyèl (rejis + benefisyè) — kredibilite devan patnè ak founisè', 'Vérification officielle (registre + bénéficiaires) — crédibilité auprès de vos partenaires', 'Official verification (registry + owners) — credibility with partners'],
  b4: ['Badj « Antrepriz verifye » ki vizib pou tout kliyan', 'Badge « Entreprise vérifiée » visible par tous vos clients', '“Verified business” badge visible to all customers'],
  b5: ['Tablo bò konplè: lavant, analiz ak istorik', 'Tableau de bord complet : encaissements, analyses et historique', 'Full dashboard: payments, analytics and history'],
  b6: ['Pou S.A., SNC, ONG, asosyasyon ak kooperativ', 'Pour S.A., SNC, ONG, associations et coopératives', 'For S.A., SNC, NGOs, associations and cooperatives'],
  b7: ['Kat antrepriz — byento', 'Cartes entreprise — bientôt', 'Business cards — coming soon'],
  cmpTitle: ['Konpare kont yo', 'Comparer les comptes', 'Compare accounts'],
  cmpFeature: ['', '', ''],
  r1: ['Frè ouvèti', 'Frais d’ouverture', 'Opening fee'],
  r2: ['Abònman pa mwa', 'Abonnement mensuel', 'Monthly fee'],
  r3: ['Transfè ant kliyan BLICPay', 'Transferts entre clients BLICPay', 'Transfers between BLICPay clients'],
  r4: ['Depo minimòm', 'Dépôt minimum', 'Minimum deposit'],
  r5: ['Plafon retrè pa jou', 'Plafond de retrait par jour', 'Daily withdrawal limit'],
  r6: ['Plafon retrè pa semèn', 'Plafond de retrait par semaine', 'Weekly withdrawal limit'],
  r7: ['Plafon retrè pa mwa', 'Plafond de retrait par mois', 'Monthly withdrawal limit'],
  r9: ['Resevwa peman pa QR', 'Encaissement par QR code', 'QR payments'],
  r10: ['Tablo bò lavant', 'Tableau de bord des ventes', 'Sales dashboard'],
  r11: ['Verifikasyon', 'Vérification', 'Verification'],
  vNone: ['0 HTG', '0 HTG', '0 HTG'],
  vFreeInstant: ['Gratis • enstantane', 'Gratuits • instantanés', 'Free • instant'],
  vPersonalQr: ['QR pèsonèl', 'QR personnel', 'Personal QR'],
  vBizQr: ['QR antrepriz', 'QR entreprise', 'Business QR'],
  vKyc: ['Pyès idantite + selfi', 'Pièce d’identité + selfie', 'ID + selfie'],
  vKyb: ['Dokiman legal + rejis + benefisyè', 'Documents légaux + registre + bénéficiaires', 'Legal docs + registry + owners'],
  plIdealP: ['Ideyal si: ou vle voye ak resevwa lajan fasil', 'Idéal si : vous voulez envoyer et recevoir de l’argent facilement', 'Ideal if: you want to send and receive money easily'],
  plIdealPro: ['Ideyal si: ou gen yon ti biznis, yon metye oswa ou vann sou rezo sosyal', 'Idéal si : vous avez un petit commerce, un métier ou vous vendez sur les réseaux', 'Ideal if: you run a small business, a trade or sell on social media'],
  plIdealB: ['Ideyal si: ou gen yon sosyete anrejistre, yon ONG oswa yon kooperativ', 'Idéal si : vous avez une société enregistrée, une ONG ou une coopérative', 'Ideal if: you have a registered company, NGO or cooperative'],
  r13: ['Non kliyan w wè lè y ap peye', 'Nom affiché quand on vous paie', 'Name shown when you get paid'],
  r14: ['Badj verifye', 'Badge vérifié', 'Verified badge'],
  vNameP: ['Non pèsonèl ou', 'Votre nom', 'Your name'],
  vNamePro: ['Non biznis ou', 'Nom de votre activité', 'Your business name'],
  vNameB: ['Non sosyete a', 'Nom de la société', 'Company name'],
  plNote: ['Frè ouvèti kont Pwo ak Antrepriz yo peye yon sèl fwa, an goud selon tal BRH jou a. Plafon kont ou yo parèt nan espas kliyan an apre ouvèti a.', 'Les frais d’ouverture des comptes Pro et Entreprise sont payés une seule fois, en gourdes au taux BRH du jour. Les plafonds de votre compte sont affichés dans votre espace client après l’ouverture.', 'Pro and Business opening fees are paid once, in gourdes at the daily BRH rate. Your account limits are shown in your client area once the account is open.'],
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
  cardNote: ['Kat yo ap lanse byento ak yon emetè patnè — enskri kounye a pou w pami premye yo.', 'Les cartes seront lancées prochainement avec un émetteur partenaire — inscrivez-vous pour être parmi les premiers.', 'Cards launch soon with a partner issuer — sign up now to be among the first.'],

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
  a4: ['N ap lanse kat yo byento ak yon emetè patnè. Kliyan ki gen yon kont verifye ap premye resevwa yo.', 'Les cartes seront lancées prochainement avec un émetteur partenaire. Les clients au compte vérifié les recevront en premier.', 'Cards launch soon with a partner issuer. Customers with a verified account will get them first.'],
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
  disclaimer: ['BLICPAY se yon non komèsyal anrejistre nan Ministè Kòmès ak Endistri Ayiti (MCI), epi BLICPAY LLC se yon sosyete anrejistre nan Nouvo Meksik (Etazini). BLICPay pa yon bank. Kat yo ap emèt pa yon emetè patnè ki gen otorizasyon, lè yo disponib.', 'BLICPAY est un nom commercial enregistré auprès du Ministère du Commerce et de l’Industrie d’Haïti (MCI), et BLICPAY LLC une société enregistrée au Nouveau-Mexique (États-Unis). BLICPay n’est pas une banque. Les cartes seront émises par un émetteur partenaire agréé lorsqu’elles seront disponibles.', 'BLICPAY is a trade name registered with the Haitian Ministry of Commerce and Industry (MCI), and BLICPAY LLC is a company registered in New Mexico (USA). BLICPay is not a bank. Cards will be issued by a licensed partner issuer once available.'],
  aboutBody: ['BLICPay se yon platfòm fentèk ki fèt pou Ayisyen. Nou bay yon kont dijital ou ka rechaje fasilman, transfè imedyat ant kliyan BLICPay, peman pa QR pou moun ak antrepriz, epi byento kat vityèl ak fizik. Misyon nou: fè peman dijital vin senp, rapid e sekirize pou tout moun.', 'BLICPay est une plateforme fintech conçue pour les Haïtiens. Nous offrons un compte numérique facile à recharger, des transferts instantanés entre clients BLICPay, des paiements par QR pour particuliers et entreprises, et bientôt des cartes virtuelles et physiques. Notre mission : rendre le paiement numérique simple, rapide et sûr pour tous.', 'BLICPay is a fintech platform built for Haitians. We offer an easy-to-fund digital account, instant transfers between BLICPay users, QR payments for people and businesses, and soon virtual and physical cards. Our mission: make digital payments simple, fast and safe for everyone.'],
  supportBody: ['Ou gen yon kesyon oswa yon pwoblèm ak kont ou? Kontakte nou dirèkteman:', 'Une question ou un problème avec votre compte ? Contactez-nous directement :', 'A question or an issue with your account? Contact us directly:'],
  call: ['Rele nou', 'Appelez-nous', 'Call us'],
  whatsapp: ['Ekri nou sou WhatsApp', 'Écrivez-nous sur WhatsApp', 'Message us on WhatsApp'],
  termsBody: [
    '1. Akseptasyon\nAn kreye oswa itilize yon kont BLICPay, ou aksepte kondisyon sa yo.\n\n2. Kalifikasyon\nOu dwe gen omwen 18 an epi bay enfòmasyon egzat. Yon verifikasyon idantite (KYC) obligatwa pou sèten operasyon.\n\n3. Kont ou\nOu responsab konfidansyalite modpas ak kòd PIN ou. Kontakte nou imedyatman si ou sispèk yon aksè san otorizasyon.\n\n4. Rechaj, transfè ak retrè\nBalans ou se lajan ou rechaje. Transfè BLICPay → BLICPay yo gratis. Retrè yo gen frè ki toujou afiche anvan konfimasyon, epi yo sijè a plafon.\n\n5. Kat\nKat BLICPay yo ap emèt pa yon emetè patnè ki gen otorizasyon, sijè a kondisyon pa l, lè yo disponib.\n\n6. Itilizasyon entèdi\nOkenn aktivite ilegal, fwod oswa blanchi lajan.\n\n7. Sispansyon\nBLICPay ka sispann oswa fèmen yon kont ki vyole kondisyon sa yo.\n\n8. Chanjman\nNou ka modifye kondisyon sa yo — n ap enfòme w de chanjman enpòtan.',
    '1. Acceptation\nEn créant ou en utilisant un compte BLICPay, vous acceptez ces conditions.\n\n2. Éligibilité\nVous devez avoir au moins 18 ans et fournir des informations exactes. Une vérification d’identité (KYC) est obligatoire pour certaines opérations.\n\n3. Votre compte\nVous êtes responsable de la confidentialité de votre mot de passe et de votre PIN. Contactez-nous immédiatement en cas d’accès non autorisé.\n\n4. Recharges, transferts et retraits\nVotre solde correspond à l’argent que vous avez rechargé. Les transferts BLICPay → BLICPay sont gratuits. Les retraits comportent des frais toujours affichés avant confirmation et sont soumis à des plafonds.\n\n5. Cartes\nLes cartes BLICPay seront émises par un émetteur partenaire agréé, selon ses propres conditions, lorsqu’elles seront disponibles.\n\n6. Usages interdits\nAucune activité illégale, fraude ou blanchiment d’argent.\n\n7. Suspension\nBLICPay peut suspendre ou fermer un compte qui enfreint ces conditions.\n\n8. Modifications\nNous pouvons modifier ces conditions — vous serez informé des changements importants.',
    '1. Acceptance\nBy creating or using a BLICPay account, you accept these terms.\n\n2. Eligibility\nYou must be at least 18 and provide accurate information. Identity verification (KYC) is required for some operations.\n\n3. Your account\nYou are responsible for keeping your password and PIN confidential. Contact us immediately if you suspect unauthorized access.\n\n4. Top-ups, transfers and withdrawals\nYour balance is the money you have added. BLICPay → BLICPay transfers are free. Withdrawals carry fees always shown before you confirm and are subject to limits.\n\n5. Cards\nBLICPay cards will be issued by a licensed partner issuer, under its own terms, once available.\n\n6. Prohibited use\nNo illegal activity, fraud or money laundering.\n\n7. Suspension\nBLICPay may suspend or close an account that breaches these terms.\n\n8. Changes\nWe may update these terms — we will tell you about important changes.',
  ],
  privacyBody: [
    '1. Enfòmasyon nou kolekte\nNon, telefòn, adrès, dokiman idantite (pou KYC) ak istorik tranzaksyon ou.\n\n2. Poukisa\nPou jere kont ou, verifye idantite ou (obligasyon regilasyon), trete tranzaksyon ak ofri sipò.\n\n3. Pataj\nNou pa vann done ou. Nou ka pataje enfòmasyon ak patnè ki nesesè pou sèvis la (verifikasyon idantite, emetè patnè kat yo) oswa ak otorite si lalwa mande sa.\n\n4. Sekirite\nModpas ak PIN chifre; aksè entèn limite.\n\n5. Konsèvasyon\nNou kenbe done ou pandan kont ou aktif epi pou peryòd lalwa mande apre fèmti.\n\n6. Dwa ou\nOu ka mande wè, korije oswa efase done ou — kontakte sipò.',
    '1. Données collectées\nNom, téléphone, adresse, pièces d’identité (pour le KYC) et historique de vos transactions.\n\n2. Finalités\nGérer votre compte, vérifier votre identité (obligation réglementaire), traiter les transactions et offrir un support.\n\n3. Partage\nNous ne vendons pas vos données. Nous pouvons les partager avec les partenaires nécessaires au service (vérification d’identité, émetteur partenaire des cartes) ou avec les autorités si la loi l’exige.\n\n4. Sécurité\nMots de passe et PIN chiffrés ; accès interne limité.\n\n5. Conservation\nNous conservons vos données tant que votre compte est actif, puis pendant la durée exigée par la loi.\n\n6. Vos droits\nVous pouvez demander l’accès, la correction ou la suppression de vos données — contactez le support.',
    '1. Data we collect\nName, phone, address, identity documents (for KYC) and your transaction history.\n\n2. Why\nTo run your account, verify your identity (a regulatory requirement), process transactions and provide support.\n\n3. Sharing\nWe do not sell your data. We may share it with partners needed to provide the service (identity verification, the card-issuing partner) or with authorities where the law requires.\n\n4. Security\nPasswords and PINs are encrypted; internal access is limited.\n\n5. Retention\nWe keep your data while your account is active and for the period required by law afterwards.\n\n6. Your rights\nYou can ask to access, correct or delete your data — contact support.',
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

// Tablo konparezon kont yo: tablo sou òdinatè, onglè pa plan sou telefòn
function PlanCompare({ t, onStart }) {
  const [plan, setPlan] = useState('pro');
  const groups = [
                    ['gPrice', [['r1', t('plFree'), t('plProPrice'), t('plBizPrice')], ['r2', t('vNoneW'), t('vNoneW'), t('vNoneW')], ['r4', '100 HTG', '100 HTG', '100 HTG']]],
                    ['gPay', [['r3', t('vFreeInstant'), t('vFreeInstant'), t('vFreeInstant')], ['r9', t('vPersonalQr'), t('vProQr'), t('vBizQr')], ['r12', t('vStd'), t('vHigh'), t('vHighest')]]],
                    ['gTrust', [['r13', t('vNameP'), t('vNamePro'), t('vNameB')], ['r14', null, true, true], ['r10', null, true, true]]],
                    ['gVerif', [['r11', t('vKyc'), t('vProCheck'), t('vKyb')]]],
                  ];
  const PLANS = [['personal', 'plPersonal', 'register'], ['pro', 'plPro', 'register-pro'], ['business', 'plBusiness', 'register-business']];
  const cell = (v) => v === true
    ? <span className="w-6 h-6 rounded-full inline-flex items-center justify-center" style={{ background: '#E3F5EE' }}><Check size={14} color={C.mint} strokeWidth={3.2} /></span>
    : v === null ? <span className="w-6 h-6 rounded-full inline-flex items-center justify-center" style={{ background: '#F1F3F7' }}><X size={12} color="#A7B0BF" strokeWidth={3} /></span> : v;
  const idx = PLANS.findIndex(([k]) => k === plan);
  return (
    <>
      {/* Telefòn: chwazi yon plan */}
      <div className="sm:hidden mt-7">
        <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl" style={{ background: '#E9EEF5' }}>
          {PLANS.map(([k, name]) => (
            <button key={k} onClick={() => setPlan(k)} className="h-10 rounded-xl text-[13px] font-bold flex items-center justify-center gap-1.5 transition"
              style={plan === k ? { background: '#fff', color: C.ink, boxShadow: '0 2px 8px -2px rgba(11,27,51,.18)' } : { color: C.muted }}>
              <span className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: PLAN_GRAD[k] }}>{React.createElement(PLAN_ICON[k], { size: 11, color: '#fff', strokeWidth: 2.2 })}</span>
              {t(name).replace('Professionnel', 'Pro').replace('Pwofesyonèl', 'Pwo').replace('Professional', 'Pro')}
            </button>
          ))}
        </div>
        <div className="mt-4 rounded-[22px] bg-white overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
          {groups.map(([g, rows]) => (
            <div key={g}>
              <div className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest" style={{ color: C.sky, background: '#F7F9FC', borderTop: `1px solid ${C.border}` }}>{t(g)}</div>
              {rows.map((r) => (
                <div key={r[0]} className="px-4 py-3.5 flex items-center justify-between gap-4 text-[14px]" style={{ borderTop: `1px solid ${C.border}` }}>
                  <span style={{ color: C.muted }}>{t(r[0])}</span>
                  <span className="font-semibold text-right" style={{ color: C.ink }}>{cell(r[idx + 1])}</span>
                </div>
              ))}
            </div>
          ))}
          <div className="p-4" style={{ borderTop: `1px solid ${C.border}` }}>
            <button onClick={() => onStart(PLANS[idx][2])} className="w-full h-12 rounded-2xl font-bold inline-flex items-center justify-center gap-2 text-white" style={{ background: plan === 'pro' ? PLAN_GRAD.pro : C.navy, color: plan === 'pro' ? '#2A1A00' : '#fff' }}>
              {t(plan === 'personal' ? 'plOpenPersonal' : plan === 'pro' ? 'plOpenPro' : 'plOpenBusiness')}<ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
      {/* Òdinatè / tablèt: tablo */}
      <div className="hidden sm:block">
              <div className="mt-8 rounded-[24px] bg-white border overflow-x-auto" style={{ borderColor: C.border }}>
                <div className="min-w-[640px]">
                  <div className="grid grid-cols-[1.25fr_1fr_1fr_1fr] items-end" style={{ borderBottom: `1px solid ${C.border}` }}>
                    <div className="px-4 sm:px-6 py-5" />
                    {[['personal', 'plPersonal', 'register'], ['pro', 'plPro', 'register-pro'], ['business', 'plBusiness', 'register-business']].map(([k, name, act]) => (
                      <div key={k} className="px-3 sm:px-5 py-5" style={k === 'pro' ? { background: '#FFF8EC' } : undefined}>
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: PLAN_GRAD[k] }}>{React.createElement(PLAN_ICON[k], { size: 16, color: '#fff', strokeWidth: 2 })}</span>
                          <span className="text-[14.5px] font-bold" style={{ ...display }}>{t(name)}</span>
                        </div>
                        <button onClick={() => onStart(act)} className="mt-3 text-[12.5px] font-bold inline-flex items-center gap-1" style={{ color: k === 'pro' ? '#B86E0B' : C.navy }}>{t('plChoose')}<ArrowRight size={13} /></button>
                      </div>
                    ))}
                  </div>
                  {groups.map(([g, rows]) => (
                    <React.Fragment key={g}>
                      <div className="grid grid-cols-[1.25fr_1fr_1fr_1fr]" style={{ background: '#F7F9FC', borderTop: `1px solid ${C.border}` }}>
                        <div className="px-4 sm:px-6 py-2.5 text-[11.5px] font-bold uppercase tracking-widest" style={{ color: C.sky }}>{t(g)}</div>
                        <div /><div style={{ background: '#FFF3DD' }} /><div />
                      </div>
                      {rows.map(([k, a, b, c]) => (
                        <div key={k} className="grid grid-cols-[1.25fr_1fr_1fr_1fr] text-[13px] sm:text-[14px]" style={{ borderTop: `1px solid ${C.border}` }}>
                          <div className="px-4 sm:px-6 py-4 font-medium" style={{ color: C.muted }}>{t(k)}</div>
                          {[a, b, c].map((v, j) => (
                            <div key={j} className="px-3 sm:px-5 py-4 font-semibold flex items-center" style={{ color: C.ink, ...(j === 1 ? { background: '#FFF8EC' } : {}) }}>
                              {v === true ? <span className="w-6 h-6 rounded-full inline-flex items-center justify-center" style={{ background: '#E3F5EE' }}><Check size={14} color={C.mint} strokeWidth={3.2} /></span> : v === null ? <span className="w-6 h-6 rounded-full inline-flex items-center justify-center" style={{ background: '#F1F3F7' }}><X size={12} color="#A7B0BF" strokeWidth={3} /></span> : v}
                            </div>
                          ))}
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              </div>
      </div>
    </>
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

// Telefòn ak ekran akèy aplikasyon BLICPay la — menm jan ak app la (kat anpile,
// balans sou kat la, bouton « Depoze », aksyon, kat vityèl, tranzaksyon, ba glass).
function HeroPhone({ t }) {
  const A = { canvas: '#F2F4F8', alt: '#F1F5F9', ink: '#0B1B33', muted: '#64748B', navy: '#0B1B33', cyan: '#00B4D8' };
  const jak = { fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" };
  const W = 278, H = Math.round(W / (1438 / 905)), R = 14;
  const SW = 310, SH = Math.round(SW * 852 / 393); // ekran iPhone 15 Pro (393 × 852)
  const emboss = { color: '#FFFFFF', textShadow: '0 1px 1px rgba(0,0,0,.38)' };
  const r = Math.round;
  const acts = [[ArrowUpRight, 'hpSend'], [ArrowDownLeft, 'hpReceive'], [Banknote, 'hpWithdraw'], [LayoutGrid, 'hpMore']];
  const tx = [
    ['hpTx1', 'hpTx1s', '+2 500 HTG', true, ArrowDownLeft],
    ['hpTx2', 'hpTx2s', '−1 200 HTG', false, ArrowUpRight],
    ['hpTx3', 'hpTx3s', '−850 HTG', false, Store],
  ];
  const back = (src, label, top, scale) => (
    <div className="absolute overflow-hidden" style={{ top, left: r(W * (1 - scale) / 2), width: r(W * scale), height: r(H * scale), borderRadius: R, background: '#0B1B33' }}>
      <img src={src} alt="" className="w-full h-full object-cover" />
      <span className="absolute right-3 top-[5px] rounded-full px-2 py-[2px] text-[10px] font-bold text-white" style={{ background: 'rgba(0,0,0,.42)' }}>{label} · {t('soon')}</span>
    </div>
  );
  return (
    <div className="lp2-phone relative w-[330px] mx-auto lg:mr-28 lg:ml-0 my-4" style={jak}>
      <div className="absolute -inset-16 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(34,211,238,.28), transparent 62%)' }} />
      {/* bouton akote (aksyon, volim, kouran) */}
      <span className="absolute -left-[3px] top-[118px] w-[4px] h-[30px] rounded-l-[3px]" style={{ background: 'linear-gradient(90deg, #9EA2A8, #E6E8EB 60%, #C4C7CB)', boxShadow: '0 0 0 .5px rgba(0,0,0,.25)' }} />
      <span className="absolute -left-[3px] top-[172px] w-[4px] h-[56px] rounded-l-[3px]" style={{ background: 'linear-gradient(90deg, #9EA2A8, #E6E8EB 60%, #C4C7CB)', boxShadow: '0 0 0 .5px rgba(0,0,0,.25)' }} />
      <span className="absolute -left-[3px] top-[240px] w-[4px] h-[56px] rounded-l-[3px]" style={{ background: 'linear-gradient(90deg, #9EA2A8, #E6E8EB 60%, #C4C7CB)', boxShadow: '0 0 0 .5px rgba(0,0,0,.25)' }} />
      <span className="absolute -right-[3px] top-[196px] w-[4px] h-[88px] rounded-r-[3px]" style={{ background: 'linear-gradient(270deg, #9EA2A8, #E6E8EB 60%, #C4C7CB)', boxShadow: '0 0 0 .5px rgba(0,0,0,.25)' }} />
      {/* kad titàn */}
      <div className="relative rounded-[58px] p-[5px]" style={{ background: 'linear-gradient(150deg, #FFFFFF 0%, #D9DBDF 18%, #A7ABB1 38%, #F4F5F6 55%, #B9BCC1 76%, #EEF0F2 100%)', boxShadow: '0 60px 100px -36px rgba(0,0,0,.75), 0 0 0 1px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.7)' }}>
        {/* bezèl nwa fen */}
        <div className="rounded-[53px] p-[6px]" style={{ background: '#0A0B0D', boxShadow: '0 0 0 1px rgba(0,0,0,.5)' }}>
        <div className="relative rounded-[47px] overflow-hidden" style={{ background: A.canvas, width: SW, height: SH }}>
          {/* Dynamic Island */}
          <div className="absolute left-1/2 -translate-x-1/2 top-[11px] w-[104px] h-[30px] rounded-full bg-black z-20 flex items-center justify-end pr-3">
            <span className="w-[9px] h-[9px] rounded-full" style={{ background: 'radial-gradient(circle at 35% 35%, #2B3A55, #0A0F18 70%)' }} />
          </div>
          {/* ba estati */}
          <div className="relative z-10 h-[50px] flex items-center justify-between px-[26px] pt-[3px]" style={{ color: A.ink }}>
            <span className="text-[14px] font-semibold" style={{ letterSpacing: '-.01em' }}>9:41</span>
            <span className="flex items-center gap-[5px]">
              <svg width="17" height="11" viewBox="0 0 17 11"><rect x="0" y="7" width="3" height="4" rx=".8" fill="currentColor"/><rect x="4.6" y="5" width="3" height="6" rx=".8" fill="currentColor"/><rect x="9.2" y="2.6" width="3" height="8.4" rx=".8" fill="currentColor"/><rect x="13.8" y="0" width="3" height="11" rx=".8" fill="currentColor"/></svg>
              <svg width="15" height="11" viewBox="0 0 15 11"><path d="M7.5 2.3c2.1 0 4 .8 5.5 2.1l1.1-1.1A9.4 9.4 0 0 0 7.5.7 9.4 9.4 0 0 0 .9 3.3L2 4.4a7.8 7.8 0 0 1 5.5-2.1Zm0 3.2c1.2 0 2.3.4 3.2 1.2l1.1-1.1a6.4 6.4 0 0 0-8.6 0l1.1 1.1c.9-.8 2-1.2 3.2-1.2Zm0 3.2c.4 0 .8.2 1.1.4L7.5 10.2 6.4 9.1c.3-.2.7-.4 1.1-.4Z" fill="currentColor"/></svg>
              <span className="relative w-[25px] h-[12px] rounded-[4px] border" style={{ borderColor: 'rgba(11,27,51,.4)' }}>
                <span className="absolute inset-[1.5px] right-[5px] rounded-[2px]" style={{ background: A.ink }} />
                <span className="absolute -right-[3px] top-[3.5px] w-[1.5px] h-[4px] rounded-r" style={{ background: 'rgba(11,27,51,.4)' }} />
              </span>
            </span>
          </div>
          <div className="px-4 pt-1">
            {/* antèt */}
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[18px] leading-tight truncate" style={{ fontWeight: 800, color: A.ink, letterSpacing: '-.02em' }}>{t('hpHi')}</p>
                <p className="text-[11px] mt-0.5" style={{ color: A.muted }}>{t('hpTagline')}</p>
              </div>
              <span className="w-[34px] h-[34px] rounded-full bg-white flex items-center justify-center" style={{ boxShadow: '0 4px 10px rgba(11,27,51,.06)' }}><Bell size={15} color={A.ink} /></span>
              <span className="w-[34px] h-[34px] rounded-full p-[2px] bg-white" style={{ boxShadow: '0 4px 10px rgba(11,27,51,.08)' }}>
                <span className="w-full h-full rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #1B78D6, #0A3D7A)' }}>IP</span>
              </span>
            </div>
            {/* kat anpile */}
            <div className="relative mt-2" style={{ height: 56 + H }}>
              {back('/cards/card-shield.jpg', 'Premium', 0, 0.9)}
              {back('/cards/card-world.jpg', 'Standard', 28, 0.95)}
              <div className="absolute left-0 overflow-hidden" style={{ top: 56, width: W, height: H, borderRadius: R, background: '#0B1B33', boxShadow: '0 12px 22px -8px rgba(11,42,92,.55)' }}>
                <img src="/cards/card-ocean.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute" style={{ left: r(W * 0.07), top: r(H * 0.475) }}>
                  <div className="flex items-end gap-1">
                    <span style={{ ...emboss, fontWeight: 800, fontSize: Math.round(W * 0.082), lineHeight: 1 }}>48 750</span>
                    <span style={{ ...emboss, fontWeight: 700, fontSize: Math.round(W * 0.036) }}>HTG</span>
                    <Eye size={11} color="rgba(255,255,255,.85)" style={{ marginBottom: 2 }} />
                  </div>
                  <p style={{ ...emboss, fontWeight: 700, fontSize: Math.round(W * 0.036), marginTop: 1 }}>≈ 371,85 $ US</p>
                </div>
                <span className="absolute" style={{ ...emboss, left: r(W * 0.506), top: r(H * 0.695), fontWeight: 800, fontSize: Math.round(W * 0.05), letterSpacing: 1 }}>••/••</span>
                <span className="absolute truncate" style={{ ...emboss, left: r(W * 0.075), right: r(W * 0.42), bottom: r(H * 0.09), fontWeight: 500, fontSize: Math.round(W * 0.042), letterSpacing: '.05em' }}>ISABELLE PIERRE</span>
                <div className="absolute right-0 bottom-0 pl-1.5 pt-1.5" style={{ background: A.canvas, borderTopLeftRadius: 16 }}>
                  <span className="h-8 pl-1.5 pr-3 rounded-full flex items-center gap-1.5 text-[11px] font-bold text-white" style={{ background: A.navy }}>
                    <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center"><Plus size={11} color={A.navy} strokeWidth={3} /></span>{t('hpDeposit')}
                  </span>
                </div>
              </div>
            </div>
            {/* aksyon */}
            <div className="mt-3 rounded-[20px] bg-white py-3 px-1 flex justify-around">
              {acts.map(([Ic, k]) => (
                <div key={k} className="flex flex-col items-center gap-1.5 w-[58px]">
                  <span className="w-[38px] h-[38px] rounded-full flex items-center justify-center" style={{ background: A.alt }}><Ic size={16} color={A.ink} /></span>
                  <span className="text-[10.5px] font-semibold" style={{ color: A.ink }}>{t(k)}</span>
                </div>
              ))}
            </div>
            {/* kat vityèl */}
            <div className="mt-2.5 rounded-[18px] bg-white p-2.5 flex items-center gap-2">
              <span className="relative w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0" style={{ background: A.alt }}>
                <CreditCard size={15} color={A.ink} /><span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ background: A.cyan }} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold truncate" style={{ color: A.ink }}>{t('hpCardTitle')}</p>
                <p className="text-[10px] truncate" style={{ color: A.muted }}>{t('hpCardSoon')}</p>
              </div>
              <span className="rounded-full px-3 py-1.5 text-[11px] font-bold text-white" style={{ background: A.navy }}>{t('hpSee')}</span>
            </div>
            {/* tranzaksyon */}
            <div className="mt-2.5 rounded-[18px] bg-white px-3 pt-2.5 pb-16">
              <div className="flex items-center justify-between">
                <p className="text-[12.5px] font-bold" style={{ color: A.ink }}>{t('hpRecent')}</p>
                <p className="text-[10.5px]" style={{ color: A.muted }}>{t('hpAll')}</p>
              </div>
              {tx.map(([k, sub, amt, inc, Ic]) => (
                <div key={k} className="flex items-center gap-2.5 py-2">
                  <span className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0" style={{ background: inc ? 'rgba(16,185,129,.12)' : A.alt }}><Ic size={13} color={inc ? '#059669' : A.ink} /></span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold truncate" style={{ color: A.ink }}>{t(k)}</p>
                    <p className="text-[10px]" style={{ color: A.muted }}>{t(sub)}</p>
                  </div>
                  <p className="text-[11px] font-bold whitespace-nowrap" style={{ color: inc ? '#059669' : A.ink }}>{amt}</p>
                </div>
              ))}
            </div>
          </div>
          {/* ba navigasyon glass */}
          <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-[110px] z-[5]" style={{ background: `linear-gradient(180deg, rgba(242,244,248,0) 0%, ${A.canvas} 62%)` }} />
          <div className="absolute left-0 right-0 bottom-[26px] flex justify-center z-10">
            <div className="h-[50px] rounded-[26px] flex items-center gap-1.5 px-[6px]" style={{ background: '#0F2752', boxShadow: '0 12px 24px -10px rgba(9,32,74,.6)' }}>
              <span className="h-[38px] px-3.5 rounded-full bg-white flex items-center gap-1.5 text-[11px] font-bold" style={{ color: '#09204A' }}><Home size={14} />{t('navHome')}</span>
              {[CreditCard, null, Clock, UserRound].map((Ic, n) => Ic
                ? <span key={n} className="w-[38px] h-[38px] rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,.08)' }}><Ic size={15} color="rgba(255,255,255,.88)" /></span>
                : <span key={n} className="w-[38px] h-[38px] rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #29D3F5, #00A3D9)' }}><QrCode size={16} color="#fff" /></span>)}
            </div>
          </div>
          <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2 w-[120px] h-[5px] rounded-full z-20" style={{ background: '#0B1B33' }} />
        </div>
        </div>
      </div>
      {/* notifikasyon k ap flote */}
      <div className="lp2-bob absolute hidden sm:flex -left-36 top-[64%] rounded-2xl bg-white px-3.5 py-3 items-center gap-3" style={{ boxShadow: '0 20px 40px -16px rgba(0,0,0,.45)', fontFamily: 'inherit' }}>
        <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#E0F7FB' }}><ArrowLeftRight size={16} color="#0E7490" /></span>
        <div>
          <p className="text-[10.5px]" style={{ color: C.muted }}>{t('heroReceived')}</p>
          <p className="text-[13px] font-bold" style={{ color: '#0E9F8A' }}>+ 2 500 HTG</p>
        </div>
      </div>
      <div className="lp2-bob absolute hidden sm:flex -right-52 top-[30%] rounded-2xl px-3.5 py-3 items-center gap-3 text-white" style={{ background: 'rgba(6,18,43,.9)', border: '1px solid rgba(34,211,238,.35)', backdropFilter: 'blur(8px)', boxShadow: '0 20px 40px -16px rgba(0,0,0,.6)', animationDelay: '1.6s' }}>
        <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: C.cyan }}><Check size={17} color={C.night} strokeWidth={3} /></span>
        <div>
          <p className="text-[10.5px] text-white/60">{t('hpPaid')}</p>
          <p className="text-[13px] font-bold">{t('hpPaidSub')}</p>
        </div>
      </div>
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
    [Wallet, 'f1'],
    [ArrowLeftRight, 'f2'],
    [QrCode, 'f3'],
    [CreditCard, 'f4', null, null, true],
    [CreditCard, 'f5', null, null, true],
    [Store, 'f6'],
  ];
  // Paj yo: chak youn gen pwòp adrès li (blicpayht.com/comptes, /carte…)
  const [page, setPage] = useState(() => PATH_PAGE[window.location.pathname.replace(/\/+$/, '') || '/'] || 'home');
  useEffect(() => {
    const onPop = () => setPage(PATH_PAGE[window.location.pathname.replace(/\/+$/, '') || '/'] || 'home');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const nav = (p) => {
    setMenu(false); setLangOpen(false);
    const path = PAGE_PATH[p] || '/';
    if (window.location.pathname !== path) window.history.pushState({}, '', path);
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  useEffect(() => {
    const titles = { home: 'BLICPay', plans: t('navPlans'), card: t('navCard'), business: t('navBusiness'), security: t('navSecurity'), help: t('navHelp'), about: t('about'), terms: t('terms'), privacy: t('privacy') };
    document.title = page === 'home' ? 'BLICPay — ' + t('footDesc') : `${titles[page]} · BLICPay`;
  }, [page, lang]);
  const NAV = [['plans', 'navPlans'], ['card', 'navCard'], ['business', 'navBusiness'], ['security', 'navSecurity'], ['help', 'navHelp']];

  // ---- Seksyon yo (chak paj itilize sa l bezwen)
  const heroSec = (<>
      {/* HERO */}
      <section id="top" className="relative overflow-hidden" style={{ background: `radial-gradient(1200px 600px at 85% -10%, rgba(34,211,238,.22), transparent 60%), linear-gradient(165deg, ${C.night} 0%, ${C.navyDeep} 55%, #0E2E66 100%)`, color: '#fff' }}>
        <div className="absolute inset-0 lp2-grid opacity-60" style={{ filter: 'invert(1)', maskImage: 'linear-gradient(180deg, #000 20%, transparent 85%)' }} />
        <div className="absolute -bottom-48 -left-40 w-[560px] h-[560px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(34,211,238,.14), transparent 65%)' }} />
        <div className="relative max-w-6xl mx-auto px-5 pt-14 pb-20 lg:pt-20 lg:pb-28 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border" style={{ borderColor: 'rgba(34,211,238,.35)', background: 'rgba(34,211,238,.1)', color: '#CFF7FD' }}>
                <Sparkles size={14} color={C.cyan} />{t('badge')}
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-5 text-[40px] leading-[1.05] sm:text-[56px] tracking-tight" style={{ ...display, fontWeight: 800 }}>
                {t('h1a')}<br />
                <span style={{ background: `linear-gradient(90deg, ${C.cyan}, #A5F3FC)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{t('h1b')}</span>
              </h1>
            </Reveal>
            <Reveal delay={160}><p className="mt-5 text-lg leading-relaxed max-w-xl" style={{ color: 'rgba(255,255,255,.74)' }}>{t('sub')}</p></Reveal>
            <Reveal delay={240}>
              <div className="mt-8 flex flex-wrap gap-3">
                <button onClick={() => onStart('register')} className="lp2-btn h-12 px-6 rounded-full font-bold flex items-center gap-2" style={{ background: C.cyan, color: C.night, boxShadow: '0 14px 34px -12px rgba(34,211,238,.75)' }}>
                  {t('start')}<ArrowRight size={18} />
                </button>
                <button onClick={() => onStart('login')} className="lp2-btn h-12 px-6 rounded-full font-semibold border text-white" style={{ borderColor: 'rgba(255,255,255,.28)', background: 'rgba(255,255,255,.06)' }}>{t('login')}</button>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm" style={{ color: 'rgba(255,255,255,.7)' }}>
                {[[BadgeCheck, 'trust1'], [Lock, 'trust2'], [ShieldCheck, 'trust3']].map(([Icon, k]) => (
                  <span key={k} className="inline-flex items-center gap-1.5"><Icon size={16} color={C.cyan} />{t(k)}</span>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Vizyèl: telefòn ak aplikasyon BLICPay la */}
          <Reveal delay={200} className="relative flex justify-center lg:justify-end">
            <HeroPhone t={t} />
          </Reveal>
        </div>
      </section>
      </>);
  const servicesSec = (<>
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
                    <span className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.navy})`, boxShadow: '0 10px 22px -10px rgba(20,58,115,.55)' }}><Icon size={22} color="#fff" /></span>
                    {soon && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: '#E0F7FB', color: '#0E7490' }}>{t('soon')}</span>}
                  </div>
                  <h3 className="mt-5 text-lg font-bold" style={display}>{t(`${k}t`)}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: C.muted }}>{t(`${k}d`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      </>);
  const cardSec = (<>
      {/* KAT */}
      <section id="card" className="py-20 lg:py-28 relative overflow-hidden" style={{ background: `radial-gradient(900px 420px at 90% -20%, rgba(34,211,238,.2), transparent 60%), linear-gradient(165deg, ${C.night} 0%, ${C.navyDeep} 55%, #0E2E66 100%)`, color: '#fff' }}>
        <div className="absolute -left-40 -bottom-40 w-[480px] h-[480px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(34,211,238,.2), transparent 65%)' }} />
        <div className="relative max-w-6xl mx-auto px-5 grid lg:grid-cols-2 gap-14 items-center">
          <Reveal>
            <p className="text-sm font-bold uppercase tracking-widest" style={{ color: C.cyan }}>{t('cardEyebrow')}</p>
            <h2 className="mt-3 text-3xl sm:text-[42px] leading-tight tracking-tight" style={{ ...display, fontWeight: 800 }}>{t('cardTitle')}</h2>
            <p className="mt-4 text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,.75)' }}>{t('cardSub')}</p>
            <ul className="mt-7 space-y-3.5">
              {['card1', 'card2', 'card3'].map((k) => (
                <li key={k} className="flex items-start gap-3">
                  <span className="mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(34,211,238,.2)' }}><Check size={14} color="#7DE3FF" /></span>
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
      </>);
  const howSec = (<>
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
                  <span className="absolute -top-4 left-7 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: C.cyan, color: C.night }}>{n + 1}</span>
                  <span className="mt-3 w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#EEF5FD' }}><Icon size={24} color={C.navy} /></span>
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
                <span className="h-11 px-4 rounded-xl bg-white border flex items-center gap-2 text-sm font-semibold" style={{ borderColor: C.border }}><Building2 size={18} color={C.navy} />{t('branch')}</span>
                {[['Unibank', '/logos/unibank-icon.png'], ['Sogebank', '/logos/sogebank-icon.png']].map(([bank, logo]) => (
                  <span key={bank} className="h-11 pl-1.5 pr-3 rounded-xl bg-white border flex items-center gap-2 text-sm" style={{ borderColor: C.border }}>
                    <img src={logo} alt={bank} className="h-8 w-8 rounded-lg" /><span className="font-semibold">{bank}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#E0F7FB', color: '#0E7490' }}>{t('soon')}</span>
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      </>);
  const securitySec = (<>
      {/* SEKIRITE */}
      <section className="py-20 lg:py-28" style={{ background: C.bg }}>
        <div className="max-w-6xl mx-auto px-5 grid lg:grid-cols-[1fr_1.4fr] gap-12 items-start">
          <Reveal>
            <p className="text-sm font-bold uppercase tracking-widest" style={{ color: C.sky }}>{t('secEyebrow')}</p>
            <h2 className="mt-3 text-3xl sm:text-[42px] leading-tight tracking-tight" style={{ ...display, fontWeight: 800 }}>{t('secTitle')}</h2>
            <div className="mt-8 w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.navy})`, boxShadow: '0 20px 40px -16px rgba(20,58,115,.6)' }}>
              <ShieldCheck size={38} color="#fff" />
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 gap-5">
            {[[ScanLine, 'sec1'], [Lock, 'sec2'], [BadgeCheck, 'sec3'], [ShieldCheck, 'sec4']].map(([Icon, k], n) => (
              <Reveal key={k} delay={n * 80}>
                <div className="lp2-card rounded-3xl bg-white border p-6 h-full" style={{ borderColor: C.border }}>
                  <span className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.navy})` }}><Icon size={20} color="#fff" /></span>
                  <h3 className="mt-4 font-bold" style={display}>{t(`${k}t`)}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed" style={{ color: C.muted }}>{t(`${k}d`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      </>);
  const plansSec = (<>
      {/* KONT YO — PÈSONÈL / ANTREPRIZ */}
      <section id="plans" className={page === 'plans' ? 'pt-10 pb-20 lg:pt-14 lg:pb-28' : 'py-20 lg:py-28'} style={{ background: C.bg }}>
        <div className="max-w-6xl mx-auto px-5">
          {page !== 'plans' && <Reveal className="text-center max-w-2xl mx-auto">
            <p className="text-sm font-bold uppercase tracking-widest" style={{ color: C.sky }}>{t('plEyebrow')}</p>
            <h2 className="mt-3 text-3xl sm:text-5xl leading-tight tracking-tight" style={{ ...display, fontWeight: 800 }}>{t('plTitle')}</h2>
            <p className="mt-4 text-lg" style={{ color: C.muted }}>{t('plSub')}</p>
          </Reveal>}

          <div className={`${page === 'plans' ? 'mt-2' : 'mt-14'} grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7 max-w-6xl mx-auto items-stretch`}>
            {[
              { k: 'personal', tag: 'plTagP', name: 'plPersonal', who: 'plPersonalFor', amount: null, ideal: 'plIdealP', head: 'plIncl', items: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'], cta: 'plOpenPersonal', action: 'register', icon: PLAN_ICON.personal, dark: false },
              { k: 'pro', tag: 'plTagPro', name: 'plPro', who: 'plProFor', amount: '100', ideal: 'plIdealPro', head: 'plPlusP', items: ['pr1', 'pr2', 'pr3', 'pr4', 'pr5', 'pr6'], cta: 'plOpenPro', action: 'register-pro', icon: PLAN_ICON.pro, dark: true },
              { k: 'business', tag: 'plTagB', name: 'plBusiness', who: 'plBusinessFor', amount: '500', ideal: 'plIdealB', head: 'plPlusPro', items: ['b2', 'b3', 'b4', 'b5', 'b6', 'b7'], cta: 'plOpenBusiness', action: 'register-business', icon: PLAN_ICON.business, dark: false },
            ].map((pl, n) => {
              const dk = pl.dark;
              const sub = dk ? 'rgba(255,255,255,.68)' : C.muted;
              const line = dk ? 'rgba(255,255,255,.12)' : C.border;
              return (
              <Reveal key={pl.k} delay={n * 120} className={dk ? 'lg:-my-4' : ''}>
                <div className="lp2-plan relative h-full rounded-[30px] flex flex-col overflow-hidden" style={dk
                  ? { background: `linear-gradient(165deg, ${C.navyDeep} 0%, #0E2E66 55%, #154C9C 100%)`, color: '#fff', boxShadow: '0 40px 80px -36px rgba(10,31,69,.75)', outline: '1.5px solid rgba(255,200,90,.55)', outlineOffset: -1.5 }
                  : { background: '#fff', border: `1px solid ${C.border}`, boxShadow: '0 1px 2px rgba(11,27,51,.04)' }}>
                  {/* liy koulè anwo */}
                  <div className="h-1.5 w-full" style={{ background: PLAN_GRAD[pl.k] }} />
                  {dk && <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,200,90,.22), transparent 70%)' }} />}
                  <div className="relative p-7 lg:p-8 flex flex-col flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: PLAN_GRAD[pl.k], boxShadow: PLAN_SHADOW[pl.k] }}><pl.icon size={23} color="#fff" strokeWidth={1.8} /></span>
                      {dk
                        ? <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wider rounded-full px-3 py-1.5" style={{ background: PLAN_GRAD.pro, color: '#3A2300' }}><Sparkles size={13} />{t('plPopular')}</span>
                        : <span className="text-[11.5px] font-bold uppercase tracking-wider rounded-full px-3 py-1.5" style={{ background: '#F1F5FA', color: C.muted }}>{t(pl.tag)}</span>}
                    </div>
                    <h3 className="mt-5 text-[26px] leading-tight" style={{ ...display, fontWeight: 800 }}>{t(pl.name)}</h3>
                    <p className="mt-1.5 text-[14.5px] leading-snug min-h-[42px]" style={{ color: sub }}>{t(pl.who)}</p>

                    <div className="mt-6 flex items-end gap-2">
                      {pl.amount ? (
                        <>
                          <span className="text-[52px] leading-none tracking-tight" style={{ ...display, fontWeight: 800 }}>{pl.amount}<span className="text-[26px] align-top ml-1" style={{ fontWeight: 700 }}>$</span></span>
                          <span className="pb-1.5 text-sm leading-tight" style={{ color: sub }}>US<br />{t('plOnce')}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[52px] leading-none tracking-tight" style={{ ...display, fontWeight: 800 }}>0<span className="text-[26px] align-top ml-1" style={{ fontWeight: 700 }}>$</span></span>
                          <span className="pb-1.5 text-sm leading-tight" style={{ color: sub }}>{t('plFree')}<br />{t('plForever')}</span>
                        </>
                      )}
                    </div>
                    <p className="mt-2 text-[13px] flex items-center gap-1.5" style={{ color: sub }}><BadgeCheck size={14} color={dk ? '#FFC85A' : C.mint} />{t('plNoSub')}</p>

                    <button onClick={() => onStart(pl.action)} className="lp2-btn mt-6 h-12 rounded-2xl font-bold inline-flex items-center justify-center gap-2 text-[15px]"
                      style={dk ? { background: PLAN_GRAD.pro, color: '#2A1A00', boxShadow: '0 12px 24px -12px rgba(232,144,28,.9)' } : pl.k === 'business' ? { background: C.navyDeep, color: '#fff' } : { background: '#fff', color: C.navy, border: `1.5px solid ${C.navy}` }}>
                      {t(pl.cta)}<ArrowRight size={18} />
                    </button>

                    <p className="mt-6 text-[13px] font-semibold rounded-xl px-3.5 py-2.5 leading-snug" style={dk ? { background: 'rgba(255,255,255,.08)', color: '#E6F4FB' } : { background: '#F4F8FD', color: C.navy }}>{t(pl.ideal)}</p>

                    <div className="mt-6 pt-6" style={{ borderTop: `1px solid ${line}` }}>
                      <p className="text-[12px] font-bold uppercase tracking-widest" style={{ color: dk ? '#FFC85A' : C.sky }}>{t(pl.head)}</p>
                      <ul className="mt-4 space-y-3.5">
                        {pl.items.map((it) => (
                          <li key={it} className="flex items-start gap-3 text-[14.5px] leading-snug">
                            <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-px" style={{ background: dk ? 'rgba(255,200,90,.16)' : pl.k === 'business' ? '#E8EEF8' : '#E5F4FC' }}>
                              <Check size={12.5} color={dk ? '#FFC85A' : pl.k === 'business' ? C.navyDeep : '#1B78D6'} strokeWidth={3.2} />
                            </span>
                            <span style={{ color: dk ? 'rgba(255,255,255,.92)' : C.ink }}>{t(it)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </Reveal>
              );
            })}
          </div>

          {/* Bann konfyans */}
          <Reveal>
            <div className="mt-12 max-w-6xl mx-auto grid sm:grid-cols-3 gap-3">
              {[[BadgeCheck, 'tr1', 'tr1s', `linear-gradient(135deg, ${C.cyan}, ${C.navy})`], [Wallet, 'tr2', 'tr2s', `linear-gradient(135deg, ${C.cyan}, ${C.navy})`], [ShieldCheck, 'tr3', 'tr3s', `linear-gradient(135deg, ${C.cyan}, ${C.navy})`]].map(([Ic, a, b, g]) => (
                <div key={a} className="flex items-start gap-3 rounded-2xl bg-white p-4" style={{ border: `1px solid ${C.border}` }}>
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: g }}><Ic size={18} color="#fff" /></span>
                  <div><p className="text-[14.5px] font-bold" style={{ ...display }}>{t(a)}</p><p className="text-[13px] mt-0.5 leading-snug" style={{ color: C.muted }}>{t(b)}</p></div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal>
            <div className="mt-16 max-w-6xl mx-auto">
              <h3 className="text-2xl sm:text-3xl text-center tracking-tight" style={{ ...display, fontWeight: 800 }}>{t('cmpTitle')}</h3>
              <PlanCompare t={t} onStart={onStart} />
            </div>
            <p className="mt-4 max-w-6xl mx-auto text-xs leading-relaxed" style={{ color: C.muted }}>{t('plNote')}</p>
          </Reveal>
        </div>
      </section>
      </>);
  const bizSec = (<>
      {/* ANTREPRIZ */}
      <section id="business" className="py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-5">
          <Reveal>
            <div className="rounded-[32px] p-8 sm:p-12 grid lg:grid-cols-2 gap-10 items-center border" style={{ borderColor: C.border, background: 'linear-gradient(135deg, #FFFFFF 0%, #EEF6FD 100%)' }}>
              <div>
                <p className="text-sm font-bold uppercase tracking-widest" style={{ color: C.amber }}>{t('bizEyebrow')}</p>
                <h2 className="mt-3 text-3xl sm:text-4xl leading-tight tracking-tight" style={{ ...display, fontWeight: 800 }}>{t('bizTitle')}</h2>
                <p className="mt-4 leading-relaxed" style={{ color: C.muted }}>{t('bizSub')}</p>
                <button onClick={() => onStart('register-business')} className="lp2-btn mt-7 h-12 px-6 rounded-full font-bold text-white inline-flex items-center gap-2" style={{ background: C.navy }}>
                  {t('bizCta')}<ArrowRight size={18} />
                </button>
              </div>
              <div className="space-y-3">
                {[[QrCode, 'biz1'], [Zap, 'biz2'], [Smartphone, 'biz3']].map(([Icon, k]) => (
                  <div key={k} className="flex items-center gap-4 rounded-2xl bg-white border p-4" style={{ borderColor: C.border }}>
                    <span className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.navy})` }}><Icon size={20} color="#fff" /></span>
                    <span className="font-semibold">{t(k)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      </>);
  const faqSec = (<>
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
      </>);
  const ctaSec = (<>
      {/* CTA */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-5">
          <Reveal>
            <div className="rounded-[32px] px-8 py-14 text-center text-white relative overflow-hidden" style={{ background: `radial-gradient(700px 300px at 50% -20%, rgba(34,211,238,.35), transparent 70%), linear-gradient(160deg, ${C.night}, ${C.navyDeep} 60%, #0E2E66)` }}>
              <div className="absolute inset-0 opacity-20 lp2-grid" />
              <h2 className="relative text-3xl sm:text-4xl tracking-tight" style={{ ...display, fontWeight: 800 }}>{t('ctaTitle')}</h2>
              <p className="relative mt-3 opacity-85">{t('ctaSub')}</p>
              <button onClick={() => onStart('register')} className="lp2-btn relative mt-8 h-12 px-7 rounded-full font-bold inline-flex items-center gap-2" style={{ background: C.cyan, color: C.night, boxShadow: '0 14px 34px -12px rgba(34,211,238,.75)' }}>
                {t('signup')}<ArrowRight size={18} />
              </button>
            </div>
          </Reveal>
        </div>
      </section>
      </>);

  // ---- Tèt paj (paj entèn yo)
  const PageHero = ({ title, sub, eyebrow }) => (
    <section className="relative overflow-hidden" style={{ background: `radial-gradient(900px 420px at 90% -20%, rgba(34,211,238,.2), transparent 60%), linear-gradient(165deg, ${C.night} 0%, ${C.navyDeep} 55%, #0E2E66 100%)`, color: '#fff' }}>
      <div className="absolute inset-0 opacity-[.12] lp2-grid" style={{ filter: 'invert(1)' }} />
      <div className="absolute -right-32 -top-32 w-[420px] h-[420px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(34,211,238,.25), transparent 65%)' }} />
      <div className="relative max-w-6xl mx-auto px-5 pt-12 pb-14 lg:pt-16 lg:pb-20">
        <div className="flex items-center gap-2 text-[13px]" style={{ color: 'rgba(255,255,255,.65)' }}>
          <button onClick={() => nav('home')} className="hover:text-white">{t('navHome')}</button>
          <ChevronRight size={14} />
          <span className="text-white font-semibold">{eyebrow || title}</span>
        </div>
        <h1 className="mt-4 text-[36px] sm:text-[52px] leading-[1.05] tracking-tight max-w-3xl" style={{ ...display, fontWeight: 800 }}>{title}</h1>
        {sub && <p className="mt-4 text-lg leading-relaxed max-w-2xl" style={{ color: 'rgba(255,255,255,.78)' }}>{sub}</p>}
      </div>
    </section>
  );

  // ---- Aperçu sou akèy la
  const SeeMore = ({ to, label, light }) => (
    <button onClick={() => nav(to)} className="lp2-btn mt-8 h-12 px-6 rounded-full font-bold inline-flex items-center gap-2"
      style={light ? { background: '#fff', color: C.navy } : { background: C.navy, color: '#fff' }}>{label}<ArrowRight size={18} /></button>
  );
  const plansTeaser = (
    <section className="py-20 lg:py-28" style={{ background: C.bg }}>
      <div className="max-w-6xl mx-auto px-5">
        <Reveal className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-widest" style={{ color: C.sky }}>{t('plEyebrow')}</p>
            <h2 className="mt-3 text-3xl sm:text-[42px] leading-tight tracking-tight" style={{ ...display, fontWeight: 800 }}>{t('tzPlansT')}</h2>
          </div>
          <button onClick={() => nav('plans')} className="text-[15px] font-bold inline-flex items-center gap-1.5 shrink-0" style={{ color: C.navy }}>{t('tzComparePlans')}<ArrowRight size={17} /></button>
        </Reveal>
        <div className="mt-10 grid md:grid-cols-3 gap-5">
          {[['personal', 'plPersonal', 'plPersonalFor', 'plFree'], ['pro', 'plPro', 'plProFor', 'plProPrice'], ['business', 'plBusiness', 'plBusinessFor', 'plBizPrice']].map(([k, name, who, price], n) => (
            <Reveal key={k} delay={n * 90}>
              <button onClick={() => nav('plans')} className="lp2-card w-full h-full text-left rounded-3xl p-6 flex flex-col" style={k === 'pro'
                ? { background: `linear-gradient(160deg, ${C.navyDeep}, #154C9C)`, color: '#fff', outline: '1.5px solid rgba(255,200,90,.55)', outlineOffset: -1.5 }
                : { background: '#fff', border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between">
                  <span className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: PLAN_GRAD[k], boxShadow: PLAN_SHADOW[k] }}>{React.createElement(PLAN_ICON[k], { size: 21, color: '#fff', strokeWidth: 1.8 })}</span>
                  <span className="text-lg" style={{ ...display, fontWeight: 800 }}>{t(price)}</span>
                </div>
                <p className="mt-5 text-xl" style={{ ...display, fontWeight: 800 }}>{t(name)}</p>
                <p className="mt-1.5 text-sm leading-snug flex-1" style={{ color: k === 'pro' ? 'rgba(255,255,255,.72)' : C.muted }}>{t(who)}</p>
                <span className="mt-5 text-sm font-bold inline-flex items-center gap-1.5" style={{ color: k === 'pro' ? '#FFC85A' : C.navy }}>{t('tzSee')}<ArrowRight size={15} /></span>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
  const cardTeaser = (
    <section className="relative overflow-hidden" style={{ background: `radial-gradient(900px 420px at 90% -20%, rgba(34,211,238,.2), transparent 60%), linear-gradient(165deg, ${C.night} 0%, ${C.navyDeep} 55%, #0E2E66 100%)`, color: '#fff' }}>
      <div className="absolute -left-40 -bottom-40 w-[480px] h-[480px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(34,211,238,.2), transparent 65%)' }} />
      <div className="relative max-w-6xl mx-auto px-5 py-20 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
        <Reveal>
          <p className="text-sm font-bold uppercase tracking-widest" style={{ color: C.cyan }}>{t('cardEyebrow')}</p>
          <h2 className="mt-3 text-3xl sm:text-[42px] leading-tight tracking-tight" style={{ ...display, fontWeight: 800 }}>{t('cardTitle')}</h2>
          <p className="mt-4 text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,.75)' }}>{t('cardSub')}</p>
          <SeeMore to="card" label={t('tzCardBtn')} light />
        </Reveal>
        <Reveal delay={150} className="relative h-[260px] sm:h-[320px]">
          <CardImg src="/cards/card-ocean.jpg" className="lp2-float w-[58%] left-[4%] top-[6%]" style={{ '--r': '-8deg', transform: 'rotate(-8deg)' }} />
          <CardImg src="/cards/card-shield.jpg" className="lp2-float w-[62%] right-[4%] top-[26%]" style={{ '--r': '6deg', transform: 'rotate(6deg)', animationDelay: '.8s' }} />
        </Reveal>
      </div>
    </section>
  );
  const securityTeaser = (
    <section className="py-20 lg:py-24">
      <div className="max-w-6xl mx-auto px-5">
        <Reveal>
          <div className="rounded-[32px] p-8 sm:p-12 grid lg:grid-cols-[1fr_1.3fr] gap-10 items-center border" style={{ borderColor: C.border, background: 'linear-gradient(135deg, #FFFFFF 0%, #EEF6FD 100%)' }}>
            <div>
              <p className="text-sm font-bold uppercase tracking-widest" style={{ color: C.sky }}>{t('secEyebrow')}</p>
              <h2 className="mt-3 text-3xl sm:text-4xl leading-tight tracking-tight" style={{ ...display, fontWeight: 800 }}>{t('secTitle')}</h2>
              <SeeMore to="security" label={t('tzSecBtn')} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[[ScanLine, 'sec1t'], [Lock, 'sec2t'], [BadgeCheck, 'sec3t'], [ShieldCheck, 'sec4t']].map(([Icon, k]) => (
                <div key={k} className="flex items-center gap-3 rounded-2xl bg-white border p-4" style={{ borderColor: C.border }}>
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.navy})` }}><Icon size={18} color="#fff" /></span>
                  <span className="font-semibold text-[15px]">{t(k)}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
  const bizTeaser = (
    <section className="pb-2">
      <div className="max-w-6xl mx-auto px-5">
        <Reveal>
          <div className="rounded-[32px] p-8 sm:p-10 flex flex-col md:flex-row md:items-center gap-6 md:justify-between" style={{ background: 'linear-gradient(135deg, #FFF8EC, #FFEFD3)', border: '1px solid #F7DDB0' }}>
            <div className="flex items-start gap-4">
              <span className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: PLAN_GRAD.pro, boxShadow: PLAN_SHADOW.pro }}><Store size={22} color="#fff" /></span>
              <div>
                <p className="text-sm font-bold uppercase tracking-widest" style={{ color: '#B86E0B' }}>{t('bizEyebrow')}</p>
                <h3 className="mt-1.5 text-2xl tracking-tight" style={{ ...display, fontWeight: 800 }}>{t('bizTitle')}</h3>
              </div>
            </div>
            <button onClick={() => nav('business')} className="lp2-btn h-12 px-6 rounded-full font-bold inline-flex items-center gap-2 shrink-0" style={{ background: C.navyDeep, color: '#fff' }}>{t('tzBizBtn')}<ArrowRight size={18} /></button>
          </div>
        </Reveal>
      </div>
    </section>
  );

  // ---- Paj Kat: kote w ka itilize l
  const whereSec = (
    <section className="py-20 lg:py-24">
      <div className="max-w-6xl mx-auto px-5">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-widest" style={{ color: C.sky }}>{t('whereT')}</p>
          <h2 className="mt-3 text-3xl sm:text-[40px] leading-tight tracking-tight" style={{ ...display, fontWeight: 800 }}>{t('whereH')}</h2>
          <p className="mt-3 text-lg" style={{ color: C.muted }}>{t('whereS')}</p>
        </Reveal>
        <Reveal delay={120}>
          <div className="mt-10 flex flex-wrap gap-3">
            {['Amazon', 'Netflix', 'Shein', 'Temu', 'eBay', 'Spotify', 'AliExpress', 'Google Play', 'App Store', 'YouTube Premium', 'Canva', 'ChatGPT'].map((m) => (
              <span key={m} className="h-12 px-5 rounded-2xl bg-white border flex items-center text-[15px] font-bold" style={{ borderColor: C.border, ...display }}>{m}</span>
            ))}
          </div>
          <p className="mt-5 text-xs" style={{ color: C.muted }}>{t('whereNote')}</p>
        </Reveal>
      </div>
    </section>
  );

  // ---- Paj Èd: kontak
  const contactSec = (
    <section className="pb-20 lg:pb-24" style={{ background: C.bg }}>
      <div className="max-w-3xl mx-auto px-5">
        <Reveal>
          <div className="rounded-[28px] bg-white border p-7 sm:p-9" style={{ borderColor: C.border }}>
            <h2 className="text-2xl tracking-tight" style={{ ...display, fontWeight: 800 }}>{t('helpContactT')}</h2>
            <p className="mt-2 text-[15px]" style={{ color: C.muted }}>{t('supportBody')}</p>
            <div className="mt-6 grid sm:grid-cols-2 gap-3">
              <a href="https://wa.me/13073460474" target="_blank" rel="noopener noreferrer" className="lp2-card flex items-center gap-3 rounded-2xl border p-4" style={{ borderColor: C.border }}>
                <span className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.navy})` }}><Smartphone size={19} color="#fff" /></span>
                <span><span className="block text-[15px] font-bold">{t('whatsapp')}</span><span className="block text-xs" style={{ color: C.muted }}>+1 307 346 0474</span></span>
              </a>
              <a href="tel:+13073460474" className="lp2-card flex items-center gap-3 rounded-2xl border p-4" style={{ borderColor: C.border }}>
                <span className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.navy})` }}><Phone size={19} color="#fff" /></span>
                <span><span className="block text-[15px] font-bold">{t('call')}</span><span className="block text-xs" style={{ color: C.muted }}>+1 307 346 0474</span></span>
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );

  // ---- Paj tèks (konsènan nou, kondisyon, konfidansyalite)
  const DocSec = ({ body }) => (
    <section className="py-16 lg:py-20">
      <div className="max-w-3xl mx-auto px-5">
        <div className="rounded-[28px] bg-white border p-7 sm:p-10" style={{ borderColor: C.border }}>
          {String(body).split(/\n\n/).map((para, n) => {
            const [first, ...rest] = para.split('\n');
            const isHead = rest.length > 0 && /^\d+\./.test(first);
            return isHead ? (
              <div key={n} className={n ? 'mt-7' : ''}>
                <h2 className="text-lg font-bold" style={display}>{first}</h2>
                <p className="mt-2 text-[15px] leading-relaxed" style={{ color: '#3B4A5E' }}>{rest.join(' ')}</p>
              </div>
            ) : <p key={n} className={`${n ? 'mt-5' : ''} text-[15.5px] leading-relaxed`} style={{ color: '#3B4A5E' }}>{para}</p>;
          })}
        </div>
      </div>
    </section>
  );

  const PAGE_CONTENT = {
    home: <>{heroSec}{servicesSec}{howSec}{plansTeaser}{cardTeaser}{securityTeaser}{bizTeaser}{ctaSec}</>,
    plans: <><PageHero title={t('phPlansT')} sub={t('phPlansS')} eyebrow={t('navPlans')} />{plansSec}{ctaSec}</>,
    card: <>{cardSec}{whereSec}{ctaSec}</>,
    business: <><PageHero title={t('phBizT')} sub={t('phBizS')} eyebrow={t('navBusiness')} />{bizSec}{plansSec}</>,
    security: <><PageHero title={t('phSecT')} sub={t('phSecS')} eyebrow={t('navSecurity')} />{securitySec}{ctaSec}</>,
    help: <><PageHero title={t('phHelpT')} sub={t('phHelpS')} eyebrow={t('navHelp')} />{faqSec}{contactSec}</>,
    about: <><PageHero title={t('about')} sub={t('phAboutS')} /><DocSec body={t('aboutBody') + '\n\n' + t('disclaimer')} />{ctaSec}</>,
    terms: <><PageHero title={t('terms')} sub={t('phLegalS')} /><DocSec body={t('termsBody')} /></>,
    privacy: <><PageHero title={t('privacy')} sub={t('phLegalS')} /><DocSec body={t('privacyBody')} /></>,
  };

  return (
    <div style={{ background: '#fff', color: C.ink, overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');
        html { scroll-behavior: smooth; }
        .lp2-btn { transition: transform .18s ease, box-shadow .18s ease, filter .18s ease; }
        .lp2-btn:hover { transform: translateY(-2px); filter: brightness(1.05); }
        .lp2-card { transition: transform .25s ease, box-shadow .25s ease; }
        .lp2-plan { transition: transform .25s ease, box-shadow .25s ease; }
        .lp2-plan:hover { transform: translateY(-6px); }
        .lp2-card:hover { transform: translateY(-4px); box-shadow: 0 18px 40px -18px rgba(11,27,51,.25); }
        @keyframes lp2Float { 0%,100% { transform: translateY(0) rotate(var(--r)); } 50% { transform: translateY(-12px) rotate(var(--r)); } }
        .lp2-float { animation: lp2Float 7s ease-in-out infinite; }
        @keyframes lp2Bob { 0%,100% { transform: translate3d(0,0,0); } 50% { transform: translate3d(0,-10px,0); } }
        .lp2-bob { animation: lp2Bob 5.5s ease-in-out infinite; }
        .lp2-phone { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility; font-variant-numeric: tabular-nums; }
        .lp2-phone img { image-rendering: -webkit-optimize-contrast; }
        @media (min-width: 1280px) { .lp2-phone { zoom: 1.1; } }
        .lp2-grid { background-image: radial-gradient(rgba(20,58,115,.08) 1px, transparent 1px); background-size: 22px 22px; }
      `}</style>

      {/* NAV */}
      <header className="sticky top-0 z-40 border-b" style={{ background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(12px)', borderColor: C.border }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-5 h-16 flex items-center gap-3 sm:gap-6">
          <a href="/" className="flex items-center gap-2 shrink-0" onClick={(e) => { e.preventDefault(); nav('home'); }}>
            <img src="/brand/logo-full.png" alt="BLICPay" className="h-[34px] sm:h-[42px] w-auto" />
          </a>
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium" style={{ color: C.muted }}>
            {NAV.map(([id, k]) => (
              <a key={id} href={PAGE_PATH[id]} onClick={(e) => { e.preventDefault(); nav(id); }} className="relative py-5 hover:text-[#0B1B33] transition-colors" style={page === id ? { color: C.ink, fontWeight: 700 } : undefined}>
                {t(k)}
                {page === id && <span className="absolute left-0 right-0 -bottom-px h-[2.5px] rounded-full" style={{ background: C.cyan }} />}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <div className="relative">
              <button onClick={() => setLangOpen((v) => !v)} className="h-10 w-10 sm:w-auto sm:px-3 rounded-full border flex items-center justify-center gap-1.5 text-sm font-semibold" style={{ borderColor: C.border }} aria-label="Language">
                <Globe size={16} /><span className="uppercase hidden sm:inline">{lang}</span>
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
            <button onClick={() => onStart('login')} className="hidden sm:block h-10 px-4 rounded-full text-sm font-semibold" style={{ color: C.navy }}>{t('login')}</button>
            <button onClick={() => onStart('register')} className="lp2-btn h-10 px-4 sm:px-5 rounded-full text-[13px] sm:text-sm font-bold text-white whitespace-nowrap" style={{ background: C.navyDeep }}>{t('signup')}</button>
            <button onClick={() => setMenu((v) => !v)} className="lg:hidden w-10 h-10 shrink-0 rounded-full border flex items-center justify-center" style={{ borderColor: C.border }} aria-label="Menu">
              {menu ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {menu && (
          <div className="lg:hidden border-t px-5 py-3 flex flex-col" style={{ borderColor: C.border }}>
            {[['home', 'navHome'], ...NAV].map(([id, k]) => (
              <a key={id} href={PAGE_PATH[id]} onClick={(e) => { e.preventDefault(); nav(id); }} className="flex items-center justify-between py-3 font-semibold border-b last:border-0" style={{ borderColor: C.border, color: page === id ? C.navy : C.ink }}>
                {t(k)}<ChevronRight size={16} color={page === id ? C.sky : '#B8C1CF'} />
              </a>
            ))}
            <button onClick={() => onStart('login')} className="sm:hidden mt-3 h-11 rounded-full border font-semibold" style={{ borderColor: C.border, color: C.navy }}>{t('login')}</button>
          </div>
        )}
      </header>

      <main key={page}>{PAGE_CONTENT[page] || PAGE_CONTENT.home}</main>

      {/* FOOTER */}
      <footer style={{ background: C.night, color: '#fff' }}>
        <div className="max-w-6xl mx-auto px-5 pt-14 pb-10 grid sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10">
          <div>
            <span className="inline-flex rounded-2xl bg-white px-3 py-2"><img src="/brand/logo-full.png" alt="BLICPay" style={{ height: 40, width: 'auto' }} /></span>
            <p className="mt-4 text-sm leading-relaxed max-w-xs" style={{ color: 'rgba(255,255,255,.7)' }}>{t('footDesc')}</p>
            <div className="mt-5 flex gap-2">
              <a href="https://wa.me/13073460474" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,.08)' }}><Smartphone size={17} /></a>
              <a href="tel:+13073460474" aria-label={t('call')} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,.08)' }}><Phone size={17} /></a>
            </div>
          </div>
          {[
            ['footProducts', [['plans', 'navPlans'], ['card', 'navCard'], ['business', 'navBusiness'], ['security', 'navSecurity']]],
            ['footCompany', [['about', 'about'], ['help', 'navHelp']]],
            ['footLegal', [['terms', 'terms'], ['privacy', 'privacy']]],
          ].map(([h, links]) => (
            <div key={h}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: C.cyan }}>{t(h)}</p>
              <div className="mt-4 flex flex-col gap-2.5 text-sm items-start">
                {links.map(([id, k]) => <a key={id} href={PAGE_PATH[id]} onClick={(e) => { e.preventDefault(); nav(id); }} style={{ color: 'rgba(255,255,255,.82)' }} className="hover:text-white">{t(k)}</a>)}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t" style={{ borderColor: 'rgba(255,255,255,.1)' }}>
          <div className="max-w-6xl mx-auto px-5 py-6 text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,.55)' }}>
            <p>{t('disclaimer')}</p>
            <p className="mt-2">© {new Date().getFullYear()} BLICPAY LLC. {t('rights')}</p>
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
