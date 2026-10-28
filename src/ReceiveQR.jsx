// Kòd QR pèsonèl pou yon kliyan resevwa lajan (menm fòma ak app mobil la:
// blicpay://pay?to=BP-xxxxxx&amount=...). Moun k ap peye a eskane l ak app BLICPay li.
import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, Copy, Share2, UserCircle2 } from 'lucide-react';

const L = {
  title: ['Resevwa lajan', 'Recevoir de l’argent', 'Receive money'],
  body: ['Moun k ap peye w la eskane kòd sa a ak app BLICPay li.', 'La personne qui vous paie scanne ce code avec son app BLICPay.', 'The person paying you scans this code with their BLICPay app.'],
  tag: ['Kont BLICPay', 'Compte BLICPay', 'BLICPay account'],
  amount: ['Montan (opsyonèl)', 'Montant (facultatif)', 'Amount (optional)'],
  download: ['Telechaje', 'Télécharger', 'Download'],
  copy: ['Kopye ID', 'Copier l’ID', 'Copy ID'],
  share: ['Pataje', 'Partager', 'Share'],
  copied: ['ID kopye.', 'ID copié.', 'ID copied.'],
  shareText: ['Peye {name} ak BLICPay — ID: {id}', 'Payez {name} avec BLICPay — ID : {id}', 'Pay {name} with BLICPay — ID: {id}'],
};
const IDX = { ht: 0, fr: 1, en: 2 };

const NAVY = '#143A73', DEEP = '#0E2A55', MUTED = '#6B7684', BORDER = '#E6E9F0', BG = '#F4F6FA';

export default function ReceiveQR({ user, lang = 'ht', onClose, flash }) {
  const i = IDX[lang] ?? 0;
  const t = (k) => L[k][i];
  const [amount, setAmount] = useState('');
  const [qr, setQr] = useState('');
  const id = user?.clientId || '';
  const n = Math.round(Number(amount) || 0);
  const link = `blicpay://pay?to=${encodeURIComponent(id)}${n > 0 ? `&amount=${n}` : ''}`;

  useEffect(() => {
    if (!id) return;
    QRCode.toDataURL(link, { width: 520, margin: 1, color: { dark: DEEP, light: '#FFFFFF' } }).then(setQr).catch(() => setQr(''));
  }, [link, id]);

  const shareText = t('shareText').replace('{name}', user?.fullName || '').replace('{id}', id) + (n ? ` — ${n} HTG` : '');

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center" style={{ background: 'rgba(11,27,51,.45)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 max-h-[92vh] overflow-y-auto" style={{ background: '#fff' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{t('title')}</h3>
          <button onClick={onClose} aria-label="Fèmen" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: BG }}><X size={17} /></button>
        </div>
        <div className="rounded-3xl p-5 text-center border" style={{ borderColor: BORDER }}>
          <img src="/brand/logo-full.png" alt="BLICPay" className="h-7 mx-auto" />
          <p className="font-bold text-lg mt-3">{user?.fullName}</p>
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full mt-1" style={{ background: '#E6F6FD', color: NAVY }}>
            <UserCircle2 size={13} />{t('tag')}
          </span>
          {qr ? <img src={qr} alt="QR" className="w-52 h-52 mx-auto mt-4" /> : <div className="w-52 h-52 mx-auto mt-4" />}
          <p className="mt-3 font-bold tracking-widest" style={{ color: DEEP }}>{id}</p>
          {n > 0 && <p className="text-lg font-bold mt-1" style={{ color: '#1E9E7C' }}>{n.toLocaleString('fr-FR')} HTG</p>}
          <p className="text-xs mt-2" style={{ color: MUTED }}>{t('body')}</p>
        </div>
        <label className="block text-xs font-semibold mt-4 mb-1.5" style={{ color: MUTED }}>{t('amount')}</label>
        <input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))} placeholder="0"
          className="w-full h-11 px-3 rounded-xl border text-sm outline-none" style={{ borderColor: BORDER }} />
        <div className="grid grid-cols-3 gap-2 mt-4">
          <a href={qr || undefined} download={`blicpay-qr-${id}.png`} className="h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 text-white" style={{ background: NAVY }}>
            <Download size={15} />{t('download')}
          </a>
          <button onClick={() => { navigator.clipboard?.writeText(id); flash?.(t('copied')); }} className="h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border" style={{ borderColor: BORDER }}>
            <Copy size={15} />{t('copy')}
          </button>
          <button onClick={() => { if (navigator.share) navigator.share({ text: shareText }).catch(() => {}); else { navigator.clipboard?.writeText(shareText); flash?.(t('copied')); } }}
            className="h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border" style={{ borderColor: BORDER }}>
            <Share2 size={15} />{t('share')}
          </button>
        </div>
      </div>
    </div>
  );
}
