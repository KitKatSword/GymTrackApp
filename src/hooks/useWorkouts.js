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
        return data ? JSON.parse(data) : []
    } catch {
        return []
    }
}

function saveWorkouts(workouts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts))
}

function getExerciseParams(exercise) {
    return exercise?.params?.length ? exercise.params : DEFAULT_PARAMS
}

function createEmptySet(params) {
    const set = { id: generateId(), completed: false }
    params.forEach(param => {
        set[param] = ''
    })
    return set
}

function hasTrackedValue(value) {
    return value !== undefined && value !== null && value !== ''
}

function findLastSetsForExercise(workouts, exerciseName, params) {
    const trackedParams = params?.length ? params : DEFAULT_PARAMS

    for (const w of workouts) {
        if (!w.endTime) continue
        const match = w.exercises.find(e => e.name === exerciseName && !e.isEmom && !(e.params || []).includes('emom'))
        if (match && Array.isArray(match.sets) && match.sets.length > 0) {
            const meaningfulSets = match.sets.filter(set =>
                set?.completed || trackedParams.some(param => hasTrackedValue(set?.[param]))
            )

            if (meaningfulSets.length === 0) continue

            return meaningfulSets.map(set => {
                const prefilled = { id: generateId(), completed: false }
                trackedParams.forEach(param => {
                    prefilled[param] = hasTrackedValue(set?.[param]) ? set[param] : ''
                })
                return prefilled
            })
        }
    }

    return null
}

function buildTrackedSets(params, preferredCount, previousSets) {
    const totalSets = Math.max(1, preferredCount || previousSets?.length || 0)
    return Array.from({ length: totalSets }, (_, index) => previousSets?.[index] || createEmptySet(params))
}

function createEmomExercise(exercise) {
    return {
        id: generateId(),
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
    const previousSets = findLastSetsForExercise(workouts, exercise.name, params)

    return {
        id: generateId(),
        name: exercise.name,
        emoji: exercise.emoji || '',
        category: exercise.category,
        params,
        isCustom: exercise.isCustom || false,
        image: exercise.image || null,
        targetRest: exercise.targetRest || DEFAULT_TARGET_REST,
        sets: buildTrackedSets(params, preferredSetCount, previousSets),
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
            routineName: routine.name,
            routineColor: routine.color || DEFAULT_ROUTINE_COLOR,
            exercises,
        }
        setWorkouts(prev => [workout, ...prev])
        return workout
    }, [workouts])

    // Log a completed Fixfit follow-along video as a workout entry
    const logVideoWorkout = useCallback((video) => {
        const now = new Date()
        const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
        const workout = {
            id: generateId(),
            date: toLocalDateString(now),
            startTime: timeStr,
            startTimestamp: now.getTime(),
            endTime: timeStr,
            isVideoWorkout: true,
            exercises: [{
                id: generateId(),
                name: video.title,
                emoji: '📺',
                category: video.cat || 'Video',
                params: ['duration'],
                isVideo: true,
                videoYt: video.yt,
                videoDuration: video.dur || '',
                videoKcal: video.kcal || 0,
                sets: [{
                    id: generateId(),
                    completed: true,
                    duration: video.dur || '',
                }],
            }],
        }
        setWorkouts(prev => [workout, ...prev])
        return workout
    }, [])

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

            return {
                ...w,
                startTime: startTimeOverride || w.startTime,
                endTime: endTimeOverride || new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
                ...(newRoutineName && { routineName: newRoutineName }),
                isPaused: false,
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
            : findLastSetsForExercise(workouts, exercise.name, params)?.length || 1
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
                    const newSet = { id: generateId(), completed: false }
                    params.forEach(p => { newSet[p] = '' })
                    return { ...e, sets: [...e.sets, newSet] }
                })
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
            isPaused: false,
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
            exercises: [],
        }
        setWorkouts(prev => [workout, ...prev])
        return workout
    }, [])

    const loadRoutineIntoWorkout = useCallback((workoutId, routine) => {
        const exercises = routine.exercises.map(rex => createExerciseFromTemplate(rex, workouts, rex.setsCount || 3))
        setWorkouts(prev => prev.map(w =>
            w.id === workoutId
                ? { ...w, exercises: [...w.exercises, ...exercises], routineName: routine.name, routineColor: routine.color || '#8b5cf6' }
                : w
        ))
    }, [workouts])

    const getTodayWorkout = useCallback(() => {
        const today = toLocalDateString()
        return workouts.find(w => w.date === today && !w.endTime)
    }, [workouts])

    const getStats = useCallback(() => {
        const today = toLocalDateString()
        const weekStr = getStartOfWeekDateString()

        const thisWeek = workouts.filter(w => w.date >= weekStr)
        const totalSets = workouts.reduce((sum, workout) => sum + getWorkoutCompletedSetCount(workout), 0)

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
        logVideoWorkout,
        finishWorkout,
        deleteWorkout,
        addExercise,
        removeExercise,
        addSet,
        removeSet,
        updateSet,
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
        getTodayWorkout,
        getStats,
    }
}
