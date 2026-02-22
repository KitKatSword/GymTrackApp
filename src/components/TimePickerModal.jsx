import { useState, useEffect, useRef, useCallback } from 'react'

const ITEM_H = 44
const VISIBLE = 3  // show 3 items: top, center, bottom

// Build a looping list: [... original ... original ... original ...]
function buildLoop(arr) {
    return [...arr, ...arr, ...arr]
}

function InfiniteWheel({ items, value, onChange, format }) {
    const ref = useRef(null)
    const isScrollingRef = useRef(false)
    const timeoutRef = useRef(null)

    const looped = buildLoop(items)
    const blockSize = items.length
    const centerStart = blockSize // start of center block

    // Find value's index within original array
    const valueIndex = items.indexOf(value)
    const initialScroll = (centerStart + (valueIndex >= 0 ? valueIndex : 0)) * ITEM_H

    useEffect(() => {
        if (ref.current) {
            ref.current.scrollTop = initialScroll
        }
        // eslint-disable-next-line
    }, [])

    const recenter = useCallback(() => {
        if (!ref.current) return
        const el = ref.current
        const idx = Math.round(el.scrollTop / ITEM_H)

        // If scrolled into top block, jump to center
        if (idx < blockSize) {
            el.scrollTop += blockSize * ITEM_H
        }
        // If scrolled into bottom block, jump to center
        else if (idx >= blockSize * 2) {
            el.scrollTop -= blockSize * ITEM_H
        }
    }, [blockSize])

    const handleScroll = () => {
        if (!ref.current) return
        const idx = Math.round(ref.current.scrollTop / ITEM_H)
        const realIdx = ((idx % blockSize) + blockSize) % blockSize
        const newVal = items[realIdx]
        if (newVal !== undefined && newVal !== value) {
            onChange(newVal)
        }

        // Debounce recenter
        clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(recenter, 150)
    }

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

    const minutesList = Array.from({ length: 16 }, (_, i) => i)         // 0-15
    const secondsList = Array.from({ length: 12 }, (_, i) => i * 5)     // 0,5,10,...55

    // Snap secs to nearest 5 on init
    const snappedSecs = secondsList.reduce((prev, curr) =>
        Math.abs(curr - secs) < Math.abs(prev - secs) ? curr : prev, 0)

    useEffect(() => { setSecs(snappedSecs) }, [])

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ padding: 24 }}>
                <div className="time-picker-title">Imposta Timer</div>

                <div className="time-picker-wheels">
                    {/* Highlight bar */}
                    <div className="time-picker-highlight" />

                    <InfiniteWheel
                        items={minutesList}
                        value={mins}
                        onChange={setMins}
                    />

                    <div className="time-picker-colon">:</div>

                    <InfiniteWheel
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
