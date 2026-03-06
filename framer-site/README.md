# Framer Site Environment

Questa cartella contiene i code component da importare in Framer.

## Struttura
- `components/RSVP_Google_Sheets.tsx`: componente RSVP per Framer.
- `components/WeddingPhotoWall.tsx`: wall fotografico con upload + gallery da Cloudflare Worker e action bar sticky responsive.

## Uso
1. Apri il progetto Framer.
2. Crea un nuovo Code Component.
3. Copia/incolla il contenuto di `components/RSVP_Google_Sheets.tsx`.
4. Configura le property controls nel canvas Framer.
5. Collega `endpointUrl` agli endpoint del Worker Cloudflare (`/api/upload`, `/api/photos`).

## WeddingPhotoWall
1. Crea un nuovo Code Component in Framer.
2. Copia/incolla `components/WeddingPhotoWall.tsx`.
3. Imposta `workerBaseUrl` con il dominio del Worker (`https://<worker>.workers.dev`).
4. Imposta `eventCode` con il codice evento usato nell'header `X-Event-Code`.
5. Personalizza testi, layout griglia e sticky action bar direttamente dalle property controls.
6. La action bar è **sticky bottom su mobile** e passa automaticamente a **sticky top su desktop** usando `desktopBreakpoint`.
7. Ogni aspetto della action bar è esposto come prop (sfondo, bordo, shadow, radius, padding, gap, dimensione icone, insets e offset top/bottom).
8. Upload e refresh sono accessibili dalla action bar (icone Lucide configurabili + label ARIA personalizzabili).
9. Dopo upload riuscito non viene mostrato il toast testuale: le foto appena caricate vengono evidenziate con overlay verde + check per 2 secondi (configurabile).
10. Overlay foto con UX moderna: frecce laterali, navigazione da tastiera (← → Esc) e swipe su touch.
11. L'immagine in overlay è mostrata in `object-fit: contain` per rispettare il formato originale.
