import { getCompletedSetCount } from './workouts'

export const HISTORY_DAY_SHORT = ['L', 'M', 'M', 'G', 'V', 'S', 'D']
export const HISTORY_MONTHS = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']

const HISTORY_MONTHS_SHORT = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']
const VIDEO_WORKOUT_COLOR = '#ef4444'

export function formatHistoryDate(dateString) {
    const date = new Date(`${dateString}T12:00:00`)
    const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
    return `${days[date.getDay()]} ${date.getDate()} ${HISTORY_MONTHS_SHORT[date.getMonth()]}`
}

export function buildHistoryCalendarDays(year, month) {
    const firstDay = new Date(year, month, 1)
    const startWeekday = (firstDay.getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []

    for (let index = 0; index < startWeekday; index += 1) {
        days.push(null)
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
        days.push({
            day,
            date: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        })
    }

    return days
}

export function getCalendarDayColor(workoutsForDay = []) {
    if (!workoutsForDay.length) {
        return 'var(--accent)'
    }

    const highlightedWorkout = workoutsForDay.find(workout => workout.routineColor || workout.isVideoWorkout) || workoutsForDay[0]
    return highlightedWorkout.routineColor || (highlightedWorkout.isVideoWorkout ? VIDEO_WORKOUT_COLOR : 'var(--text-muted)')
}

export function getWorkoutHistoryBadge(workout) {
    let totalSets = 0
    let totalEmom = 0

    ;(workout?.exercises || []).forEach(exercise => {
        if (exercise.isEmom) {
            if (exercise.emomCompleted) totalEmom += 1
            return
        }

        totalSets += getCompletedSetCount(exercise)
    })

    if (workout?.isVideoWorkout) return '📺 Video'
    if (totalSets === 0 && totalEmom > 0) return `${totalEmom} EMOM`
    if (totalEmom > 0) return `${totalSets} serie + ${totalEmom} EMOM`
    return `${totalSets} serie`
}
