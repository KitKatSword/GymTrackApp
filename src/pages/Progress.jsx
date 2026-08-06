import { useEffect, useMemo, useRef, useState } from 'react'
import { toLocalDateString } from '../utils/date'
import { formatHistoryDate } from '../utils/history'
import { buildExerciseProgress, getPrimaryProgressMetric } from '../utils/progress'

function formatNumber(value, digits = 0) {
    return Number(value || 0).toLocaleString('it-IT', { maximumFractionDigits: digits })
}

function MetricCard({ label, value, suffix = '' }) {
    return (
        <div className="progress-metric-card">
            <div className="progress-metric-value">{value}{suffix && <small>{suffix}</small>}</div>
            <div className="progress-metric-label">{label}</div>
        </div>
    )
}

function TrendChart({ sessions, metric }) {
    const points = [...sessions].reverse().slice(-12)
    const values = points.map(session => Number(session[metric.key]) || 0)
    const max = Math.max(...values, 1)
    const min = Math.min(...values)
    const range = Math.max(1, max - min)
    const coords = values.map((value, index) => ({
        x: values.length === 1 ? 160 : 12 + index * (296 / (values.length - 1)),
        y: 88 - ((value - min) / range) * 70,
        value,
    }))
    const path = coords.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')

    return (
        <div className="progress-chart-card">
            <div className="progress-chart-header">
                <span>Andamento {metric.label}</span>
                <span>ultime {points.length} sedute</span>
            </div>
            <svg className="progress-chart" viewBox="0 0 320 105" role="img" aria-label={`Andamento ${metric.label}`}>
                <line x1="12" y1="88" x2="308" y2="88" className="progress-chart-axis" />
                {path && <path d={path} className="progress-chart-line" />}
                {coords.map((point, index) => (
                    <circle key={`${point.x}-${index}`} cx={point.x} cy={point.y} r="3.5" className="progress-chart-point" />
                ))}
            </svg>
        </div>
    )
}

function ProgressPhotoSection({ photos, onAddPhoto, onDeletePhoto }) {
    const [showForm, setShowForm] = useState(false)
    const [date, setDate] = useState(toLocalDateString())
    const [note, setNote] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const fileRef = useRef(null)

    const handleFile = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return
        setBusy(true)
        setError('')
        try {
            await onAddPhoto(file, { date, note })
            setNote('')
            setShowForm(false)
        } catch (saveError) {
            setError(saveError?.message || 'Impossibile salvare la foto.')
        } finally {
            setBusy(false)
            event.target.value = ''
        }
    }

    return (
        <section className="progress-photo-section">
            <div className="progress-section-heading">
                <div>
                    <div className="section-label">Foto progresso</div>
                    <div className="progress-section-help">Confronti visivi salvati solo su questo dispositivo.</div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(value => !value)}>
                    {showForm ? 'Annulla' : '+ Foto'}
                </button>
            </div>

            {showForm && (
                <div className="progress-photo-form">
                    <label>
                        <span>Data</span>
                        <input className="input" type="date" max={toLocalDateString()} value={date} onChange={event => setDate(event.target.value)} />
                    </label>
                    <label>
                        <span>Nota</span>
                        <input className="input" type="text" placeholder="Peso, posa, fase del programma…" value={note} onChange={event => setNote(event.target.value)} />
                    </label>
                    <input ref={fileRef} type="file" accept="image/*" capture="user" hidden onChange={handleFile} />
                    <button className="btn btn-primary btn-full" disabled={busy || !date} onClick={() => fileRef.current?.click()}>
                        {busy ? 'Elaborazione…' : 'Scatta o scegli foto'}
                    </button>
                    {error && <div className="media-error">{error}</div>}
                </div>
            )}

            {photos.length === 0 ? (
                <div className="progress-empty-card">Nessuna foto progresso. Aggiungine una per iniziare il confronto nel tempo.</div>
            ) : (
                <div className="progress-photo-grid">
                    {photos.map(photo => (
                        <article key={photo.id} className="progress-photo-card">
                            <img src={photo.image} alt={`Progresso del ${photo.date}`} />
                            <div className="progress-photo-copy">
                                <strong>{formatHistoryDate(photo.date)}</strong>
                                {photo.note && <span>{photo.note}</span>}
                            </div>
                            <button className="progress-photo-delete" aria-label="Elimina foto" onClick={() => setDeleteConfirm(photo.id)}>✕</button>
                        </article>
                    ))}
                </div>
            )}

            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal" onClick={event => event.stopPropagation()}>
                        <div className="modal-handle" />
                        <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>Eliminare questa foto?</div>
                        <div className="confirm-actions">
                            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Annulla</button>
                            <button className="btn btn-danger" onClick={() => { onDeletePhoto(deleteConfirm); setDeleteConfirm(null) }}>Elimina</button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}

