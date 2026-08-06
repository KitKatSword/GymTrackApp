import { useState, useEffect, useCallback } from 'react'
import { getStartOfWeekDateString, toLocalDateString } from '../utils/date'
import { getWorkoutCompletedSetCount } from '../utils/workouts'

const STORAGE_KEY = 'gymtrack_workouts'
const DEFAULT_PARAMS = ['weight', 'reps']
const DEFAULT_ROUTINE_COLOR = '#8b5cf6'
const DEFAULT_TARGET_REST = 90

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

function loadWorkouts() {
    try {
        const data = localStorage.getItem(STORAGE_KEY)
        const parsed = data ? JSON.parse(data) : []
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

function saveWorkouts(workouts) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts))
    } catch (error) {
        console.error('Impossibile salvare gli allenamenti', error)
    }
}

function getExerciseParams(exercise) {
    return exercise?.params?.length ? exercise.params : DEFAULT_PARAMS
}

function createEmptySet(params, isWarmup = false) {
    const set = { id: generateId(), completed: false, ...(isWarmup && { isWarmup: true }) }
    params.forEach(param => {
        set[param] = ''
    })
    return set
}

function hasTrackedValue(value) {
    return value !== undefined && value !== null && value !== ''
}

function getSourceExerciseId(exercise) {
    return exercise?.sourceExerciseId || exercise?.exerciseId || exercise?.id || null
}

function getWorkoutSortValue(workout) {
    if (workout?.endTimestamp !== null && workout?.endTimestamp !== undefined
        && Number.isFinite(Number(workout.endTimestamp))) return Number(workout.endTimestamp)
    const fallback = Date.parse(`${workout?.date || ''}T${workout?.startTime || '00:00'}:00`)
    if (Number.isFinite(fallback)) return fallback
    return workout?.startTimestamp !== null && workout?.startTimestamp !== undefined
        && Number.isFinite(Number(workout.startTimestamp)) ? Number(workout.startTimestamp) : 0
}

function isSameExercise(candidate, exercise) {
    const candidateSourceId = getSourceExerciseId(candidate)
    const sourceId = getSourceExerciseId(exercise)
    if (candidateSourceId && sourceId && candidateSourceId === sourceId) return true
    return candidate?.name === exercise?.name
}

function findLastSetsForExercise(workouts, exercise, params, isWarmup = false) {
    const trackedParams = params?.length ? params : DEFAULT_PARAMS
    const completedWorkouts = [...workouts]
        .filter(workout => workout?.endTime)
        .sort((a, b) => getWorkoutSortValue(b) - getWorkoutSortValue(a))

    for (const w of completedWorkouts) {
        const match = (w.exercises || []).find(e =>
            isSameExercise(e, exercise) && !e.isEmom && !(e.params || []).includes('emom')
        )
        if (match && Array.isArray(match.sets) && match.sets.length > 0) {
            const meaningfulSets = match.sets.filter(set =>
                Boolean(set?.isWarmup) === isWarmup
                && (set?.completed || trackedParams.some(param => hasTrackedValue(set?.[param])))
            )

            if (meaningfulSets.length === 0) continue

            return meaningfulSets.map(set => {
                const prefilled = {
                    id: generateId(),
                    completed: false,
                    ...(isWarmup && { isWarmup: true }),
                }
                trackedParams.forEach(param => {
                    prefilled[param] = hasTrackedValue(set?.[param]) ? set[param] : ''
                })
                return prefilled
            })
        }
    }

    return null
}

function buildTrackedSets(params, preferredCount, previousSets, isWarmup = false) {
    const fallbackCount = previousSets?.length || 0
    const requestedCount = preferredCount === undefined || preferredCount === null
        ? fallbackCount
        : Number(preferredCount)
    const totalSets = isWarmup
        ? Math.max(0, Number.isFinite(requestedCount) ? requestedCount : 0)
        : Math.max(1, Number.isFinite(requestedCount) ? requestedCount : 1)
    return Array.from(
        { length: totalSets },
        (_, index) => previousSets?.[index] || createEmptySet(params, isWarmup),
    )
}

function createEmomExercise(exercise) {
    return {
        id: generateId(),
        sourceExerciseId: getSourceExerciseId(exercise),
        name: exercise.name,
        emoji: exercise.emoji || '',
        category: exercise.category,
        params: ['emom'],
        isCustom: exercise.isCustom || false,
        isEmom: true,
        image: exercise.image || null,
        emomBlocks: exercise.emomBlocks || [{ minutes: 10, reps: 5 }],
        emomWeight: exercise.emomWeight || '',
        emomCompleted: false,
        emomStartedAt: null,
        emomPausedAt: null,
        emomPausedAcc: 0,
        sets: [],
    }
}

