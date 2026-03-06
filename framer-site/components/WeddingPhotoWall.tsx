import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import {
    Check,
    ImagePlus,
    PlusSquare,
    RefreshCw,
    RotateCcw,
    Upload,
} from "lucide-react"

type PhotoItem = { key: string; url: string }
type UploadIconName = "plus-square" | "image-plus" | "upload"
type RefreshIconName = "refresh-cw" | "rotate-ccw"

type Props = {
    workerBaseUrl: string
    eventCode: string

    uploadButtonLabel: string
    uploadHintLabel: string
    refreshAriaLabel: string
    refreshingLabel: string
    errorLabel: string

    uploadIcon: UploadIconName
    uploadIconSize: number
    uploadIconColor: string
    refreshIcon: RefreshIconName
    refreshIconSize: number
    refreshIconColor: string

    uploadLabelFont: React.CSSProperties
    uploadHintFont: React.CSSProperties

    uploadCardBackground: string
    uploadCardBorderColor: string
    uploadCardBorderWidth: number
    uploadCardBorderStyle: "dashed" | "dotted" | "solid"

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
        uploadHintLabel,
        refreshAriaLabel,
        refreshingLabel,
        errorLabel,
        uploadIcon,
        uploadIconSize,
        uploadIconColor,
        refreshIcon,
        refreshIconSize,
        refreshIconColor,
        uploadLabelFont,
        uploadHintFont,
        uploadCardBackground,
        uploadCardBorderColor,
        uploadCardBorderWidth,
        uploadCardBorderStyle,
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

    const [lightboxUrl, setLightboxUrl] = React.useState<string | null>(null)

    const [successOverlayKeys, setSuccessOverlayKeys] = React.useState<
        Set<string>
    >(new Set())

    const inputRef = React.useRef<HTMLInputElement | null>(null)
    const successOverlayTimeoutRef = React.useRef<number | null>(null)

    async function fetchPhotos() {
        if (!base) return
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`${base}/api/photos`, { method: "GET" })
            if (!res.ok)
                throw new Error(`GET /api/photos failed (${res.status})`)
            const data = await res.json()
            const list: PhotoItem[] = Array.isArray(data?.photos)
                ? data.photos
                : []
            const ordered = newestFirst ? list : [...list].reverse()
            setPhotos(ordered)
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

        const picked = Array.from(files).slice(
            0,
            clamp(maxFilesPerBatch, 1, 100)
        )

        const maxBytes = clamp(maxFileMB, 1, 50) * 1024 * 1024

        const validated: File[] = []
        const validationErrors: string[] = []

        for (const f of picked) {
            if (!isAllowedImageType(f.type)) {
                validationErrors.push(`${f.name}: tipo non supportato`)
                continue
            }
            if (f.size > maxBytes) {
                validationErrors.push(
                    `${f.name}: troppo grande (${formatBytes(f.size)})`
                )
                continue
            }
            validated.push(f)
        }

        if (validationErrors.length > 0) {
            setError(validationErrors.join(" · "))
        }
        if (validated.length === 0) return

        setUploading(true)
        if (validationErrors.length === 0) {
            setError(null)
        }

        const uploadedKeys = new Set<string>()
        const uploadedUrls = new Set<string>()

        try {
            for (const f of validated) {
                const uploadResult = await uploadViaWorker(f)
                if (typeof uploadResult?.key === "string") {
                    uploadedKeys.add(uploadResult.key)
                }
                if (typeof uploadResult?.url === "string") {
                    uploadedUrls.add(uploadResult.url)
                }
            }

            const refreshedPhotos = (await fetchPhotos()) || []

            const uploadedMatches = refreshedPhotos
                .filter((photo) => {
                    return (
                        uploadedKeys.has(photo.key) || uploadedUrls.has(photo.url)
                    )
                })
                .map((photo) => photo.key)

            const fallbackCount = validated.length
            const fallbackMatches = refreshedPhotos
                .slice(
                    newestFirst
                        ? 0
                        : Math.max(0, refreshedPhotos.length - fallbackCount),
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
        return () => {
            if (successOverlayTimeoutRef.current) {
                window.clearTimeout(successOverlayTimeoutRef.current)
            }
        }
    }, [])

    const gridTemplateColumns = React.useMemo(() => {
        const c = clamp(columns, 1, 8)
        return `repeat(${c}, minmax(0, 1fr))`
    }, [columns])

    return (
        <div style={styles.wrap}>
            <div style={styles.header}>
                <div style={styles.actions}>
                    <button
                        style={{
                            ...styles.secondaryButton,
                            color: refreshIconColor,
                            opacity: loading ? 0.6 : 1,
                            pointerEvents: loading ? "none" : "auto",
                        }}
                        onClick={fetchPhotos}
                        aria-label={loading ? refreshingLabel : refreshAriaLabel}
                        title={loading ? refreshingLabel : refreshAriaLabel}
                    >
                        <RefreshIcon
                            size={clamp(refreshIconSize, 12, 64)}
                            strokeWidth={2.2}
                            style={{
                                ...(loading
                                    ? {
                                          animation:
                                              "weddingPhotoWallSpin 1s linear infinite",
                                      }
                                    : null),
                            }}
                        />
                    </button>
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: "none" }}
                    onChange={(e) => handleFilesSelected(e.target.files)}
                />
            </div>

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
                <button
                    style={{
                        ...styles.uploadCard,
                        borderRadius: cornerRadius,
                        color: uploadIconColor,
                        background: uploadCardBackground,
                        borderColor: uploadCardBorderColor,
                        borderWidth: clamp(uploadCardBorderWidth, 0, 12),
                        borderStyle: uploadCardBorderStyle,
                        opacity: uploading ? 0.7 : 1,
                        pointerEvents: uploading ? "none" : "auto",
                    }}
                    onClick={handlePickFiles}
                >
                    <UploadIcon size={clamp(uploadIconSize, 14, 120)} strokeWidth={1.8} />
                    <span style={{ ...styles.uploadCardLabel, ...uploadLabelFont }}>
                        {uploadButtonLabel}
                    </span>
                    {uploadHintLabel ? (
                        <span style={{ ...styles.uploadCardHint, ...uploadHintFont }}>
                            {uploadHintLabel}
                        </span>
                    ) : null}
                </button>

                {photos.map((p) => (
                    <button
                        key={p.key}
                        style={{
                            ...styles.card,
                            borderRadius: cornerRadius,
                        }}
                        onClick={() => setLightboxUrl(p.url)}
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

            <style>{`
                @keyframes weddingPhotoWallSpin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>

            {lightboxUrl ? (
                <div
                    style={styles.lightboxOverlay}
                    onClick={() => setLightboxUrl(null)}
                >
                    <div
                        style={styles.lightboxInner}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={lightboxUrl}
                            alt=""
                            style={styles.lightboxImg}
                        />
                        <button
                            style={styles.lightboxClose}
                            onClick={() => setLightboxUrl(null)}
                        >
                            Chiudi
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
    uploadHintLabel: "",
    refreshAriaLabel: "Aggiorna foto",
    refreshingLabel: "Carico…",
    errorLabel: "Errore",
    uploadIcon: "plus-square",
    uploadIconSize: 44,
    uploadIconColor: "rgba(111, 61, 74, 0.95)",
    refreshIcon: "refresh-cw",
    refreshIconSize: 18,
    refreshIconColor: "rgba(0,0,0,0.8)",
    uploadLabelFont: {
        fontSize: 28,
        fontWeight: 600,
        lineHeight: "1.05em",
        letterSpacing: "0.02em",
        textTransform: "uppercase",
    },
    uploadHintFont: {
        fontSize: 13,
        fontWeight: 400,
        lineHeight: "1.4em",
        letterSpacing: "0em",
    },
    uploadCardBackground: "rgba(247, 231, 231, 0.85)",
    uploadCardBorderColor: "rgba(148, 92, 106, 0.24)",
    uploadCardBorderWidth: 2,
    uploadCardBorderStyle: "dashed",
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
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 12,
        flexWrap: "wrap",
    },
    actions: {
        display: "flex",
        gap: 10,
        alignItems: "center",
        justifyContent: "flex-end",
        flex: "0 0 auto",
    },
    secondaryButton: {
        appearance: "none",
        border: "1px solid rgba(0,0,0,0.12)",
        background: "transparent",
        padding: "9px",
        borderRadius: 10,
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
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
    uploadCard: {
        appearance: "none",
        border: "2px dashed rgba(148, 92, 106, 0.24)",
        background: "rgba(247, 231, 231, 0.85)",
        cursor: "pointer",
        aspectRatio: "1 / 1",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        padding: "24px 20px",
        textAlign: "center",
    },
    uploadCardLabel: {
        margin: 0,
    },
    uploadCardHint: {
        margin: 0,
        opacity: 0.85,
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
        background: "rgba(0,0,0,0.70)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 999999,
    },
    lightboxInner: {
        position: "relative",
        width: "min(920px, 96vw)",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        gap: 10,
    },
    lightboxImg: {
        width: "100%",
        maxHeight: "82vh",
        objectFit: "contain",
        borderRadius: 14,
        background: "rgba(255,255,255,0.06)",
    },
    lightboxClose: {
        appearance: "none",
        border: "none",
        borderRadius: 10,
        padding: "10px 12px",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 700,
        alignSelf: "flex-end",
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
    uploadHintLabel: {
        type: ControlType.String,
        title: "Upload · Sottotesto",
        defaultValue: "",
        displayTextArea: true,
    },
    uploadLabelFont: {
        type: ControlType.Font,
        title: "Upload · Font testo",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 28,
            variant: "Semi Bold",
            lineHeight: "1.05em",
            letterSpacing: "0.02em",
            textTransform: "uppercase",
        },
    },
    uploadHintFont: {
        type: ControlType.Font,
        title: "Upload · Font sottotesto",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 13,
            variant: "Regular",
            lineHeight: "1.4em",
            letterSpacing: "0em",
        },
    },

    uploadIcon: {
        type: ControlType.Enum,
        title: "Upload · Icona",
        options: ["plus-square", "image-plus", "upload"],
        optionTitles: ["PlusSquare", "ImagePlus", "Upload"],
        defaultValue: "plus-square",
    },
    uploadIconSize: {
        type: ControlType.Number,
        title: "Upload · Icon size",
        defaultValue: 44,
        min: 14,
        max: 120,
        step: 1,
    },
    uploadIconColor: {
        type: ControlType.Color,
        title: "Upload · Icon color",
        defaultValue: "rgba(111, 61, 74, 0.95)",
    },

    uploadCardBackground: {
        type: ControlType.Color,
        title: "Upload · Sfondo",
        defaultValue: "rgba(247, 231, 231, 0.85)",
    },
    uploadCardBorderColor: {
        type: ControlType.Color,
        title: "Upload · Bordo colore",
        defaultValue: "rgba(148, 92, 106, 0.24)",
    },
    uploadCardBorderWidth: {
        type: ControlType.Number,
        title: "Upload · Bordo px",
        defaultValue: 2,
        min: 0,
        max: 12,
        step: 1,
    },
    uploadCardBorderStyle: {
        type: ControlType.Enum,
        title: "Upload · Bordo stile",
        options: ["dashed", "dotted", "solid"],
        optionTitles: ["Dashed", "Dotted", "Solid"],
        defaultValue: "dashed",
    },

    refreshIcon: {
        type: ControlType.Enum,
        title: "Refresh · Icona",
        options: ["refresh-cw", "rotate-ccw"],
        optionTitles: ["RefreshCw", "RotateCcw"],
        defaultValue: "refresh-cw",
    },
    refreshIconSize: {
        type: ControlType.Number,
        title: "Refresh · Icon size",
        defaultValue: 18,
        min: 12,
        max: 64,
        step: 1,
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
