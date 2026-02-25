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
            exercises: exercises.map(ex => ({
                exerciseId: ex.id,
                name: ex.name,
                category: ex.category,
                emoji: ex.emoji || '',
                params: ex.params || ['weight', 'reps'],
                isCustom: ex.isCustom || false,
                image: ex.image || null,
                setsCount: ex.setsCount || 3,
            })),
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