function createTrackedExercise(exercise, workouts, preferredSetCount) {
    const params = getExerciseParams(exercise)
    const previousSets = findLastSetsForExercise(workouts, exercise, params)
    const previousWarmupSets = findLastSetsForExercise(workouts, exercise, params, true)
    const preferredWarmupCount = exercise.warmupSetsCount === undefined
        ? previousWarmupSets?.length
        : exercise.warmupSetsCount

    return {
        id: generateId(),
        sourceExerciseId: getSourceExerciseId(exercise),
        name: exercise.name,
        emoji: exercise.emoji || '',
        category: exercise.category,
        params,
        isCustom: exercise.isCustom || false,
        image: exercise.image || null,
        targetRest: exercise.targetRest ?? DEFAULT_TARGET_REST,
        sets: [
            ...buildTrackedSets(params, preferredWarmupCount, previousWarmupSets, true),
            ...buildTrackedSets(params, preferredSetCount, previousSets),
        ],
    }
}

function createExerciseFromTemplate(exercise, workouts, preferredSetCount) {
    const params = getExerciseParams(exercise)
    const isEmom = exercise.isEmom || params.includes('emom')

    if (isEmom) {
        return createEmomExercise(exercise)
    }

    return createTrackedExercise(exercise, workouts, preferredSetCount)
}

