import { useState, useEffect, useRef } from 'react'

export default function TimePickerModal({ initialSeconds, onClose, onSave }) {
    const [mins, setMins] = useState(Math.floor(initialSeconds / 60))
    const [secs, setSecs] = useState(initialSeconds % 60)

    const minRef = useRef(null)
    const secRef = useRef(null)

    const minutesList = Array.from({ length: 16 }, (_, i) => i)
    const secondsList = Array.from({ length: 12 }, (_, i) => i * 5)

    useEffect(() => {
        if (minRef.current) {
            const itemHeight = 44
            minRef.current.scrollTop = mins * itemHeight
        }
        if (secRef.current) {
            const itemHeight = 44
            const secIndex = secondsList.indexOf(secs) >= 0 ? secondsList.indexOf(secs) : 0
            secRef.current.scrollTop = secIndex * itemHeight
        }
        // eslint-disable-next-line
    }, [])

    const handleScroll = (ref, isMin) => {
        if (!ref.current) return
        const itemHeight = 44
        const index = Math.round(ref.current.scrollTop / itemHeight)
        if (isMin) {
            if (minutesList[index] !== undefined) setMins(minutesList[index])
        } else {
            if (secondsList[index] !== undefined) setSecs(secondsList[index])
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ padding: '24px' }}>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)', textAlign: 'center', marginBottom: 20 }}>
                    Imposta Timer
                </div>

                <div style={{
                    display: 'flex', justifyContent: 'center', gap: 24, height: 132,
                    position: 'relative', overflow: 'hidden',
                    maskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)'
                }}>
                    {/* Center highlight bar */}
                    <div style={{
                        position: 'absolute', top: 44, left: 0, right: 0, height: 44,
                        background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)',
                        pointerEvents: 'none'
                    }} />

                    {/* Minutes wheel */}
                    <div
                        ref={minRef}
                        onScroll={() => handleScroll(minRef, true)}
                        style={{
                            height: 132, overflowY: 'auto', scrollSnapType: 'y mandatory',
                            padding: '44px 0', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
                        }}
                    >
                        {minutesList.map(m => (
                            <div key={m} style={{
                                height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 'var(--text-xl)', fontWeight: mins === m ? 800 : 500,
                                color: mins === m ? 'var(--text-primary)' : 'var(--text-muted)',
                                scrollSnapAlign: 'center', transition: 'all 0.1s'
                            }}>
                                {m}
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', height: 132, fontWeight: 700, fontSize: 'var(--text-xl)' }}>
                        :
                    </div>

                    {/* Seconds wheel */}
                    <div
                        ref={secRef}
                        onScroll={() => handleScroll(secRef, false)}
                        style={{
                            height: 132, overflowY: 'auto', scrollSnapType: 'y mandatory',
                            padding: '44px 0', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
                        }}
                    >
                        {secondsList.map(s => (
                            <div key={s} style={{
                                height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 'var(--text-xl)', fontWeight: secs === s ? 800 : 500,
                                color: secs === s ? 'var(--text-primary)' : 'var(--text-muted)',
                                scrollSnapAlign: 'center', transition: 'all 0.1s'
                            }}>
                                {s.toString().padStart(2, '0')}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="confirm-actions" style={{ marginTop: 24 }}>
                    <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Annulla</button>
                    <button className="btn btn-primary" onClick={() => onSave((mins * 60) + secs)} style={{ flex: 1 }}>Salva</button>
                </div>
            </div>
        </div>
    )
}
