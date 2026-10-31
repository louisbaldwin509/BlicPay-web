// Tablo bò kont ANTREPRIZ sou sit web la (enspire de modèl "Monetra" a, ak
// koulè BLICPay yo). Kont patikilye yo kontinye itilize ansyen tablo bò a.
//
// Done reyèl: /wallet/transactions, /transfers/my, /business/me, /business/types.
// Aksyon yo (depo, retrè, transfè, KYC, paramèt…) reitilize flux ki deja egziste nan App.jsx.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  LayoutGrid, BarChart3, ListOrdered, CreditCard, Building2, Bell, Settings, HelpCircle, LogOut,
  Search, Plus, ArrowDownLeft, ArrowUpRight, Send, QrCode, MoreHorizontal, Globe, Download, Upload,
  FileText, CheckCircle2, AlertCircle, Clock, X, ShieldCheck, Copy, Wallet, TrendingUp, TrendingDown,
  ChevronRight, Lock, RefreshCw, Users, Activity,
} from 'lucide-react';
import { makeT, loc } from './i18n.js';

const K = {
  bg: '#F3F6FB',
  card: '#FFFFFF',
  border: '#E5EAF2',
  ink: '#0B1B33',
  muted: '#6B7684',
  navy: '#143A73',
  navyDeep: '#0E2A55',
  sky: '#29B6E8',
  skySoft: '#E6F6FD',
  mint: '#1E9E7C',
  mintSoft: '#E5F5F0',
  amber: '#D98B1D',
  amberSoft: '#FDF3E3',
  danger: '#D14343',
  dangerSoft: '#FCEBEB',
};

const METHOD_NAMES = { moncash: 'MonCash', natcash: 'NatCash', usdt: 'USDT', zelle: 'Zelle', biwo: null };
const DAY = 86400000;

const fmt = (n) => Math.round(n || 0).toLocaleString('fr-FR').replace(/ /g, ' ');
const htg = (n) => `${fmt(n)} HTG`;
const short = (n) => {
  const a = Math.abs(n);
  if (a >= 1e6) return `${(n / 1e6).toFixed(a >= 1e7 ? 0 : 1)}M`;
  if (a >= 1e3) return `${Math.round(n / 1e3)}k`;
  return String(Math.round(n));
};

function initials(name) {
  return (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}

function statusOf(s) {
  if (s === 'confirmed') return 'confirmed';
  if (s === 'rejected') return 'rejected';
  return 'pending';
}

// ---------------------------------------------------------------------------
// Ti eleman
// ---------------------------------------------------------------------------
function Card({ children, className = '', style }) {
  return (
    <div className={`rounded-3xl border ${className}`} style={{ background: K.card, borderColor: K.border, ...style }}>
      {children}
    </div>
  );
}

function Pct({ value }) {
  if (value === null || !Number.isFinite(value)) return null;
  const up = value >= 0;
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md"
      style={{ background: up ? K.mintSoft : K.dangerSoft, color: up ? K.mint : K.danger }}>
      {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}{up ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
}

function StatusPill({ status, t }) {
  const map = {
    confirmed: [K.mintSoft, K.mint, t('st_confirmed')],
    pending: [K.amberSoft, K.amber, t('st_pending')],
    rejected: [K.dangerSoft, K.danger, t('st_rejected')],
  };
  const [bg, fg, label] = map[status] || map.pending;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full whitespace-nowrap" style={{ background: bg, color: fg }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: fg }} />{label}
    </span>
  );
}

const METHOD_LOGOS = { moncash: '/logos/moncash-icon.png', natcash: '/logos/natcash-icon.png' };

function OpIcon({ kind, method }) {
  const incoming = kind === 'deposit' || kind === 'in';
  const logo = (kind === 'deposit' || kind === 'withdraw') && METHOD_LOGOS[method];
  if (logo) {
    const Arrow = incoming ? ArrowDownLeft : ArrowUpRight;
    return (
      <span className="relative w-9 h-9 shrink-0">
        <img src={logo} alt={method} className="w-9 h-9 rounded-xl object-cover border" style={{ borderColor: K.border }} />
        <span className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white"
          style={{ background: incoming ? K.mint : K.navy, color: '#fff' }}>
          <Arrow size={9} strokeWidth={3} />
        </span>
      </span>
    );
  }
  const Icon = kind === 'in' || kind === 'out' ? (incoming ? ArrowDownLeft : Send) : incoming ? ArrowDownLeft : ArrowUpRight;
  return (
    <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
      style={{ background: incoming ? K.mintSoft : K.skySoft, color: incoming ? K.mint : K.navy }}>
      <Icon size={16} />
    </span>
  );
}

function BizStatusBadge({ status, t }) {
  const map = {
    draft: [K.amberSoft, K.amber, t('status_draft'), AlertCircle],
    submitted: [K.skySoft, K.navy, t('status_submitted'), Clock],
    needs_info: [K.amberSoft, K.amber, t('status_needs_info'), AlertCircle],
    approved: [K.mintSoft, K.mint, t('status_approved'), ShieldCheck],
    rejected: [K.dangerSoft, K.danger, t('status_rejected'), X],
  };
  const [bg, fg, label, Icon] = map[status] || map.draft;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: bg, color: fg }}>
      <Icon size={13} />{label}
    </span>
  );
}

