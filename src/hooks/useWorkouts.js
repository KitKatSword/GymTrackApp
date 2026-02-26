import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'gymtrack_workouts'

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

export default function useWorkouts() {
    const [workouts, setWorkouts] = useState(loadWorkouts)

    useEffect(() => {
        saveWorkouts(workouts)
    }, [workouts])

    const createWorkout = useCallback(() => {
        const now = new Date()
        const workout = {
            id: generateId(),
            date: now.toISOString().split('T')[0],
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
        const exercises = routine.exercises.map(rex => {
            const params = rex.params || ['weight', 'reps']
            const sets = Array.from({ length: rex.setsCount || 3 }, () => {
                const set = { id: generateId(), completed: false }
                params.forEach(p => { set[p] = '' })
                return set
            })
            return {
                id: generateId(),
                name: rex.name,
                emoji: rex.emoji || '',
                category: rex.category,
                params,
                isCustom: rex.isCustom || false,
                image: rex.image || null,
                targetRest: rex.targetRest || 90,
                sets,
            }
        })
        const workout = {
            id: generateId(),
            date: now.toISOString().split('T')[0],
            startTime: now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
            startTimestamp: now.getTime(),
            endTime: null,
            routineName: routine.name,
            routineColor: routine.color || '#8b5cf6',
            exercises,
        }
        setWorkouts(prev => [workout, ...prev])
        return workout
    }, [])

    // Log a completed Fixfit follow-along video as a workout entry
    const logVideoWorkout = useCallback((video) => {
        const now = new Date()
        const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
        const workout = {
            id: generateId(),
            date: now.toISOString().split('T')[0],
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

    const finishWorkout = useCallback((workoutId) => {
        setWorkouts(prev => prev.map(w =>
            w.id === workoutId
                ? { ...w, endTime: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) }
                : w
        ))
    }, [])

    const deleteWorkout = useCallback((workoutId) => {
        setWorkouts(prev => prev.filter(w => w.id !== workoutId))
    }, [])

    const addExercise = useCallback((workoutId, exercise) => {
        const params = exercise.params || ['weight', 'reps']
        const initialSet = { id: generateId(), completed: false }
        params.forEach(p => { initialSet[p] = '' })
        const newExercise = {
            id: generateId(),
            name: exercise.name,
            emoji: exercise.emoji,
            category: exercise.category,
            params: params,
            isCustom: exercise.isCustom || false,
            targetRest: exercise.targetRest || 90,
            sets: [initialSet],
        }
        setWorkouts(prev => prev.map(w =>
            w.id === workoutId
                ? { ...w, exercises: [...w.exercises, newExercise] }
                : w
        ))
    }, [])

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
            date: now.toISOString().split('T')[0],
            startTime: now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
            startTimestamp: now.getTime(),
            endTime: null,
            exercises: original.exercises.map(e => ({
                ...e,
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

    const getTodayWorkout = useCallback(() => {
        const today = new Date().toISOString().split('T')[0]
        return workouts.find(w => w.date === today && !w.endTime)
    }, [workouts])

    const getStats = useCallback(() => {
        const today = new Date().toISOString().split('T')[0]
        const thisWeekStart = new Date()
        thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay() + 1)
        const weekStr = thisWeekStart.toISOString().split('T')[0]

        const thisWeek = workouts.filter(w => w.date >= weekStr)
        const totalSets = workouts.reduce((sum, w) =>
            sum + w.exercises.reduce((eSum, e) =>
                eSum + e.sets.filter(s => s.completed).length, 0
            ), 0
        )

        // Streak calculation
        let streak = 0
        const dates = [...new Set(workouts.filter(w => w.endTime).map(w => w.date))].sort().reverse()
        if (dates.length > 0) {
            const checkDate = new Date()
            for (let i = 0; i < 365; i++) {
                const dateStr = checkDate.toISOString().split('T')[0]
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
        getTodayWorkout,
        getStats,
    }
}
