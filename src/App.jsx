import { useState, useCallback, useRef, useEffect } from 'react'
import useWorkouts from './hooks/useWorkouts'
import useTimer from './hooks/useTimer'
import useRoutines from './hooks/useRoutines'
import RestTimerBar from './components/RestTimerBar'
import Home from './pages/Home'
import ActiveWorkout from './pages/ActiveWorkout'
import HistoryCalendar from './pages/HistoryCalendar'
import WorkoutTab from './pages/WorkoutTab'
import VideoLibrary from './pages/VideoLibrary'
import { exportAllData, importAllData } from './data/exercises'

// Clean SVG icons for nav
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
    routines: (
        <svg className="nav-icon" viewBox="0 0 24 24">
            <path d="M17 1l4 4-4 4" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <path d="M7 23l-4-4 4-4" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
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
    video: (
        <svg className="nav-icon" viewBox="0 0 24 24">
            <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
            <polygon points="10 8 16 12 10 16 10 8" />
        </svg>
    ),
}

const TABS = [
    { id: 'home', label: 'Home', icon: NavIcons.home },
    { id: 'workout', label: 'Allenamento', icon: NavIcons.workout },
    { id: 'video', label: 'Libreria', icon: NavIcons.video },
    { id: 'history', label: 'Storico', icon: NavIcons.history },
]

export default function App() {
    const [activeTab, setActiveTab] = useState('home')
    const [activeWorkoutId, setActiveWorkoutId] = useState(() => {
        try { return localStorage.getItem('gymtrack_active_workout') || null } catch { return null }
    })
    const importRef = useRef(null)

    // Theme
    const [theme, setTheme] = useState(() => {
        try { return localStorage.getItem('gymtrack_theme') || 'dark' } catch { return 'dark' }
    })

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f5f5fa' : '#0a0a1a')
        localStorage.setItem('gymtrack_theme', theme)
    }, [theme])

    const toggleTheme = useCallback(() => {
        setTheme(t => t === 'dark' ? 'light' : 'dark')
    }, [])

    const workoutActions = useWorkouts()
    const timer = useTimer()
    const routineActions = useRoutines()

    const {
        workouts, createWorkout, createWorkoutFromRoutine, logVideoWorkout, finishWorkout, deleteWorkout,
        addExercise, removeExercise, addSet, removeSet, updateSet,
        toggleSetComplete, duplicateWorkout, getTodayWorkout, getStats,
        updateExerciseRest, updateWorkoutColor,
    } = workoutActions

    const activeWorkout = workouts.find(w => w.id === activeWorkoutId) || null
    const todayWorkout = getTodayWorkout()
    const stats = getStats()

    const handleStartWorkout = useCallback(() => {
        const w = createWorkout()
        setActiveWorkoutId(w.id)
        localStorage.setItem('gymtrack_active_workout', w.id)
        setActiveTab('active-workout')
    }, [createWorkout])

    const handleResumeWorkout = useCallback(() => {
        if (activeWorkout) {
            setActiveWorkoutId(activeWorkout.id)
            localStorage.setItem('gymtrack_active_workout', activeWorkout.id)
        } else if (todayWorkout) {
            setActiveWorkoutId(todayWorkout.id)
            localStorage.setItem('gymtrack_active_workout', todayWorkout.id)
        }
        setActiveTab('active-workout')
    }, [activeWorkout, todayWorkout])

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
            setActiveTab('active-workout')
        }
    }, [duplicateWorkout])

    const handleStartFromRoutine = useCallback((routine) => {
        const w = createWorkoutFromRoutine(routine)
        setActiveWorkoutId(w.id)
        localStorage.setItem('gymtrack_active_workout', w.id)
        setActiveTab('active-workout')
    }, [createWorkoutFromRoutine])

    const handleExport = useCallback(() => {
        exportAllData()
    }, [])

    const handleImport = useCallback(async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        try {
            await importAllData(file)
            window.location.reload()
        } catch (err) {
            alert('Errore importazione: file non valido')
        }
        e.target.value = ''
    }, [])

    return (
        <>
            {activeTab === 'home' && (
                <Home
                    stats={stats}
                    activeWorkout={activeWorkout || todayWorkout}
                    onStartWorkout={handleStartWorkout}
                    onResumeWorkout={handleResumeWorkout}
                    onImport={() => importRef.current?.click()}
                    theme={theme}
                    onToggleTheme={toggleTheme}
                />
            )}

            {activeTab === 'active-workout' && (
                <ActiveWorkout
                    workout={activeWorkout}
                    routines={routineActions.routines}
                    timer={timer}
                    onAddExercise={addExercise}
                    onRemoveExercise={removeExercise}
                    onAddSet={addSet}
                    onRemoveSet={removeSet}
                    onUpdateSet={updateSet}
                    onToggleSet={toggleSetComplete}
                    onUpdateNotes={workoutActions.updateWorkoutNotes}
                    onUpdateExerciseNotes={workoutActions.updateExerciseNotes}
                    onUpdateExerciseRest={updateExerciseRest}
                    onFinish={handleFinishWorkout}
                    onGoBack={() => setActiveTab('workout')}
                    onCreateRoutine={routineActions.createRoutine}
                />
            )}

            {activeTab === 'workout' && (
                <WorkoutTab
                    hasActiveWorkout={!!activeWorkout || !!todayWorkout}
                    onResumeWorkout={handleResumeWorkout}
                    routines={routineActions.routines}
                    onCreateRoutine={routineActions.createRoutine}
                    onDeleteRoutine={routineActions.deleteRoutine}
                    onUpdateRoutine={routineActions.updateRoutine}
                    onStartFromRoutine={handleStartFromRoutine}
                    onStartEmpty={handleStartWorkout}
                    onLogVideo={logVideoWorkout}
                />
            )}

            {activeTab === 'video' && (
                <VideoLibrary
                    hasActiveWorkout={!!activeWorkout || !!todayWorkout}
                    onLogVideo={logVideoWorkout}
                    onResumeWorkout={handleResumeWorkout}
                />
            )}

            {activeTab === 'history' && (
                <HistoryCalendar
                    workouts={workouts}
                    onDuplicate={handleDuplicate}
                    onDelete={deleteWorkout}
                    onUpdateWorkoutColor={updateWorkoutColor}
                />
            )}


            {/* Hidden file input for import */}
            <input
                ref={importRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
            />

            {/* Compact rest timer bar */}
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