function Modal({ onClose, children, width = 'max-w-md' }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-6" style={{ background: 'rgba(11,27,51,.45)' }} onClick={onClose}>
      <div className={`w-full ${width} rounded-t-3xl sm:rounded-3xl p-6 max-h-[92vh] overflow-y-auto`} style={{ background: K.card }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grafik
// ---------------------------------------------------------------------------
function CashFlowChart({ months, mode, t }) {
  const values = months.map((m) => (mode === 'in' ? m.in : mode === 'out' ? m.out : m.in - m.out));
  const max = Math.max(1, ...values.map(Math.abs));
  const lastWithData = values.reduce((acc, v, i) => (v !== 0 ? i : acc), values.length - 1);
  const [hover, setHover] = useState(null);
  const active = hover ?? lastWithData;
  const ticks = [1, 0.75, 0.5, 0.25, 0];
  return (
    <div className="relative pt-8">
      <div className="flex gap-3">
        <div className="hidden sm:flex flex-col justify-between text-[10px] h-52 pb-6 text-right w-9 shrink-0" style={{ color: K.muted }}>
          {ticks.map((f) => <span key={f}>{short(max * f)}</span>)}
        </div>
        <div className="flex-1 relative h-52">
          <div className="absolute inset-0 bottom-6 flex flex-col justify-between pointer-events-none">
            {ticks.map((f) => <div key={f} className="border-t border-dashed" style={{ borderColor: K.border }} />)}
          </div>
          <div className="absolute inset-0 flex items-end gap-1.5 sm:gap-2.5">
            {months.map((m, i) => {
              const v = values[i];
              const h = Math.max(3, (Math.abs(v) / max) * 100);
              const isActive = i === active;
              const neg = v < 0;
              return (
                <div key={m.key} className="flex-1 h-full flex flex-col items-center justify-end cursor-pointer"
                  onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                  <div className="w-full flex-1 flex items-end relative pb-0">
                    {isActive && (
                      <div className="absolute left-1/2 -translate-x-1/2 z-10 px-2.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap shadow-lg"
                        style={{ bottom: `calc(${h}% + 8px)`, background: K.navyDeep, color: '#fff' }}>
                        {neg ? '−' : ''}{htg(Math.abs(v))}
                      </div>
                    )}
                    <div className="w-full rounded-t-lg sm:rounded-t-xl transition-all"
                      style={{
                        height: `${h}%`,
                        background: isActive
                          ? (neg ? K.danger : `linear-gradient(180deg, ${K.sky}, ${K.navy})`)
                          : neg ? '#F6D5D5' : '#DCEAF7',
                      }} />
                  </div>
                  <span className="h-6 pt-1.5 text-[10px] sm:text-[11px] font-medium" style={{ color: isActive ? K.ink : K.muted }}>{m.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function GroupedBars({ months, t }) {
  const max = Math.max(1, ...months.flatMap((m) => [m.in, m.out]));
  return (
    <div>
      <div className="flex items-end gap-2 sm:gap-3 h-48">
        {months.map((m) => (
          <div key={m.key} className="flex-1 h-full flex flex-col justify-end items-center" title={`${m.label} — ${t('tab_in')}: ${htg(m.in)} • ${t('tab_out')}: ${htg(m.out)}`}>
            <div className="w-full flex items-end justify-center gap-0.5 flex-1">
              <div className="w-1/2 max-w-[14px] rounded-t-md" style={{ height: `${Math.max(2, (m.in / max) * 100)}%`, background: K.navy }} />
              <div className="w-1/2 max-w-[14px] rounded-t-md" style={{ height: `${Math.max(2, (m.out / max) * 100)}%`, background: K.sky }} />
            </div>
            <span className="text-[10px] pt-1.5" style={{ color: K.muted }}>{m.label}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3 text-xs" style={{ color: K.muted }}>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: K.navy }} />{t('tab_in')}</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: K.sky }} />{t('tab_out')}</span>
      </div>
    </div>
  );
}

function BarList({ rows, color, t }) {
  if (!rows.length) return <p className="text-sm py-6 text-center" style={{ color: K.muted }}>{t('an_empty')}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium truncate pr-3">{r.label}</span>
            <span className="font-semibold tabular-nums">{htg(r.value)}</span>
          </div>
          <div className="h-2 rounded-full" style={{ background: K.bg }}>
            <div className="h-2 rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Kat (menm 3 desen ak app mobil la)
// ---------------------------------------------------------------------------
function BizCard({ variant = 'shield', name, number = '**** **** **** ****', small = false }) {
  const img = { ocean: '/cards/card-ocean.jpg', world: '/cards/card-world.jpg', shield: '/cards/card-shield.jpg' }[variant];
  const dark = variant !== 'world';
  return (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-md" style={{ aspectRatio: '1.586', backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className={`absolute inset-x-0 bottom-0 ${small ? 'p-3' : 'p-4'}`} style={{ color: dark ? '#fff' : K.navyDeep }}>
        <p className={`${small ? 'text-xs' : 'text-sm'} font-mono tracking-widest opacity-90`}>{number}</p>
        <p className={`${small ? 'text-[11px]' : 'text-xs'} font-semibold uppercase tracking-wide mt-1 truncate`}>{name}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Konpozan prensipal
// ---------------------------------------------------------------------------
function DashboardPage({ ctx }) {
  const { t, lang, user, token, apiFetch, flash, balance, ops, months, stats, recentPeople, types, biz, profile, bizStatus, approved, bizName, loading, load, search, setSearch, setPage, setShowReceive, describe, dateFmt, timeFmt, hello, firstName, isIn, isOut, pageHeader, onDeposit, onWithdraw, onTransfer, onKyc, onSettings, onSupport, onChangePassword, onLogout } = ctx;
  const [mode, setMode] = useState('in');
  const recent = ops.slice(0, 6);
  return (
    <>
      {pageHeader(
        <>{hello}, {firstName} <span className="inline-block">👋</span></>,
        t('subtitle'),
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: K.muted }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') setPage('activity'); }}
              placeholder={t('search')} className="w-full h-11 pl-10 pr-3 rounded-full border text-sm outline-none focus:ring-2"
              style={{ borderColor: K.border, background: K.card }} />
          </div>
          <button onClick={load} className="w-11 h-11 rounded-full border flex items-center justify-center shrink-0" style={{ borderColor: K.border, background: K.card }} aria-label="refresh">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>,
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Kolòn goch */}
        <div className="lg:col-span-8 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Pòtfèy */}
            <div className="md:col-span-5 rounded-3xl p-5 text-white relative overflow-hidden" style={{ background: `linear-gradient(145deg, ${K.navy} 0%, ${K.navyDeep} 100%)` }}>
              <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full opacity-20" style={{ background: K.sky }} />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold">{t('wallet')}</p>
                  <p className="text-[11px] opacity-70">{t('wallet_sub')}</p>
                </div>
                <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,.12)' }}><Wallet size={17} /></span>
              </div>
              <p className="relative text-[30px] font-bold mt-6 tracking-tight tabular-nums">{fmt(balance)} <span className="text-base font-semibold opacity-70">HTG</span></p>
              <div className="relative mt-2 flex items-center gap-2 text-xs">
                <BizStatusBadge status={bizStatus} t={t} />
              </div>
              <button onClick={onDeposit} className="relative mt-5 w-full h-11 rounded-2xl text-sm font-bold flex items-center justify-center gap-2" style={{ background: K.sky, color: K.navyDeep }}>
                <Plus size={17} />{t('add_funds')}
              </button>
              <div className="relative grid grid-cols-3 gap-2 mt-3">
                {[[ArrowDownLeft, t('deposit'), onDeposit], [ArrowUpRight, t('withdraw'), onWithdraw], [Send, t('transfer'), onTransfer]].map(([Icon, label, fn]) => (
                  <button key={label} onClick={fn} className="rounded-2xl py-2.5 flex flex-col items-center gap-1 text-[11px] font-semibold" style={{ background: 'rgba(255,255,255,.1)' }}>
                    <Icon size={16} />{label}
                  </button>
                ))}
              </div>
            </div>

            {/* Estatistik */}
            <div className="md:col-span-7 grid grid-cols-2 gap-4">
              {[
                { label: t('balance'), value: balance, icon: Wallet, tone: K.navy, soft: K.skySoft, pct: undefined, foot: user?.clientId },
                { label: t('money_in'), value: stats.inCur, icon: ArrowDownLeft, tone: K.mint, soft: K.mintSoft, pct: stats.inPct },
                { label: t('money_out'), value: stats.outCur, icon: ArrowUpRight, tone: K.navy, soft: K.skySoft, pct: stats.outPct },
                { label: t('pending'), value: stats.pendingAmount, icon: Clock, tone: K.amber, soft: K.amberSoft, foot: t('pending_sub', { n: stats.pendingCount }) },
              ].map((s) => (
                <Card key={s.label} className="p-4 flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: s.soft, color: s.tone }}><s.icon size={17} /></span>
                    <MoreHorizontal size={16} style={{ color: K.muted }} />
                  </div>
                  <p className="text-xs font-medium mt-3" style={{ color: K.muted }}>{s.label}</p>
                  <p className="text-lg sm:text-xl font-bold tabular-nums mt-0.5 truncate">{fmt(s.value)} <span className="text-xs font-semibold" style={{ color: K.muted }}>HTG</span></p>
                  <div className="mt-auto pt-2 flex items-center gap-1.5 text-[11px]" style={{ color: K.muted }}>
                    {s.pct !== undefined ? (<>{s.pct === null ? <span>—</span> : <Pct value={s.pct} />}<span className="truncate">{t('vs_prev')}</span></>) : <span className="truncate">{s.foot}</span>}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Flux lajan */}
          <Card className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-bold">{t('cash_flow')}</h2>
                <p className="text-xs" style={{ color: K.muted }}>{t('period_12m')}</p>
              </div>
              <div className="flex p-1 rounded-full self-start" style={{ background: K.bg }}>
                {[['in', t('tab_in')], ['out', t('tab_out')], ['net', t('tab_net')]].map(([id, label]) => (
                  <button key={id} onClick={() => setMode(id)} className="px-4 py-1.5 rounded-full text-xs font-semibold"
                    style={mode === id ? { background: K.card, color: K.ink, boxShadow: '0 1px 3px rgba(0,0,0,.08)' } : { color: K.muted }}>{label}</button>
                ))}
              </div>
            </div>
            <CashFlowChart months={months} mode={mode} t={t} />
          </Card>

          {/* Dènye aktivite */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">{t('nav_activity')}</h2>
              <button onClick={() => setPage('activity')} className="text-sm font-semibold flex items-center gap-0.5" style={{ color: K.navy }}>
                {t('f_all')} <ChevronRight size={16} />
              </button>
            </div>
            {recent.length === 0 ? (
              <p className="text-sm py-8 text-center" style={{ color: K.muted }}>{loading ? '…' : t('no_results')}</p>
            ) : (
              <div className="divide-y" style={{ borderColor: K.border }}>
                {recent.map((o) => {
                  const d = describe(o);
                  const plus = o.kind === 'deposit' || o.kind === 'in';
                  return (
                    <div key={o.kind + o.id} className="flex items-center gap-3 py-3">
                      <OpIcon kind={o.kind} method={o.method} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{d.title}</p>
                        <p className="text-xs truncate" style={{ color: K.muted }}>{d.sub} • {dateFmt(o.date)}</p>
                      </div>
                      <div className="hidden sm:block"><StatusPill status={o.status} t={t} /></div>
                      <p className="text-sm font-bold tabular-nums text-right w-32" style={{ color: plus ? K.mint : K.ink }}>{plus ? '+' : '−'}{htg(o.amount)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Kolòn dwat */}
        <div className="lg:col-span-4 space-y-5">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">{t('quick_send')}</h2>
                <p className="text-xs" style={{ color: K.muted }}>{t('quick_send_sub')}</p>
              </div>
              <button onClick={onTransfer} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: K.skySoft, color: K.navy }}><Plus size={17} /></button>
            </div>
            <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
              {recentPeople.length === 0 ? (
                <p className="text-xs py-2" style={{ color: K.muted }}>{t('quick_send_empty')}</p>
              ) : recentPeople.map((p) => (
                <button key={p.party} onClick={onTransfer} className="flex flex-col items-center gap-1.5 w-16 shrink-0">
                  <span className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: p.partyBiz ? K.navy : K.skySoft, color: p.partyBiz ? '#fff' : K.navy }}>{initials(p.party)}</span>
                  <span className="text-[11px] font-medium truncate w-full text-center">{p.party.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold">{t('nav_card')}</h2>
              <span className="text-[11px] font-semibold px-2 py-1 rounded-full" style={{ background: K.amberSoft, color: K.amber }}>{t('card_soon')}</span>
            </div>
            <BizCard variant="shield" name={bizName} />
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button onClick={onDeposit} className="h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 text-white" style={{ background: K.navy }}><Plus size={15} />{t('deposit')}</button>
              <button onClick={onTransfer} className="h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 border" style={{ borderColor: K.border }}><Send size={15} />{t('transfer')}</button>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-bold mb-3">{t('quick_action')}</h2>
            <div className="grid grid-cols-3 gap-2">
              {[[QrCode, t('receive'), () => setShowReceive(true)], [ArrowUpRight, t('withdraw'), onWithdraw], [MoreHorizontal, t('more'), () => setPage('account')]].map(([Icon, label, fn]) => (
                <button key={label} onClick={fn} className="rounded-2xl py-3.5 flex flex-col items-center gap-1.5 text-xs font-semibold border hover:shadow-sm transition" style={{ borderColor: K.border }}>
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: K.skySoft, color: K.navy }}><Icon size={17} /></span>{label}
                </button>
              ))}
            </div>
          </Card>

          <div className="rounded-3xl p-5 relative overflow-hidden" style={{ background: approved ? K.mintSoft : K.skySoft }}>
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: approved ? K.mint : K.navy }}>{approved ? <ShieldCheck size={17} /> : <Building2 size={17} />}</span>
              <div>
                <p className="text-sm font-bold">{t('plan_title')}</p>
                <BizStatusBadge status={bizStatus} t={t} />
              </div>
            </div>
            <p className="text-sm mt-3" style={{ color: K.ink }}>
              {approved
                ? t('plan_active', { d: fmt(types?.caps?.business?.daily ?? 500000), m: fmt(types?.caps?.business?.monthly ?? 5000000) })
                : bizStatus === 'submitted' ? t('plan_review') : t('plan_todo')}
            </p>
            <button onClick={() => setPage('account')} className="mt-4 h-10 px-4 rounded-xl text-sm font-bold flex items-center gap-1.5 text-white" style={{ background: approved ? K.mint : K.navy }}>
              {approved || bizStatus === 'submitted' ? t('plan_cta_view') : t('plan_cta_todo')}<ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function AnalyticsPage({ ctx }) {
  const { t, lang, user, token, apiFetch, flash, balance, ops, months, stats, recentPeople, types, biz, profile, bizStatus, approved, bizName, loading, load, search, setSearch, setPage, setShowReceive, describe, dateFmt, timeFmt, hello, firstName, isIn, isOut, pageHeader, onDeposit, onWithdraw, onTransfer, onKyc, onSettings, onSupport, onChangePassword, onLogout } = ctx;
  const totalIn = months.reduce((s, m) => s + m.in, 0);
  const totalOut = months.reduce((s, m) => s + m.out, 0);
  const confirmed = ops.filter((o) => o.status === 'confirmed');
  const avg = confirmed.length ? confirmed.reduce((s, o) => s + o.amount, 0) / confirmed.length : 0;
  const byMethod = {};
  for (const o of ops) {
    if (!isIn(o)) continue;
    const k = o.kind === 'in' ? t('transfers_in') : o.method === 'biwo' ? t('m_biwo') : METHOD_NAMES[o.method] || o.method;
    byMethod[k] = (byMethod[k] || 0) + o.amount;
  }
  const group = (kind) => {
    const g = {};
    for (const o of ops) if (o.kind === kind && o.party) g[o.party] = (g[o.party] || 0) + o.amount;
    return Object.entries(g).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  };
  const kpis = [
    { label: t('an_total_in'), value: totalIn, icon: ArrowDownLeft, tone: K.mint, soft: K.mintSoft },
    { label: t('an_total_out'), value: totalOut, icon: ArrowUpRight, tone: K.navy, soft: K.skySoft },
    { label: t('an_net'), value: totalIn - totalOut, icon: Activity, tone: totalIn - totalOut >= 0 ? K.mint : K.danger, soft: totalIn - totalOut >= 0 ? K.mintSoft : K.dangerSoft },
    { label: t('an_avg'), value: avg, icon: BarChart3, tone: K.amber, soft: K.amberSoft, foot: t('an_count', { n: confirmed.length }) },
  ];
  return (
    <>
      {pageHeader(t('an_title'), t('an_sub'))}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: k.soft, color: k.tone }}><k.icon size={17} /></span>
            <p className="text-xs font-medium mt-3" style={{ color: K.muted }}>{k.label}</p>
            <p className="text-lg sm:text-xl font-bold tabular-nums truncate" style={{ color: k.label === t('an_net') ? k.tone : K.ink }}>{k.value < 0 ? '−' : ''}{htg(Math.abs(k.value))}</p>
            <p className="text-[11px] mt-1" style={{ color: K.muted }}>{k.foot || t('period_12m')}</p>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="p-5 lg:col-span-2">
          <h2 className="text-lg font-bold mb-5">{t('an_in_vs_out')}</h2>
          <GroupedBars months={months} t={t} />
        </Card>
        <Card className="p-5">
          <h2 className="text-lg font-bold mb-5">{t('an_by_method')}</h2>
          <BarList rows={Object.entries(byMethod).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)} color={K.navy} t={t} />
        </Card>
        <Card className="p-5">
          <h2 className="text-lg font-bold mb-5 flex items-center gap-2"><Users size={18} />{t('an_top_payers')}</h2>
          <BarList rows={group('in')} color={K.mint} t={t} />
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h2 className="text-lg font-bold mb-5 flex items-center gap-2"><Send size={18} />{t('an_top_payees')}</h2>
          <BarList rows={group('out')} color={K.sky} t={t} />
        </Card>
      </div>
    </>
  );
}

function ActivityPage({ ctx }) {
  const { t, lang, user, token, apiFetch, flash, balance, ops, months, stats, recentPeople, types, biz, profile, bizStatus, approved, bizName, loading, load, search, setSearch, setPage, setShowReceive, describe, dateFmt, timeFmt, hello, firstName, isIn, isOut, pageHeader, onDeposit, onWithdraw, onTransfer, onKyc, onSettings, onSupport, onChangePassword, onLogout } = ctx;
  const [filter, setFilter] = useState('all');
  const [period, setPeriod] = useState(365);
  const [q, setQ] = useState(search);
  const since = Date.now() - period * DAY;
  const rows = ops.filter((o) => {
    if (o.date < since) return false;
    if (filter === 'in' && !(o.kind === 'deposit' || o.kind === 'in')) return false;
    if (filter === 'out' && !(o.kind === 'withdraw' || o.kind === 'out')) return false;
    if (filter === 'deposit' && o.kind !== 'deposit') return false;
    if (filter === 'withdraw' && o.kind !== 'withdraw') return false;
    if (filter === 'transfer' && !(o.kind === 'in' || o.kind === 'out')) return false;
    if (filter === 'pending' && o.status !== 'pending') return false;
    if (q.trim()) {
      const d = describe(o);
      const hay = `${d.title} ${d.sub || ''} ${o.amount} ${o.id}`.toLowerCase();
      if (!hay.includes(q.trim().toLowerCase())) return false;
    }
    return true;
  });

  function exportCsv() {
    const head = [t('col_date'), t('col_desc'), t('col_party'), t('col_status'), t('col_amount')];
    const lines = rows.map((o) => {
      const d = describe(o);
      const sign = o.kind === 'deposit' || o.kind === 'in' ? '' : '-';
      return [o.date.toISOString(), d.title, d.sub || '', t(`st_${o.status}`), `${sign}${o.amount}`];
    });
    const csv = [head, ...lines].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `blicpay-${user?.clientId || 'export'}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  const chips = [['all', t('f_all')], ['in', t('f_in')], ['out', t('f_out')], ['deposit', t('f_deposit')], ['withdraw', t('f_withdraw')], ['transfer', t('f_transfer')], ['pending', t('f_pending')]];
  return (
    <>
      {pageHeader(t('act_title'), t('act_sub'),
        <button onClick={exportCsv} className="h-11 px-4 rounded-full text-sm font-semibold flex items-center gap-2 text-white self-start" style={{ background: K.navy }}>
          <Download size={16} />{t('export_csv')}
        </button>)}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between mb-4">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {chips.map(([id, label]) => (
              <button key={id} onClick={() => setFilter(id)} className="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border"
                style={filter === id ? { background: K.navy, color: '#fff', borderColor: K.navy } : { borderColor: K.border, color: K.muted }}>{label}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 lg:w-60">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: K.muted }} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search')} className="w-full h-10 pl-9 pr-3 rounded-xl border text-sm outline-none" style={{ borderColor: K.border }} />
            </div>
            <select value={period} onChange={(e) => setPeriod(Number(e.target.value))} className="h-10 px-3 rounded-xl border text-sm font-medium bg-white" style={{ borderColor: K.border }}>
              <option value={30}>{t('p_30')}</option>
              <option value={90}>{t('p_90')}</option>
              <option value={365}>{t('p_365')}</option>
            </select>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm py-12 text-center" style={{ color: K.muted }}>{t('no_results')}</p>
        ) : (
          <>
            {/* Tablo (gwo ekran) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs" style={{ color: K.muted }}>
                    <th className="font-semibold py-2.5 px-2">{t('col_desc')}</th>
                    <th className="font-semibold py-2.5 px-2">{t('col_party')}</th>
                    <th className="font-semibold py-2.5 px-2">{t('col_date')}</th>
                    <th className="font-semibold py-2.5 px-2">{t('col_status')}</th>
                    <th className="font-semibold py-2.5 px-2 text-right">{t('col_amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((o) => {
                    const d = describe(o);
                    const plus = o.kind === 'deposit' || o.kind === 'in';
                    return (
                      <tr key={o.kind + o.id} className="border-t" style={{ borderColor: K.border }}>
                        <td className="py-3 px-2"><div className="flex items-center gap-3"><OpIcon kind={o.kind} method={o.method} /><span className="font-semibold">{d.title}</span></div></td>
                        <td className="py-3 px-2" style={{ color: K.muted }}>{d.sub}</td>
                        <td className="py-3 px-2 whitespace-nowrap" style={{ color: K.muted }}>{dateFmt(o.date)} <span className="text-xs">{timeFmt(o.date)}</span></td>
                        <td className="py-3 px-2"><StatusPill status={o.status} t={t} /></td>
                        <td className="py-3 px-2 text-right font-bold tabular-nums whitespace-nowrap" style={{ color: plus ? K.mint : K.ink }}>{plus ? '+' : '−'}{htg(o.amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Lis (telefòn) */}
            <div className="md:hidden divide-y" style={{ borderColor: K.border }}>
              {rows.map((o) => {
                const d = describe(o);
                const plus = o.kind === 'deposit' || o.kind === 'in';
                return (
                  <div key={o.kind + o.id} className="flex items-center gap-3 py-3">
                    <OpIcon kind={o.kind} method={o.method} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{d.title}</p>
                      <p className="text-xs truncate" style={{ color: K.muted }}>{d.sub} • {dateFmt(o.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold tabular-nums" style={{ color: plus ? K.mint : K.ink }}>{plus ? '+' : '−'}{fmt(o.amount)}</p>
                      <StatusPill status={o.status} t={t} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>
    </>
  );
}

function CardPage({ ctx }) {
  const { t, lang, user, token, apiFetch, flash, balance, ops, months, stats, recentPeople, types, biz, profile, bizStatus, approved, bizName, loading, load, search, setSearch, setPage, setShowReceive, describe, dateFmt, timeFmt, hello, firstName, isIn, isOut, pageHeader, onDeposit, onWithdraw, onTransfer, onKyc, onSettings, onSupport, onChangePassword, onLogout } = ctx;
  const caps = types?.caps || { personal: { daily: 80000, weekly: 300000, monthly: 500000 }, business: { daily: 500000, weekly: 2000000, monthly: 5000000 } };
  return (
    <>
      {pageHeader(t('card_title'), t('card_sub'))}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        {[['ocean', 'Basic'], ['world', 'Standard'], ['shield', 'Premium']].map(([v, label]) => (
          <Card key={v} className="p-4">
            <BizCard variant={v} name={bizName} />
            <div className="flex items-center justify-between mt-4">
              <p className="font-bold">{label}</p>
              <span className="text-[11px] font-semibold px-2 py-1 rounded-full" style={{ background: K.amberSoft, color: K.amber }}>{t('card_soon')}</span>
            </div>
          </Card>
        ))}
      </div>
      <Card className="p-5">
        <h2 className="text-lg font-bold mb-4">{t('card_limits')}</h2>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div />
          <p className="text-xs font-semibold" style={{ color: K.muted }}>{t('personal_limits')}</p>
          <p className="text-xs font-semibold" style={{ color: K.navy }}>{t('business_limits')}</p>
          {[['daily', t('per_day')], ['weekly', t('per_week')], ['monthly', t('per_month')]].map(([k, label]) => (
            <React.Fragment key={k}>
              <p className="font-medium py-2 border-t" style={{ borderColor: K.border }}>{label}</p>
              <p className="py-2 border-t tabular-nums" style={{ borderColor: K.border, color: K.muted }}>{htg(caps.personal[k])}</p>
              <p className="py-2 border-t font-bold tabular-nums" style={{ borderColor: K.border, color: K.navy }}>{htg(caps.business[k])}</p>
            </React.Fragment>
          ))}
        </div>
        <div className="mt-4"><BizStatusBadge status={bizStatus} t={t} /></div>
      </Card>
    </>
  );
}

function AccountPage({ ctx }) {
  const { t, lang, user, token, apiFetch, flash, balance, ops, months, stats, recentPeople, types, biz, profile, bizStatus, approved, bizName, loading, load, search, setSearch, setPage, setShowReceive, describe, dateFmt, timeFmt, hello, firstName, isIn, isOut, pageHeader, onDeposit, onWithdraw, onTransfer, onKyc, onSettings, onSupport, onChangePassword, onLogout } = ctx;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => ({ ...(profile || {}) }));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null);
  const fileRef = useRef(null);
  const pendingDoc = useRef(null);
  const editable = !!biz?.editable;
  const docs = biz?.documents || [];
  const req = biz?.requirements || { required: [], optional: [] };
  const missing = biz?.missing || [];

  const FIELDS = ['legalName', 'tradeName', 'legalForm', 'nif', 'patenteNumber', 'sector', 'address', 'city', 'businessPhone', 'businessEmail', 'website', 'turnoverRange', 'repTitle'];

  function valueLabel(k, v) {
    if (!v) return '—';
    if (k === 'legalForm') return loc(types?.legalForms?.[v]?.label, lang) || v;
    if (k === 'turnoverRange') return loc(types?.turnoverRanges?.[v], lang) || v;
    return v;
  }

  async function save() {
    setSaving(true);
    try {
      const body = {};
      for (const k of FIELDS) body[k] = form[k] ?? '';
      await apiFetch('/business/me', { method: 'PUT', body, token });
      flash(t('saved'));
      setEditing(false);
      await load();
    } catch (e) { flash(e.message, 'error'); } finally { setSaving(false); }
  }

  function pick(docType) {
    pendingDoc.current = docType;
    fileRef.current?.click();
  }

  async function readFile(file) {
    if (file.type === 'application/pdf') {
      const dataUrl = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
      return { data: String(dataUrl).split(',')[1], mimeType: 'application/pdf' };
    }
    // Imaj: diminye l (1600px maks, JPEG) pou l pa twò lou.
    const url = URL.createObjectURL(file);
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    return { data: c.toDataURL('image/jpeg', 0.85).split(',')[1], mimeType: 'image/jpeg' };
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    const docType = pendingDoc.current;
    if (!file || !docType) return;
    if (file.size > 5 * 1024 * 1024) { flash(t('doc_too_big'), 'error'); return; }
    setUploading(docType);
    try {
      const { data, mimeType } = await readFile(file);
      await apiFetch('/business/me/documents', { method: 'POST', body: { docType, data, mimeType, fileName: file.name }, token });
      flash(t('doc_uploaded'));
      await load();
    } catch (err) { flash(err.message, 'error'); } finally { setUploading(null); }
  }

  const [kybBusy, setKybBusy] = useState(false);
  async function payKybWithBalance() {
    setKybBusy(true);
    try {
      await apiFetch('/business/me/kyb/pay', { method: 'POST', body: { method: 'balance' }, token });
      flash(t('kyb_paid'));
      await load();
    } catch (e) { flash(e.message, 'error'); } finally { setKybBusy(false); }
  }

  async function startKyb() {
    setKybBusy(true);
    try {
      const r = await apiFetch('/business/me/kyb/start', { method: 'POST', token });
      if (r.url) window.location.href = r.url;
    } catch (e) { flash(e.message, 'error'); await load(); } finally { setKybBusy(false); }
  }

  async function submit() {
    try {
      await apiFetch('/business/me/submit', { method: 'POST', token });
      flash(t('submitted_ok'));
      await load();
    } catch (e) { flash(e.message, 'error'); }
  }

  const docStatus = (d) => {
    if (!d) return null;
    if (d.status === 'accepted') return [K.mintSoft, K.mint, t('doc_ok'), CheckCircle2];
    if (d.status === 'rejected') return [K.dangerSoft, K.danger, t('doc_bad'), X];
    return [K.skySoft, K.navy, t('doc_review'), Clock];
  };

  const missingLabels = missing.map((m) => {
    const [kind, key] = m.split(':');
    return kind === 'field' ? t(`field_${key}`) : loc(types?.documents?.[key], lang) || key;
  });

  if (!profile) {
    return (
      <>
        {pageHeader(t('acc_title'), t('acc_sub'))}
        <Card className="p-8 text-center"><p style={{ color: K.muted }}>{loading ? '…' : t('an_empty')}</p></Card>
      </>
    );
  }

  return (
    <>
      {pageHeader(bizName, `${loc(types?.legalForms?.[profile.legalForm]?.label, lang) || ''} • ${user?.clientId || ''}`, <BizStatusBadge status={bizStatus} t={t} />)}

      {profile.adminNote && (bizStatus === 'needs_info' || bizStatus === 'rejected') && (
        <div className="rounded-2xl p-4 mb-5 flex gap-3" style={{ background: K.amberSoft }}>
          <AlertCircle size={20} style={{ color: K.amber }} className="shrink-0 mt-0.5" />
          <div><p className="text-sm font-bold">{t('admin_note')}</p><p className="text-sm mt-0.5">{profile.adminNote}</p></div>
        </div>
      )}
      {!editable && bizStatus === 'submitted' && (
        <div className="rounded-2xl p-4 mb-5 flex gap-3 text-sm" style={{ background: K.skySoft, color: K.navy }}>
          <Lock size={18} className="shrink-0 mt-0.5" />{t('locked')}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Enfòmasyon legal */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{t('legal_info')}</h2>
              {editable && !editing && <button onClick={() => { setForm({ ...profile }); setEditing(true); }} className="text-sm font-semibold px-3 py-1.5 rounded-full border" style={{ borderColor: K.border, color: K.navy }}>{t('edit')}</button>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              {FIELDS.map((k) => (
                <div key={k}>
                  <p className="text-xs font-medium mb-1" style={{ color: K.muted }}>{t(`field_${k}`)}</p>
                  {editing ? (
                    k === 'legalForm' || k === 'turnoverRange' ? (
                      <select value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="w-full h-10 px-3 rounded-xl border text-sm bg-white" style={{ borderColor: K.border }}>
                        <option value="">—</option>
                        {Object.entries(k === 'legalForm' ? types?.legalForms || {} : types?.turnoverRanges || {}).map(([id, v]) => (
                          <option key={id} value={id}>{loc(k === 'legalForm' ? v.label : v, lang)}</option>
                        ))}
                      </select>
                    ) : (
                      <input value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="w-full h-10 px-3 rounded-xl border text-sm outline-none focus:ring-2" style={{ borderColor: K.border }} />
                    )
                  ) : (
                    <p className="text-sm font-semibold break-words">{valueLabel(k, profile[k])}</p>
                  )}
                </div>
              ))}
            </div>
            {editing && (
              <div className="flex gap-2 mt-5 justify-end">
                <button onClick={() => setEditing(false)} className="h-10 px-4 rounded-xl text-sm font-semibold border" style={{ borderColor: K.border }}>{t('cancel')}</button>
                <button onClick={save} disabled={saving} className="h-10 px-5 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ background: K.navy }}>{saving ? '…' : t('save')}</button>
              </div>
            )}
          </Card>

          {/* Dokiman */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold">{t('documents')}</h2>
            </div>
            <p className="text-xs mb-4" style={{ color: K.muted }}>{t('doc_formats')}</p>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={onFile} />
            <div className="space-y-2.5">
              {[...req.required.map((d) => [d, true]), ...req.optional.map((d) => [d, false])].map(([docType, isReq]) => {
                const d = docs.find((x) => x.docType === docType);
                const st = docStatus(d);
                return (
                  <div key={docType} className="flex items-center gap-3 p-3 rounded-2xl border" style={{ borderColor: K.border }}>
                    <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: d ? K.skySoft : K.bg, color: d ? K.navy : K.muted }}><FileText size={18} /></span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{loc(types?.documents?.[docType], lang) || docType}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[11px] font-semibold" style={{ color: isReq ? K.danger : K.muted }}>{isReq ? t('required') : t('optional')}</span>
                        {st && <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: st[0], color: st[1] }}>{React.createElement(st[3], { size: 11 })}{st[2]}</span>}
                        {d?.note && <span className="text-[11px]" style={{ color: K.danger }}>{d.note}</span>}
                      </div>
                    </div>
                    {editable && d?.status !== 'accepted' && (
                      <button onClick={() => pick(docType)} disabled={uploading === docType} className="h-9 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 disabled:opacity-60"
                        style={d ? { border: `1px solid ${K.border}`, color: K.navy } : { background: K.navy, color: '#fff' }}>
                        {uploading === docType ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}{d ? t('replace') : t('upload')}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {editable && (
              <div className="mt-5 pt-5 border-t" style={{ borderColor: K.border }}>
                {missingLabels.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-bold mb-2" style={{ color: K.amber }}>{t('missing')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {missingLabels.map((m) => <span key={m} className="text-[11px] font-medium px-2 py-1 rounded-full" style={{ background: K.amberSoft, color: K.amber }}>{m}</span>)}
                    </div>
                  </div>
                )}
                <button onClick={submit} disabled={missingLabels.length > 0} className="w-full sm:w-auto h-11 px-6 rounded-xl text-sm font-bold text-white disabled:opacity-40" style={{ background: K.navy }}>
                  {t('submit_file')}
                </button>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="text-base font-bold mb-4">{t('representative')}</h2>
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white" style={{ background: K.navy }}>{initials(user?.fullName)}</span>
              <div className="min-w-0">
                <p className="font-semibold truncate">{user?.fullName}</p>
                <p className="text-xs" style={{ color: K.muted }}>{profile.repTitle || '—'} • {user?.phone}</p>
              </div>
            </div>
            {biz?.repVerified ? (
              <p className="mt-4 text-sm font-semibold flex items-center gap-1.5" style={{ color: K.mint }}><ShieldCheck size={16} />{t('rep_verified')}</p>
            ) : (
              <button onClick={onKyc} className="mt-4 w-full h-10 rounded-xl text-sm font-bold text-white" style={{ background: K.navy }}>{t('rep_verify')}</button>
            )}
          </Card>
          {biz?.kyb?.enabled && bizStatus !== 'draft' && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-2"><ShieldCheck size={18} style={{ color: K.navy }} /><h2 className="text-base font-bold">{t('kyb_title')}</h2></div>
              {biz.kyb.status === 'Approved' ? (
                <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: K.mint }}><CheckCircle2 size={16} />{t('kyb_done')}</p>
              ) : biz.kyb.status === 'Declined' ? (
                <p className="text-sm" style={{ color: K.danger }}>{t('kyb_declined')}</p>
              ) : biz.kyb.status && !biz.kyb.url ? (
                <p className="text-sm" style={{ color: K.muted }}>{t('kyb_review')}</p>
              ) : (
                <>
                  <p className="text-sm" style={{ color: K.muted }}>{t('kyb_desc')}</p>
                  {!biz.kyb.feePaid && biz.kyb.fee > 0 ? (
                    <>
                      <div className="mt-3 rounded-xl p-3 flex items-center justify-between text-sm" style={{ background: K.skySoft }}>
                        <span style={{ color: K.navy }}>{t('kyb_fee')}</span>
                        <span className="font-bold" style={{ color: K.navy }}>{biz.kyb.fee.toLocaleString('fr-FR')} HTG</span>
                      </div>
                      {biz.kyb.pendingPayment ? (
                        <p className="mt-3 text-sm rounded-xl p-3 flex items-start gap-2" style={{ background: K.amberSoft }}><Clock size={16} className="shrink-0 mt-0.5" style={{ color: K.amber }} />{t('kyb_pending_payment')}</p>
                      ) : (
                        <>
                          <p className="mt-4 text-xs font-bold uppercase tracking-wide" style={{ color: K.muted }}>{t('kyb_pay_with')}</p>
                          <div className="mt-2 space-y-2">
                            {[
                              ['balance', t('kyb_pay_balance'), `${t('kyb_balance')} : ${Number(balance || 0).toLocaleString('fr-FR')} HTG`, Wallet, () => payKybWithBalance(), Number(balance || 0) < biz.kyb.fee],
                              ['moncash', 'MonCash', t('kyb_pay_mobile'), null, () => onDeposit({ amount: biz.kyb.fee, purpose: 'kyb_fee' }), false],
                              ['natcash', 'NatCash', t('kyb_pay_mobile'), null, () => onDeposit({ amount: biz.kyb.fee, purpose: 'kyb_fee' }), false],
                            ].map(([id, label, sub, Icon, fn, disabled]) => (
                              <button key={id} onClick={fn} disabled={kybBusy || disabled} className="w-full flex items-center gap-3 p-3 rounded-xl border text-left" style={{ borderColor: K.border, opacity: disabled ? 0.5 : 1 }}>
                                <span className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden shrink-0" style={{ background: K.skySoft, color: K.navy }}>
                                  {Icon ? <Icon size={17} /> : <img src={`/logos/${id}-icon.png`} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                                </span>
                                <span className="flex-1 min-w-0"><span className="block text-sm font-semibold">{label}</span><span className="block text-xs" style={{ color: K.muted }}>{disabled ? t('kyb_low_balance') : sub}</span></span>
                                <ChevronRight size={16} style={{ color: K.muted }} />
                              </button>
                            ))}
                          </div>
                          <p className="text-xs mt-2" style={{ color: K.muted }}>{t('kyb_fee_note')}</p>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {biz.kyb.feePaid && biz.kyb.fee > 0 && <p className="mt-3 text-sm font-semibold flex items-center gap-1.5" style={{ color: K.mint }}><CheckCircle2 size={15} />{t('kyb_paid')}</p>}
                      <button onClick={startKyb} disabled={kybBusy} className="mt-3 w-full h-10 rounded-xl text-sm font-bold text-white" style={{ background: K.navy, opacity: kybBusy ? 0.7 : 1 }}>
                        {kybBusy ? '…' : biz.kyb.url ? t('kyb_continue') : t('kyb_start')}
                      </button>
                    </>
                  )}
                </>
              )}
            </Card>
          )}
          <Card className="p-5">
            <h2 className="text-base font-bold mb-3">{t('receive')}</h2>
            <button onClick={() => setShowReceive(true)} className="w-full flex items-center gap-3 p-3 rounded-2xl border" style={{ borderColor: K.border }}>
              <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: K.skySoft, color: K.navy }}><QrCode size={18} /></span>
              <span className="text-sm font-semibold flex-1 text-left">{t('recv_title')}</span><ChevronRight size={16} style={{ color: K.muted }} />
            </button>
          </Card>
          <Card className="p-2">
            <p className="text-base font-bold px-3 pt-3 pb-2">{t('security')}</p>
            {[[Lock, t('change_password'), onChangePassword], [Settings, t('settings'), onSettings], [HelpCircle, t('support'), onSupport]].map(([Icon, label, fn]) => (
              <button key={label} onClick={fn} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium hover:bg-slate-50">
                <Icon size={17} style={{ color: K.muted }} /><span className="flex-1 text-left">{label}</span><ChevronRight size={16} style={{ color: K.muted }} />
              </button>
            ))}
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold hover:bg-red-50" style={{ color: K.danger }}>
              <LogOut size={17} /><span className="flex-1 text-left">{t('logout')}</span>
            </button>
          </Card>
        </div>
      </div>
    </>
  );
}

function ReceiveModal({ ctx }) {
  const { t, lang, user, token, apiFetch, flash, balance, ops, months, stats, recentPeople, types, biz, profile, bizStatus, approved, bizName, loading, load, search, setSearch, setPage, setShowReceive, describe, dateFmt, timeFmt, hello, firstName, isIn, isOut, pageHeader, onDeposit, onWithdraw, onTransfer, onKyc, onSettings, onSupport, onChangePassword, onLogout } = ctx;
  const [amount, setAmount] = useState('');
  const [qr, setQr] = useState('');
  const link = `blicpay://pay?to=${encodeURIComponent(user?.clientId || '')}${Number(amount) > 0 ? `&amount=${Math.round(Number(amount))}` : ''}`;
  useEffect(() => {
    if (!approved) return;
    QRCode.toDataURL(link, { width: 520, margin: 1, color: { dark: K.navyDeep, light: '#FFFFFF' } }).then(setQr).catch(() => setQr(''));
  }, [link]);
  return (
    <Modal onClose={() => setShowReceive(false)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold">{t('recv_title')}</h3>
          <p className="text-sm mt-0.5" style={{ color: K.muted }}>{t('recv_body')}</p>
        </div>
        <button onClick={() => setShowReceive(false)} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: K.bg }}><X size={17} /></button>
      </div>
      {!approved ? (
        <div className="rounded-2xl p-5 text-center" style={{ background: K.amberSoft }}>
          <Lock size={26} className="mx-auto" style={{ color: K.amber }} />
          <p className="text-sm mt-2 font-medium">{t('recv_locked')}</p>
          <button onClick={() => { setShowReceive(false); setPage('account'); }} className="mt-4 h-10 px-4 rounded-xl text-sm font-bold text-white" style={{ background: K.navy }}>{t('plan_cta_todo')}</button>
        </div>
      ) : (
        <>
          <div className="rounded-3xl p-5 text-center" style={{ background: K.bg }}>
            <p className="font-bold flex items-center justify-center gap-1.5"><ShieldCheck size={16} style={{ color: K.mint }} />{bizName}</p>
            <p className="text-xs" style={{ color: K.muted }}>{t('verified_business')} • {user?.clientId}</p>
            {qr ? <img src={qr} alt="QR" className="w-56 h-56 mx-auto mt-4 rounded-2xl bg-white p-2" /> : <div className="w-56 h-56 mx-auto mt-4" />}
            {Number(amount) > 0 && <p className="text-xl font-bold mt-3">{htg(Number(amount))}</p>}
          </div>
          <label className="block text-xs font-semibold mt-4 mb-1.5" style={{ color: K.muted }}>{t('recv_amount')}</label>
          <input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))} placeholder="0" className="w-full h-11 px-3 rounded-xl border text-sm outline-none" style={{ borderColor: K.border }} />
          <div className="grid grid-cols-2 gap-2 mt-4">
            <a href={qr || undefined} download={`blicpay-qr-${user?.clientId}.png`} className="h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 text-white" style={{ background: K.navy }}><Download size={16} />{t('recv_download')}</a>
            <button onClick={() => { navigator.clipboard?.writeText(user?.clientId || ''); flash(t('copied')); }} className="h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 border" style={{ borderColor: K.border }}><Copy size={16} />{t('recv_copy')}</button>
          </div>
        </>
      )}
    </Modal>
  );
}


export default function BusinessApp({
  token, user, lang, setLang, balance, apiFetch, flash,
  notifications = [], unreadCount = 0, showNotif = false, onToggleNotif,
  onDeposit, onWithdraw, onTransfer, onKyc, onSettings, onSupport, onChangePassword, onLogout,
}) {
  const t = useMemo(() => makeT(lang), [lang]);
  const [page, setPage] = useState('dashboard');
  const [ops, setOps] = useState([]);
  const [biz, setBiz] = useState(null); // repons /business/me
  const [types, setTypes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReceive, setShowReceive] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    const to = new Date();
    const from = new Date(to.getFullYear(), to.getMonth() - 11, 1);
    const q = `?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`;
    const [w, tr, me, ty] = await Promise.allSettled([
      apiFetch(`/wallet/transactions${q}`, { token }),
      apiFetch(`/transfers/my${q}`, { token }),
      apiFetch('/business/me', { token }),
      apiFetch('/business/types', { token }),
    ]);
    const list = [];
    if (w.status === 'fulfilled') {
      for (const x of w.value.transactions || []) {
        list.push({
          id: x.id, kind: x.type === 'depo' ? 'deposit' : 'withdraw', amount: x.amount,
          status: statusOf(x.status), date: new Date(x.createdAt), method: x.method, party: null,
        });
      }
    }
    if (tr.status === 'fulfilled') {
      for (const x of tr.value.transfers || []) {
        const incoming = x.toUserId === user?.id;
        const other = incoming ? x.fromUser : x.toUser;
        list.push({
          id: x.id, kind: incoming ? 'in' : 'out', amount: x.amount, status: 'confirmed',
          date: new Date(x.createdAt), method: 'blicpay', party: other?.fullName || other?.phone || '—',
          partyPhone: other?.phone, partyBiz: other?.isBusiness,
        });
      }
    }
    list.sort((a, b) => b.date - a.date);
    setOps(list);
    if (me.status === 'fulfilled') setBiz(me.value.business ? me.value : null);
    if (ty.status === 'fulfilled') setTypes(ty.value);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [token]);
  useEffect(() => { window.scrollTo?.(0, 0); }, [page]);

  // ---------- Kalkil ----------
  const profile = biz?.business;
  const bizStatus = profile?.status || 'draft';
  const approved = bizStatus === 'approved';
  const bizName = profile?.tradeName || profile?.legalName || user?.fullName || '';

  const isIn = (o) => (o.kind === 'deposit' || o.kind === 'in') && o.status === 'confirmed';
  const isOut = (o) => (o.kind === 'withdraw' || o.kind === 'out') && o.status === 'confirmed';

  const stats = useMemo(() => {
    const now = Date.now();
    const sum = (from, to, pred) => ops.filter((o) => o.date >= from && o.date < to && pred(o)).reduce((s, o) => s + o.amount, 0);
    const a = now - 30 * DAY, b = now - 60 * DAY;
    const inCur = sum(a, now + DAY, isIn), inPrev = sum(b, a, isIn);
    const outCur = sum(a, now + DAY, isOut), outPrev = sum(b, a, isOut);
    const pend = ops.filter((o) => o.status === 'pending');
    const pct = (c, p) => (p > 0 ? ((c - p) / p) * 100 : c > 0 ? null : null);
    return {
      inCur, outCur, inPct: pct(inCur, inPrev), outPct: pct(outCur, outPrev),
      pendingAmount: pend.reduce((s, o) => s + o.amount, 0), pendingCount: pend.length,
    };
  }, [ops]);

  const months = useMemo(() => {
    const names = t('months').split(',');
    const now = new Date();
    const out = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push({ key: `${d.getFullYear()}-${d.getMonth()}`, y: d.getFullYear(), m: d.getMonth(), label: names[d.getMonth()], in: 0, out: 0 });
    }
    for (const o of ops) {
      const b = out.find((x) => x.y === o.date.getFullYear() && x.m === o.date.getMonth());
      if (!b) continue;
      if (isIn(o)) b.in += o.amount;
      else if (isOut(o)) b.out += o.amount;
    }
    return out;
  }, [ops, t]);

  const recentPeople = useMemo(() => {
    const seen = new Map();
    for (const o of ops) {
      if (o.kind !== 'out' || !o.party || seen.has(o.party)) continue;
      seen.set(o.party, o);
      if (seen.size >= 5) break;
    }
    return [...seen.values()];
  }, [ops]);

  function describe(o) {
    const m = o.method === 'biwo' ? t('m_biwo') : METHOD_NAMES[o.method] || o.method || '';
    if (o.kind === 'deposit') return { title: t('tx_deposit', { m }), sub: m };
    if (o.kind === 'withdraw') return { title: t('tx_withdraw', { m }), sub: m };
    if (o.kind === 'in') return { title: t('tx_in'), sub: o.party };
    return { title: t('tx_out'), sub: o.party };
  }

  const dateFmt = (d) => d.toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeFmt = (d) => d.toLocaleTimeString(lang === 'en' ? 'en-US' : 'fr-FR', { hour: '2-digit', minute: '2-digit' });

  const hour = new Date().getHours();
  const hello = hour < 12 ? t('hello_morning') : hour < 18 ? t('hello_afternoon') : t('hello_evening');
  const firstName = (user?.fullName || '').split(' ')[0];

  const NAV = [
    { id: 'dashboard', icon: LayoutGrid, label: t('nav_dashboard') },
    { id: 'analytics', icon: BarChart3, label: t('nav_analytics') },
    { id: 'activity', icon: ListOrdered, label: t('nav_activity') },
    { id: 'card', icon: CreditCard, label: t('nav_card') },
    { id: 'account', icon: Building2, label: t('nav_account') },
  ];

  const LANGS = [['ht', 'Kreyòl'], ['fr', 'Français'], ['en', 'English']];

  // ---------- Ba anwo ----------
  const topBar = (
    <header className="sticky top-0 z-40 border-b backdrop-blur" style={{ background: 'rgba(255,255,255,.92)', borderColor: K.border }}>
      <div className="max-w-[1440px] mx-auto px-4 lg:px-6 h-16 flex items-center gap-3">
        <img src="/brand/logo-full.png" alt="BLICPay" className="h-8 w-auto" />
        <nav className="hidden md:flex mx-auto items-center gap-1 p-1 rounded-full" style={{ background: K.bg }}>
          {NAV.map((n) => (
            <button key={n.id} onClick={() => setPage(n.id)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition"
              style={page === n.id ? { background: K.navy, color: '#fff' } : { color: K.muted }}>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="ml-auto md:ml-0 flex items-center gap-1.5">
          <div className="relative">
            <button onClick={() => { setLangOpen((v) => !v); setMenuOpen(false); }} className="h-10 px-3 rounded-full border flex items-center gap-1.5 text-sm font-semibold" style={{ borderColor: K.border }}>
              <Globe size={16} /> <span className="uppercase">{lang}</span>
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded-2xl border shadow-xl p-1.5 z-50" style={{ background: K.card, borderColor: K.border }}>
                {LANGS.map(([code, name]) => (
                  <button key={code} onClick={() => { setLang(code); setLangOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium flex justify-between"
                    style={lang === code ? { background: K.skySoft, color: K.navy } : {}}>
                    {name}{lang === code && <CheckCircle2 size={15} />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button onClick={() => { onToggleNotif?.(); setMenuOpen(false); setLangOpen(false); }} className="relative w-10 h-10 rounded-full border flex items-center justify-center" style={{ borderColor: K.border }} aria-label={t('notifications')}>
              <Bell size={17} />
              {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ background: K.danger }}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
            {showNotif && (
              <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl border shadow-xl p-2 z-50" style={{ background: K.card, borderColor: K.border }}>
                <p className="px-2 py-1.5 text-sm font-bold">{t('notifications')}</p>
                {notifications.length === 0 ? (
                  <p className="px-2 py-6 text-sm text-center" style={{ color: K.muted }}>{t('no_notifications')}</p>
                ) : notifications.slice(0, 20).map((n, i) => (
                  <div key={n.id || i} className="px-2 py-2.5 rounded-xl" style={!n.read ? { background: K.skySoft } : {}}>
                    <p className="text-sm font-semibold">{n.title}</p>
                    {n.body && <p className="text-xs mt-0.5" style={{ color: K.muted }}>{n.body}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={onSettings} className="hidden sm:flex w-10 h-10 rounded-full border items-center justify-center" style={{ borderColor: K.border }} aria-label={t('settings')}>
            <Settings size={17} />
          </button>
          <div className="relative">
            <button onClick={() => { setMenuOpen((v) => !v); setLangOpen(false); }} className="flex items-center gap-2 pl-1 pr-1 sm:pr-3 h-10 rounded-full border" style={{ borderColor: K.border }}>
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: `linear-gradient(135deg, ${K.navy}, ${K.sky})` }}>{initials(bizName)}</span>
              <span className="hidden lg:block text-left leading-tight">
                <span className="block text-sm font-semibold max-w-[150px] truncate">{bizName}</span>
                <span className="block text-[11px]" style={{ color: K.muted }}>{user?.clientId}</span>
              </span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-60 rounded-2xl border shadow-xl p-1.5 z-50" style={{ background: K.card, borderColor: K.border }}>
                <div className="px-3 py-2.5">
                  <p className="text-sm font-bold truncate">{bizName}</p>
                  <p className="text-xs" style={{ color: K.muted }}>{user?.fullName} • {user?.clientId}</p>
                </div>
                {[
                  [Building2, t('nav_account'), () => setPage('account')],
                  [Settings, t('settings'), onSettings],
                  [Lock, t('change_password'), onChangePassword],
                  [HelpCircle, t('support'), onSupport],
                ].map(([Icon, label, fn]) => (
                  <button key={label} onClick={() => { setMenuOpen(false); fn?.(); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-50">
                    <Icon size={16} style={{ color: K.muted }} />{label}
                  </button>
                ))}
                <button onClick={onLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-red-50" style={{ color: K.danger }}>
                  <LogOut size={16} />{t('logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );

  // ---------- Ray goch (gwo ekran) ----------
  const sideRail = (
    <aside className="hidden xl:flex flex-col items-center gap-2 w-[72px] shrink-0 pt-6 sticky top-16 h-[calc(100vh-64px)]">
      {NAV.map((n) => (
        <button key={n.id} onClick={() => setPage(n.id)} title={n.label}
          className="w-11 h-11 rounded-2xl flex items-center justify-center transition"
          style={page === n.id ? { background: K.navy, color: '#fff' } : { color: K.muted, background: K.card, border: `1px solid ${K.border}` }}>
          <n.icon size={19} />
        </button>
      ))}
      <div className="mt-auto mb-6 flex flex-col gap-2">
        <button onClick={onSupport} title={t('support')} className="w-11 h-11 rounded-2xl flex items-center justify-center border" style={{ color: K.muted, background: K.card, borderColor: K.border }}><HelpCircle size={19} /></button>
        <button onClick={onLogout} title={t('logout')} className="w-11 h-11 rounded-2xl flex items-center justify-center border" style={{ color: K.danger, background: K.card, borderColor: K.border }}><LogOut size={19} /></button>
      </div>
    </aside>
  );

  // ---------- Nav anba (telefòn) ----------
  const bottomNav = (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t px-2 pb-[env(safe-area-inset-bottom)]" style={{ background: K.card, borderColor: K.border }}>
      <div className="flex">
        {NAV.map((n) => (
          <button key={n.id} onClick={() => setPage(n.id)} className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold"
            style={{ color: page === n.id ? K.navy : K.muted }}>
            <span className="w-10 h-7 rounded-full flex items-center justify-center" style={page === n.id ? { background: K.skySoft } : {}}><n.icon size={18} /></span>
            {n.label}
          </button>
        ))}
      </div>
    </nav>
  );

  const pageHeader = (title, sub, right) => (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
      <div>
        <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight" style={{ color: K.ink }}>{title}</h1>
        {sub && <p className="text-sm mt-1" style={{ color: K.muted }}>{sub}</p>}
      </div>
      {right}
    </div>
  );







  const ctx = { t, lang, user, token, apiFetch, flash, balance, ops, months, stats, recentPeople, types, biz, profile, bizStatus, approved, bizName, loading, load, search, setSearch, setPage, setShowReceive, describe, dateFmt, timeFmt, hello, firstName, isIn, isOut, pageHeader, onDeposit, onWithdraw, onTransfer, onKyc, onSettings, onSupport, onChangePassword, onLogout };

  return (
    <div className="min-h-screen w-full" style={{ background: K.bg, color: K.ink }} onClick={() => { if (menuOpen) setMenuOpen(false); if (langOpen) setLangOpen(false); }}>
      {topBar}
      <div className="max-w-[1440px] mx-auto flex">
        {sideRail}
        <main className="flex-1 min-w-0 px-4 lg:px-6 xl:pl-2 pt-6 pb-28 md:pb-10">
          {page === 'dashboard' && <DashboardPage ctx={ctx} />}
          {page === 'analytics' && <AnalyticsPage ctx={ctx} />}
          {page === 'activity' && <ActivityPage ctx={ctx} />}
          {page === 'card' && <CardPage ctx={ctx} />}
          {page === 'account' && <AccountPage ctx={ctx} />}
        </main>
      </div>
      {bottomNav}
      {showReceive && <ReceiveModal ctx={ctx} />}
    </div>
  );
}
