import { useState } from 'react'

export default function History({ workouts, onDuplicate, onDelete }) {
    const [expandedId, setExpandedId] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    const completedWorkouts = workouts.filter(w => w.endTime)

    const formatDate = (dateStr) => {
        const d = new Date(dateStr + 'T12:00:00')
        const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
        const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']
        return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
    }

    const getDuration = (start, end) => {
        if (!start || !end) return '--'
        const [sh, sm] = start.split(':').map(Number)
        const [eh, em] = end.split(':').map(Number)
        const mins = (eh * 60 + em) - (sh * 60 + sm)
        if (mins < 60) return `${mins} min`
        return `${Math.floor(mins / 60)}h ${mins % 60}min`
    }

    if (completedWorkouts.length === 0) {
        return (
            <div className="page">
                <div className="page-header">
                    <h1 className="page-title">Storico 📋</h1>
                </div>
                <div className="empty-state">
                    <div className="emoji">📋</div>
                    <div className="title">Nessun allenamento completato</div>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Completa il tuo primo allenamento per vederlo qui
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">Storico 📋</h1>
                <div className="page-subtitle">{completedWorkouts.length} allenamenti completati</div>
            </div>

            {completedWorkouts.map(w => {
                const totalSets = w.exercises.reduce((s, e) => s + e.sets.filter(st => st.completed).length, 0)
                const isExpanded = expandedId === w.id

                return (
                    <div key={w.id} className="history-card" onClick={() => setExpandedId(isExpanded ? null : w.id)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div className="history-date">{formatDate(w.date)}</div>
                                <div className="history-meta">
                                    <span>🕐 {w.startTime} - {w.endTime}</span>
                                    <span>⏱ {getDuration(w.startTime, w.endTime)}</span>
                                </div>
                            </div>
                            <div style={{
                                fontSize: 'var(--font-xs)', color: 'var(--accent-light)',
                                background: 'rgba(124,58,237,0.12)', padding: '2px 8px',
                                borderRadius: 'var(--radius-full)', fontWeight: 600,
                            }}>
                                {totalSets} serie
                            </div>
                        </div>

                        <div className="history-exercises">
                            {w.exercises.map(ex => (
                                <span key={ex.id} className="history-tag">
                                    {ex.emoji} {ex.name}
                                </span>
                            ))}
                        </div>

                        {isExpanded && (
                            <div style={{ marginTop: 'var(--space-md)', animation: 'fadeIn 0.2s ease' }}>
                                {w.exercises.map(ex => (
                                    <div key={ex.id} style={{ marginBottom: 'var(--space-sm)' }}>
                                        <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)', marginBottom: 4 }}>
                                            {ex.emoji} {ex.name}
                                        </div>
                                        {ex.sets.filter(s => s.completed).map((s, i) => {
                                            const params = ex.params || ['weight', 'reps']
                                            const parts = params.map(p => {
                                                if (p === 'weight') return `${s.weight || 0}kg`
                                                if (p === 'reps') return `${s.reps || 0} reps`
                                                if (p === 'time') return `${s.time || 0}s`
                                                return `${s[p] || 0}`
                                            })
                                            return (
                                                <div key={s.id} style={{
                                                    fontSize: 'var(--font-xs)', color: 'var(--text-secondary)',
                                                    paddingLeft: 'var(--space-md)'
                                                }}>
                                                    Set {i + 1}: {parts.join(' × ')}
                                                </div>
                                            )
                                        })}
                                    </div>
                                ))}
                                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={(e) => { e.stopPropagation(); onDuplicate(w.id) }}
                                        style={{ flex: 1, fontSize: 'var(--font-sm)', minHeight: 40 }}
                                    >
                                        🔁 Ripeti
                                    </button>
                                    <button
                                        className="btn btn-ghost"
                                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(w.id) }}
                                        style={{ fontSize: 'var(--font-sm)', minHeight: 40, color: 'var(--danger)' }}
                                    >
                                        🗑
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )
            })}

            {/* Delete confirm */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-handle" />
                        <h3 style={{ marginBottom: 'var(--space-sm)' }}>Elimina allenamento?</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
                            Questa azione non può essere annullata.
                        </p>
                        <div className="confirm-actions">
                            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
                                Annulla
                            </button>
                            <button className="btn btn-danger" onClick={() => { onDelete(deleteConfirm); setDeleteConfirm(null) }}>
                                Elimina
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
