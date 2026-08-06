import { useCallback, useState } from 'react'
import { resizeImageToBase64 } from '../data/exercises'
import { toLocalDateString } from '../utils/date'
import { getExerciseTrackingKey } from '../utils/progress'

const PROGRESS_KEY = 'gymtrack_progress_photos'
const SETUPS_KEY = 'gymtrack_exercise_setups'

function generateId(prefix) {
    return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

function loadStorage(key, fallback, validator) {
    try {
        const raw = localStorage.getItem(key)
        if (!raw) return fallback
        const parsed = JSON.parse(raw)
        return validator(parsed) ? parsed : fallback
    } catch {
        return fallback
    }
}

function persistStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
        if (error?.name === 'QuotaExceededError') {
            throw new Error('Spazio locale esaurito. Elimina qualche foto o esporta un backup.')
        }
        throw new Error('Impossibile salvare la foto su questo dispositivo.')
    }
}

export default function useMediaTracking() {
    const [progressPhotos, setProgressPhotos] = useState(() =>
        loadStorage(PROGRESS_KEY, [], Array.isArray)
    )
    const [exerciseSetups, setExerciseSetups] = useState(() =>
        loadStorage(SETUPS_KEY, {}, value => value && typeof value === 'object' && !Array.isArray(value))
    )

    const addProgressPhoto = useCallback(async (file, { date, note } = {}) => {
        const image = await resizeImageToBase64(file, 1080)
        const entry = {
            id: generateId('progress'),
            date: date || toLocalDateString(),
            note: String(note || '').trim(),
            image,
            createdAt: Date.now(),
        }
        const next = [entry, ...progressPhotos]
        persistStorage(PROGRESS_KEY, next)
        setProgressPhotos(next)
        return entry
    }, [progressPhotos])

    const deleteProgressPhoto = useCallback((photoId) => {
        const next = progressPhotos.filter(photo => photo.id !== photoId)
        persistStorage(PROGRESS_KEY, next)
        setProgressPhotos(next)
    }, [progressPhotos])

    const getExerciseSetup = useCallback((exercise) => {
        return exerciseSetups[getExerciseTrackingKey(exercise)] || null
    }, [exerciseSetups])

    const saveExerciseSetup = useCallback(async (exercise, updates = {}) => {
        const key = getExerciseTrackingKey(exercise)
        const current = exerciseSetups[key] || {}
        let image = current.image || null

        if (updates.photoFile) {
            image = await resizeImageToBase64(updates.photoFile, 900)
        } else if (updates.removePhoto) {
            image = null
        }

        const entry = {
            ...current,
            exerciseName: exercise.name,
            note: updates.note !== undefined ? String(updates.note).trim() : (current.note || ''),
            image,
            updatedAt: Date.now(),
        }
        const next = { ...exerciseSetups, [key]: entry }
        persistStorage(SETUPS_KEY, next)
        setExerciseSetups(next)
        return entry
    }, [exerciseSetups])

    return {
        progressPhotos,
        exerciseSetups,
        addProgressPhoto,
        deleteProgressPhoto,
        getExerciseSetup,
        saveExerciseSetup,
    }
}
