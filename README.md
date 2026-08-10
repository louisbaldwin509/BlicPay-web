# BLICPay — Web

Sit web BLICPay (kliyan), bati ak React + Vite + Tailwind. Sa a se `blicpay-app.jsx`
mete nan yon vrè pwojè ki ka deplwaye — sa retire limit CSP claude.ai a te genyen an,
paske isit la sit la ap kouri tèt li, poukont li, sou pwòp domèn li.

## Teste an lokal

```bash
npm install
npm run dev
```

Louvri lyen ki parèt la (anjeneral http://localhost:5173).

## Deplwaye sou Vercel (gratis)

1. Pouse dosye sa a sou GitHub (menm jan ak blicpay-backend — kreye yon nouvo repo,
   "uploading an existing file", glise tout bagay SAF `node_modules`)
2. Ale sou https://vercel.com, konekte ak GitHub
3. "Add New" → "Project" → chwazi repo a
4. Vercel rekonèt Vite otomatikman — klike "Deploy"
5. Apre kèk segond, ou gen yon URL piblik (egz. blicpay-web.vercel.app)

## Enpòtan

Sit sa a rele backend ki nan `src/App.jsx`, nan `API_BASE_URL` an wo nèt fichye a.
Li deja pwente sou backend Railway a — chanje l si adrès backend la chanje.
