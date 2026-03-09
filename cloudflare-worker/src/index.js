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
  const requestedQuality = Number(url.searchParams.get("q") || 85)
  const downloadRequested = url.searchParams.get("download") === "1"

  const width = requestedWidth > 0 ? clamp(requestedWidth, 100, 2400) : null
  const quality = clamp(requestedQuality || 85, 50, 90)

  const originalHeaders = new Headers()
  obj.writeHttpMetadata(originalHeaders)

  for (const [k, v] of Object.entries(corsHeaders())) originalHeaders.set(k, v)
  originalHeaders.set("Cache-Control", "public, max-age=31536000, immutable")

  const originalContentType =
    originalHeaders.get("Content-Type") || "image/jpeg"

  // Download originale o immagine senza width richiesta
  if (downloadRequested || !width) {
    if (downloadRequested) {
      const fileName = key.split("/").pop() || "photo"
      originalHeaders.set(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      )
    }

    return new Response(obj.body, {
      status: 200,
      headers: originalHeaders,
    })
  }

  // Trasformazione direttamente dai byte letti da R2
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

  return new Response(transformed.body, {
    status: transformed.status,
    headers,
  })
}
