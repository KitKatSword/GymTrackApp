import { useState, useCallback } from 'react'
import useWorkouts from './hooks/useWorkouts'
import useTimer from './hooks/useTimer'
import RestTimerBar from './components/RestTimerBar'
import Home from './pages/Home'
import ActiveWorkout from './pages/ActiveWorkout'
import HistoryCalendar from './pages/HistoryCalendar'
import ExerciseLibrary from './pages/ExerciseLibrary'

// Clean SVG icons for nav — no emojis
const NavIcons = {
    home: (
        <svg className="nav-icon" viewBox="0 0 24 24">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    ),
    workout: (
        <svg className="nav-icon" viewBox="0 0 24 24">
            <path d="M18 7.5v9M6 7.5v9M3 10.5h3m12 0h3M3 13.5h3m12 0h3" />
        </svg>
    ),
    history: (
        <svg className="nav-icon" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    ),
    exercises: (
        <svg className="nav-icon" viewBox="0 0 24 24">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
    ),
}

const TABS = [
    { id: 'home', label: 'Home', icon: NavIcons.home },
    { id: 'workout', label: 'Workout', icon: NavIcons.workout },
    { id: 'history', label: 'Storico', icon: NavIcons.history },
    { id: 'exercises', label: 'Esercizi', icon: NavIcons.exercises },
]

export default function App() {
    const [activeTab, setActiveTab] = useState('home')
    const [activeWorkoutId, setActiveWorkoutId] = useState(() => {
        try { return localStorage.getItem('gymtrack_active_workout') || null } catch { return null }
    })

    const workoutActions = useWorkouts()
    const timer = useTimer()

    const {
        workouts, createWorkout, finishWorkout, deleteWorkout,
        addExercise, removeExercise, addSet, removeSet, updateSet,
        toggleSetComplete, duplicateWorkout, getTodayWorkout, getStats,
    } = workoutActions

    const activeWorkout = workouts.find(w => w.id === activeWorkoutId) || null
    const todayWorkout = getTodayWorkout()
    const stats = getStats()

    const handleStartWorkout = useCallback(() => {
        const w = createWorkout()
        setActiveWorkoutId(w.id)
        localStorage.setItem('gymtrack_active_workout', w.id)
        setActiveTab('workout')
    }, [createWorkout])

    const handleResumeWorkout = useCallback(() => {
        if (todayWorkout) {
            setActiveWorkoutId(todayWorkout.id)
            localStorage.setItem('gymtrack_active_workout', todayWorkout.id)
        }
        setActiveTab('workout')
    }, [todayWorkout])

    const handleFinishWorkout = useCallback((id) => {
        finishWorkout(id)
        setActiveWorkoutId(null)
        localStorage.removeItem('gymtrack_active_workout')
        timer.dismiss()
        setActiveTab('home')
    }, [finishWorkout, timer])

    const handleDuplicate = useCallback((id) => {
        const w = duplicateWorkout(id)
        if (w) {
            setActiveWorkoutId(w.id)
            localStorage.setItem('gymtrack_active_workout', w.id)
            setActiveTab('workout')
        }
    }, [duplicateWorkout])

    return (
        <>
            {activeTab === 'home' && (
                <Home
                    stats={stats}
                    todayWorkout={todayWorkout || (activeWorkout?.endTime === null ? activeWorkout : null)}
                    onStartWorkout={handleStartWorkout}
                    onResumeWorkout={handleResumeWorkout}
                />
            )}

            {activeTab === 'workout' && (
                <ActiveWorkout
                    workout={activeWorkout}
                    timer={timer}
                    onAddExercise={addExercise}
                    onRemoveExercise={removeExercise}
                    onAddSet={addSet}
                    onRemoveSet={removeSet}
                    onUpdateSet={updateSet}
                    onToggleSet={toggleSetComplete}
                    onUpdateNotes={workoutActions.updateWorkoutNotes}
                    onUpdateExerciseNotes={workoutActions.updateExerciseNotes}
                    onFinish={handleFinishWorkout}
                    onGoHome={() => setActiveTab('home')}
                />
            )}

            {activeTab === 'history' && (
                <HistoryCalendar
                    workouts={workouts}
                    onDuplicate={handleDuplicate}
                    onDelete={deleteWorkout}
                />
            )}

            {activeTab === 'exercises' && (
                <ExerciseLibrary />
            )}

            {/* Compact rest timer bar — always above nav */}
            <RestTimerBar timer={timer} />

            {/* Bottom navigation */}
            <nav className="bottom-nav">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </nav>
        </>
    )
}
