export function getExerciseSets(exercise) {
    return Array.isArray(exercise?.sets) ? exercise.sets : []
}

export function getCompletedSetCount(exercise) {
    return getExerciseSets(exercise).filter(set => set.completed).length
}

export function getWorkoutCompletedSetCount(workout) {
    return (workout?.exercises || []).reduce((sum, exercise) => sum + getCompletedSetCount(exercise), 0)
}

export function getRoutineTotalSets(routine) {
    return (routine?.exercises || []).reduce((sum, exercise) => {
        const derivedSetsCount = exercise?.setsCount || getExerciseSets(exercise).length || 0
        return sum + Math.max(1, derivedSetsCount)
    }, 0)
}

export function getWorkoutDuration(start, end) {
    if (!start || !end) return '--'

    const [startHour, startMin] = start.split(':').map(Number)
    const [endHour, endMin] = end.split(':').map(Number)
    const mins = (endHour * 60 + endMin) - (startHour * 60 + startMin)

    return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}min`
}

export function syncRoutineRestTargetsFromWorkout(workout, routines, updateRoutine) {
    if (!workout?.routineName || !Array.isArray(routines) || !updateRoutine) return

    const matchingRoutine = routines.find(routine => routine.name === workout.routineName)
    if (!matchingRoutine) return

    const updatedExercises = matchingRoutine.exercises.map(routineExercise => {
        const workoutExercise = workout.exercises.find(exercise => exercise.name === routineExercise.name)
        if (workoutExercise && workoutExercise.targetRest) {
            return { ...routineExercise, targetRest: workoutExercise.targetRest }
        }
        return routineExercise
    })

    updateRoutine(matchingRoutine.id, { exercises: updatedExercises })
}
