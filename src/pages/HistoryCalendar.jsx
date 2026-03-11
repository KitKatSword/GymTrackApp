import { useEffect, useMemo, useRef, useState } from 'react'
import HistoryCalendarGrid from '../components/history/HistoryCalendarGrid'
import HistoryWorkoutCard from '../components/history/HistoryWorkoutCard'
import { toLocalDateString } from '../utils/date'
import { HISTORY_CALENDAR_COLORS } from '../constants/colors'
import { buildHistoryCalendarDays, formatHistoryDate, HISTORY_DAY_SHORT, HISTORY_MONTHS } from '../utils/history'

export default function HistoryCalendar({ workouts, onDuplicate, onDelete, onUpdateWorkoutColor, onStartWorkoutOnDate, hasActiveWorkout }) {
    const today = toLocalDateString()
    const [viewDate, setViewDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(today)
    const [expandedId, setExpandedId] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [colorPickerDay, setColorPickerDay] = useState(null)
    const pressTimer = useRef(null)

    const clearPress = () => {
        if (pressTimer.current) {
            clearTimeout(pressTimer.current)
            pressTimer.current = null
        }
    }

    const startPress = (dateString, hasWorkout) => {
        if (!hasWorkout) return

        clearPress()
        pressTimer.current = setTimeout(() => {
            setColorPickerDay(dateString)
            pressTimer.current = null
        }, 500)
    }

    useEffect(() => {
        return () => {
            if (pressTimer.current) {
                clearTimeout(pressTimer.current)
                pressTimer.current = null
            }
        }
    }, [])
    useEffect(() => setExpandedId(null), [selectedDate])

    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()

    const workoutsByDate = useMemo(() => {
        const map = {}

        workouts.forEach(workout => {
            if (!workout.endTime) return
            if (!map[workout.date]) map[workout.date] = []
            map[workout.date].push(workout)
        })

        return map
    }, [workouts])

    const calendarDays = useMemo(() => buildHistoryCalendarDays(year, month), [year, month])
    const selectedWorkouts = selectedDate ? (workoutsByDate[selectedDate] || []) : []
    const canAddWorkoutForSelectedDate = selectedDate && selectedDate <= today

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-title">Storico</div>
            </div>

            <div className="month-nav">
                <button
                    className="month-nav-btn"
                    onClick={() => setViewDate(new Date(year, month - 1, 1))}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
                <div className="month-nav-title">
                    {HISTORY_MONTHS[month]} {year}
                </div>
                <button
                    className="month-nav-btn"
                    onClick={() => setViewDate(new Date(year, month + 1, 1))}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </button>
            </div>

            <div className="calendar-weekdays">
                {HISTORY_DAY_SHORT.map((day, index) => (
                    <div key={index} className="calendar-weekday">{day}</div>
                ))}
            </div>

            <HistoryCalendarGrid
                calendarDays={calendarDays}
                workoutsByDate={workoutsByDate}
                today={today}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onStartPress={startPress}
                onClearPress={clearPress}
            />

            {selectedDate && (
                <div style={{ marginTop: 'var(--space-4)', animation: 'slideDown 0.15s ease' }}>
                    <div className="section-label" style={{ marginBottom: 12 }}>
                        Allenamenti del {formatHistoryDate(selectedDate)}
                    </div>

                    {selectedWorkouts.length === 0 ? (
                        <div className="empty-state" style={{ padding: 'var(--space-6) 0' }}>
                            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <div className="title">Nessun allenamento</div>
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                                Non hai completato allenamenti in questa data.
                            </p>
                            {canAddWorkoutForSelectedDate && onStartWorkoutOnDate && !hasActiveWorkout && (
                                <button
                                    className="btn btn-primary btn-sm"
                                    style={{ marginTop: 12 }}
                                    onClick={() => onStartWorkoutOnDate(selectedDate)}
                                >
                                    + Aggiungi allenamento per questa data
                                </button>
                            )}
                            {canAddWorkoutForSelectedDate && hasActiveWorkout && (
                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 8 }}>
                                    Termina l'allenamento in corso per aggiungere allenamenti passati.
                                </p>
                            )}
                        </div>
                    ) : (
                        selectedWorkouts.map(workout => (
                            <HistoryWorkoutCard
                                key={workout.id}
                                workout={workout}
                                expanded={expandedId === workout.id}
                                onToggle={() => setExpandedId(expandedId === workout.id ? null : workout.id)}
                                onDuplicate={() => onDuplicate(workout.id)}
                                onDelete={() => setDeleteConfirm(workout.id)}
                            />
                        ))
                    )}
                </div>
            )}

            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal" onClick={(event) => event.stopPropagation()}>
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

            {colorPickerDay && (
                <div className="modal-overlay" onClick={() => setColorPickerDay(null)}>
                    <div className="modal" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-handle" />
                        <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)', marginBottom: 16 }}>Cambia Colore Giorno</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 24 }}>
                            Scegli il colore per differenziare i tuoi allenamenti sul calendario.
                        </div>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
                            {HISTORY_CALENDAR_COLORS.map(color => (
                                <button
                                    key={color}
                                    onClick={() => {
                                        const workoutsOnDay = workoutsByDate[colorPickerDay] || []
                                        workoutsOnDay.forEach(workout => {
                                            if (onUpdateWorkoutColor) onUpdateWorkoutColor(workout.id, color)
                                        })
                                        setColorPickerDay(null)
                                    }}
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: '50%',
                                        background: color,
                                        border: '2px solid transparent',
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