export default function useWorkouts() {
    const [workouts, setWorkouts] = useState(loadWorkouts)

    useEffect(() => {
        saveWorkouts(workouts)
    }, [workouts])

    const createWorkout = useCallback(() => {
        const now = new Date()
        const workout = {
            id: generateId(),
            date: toLocalDateString(now),
            startTime: now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
            startTimestamp: now.getTime(),
            endTime: null,
            isPastLog: false,
            exercises: [],
        }
        setWorkouts(prev => [workout, ...prev])
        return workout
    }, [])

    const createWorkoutFromRoutine = useCallback((routine) => {
        const now = new Date()
        const exercises = routine.exercises.map(rex => createExerciseFromTemplate(rex, workouts, rex.setsCount || 3))
        const workout = {
            id: generateId(),
            date: toLocalDateString(now),
            startTime: now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
            startTimestamp: now.getTime(),
            endTime: null,
            isPastLog: false,
            routineId: routine.id,
            routineName: routine.name,
            routineColor: routine.color || DEFAULT_ROUTINE_COLOR,
            exercises,
        }
        setWorkouts(prev => [workout, ...prev])
        return workout
    }, [workouts])

    const finishWorkout = useCallback((workoutId, startTimeOverride, endTimeOverride, autoCompleteAll = false, newRoutineName = null) => {
        setWorkouts(prev => prev.map(w => {
            if (w.id !== workoutId) return w;

            let updatedExercises = w.exercises;
            if (autoCompleteAll) {
                updatedExercises = w.exercises.map(ex => {
                    if (ex.isEmom) {
                        return { ...ex, emomCompleted: true };
                    }
                    return {
                        ...ex,
                        sets: ex.sets.map(s => ({ ...s, completed: true }))
                    };
                });
            }

            const startTime = startTimeOverride || w.startTime
            const endTime = endTimeOverride || new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
            let startTimestamp = w.startTimestamp
            let endTimestamp = Date.now()
            if (startTimeOverride || endTimeOverride || w.isPastLog) {
                startTimestamp = new Date(`${w.date}T${startTime}:00`).getTime()
                endTimestamp = new Date(`${w.date}T${endTime}:00`).getTime()
                if (endTimestamp < startTimestamp) endTimestamp += 24 * 60 * 60 * 1000
            }

            return {
                ...w,
                startTime,
                startTimestamp,
                endTime,
                endTimestamp,
                ...(newRoutineName && { routineName: newRoutineName }),
                isPaused: false,
                isPastLog: false,
                pausedAt: null,
                exercises: updatedExercises
                    .map(ex => ex.isEmom
                        ? {
                            ...ex,
                            emomStartedAt: null,
                            emomPausedAt: null,
                            emomPausedAcc: 0,
                        }
                        : ex
                    )
            };
        }))
    }, [])

    const deleteWorkout = useCallback((workoutId) => {
        setWorkouts(prev => prev.filter(w => w.id !== workoutId))
    }, [])

    const addExercise = useCallback((workoutId, exercise) => {
        const params = getExerciseParams(exercise)
        const preferredSetCount = params.includes('emom')
            ? undefined
            : findLastSetsForExercise(workouts, exercise, params)?.length || 1
        const newExercise = createExerciseFromTemplate(exercise, workouts, preferredSetCount)

        setWorkouts(prev => prev.map(w =>
            w.id === workoutId
                ? { ...w, exercises: [...w.exercises, newExercise] }
                : w
        ))
    }, [workouts])

    const removeExercise = useCallback((workoutId, exerciseId) => {
        setWorkouts(prev => prev.map(w =>
            w.id === workoutId
                ? { ...w, exercises: w.exercises.filter(e => e.id !== exerciseId) }
                : w
        ))
    }, [])

    const addSet = useCallback((workoutId, exerciseId) => {
        setWorkouts(prev => prev.map(w => {
            if (w.id !== workoutId) return w
            return {
                ...w,
                exercises: w.exercises.map(e => {
                    if (e.id !== exerciseId) return e
                    const params = e.params || ['weight', 'reps']
                    const newSet = createEmptySet(params)
                    return { ...e, sets: [...e.sets, newSet] }
                })
            }
        }))
    }, [])

    const addWarmupSet = useCallback((workoutId, exerciseId) => {
        setWorkouts(prev => prev.map(w => {
            if (w.id !== workoutId) return w
            return {
                ...w,
                exercises: w.exercises.map(e => {
                    if (e.id !== exerciseId) return e
                    const params = e.params || DEFAULT_PARAMS
                    const sets = Array.isArray(e.sets) ? e.sets : []
                    const firstWorkingSet = sets.findIndex(set => !set.isWarmup)
                    const insertAt = firstWorkingSet === -1 ? sets.length : firstWorkingSet
                    const nextSets = [...sets]
                    nextSets.splice(insertAt, 0, createEmptySet(params, true))
                    return { ...e, sets: nextSets }
                }),
            }
        }))
    }, [])

    const removeSet = useCallback((workoutId, exerciseId, setId) => {
        setWorkouts(prev => prev.map(w =>
            w.id === workoutId
                ? {
                    ...w,
                    exercises: w.exercises.map(e =>
                        e.id === exerciseId
                            ? { ...e, sets: e.sets.filter(s => s.id !== setId) }
                            : e
                    )
                }
                : w
        ))
    }, [])

    const updateSet = useCallback((workoutId, exerciseId, setId, field, value) => {
        setWorkouts(prev => prev.map(w =>
            w.id === workoutId
                ? {
                    ...w,
                    exercises: w.exercises.map(e =>
                        e.id === exerciseId
                            ? {
                                ...e, sets: e.sets.map(s =>
                                    s.id === setId ? { ...s, [field]: value } : s
                                )
                            }
                            : e
                    )
                }
                : w
        ))
    }, [])

    const updateExerciseParams = useCallback((workoutId, exerciseId, params) => {
        const normalizedParams = [...new Set(params)].filter(param => param !== 'emom')
        if (normalizedParams.length === 0) return

        setWorkouts(prev => prev.map(w =>
            w.id === workoutId
                ? {
                    ...w,
                    exercises: w.exercises.map(e => {
                        if (e.id !== exerciseId || e.isEmom) return e
                        return {
                            ...e,
                            params: normalizedParams,
                            sets: (e.sets || []).map(set => {
                                const nextSet = { ...set }
                                normalizedParams.forEach(param => {
                                    if (!hasTrackedValue(nextSet[param])) nextSet[param] = ''
                                })
                                return nextSet
                            }),
                        }
                    }),
                }
                : w
        ))
    }, [])

    const toggleSetComplete = useCallback((workoutId, exerciseId, setId) => {
        setWorkouts(prev => prev.map(w =>
            w.id === workoutId
                ? {
                    ...w,
                    exercises: w.exercises.map(e =>
                        e.id === exerciseId
                            ? {
                                ...e, sets: e.sets.map(s =>
                                    s.id === setId ? { ...s, completed: !s.completed } : s
                                )
                            }
                            : e
                    )
                }
                : w
        ))
    }, [])

    const duplicateWorkout = useCallback((workoutId) => {
        const original = workouts.find(w => w.id === workoutId)
        if (!original) return null
        const now = new Date()
        const newWorkout = {
            ...original,
            id: generateId(),
            date: toLocalDateString(now),
            startTime: now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
            startTimestamp: now.getTime(),
            endTime: null,
            endTimestamp: null,
            isPaused: false,
            isPastLog: false,
            pausedAt: null,
            pausedAcc: 0,
            exercises: original.exercises.map(e => ({
                ...e,
                emomCompleted: e.isEmom ? false : e.emomCompleted,
                emomStartedAt: e.isEmom ? null : e.emomStartedAt,
                emomPausedAt: e.isEmom ? null : e.emomPausedAt,
                emomPausedAcc: e.isEmom ? 0 : e.emomPausedAcc,
                id: generateId(),
                sets: e.sets.map(s => ({ ...s, id: generateId(), completed: false })),
            })),
        }
        setWorkouts(prev => [newWorkout, ...prev])
        return newWorkout
    }, [workouts])

    const updateWorkoutNotes = useCallback((workoutId, notes) => {
        setWorkouts(prev => prev.map(w =>
            w.id === workoutId ? { ...w, notes } : w
        ))
    }, [])

    const updateExerciseNotes = useCallback((workoutId, exerciseId, notes) => {
        setWorkouts(prev => prev.map(w =>
            w.id === workoutId
                ? {
                    ...w,
                    exercises: w.exercises.map(e =>
                        e.id === exerciseId ? { ...e, notes } : e
                    )
                }
                : w
        ))
    }, [])

    const updateExerciseRest = useCallback((workoutId, exerciseId, targetRest) => {
        setWorkouts(prev => prev.map(w =>
            w.id === workoutId
                ? {
                    ...w,
                    exercises: w.exercises.map(e =>
                        e.id === exerciseId ? { ...e, targetRest } : e
                    )
                }
                : w
        ))
    }, [])

    const updateWorkoutColor = useCallback((workoutId, color) => {
        setWorkouts(prev => prev.map(w =>
            w.id === workoutId ? { ...w, routineColor: color } : w
        ))
    }, [])

    const updateWorkoutTimerState = useCallback((workoutId, timerState) => {
        setWorkouts(prev => prev.map(w =>
            w.id === workoutId ? { ...w, ...timerState } : w
        ))
    }, [])

    const updateEmomExercise = useCallback((workoutId, exerciseId, emomData) => {
        setWorkouts(prev => prev.map(w =>
            w.id === workoutId
                ? {
                    ...w,
                    exercises: w.exercises.map(e =>
                        e.id === exerciseId ? { ...e, ...emomData } : e
                    )
                }
                : w
        ))
    }, [])

    const createWorkoutOnDate = useCallback((dateStr) => {
        const workout = {
            id: generateId(),
            date: dateStr,
            startTime: '09:00',
            startTimestamp: new Date(dateStr + 'T09:00:00').getTime(),
            endTime: null,
            isPastLog: true,
            exercises: [],
        }
        setWorkouts(prev => [workout, ...prev])
        return workout
    }, [])

    const loadRoutineIntoWorkout = useCallback((workoutId, routine) => {
        const exercises = routine.exercises.map(rex => createExerciseFromTemplate(rex, workouts, rex.setsCount || 3))
        setWorkouts(prev => prev.map(w =>
            w.id === workoutId
                ? {
                    ...w,
                    exercises: [...w.exercises, ...exercises],
                    routineId: routine.id,
                    routineName: routine.name,
                    routineColor: routine.color || DEFAULT_ROUTINE_COLOR,
                }
                : w
        ))
    }, [workouts])

    const getPendingWorkout = useCallback(() => {
        return [...workouts]
            .filter(workout => !workout.endTime)
            .sort((a, b) => getWorkoutSortValue(b) - getWorkoutSortValue(a))[0] || null
    }, [workouts])

    const getStats = useCallback(() => {
        const today = toLocalDateString()
        const weekStr = getStartOfWeekDateString()

        const completedWorkouts = workouts.filter(w => w.endTime)
        const thisWeek = completedWorkouts.filter(w => w.date >= weekStr && w.date <= today)
        const totalSets = completedWorkouts.reduce(
            (sum, workout) => sum + getWorkoutCompletedSetCount(workout, { includeWarmups: false }),
            0,
        )

        // Streak calculation
        let streak = 0
        const dates = [...new Set(workouts.filter(w => w.endTime).map(w => w.date))].sort().reverse()
        if (dates.length > 0) {
            const checkDate = new Date()
            checkDate.setHours(0, 0, 0, 0)
            for (let i = 0; i < 365; i++) {
                const dateStr = toLocalDateString(checkDate)
                if (dates.includes(dateStr)) {
                    streak++
                    checkDate.setDate(checkDate.getDate() - 1)
                } else if (i === 0) {
                    // Today hasn't been worked out yet, check from yesterday
                    checkDate.setDate(checkDate.getDate() - 1)
                } else {
                    break
                }
            }
        }

        return {
            totalWorkouts: workouts.filter(w => w.endTime).length,
            thisWeekCount: thisWeek.length,
            totalSets,
            streak,
        }
    }, [workouts])

    return {
        workouts,
        createWorkout,
        createWorkoutFromRoutine,
        finishWorkout,
        deleteWorkout,
        addExercise,
        removeExercise,
        addSet,
        addWarmupSet,
        removeSet,
        updateSet,
        updateExerciseParams,
        toggleSetComplete,
        duplicateWorkout,
        updateWorkoutNotes,
        updateExerciseNotes,
        updateExerciseRest,
        updateWorkoutColor,
        updateWorkoutTimerState,
        updateEmomExercise,
        createWorkoutOnDate,
        loadRoutineIntoWorkout,
        getPendingWorkout,
        getStats,
    }
}
