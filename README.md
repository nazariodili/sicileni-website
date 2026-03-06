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
- `GET /img/<key>`

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

---

## Alleggerire il PhotoWall con Cloudflare Images

Se il wall fotografico contiene molte immagini ad alta risoluzione, il collo di bottiglia principale è il peso dei file originali serviti al browser. Con Cloudflare Images puoi servire automaticamente varianti ottimizzate (thumbnail per griglia + immagine più grande per lightbox), riducendo banda, tempi di caricamento e memoria usata nel client.

### Strategia consigliata
1. **Mantieni R2 come storage sorgente** per gli originali.
2. **Servi la griglia con immagini ridotte** (es. larghezza 600px, qualità 75, fit cover).
3. **Servi il lightbox con variante più ampia** (es. larghezza 1600px, qualità 82, fit contain).
4. **Aggiungi cache lunga sulle varianti** (`Cache-Control: public, max-age=31536000, immutable`).

### Integrazione rapida nel Worker
In `GET /img/<key>`, invece di streammare sempre l'originale R2, usa la trasformazione immagini Cloudflare via `fetch` con opzione `cf.image`:

```js
const imageWidth = Number(url.searchParams.get("w") || 600)
const imageQuality = Number(url.searchParams.get("q") || 75)

const originalUrl = `${base}/r2/${encodeURIComponent(key)}`
const transformed = await fetch(originalUrl, {
  cf: {
    image: {
      width: imageWidth,
      quality: imageQuality,
      fit: "cover",
      format: "auto",
      metadata: "none",
    },
  },
})
```

Poi dal componente Framer puoi richiedere URL separati:
- Griglia: `/img/<key>?w=600&q=75`
- Lightbox: `/img/<key>?w=1600&q=82`

### Impatto atteso
- Meno MB trasferiti per ogni refresh della gallery.
- Scroll più fluido nel PhotoWall su mobile.
- Minore probabilità di jank quando si apre il lightbox.
