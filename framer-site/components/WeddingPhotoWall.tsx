import * as React from "react"
import { addPropertyControls, ControlType, RenderTarget } from "framer"
import {
    Check,
    ChevronLeft,
    ChevronRight,
    ImagePlus,
    PlusSquare,
    RefreshCw,
    RotateCcw,
    Upload,
    X,
} from "lucide-react"

type PhotoItem = { key: string; url: string }
type UploadIconName = "plus-square" | "image-plus" | "upload"
type RefreshIconName = "refresh-cw" | "rotate-ccw"

type BoxShadowValue =
    | string
    | {
          inset?: boolean
          x?: number
          y?: number
          blur?: number
          spread?: number
          color?: string
      }
    | Array<{
          inset?: boolean
          x?: number
          y?: number
          blur?: number
          spread?: number
          color?: string
      }>

type Props = {
    workerBaseUrl: string
    eventCode: string

    refreshAriaLabel: string
    refreshingLabel: string
    errorLabel: string

    uploadIcon: UploadIconName
    refreshIcon: RefreshIconName

    columns: number
    gap: number
    cornerRadius: number

    maxFilesPerBatch: number
    maxFileMB: number
    newestFirst: boolean
    lazyLoadBatchSize: number
    canvasPreviewLimit: number

    successOverlayDurationMs: number
    successOverlayColor: string
    successCheckIconSize: number
    successCheckIconColor: string

    actionBarFill: string
    actionBarBorder: React.CSSProperties
    actionBarShadow: BoxShadowValue
    actionBarRadius: string
    actionBarPadding: string
    actionBarGap: number
    actionIconColor: string
    actionIconSize: number
    actionBarInsetX: number
    actionBarBottom: number
    actionBarZIndex: number
    uploadActionAriaLabel: string
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

function formatBytes(bytes: number) {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
}

function isAllowedImageType(type: string) {
    const allowed = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/heic",
        "image/heif",
    ]
    return allowed.includes(type)
}

function getUploadIcon(name: UploadIconName) {
    if (name === "image-plus") return ImagePlus
    if (name === "upload") return Upload
    return PlusSquare
}

function getRefreshIcon(name: RefreshIconName) {
    if (name === "rotate-ccw") return RotateCcw
    return RefreshCw
}

function toShadowCss(shadow: BoxShadowValue) {
    if (typeof shadow === "string") return shadow

    const list = Array.isArray(shadow) ? shadow : shadow ? [shadow] : []
    if (list.length === 0) return "none"

    const normalized = list
        .map((item) => {
            const x = Number(item?.x) || 0
            const y = Number(item?.y) || 0
            const blur = Number(item?.blur) || 0
            const spread = Number(item?.spread) || 0
            const color = item?.color || "rgba(0,0,0,0)"
            const inset = item?.inset ? "inset " : ""
            return `${inset}${x}px ${y}px ${blur}px ${spread}px ${color}`
        })
        .filter(Boolean)

    return normalized.length > 0 ? normalized.join(", ") : "none"
}

