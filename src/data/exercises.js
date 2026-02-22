const exercises = [
    // Petto
    { id: 'bench-press', name: 'Panca Piana', category: 'Petto', emoji: '🏋️', params: ['weight', 'reps'] },
    { id: 'incline-bench', name: 'Panca Inclinata', category: 'Petto', emoji: '🏋️', params: ['weight', 'reps'] },
    { id: 'decline-bench', name: 'Panca Declinata', category: 'Petto', emoji: '🏋️', params: ['weight', 'reps'] },
    { id: 'dumbbell-fly', name: 'Croci con Manubri', category: 'Petto', emoji: '🦋', params: ['weight', 'reps'] },
    { id: 'cable-crossover', name: 'Cavi Incrociati', category: 'Petto', emoji: '🔗', params: ['weight', 'reps'] },
    { id: 'chest-press', name: 'Chest Press', category: 'Petto', emoji: '💪', params: ['weight', 'reps'] },
    { id: 'push-ups', name: 'Piegamenti', category: 'Petto', emoji: '🤸', params: ['reps'] },
    { id: 'dips-chest', name: 'Dip (Petto)', category: 'Petto', emoji: '⬇️', params: ['weight', 'reps'] },

    // Schiena
    { id: 'lat-pulldown', name: 'Lat Machine', category: 'Schiena', emoji: '🔽', params: ['weight', 'reps'] },
    { id: 'pull-ups', name: 'Trazioni', category: 'Schiena', emoji: '🧗', params: ['weight', 'reps'] },
    { id: 'barbell-row', name: 'Rematore con Bilanciere', category: 'Schiena', emoji: '🚣', params: ['weight', 'reps'] },
    { id: 'dumbbell-row', name: 'Rematore con Manubrio', category: 'Schiena', emoji: '🚣', params: ['weight', 'reps'] },
    { id: 'cable-row', name: 'Pulley Basso', category: 'Schiena', emoji: '🔗', params: ['weight', 'reps'] },
    { id: 't-bar-row', name: 'T-Bar Row', category: 'Schiena', emoji: '🔩', params: ['weight', 'reps'] },
    { id: 'deadlift', name: 'Stacco da Terra', category: 'Schiena', emoji: '🏗️', params: ['weight', 'reps'] },
    { id: 'hyperextension', name: 'Hyperextension', category: 'Schiena', emoji: '🔄', params: ['weight', 'reps'] },

    // Spalle
    { id: 'overhead-press', name: 'Military Press', category: 'Spalle', emoji: '🏋️', params: ['weight', 'reps'] },
    { id: 'lateral-raise', name: 'Alzate Laterali', category: 'Spalle', emoji: '🦅', params: ['weight', 'reps'] },
    { id: 'front-raise', name: 'Alzate Frontali', category: 'Spalle', emoji: '🙋', params: ['weight', 'reps'] },
    { id: 'rear-delt-fly', name: 'Alzate Posteriori', category: 'Spalle', emoji: '🦋', params: ['weight', 'reps'] },
    { id: 'face-pull', name: 'Face Pull', category: 'Spalle', emoji: '🎯', params: ['weight', 'reps'] },
    { id: 'shrugs', name: 'Scrollate', category: 'Spalle', emoji: '🤷', params: ['weight', 'reps'] },
    { id: 'arnold-press', name: 'Arnold Press', category: 'Spalle', emoji: '💪', params: ['weight', 'reps'] },

    // Braccia
    { id: 'bicep-curl', name: 'Curl Bicipiti', category: 'Braccia', emoji: '💪', params: ['weight', 'reps'] },
    { id: 'hammer-curl', name: 'Hammer Curl', category: 'Braccia', emoji: '🔨', params: ['weight', 'reps'] },
    { id: 'preacher-curl', name: 'Curl alla Panca Scott', category: 'Braccia', emoji: '📖', params: ['weight', 'reps'] },
    { id: 'tricep-pushdown', name: 'Push Down Tricipiti', category: 'Braccia', emoji: '⬇️', params: ['weight', 'reps'] },
    { id: 'skull-crusher', name: 'French Press', category: 'Braccia', emoji: '💀', params: ['weight', 'reps'] },
    { id: 'tricep-dips', name: 'Dip Tricipiti', category: 'Braccia', emoji: '⬇️', params: ['weight', 'reps'] },
    { id: 'concentration-curl', name: 'Curl Concentrato', category: 'Braccia', emoji: '🎯', params: ['weight', 'reps'] },
    { id: 'cable-curl', name: 'Curl ai Cavi', category: 'Braccia', emoji: '🔗', params: ['weight', 'reps'] },

    // Gambe
    { id: 'squat', name: 'Squat', category: 'Gambe', emoji: '🦵', params: ['weight', 'reps'] },
    { id: 'leg-press', name: 'Leg Press', category: 'Gambe', emoji: '🦿', params: ['weight', 'reps'] },
    { id: 'lunge', name: 'Affondi', category: 'Gambe', emoji: '🚶', params: ['weight', 'reps'] },
    { id: 'leg-extension', name: 'Leg Extension', category: 'Gambe', emoji: '🦵', params: ['weight', 'reps'] },
    { id: 'leg-curl', name: 'Leg Curl', category: 'Gambe', emoji: '🔄', params: ['weight', 'reps'] },
    { id: 'calf-raise', name: 'Calf Raise', category: 'Gambe', emoji: '🦶', params: ['weight', 'reps'] },
    { id: 'romanian-deadlift', name: 'Stacco Rumeno', category: 'Gambe', emoji: '🏗️', params: ['weight', 'reps'] },
    { id: 'hip-thrust', name: 'Hip Thrust', category: 'Gambe', emoji: '🍑', params: ['weight', 'reps'] },
    { id: 'bulgarian-split', name: 'Bulgarian Split Squat', category: 'Gambe', emoji: '🦵', params: ['weight', 'reps'] },
    { id: 'hack-squat', name: 'Hack Squat', category: 'Gambe', emoji: '🦿', params: ['weight', 'reps'] },

    // Core
    { id: 'plank', name: 'Plank', category: 'Core', emoji: '🧱', params: ['time'] },
    { id: 'crunch', name: 'Crunch', category: 'Core', emoji: '🔥', params: ['reps'] },
    { id: 'leg-raise', name: 'Leg Raise', category: 'Core', emoji: '🦵', params: ['reps'] },
    { id: 'russian-twist', name: 'Russian Twist', category: 'Core', emoji: '🌀', params: ['weight', 'reps'] },
    { id: 'cable-crunch', name: 'Crunch ai Cavi', category: 'Core', emoji: '🔗', params: ['weight', 'reps'] },
    { id: 'ab-wheel', name: 'Ab Wheel', category: 'Core', emoji: '🛞', params: ['reps'] },

    // Cardio
    { id: 'treadmill', name: 'Tapis Roulant', category: 'Cardio', emoji: '🏃', params: ['time'] },
    { id: 'cycling', name: 'Cyclette', category: 'Cardio', emoji: '🚴', params: ['time'] },
    { id: 'rowing', name: 'Vogatore', category: 'Cardio', emoji: '🚣', params: ['time'] },
    { id: 'jump-rope', name: 'Salto con la Corda', category: 'Cardio', emoji: '🤸', params: ['time'] },
    { id: 'stair-climber', name: 'Stair Climber', category: 'Cardio', emoji: '🪜', params: ['time'] },
]

