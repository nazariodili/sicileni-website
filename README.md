# Sicileni Wedding

Repository organizzato in **2 ambienti separati**:

1. `framer-site/` → ambiente dedicato al sito su Framer (code components).
2. `cloudflare-worker/` → ambiente dedicato al Worker Cloudflare (API upload/lista/serve immagini su R2).

---

## 1) Ambiente Framer (`framer-site`)

Contiene i componenti custom da usare nel progetto Framer.

### Contenuto
- `framer-site/components/RSVP_Google_Sheets.tsx`
- `framer-site/components/WeddingPhotoWall.tsx`
  - UI aggiornata: action bar sempre sticky bottom con props Framer dedicate (Fill, Padding, Radius, Border, Shadows, Z Index) per styling e UX.
  - Fix controllo `Shadows`: ora il valore BoxShadow proveniente dalle property controls Framer viene normalizzato correttamente anche quando arriva come oggetto/lista, quindi lo shadow della sticky action bar si applica sempre.
  - Overlay gallery completamente ridisegnato: navigazione foto con frecce, tastiera (← → Esc) e swipe touch.
  - Il lightbox mostra ora l'immagine senza riquadro quadrato forzato, con visualizzazione fluida in full viewport.
  - Lazy loading progressivo della galleria: rendering iniziale a blocchi e caricamento automatico di altre foto durante lo scroll.
  - Nuovo limite preview canvas Framer (`Canvas · Max foto`) per ridurre il carico in editing mostrando solo le prime N immagini nel canvas.
  - Rimossa la card/cella di upload fissa dalla griglia foto; l'upload resta disponibile solo nella action bar sticky.
  - Nel lightbox è disponibile un pulsante download per salvare la foto aperta in dimensione originale: il download viene forzato in full size tramite query `?download=1`.
  - Durante upload foto in corso, il pulsante refresh della action bar viene sostituito da un indicatore circolare di avanzamento percentuale (con icona stop centrale) per feedback immediato sul caricamento.
- `framer-site/README.md`

### Come usarlo
1. Apri Framer e vai nei Code Components.
2. Inserisci il contenuto del file `RSVP_Google_Sheets.tsx` o `WeddingPhotoWall.tsx`.
3. Imposta le property del componente.
4. Configura l'endpoint del componente verso il dominio del Worker Cloudflare.

---

## 2) Ambiente Cloudflare Worker (`cloudflare-worker`)

Contiene il Worker che:
- gestisce upload immagini (`POST /api/upload`)
- elenca foto (`GET /api/photos`)
- serve immagini da R2 (`GET /img/<key>`)

### Contenuto
- `cloudflare-worker/src/index.js`
- `cloudflare-worker/wrangler.toml`
- `cloudflare-worker/package.json`

### Prerequisiti
- account Cloudflare
- bucket R2 creato
- Node.js installato

### Setup rapido
```bash
cd cloudflare-worker
npm install
```

### Configurazioni Worker
Nel dashboard (o via wrangler) imposta:

#### Binding R2
- binding: `PHOTOS`
- bucket: il tuo bucket R2 (es. `sicileni-wedding-photos`)

#### Secret
```bash
npx wrangler secret put EVENT_CODE
npx wrangler secret put R2_ACCOUNT_ID
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
```

> Nota: il codice attuale usa in modo diretto `EVENT_CODE` per autorizzare upload. Gli altri secret sono mantenuti perché presenti nelle specifiche iniziali.

### Esecuzione locale
```bash
npm run dev
```

### Deploy
```bash
npm run deploy
```

---

## Endpoint disponibili

Con Worker pubblicato su `https://<nome-worker>.<subdomain>.workers.dev`:

- `GET /api/photos`
- `POST /api/upload` (multipart/form-data con campo `file` e header `X-Event-Code`)
- `GET /img/<key>` (supporta anche `?download=1` per forzare il download dell'originale)

Esempio base upload:
```bash
curl -X POST "https://<worker>.workers.dev/api/upload" \
  -H "X-Event-Code: <EVENT_CODE>" \
  -F "file=@/percorso/immagine.jpg"
```

---

## Note operative
- CORS aperto (`Access-Control-Allow-Origin: *`) nel Worker.
- Limite upload per file: **15MB**.
- MIME consentiti: `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/heif`.
- Le immagini sono salvate con prefisso `uploads/` in R2.