export default function WeddingPhotoWall(props: Props) {
    const {
        workerBaseUrl,
        eventCode,
        refreshAriaLabel,
        refreshingLabel,
        errorLabel,
        uploadIcon,
        refreshIcon,
        columns,
        gap,
        cornerRadius,
        maxFilesPerBatch,
        maxFileMB,
        newestFirst,
        lazyLoadBatchSize,
        canvasPreviewLimit,
        successOverlayDurationMs,
        successOverlayColor,
        successCheckIconSize,
        successCheckIconColor,
        actionBarFill,
        actionBarBorder,
        actionBarShadow,
        actionBarRadius,
        actionBarPadding,
        actionBarGap,
        actionIconColor,
        actionIconSize,
        actionBarInsetX,
        actionBarBottom,
        actionBarZIndex,
        uploadActionAriaLabel,
    } = props

    const photosPageSize = clamp(lazyLoadBatchSize, 1, 120)

    const UploadIcon = React.useMemo(() => getUploadIcon(uploadIcon), [uploadIcon])
    const RefreshIcon = React.useMemo(
        () => getRefreshIcon(refreshIcon),
        [refreshIcon]
    )

    const base = React.useMemo(
        () => (workerBaseUrl || "").replace(/\/+$/, ""),
        [workerBaseUrl]
    )

    const [photos, setPhotos] = React.useState<PhotoItem[]>([])
    const [loading, setLoading] = React.useState(false)
    const [uploading, setUploading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const [activeIndex, setActiveIndex] = React.useState<number | null>(null)

    const [successOverlayKeys, setSuccessOverlayKeys] = React.useState<Set<string>>(
        new Set()
    )

    const inputRef = React.useRef<HTMLInputElement | null>(null)
    const successOverlayTimeoutRef = React.useRef<number | null>(null)
    const touchStartXRef = React.useRef<number | null>(null)
    const loadMoreRef = React.useRef<HTMLDivElement | null>(null)

    const [visibleCount, setVisibleCount] = React.useState(photosPageSize)

    const isCanvasPreview = React.useMemo(() => {
        try {
            return RenderTarget.current() === RenderTarget.canvas
        } catch {
            return false
        }
    }, [])

    const effectiveCanvasPreviewLimit = clamp(canvasPreviewLimit, 0, 120)

    const hasLightbox =
        activeIndex !== null && activeIndex >= 0 && activeIndex < photos.length
    const currentPhoto = hasLightbox ? photos[activeIndex] : null

    const goToIndex = React.useCallback(
        (next: number) => {
            if (photos.length === 0) return
            const wrapped = (next + photos.length) % photos.length
            setActiveIndex(wrapped)
        },
        [photos.length]
    )

    const goToPrev = React.useCallback(() => {
        if (activeIndex === null) return
        goToIndex(activeIndex - 1)
    }, [activeIndex, goToIndex])

    const goToNext = React.useCallback(() => {
        if (activeIndex === null) return
        goToIndex(activeIndex + 1)
    }, [activeIndex, goToIndex])

    async function fetchPhotos() {
        if (!base) return
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`${base}/api/photos`, { method: "GET" })
            if (!res.ok) throw new Error(`GET /api/photos failed (${res.status})`)

            const data = await res.json()
            const list: PhotoItem[] = Array.isArray(data?.photos) ? data.photos : []
            const ordered = newestFirst ? list : [...list].reverse()
            setPhotos(ordered)
            setActiveIndex((prev) => {
                if (prev === null) return prev
                if (ordered.length === 0) return null
                return Math.min(prev, ordered.length - 1)
            })
            return ordered
        } catch (e: any) {
            setError(e?.message || "Failed to load photos")
            return []
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => {
        fetchPhotos()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [base, newestFirst])

    async function uploadViaWorker(file: File) {
        const form = new FormData()
        form.append("file", file)

        const res = await fetch(`${base}/api/upload`, {
            method: "POST",
            headers: { "X-Event-Code": eventCode },
            body: form,
        })

        if (!res.ok) {
            const text = await res.text().catch(() => "")
            throw new Error(`POST /api/upload failed (${res.status}) ${text}`)
        }

        return await res.json()
    }

    function handlePickFiles() {
        inputRef.current?.click()
    }

    async function handleFilesSelected(files: FileList | null) {
        if (!files || files.length === 0) return

        if (!base) {
            setError("Worker URL is missing")
            return
        }
        if (!eventCode) {
            setError("Event code is missing")
            return
        }

        const picked = Array.from(files).slice(0, clamp(maxFilesPerBatch, 1, 100))
        const maxBytes = clamp(maxFileMB, 1, 50) * 1024 * 1024

        const validated: File[] = []
        const validationErrors: string[] = []

        for (const f of picked) {
            if (!isAllowedImageType(f.type)) {
                validationErrors.push(`${f.name}: tipo non supportato`)
                continue
            }
            if (f.size > maxBytes) {
                validationErrors.push(`${f.name}: troppo grande (${formatBytes(f.size)})`)
                continue
            }
            validated.push(f)
        }

        if (validationErrors.length > 0) {
            setError(validationErrors.join(" · "))
        }
        if (validated.length === 0) return

        setUploading(true)
        if (validationErrors.length === 0) setError(null)

        const uploadedKeys = new Set<string>()
        const uploadedUrls = new Set<string>()

        try {
            for (const f of validated) {
                const uploadResult = await uploadViaWorker(f)
                if (typeof uploadResult?.key === "string") uploadedKeys.add(uploadResult.key)
                if (typeof uploadResult?.url === "string") uploadedUrls.add(uploadResult.url)
            }

            const refreshedPhotos = (await fetchPhotos()) || []

            const uploadedMatches = refreshedPhotos
                .filter((photo) => uploadedKeys.has(photo.key) || uploadedUrls.has(photo.url))
                .map((photo) => photo.key)

            const fallbackCount = validated.length
            const fallbackMatches = refreshedPhotos
                .slice(
                    newestFirst ? 0 : Math.max(0, refreshedPhotos.length - fallbackCount),
                    newestFirst ? fallbackCount : refreshedPhotos.length
                )
                .map((photo) => photo.key)

            const keysToHighlight =
                uploadedMatches.length > 0 ? uploadedMatches : fallbackMatches

            if (keysToHighlight.length > 0) {
                setSuccessOverlayKeys(new Set(keysToHighlight))

                if (successOverlayTimeoutRef.current) {
                    window.clearTimeout(successOverlayTimeoutRef.current)
                }
                successOverlayTimeoutRef.current = window.setTimeout(() => {
                    setSuccessOverlayKeys(new Set())
                    successOverlayTimeoutRef.current = null
                }, clamp(successOverlayDurationMs, 500, 8000))
            }
        } catch (e: any) {
            setError(e?.message || "Upload failed")
        } finally {
            setUploading(false)
            if (inputRef.current) inputRef.current.value = ""
        }
    }

    React.useEffect(() => {
        if (!hasLightbox) return

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setActiveIndex(null)
            } else if (event.key === "ArrowLeft") {
                event.preventDefault()
                goToPrev()
            } else if (event.key === "ArrowRight") {
                event.preventDefault()
                goToNext()
            }
        }

        document.addEventListener("keydown", onKeyDown)
        return () => {
            document.removeEventListener("keydown", onKeyDown)
        }
    }, [goToNext, goToPrev, hasLightbox])

    React.useEffect(() => {
        return () => {
            if (successOverlayTimeoutRef.current) {
                window.clearTimeout(successOverlayTimeoutRef.current)
            }
        }
    }, [])

    React.useEffect(() => {
        setVisibleCount(photosPageSize)
    }, [photos.length, photosPageSize])

    React.useEffect(() => {
        const sentinel = loadMoreRef.current
        if (!sentinel) return
        if (visibleCount >= photos.length) return

        const observer = new IntersectionObserver(
            (entries) => {
                const first = entries[0]
                if (!first?.isIntersecting) return
                setVisibleCount((prev) =>
                    Math.min(prev + photosPageSize, photos.length)
                )
            },
            {
                root: null,
                rootMargin: "240px",
                threshold: 0,
            }
        )

        observer.observe(sentinel)
        return () => observer.disconnect()
    }, [photos.length, photosPageSize, visibleCount])

    const visiblePhotos = React.useMemo(() => {
        if (isCanvasPreview && effectiveCanvasPreviewLimit > 0) {
            return photos.slice(0, effectiveCanvasPreviewLimit)
        }

        return photos.slice(0, visibleCount)
    }, [
        photos,
        visibleCount,
        isCanvasPreview,
        effectiveCanvasPreviewLimit,
    ])

    const gridTemplateColumns = React.useMemo(() => {
        const c = clamp(columns, 1, 8)
        return `repeat(${c}, minmax(0, 1fr))`
    }, [columns])

    const stickyBarSpacer = clamp(actionBarBottom, 0, 140) + 112
    const actionBarShadowCss = React.useMemo(
        () => toShadowCss(actionBarShadow),
        [actionBarShadow]
    )

    return (
        <div
            style={{
                ...styles.wrap,
                paddingBottom: stickyBarSpacer,
            }}
        >
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={(e) => handleFilesSelected(e.target.files)}
            />

            {error ? (
                <div style={styles.error}>
                    {errorLabel}: {error}
                </div>
            ) : null}

            <div
                style={{
                    ...styles.grid,
                    gridTemplateColumns,
                    gap,
                }}
            >
                {visiblePhotos.map((p, index) => (
                    <button
                        key={p.key}
                        style={{
                            ...styles.card,
                            borderRadius: cornerRadius,
                        }}
                        onClick={() => setActiveIndex(index)}
                    >
                        <img
                            src={p.url}
                            alt=""
                            loading="lazy"
                            style={{
                                ...styles.img,
                                borderRadius: cornerRadius,
                            }}
                        />

                        {successOverlayKeys.has(p.key) ? (
                            <div
                                style={{
                                    ...styles.successOverlay,
                                    background: successOverlayColor,
                                }}
                            >
                                <Check
                                    size={clamp(successCheckIconSize, 12, 140)}
                                    color={successCheckIconColor}
                                    strokeWidth={2.6}
                                />
                            </div>
                        ) : null}
                    </button>
                ))}

                {!isCanvasPreview && visibleCount < photos.length ? (
                    <div
                        ref={loadMoreRef}
                        style={{
                            ...styles.loadMoreTrigger,
                            gridColumn: "1 / -1",
                        }}
                        aria-hidden="true"
                    />
                ) : null}
            </div>

            <div
                style={{
                    ...styles.stickyActionBarWrap,
                    left: clamp(actionBarInsetX, 0, 64),
                    right: clamp(actionBarInsetX, 0, 64),
                    bottom: clamp(actionBarBottom, 0, 140),
                    zIndex: clamp(actionBarZIndex, 0, 999999),
                }}
            >
                <div
                    style={{
                        ...styles.stickyActionBar,
                        background: actionBarFill,
                        ...actionBarBorder,
                        borderRadius: actionBarRadius,
                        boxShadow: actionBarShadowCss,
                        padding: actionBarPadding,
                        gap: clamp(actionBarGap, 4, 28),
                    }}
                >
                    <button
                        style={{
                            ...styles.stickyActionButton,
                            color: actionIconColor,
                            opacity: uploading ? 0.6 : 1,
                            pointerEvents: uploading ? "none" : "auto",
                        }}
                        onClick={handlePickFiles}
                        aria-label={uploadActionAriaLabel}
                        title={uploadActionAriaLabel}
                    >
                        <UploadIcon size={clamp(actionIconSize, 14, 64)} strokeWidth={2.1} />
                    </button>

                    <button
                        style={{
                            ...styles.stickyActionButton,
                            color: actionIconColor,
                            opacity: loading ? 0.6 : 1,
                            pointerEvents: loading ? "none" : "auto",
                        }}
                        onClick={fetchPhotos}
                        aria-label={loading ? refreshingLabel : refreshAriaLabel}
                        title={loading ? refreshingLabel : refreshAriaLabel}
                    >
                        <RefreshIcon
                            size={clamp(actionIconSize, 14, 64)}
                            strokeWidth={2.1}
                            style={
                                loading
                                    ? {
                                          animation: "weddingPhotoWallSpin 1s linear infinite",
                                      }
                                    : undefined
                            }
                        />
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes weddingPhotoWallSpin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @keyframes weddingLightboxFadeIn {
                    from { opacity: 0; transform: translateY(14px) scale(0.985); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>

            {hasLightbox && currentPhoto ? (
                <div style={styles.lightboxOverlay} onClick={() => setActiveIndex(null)}>
                    <div
                        style={styles.lightboxInner}
                        onClick={(e) => e.stopPropagation()}
                        onTouchStart={(e) => {
                            touchStartXRef.current = e.touches[0]?.clientX ?? null
                        }}
                        onTouchEnd={(e) => {
                            const start = touchStartXRef.current
                            const end = e.changedTouches[0]?.clientX
                            touchStartXRef.current = null
                            if (start === null || typeof end !== "number") return
                            const delta = end - start
                            if (Math.abs(delta) < 44) return
                            if (delta > 0) goToPrev()
                            if (delta < 0) goToNext()
                        }}
                    >
                        <button
                            style={{ ...styles.lightboxIconButton, ...styles.lightboxCloseButton }}
                            onClick={() => setActiveIndex(null)}
                            aria-label="Chiudi galleria"
                            title="Chiudi"
                        >
                            <X size={20} />
                        </button>

                        <button
                            style={{ ...styles.lightboxNavButton, ...styles.lightboxNavLeft }}
                            onClick={goToPrev}
                            aria-label="Foto precedente"
                            title="Precedente"
                        >
                            <ChevronLeft size={24} />
                        </button>

                        <figure style={styles.lightboxFigure}>
                            <img src={currentPhoto.url} alt="" style={styles.lightboxImg} />
                            <figcaption style={styles.lightboxMeta}>
                                {activeIndex! + 1} / {photos.length}
                            </figcaption>
                        </figure>

                        <button
                            style={{ ...styles.lightboxNavButton, ...styles.lightboxNavRight }}
                            onClick={goToNext}
                            aria-label="Foto successiva"
                            title="Successiva"
                        >
                            <ChevronRight size={24} />
                        </button>


                    </div>
                </div>
            ) : null}
        </div>
    )
}

WeddingPhotoWall.defaultProps = {
    workerBaseUrl: "",
    eventCode: "",
    refreshAriaLabel: "Aggiorna foto",
    refreshingLabel: "Carico…",
    errorLabel: "Errore",
    uploadIcon: "plus-square",
    refreshIcon: "refresh-cw",
    columns: 3,
    gap: 10,
    cornerRadius: 14,
    maxFilesPerBatch: 20,
    maxFileMB: 15,
    newestFirst: true,
    lazyLoadBatchSize: 18,
    canvasPreviewLimit: 24,
    successOverlayDurationMs: 2000,
    successOverlayColor: "rgba(187, 247, 208, 0.58)",
    successCheckIconSize: 64,
    successCheckIconColor: "rgba(21, 128, 61, 0.95)",
    actionBarFill: "rgba(243, 244, 246, 0.96)",
    actionBarBorder: {
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "rgba(17, 24, 39, 0.08)",
    },
    actionBarShadow: "0 12px 32px rgba(15, 23, 42, 0.2)",
    actionBarRadius: "999px",
    actionBarPadding: "12px 20px",
    actionBarGap: 18,
    actionIconColor: "rgba(55, 65, 81, 0.95)",
    actionIconSize: 30,
    actionBarInsetX: 18,
    actionBarBottom: 18,
    actionBarZIndex: 1100,
    uploadActionAriaLabel: "Carica foto",
}

const styles: Record<string, React.CSSProperties> = {
    wrap: {
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        fontFamily:
            'system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif',
    },
    error: {
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid rgba(220, 38, 38, 0.25)",
        background: "rgba(220, 38, 38, 0.06)",
        fontSize: 13,
        lineHeight: 1.4,
    },
    grid: { width: "100%", display: "grid" },
    loadMoreTrigger: {
        width: "100%",
        height: 1,
        pointerEvents: "none",
    },
    card: {
        appearance: "none",
        border: "1px solid rgba(0,0,0,0.10)",
        background: "transparent",
        padding: 0,
        cursor: "pointer",
        overflow: "hidden",
        aspectRatio: "1 / 1",
        position: "relative",
    },
    img: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
        transition: "transform 220ms ease",
    },
    successOverlay: {
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        pointerEvents: "none",
    },
    lightboxOverlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(8,10,18,0.86)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 999999,
        backdropFilter: "blur(5px)",
    },
    lightboxInner: {
        position: "relative",
        width: "min(1240px, 96vw)",
        maxHeight: "92vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 14,
        animation: "weddingLightboxFadeIn 220ms ease",
    },
    lightboxFigure: {
        margin: 0,
        width: "100%",
        height: "100%",
        minHeight: "55vh",
        maxHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },
    lightboxImg: {
        width: "100%",
        height: "100%",
        maxHeight: "74vh",
        objectFit: "contain",
        display: "block",
    },
    lightboxMeta: {
        margin: 0,
        color: "rgba(255,255,255,0.8)",
        fontSize: 13,
        letterSpacing: "0.04em",
    },
    lightboxIconButton: {
        appearance: "none",
        border: "1px solid rgba(255,255,255,0.18)",
        color: "white",
        background: "rgba(17, 24, 39, 0.52)",
        width: 42,
        height: 42,
        borderRadius: 999,
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
    },
    lightboxCloseButton: {
        position: "fixed",
        top: 18,
        right: 18,
        zIndex: 1000001,
    },
    lightboxNavButton: {
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        appearance: "none",
        border: "1px solid rgba(255,255,255,0.2)",
        color: "white",
        background: "rgba(17, 24, 39, 0.54)",
        width: 48,
        height: 48,
        borderRadius: 999,
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        zIndex: 2,
    },
    lightboxNavLeft: { left: 8 },
    lightboxNavRight: { right: 8 },
    stickyActionBarWrap: {
        position: "fixed",
        zIndex: 1100,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
    },
    stickyActionBar: {
        width: "fit-content",
        maxWidth: "100%",
        display: "inline-flex",
        alignItems: "center",
        borderStyle: "solid",
        pointerEvents: "auto",
    },
    stickyActionButton: {
        appearance: "none",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        width: 44,
        height: 44,
        borderRadius: 12,
        display: "grid",
        placeItems: "center",
    },
}

