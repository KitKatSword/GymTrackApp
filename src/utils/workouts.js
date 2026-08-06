export function getExerciseSets(exercise) {
    return Array.isArray(exercise?.sets) ? exercise.sets : []
}

export function getCompletedSetCount(exercise, { includeWarmups = true } = {}) {
    return getExerciseSets(exercise).filter(set =>
        set.completed && (includeWarmups || !set.isWarmup)
    ).length
}

export function getCompletedWarmupSetCount(exercise) {
    return getExerciseSets(exercise).filter(set => set.completed && set.isWarmup).length
}

export function getCompletedWorkingSetCount(exercise) {
    return getCompletedSetCount(exercise, { includeWarmups: false })
}

export function getWorkoutCompletedSetCount(workout, options) {
    return (workout?.exercises || []).reduce((sum, exercise) => sum + getCompletedSetCount(exercise, options), 0)
}

export function getWorkoutCompletedWarmupSetCount(workout) {
    return (workout?.exercises || []).reduce((sum, exercise) => sum + getCompletedWarmupSetCount(exercise), 0)
}

export function getRoutineTotalSets(routine) {
    return (routine?.exercises || []).reduce((sum, exercise) => {
        if (exercise?.isEmom || exercise?.params?.includes('emom')) return sum

        const sets = getExerciseSets(exercise)
        const derivedSetsCount = exercise?.setsCount || sets.filter(set => !set.isWarmup).length || 0
        const warmupSetsCount = Math.max(
            0,
            Number(exercise?.warmupSetsCount) || sets.filter(set => set.isWarmup).length || 0,
        )
        return sum + Math.max(1, derivedSetsCount) + warmupSetsCount
    }, 0)
}

export function getWorkoutDuration(start, end) {
    if (!start || !end) return '--'

    const [startHour, startMin] = start.split(':').map(Number)
    const [endHour, endMin] = end.split(':').map(Number)
    if (![startHour, startMin, endHour, endMin].every(Number.isFinite)) return '--'
    if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23
        || startMin < 0 || startMin > 59 || endMin < 0 || endMin > 59) return '--'

    let mins = (endHour * 60 + endMin) - (startHour * 60 + startMin)
    if (mins < 0) mins += 24 * 60

    return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}min`
}

export function syncRoutineRestTargetsFromWorkout(workout, routines, updateRoutine) {
    if (!workout?.routineName || !Array.isArray(routines) || !updateRoutine) return

    const matchingRoutine = routines.find(routine => routine.id === workout.routineId)
        || routines.find(routine => routine.name === workout.routineName)
    if (!matchingRoutine) return

    const updatedExercises = matchingRoutine.exercises.map(routineExercise => {
        const routineExerciseId = routineExercise.exerciseId || routineExercise.sourceExerciseId
        const workoutExercise = workout.exercises.find(exercise => {
            const workoutExerciseId = exercise.sourceExerciseId || exercise.exerciseId
            return (routineExerciseId && workoutExerciseId && routineExerciseId === workoutExerciseId)
                || exercise.name === routineExercise.name
        })
        if (workoutExercise && workoutExercise.targetRest !== undefined && workoutExercise.targetRest !== null) {
            return { ...routineExercise, targetRest: workoutExercise.targetRest }
        }
        return routineExercise
    })

    updateRoutine(matchingRoutine.id, { exercises: updatedExercises })
}
