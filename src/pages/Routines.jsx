import { useState } from 'react'
import ExerciseSearch from '../components/ExerciseSearch'
import VideoPlayer from '../components/VideoPlayer'
import CompletedVideosCarousel from '../components/CompletedVideosCarousel'
import RoutineBuilderForm from '../components/RoutineBuilderForm'
import RoutineCard from '../components/RoutineCard'
import RoutineDetails from '../components/RoutineDetails'
import { ROUTINE_COLORS } from '../constants/colors'
import { loadCompletedVideos } from '../utils/videos'

export default function Routines({ routines, onCreateRoutine, onDeleteRoutine, onUpdateRoutine, onStartFromRoutine, onLogVideo }) {
    const [showCreate, setShowCreate] = useState(false)
    const [editingRoutineId, setEditingRoutineId] = useState(null)
    const [routineName, setRoutineName] = useState('')
    const [routineColor, setRoutineColor] = useState(ROUTINE_COLORS[5]) // Default Purple
    const [selectedExercises, setSelectedExercises] = useState([])
    const [showExercisePicker, setShowExercisePicker] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [expandedId, setExpandedId] = useState(null)
    const [completedVideos] = useState(loadCompletedVideos)
    const [selectedVideo, setSelectedVideo] = useState(null)

    const resetForm = () => {
        setRoutineName('')
        setRoutineColor(ROUTINE_COLORS[5])
        setSelectedExercises([])
        setEditingRoutineId(null)
        setShowCreate(false)
    }

    const startEditingRoutine = (routine) => {
        setEditingRoutineId(routine.id)
        setRoutineName(routine.name)
        setRoutineColor(routine.color || ROUTINE_COLORS[5])
        setSelectedExercises([...routine.exercises])
        setShowCreate(true)
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
        if (editingRoutineId && onUpdateRoutine) {
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
        <div className="page">
            <div className="page-header">
                <div className="page-title">Routine</div>
                <div className="page-subtitle">Template di allenamento pre-impostati</div>
            </div>

            {/* Create button */}
            <button
                className="btn btn-secondary btn-full"
                onClick={() => {
                    if (showCreate) {
                        resetForm()
                    } else {
                        setShowCreate(true)
                    }
                }}
                style={{ marginBottom: 'var(--space-4)' }}
            >
                {showCreate ? '✕ Chiudi' : '+ Nuova Routine'}
            </button>

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

            {/* Completed Videos Carousel */}
            {!showCreate && (
                <CompletedVideosCarousel
                    title="Video Completati"
                    videos={completedVideos}
                    onSelect={setSelectedVideo}
                    style={{ marginTop: 0, marginBottom: 'var(--space-5)' }}
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
                    {routines.length > 0 && <div className="section-label">Le tue routine ({routines.length})</div>}
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
                                        className="btn btn-primary btn-sm"
                                        onClick={(e) => { e.stopPropagation(); onStartFromRoutine(routine) }}
                                        style={{ minHeight: 34, padding: '0 14px' }}
                                    >
                                        Inizia
                                    </button>
                                )}
                            >
                                <RoutineDetails
                                    routine={routine}
                                    showRest={false}
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
                                                Elimina
                                            </button>
                                        </>
                                    )}
                                />
                            </RoutineCard>
                        )
                    })}
                </>
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
