import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'gymtrack_routines'

function generateId() {
    return 'r-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

function loadRoutines() {
    try {
        const data = localStorage.getItem(STORAGE_KEY)
        return data ? JSON.parse(data) : []
    } catch {
        return []
    }
}

function saveRoutines(routines) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routines))
}

function normalizeEmomBlocks(blocks) {
    if (!Array.isArray(blocks) || blocks.length === 0) {
        return [{ minutes: 10, reps: 5 }]
    }

    return blocks.map(block => ({
        minutes: Math.max(1, Number(block?.minutes) || 1),
        reps: Math.max(1, Number(block?.reps) || 1),
    }))
}

function mapExerciseToRoutine(ex) {
    const params = ex.params || ['weight', 'reps']
    const isEmom = ex.isEmom || params.includes('emom')
    const setsCount = Math.max(1, ex.setsCount || (Array.isArray(ex.sets) ? ex.sets.length : 0) || 3)

    return {
        exerciseId: ex.exerciseId || ex.id,
        name: ex.name,
        category: ex.category,
        emoji: ex.emoji || '',
        params: isEmom ? ['emom'] : params,
        isCustom: ex.isCustom || false,
        image: ex.image || null,
        isEmom,
        emomBlocks: isEmom ? normalizeEmomBlocks(ex.emomBlocks) : undefined,
        emomWeight: isEmom ? (ex.emomWeight || '') : undefined,
        setsCount,
        targetRest: ex.targetRest || 90,
    }
}

export default function useRoutines() {
    const [routines, setRoutines] = useState(loadRoutines)

    useEffect(() => {
        saveRoutines(routines)
    }, [routines])

    const createRoutine = useCallback((name, exercises, color) => {
        const routine = {
            id: generateId(),
            name,
            color: color || '#8b5cf6', // default color if none provided
            createdAt: Date.now(),
            exercises: exercises.map(mapExerciseToRoutine),
        }
        setRoutines(prev => [routine, ...prev])
        return routine
    }, [])

    const deleteRoutine = useCallback((routineId) => {
        setRoutines(prev => prev.filter(r => r.id !== routineId))
    }, [])

    const updateRoutine = useCallback((routineId, updates) => {
        setRoutines(prev => prev.map(r =>
            r.id === routineId ? { ...r, ...updates } : r
        ))
    }, [])

    return {
        routines,
        createRoutine,
        deleteRoutine,
        updateRoutine,
    }
}
