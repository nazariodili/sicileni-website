/**
 * Cloudflare Worker – Wedding Photos (R2)
 * - POST  /api/upload-url  -> returns presigned PUT url for direct upload to R2
 * - GET   /api/photos      -> returns list of photos (URLs served by this Worker)
 * - GET   /img/<key>       -> serves image bytes from R2
 *
 * ✅ No custom domain required: works on workers.dev
 * ✅ Simple CORS: Access-Control-Allow-Origin: *
 *
 * Bindings / Secrets needed in Worker settings:
 * - R2 binding: PHOTOS -> your R2 bucket (e.g. "sicileni-wedding-photos")
 * - Secrets:
 *   - EVENT_CODE
 *   - R2_ACCOUNT_ID
 *   - R2_ACCESS_KEY_ID
 *   - R2_SECRET_ACCESS_KEY
 *
 * Notes:
 * - Bucket name used for signing MUST match the bucket name used by your R2 S3 endpoint.
 * - This worker serves images via /img/<key> from the PHOTOS R2 binding.
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() })
    }

    try {
      if (url.pathname === "/api/photos" && request.method === "GET") {
        return await handleListPhotos(request, env)
      }

      // ✅ Upload via Worker (multipart/form-data)
      if (url.pathname === "/api/upload" && request.method === "POST") {
        return await handleUploadViaWorker(request, env)
      }

      // Serve images from R2 through Worker
      if (url.pathname.startsWith("/img/") && request.method === "GET") {
        const key = decodeURIComponent(url.pathname.replace("/img/", ""))
        const res = await handleServeImage(env, key)

        // add CORS to image response too
        const headers = new Headers(res.headers)
        for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v)
        return new Response(res.body, { status: res.status, headers })
      }

      return new Response("Not found", {
        status: 404,
        headers: { ...corsHeaders(), "Content-Type": "text/plain" },
      })
    } catch (e) {
      return new Response("Internal error", {
        status: 500,
        headers: { ...corsHeaders(), "Content-Type": "text/plain" },
      })
    }
  },
}

// -----------------------
// CORS (simple, allow all)
// -----------------------
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Event-Code",
    "Access-Control-Max-Age": "86400",
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
  })
}

function jsonError(message, status = 400) {
  return json({ error: message }, status)
}

// -----------------------
// GET /api/photos
// -----------------------
async function handleListPhotos(request, env) {
  const listed = await env.PHOTOS.list({ prefix: "uploads/" })

  // Best-effort newest first (list ordering not guaranteed)
  const keys = listed.objects.map((o) => o.key).filter(Boolean).reverse()

  const base = new URL(request.url).origin
  const photos = keys.map((key) => ({
    key,
    url: `${base}/img/${encodeURIComponent(key)}`,
  }))

  return json({ photos })
}

// -----------------------
// POST /api/upload  (multipart/form-data)
// headers: X-Event-Code: <EVENT_CODE>
// form-data: file=<File>
// -----------------------
async function handleUploadViaWorker(request, env) {
  const eventCode = request.headers.get("x-event-code") || ""
  if (!env.EVENT_CODE) return jsonError("EVENT_CODE missing", 500)
  if (eventCode !== env.EVENT_CODE) return jsonError("Unauthorized", 401)

  const contentType = request.headers.get("content-type") || ""
  if (!contentType.includes("multipart/form-data")) {
    return jsonError("Expected multipart/form-data", 400)
  }

  const form = await request.formData()
  const file = form.get("file")
  if (!(file instanceof File)) return jsonError("Missing 'file' field", 400)

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]
  if (!allowedTypes.includes(file.type)) return jsonError("File type not allowed", 400)

  const maxSize = 15 * 1024 * 1024 // 15MB
  if (file.size > maxSize) return jsonError("File too large (max 15MB)", 400)

  const safeName = (file.name || "photo")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .slice(0, 80)

  const key = `uploads/${Date.now()}-${crypto.randomUUID()}-${safeName}`

  // Save to R2
  await env.PHOTOS.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  })

  const base = new URL(request.url).origin
  return json({
    key,
    url: `${base}/img/${encodeURIComponent(key)}`,
  })
}

// -----------------------
// GET /img/<key>
// -----------------------
async function handleServeImage(env, key) {
  const obj = await env.PHOTOS.get(key)
  if (!obj) return new Response("Not found", { status: 404 })

  const headers = new Headers()
  obj.writeHttpMetadata(headers)
  headers.set("Cache-Control", "public, max-age=3600")

  return new Response(obj.body, { headers })
}
