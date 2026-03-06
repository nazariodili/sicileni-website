import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { PlusSquare, RefreshCw } from "lucide-react"

type PhotoItem = { key: string; url: string }

type Props = {
    workerBaseUrl: string
    eventCode: string

    uploadButtonLabel: string
    refreshingLabel: string
    emptyLabel: string
    errorLabel: string

    columns: number
    gap: number
    cornerRadius: number

    maxFilesPerBatch: number
    maxFileMB: number
    newestFirst: boolean
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

export default function WeddingPhotoWall(props: Props) {
    const {
        workerBaseUrl,
        eventCode,
        uploadButtonLabel,
        refreshingLabel,
        emptyLabel,
        errorLabel,
        columns,
        gap,
        cornerRadius,
        maxFilesPerBatch,
        maxFileMB,
        newestFirst,
    } = props

    const base = React.useMemo(
        () => (workerBaseUrl || "").replace(/\/+$/, ""),
        [workerBaseUrl]
    )

    const [photos, setPhotos] = React.useState<PhotoItem[]>([])
    const [loading, setLoading] = React.useState(false)
    const [uploading, setUploading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const [lightboxUrl, setLightboxUrl] = React.useState<string | null>(null)

    const [uploadStatus, setUploadStatus] = React.useState<
        {
            name: string
            status: "queued" | "uploading" | "done" | "error"
            message?: string
        }[]
    >([])

    const inputRef = React.useRef<HTMLInputElement | null>(null)

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
        } catch (e: any) {
            setError(e?.message || "Failed to load photos")
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

    async function handlePickFiles() {
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
        const statusInit: { name: string; status: any; message?: string }[] = []

        for (const f of picked) {
            if (!isAllowedImageType(f.type)) {
                statusInit.push({
                    name: f.name,
                    status: "error",
                    message: "Tipo non supportato",
                })
                continue
            }
            if (f.size > maxBytes) {
                statusInit.push({
                    name: f.name,
                    status: "error",
                    message: `Troppo grande (${formatBytes(f.size)})`,
                })
                continue
            }
            validated.push(f)
            statusInit.push({ name: f.name, status: "queued" })
        }

        setUploadStatus(statusInit)
        if (validated.length === 0) return

        setUploading(true)
        setError(null)

        try {
            for (const f of validated) {
                setUploadStatus((prev) =>
                    prev.map((s) =>
                        s.name === f.name ? { ...s, status: "uploading" } : s
                    )
                )

                await uploadViaWorker(f)

                setUploadStatus((prev) =>
                    prev.map((s) =>
                        s.name === f.name ? { ...s, status: "done" } : s
                    )
                )
            }

            await fetchPhotos()
        } catch (e: any) {
            setError(e?.message || "Upload failed")
            setUploadStatus((prev) =>
                prev.map((s) =>
                    s.status === "uploading"
                        ? { ...s, status: "error", message: "Errore upload" }
                        : s
                )
            )
        } finally {
            setUploading(false)
            if (inputRef.current) inputRef.current.value = ""
        }
    }

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
                            opacity: loading ? 0.6 : 1,
                            pointerEvents: loading ? "none" : "auto",
                        }}
                        onClick={fetchPhotos}
                        aria-label={loading ? refreshingLabel : "Aggiorna foto"}
                    >
                        <RefreshCw
                            size={18}
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

            {uploadStatus.length > 0 ? (
                <div style={styles.uploadList}>
                    {uploadStatus.map((s) => (
                        <div key={s.name} style={styles.uploadRow}>
                            <div style={styles.uploadName}>{s.name}</div>
                            <div style={styles.uploadState}>
                                {s.status === "queued" && "In coda"}
                                {s.status === "uploading" && "Caricamento…"}
                                {s.status === "done" && "Fatto ✅"}
                                {s.status === "error" &&
                                    (s.message || "Errore")}
                            </div>
                        </div>
                    ))}
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
                        opacity: uploading ? 0.7 : 1,
                        pointerEvents: uploading ? "none" : "auto",
                    }}
                    onClick={handlePickFiles}
                >
                    <PlusSquare size={44} strokeWidth={1.8} />
                    <span style={styles.uploadCardLabel}>{uploadButtonLabel}</span>
                    {photos.length === 0 && !loading ? (
                        <span style={styles.uploadCardHint}>{emptyLabel}</span>
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
    uploadList: {
        border: "1px solid rgba(0,0,0,0.10)",
        borderRadius: 12,
        padding: 10,
        display: "flex",
        flexDirection: "column",
        gap: 8,
    },
    uploadRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        fontSize: 12,
    },
    uploadName: {
        opacity: 0.85,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        flex: "1 1 auto",
    },
    uploadState: { flex: "0 0 auto", opacity: 0.75 },
    grid: { width: "100%", display: "grid" },
    uploadCard: {
        appearance: "none",
        border: "2px dashed rgba(148, 92, 106, 0.24)",
        background: "rgba(247, 231, 231, 0.85)",
        color: "rgba(111, 61, 74, 0.95)",
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
        fontSize: 28,
        fontWeight: 600,
        lineHeight: 1.05,
        letterSpacing: "0.02em",
        textTransform: "uppercase",
    },
    uploadCardHint: {
        fontSize: 13,
        opacity: 0.8,
        lineHeight: 1.4,
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
        defaultValue: "",
    },
    eventCode: {
        type: ControlType.String,
        title: "Event Code",
        defaultValue: "",
    },
    uploadButtonLabel: {
        type: ControlType.String,
        title: "Add Label",
        defaultValue: "Add a photo",
    },
    refreshingLabel: {
        type: ControlType.String,
        title: "Refreshing",
        defaultValue: "Carico…",
    },
    emptyLabel: {
        type: ControlType.String,
        title: "Empty",
        defaultValue: "Ancora nessuna foto. Inizia tu 🙂",
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
})
