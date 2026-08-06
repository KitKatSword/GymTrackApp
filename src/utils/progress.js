import { getExerciseSets } from './workouts.js'

function toNumber(value) {
    if (value === '' || value === null || value === undefined) return null
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
}

export function getExerciseTrackingKey(exercise) {
    const normalizedName = String(exercise?.name || 'esercizio')
        .trim()
        .toLocaleLowerCase('it-IT')
        .replace(/[^a-z0-9à-ÿ]+/gi, '-')
        .replace(/^-+|-+$/g, '')

    if (normalizedName && normalizedName !== 'esercizio') return `name:${normalizedName}`

    const stableId = exercise?.sourceExerciseId || exercise?.exerciseId || exercise?.id
    return `id:${stableId || 'esercizio'}`
}

function getWorkoutSortValue(workout) {
    if (workout?.endTimestamp !== null && workout?.endTimestamp !== undefined
        && Number.isFinite(Number(workout.endTimestamp))) return Number(workout.endTimestamp)
    const fallback = Date.parse(`${workout?.date || ''}T${workout?.startTime || '00:00'}:00`)
    if (Number.isFinite(fallback)) return fallback
    return workout?.startTimestamp !== null && workout?.startTimestamp !== undefined
        && Number.isFinite(Number(workout.startTimestamp)) ? Number(workout.startTimestamp) : 0
}

export function summarizeExerciseSession(workout, exercise) {
    const sets = getExerciseSets(exercise).filter(set => set.completed && !set.isWarmup)
    const weightedSets = sets
        .map(set => ({ weight: toNumber(set.weight), reps: toNumber(set.reps) }))
        .filter(set => set.weight !== null || set.reps !== null)

    const topWeight = weightedSets.reduce((best, set) => Math.max(best, set.weight || 0), 0)
    const totalReps = sets.reduce((sum, set) => sum + (toNumber(set.reps) || 0), 0)
    const totalTime = sets.reduce((sum, set) => sum + (toNumber(set.time) || 0), 0)
    const totalVolume = weightedSets.reduce(
        (sum, set) => sum + (set.weight || 0) * (set.reps || 0),
        0,
    )
    const bestEstimated1RM = weightedSets.reduce((best, set) => {
        if (!set.weight || !set.reps) return best
        return Math.max(best, set.weight * (1 + set.reps / 30))
    }, 0)
    const rirValues = sets.map(set => toNumber(set.rir)).filter(value => value !== null)
    const averageRir = rirValues.length
        ? rirValues.reduce((sum, value) => sum + value, 0) / rirValues.length
        : null

    return {
        workoutId: workout.id,
        exerciseId: exercise.id || exercise.name,
        date: workout.date,
        startTime: workout.startTime,
        sortValue: getWorkoutSortValue(workout),
        setCount: sets.length,
        topWeight,
        totalReps,
        totalTime,
        totalVolume,
        bestEstimated1RM,
        averageRir,
    }
}

export function buildExerciseProgress(workouts = []) {
    const byExercise = new Map()

    workouts
        .filter(workout => workout?.endTime && Array.isArray(workout.exercises))
        .forEach(workout => {
            workout.exercises.forEach(exercise => {
                if (exercise?.isEmom || exercise?.isVideo) return

                const session = summarizeExerciseSession(workout, exercise)
                if (session.setCount === 0) return

                const key = getExerciseTrackingKey(exercise)
                if (!byExercise.has(key)) {
                    byExercise.set(key, {
                        key,
                        name: exercise.name,
                        category: exercise.category || '',
                        sessions: [],
                    })
                }
                byExercise.get(key).sessions.push(session)
            })
        })

    return Array.from(byExercise.values())
        .map(item => {
            const sessions = item.sessions.sort((a, b) => b.sortValue - a.sortValue)
            const best = sessions.reduce((result, session) => ({
                topWeight: Math.max(result.topWeight, session.topWeight),
                totalVolume: Math.max(result.totalVolume, session.totalVolume),
                bestEstimated1RM: Math.max(result.bestEstimated1RM, session.bestEstimated1RM),
                totalReps: Math.max(result.totalReps, session.totalReps),
                totalTime: Math.max(result.totalTime, session.totalTime),
            }), { topWeight: 0, totalVolume: 0, bestEstimated1RM: 0, totalReps: 0, totalTime: 0 })

            return {
                ...item,
                sessions,
                latest: sessions[0] || null,
                previous: sessions[1] || null,
                best,
            }
        })
        .sort((a, b) => (b.latest?.sortValue || 0) - (a.latest?.sortValue || 0))
}

export function getPrimaryProgressMetric(progressItem) {
    const sessions = progressItem?.sessions || []
    if (sessions.some(session => session.bestEstimated1RM > 0)) {
        return { key: 'bestEstimated1RM', label: 'e1RM', unit: 'kg' }
    }
    if (sessions.some(session => session.topWeight > 0)) {
        return { key: 'topWeight', label: 'Peso massimo', unit: 'kg' }
    }
    if (sessions.some(session => session.totalReps > 0)) {
        return { key: 'totalReps', label: 'Ripetizioni', unit: 'rep' }
    }
    return { key: 'totalTime', label: 'Tempo', unit: 's' }
}
