import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import {
    Search,
    RotateCcw,
    ChevronDown,
    X,
    CheckSquare,
    Square,
    CheckCircle2,
    Circle,
} from "lucide-react"

/**
 * RSVP – Google Sheets (Apps Script) – Framer Code Component
 * - Manual search guests by name (button "Cerca")
 * - Load family/group
 * - Fill RSVP for multiple people
 * - Submit -> POST to Apps Script (writes sheet + sends email)
 *
 * Requires Apps Script to implement doGet (search + family) and doPost (save + email)
 */

type Guest = {
    guestId: string
    familyId: string
    name: string
}

type PersonAnswer = {
    guestId: string
    name: string
    attending: boolean | null
    menu: string
    allergies: string
    shuttle: boolean | null
    notes: string
}

function safeJsonParse(text: string) {
    try {
        return { ok: true as const, data: JSON.parse(text) }
    } catch (e: any) {
        return { ok: false as const, error: e?.message || "Invalid JSON" }
    }
}

async function fetchJson(url: string, init?: RequestInit) {
    const res = await fetch(url, init)
    const text = await res.text()
    const parsed = safeJsonParse(text)

    if (!res.ok) {
        const msg =
            (parsed.ok && (parsed.data?.error || parsed.data?.message)) ||
            `HTTP ${res.status}`
        throw new Error(msg)
    }
    if (!parsed.ok) throw new Error("La risposta non è JSON valido.")
    return parsed.data
}

function toPx(n: number) {
    return `${Math.max(0, Number(n) || 0)}px`
}

function AutoHeight({
    children,
    durationMs = 280,
}: {
    children?: React.ReactNode
    durationMs?: number
}) {
    const innerRef = React.useRef<HTMLDivElement | null>(null)
    const [height, setHeight] = React.useState<number | null>(null)
    const [ready, setReady] = React.useState(false)

    React.useLayoutEffect(() => {
        const node = innerRef.current
        if (!node) return

        const measure = () => {
            const next = Math.max(
                Math.ceil(node.getBoundingClientRect().height),
                node.scrollHeight
            )
            setHeight(next + 4)
        }
        measure()

        const ro = new ResizeObserver(() => measure())
        ro.observe(node)
        return () => ro.disconnect()
    }, [])

    React.useEffect(() => {
        const id = requestAnimationFrame(() => setReady(true))
        return () => cancelAnimationFrame(id)
    }, [])

    return (
        <div
            style={{
                height: height ?? "auto",
                overflow: "hidden",
                transition: ready ? `height ${durationMs}ms ease` : "none",
            }}
        >
            <div ref={innerRef} style={{ display: "flow-root" }}>
                {children}
            </div>
        </div>
    )
}


declare global {
    interface Window {
        lottie?: any
        __rsvpLottiePromise?: Promise<any>
    }
}

function ensureLottiePlayer() {
    if (typeof window === "undefined") return Promise.resolve(null)
    if (window.lottie) return Promise.resolve(window.lottie)
    if (window.__rsvpLottiePromise) return window.__rsvpLottiePromise

    window.__rsvpLottiePromise = new Promise((resolve, reject) => {
        const script = document.createElement("script")
        script.src =
            "https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js"
        script.async = true
        script.onload = () => resolve(window.lottie || null)
        script.onerror = () => reject(new Error("Impossibile caricare Lottie"))
        document.head.appendChild(script)
    })

    return window.__rsvpLottiePromise
}

function LottieLoader({
    src,
    maxSize = 70,
}: {
    src: string
    maxSize?: number
}) {
    const mountRef = React.useRef<HTMLDivElement | null>(null)

    React.useEffect(() => {
        let destroyed = false
        let animation: any = null

        ensureLottiePlayer()
            .then((lottie) => {
                if (destroyed || !lottie || !mountRef.current || !src) return
                mountRef.current.innerHTML = ""
                animation = lottie.loadAnimation({
                    container: mountRef.current,
                    renderer: "svg",
                    loop: true,
                    autoplay: true,
                    path: src,
                    rendererSettings: {
                        preserveAspectRatio: "xMidYMid meet",
                    },
                })
            })
            .catch(() => undefined)

        return () => {
            destroyed = true
            if (animation) animation.destroy()
        }
    }, [src])

    return (
        <div
            ref={mountRef}
            style={{
                width: Math.min(70, Math.max(24, maxSize)),
                height: Math.min(70, Math.max(24, maxSize)),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
            }}
        />
    )
}