addPropertyControls(WeddingPhotoWall, {
    workerBaseUrl: {
        type: ControlType.String,
        title: "Worker URL",
        placeholder: "https://...workers.dev",
    },
    eventCode: {
        type: ControlType.String,
        title: "Event Code",
    },
    uploadIcon: {
        type: ControlType.Enum,
        title: "Upload · Icona",
        options: ["plus-square", "image-plus", "upload"],
        optionTitles: ["PlusSquare", "ImagePlus", "Upload"],
        defaultValue: "plus-square",
    },
    uploadActionAriaLabel: {
        type: ControlType.String,
        title: "Upload · ARIA",
        defaultValue: "Carica foto",
    },

    refreshIcon: {
        type: ControlType.Enum,
        title: "Refresh · Icona",
        options: ["refresh-cw", "rotate-ccw"],
        optionTitles: ["RefreshCw", "RotateCcw"],
        defaultValue: "refresh-cw",
    },
    refreshAriaLabel: {
        type: ControlType.String,
        title: "Refresh · Label",
        defaultValue: "Aggiorna foto",
    },
    refreshingLabel: {
        type: ControlType.String,
        title: "Refresh · Loading",
        defaultValue: "Carico…",
    },

    actionBarFill: {
        type: ControlType.Color,
        title: "Sticky · Fill",
        defaultValue: "rgba(243, 244, 246, 0.96)",
    },
    actionBarPadding: {
        type: ControlType.Padding,
        title: "Sticky · Padding",
        defaultValue: "12px 20px",
    },
    actionBarRadius: {
        type: ControlType.BorderRadius,
        title: "Sticky · Radius",
        defaultValue: "999px",
    },
    actionBarBorder: {
        type: ControlType.Border,
        title: "Sticky · Border",
        defaultValue: {
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "rgba(17, 24, 39, 0.08)",
        },
    },
    actionBarShadow: {
        type: ControlType.BoxShadow,
        title: "Sticky · Shadows",
        defaultValue: "0 12px 32px rgba(15, 23, 42, 0.2)",
    },
    actionBarGap: {
        type: ControlType.Number,
        title: "Sticky · Gap",
        defaultValue: 18,
        min: 4,
        max: 28,
        step: 1,
    },
    actionIconColor: {
        type: ControlType.Color,
        title: "Sticky · Icon color",
        defaultValue: "rgba(55, 65, 81, 0.95)",
    },
    actionIconSize: {
        type: ControlType.Number,
        title: "Sticky · Icon size",
        defaultValue: 30,
        min: 14,
        max: 64,
        step: 1,
    },
    actionBarInsetX: {
        type: ControlType.Number,
        title: "Sticky · Side inset",
        defaultValue: 18,
        min: 0,
        max: 64,
        step: 1,
    },
    actionBarBottom: {
        type: ControlType.Number,
        title: "Sticky · Bottom",
        defaultValue: 18,
        min: 0,
        max: 140,
        step: 1,
    },
    actionBarZIndex: {
        type: ControlType.Number,
        title: "Sticky · Z Index",
        defaultValue: 1100,
        min: 0,
        max: 999999,
        step: 1,
    },

    errorLabel: {
        type: ControlType.String,
        title: "Error Label",
        defaultValue: "Errore",
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 3,
        min: 1,
        max: 8,
        step: 1,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 10,
        min: 0,
        max: 40,
        step: 1,
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 14,
        min: 0,
        max: 40,
        step: 1,
    },
    maxFilesPerBatch: {
        type: ControlType.Number,
        title: "Max files",
        defaultValue: 20,
        min: 1,
        max: 100,
        step: 1,
    },
    maxFileMB: {
        type: ControlType.Number,
        title: "Max MB",
        defaultValue: 15,
        min: 1,
        max: 50,
        step: 1,
    },
    newestFirst: {
        type: ControlType.Boolean,
        title: "Newest first",
        defaultValue: true,
    },
    lazyLoadBatchSize: {
        type: ControlType.Number,
        title: "Lazy · Batch",
        defaultValue: 18,
        min: 1,
        max: 120,
        step: 1,
    },
    canvasPreviewLimit: {
        type: ControlType.Number,
        title: "Canvas · Max foto",
        defaultValue: 24,
        min: 0,
        max: 120,
        step: 1,
        description:
            "In Framer canvas mostra solo le prime N foto per evitare rallentamenti.",
    },
    successOverlayDurationMs: {
        type: ControlType.Number,
        title: "Success · Durata ms",
        defaultValue: 2000,
        min: 500,
        max: 8000,
        step: 100,
    },
    successOverlayColor: {
        type: ControlType.Color,
        title: "Success · Overlay",
        defaultValue: "rgba(187, 247, 208, 0.58)",
    },
    successCheckIconSize: {
        type: ControlType.Number,
        title: "Success · Check size",
        defaultValue: 64,
        min: 12,
        max: 140,
        step: 1,
    },
    successCheckIconColor: {
        type: ControlType.Color,
        title: "Success · Check color",
        defaultValue: "rgba(21, 128, 61, 0.95)",
    },
})