export const categories = ['Tutti', 'Petto', 'Schiena', 'Spalle', 'Braccia', 'Gambe', 'Core', 'Cardio', 'Custom']

// Available parameter types for custom exercises
export const PARAM_TYPES = [
    { id: 'weight', label: 'Kg', icon: '⚖️' },
    { id: 'reps', label: 'Reps', icon: '🔢' },
    { id: 'time', label: 'Tempo (s)', icon: '⏱️' },
]

// Load custom exercises from localStorage
function loadCustomExercises() {
    try {
        const data = localStorage.getItem('gymtrack_custom_exercises')
        return data ? JSON.parse(data) : []
    } catch {
        return []
    }
}

export function saveCustomExercise(exercise) {
    const customs = loadCustomExercises()
    customs.push(exercise)
    localStorage.setItem('gymtrack_custom_exercises', JSON.stringify(customs))
}

export function updateCustomExercise(exerciseId, updates) {
    const customs = loadCustomExercises().map(e =>
        e.id === exerciseId ? { ...e, ...updates } : e
    )
    localStorage.setItem('gymtrack_custom_exercises', JSON.stringify(customs))
}

export function deleteCustomExercise(exerciseId) {
    const customs = loadCustomExercises().filter(e => e.id !== exerciseId)
    localStorage.setItem('gymtrack_custom_exercises', JSON.stringify(customs))
}

export function getAllExercises() {
    return [...exercises, ...loadCustomExercises()]
}

export function getCustomExercises() {
    return loadCustomExercises()
}

// Resize image to max dimensions and return base64
export function resizeImageToBase64(file, maxSize = 200) {
    return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                let w = img.width, h = img.height
                if (w > h) { if (w > maxSize) { h = h * maxSize / w; w = maxSize } }
                else { if (h > maxSize) { w = w * maxSize / h; h = maxSize } }
                canvas.width = w; canvas.height = h
                canvas.getContext('2d').drawImage(img, 0, 0, w, h)
                resolve(canvas.toDataURL('image/webp', 0.8))
            }
            img.src = e.target.result
        }
        reader.readAsDataURL(file)
    })
}

// Export all app data as JSON
export function exportAllData() {
    const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        workouts: JSON.parse(localStorage.getItem('gymtrack_workouts') || '[]'),
        customExercises: loadCustomExercises(),
        routines: JSON.parse(localStorage.getItem('gymtrack_routines') || '[]'),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gymtrack-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
}

// Import data from JSON file
export function importAllData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result)
                if (data.workouts) localStorage.setItem('gymtrack_workouts', JSON.stringify(data.workouts))
                if (data.customExercises) localStorage.setItem('gymtrack_custom_exercises', JSON.stringify(data.customExercises))
                if (data.routines) localStorage.setItem('gymtrack_routines', JSON.stringify(data.routines))
                resolve(data)
            } catch (err) {
                reject(err)
            }
        }
        reader.readAsText(file)
    })
}

export default exercises
