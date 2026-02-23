import { useState, useEffect, useRef, useCallback } from 'react'

const ITEM_H = 44

function InfiniteWheel({ items, value, onChange, format }) {
    const ref = useRef(null)
    const isJumping = useRef(false)
    const blockSize = items.length

    // Build: [... items ... items ... items ...]
    const looped = [...items, ...items, ...items]
    const centerStart = blockSize

    // Initial scroll position
    const valueIndex = items.indexOf(value)
    const initialIndex = centerStart + (valueIndex >= 0 ? valueIndex : 0)

    useEffect(() => {
        if (ref.current) {
            ref.current.style.scrollBehavior = 'auto'
            ref.current.scrollTop = initialIndex * ITEM_H
        }
        // eslint-disable-next-line
    }, [])

    const handleScroll = useCallback(() => {
        const el = ref.current
        if (!el || isJumping.current) return

        const scrollIdx = Math.round(el.scrollTop / ITEM_H)
        const realIdx = ((scrollIdx % blockSize) + blockSize) % blockSize
        const newVal = items[realIdx]

        if (newVal !== undefined && newVal !== value) {
            onChange(newVal)
        }

        // Recenter instantly if scrolled into edge blocks
        if (scrollIdx < blockSize - 1 || scrollIdx >= blockSize * 2) {
            isJumping.current = true
            // Jump to equivalent position in center block
            const targetScroll = (centerStart + realIdx) * ITEM_H
            el.style.scrollBehavior = 'auto'
            el.scrollTop = targetScroll
            // Re-enable after browser paints
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    isJumping.current = false
                })
            })
        }
    }, [items, blockSize, centerStart, value, onChange])

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
