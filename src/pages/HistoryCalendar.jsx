import { useState, useMemo } from 'react'

const DAY_SHORT = ['L', 'M', 'M', 'G', 'V', 'S', 'D']
const MONTHS = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
const MONTHS_SHORT = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

function hexToRgba(hex, alpha) {
    if (!hex || !hex.startsWith('#')) return `rgba(139, 92, 246, ${alpha})`; // Fallback to purple
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatDate(ds) {
    const d = new Date(ds + 'T12:00:00')
    const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
    return `${days[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}

function getDuration(start, end) {
    if (!start || !end) return '--'
    const [sh, sm] = start.split(':').map(Number)
    const [eh, em] = end.split(':').map(Number)
    const mins = (eh * 60 + em) - (sh * 60 + sm)
    return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}min`
}

function ParamParts({ ex }) {
    if (ex.isVideo) {
        return (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                📺 Follow Along{ex.videoDuration ? ` · ${ex.videoDuration}` : ''}{ex.videoKcal > 0 ? ` · 🔥 ${ex.videoKcal} kcal` : ''}
            </span>
        )
    }
    const params = ex.params || ['weight', 'reps']
    return ex.sets.filter(s => s.completed).map((s, i) => {
        const parts = params.map(p => {
            if (p === 'weight') return `${s.weight || 0} kg`
            if (p === 'reps') return `${s.reps || 0} reps`
            if (p === 'time') return `${s.time || 0}s`
            return `${s[p] || 0}`
        })
        return (
            <span key={s.id} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                Set {i + 1}: {parts.join(' × ')}
            </span>
        )
    })
}

export default function HistoryCalendar({ workouts, onDuplicate, onDelete }) {
    const today = new Date().toISOString().split('T')[0]
    const [viewDate, setViewDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(today)
    const [expandedId, setExpandedId] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()

    const completedWorkouts = workouts.filter(w => w.endTime)

    const workoutsByDate = useMemo(() => {
        const map = {}
        completedWorkouts.forEach(w => {
            if (!map[w.date]) map[w.date] = []
            map[w.date].push(w)
        })
        return map
    }, [completedWorkouts])

    const calendarDays = useMemo(() => {
        const firstDay = new Date(year, month, 1)
        const startWeekday = (firstDay.getDay() + 6) % 7
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const days = []
        for (let i = 0; i < startWeekday; i++) days.push(null)
        for (let d = 1; d <= daysInMonth; d++) {
            const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
            days.push({ day: d, date: ds })
        }
        return days
    }, [year, month])

    const selectedWorkouts = selectedDate ? (workoutsByDate[selectedDate] || []) : []

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-title">Storico</div>
            </div>

            {/* Month nav */}
            <div className="month-nav">
                <button
                    className="month-nav-btn"
                    onClick={() => setViewDate(new Date(year, month - 1, 1))}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <div className="month-nav-title">
                    {MONTHS[month]} {year}
                </div>
                <button
                    className="month-nav-btn"
                    onClick={() => setViewDate(new Date(year, month + 1, 1))}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
            </div>

            {/* Weekday labels */}
            <div className="calendar-weekdays">
                {DAY_SHORT.map((d, i) => (
                    <div key={i} className="calendar-weekday">{d}</div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="calendar-grid">
                {calendarDays.map((day, i) => {
                    if (!day) return <div key={`e${i}`} />
                    const workoutsForDay = workoutsByDate[day.date] || []
                    const hasWorkout = workoutsForDay.length > 0
                    const isToday = day.date === today
                    const isSelected = day.date === selectedDate

                    return (
                        <button
                            key={day.date}
                            onClick={() => setSelectedDate(day.date)}
                            className={`calendar-day-btn ${isToday ? 'today' : ''} ${hasWorkout ? 'has-workout' : ''}`}
                            style={{ color: (hasWorkout || isSelected) ? 'white' : 'var(--text-primary)' }}
                        >
                            {/* Background Circle */}
                            {(hasWorkout || isSelected) && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: '80%',
                                        aspectRatio: '1',
                                        borderRadius: '50%',
                                        backgroundColor: hasWorkout
                                            ? ((workoutsForDay.find(w => w.routineColor || w.isVideoWorkout) || workoutsForDay[0])?.routineColor || ((workoutsForDay.find(w => w.routineColor || w.isVideoWorkout) || workoutsForDay[0]).isVideoWorkout ? '#ef4444' : 'var(--text-muted)'))
                                            : 'var(--accent)',
                                        boxShadow: isSelected
                                            ? `0 0 12px ${hasWorkout ? ((workoutsForDay.find(w => w.routineColor || w.isVideoWorkout) || workoutsForDay[0])?.routineColor || 'var(--text-muted)') : 'var(--accent)'}`
                                            : 'none',
                                        zIndex: 0
                                    }}
                                />
                            )}

                            {/* Selected Indicator Ring */}
                            {isSelected && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: '100%',
                                        aspectRatio: '1',
                                        borderRadius: '50%',
                                        border: '1.5px solid var(--text-primary)',
                                        opacity: 0.5,
                                        zIndex: 0
                                    }}
                                />
                            )}

                            {/* Day Number */}
                            <span style={{ position: 'relative', zIndex: 1, fontWeight: (hasWorkout || isSelected) ? 700 : 'inherit' }}>
                                {day.day}
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* Selected date workouts */}
            {selectedDate && (
                <div style={{ marginTop: 'var(--space-4)', animation: 'slideDown 0.15s ease' }}>
                    <div className="section-label" style={{ marginBottom: 12 }}>
                        Allenamenti del {formatDate(selectedDate)}
                    </div>

                    {selectedWorkouts.length === 0 ? (
                        <div className="empty-state" style={{ padding: 'var(--space-6) 0' }}>
                            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <div className="title">Nessun allenamento</div>
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Non hai completato allenamenti in questa data.</p>
                        </div>
                    ) : (
                        selectedWorkouts.map(w =>
                            <WorkoutCard
                                key={w.id}
                                w={w}
                                expandedId={expandedId}
                                setExpandedId={setExpandedId}
                                setDeleteConfirm={setDeleteConfirm}
                                onDuplicate={onDuplicate}
                            />
                        )
                    )}
                </div>
            )}

            {/* Delete confirm */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-handle" />
                        <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)', marginBottom: 8 }}>Elimina allenamento?</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>Questa azione non può essere annullata.</div>
                        <div className="confirm-actions">
                            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Annulla</button>
                            <button className="btn btn-danger" onClick={() => { onDelete(deleteConfirm); setDeleteConfirm(null) }}>Elimina</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function WorkoutCard({ w, expandedId, setExpandedId, setDeleteConfirm, onDuplicate }) {
    const isExpanded = expandedId === w.id
    const totalSets = w.exercises.reduce((s, e) => s + e.sets.filter(st => st.completed).length, 0)

    return (
        <div
            className="history-card"
            onClick={() => setExpandedId(isExpanded ? null : w.id)}
            style={{
                marginBottom: 'var(--space-2)',
                borderLeft: `5px solid ${w.routineColor || (w.isVideoWorkout ? '#ef4444' : 'var(--border)')}`
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div className="history-date">{formatDate(w.date)}</div>
                    <div className="history-meta">
                        <span>{w.startTime} – {w.endTime}</span>
                        <span>{getDuration(w.startTime, w.endTime)}</span>
                    </div>
                </div>
                <span className="history-sets-badge">
                    {w.isVideoWorkout ? '📺 Video' : `${totalSets} serie`}
                </span>
            </div>

            <div className="history-exercises">
                {w.exercises.map(ex => (
                    <span key={ex.id} className="history-tag">{ex.name}</span>
                ))}
            </div>

            {isExpanded && (
                <div className="history-expanded">
                    {w.notes && (
                        <div style={{ marginBottom: 12, padding: '8px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
                            <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-secondary)' }}>Note Allenamento:</div>
                            <div style={{ color: 'var(--text-primary)', fontStyle: 'italic' }}>{w.notes}</div>
                        </div>
                    )}
                    {w.exercises.map(ex => (
                        <div key={ex.id} style={{ marginBottom: 10 }}>
                            <div className="history-exercise-name">{ex.name}</div>
                            {ex.notes && (
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 4, fontStyle: 'italic' }}>
                                    Nota: {ex.notes}
                                </div>
                            )}
                            <div className="history-exercise-sets">
                                <ParamParts ex={ex} />
                            </div>
                        </div>
                    ))}
                    <div className="history-actions">
                        <button
                            className="btn btn-secondary btn-sm"
                            style={{ flex: 1 }}
                            onClick={(e) => { e.stopPropagation(); onDuplicate(w.id) }}
                        >
                            Ripeti
                        </button>
                        <button
                            className="btn btn-sm"
                            style={{ color: 'var(--danger)', background: 'var(--danger-bg)', border: '1px solid var(--danger-bg)' }}
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm(w.id) }}
                        >
                            Elimina
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
