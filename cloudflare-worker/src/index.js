/**
 * Cloudflare Worker – Wedding Photos (R2) + Images binding
 *
 * Routes:
 * - GET  /api/photos
 * - POST /api/upload
 * - GET  /img/<key>?w=400&q=78
 *
 * Notes:
 * - Originals stay in R2
 * - Resizing is done with env.IMAGES binding
 * - No internal resize subrequest needed
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() })
    }

    try {
      if (url.pathname === "/api/photos" && request.method === "GET") {
        return await handleListPhotos(request, env)
      }

      if (url.pathname === "/api/upload" && request.method === "POST") {
        return await handleUploadViaWorker(request, env)
      }

if (url.pathname.startsWith("/img/") && request.method === "GET") {
  const key = decodeURIComponent(url.pathname.replace("/img/", ""))
  return await handleServeImage(request, env, ctx, key)
}

      return new Response("Not found", {
        status: 404,
        headers: {
          ...corsHeaders(),
          "Content-Type": "text/plain",
        },
      })
     } catch (e) {
      console.error("Worker error:", e)
      return new Response("Internal error", {
        status: 500,
        headers: {
          ...corsHeaders(),
          "Content-Type": "text/plain",
        },
      })
    }
  },
}

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

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

async function handleListPhotos(request, env) {
  const listed = await env.PHOTOS.list({
    prefix: "uploads/",
    limit: 300,
  })

  const base = new URL(request.url).origin
  const objects = listed.objects
  const photos = []

  for (let i = objects.length - 1; i >= 0; i--) {
    const key = objects[i]?.key
    if (!key) continue

    photos.push({
      key,
      url: `${base}/img/${encodeURIComponent(key)}`,
    })
  }

  return json({ photos })
}

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

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
  ]

  if (!allowedTypes.includes(file.type)) {
    return jsonError("File type not allowed", 400)
  }

  const maxSize = 15 * 1024 * 1024
  if (file.size > maxSize) {
    return jsonError("File too large (max 15MB)", 400)
  }

  const safeName = (file.name || "photo")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .slice(0, 80)

  const key = `uploads/${Date.now()}-${crypto.randomUUID()}-${safeName}`

  await env.PHOTOS.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  })

  const base = new URL(request.url).origin

  return json({
    key,
    url: `${base}/img/${encodeURIComponent(key)}`,
  })
}

async function handleServeImage(request, env, ctx, key) {
  const url = new URL(request.url)

  const requestedWidth = Number(url.searchParams.get("w") || 0)
  const requestedQuality = Number(url.searchParams.get("q") || 85)
  const downloadRequested = url.searchParams.get("download") === "1"

  const width = requestedWidth > 0 ? clamp(requestedWidth, 100, 2400) : null
  const quality = clamp(requestedQuality || 85, 50, 90)

  // Se è download o immagine originale, niente transform e niente cache custom
  if (downloadRequested || !width) {
    const obj = await env.PHOTOS.get(key)
    if (!obj) {
      return new Response("Not found", {
        status: 404,
        headers: corsHeaders(),
      })
    }

const headers = new Headers()
obj.writeHttpMetadata(headers)

// fallback Content-Type se manca
if (!headers.get("Content-Type")) {
  headers.set("Content-Type", "image/jpeg")
}

for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v)
headers.set("Cache-Control", "public, max-age=31536000, immutable")

    if (downloadRequested) {
      const fileName = key.split("/").pop() || "photo"
      headers.set(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      )
    }

    return new Response(obj.body, {
      status: 200,
      headers,
    })
  }

  // Cache key separata per ogni variante (w/q)
  const cacheUrl = new URL(request.url)
  cacheUrl.pathname = `/__image_cache__/${encodeURIComponent(key)}`
  cacheUrl.searchParams.set("w", String(width))
  cacheUrl.searchParams.set("q", String(quality))
  cacheUrl.searchParams.set("format", "webp")

  const cacheKey = new Request(cacheUrl.toString(), {
    method: "GET",
  })

  const cache = caches.default

  // 1) prova cache
  let cached = await cache.match(cacheKey)
  if (cached) {
    const cachedHeaders = new Headers(cached.headers)
    for (const [k, v] of Object.entries(corsHeaders())) cachedHeaders.set(k, v)
    cachedHeaders.set("X-Image-Cache", "HIT")

    return new Response(cached.body, {
      status: cached.status,
      headers: cachedHeaders,
    })
  }

  // 2) se non c'è in cache, leggi da R2
  const obj = await env.PHOTOS.get(key)
  if (!obj) {
    return new Response("Not found", {
      status: 404,
      headers: corsHeaders(),
    })
  }

  const outputFormat = "image/webp"

  const transformed = (
    await env.IMAGES.input(obj.body)
      .transform({
        width,
        fit: "scale-down",
      })
      .output({
        format: outputFormat,
        quality,
      })
  ).response()

  const headers = new Headers(transformed.headers)
  for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v)
  headers.set("Cache-Control", "public, max-age=31536000, immutable")
  headers.set("Content-Type", outputFormat)
  headers.set("X-Image-Cache", "MISS")

  const responseToCache = new Response(transformed.body, {
    status: transformed.status,
    headers,
  })

  if (transformed.ok) {
    ctx.waitUntil(cache.put(cacheKey, responseToCache.clone()))
  }

  return responseToCache
}
