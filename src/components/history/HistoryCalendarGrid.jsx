import { getCalendarDayColor } from '../../utils/history'

export default function HistoryCalendarGrid({
    calendarDays,
    workoutsByDate,
    today,
    selectedDate,
    onSelectDate,
    onStartPress,
    onClearPress,
}) {
    return (
        <div className="calendar-grid">
            {calendarDays.map((day, index) => {
                if (!day) return <div key={`empty-${index}`} />

                const workoutsForDay = workoutsByDate[day.date] || []
                const hasWorkout = workoutsForDay.length > 0
                const isToday = day.date === today
                const isSelected = day.date === selectedDate
                const dayColor = getCalendarDayColor(workoutsForDay)

                return (
                    <button
                        key={day.date}
                        onMouseDown={() => onStartPress(day.date, hasWorkout)}
                        onMouseUp={onClearPress}
                        onMouseLeave={onClearPress}
                        onTouchStart={() => onStartPress(day.date, hasWorkout)}
                        onTouchEnd={onClearPress}
                        onClick={() => onSelectDate(day.date)}
                        className={`calendar-day-btn ${isToday ? 'today' : ''} ${hasWorkout ? 'has-workout' : ''} ${isSelected ? 'selected' : ''}`}
                        style={{ '--day-color': dayColor, color: isToday && !hasWorkout && !isSelected ? 'var(--accent-light)' : undefined }}
                    >
                        {(hasWorkout || isSelected) && (
                            <div className="calendar-day-circle" />
                        )}

                        <span style={{ position: 'relative', zIndex: 1, fontWeight: (hasWorkout || isSelected) ? 700 : 'inherit' }}>
                            {day.day}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}
