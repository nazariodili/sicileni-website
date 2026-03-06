/**
 * Cloudflare Worker – Wedding Photos (R2) + image resizing
 *
 * Routes:
 * - GET  /api/photos
 * - POST /api/upload
 * - GET  /img/<key>?w=400
 *
 * Notes:
 * - Originals stay in R2
 * - Worker serves resized versions through Cloudflare image resizing
 * - No Cloudflare Images product required
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
        return await handleServeImage(request, env, key)
      }

      return new Response("Not found", {
        status: 404,
        headers: {
          ...corsHeaders(),
          "Content-Type": "text/plain",
        },
      })
    } catch (e) {
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
  const listed = await env.PHOTOS.list({ prefix: "uploads/" })

  const keys = listed.objects
    .map((o) => o.key)
    .filter(Boolean)
    .reverse()

  const base = new URL(request.url).origin

  const photos = keys.map((key) => ({
    key,
    url: `${base}/img/${encodeURIComponent(key)}`,
  }))

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

async function handleServeImage(request, env, key) {
  const obj = await env.PHOTOS.get(key)
  if (!obj) {
    return new Response("Not found", {
      status: 404,
      headers: corsHeaders(),
    })
  }

  const url = new URL(request.url)

  const requestedWidth = Number(url.searchParams.get("w") || 0)
  const downloadRequested = url.searchParams.get("download") === "1"
  const requestedQuality = Number(url.searchParams.get("q") || 85)

  const width = requestedWidth > 0 ? clamp(requestedWidth, 100, 2400) : null
  const quality = clamp(requestedQuality || 85, 50, 90)

  const headers = new Headers()
  obj.writeHttpMetadata(headers)

  headers.set("Cache-Control", "public, max-age=31536000, immutable")
  for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v)

  if (downloadRequested) {
    const fileName = key.split("/").pop() || "photo"
    headers.set("Content-Disposition", `attachment; filename="${fileName}"`)
  }

  const contentType =
    headers.get("Content-Type") || "image/jpeg"

  // Se non viene richiesta una width, servi l'originale
  if (!width) {
    return new Response(obj.body, {
      status: 200,
      headers,
    })
  }

  // Per image resizing serve fetch() di una URL pubblica.
  // Quindi richiamiamo internamente la stessa immagine originale con un flag.
  const origin = url.origin
  const originalUrl = `${origin}/img/${encodeURIComponent(key)}?original=1`

  // Se c'è original=1, servi l'originale e non entrare di nuovo nel resize loop
  if (url.searchParams.get("original") === "1") {
    return new Response(obj.body, {
      status: 200,
      headers,
    })
  }

  const resizedResponse = await fetch(originalUrl, {
    cf: {
      image: {
        width,
        quality,
        fit: "scale-down",
        metadata: "none",
        format: "webp",
        dpr: 2
      },
    },
  })

  const resizedHeaders = new Headers(resizedResponse.headers)
  for (const [k, v] of Object.entries(corsHeaders())) resizedHeaders.set(k, v)
  resizedHeaders.set("Cache-Control", "public, max-age=31536000, immutable")
  if (!resizedHeaders.get("Content-Type")) {
    resizedHeaders.set("Content-Type", contentType)
  }

  return new Response(resizedResponse.body, {
    status: resizedResponse.status,
    headers: resizedHeaders,
  })
}