export default function RSVPGoogleSheets(props: any) {
    const {
        // data + copy
        endpointUrl,
        title,
        searchPlaceholder,
        showShuttle,
        requireMenuIfAttending,
        menuOptions,
        attendingLabel,
        yesLabel,
        noLabel,
        menuLabel,
        allergiesLabel,
        shuttleLabel,
        notesLabel,
        selectPeopleLabel,
        submitLabel,
        successTitle,
        successSubtitle,
        resetLabel,
        searchButtonLabel,
        shuttleYesText,
        shuttleNoText,

        // service copy
        endpointMissingText,
        searchMinCharsError,
        searchGenericError,
        noResultsText,
        familyLoadErrorText,
        submitLoadingLabel,
        searchLoaderLottieFile,
        submitGenericError,
        serverInvalidResponseError,
        noMoreInfoNeededText,
        validateSelectGuestError,
        validateSelectPeopleError,
        validateIncompleteDataError,
        validateAttendanceErrorTemplate,
        validateMenuErrorTemplate,
        validateAllergiesErrorTemplate,
        validateShuttleErrorTemplate,

        // required fields UI
        requiredAsterisk,

        // ✅ STYLE PROPS
        font,
        titleFont, // font dedicata al titolo
        selectPeopleLabelFont,
        participantNameFont,
        textColor,
        mutedTextColor,

        wrapBackground,
        wrapPadding,
        wrapGap,

        cardBackground,
        cardBorderColor,
        cardBorderWidth,
        cardRadius,
        cardPadding,


        smallSize,

        inputBackground,
        inputTextColor,
        inputBorderColor,
        inputRadius,
        inputPaddingX,
        inputPaddingY,

        commonBorderColor,
        commonBorderWidth,

        selectBackground,

        buttonRadius,
        buttonPrimaryBackground,
        buttonPrimaryTextColor,
        buttonGhostBackground,
        buttonGhostTextColor,
        buttonBorderColor,
        buttonFontSize,
        buttonFontWeight,

        dividerColor,

        errorTextColor,
        errorBackground,
        errorBorderColor,

        successTextColor,
        successBackground,
        successBorderColor,
    } = props

    const baseFontStyle = (font || {}) as React.CSSProperties
    const titleFontStyle = (titleFont || {}) as React.CSSProperties
    const selectPeopleLabelFontStyle =
        (selectPeopleLabelFont || {}) as React.CSSProperties
    const participantNameFontStyle =
        (participantNameFont || {}) as React.CSSProperties
    const headerAlign: React.CSSProperties["textAlign"] =
        (titleFontStyle.textAlign as React.CSSProperties["textAlign"]) || "left"


    function formatNameMessage(template: string, name: string) {
        return template.replace("{name}", name)
    }

    const [query, setQuery] = React.useState("")

    const [searchLoading, setSearchLoading] = React.useState(false)
    const [searchError, setSearchError] = React.useState<string | null>(null)
    const [results, setResults] = React.useState<Guest[]>([])
    const [hasSearched, setHasSearched] = React.useState(false)

    const [selectedGuest, setSelectedGuest] = React.useState<Guest | null>(null)

    const [familyLoading, setFamilyLoading] = React.useState(false)
    const [familyError, setFamilyError] = React.useState<string | null>(null)
    const [familyMembers, setFamilyMembers] = React.useState<Guest[]>([])
    const [selectedMemberIds, setSelectedMemberIds] = React.useState<
        Set<string>
    >(new Set())

    const [answers, setAnswers] = React.useState<Record<string, PersonAnswer>>(
        {}
    )

    const [submitLoading, setSubmitLoading] = React.useState(false)
    const [submitError, setSubmitError] = React.useState<string | null>(null)
    const [submitted, setSubmitted] = React.useState(false)
    const [submitStatus, setSubmitStatus] = React.useState<
        "idle" | "loading" | "success" | "error"
    >("idle")

    const isResetMode = submitted || selectedGuest || hasSearched
    const endpointBase = (endpointUrl || "").trim()

    const UI_BORDER_COLOR =
        commonBorderColor ?? inputBorderColor ?? cardBorderColor
    const UI_BORDER_WIDTH =
        typeof commonBorderWidth === "number"
            ? commonBorderWidth
            : typeof cardBorderWidth === "number"
              ? cardBorderWidth
              : 1

    async function runSearch(rawQuery?: string, showMinCharsError = true) {
        const q = (rawQuery ?? query ?? "").trim()
        setSearchError(null)
        setSubmitted(false)
        setSubmitError(null)

        if (!endpointBase) {
            setResults([])
            return
        }
        if (q.length < 2) {
            if (showMinCharsError) setSearchError(searchMinCharsError)
            else setSearchError(null)
            setResults([])
            return
        }

        try {
            setSearchLoading(true)
            setHasSearched(true)

            const url =
                endpointBase +
                (endpointBase.includes("?") ? "&" : "?") +
                `action=search&q=${encodeURIComponent(q)}`

            const data = await fetchJson(url, { method: "GET" })
            setResults(Array.isArray(data?.results) ? data.results : [])
        } catch (e: any) {
            setSearchError(e?.message || searchGenericError)
            setResults([])
        } finally {
            setSearchLoading(false)
        }
        setSubmitStatus("idle")
    }

    React.useEffect(() => {
        if (selectedGuest) return
        const q = (query || "").trim()

        if (!q) {
            setResults([])
            setHasSearched(false)
            setSearchError(null)
            return
        }

        if (q.length < 2) {
            setResults([])
            setHasSearched(false)
            setSearchError(null)
            return
        }

        const id = window.setTimeout(() => {
            runSearch(q, false)
        }, 280)

        return () => window.clearTimeout(id)
    }, [query, endpointBase, selectedGuest])

    // LOAD FAMILY
    async function loadFamily(guest: Guest) {
        setSelectedGuest(guest)
        setResults([]) // nasconde subito la lista
        setFamilyError(null)
        setSubmitted(false)
        setSubmitError(null)
        setSubmitStatus("idle")

        try {
            setFamilyLoading(true)
            const url =
                endpointBase +
                (endpointBase.includes("?") ? "&" : "?") +
                `action=family&familyId=${encodeURIComponent(guest.familyId)}`

            const data = await fetchJson(url, { method: "GET" })
            const members: Guest[] = Array.isArray(data?.members)
                ? data.members
                : []

            setFamilyMembers(members)

            // ✅ Default: select ONLY the clicked guest (not all family)
            const clickedIsInMembers = members.some(
                (m) => m.guestId === guest.guestId
            )

            const setIds = new Set<string>()
            if (clickedIsInMembers) setIds.add(guest.guestId)
            else if (members[0]) setIds.add(members[0].guestId)

            setSelectedMemberIds(setIds)

            // Initialize answers
            const next: Record<string, PersonAnswer> = {}
            for (const m of members) {
                next[m.guestId] = {
                    guestId: m.guestId,
                    name: m.name,
                    attending: null,
                    menu: "",
                    allergies: "",
                    shuttle: null,
                    notes: "",
                }
            }
            setAnswers(next)
        } catch (e: any) {
            setFamilyError(e?.message || familyLoadErrorText)
            setFamilyMembers([])
            setSelectedMemberIds(new Set())
            setAnswers({})
        } finally {
            setFamilyLoading(false)
        }
    }

    function toggleMember(id: string) {
        setSelectedMemberIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
        setSubmitStatus("idle")
        setSubmitted(false)
    }

    function updateAnswer(id: string, patch: Partial<PersonAnswer>) {
        setAnswers((prev) => ({
            ...prev,
            [id]: {
                ...(prev[id] || {
                    guestId: id,
                    name: "",
                    attending: null,
                    menu: "",
                    allergies: "",
                    shuttle: null,
                    notes: "",
                }),
                ...patch,
            },
        }))
        setSubmitStatus("idle")
        setSubmitError(null)
        setSubmitted(false)
    }

    function parseMenuOptions(raw: string): string[] {
        return (raw || "")
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
    }

    const menuList = React.useMemo(
        () => parseMenuOptions(menuOptions),
        [menuOptions]
    )

    function validate(): string | null {
        if (!selectedGuest) return validateSelectGuestError
        const chosen = Array.from(selectedMemberIds)
        if (chosen.length === 0) return validateSelectPeopleError

        for (const id of chosen) {
            const a = answers[id]
            if (!a) return validateIncompleteDataError
            if (a.attending === null)
                return formatNameMessage(validateAttendanceErrorTemplate, a.name)

            if (a.attending === false) continue

            if (requireMenuIfAttending && !a.menu.trim()) {
                return formatNameMessage(validateMenuErrorTemplate, a.name)
            }

            if (!a.allergies.trim()) {
                return formatNameMessage(validateAllergiesErrorTemplate, a.name)
            }

            if (showShuttle && a.shuttle === null) {
                return formatNameMessage(validateShuttleErrorTemplate, a.name)
            }
        }
        return null
    }

    async function submit() {
        setSubmitError(null)
        const v = validate()
        if (v) {
            setSubmitError(v)
            setSubmitStatus("error")
            return
        }
        if (!selectedGuest) return

        const people = Array.from(selectedMemberIds).map((id) => {
            const a = answers[id]
            return {
                guestId: a.guestId,
                name: a.name,
                attending: !!a.attending,
                menu: a.menu || "",
                allergies: a.allergies || "",
                shuttle: !!a.shuttle,
                notes: a.notes || "",
            }
        })

        const payload = {
            familyId: selectedGuest.familyId,
            submittedBy: selectedGuest.name,
            people,
        }

        try {
            setSubmitLoading(true)
            setSubmitStatus("loading")

            const res = await fetch(endpointBase, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload),
            })

            const text = await res.text()
            const parsed = safeJsonParse(text)

            if (!res.ok) {
                const msg =
                    (parsed.ok &&
                        (parsed.data?.error || parsed.data?.message)) ||
                    `HTTP ${res.status}`
                throw new Error(msg)
            }

            if (text && !parsed.ok) {
                throw new Error(serverInvalidResponseError)
            }

            setSubmitted(true)
            setSubmitStatus("success")
            setResults([])
        } catch (e: any) {
            setSubmitted(false)
            setSubmitStatus("error")
            setSubmitError(e?.message || submitGenericError)
        } finally {
            setSubmitLoading(false)
        }
    }

    function resetAll() {
        setQuery("")
        setResults([])
        setSearchError(null)
        setHasSearched(false)
        setSelectedGuest(null)
        setFamilyMembers([])
        setSelectedMemberIds(new Set())
        setAnswers({})
        setSubmitted(false)
        setSubmitError(null)
        setFamilyError(null)
        setSubmitStatus("idle")
    }

    function clearSearchInput() {
        setQuery("")
        setSearchError(null)
        setHasSearched(false)
        if (!selectedGuest) {
            setResults([])
        }
    }

    const requiredMenu = requireMenuIfAttending
    const requiredAllergiesWhenAttending = true
    const requiredShuttleWhenAttending = showShuttle
    const shouldOpenSearchDropdown =
        !selectedGuest &&
        !!query.trim() &&
        (searchLoading || hasSearched || results.length > 0 || !!searchError)

    const s = {
        resultsScroll: {
            maxHeight: 260,
            overflowY: "auto" as const,
            WebkitOverflowScrolling: "touch" as const,
            paddingRight: 4,
        },

        wrap: {
            ...(baseFontStyle || {}),
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column" as const,
            gap: typeof wrapGap === "number" ? wrapGap : 12,
            padding: `${(wrapPadding?.top ?? 16) as number}px ${
                (wrapPadding?.right ?? 16) as number
            }px ${(wrapPadding?.bottom ?? 16) as number}px ${
                (wrapPadding?.left ?? 16) as number
            }px`,
            boxSizing: "border-box" as const,
            color: textColor,
            background: wrapBackground,
        },

        card: {
            borderRadius: cardRadius,
            padding: cardPadding,
            boxSizing: "border-box" as const,
            background: cardBackground,
        },

        // ✅ FIX: wrapper header allineabile
        header: {
            width: "100%",
            textAlign: headerAlign,
        } as React.CSSProperties,

        h1: {
            ...(baseFontStyle || {}),
            ...(titleFontStyle || {}),
            margin: 0,
            width: "100%",
            display: "block",
        } as React.CSSProperties,

        small: {
            ...(baseFontStyle || {}),
            fontSize: smallSize,
            color: mutedTextColor,
        },

        input: {
            ...(baseFontStyle || {}),
            width: "100%",
            fontSize: 16,
            padding: `${toPx(inputPaddingY)} ${toPx(inputPaddingX)}`,
            borderRadius: inputRadius,
            border: `${UI_BORDER_WIDTH}px solid ${UI_BORDER_COLOR}`,
            outline: "none",
            boxSizing: "border-box" as const,
            background: inputBackground,
            color: inputTextColor,
        },

        select: {
            ...(baseFontStyle || {}),
            width: "100%",
            fontSize: 16,
            padding: `${toPx(inputPaddingY)} ${toPx(inputPaddingX)}`,
            paddingRight: 44,
            borderRadius: inputRadius,
            border: `${UI_BORDER_WIDTH}px solid ${UI_BORDER_COLOR}`,
            background: selectBackground,
            color: inputTextColor,
            boxSizing: "border-box" as const,
            appearance: "none" as const,
            WebkitAppearance: "none" as const,
            MozAppearance: "none" as const,
        },

        textarea: {
            ...(baseFontStyle || {}),
            width: "100%",
            fontSize: 16,
            padding: `${toPx(inputPaddingY)} ${toPx(inputPaddingX)}`,
            borderRadius: inputRadius,
            border: `${UI_BORDER_WIDTH}px solid ${UI_BORDER_COLOR}`,
            minHeight: 80,
            resize: "vertical" as const,
            boxSizing: "border-box" as const,
            background: inputBackground,
            color: inputTextColor,
        },

        list: { display: "flex", flexDirection: "column" as const, gap: 8 },

        btn: (primary: boolean) => ({
            ...(baseFontStyle || {}),
            width: "100%",
            padding: "12px 14px",
            borderRadius: buttonRadius,
            border: primary ? "none" : `1px solid ${buttonBorderColor}`,
            background: primary
                ? buttonPrimaryBackground
                : buttonGhostBackground,
            color: primary ? buttonPrimaryTextColor : buttonGhostTextColor,
            fontSize: buttonFontSize,
            fontWeight: buttonFontWeight,
            cursor: "pointer",
            opacity: submitLoading && primary ? 0.7 : 1,
        }),

        btnInline: {
            ...(baseFontStyle || {}),
            width: 48,
            height: 48,
            borderRadius: buttonRadius,
            border: `${UI_BORDER_WIDTH}px solid ${UI_BORDER_COLOR}`,
            background: buttonPrimaryBackground,
            color: buttonPrimaryTextColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            padding: 0,
            opacity: searchLoading || familyLoading || submitLoading ? 0.7 : 1,
        },

        btnInlineGhost: {
            ...(baseFontStyle || {}),
            width: 48,
            height: 48,
            borderRadius: buttonRadius,
            border: `${UI_BORDER_WIDTH}px solid ${UI_BORDER_COLOR}`,
            background: buttonGhostBackground,
            color: buttonGhostTextColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            padding: 0,
            opacity: searchLoading || familyLoading || submitLoading ? 0.7 : 1,
        },

        pill: (active: boolean) => ({
            ...(baseFontStyle || {}),
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            padding: "18px 18px",
            borderRadius: 12,
            border: active
                ? `2px solid rgba(140, 170, 220, 0.95)`
                : `${UI_BORDER_WIDTH}px solid ${UI_BORDER_COLOR}`,
            background: active
                ? "rgba(235, 243, 255, 0.9)"
                : "rgba(255,255,255,0.9)",
            cursor: "pointer",
            color: textColor,
            minHeight: 72,
            boxSizing: "border-box" as const,
        }),

        divider: {
            height: 1,
            background: dividerColor,
            margin: "20px 0",
        },

        error: {
            ...(baseFontStyle || {}),
            fontSize: Math.max(12, smallSize + 1),
            color: errorTextColor,
            background: errorBackground,
            border: `${UI_BORDER_WIDTH}px solid ${UI_BORDER_COLOR}`,
            padding: "10px 12px",
            borderRadius: inputRadius,
        },

        success: {
            ...(baseFontStyle || {}),
            fontSize: Math.max(12, smallSize + 1),
            color: successTextColor,
            background: successBackground,
            border: `${UI_BORDER_WIDTH}px solid ${UI_BORDER_COLOR}`,
            padding: "12px 12px",
            borderRadius: inputRadius,
        },

        loadingState: {
            ...(baseFontStyle || {}),
            display: "flex",
            flexDirection: "column" as const,
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "26px 12px",
            borderRadius: inputRadius,
            border: `${UI_BORDER_WIDTH}px solid ${UI_BORDER_COLOR}`,
            background: "rgba(255,255,255,0.6)",
        },

        spinner: {
            width: 18,
            height: 18,
            borderRadius: 999,
            border: "2px solid rgba(0,0,0,0.18)",
            borderTopColor: "rgba(0,0,0,0.7)",
            animation: "rsvpSpin 0.8s linear infinite",
        },

        searchInputWrap: {
            position: "relative" as const,
            flex: 1,
        },

        searchIconLeft: {
            position: "absolute" as const,
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: mutedTextColor,
            opacity: 0.9,
            pointerEvents: "none" as const,
        },

        searchDropdown: {
            marginTop: 10,
            borderRadius: Math.max(16, Number(inputRadius) || 16),
            background: inputBackground,
            overflow: "hidden" as const,
        },

        searchDropdownBody: {
            maxHeight: 340,
            overflowY: "auto" as const,
            WebkitOverflowScrolling: "touch" as const,
            padding: 10,
            boxSizing: "border-box" as const,
        },

        searchRow: {
            ...(baseFontStyle || {}),
            display: "flex",
            alignItems: "center",
            gap: 12,
            width: "100%",
            padding: "12px 10px",
            borderRadius: 10,
            cursor: "pointer",
            boxSizing: "border-box" as const,
        },
    } as const

    const spinnerCss = `
@keyframes rsvpSpin { 
  from { transform: rotate(0deg); } 
  to { transform: rotate(360deg); } 
}
`

    function CheckMark({ active }: { active: boolean }) {
        return active ? (
            <CheckSquare size={22} aria-hidden="true" />
        ) : (
            <Square size={22} aria-hidden="true" style={{ opacity: 0.65 }} />
        )
    }

    function RadioMark({ active }: { active: boolean }) {
        return active ? (
            <CheckCircle2 size={22} aria-hidden="true" />
        ) : (
            <Circle size={22} aria-hidden="true" style={{ opacity: 0.65 }} />
        )
    }

    function choiceStyle(active: boolean): React.CSSProperties {
        return {
            ...(baseFontStyle || {}),
            flex: 1,
            minHeight: 72,
            padding: "18px 18px",
            borderRadius: 12,
            border: active
                ? `2px solid rgba(140, 170, 220, 0.95)`
                : `${UI_BORDER_WIDTH}px solid ${UI_BORDER_COLOR}`,
            background: active
                ? "rgba(235, 243, 255, 0.9)"
                : "rgba(255,255,255,0.9)",
            color: textColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            cursor: "pointer",
            boxSizing: "border-box",
        }
    }

    return (
        <div style={s.wrap}>
            <style>{spinnerCss}</style>

            {/* SEARCH CARD */}
            <div style={s.card}>
                {/* ✅ header wrapper con align */}
                <div style={s.header}>
                    <h1 style={s.h1}>{title}</h1>
                    
                </div>

                {!endpointBase ? (
                    <div style={{ ...s.error, marginTop: 10 }}>
                        {endpointMissingText}
                    </div>
                ) : null}

                <div style={{ marginTop: 12 }}>
                    <div style={{ display: "flex", gap: 10 }}>
                        <div style={s.searchInputWrap}>
                            <Search size={20} style={s.searchIconLeft} />
                            <input
                                style={{
                                    ...s.input,
                                    paddingLeft: 44,
                                    paddingRight: query.trim() ? 42 : toPx(inputPaddingX),
                                }}
                                value={query}
                                placeholder={searchPlaceholder}
                                onChange={(e) => {
                                    setQuery(e.target.value)
                                    setSearchError(null)
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault()
                                        runSearch(undefined, true)
                                    }
                                }}
                            />

                            {query.trim() ? (
                                <button
                                    type="button"
                                    onClick={clearSearchInput}
                                    disabled={searchLoading || familyLoading || submitLoading}
                                    aria-label="Svuota campo ricerca"
                                    title="Svuota"
                                    style={{
                                        position: "absolute",
                                        right: 10,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        width: 24,
                                        height: 24,
                                        borderRadius: 999,
                                        border: "none",
                                        background: "transparent",
                                        color: mutedTextColor,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: "pointer",
                                        padding: 0,
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            ) : null}
                        </div>

                        <button
                            style={isResetMode ? s.btnInlineGhost : s.btnInline}
                            onClick={isResetMode ? resetAll : () => runSearch(undefined, true)}
                            disabled={
                                (!endpointBase && !isResetMode) ||
                                searchLoading ||
                                submitLoading ||
                                familyLoading
                            }
                            aria-label={
                                isResetMode ? resetLabel : searchButtonLabel
                            }
                            title={isResetMode ? resetLabel : searchButtonLabel}
                        >
                            {isResetMode ? (
                                <RotateCcw size={18} />
                            ) : (
                                <Search size={18} />
                            )}
                        </button>
                    </div>

                    <AutoHeight>
                        {shouldOpenSearchDropdown ? (
                            <div style={s.searchDropdown}>
                                <div style={s.searchDropdownBody}>
                                    {searchLoading ? (
                                        <div style={{ ...s.loadingState, marginTop: 0 }}>
                                            <LottieLoader src={searchLoaderLottieFile} maxSize={70} />
                                        </div>
                                    ) : null}

                                    {searchError ? (
                                        <div style={{ ...s.error, marginTop: 0 }}>
                                            {searchError}
                                        </div>
                                    ) : null}

                                    {!searchLoading && !searchError && results.length > 0
                                        ? results.map((g) => (
                                              <div
                                                  key={g.guestId}
                                                  style={s.searchRow}
                                                  onClick={() => loadFamily(g)}
                                                  role="button"
                                                  aria-label={`Seleziona ${g.name}`}
                                              >
                                                  <Search
                                                      size={20}
                                                      aria-hidden="true"
                                                      style={{
                                                          color: mutedTextColor,
                                                          flexShrink: 0,
                                                      }}
                                                  />
                                                  <div
                                                      style={{
                                                          ...(baseFontStyle || {}),
                                                          fontSize: 15,
                                                          fontWeight: 700,
                                                          lineHeight: 1.3,
                                                      }}
                                                  >
                                                      {g.name}
                                                  </div>
                                              </div>
                                          ))
                                        : null}

                                    {!searchLoading &&
                                    !searchError &&
                                    hasSearched &&
                                    results.length === 0 ? (
                                        <div style={{ ...s.error, marginTop: 0 }}>
                                            {noResultsText}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        ) : null}
                    </AutoHeight>
                </div>
            </div>

            {/* FAMILY */}
            {selectedGuest ? (
                <div style={s.card}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <div
                            style={{
                                ...(baseFontStyle || {}),
                                ...(selectPeopleLabelFontStyle || {}),
                                marginTop: 4,
                                marginBottom: 8,
                                lineHeight: 1.2,
                            }}
                        >
                            {selectPeopleLabel}
                        </div>
                    </div>

                    <AutoHeight>
                        {familyLoading ? (
                            <div style={{ marginTop: 12, ...s.loadingState }}>
                                <LottieLoader src={searchLoaderLottieFile} maxSize={70} />
                            </div>
                        ) : null}

                        {!familyLoading && familyError ? (
                            <div style={{ ...s.error, marginTop: 10 }}>
                                {familyError}
                            </div>
                        ) : null}

                        {!familyLoading && !familyError ? (
                            <>
                                {submitted ? (
                                    <div style={{ marginTop: 12 }}>
                                        <div style={s.success}>
                                            <div
                                                style={{
                                                    ...(baseFontStyle || {}),
                                                    fontWeight: 850,
                                                    marginBottom: 6,
                                                }}
                                            >
                                                {successTitle}
                                            </div>
                                            <div style={{ ...(baseFontStyle || {}) }}>
                                                {successSubtitle}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                    {familyMembers.length > 0 ? (
                                        <div
                                            style={{ ...s.list, marginTop: 12 }}
                                        >
                                            {familyMembers.map((m) => {
                                                const active =
                                                    selectedMemberIds.has(
                                                        m.guestId
                                                    )
                                                return (
                                                    <div
                                                        key={m.guestId}
                                                        style={s.pill(active)}
                                                        onClick={() =>
                                                            toggleMember(
                                                                m.guestId
                                                            )
                                                        }
                                                        role="button"
                                                        aria-label={`Seleziona ${m.name}`}
                                                    >
                                                        <div>
                                                            <div
                                                                style={{
                                                                    ...(baseFontStyle ||
                                                                        {}),
                                                                    fontSize: 14,
                                                                    fontWeight: 750,
                                                                }}
                                                            >
                                                                {m.name}
                                                            </div>
                                                        </div>
                                                        <CheckMark
                                                            active={active}
                                                        />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : null}

                                    <div style={s.divider} />

                                    {Array.from(selectedMemberIds).map((id) => {
                                        const a = answers[id]
                                        if (!a) return null

                                        const isAttending = a.attending === true

                                        const menuIsRequired =
                                            isAttending && requiredMenu
                                        const allergiesIsRequired =
                                            isAttending &&
                                            requiredAllergiesWhenAttending
                                        const shuttleIsRequired =
                                            isAttending &&
                                            requiredShuttleWhenAttending

                                        const menuPlaceholder = `${menuLabel}${
                                            menuIsRequired
                                                ? requiredAsterisk
                                                : ""
                                        }…`

                                        const allergiesPlaceholder = `${allergiesLabel}${
                                            allergiesIsRequired
                                                ? requiredAsterisk
                                                : ""
                                        } (se nessuna, scrivi “Nessuna”)`

                                        const notesPlaceholder = `${notesLabel} (opzionale)`

                                        return (
                                            <div
                                                key={id}
                                                style={{ padding: "10px 0" }}
                                            >
                                                <div
                                                    style={{
                                                        ...(baseFontStyle ||
                                                            {}),
                                                        ...(participantNameFontStyle ||
                                                            {}),
                                                    }}
                                                >
                                                    {a.name}
                                                </div>

                                                <div style={{ marginTop: 10 }}>
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            gap: 10,
                                                            marginTop: 8,
                                                        }}
                                                    >
                                                        <button
                                                            style={choiceStyle(
                                                                a.attending ===
                                                                    true
                                                            )}
                                                            onClick={() =>
                                                                updateAnswer(
                                                                    id,
                                                                    {
                                                                        attending:
                                                                            true,
                                                                    }
                                                                )
                                                            }
                                                            type="button"
                                                            aria-label={`${attendingLabel} ${yesLabel}`}
                                                        >
                                                            <span
                                                                style={{
                                                                    fontWeight: 800,
                                                                }}
                                                            >
                                                                {yesLabel}
                                                            </span>
                                                            <RadioMark
                                                                active={
                                                                    a.attending ===
                                                                    true
                                                                }
                                                            />
                                                        </button>

                                                        <button
                                                            style={choiceStyle(
                                                                a.attending ===
                                                                    false
                                                            )}
                                                            onClick={() =>
                                                                updateAnswer(
                                                                    id,
                                                                    {
                                                                        attending:
                                                                            false,
                                                                        menu: "",
                                                                        allergies:
                                                                            "",
                                                                        shuttle:
                                                                            null,
                                                                        notes: "",
                                                                    }
                                                                )
                                                            }
                                                            type="button"
                                                            aria-label={`${attendingLabel} ${noLabel}`}
                                                        >
                                                            <span
                                                                style={{
                                                                    fontWeight: 800,
                                                                }}
                                                            >
                                                                {noLabel}
                                                            </span>
                                                            <RadioMark
                                                                active={
                                                                    a.attending ===
                                                                    false
                                                                }
                                                            />
                                                        </button>
                                                    </div>
                                                </div>

                                                {a.attending !== false ? (
                                                    <>
                                                        <div
                                                            style={{
                                                                marginTop: 12,
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    position:
                                                                        "relative",
                                                                }}
                                                            >
                                                                <select
                                                                    style={
                                                                        s.select
                                                                    }
                                                                    value={
                                                                        a.menu
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        updateAnswer(
                                                                            id,
                                                                            {
                                                                                menu: e
                                                                                    .target
                                                                                    .value,
                                                                            }
                                                                        )
                                                                    }
                                                                    aria-label={
                                                                        menuLabel
                                                                    }
                                                                >
                                                                    <option value="">
                                                                        {
                                                                            menuPlaceholder
                                                                        }
                                                                    </option>
                                                                    {menuList.map(
                                                                        (
                                                                            opt
                                                                        ) => (
                                                                            <option
                                                                                key={
                                                                                    opt
                                                                                }
                                                                                value={
                                                                                    opt
                                                                                }
                                                                            >
                                                                                {
                                                                                    opt
                                                                                }
                                                                            </option>
                                                                        )
                                                                    )}
                                                                </select>

                                                                <div
                                                                    style={{
                                                                        position:
                                                                            "absolute",
                                                                        right: 14,
                                                                        top: "50%",
                                                                        transform:
                                                                            "translateY(-50%)",
                                                                        pointerEvents:
                                                                            "none",
                                                                        color: inputTextColor,
                                                                        opacity: 0.7,
                                                                        display:
                                                                            "flex",
                                                                        alignItems:
                                                                            "center",
                                                                        justifyContent:
                                                                            "center",
                                                                    }}
                                                                    aria-hidden="true"
                                                                >
                                                                    <ChevronDown
                                                                        size={20}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div
                                                            style={{
                                                                marginTop: 12,
                                                            }}
                                                        >
                                                            <input
                                                                style={s.input}
                                                                value={
                                                                    a.allergies
                                                                }
                                                                onChange={(e) =>
                                                                    updateAnswer(
                                                                        id,
                                                                        {
                                                                            allergies:
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                        }
                                                                    )
                                                                }
                                                                placeholder={
                                                                    allergiesPlaceholder
                                                                }
                                                                aria-label={
                                                                    allergiesLabel
                                                                }
                                                            />
                                                        </div>

                                                        {showShuttle ? (
                                                            <div
                                                                style={{
                                                                    marginTop: 12,
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        display:
                                                                            "flex",
                                                                        gap: 10,
                                                                        marginTop: 8,
                                                                    }}
                                                                >
                                                                    <button
                                                                        style={choiceStyle(
                                                                            a.shuttle ===
                                                                                true
                                                                        )}
                                                                        onClick={() =>
                                                                            updateAnswer(
                                                                                id,
                                                                                {
                                                                                    shuttle:
                                                                                        true,
                                                                                }
                                                                            )
                                                                        }
                                                                        type="button"
                                                                        aria-label={`${shuttleLabel} ${yesLabel}`}
                                                                    >
                                                                        <span
                                                                            style={{
                                                                                fontWeight: 800,
                                                                            }}
                                                                        >
                                                                            {
                                                                                shuttleYesText
                                                                            }
                                                                        </span>
                                                                        <RadioMark
                                                                            active={
                                                                                a.shuttle ===
                                                                                true
                                                                            }
                                                                        />
                                                                    </button>

                                                                    <button
                                                                        style={choiceStyle(
                                                                            a.shuttle ===
                                                                                false
                                                                        )}
                                                                        onClick={() =>
                                                                            updateAnswer(
                                                                                id,
                                                                                {
                                                                                    shuttle:
                                                                                        false,
                                                                                }
                                                                            )
                                                                        }
                                                                        type="button"
                                                                        aria-label={`${shuttleLabel} ${noLabel}`}
                                                                    >
                                                                        <span
                                                                            style={{
                                                                                fontWeight: 800,
                                                                            }}
                                                                        >
                                                                            {
                                                                                shuttleNoText
                                                                            }
                                                                        </span>
                                                                        <RadioMark
                                                                            active={
                                                                                a.shuttle ===
                                                                                false
                                                                            }
                                                                        />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : null}

                                                        <div
                                                            style={{
                                                                marginTop: 12,
                                                            }}
                                                        >
                                                            <textarea
                                                                style={
                                                                    s.textarea
                                                                }
                                                                value={a.notes}
                                                                onChange={(e) =>
                                                                    updateAnswer(
                                                                        id,
                                                                        {
                                                                            notes: e
                                                                                .target
                                                                                .value,
                                                                        }
                                                                    )
                                                                }
                                                                placeholder={
                                                                    notesPlaceholder
                                                                }
                                                                aria-label={
                                                                    notesLabel
                                                                }
                                                            />
                                                        </div>

                                                        <div style={s.divider} />
                                                    </>
                                                ) : (
                                                    <div
                                                        style={{
                                                            marginTop: 10,
                                                            ...s.small,
                                                        }}
                                                    >
                                                        {noMoreInfoNeededText}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}

                                    {submitError ? (
                                        <div
                                            style={{
                                                ...s.error,
                                                marginTop: 10,
                                            }}
                                        >
                                            {submitError}
                                        </div>
                                    ) : null}

                                    <button
                                        style={s.btn(true)}
                                        onClick={submit}
                                        disabled={submitLoading}
                                    >
                                        {submitLoading ? submitLoadingLabel : submitLabel}
                                    </button>
                                    </>
                                )}
                            </>
                        ) : null}
                    </AutoHeight>
                </div>
            ) : null}
        </div>
    )
}

RSVPGoogleSheets.defaultProps = {
    title: "Conferma la tua presenza",
    searchPlaceholder: "Cerca il tuo nome…",
    endpointUrl: "",
    showShuttle: true,
    requireMenuIfAttending: true,
    menuOptions: "Carne\nPesce\nVegetariano",
    attendingLabel: "Parteciperai?",
    yesLabel: "Ci sarò",
    noLabel: "Non ci sarò",
    shuttleYesText: "Bus da Palermo",
    shuttleNoText: "No bus",
    menuLabel: "Menu",
    allergiesLabel: "Allergie / Intolleranze",
    shuttleLabel: "Voglio il bus navetta",
    notesLabel: "Note",
    selectPeopleLabel: "Seleziona chi fa parte del tuo gruppo",
    submitLabel: "Invia",
    successTitle: "Ricevuto! 🎉",
    successSubtitle: "Grazie — abbiamo salvato la tua risposta.",
    resetLabel: "Ricomincia",
    searchButtonLabel: "Cerca",

    endpointMissingText:
        "Inserisci endpointUrl (URL Web App di Apps Script) nelle proprietà del componente in Framer.",
    searchMinCharsError: "Scrivi almeno 2 caratteri.",
    searchGenericError: "Errore durante la ricerca.",
    noResultsText: "Nessun risultato trovato. Prova con un altro nome.",
    familyLoadErrorText: "Errore nel caricamento del gruppo.",
    submitLoadingLabel: "Invio…",
    searchLoaderLottieFile: "",
    submitGenericError: "Errore durante l'invio.",
    serverInvalidResponseError: "Risposta non valida dal server.",
    noMoreInfoNeededText: "Ok — nessun’altra informazione necessaria.",

    validateSelectGuestError: "Seleziona prima un invitato.",
    validateSelectPeopleError: "Seleziona almeno una persona.",
    validateIncompleteDataError: "Dati incompleti: riprova.",
    validateAttendanceErrorTemplate: "Seleziona la presenza per {name}.",
    validateMenuErrorTemplate: "Scegli un menu per {name}.",
    validateAllergiesErrorTemplate:
        "Compila “Allergie / Intolleranze” per {name} (se non ci sono, scrivi “Nessuna”).",
    validateShuttleErrorTemplate:
        "Seleziona “Bus navetta” (Sì/No) per {name}.",

    commonBorderColor: "rgba(0,0,0,0.12)",
    commonBorderWidth: 1,

    requiredAsterisk: "*",

    // ✅ NEW
    titleFont: {
        fontSize: 18,
        variant: "Bold",
        letterSpacing: "0em",
        lineHeight: "1.2em",
    },
    selectPeopleLabelFont: {
        fontSize: 16,
        variant: "Bold",
        letterSpacing: "0em",
        lineHeight: "1.2em",
    },
    participantNameFont: {
        fontSize: 15,
        variant: "Extra Bold",
        letterSpacing: "0em",
        lineHeight: "1.2em",
    },

    font: {
        fontSize: 16,
        variant: "Regular",
        letterSpacing: "0em",
        lineHeight: "1.4em",
    },

    textColor: "rgba(0,0,0,0.88)",
    mutedTextColor: "rgba(0,0,0,0.65)",

    wrapBackground: "transparent",
    wrapPadding: 16,
    wrapGap: 12,

    cardBackground: "rgba(255,255,255,0.9)",
    cardBorderColor: "rgba(0,0,0,0.08)",
    cardBorderWidth: 1,
    cardRadius: 14,
    cardPadding: 14,

    smallSize: 12,

    inputBackground: "white",
    inputTextColor: "rgba(0,0,0,0.88)",
    inputBorderColor: "rgba(0,0,0,0.12)",
    inputRadius: 12,
    inputPaddingX: 12,
    inputPaddingY: 12,

    selectBackground: "white",

    buttonRadius: 12,
    buttonPrimaryBackground: "rgba(0,0,0,0.88)",
    buttonPrimaryTextColor: "white",
    buttonGhostBackground: "transparent",
    buttonGhostTextColor: "rgba(0,0,0,0.88)",
    buttonBorderColor: "rgba(0,0,0,0.12)",
    buttonFontSize: 15,
    buttonFontWeight: 700,

    dividerColor: "rgba(0,0,0,0.06)",

    errorTextColor: "rgb(176, 26, 26)",
    errorBackground: "rgba(176, 26, 26, 0.08)",
    errorBorderColor: "rgba(176, 26, 26, 0.18)",

    successTextColor: "rgb(18, 102, 55)",
    successBackground: "rgba(18, 102, 55, 0.08)",
    successBorderColor: "rgba(18, 102, 55, 0.18)",
}

addPropertyControls(RSVPGoogleSheets, {
    endpointUrl: { type: ControlType.String, title: "Endpoint URL" },

    // ✅ NEW: header controls
    titleFont: {
        type: ControlType.Font,
        title: "Titolo · Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 18,
            variant: "Bold",
            letterSpacing: "0em",
            lineHeight: "1.2em",
        },
    },
    title: { type: ControlType.String, title: "Titolo" },
    selectPeopleLabelFont: {
        type: ControlType.Font,
        title: "Gruppo · Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 16,
            variant: "Bold",
            letterSpacing: "0em",
            lineHeight: "1.2em",
        },
    },
    participantNameFont: {
        type: ControlType.Font,
        title: "Partecipante · Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 15,
            variant: "Extra Bold",
            letterSpacing: "0em",
            lineHeight: "1.2em",
        },
    },
    searchPlaceholder: {
        type: ControlType.String,
        title: "Placeholder ricerca",
    },

    showShuttle: {
        type: ControlType.Boolean,
        title: "Mostra navetta",
        defaultValue: true,
    },
    requireMenuIfAttending: {
        type: ControlType.Boolean,
        title: "Menu obbligatorio",
        defaultValue: true,
    },

    menuOptions: {
        type: ControlType.String,
        title: "Opzioni menu",
        displayTextArea: true,
        defaultValue: "Carne\nPesce\nVegetariano",
    },

    attendingLabel: { type: ControlType.String, title: "Label presenza" },
    yesLabel: { type: ControlType.String, title: "Label sì" },
    noLabel: { type: ControlType.String, title: "Label no" },
    shuttleYesText: {
        type: ControlType.String,
        title: "Navetta testo Sì",
    },

    shuttleNoText: {
        type: ControlType.String,
        title: "Navetta testo No",
    },
    menuLabel: { type: ControlType.String, title: "Label menu" },
    allergiesLabel: { type: ControlType.String, title: "Label allergie" },
    shuttleLabel: { type: ControlType.String, title: "Label navetta" },
    notesLabel: { type: ControlType.String, title: "Label note" },
    selectPeopleLabel: { type: ControlType.String, title: "Label gruppo" },

    submitLabel: { type: ControlType.String, title: "Testo bottone" },
    successTitle: { type: ControlType.String, title: "Titolo successo" },
    successSubtitle: { type: ControlType.String, title: "Testo successo" },

    searchButtonLabel: { type: ControlType.String, title: "Testo Cerca" },
    resetLabel: { type: ControlType.String, title: "Testo Ricomincia" },

    endpointMissingText: {
        type: ControlType.String,
        title: "Mess. endpoint mancante",
    },
    searchMinCharsError: { type: ControlType.String, title: "Err. ricerca corta" },
    searchGenericError: { type: ControlType.String, title: "Err. ricerca" },
    noResultsText: { type: ControlType.String, title: "Mess. no risultati" },
    familyLoadErrorText: { type: ControlType.String, title: "Err. caricamento gruppo" },
    submitLoadingLabel: { type: ControlType.String, title: "Invio in corso" },
    searchLoaderLottieFile: {
        type: ControlType.File,
        title: "Loader Lottie JSON",
        allowedFileTypes: ["json"],
    },
    submitGenericError: { type: ControlType.String, title: "Err. invio" },
    serverInvalidResponseError: {
        type: ControlType.String,
        title: "Err. risposta server",
    },
    noMoreInfoNeededText: {
        type: ControlType.String,
        title: "Mess. nessuna info",
    },

    validateSelectGuestError: {
        type: ControlType.String,
        title: "Err. seleziona invitato",
    },
    validateSelectPeopleError: {
        type: ControlType.String,
        title: "Err. seleziona persone",
    },
    validateIncompleteDataError: {
        type: ControlType.String,
        title: "Err. dati incompleti",
    },
    validateAttendanceErrorTemplate: {
        type: ControlType.String,
        title: "Err. presenza ({name})",
    },
    validateMenuErrorTemplate: {
        type: ControlType.String,
        title: "Err. menu ({name})",
    },
    validateAllergiesErrorTemplate: {
        type: ControlType.String,
        title: "Err. allergie ({name})",
    },
    validateShuttleErrorTemplate: {
        type: ControlType.String,
        title: "Err. navetta ({name})",
    },

    commonBorderColor: {
        type: ControlType.Color,
        title: "Border (global) color",
    },
    commonBorderWidth: {
        type: ControlType.Number,
        title: "Border (global) width",
        min: 0,
        max: 8,
        step: 1,
    },

    requiredAsterisk: {
        type: ControlType.String,
        title: "Asterisco obblig.",
        defaultValue: "*",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 16,
            variant: "Regular",
            letterSpacing: "0em",
            lineHeight: "1.4em",
        },
    },

    textColor: { type: ControlType.Color, title: "Testo" },
    mutedTextColor: { type: ControlType.Color, title: "Testo secondario" },

    wrapBackground: { type: ControlType.Color, title: "Bg container" },
    wrapPadding: {
        type: ControlType.FusedNumber,
        title: "Padding container",
        defaultValue: 16,
        toggleKey: "wrapPaddingAll",
        toggleTitles: ["All", "T", "R", "B", "L"],
        valueKeys: ["top", "right", "bottom", "left"],
        valueLabels: ["T", "R", "B", "L"],
        min: 0,
    },
    wrapGap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 64,
        step: 1,
    },

    cardBackground: { type: ControlType.Color, title: "Bg card" },
    cardBorderColor: { type: ControlType.Color, title: "Bordo card" },
    cardBorderWidth: {
        type: ControlType.Number,
        title: "Spessore bordo",
        min: 0,
        max: 8,
        step: 1,
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Raggio card",
        min: 0,
        max: 48,
        step: 1,
    },
    cardPadding: {
        type: ControlType.Number,
        title: "Padding card",
        min: 0,
        max: 48,
        step: 1,
    },

    smallSize: {
        type: ControlType.Number,
        title: "Small size",
        min: 10,
        max: 20,
        step: 1,
    },

    inputBackground: { type: ControlType.Color, title: "Bg input" },
    inputTextColor: { type: ControlType.Color, title: "Testo input" },
    inputBorderColor: { type: ControlType.Color, title: "Bordo input" },
    inputRadius: {
        type: ControlType.Number,
        title: "Raggio input",
        min: 0,
        max: 32,
        step: 1,
    },
    inputPaddingX: {
        type: ControlType.Number,
        title: "Input pad X",
        min: 0,
        max: 24,
        step: 1,
    },
    inputPaddingY: {
        type: ControlType.Number,
        title: "Input pad Y",
        min: 0,
        max: 24,
        step: 1,
    },
    selectBackground: { type: ControlType.Color, title: "Bg select" },

    buttonRadius: {
        type: ControlType.Number,
        title: "Raggio bottoni",
        min: 0,
        max: 32,
        step: 1,
    },
    buttonPrimaryBackground: {
        type: ControlType.Color,
        title: "Btn primary bg",
    },
    buttonPrimaryTextColor: {
        type: ControlType.Color,
        title: "Btn primary testo",
    },
    buttonGhostBackground: { type: ControlType.Color, title: "Btn ghost bg" },
    buttonGhostTextColor: { type: ControlType.Color, title: "Btn ghost testo" },
    buttonBorderColor: { type: ControlType.Color, title: "Bordo bottoni" },
    buttonFontSize: {
        type: ControlType.Number,
        title: "Btn size",
        min: 10,
        max: 24,
        step: 1,
    },
    buttonFontWeight: {
        type: ControlType.Number,
        title: "Btn weight",
        min: 100,
        max: 900,
        step: 50,
    },

    dividerColor: { type: ControlType.Color, title: "Divider" },

    errorTextColor: { type: ControlType.Color, title: "Errore testo" },
    errorBackground: { type: ControlType.Color, title: "Errore bg" },
    errorBorderColor: { type: ControlType.Color, title: "Errore bordo" },

    successTextColor: { type: ControlType.Color, title: "Successo testo" },
    successBackground: { type: ControlType.Color, title: "Successo bg" },
    successBorderColor: { type: ControlType.Color, title: "Successo bordo" },
})
