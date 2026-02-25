import { useState, useEffect, useRef, useCallback } from 'react'

const ITEM_H = 44

function WheelColumn({ items, value, onChange, format }) {
    const ref = useRef(null)
    const scrollTimer = useRef(null)
    const lastEmitted = useRef(value)
    const isCentering = useRef(false)
    const blockSize = items.length

    // 5 copies → plenty of buffer so user never sees emptiness
    const copies = 5
    const looped = Array.from({ length: copies }, () => items).flat()
    const centerBlock = Math.floor(copies / 2) // block index 2

    const scrollForValue = (v) => {
        const idx = items.indexOf(v)
        return (centerBlock * blockSize + (idx >= 0 ? idx : 0)) * ITEM_H
    }

    // Initial position
    useEffect(() => {
        const el = ref.current
        if (!el) return
        el.scrollTop = scrollForValue(value)
        // eslint-disable-next-line
    }, [])

    // Sync if parent changes value
    useEffect(() => {
        if (ref.current && !scrollTimer.current) {
            ref.current.scrollTop = scrollForValue(value)
        }
        // eslint-disable-next-line
    }, [value])

    // Snap to nearest item and emit value
    const snapAndEmit = useCallback(() => {
        const el = ref.current
        if (!el) return

        const rawIdx = Math.round(el.scrollTop / ITEM_H)
        const realIdx = ((rawIdx % blockSize) + blockSize) % blockSize
        const newVal = items[realIdx]

        // Snap to precise item boundary
        const snapTarget = rawIdx * ITEM_H
        if (Math.abs(el.scrollTop - snapTarget) > 1) {
            el.scrollTo({ top: snapTarget, behavior: 'smooth' })
        }

        // Emit change
        if (newVal !== undefined && newVal !== lastEmitted.current) {
            lastEmitted.current = newVal
            onChange(newVal)
        }

        // Recenter to middle block after snap settles
        setTimeout(() => {
            if (!ref.current) return
            isCentering.current = true
            const curIdx = Math.round(ref.current.scrollTop / ITEM_H)
            const rIdx = ((curIdx % blockSize) + blockSize) % blockSize
            ref.current.scrollTop = (centerBlock * blockSize + rIdx) * ITEM_H
            requestAnimationFrame(() => {
                isCentering.current = false
            })
        }, 100)

        scrollTimer.current = null
    }, [items, blockSize, centerBlock, onChange])

    const handleScroll = useCallback(() => {
        if (isCentering.current) return

        const el = ref.current
        if (!el) return

        // Safety: if near edges (block 0 or last block), recenter instantly
        const rawIdx = Math.round(el.scrollTop / ITEM_H)
        if (rawIdx < blockSize || rawIdx >= blockSize * (copies - 1)) {
            isCentering.current = true
            const realIdx = ((rawIdx % blockSize) + blockSize) % blockSize
            el.scrollTop = (centerBlock * blockSize + realIdx) * ITEM_H
            requestAnimationFrame(() => {
                isCentering.current = false
            })
            return
        }

        // Debounce snap
        clearTimeout(scrollTimer.current)
        scrollTimer.current = setTimeout(snapAndEmit, 80)
    }, [snapAndEmit, blockSize, centerBlock, copies])

    useEffect(() => {
        return () => clearTimeout(scrollTimer.current)
    }, [])

    return (
        <div
            ref={ref}
            onScroll={handleScroll}
            className="time-wheel"
        >
            {looped.map((item, i) => {
                const isSelected = item === value
                return (
                    <div
                        key={i}
                        className={`time-wheel-item ${isSelected ? 'selected' : ''}`}
                    >
                        {format ? format(item) : item}
                    </div>
                )
            })}
        </div>
    )
}

export default function TimePickerModal({ initialSeconds, onClose, onSave }) {
    const [mins, setMins] = useState(Math.floor(initialSeconds / 60))
    const [secs, setSecs] = useState(initialSeconds % 60)

    const minutesList = Array.from({ length: 16 }, (_, i) => i)
    const secondsList = Array.from({ length: 12 }, (_, i) => i * 5)

    // Snap secs to nearest 5 on init
    const snappedSecs = secondsList.reduce((prev, curr) =>
        Math.abs(curr - secs) < Math.abs(prev - secs) ? curr : prev, 0)

    useEffect(() => { setSecs(snappedSecs) }, [])

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ padding: 24 }}>
                <div className="time-picker-title">Imposta Timer</div>

                <div className="time-picker-wheels">
                    <div className="time-picker-highlight" />

                    <WheelColumn
                        items={minutesList}
                        value={mins}
                        onChange={setMins}
                    />

                    <div className="time-picker-colon">:</div>

                    <WheelColumn
                        items={secondsList}
                        value={secs}
                        onChange={setSecs}
                        format={v => v.toString().padStart(2, '0')}
                    />
                </div>

                <div className="confirm-actions" style={{ marginTop: 24 }}>
                    <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Annulla</button>
                    <button className="btn btn-primary" onClick={() => onSave((mins * 60) + secs)} style={{ flex: 1 }}>Salva</button>
                </div>
            </div>
        </div>
    )
}
