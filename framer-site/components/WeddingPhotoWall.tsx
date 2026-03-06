import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
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

type Props = {
    workerBaseUrl: string
    eventCode: string

    uploadButtonLabel: string
    refreshAriaLabel: string
    refreshingLabel: string
    errorLabel: string

    uploadIcon: UploadIconName
    refreshIcon: RefreshIconName
    refreshIconColor: string



    columns: number
    gap: number
    cornerRadius: number

    maxFilesPerBatch: number
    maxFileMB: number
    newestFirst: boolean

    successOverlayDurationMs: number
    successOverlayColor: string
    successCheckIconSize: number
    successCheckIconColor: string

    desktopBreakpoint: number
    actionBarBackground: string
    actionBarBorderColor: string
    actionBarBorderWidth: number
    actionBarShadow: string
    actionBarRadius: number
    actionBarPaddingX: number
    actionBarPaddingY: number
    actionBarGap: number
    actionIconColor: string
    actionIconSize: number
    actionBarInsetX: number
    actionBarMobileBottom: number
    actionBarDesktopTop: number
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

export default function WeddingPhotoWall(props: Props) {
    const {
        workerBaseUrl,
        eventCode,
        uploadButtonLabel,
        refreshAriaLabel,
        refreshingLabel,
        errorLabel,
        uploadIcon,
        refreshIcon,
        refreshIconColor,
        columns,
        gap,
        cornerRadius,
        maxFilesPerBatch,
        maxFileMB,
        newestFirst,
        successOverlayDurationMs,
        successOverlayColor,
        successCheckIconSize,
        successCheckIconColor,
        desktopBreakpoint,
        actionBarBackground,
        actionBarBorderColor,
        actionBarBorderWidth,
        actionBarShadow,
        actionBarRadius,
        actionBarPaddingX,
        actionBarPaddingY,
        actionBarGap,
        actionIconColor,
        actionIconSize,
        actionBarInsetX,
        actionBarMobileBottom,
        actionBarDesktopTop,
        uploadActionAriaLabel,
    } = props

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
    const [isDesktop, setIsDesktop] = React.useState(false)

    const inputRef = React.useRef<HTMLInputElement | null>(null)
    const successOverlayTimeoutRef = React.useRef<number | null>(null)
    const touchStartXRef = React.useRef<number | null>(null)

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
        if (typeof window === "undefined") return
        const breakpoint = clamp(desktopBreakpoint, 640, 1800)
        const media = window.matchMedia(`(min-width: ${breakpoint}px)`)
        const onChange = () => setIsDesktop(media.matches)
        onChange()
        media.addEventListener("change", onChange)
        return () => media.removeEventListener("change", onChange)
    }, [desktopBreakpoint])


    const gridTemplateColumns = React.useMemo(() => {
        const c = clamp(columns, 1, 8)
        return `repeat(${c}, minmax(0, 1fr))`
    }, [columns])

    const stickyBarAnchorStyle: React.CSSProperties = isDesktop
        ? {
              top: clamp(actionBarDesktopTop, 0, 72),
              bottom: "auto",
          }
        : {
              top: "auto",
              bottom: clamp(actionBarMobileBottom, 0, 120),
          }

    const stickyBarSpacer = isDesktop
        ? clamp(actionBarDesktopTop, 0, 72) + 86
        : clamp(actionBarMobileBottom, 0, 120) + 112

    return (
        <div
            style={{
                ...styles.wrap,
                paddingTop: isDesktop ? stickyBarSpacer : 0,
                paddingBottom: isDesktop ? 0 : stickyBarSpacer,
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
                {photos.map((p, index) => (
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
            </div>

            <div
                style={{
                    ...styles.stickyActionBarWrap,
                    left: clamp(actionBarInsetX, 0, 64),
                    right: clamp(actionBarInsetX, 0, 64),
                    ...stickyBarAnchorStyle,
                }}
            >
                <div
                    style={{
                        ...styles.stickyActionBar,
                        background: actionBarBackground,
                        borderColor: actionBarBorderColor,
                        borderWidth: clamp(actionBarBorderWidth, 0, 6),
                        borderRadius: clamp(actionBarRadius, 12, 999),
                        boxShadow: actionBarShadow,
                        padding: `${clamp(actionBarPaddingY, 6, 28)}px ${clamp(actionBarPaddingX, 10, 36)}px`,
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
                        title={uploadButtonLabel}
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
    uploadButtonLabel: "ADD A PHOTO",
    refreshAriaLabel: "Aggiorna foto",
    refreshingLabel: "Carico…",
    errorLabel: "Errore",
    uploadIcon: "plus-square",
    refreshIcon: "refresh-cw",
    refreshIconColor: "rgba(0,0,0,0.8)",
    columns: 3,
    gap: 10,
    cornerRadius: 14,
    maxFilesPerBatch: 20,
    maxFileMB: 15,
    newestFirst: true,
    successOverlayDurationMs: 2000,
    successOverlayColor: "rgba(187, 247, 208, 0.58)",
    successCheckIconSize: 64,
    successCheckIconColor: "rgba(21, 128, 61, 0.95)",
    desktopBreakpoint: 980,
    actionBarBackground: "rgba(243, 244, 246, 0.96)",
    actionBarBorderColor: "rgba(17, 24, 39, 0.08)",
    actionBarBorderWidth: 1,
    actionBarShadow: "0 12px 32px rgba(15, 23, 42, 0.2)",
    actionBarRadius: 999,
    actionBarPaddingX: 20,
    actionBarPaddingY: 12,
    actionBarGap: 18,
    actionIconColor: "rgba(55, 65, 81, 0.95)",
    actionIconSize: 30,
    actionBarInsetX: 18,
    actionBarMobileBottom: 18,
    actionBarDesktopTop: 16,
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

    uploadButtonLabel: {
        type: ControlType.String,
        title: "Upload · Testo",
        defaultValue: "ADD A PHOTO",
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
    refreshIconColor: {
        type: ControlType.Color,
        title: "Refresh · Icon color",
        defaultValue: "rgba(0,0,0,0.8)",
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

    desktopBreakpoint: {
        type: ControlType.Number,
        title: "Sticky · Desktop px",
        defaultValue: 980,
        min: 640,
        max: 1800,
        step: 10,
    },
    actionBarBackground: {
        type: ControlType.Color,
        title: "Sticky · Sfondo",
        defaultValue: "rgba(243, 244, 246, 0.96)",
    },
    actionBarBorderColor: {
        type: ControlType.Color,
        title: "Sticky · Bordo",
        defaultValue: "rgba(17, 24, 39, 0.08)",
    },
    actionBarBorderWidth: {
        type: ControlType.Number,
        title: "Sticky · Bordo px",
        defaultValue: 1,
        min: 0,
        max: 6,
        step: 1,
    },
    actionBarShadow: {
        type: ControlType.String,
        title: "Sticky · Shadow",
        defaultValue: "0 12px 32px rgba(15, 23, 42, 0.2)",
    },
    actionBarRadius: {
        type: ControlType.Number,
        title: "Sticky · Radius",
        defaultValue: 999,
        min: 12,
        max: 999,
        step: 1,
    },
    actionBarPaddingX: {
        type: ControlType.Number,
        title: "Sticky · Padding X",
        defaultValue: 20,
        min: 10,
        max: 36,
        step: 1,
    },
    actionBarPaddingY: {
        type: ControlType.Number,
        title: "Sticky · Padding Y",
        defaultValue: 12,
        min: 6,
        max: 28,
        step: 1,
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
    actionBarMobileBottom: {
        type: ControlType.Number,
        title: "Sticky · Bottom m",
        defaultValue: 18,
        min: 0,
        max: 120,
        step: 1,
    },
    actionBarDesktopTop: {
        type: ControlType.Number,
        title: "Sticky · Top d",
        defaultValue: 16,
        min: 0,
        max: 72,
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