export default function Progress({ workouts, photos, onAddPhoto, onDeletePhoto }) {
    const progress = useMemo(() => buildExerciseProgress(workouts), [workouts])
    const [selectedKey, setSelectedKey] = useState('')

    useEffect(() => {
        if (!progress.length) {
            setSelectedKey('')
            return
        }
        if (!progress.some(item => item.key === selectedKey)) setSelectedKey(progress[0].key)
    }, [progress, selectedKey])

    const selected = progress.find(item => item.key === selectedKey) || progress[0] || null
    const metric = selected ? getPrimaryProgressMetric(selected) : null
    const latestValue = selected && metric ? selected.latest?.[metric.key] || 0 : 0
    const previousValue = selected && metric ? selected.previous?.[metric.key] || 0 : 0
    const delta = previousValue ? ((latestValue - previousValue) / previousValue) * 100 : null

    return (
        <div className="page progress-page">
            <div className="page-header">
                <div className="page-title">Progressi</div>
                <div className="page-subtitle">Carichi, volume, RIR e confronto fotografico</div>
            </div>

            <section>
                <div className="section-label">Tracking esercizi</div>
                {progress.length === 0 ? (
                    <div className="progress-empty-card">
                        Completa almeno una serie lavorante per vedere trend, volume e record personali.
                    </div>
                ) : (
                    <>
                        <select className="input progress-exercise-select" value={selected?.key || ''} onChange={event => setSelectedKey(event.target.value)}>
                            {progress.map(item => (
                                <option key={item.key} value={item.key}>{item.name} · {item.sessions.length} sedute</option>
                            ))}
                        </select>

                        <div className="progress-summary-title">
                            <div>
                                <strong>{selected.name}</strong>
                                <span>Ultima seduta: {formatHistoryDate(selected.latest.date)}</span>
                            </div>
                            {delta !== null && (
                                <span className={`progress-delta ${delta >= 0 ? 'positive' : 'negative'}`}>
                                    {delta >= 0 ? '+' : ''}{formatNumber(delta, 1)}%
                                </span>
                            )}
                        </div>

                        <div className="progress-metric-grid">
                            {selected.best.topWeight > 0 && <MetricCard label="PR peso" value={formatNumber(selected.best.topWeight, 1)} suffix="kg" />}
                            {selected.latest.totalVolume > 0 && <MetricCard label="Volume ultimo" value={formatNumber(selected.latest.totalVolume)} suffix="kg" />}
                            {selected.best.bestEstimated1RM > 0 && <MetricCard label="Miglior e1RM" value={formatNumber(selected.best.bestEstimated1RM, 1)} suffix="kg" />}
                            {selected.latest.averageRir !== null && <MetricCard label="RIR medio" value={formatNumber(selected.latest.averageRir, 1)} />}
                            {selected.latest.topWeight === 0 && selected.latest.totalReps > 0 && <MetricCard label="Ripetizioni" value={selected.latest.totalReps} />}
                            {selected.latest.totalTime > 0 && <MetricCard label="Tempo" value={selected.latest.totalTime} suffix="s" />}
                        </div>

                        <TrendChart sessions={selected.sessions} metric={metric} />

                        <div className="progress-session-list">
                            {selected.sessions.slice(0, 6).map(session => (
                                <div key={`${session.workoutId}-${session.exerciseId}`} className="progress-session-row">
                                    <span>{formatHistoryDate(session.date)}</span>
                                    <strong>{formatNumber(session[metric.key], metric.unit === 'kg' ? 1 : 0)} {metric.unit}</strong>
                                    <small>{session.setCount} serie</small>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </section>

            <ProgressPhotoSection photos={photos} onAddPhoto={onAddPhoto} onDeletePhoto={onDeletePhoto} />
        </div>
    )
}
