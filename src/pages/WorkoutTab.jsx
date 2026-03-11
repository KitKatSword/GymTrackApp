import { useState } from 'react'
import ExerciseSearch from '../components/ExerciseSearch'
import VideoPlayer from '../components/VideoPlayer'
import CompletedVideosCarousel from '../components/CompletedVideosCarousel'
import RoutineBuilderForm from '../components/RoutineBuilderForm'
import RoutineCard from '../components/RoutineCard'
import RoutineDetails from '../components/RoutineDetails'
import { ROUTINE_COLORS } from '../constants/colors'
import { loadCompletedVideos } from '../utils/videos'

export default function WorkoutTab({
    routines,
    hasActiveWorkout,
    onResumeWorkout,
    onCreateRoutine,
    onDeleteRoutine,
    onUpdateRoutine,
    onStartFromRoutine,
    onStartEmpty,
    onLogVideo
}) {
    const [showCreate, setShowCreate] = useState(false)
    const [editingRoutineId, setEditingRoutineId] = useState(null)
    const [routineName, setRoutineName] = useState('')
    const [routineColor, setRoutineColor] = useState(ROUTINE_COLORS[5])
    const [selectedExercises, setSelectedExercises] = useState([])
    const [showExercisePicker, setShowExercisePicker] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [expandedId, setExpandedId] = useState(null)
    const [completedVideos] = useState(loadCompletedVideos)
    const [selectedVideo, setSelectedVideo] = useState(null)
    const [showAllRoutines, setShowAllRoutines] = useState(false)

    const resetForm = () => {
        setRoutineName('')
        setRoutineColor(ROUTINE_COLORS[5])
        setSelectedExercises([])
        setEditingRoutineId(null)
        setShowCreate(false)
    }

    const startEditingRoutine = (routine, closeModal = false) => {
        setEditingRoutineId(routine.id)
        setRoutineName(routine.name)
        setRoutineColor(routine.color || ROUTINE_COLORS[5])
        setSelectedExercises([...routine.exercises])
        setShowCreate(true)
        if (closeModal) setShowAllRoutines(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleAddExercise = (exercise) => {
        setSelectedExercises(prev => [...prev, { ...exercise, setsCount: 3 }])
    }

    const handleRemoveExercise = (idx) => {
        setSelectedExercises(prev => prev.filter((_, i) => i !== idx))
    }

    const handleSetCount = (idx, count) => {
        setSelectedExercises(prev => prev.map((ex, i) =>
            i === idx ? { ...ex, setsCount: Math.max(1, Math.min(10, count)) } : ex
        ))
    }

    const handleSave = () => {
        if (!routineName.trim() || selectedExercises.length === 0) return
        if (editingRoutineId) {
            onUpdateRoutine(editingRoutineId, {
                name: routineName.trim(),
                exercises: selectedExercises,
                color: routineColor,
            })
        } else {
            onCreateRoutine(routineName.trim(), selectedExercises, routineColor)
        }
        resetForm()
    }

    return (
        <div className="page" style={{ paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom) + var(--space-6) + var(--rest-bar-height, 0px))' }}>
            <div className="page-header">
                <div className="page-title">Allenamento</div>
                <div className="page-subtitle">Crea e gestisci i tuoi workout</div>
            </div>

            {/* Quick Start Empty Workout */}
            {!showCreate && hasActiveWorkout && (
                <button
                    className="btn btn-primary btn-full resume-workout-btn"
                    onClick={onResumeWorkout}
                    style={{ marginBottom: 'var(--space-6)' }}
                >
                    Riprendi Allenamento in Corso
                </button>
            )}

            {/* Routines Section Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <div className="section-label" style={{ marginBottom: 0 }}>Le Tue Routine</div>
                <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                        if (showCreate) {
                            resetForm()
                        } else {
                            setShowCreate(true)
                        }
                    }}
                >
                    {showCreate ? 'Annulla' : '+ Nuova'}
                </button>
            </div>

            {/* Create form */}
            {showCreate && (
                <RoutineBuilderForm
                    title={editingRoutineId ? 'Modifica Routine' : 'Nuova Routine'}
                    routineName={routineName}
                    onRoutineNameChange={setRoutineName}
                    routineColor={routineColor}
                    onRoutineColorChange={setRoutineColor}
                    selectedExercises={selectedExercises}
                    onSetCountChange={handleSetCount}
                    onRemoveExercise={handleRemoveExercise}
                    onOpenExercisePicker={() => setShowExercisePicker(true)}
                    onSave={handleSave}
                    saveDisabled={!routineName.trim() || selectedExercises.length === 0}
                />
            )}

            {/* Exercise picker modal */}
            {showExercisePicker && (
                <ExerciseSearch
                    onSelect={(ex) => { handleAddExercise(ex); setShowExercisePicker(false) }}
                    onClose={() => setShowExercisePicker(false)}
                />
            )}

            {/* Routines list */}
            {routines.length === 0 && !showCreate ? (
                <div className="empty-state">
                    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    </svg>
                    <div className="title">Nessuna routine</div>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                        Crea una routine per avviare allenamenti pre-impostati
                    </p>
                </div>
            ) : (
                <>
                    {routines.slice(0, 4).map(routine => {
                        const isExpanded = expandedId === routine.id
                        return (
                            <RoutineCard
                                key={routine.id}
                                routine={routine}
                                expanded={isExpanded}
                                onToggle={() => setExpandedId(isExpanded ? null : routine.id)}
                                action={(
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            if (hasActiveWorkout) {
                                                alert("Hai già un allenamento in corso. Terminalo prima di iniziarne uno nuovo.")
                                            } else {
                                                onStartFromRoutine(routine)
                                            }
                                        }}
                                        className={hasActiveWorkout ? "play-btn-round disabled" : "play-btn-round"}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 3 }}>
                                            <polygon points="5 3 19 12 5 21 5 3" />
                                        </svg>
                                    </button>
                                )}
                            >
                                <RoutineDetails
                                    routine={routine}
                                    actions={(
                                        <>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                style={{ flex: 1 }}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    startEditingRoutine(routine)
                                                }}
                                            >
                                                Modifica
                                            </button>
                                            <button
                                                className="btn btn-sm"
                                                style={{ color: 'var(--danger)', background: 'var(--danger-bg)', border: '1px solid var(--danger-bg)', flex: 1 }}
                                                onClick={(e) => { e.stopPropagation(); setDeleteConfirm(routine.id) }}
                                            >
                                                Elimina Routine
                                            </button>
                                        </>
                                    )}
                                />
                            </RoutineCard>
                        )
                    })}
                    {routines.length > 4 && !showCreate && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
                            <button
                                onClick={() => setShowAllRoutines(true)}
                                style={{ background: 'none', border: 'none', padding: '6px 20px', cursor: 'pointer', color: 'var(--text-muted)', transition: 'color 0.15s ease' }}
                                onPointerEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                                onPointerLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Modal All Routines */}
            {showAllRoutines && (
                <div className="modal-overlay" onClick={() => setShowAllRoutines(false)} style={{ alignItems: 'stretch', justifyContent: 'center' }}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxHeight: '92vh', height: 'auto', display: 'flex', flexDirection: 'column', marginTop: 'auto', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', maxWidth: '100%', width: '100%' }}>
                        <div className="modal-handle" />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                            <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>Tutte le Routine</div>
                            <button className="btn" style={{ padding: '6px', background: 'transparent', border: 'none', color: 'var(--text-secondary)' }} onClick={() => setShowAllRoutines(false)}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', margin: '0 calc(-1 * var(--space-5))', padding: '0 var(--space-5)', paddingBottom: 'var(--space-4)' }}>
                            {routines.map(routine => {
                                const isExpanded = expandedId === routine.id
                                return (
                                    <RoutineCard
                                        key={routine.id}
                                        routine={routine}
                                        expanded={isExpanded}
                                        onToggle={() => setExpandedId(isExpanded ? null : routine.id)}
                                        action={(
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (hasActiveWorkout) {
                                                        alert("Hai già un allenamento in corso. Terminalo prima di iniziarne uno nuovo.")
                                                    } else {
                                                        setShowAllRoutines(false)
                                                        onStartFromRoutine(routine)
                                                    }
                                                }}
                                                className={hasActiveWorkout ? "play-btn-round disabled" : "play-btn-round"}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 3 }}>
                                                    <polygon points="5 3 19 12 5 21 5 3" />
                                                </svg>
                                            </button>
                                        )}
                                    >
                                        <RoutineDetails
                                            routine={routine}
                                            actions={(
                                                <>
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        style={{ flex: 1 }}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            startEditingRoutine(routine, true)
                                                        }}
                                                    >
                                                        Modifica
                                                    </button>
                                                    <button
                                                        className="btn btn-sm"
                                                        style={{ color: 'var(--danger)', background: 'var(--danger-bg)', border: '1px solid var(--danger-bg)', flex: 1 }}
                                                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(routine.id) }}
                                                    >
                                                        Elimina Routine
                                                    </button>
                                                </>
                                            )}
                                        />
                                    </RoutineCard>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Completed Videos Carousel inside Workout */}
            {!showCreate && (
                <CompletedVideosCarousel
                    title="Video Completati di Recente"
                    videos={completedVideos}
                    onSelect={setSelectedVideo}
                    style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-5)' }}
                />
            )}

            {/* Delete confirm */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-handle" />
                        <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)', marginBottom: 8 }}>Elimina routine?</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>Questa azione non può essere annullata.</div>
                        <div className="confirm-actions">
                            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Annulla</button>
                            <button className="btn btn-danger" onClick={() => { onDeleteRoutine(deleteConfirm); setDeleteConfirm(null) }}>Elimina</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Video Player form from Completed Videos */}
            {selectedVideo && (
                <VideoPlayer
                    video={selectedVideo}
                    onClose={() => setSelectedVideo(null)}
                    onComplete={(v) => { if (onLogVideo) onLogVideo(v) }}
                    isCompleted={true}
                />
            )}
        </div>
    )
}
