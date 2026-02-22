import { useState, useMemo } from 'react'

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
const MONTH_NAMES = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']

export default function Calendar({ workouts }) {
    const [viewDate, setViewDate] = useState(new Date())

    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()

    // Get workout dates set for quick lookup
    const workoutDates = useMemo(() => {
        const dates = {}
        workouts.filter(w => w.endTime).forEach(w => {
            if (!dates[w.date]) {
                dates[w.date] = { count: 0, exercises: 0, sets: 0 }
            }
            dates[w.date].count++
            dates[w.date].exercises += w.exercises.length
            dates[w.date].sets += w.exercises.reduce((s, e) => s + e.sets.filter(st => st.completed).length, 0)
        })
        return dates
    }, [workouts])

    // Build calendar grid
    const calendarDays = useMemo(() => {
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const startWeekday = (firstDay.getDay() + 6) % 7 // Monday = 0
        const daysInMonth = lastDay.getDate()

        const days = []
        // Empty slots for days before the 1st
        for (let i = 0; i < startWeekday; i++) {
            days.push(null)
        }
        // Actual days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
            days.push({ day: d, date: dateStr, workout: workoutDates[dateStr] || null })
        }
        return days
    }, [year, month, workoutDates])

    const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
    const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

    const today = new Date().toISOString().split('T')[0]

    // Count total and this month stats
    const monthWorkouts = useMemo(() => {
        const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
        return Object.keys(workoutDates).filter(d => d.startsWith(prefix)).length
    }, [workoutDates, year, month])

    const [selectedDate, setSelectedDate] = useState(null)

    const selectedWorkouts = useMemo(() => {
        if (!selectedDate) return []
        return workouts.filter(w => w.date === selectedDate && w.endTime)
    }, [selectedDate, workouts])

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">Calendario 📅</h1>
            </div>

            {/* Month navigation */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 'var(--space-lg)',
            }}>
                <button className="btn btn-icon btn-ghost" onClick={prevMonth} style={{ fontSize: '1.2rem' }}>
                    ←
                </button>
                <div style={{ fontWeight: 700, fontSize: 'var(--font-lg)' }}>
                    {MONTH_NAMES[month]} {year}
                </div>
                <button className="btn btn-icon btn-ghost" onClick={nextMonth} style={{ fontSize: '1.2rem' }}>
                    →
                </button>
            </div>

            {/* Weekday headers */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2,
                marginBottom: 'var(--space-xs)',
            }}>
                {DAY_NAMES.map(d => (
                    <div key={d} style={{
                        textAlign: 'center', fontSize: 'var(--font-xs)',
                        color: 'var(--text-muted)', fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                        padding: 'var(--space-xs)',
                    }}>
                        {d}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3,
                marginBottom: 'var(--space-lg)',
            }}>
                {calendarDays.map((day, idx) => {
                    if (!day) {
                        return <div key={`empty-${idx}`} />
                    }
                    const isToday = day.date === today
                    const hasWorkout = !!day.workout
                    const isSelected = day.date === selectedDate

                    return (
                        <button
                            key={day.date}
                            onClick={() => setSelectedDate(isSelected ? null : day.date)}
                            style={{
                                position: 'relative',
                                aspectRatio: '1',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 'var(--radius-md)',
                                border: isToday ? '2px solid var(--accent)' : isSelected ? '2px solid var(--accent-cyan)' : '1px solid transparent',
                                background: hasWorkout
                                    ? isSelected ? 'rgba(124,58,237,0.35)' : 'rgba(124,58,237,0.15)'
                                    : isSelected ? 'rgba(6,182,212,0.1)' : 'transparent',
                                cursor: 'pointer',
                                padding: 0,
                                transition: 'all 150ms ease',
                                color: 'var(--text-primary)',
                                fontFamily: 'inherit',
                                fontSize: 'var(--font-sm)',
                                fontWeight: isToday ? 700 : hasWorkout ? 600 : 400,
                            }}
                        >
                            <span>{day.day}</span>
                            {hasWorkout && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: 4,
                                    width: 6, height: 6,
                                    borderRadius: '50%',
                                    background: 'var(--accent)',
                                    boxShadow: '0 0 6px var(--accent-glow)',
                                }} />
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Month summary */}
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                    <div>
                        <div className="stat-value">{monthWorkouts}</div>
                        <div className="stat-label">Giorni questo mese</div>
                    </div>
                    <div>
                        <div className="stat-value">{Object.keys(workoutDates).length}</div>
                        <div className="stat-label">Giorni totali</div>
                    </div>
                </div>
            </div>

            {/* Selected date details */}
            {selectedDate && (
                <div style={{ animation: 'slideUp 0.2s ease' }}>
                    <div style={{
                        fontWeight: 700, marginBottom: 'var(--space-md)',
                        fontSize: 'var(--font-md)',
                    }}>
                        📋 {formatDisplayDate(selectedDate)}
                    </div>
                    {selectedWorkouts.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            Nessun allenamento completato
                        </div>
                    ) : (
                        selectedWorkouts.map(w => (
                            <div key={w.id} className="card" style={{ marginBottom: 'var(--space-sm)' }}>
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    marginBottom: 'var(--space-sm)',
                                }}>
                                    <span style={{ fontWeight: 600 }}>
                                        🕐 {w.startTime} - {w.endTime}
                                    </span>
                                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--accent-light)' }}>
                                        {w.exercises.reduce((s, e) => s + e.sets.filter(st => st.completed).length, 0)} serie
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
                                    {w.exercises.map(ex => (
                                        <span key={ex.id} className="history-tag">
                                            {ex.emoji} {ex.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}

function formatDisplayDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00')
    const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']
    return `${days[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`
}
