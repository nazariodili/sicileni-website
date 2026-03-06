# Framer Site Environment

Questa cartella contiene i code component da importare in Framer.

## Struttura
- `components/RSVP_Google_Sheets.tsx`: componente RSVP per Framer.
- `components/WeddingPhotoWall.tsx`: wall fotografico per upload + gallery da Cloudflare Worker.

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
5. Personalizza testi e layout (colonne, gap, radius, ordine foto) dalle property controls.
