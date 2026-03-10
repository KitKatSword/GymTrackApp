import { useState, useEffect } from 'react'
import { getAllExercises, PARAM_TYPES } from '../data/exercises'
import ExerciseSearch from '../components/ExerciseSearch'
import VideoPlayer from '../components/VideoPlayer'

const ROUTINE_COLORS = [
    '#ef4444', '#f97316', '#eab308', '#10b981', '#0ea5e9', '#8b5cf6', '#ec4899',
]

function abbr(name) {
    const words = name.trim().split(/\s+/)
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase()
    return (words[0][0] + words[1][0]).toUpperCase()
}

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
    const [completedVideos, setCompletedVideos] = useState([])
    const [selectedVideo, setSelectedVideo] = useState(null)
    const [showAllRoutines, setShowAllRoutines] = useState(false)

    useEffect(() => {
        try {
            const raw = localStorage.getItem('gymtrack_completed_videos')
            if (raw) {
                const parsed = JSON.parse(raw)
                // Filter out the old string items just in case 
                const valid = parsed.filter(v => typeof v === 'object' && v.yt)
                setCompletedVideos(valid)
            }
        } catch { }
    }, [])

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
        setRoutineName('')
        setRoutineColor(ROUTINE_COLORS[5])
        setSelectedExercises([])
        setEditingRoutineId(null)
        setShowCreate(false)
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
                    className="btn btn-full"
                    onClick={onResumeWorkout}
                    style={{ marginBottom: 'var(--space-6)', backgroundColor: 'var(--success)', borderColor: 'var(--success)', color: 'white' }}
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
                            setShowCreate(false)
                            setEditingRoutineId(null)
                            setRoutineName('')
                            setSelectedExercises([])
                            setRoutineColor(ROUTINE_COLORS[5])
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
                <div className="create-form" style={{ marginBottom: 'var(--space-4)', marginTop: 0 }}>
                    <div className="create-form-title">{editingRoutineId ? 'Modifica Routine' : 'Nuova Routine'}</div>

                    <input
                        className="input"
                        type="text"
                        placeholder="Nome routine (es. Push Day, Gambe...)"
                        value={routineName}
                        onChange={(e) => setRoutineName(e.target.value)}
                        style={{ marginBottom: 'var(--space-3)' }}
                    />

                    {/* Color Picker */}
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                        <div className="create-form-section-label" style={{ marginBottom: 8 }}>Colore Etichetta</div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {ROUTINE_COLORS.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setRoutineColor(c)}
                                    style={{
                                        width: 30, height: 30, borderRadius: '50%',
                                        backgroundColor: c,
                                        border: routineColor === c ? '2px solid white' : '2px solid transparent',
                                        boxShadow: routineColor === c ? `0 0 0 2px ${c}` : 'none',
                                        cursor: 'pointer', transition: 'all 0.2s', padding: 0,
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Selected exercises */}
                    {selectedExercises.length > 0 && (
                        <div style={{ marginBottom: 'var(--space-3)' }}>
                            <div className="create-form-section-label">Esercizi ({selectedExercises.length})</div>
                            {selectedExercises.map((ex, idx) => (
                                <div key={idx} className="routine-exercise-item">
                                    <div className="routine-exercise-icon">
                                        {ex.image ? (
                                            <img src={ex.image} alt="" className="routine-exercise-img" />
                                        ) : abbr(ex.name)}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{ex.name}</div>
                                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{ex.category}</div>
                                    </div>
                                    <div className="routine-sets-control">
                                        <button className="routine-sets-btn" onClick={() => handleSetCount(idx, ex.setsCount - 1)}>−</button>
                                        <span className="routine-sets-value">{ex.setsCount}</span>
                                        <button className="routine-sets-btn" onClick={() => handleSetCount(idx, ex.setsCount + 1)}>+</button>
                                    </div>
                                    <button className="exercise-delete-btn" onClick={() => handleRemoveExercise(idx)}>✕</button>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        className="btn btn-secondary btn-full btn-sm"
                        onClick={() => setShowExercisePicker(true)}
                        style={{ marginBottom: 'var(--space-3)' }}
                    >
                        + Aggiungi Esercizio
                    </button>

                    <button
                        className="btn btn-primary btn-full"
                        onClick={handleSave}
                        disabled={!routineName.trim() || selectedExercises.length === 0}
                        style={{ opacity: (!routineName.trim() || selectedExercises.length === 0) ? 0.4 : 1 }}
                    >
                        Salva Routine
                    </button>
                </div>
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
                        const totalSets = routine.exercises.reduce((s, e) => s + e.setsCount, 0)
                        return (
                            <div key={routine.id} className="routine-card" style={{ borderLeft: `5px solid ${routine.color || 'var(--border)'}` }} onClick={() => setExpandedId(isExpanded ? null : routine.id)}>
                                <div className="routine-card-header">
                                    <div>
                                        <div className="routine-card-title">{routine.name}</div>
                                        <div className="routine-card-meta">
                                            {routine.exercises.length} esercizi · {totalSets} serie
                                        </div>
                                    </div>
                                    <button
                                        className="btn"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            if (hasActiveWorkout) {
                                                alert("Hai già un allenamento in corso. Terminalo prima di iniziarne uno nuovo.")
                                            } else {
                                                onStartFromRoutine(routine)
                                            }
                                        }}
                                        onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.88)'; e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)' }}
                                        onPointerUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.backgroundColor = 'var(--bg-input)' }}
                                        onPointerEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
                                        onPointerLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.backgroundColor = 'var(--bg-input)' }}
                                        style={{
                                            width: 44, height: 28, padding: 0, borderRadius: 99,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            backgroundColor: 'var(--bg-input)',
                                            border: 'none',
                                            color: 'var(--text-secondary)',
                                            opacity: hasActiveWorkout ? 0.4 : 1,
                                            cursor: hasActiveWorkout ? 'not-allowed' : 'pointer',
                                            transition: 'transform 0.15s ease, background-color 0.15s ease',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}>
                                            <polygon points="5 3 19 12 5 21 5 3" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Exercise preview tags */}
                                <div className="routine-card-tags">
                                    {routine.exercises.map((ex, i) => (
                                        <span key={i} className="history-tag">{ex.name}</span>
                                    ))}
                                </div>

                                {isExpanded && (
                                    <div className="history-expanded">
                                        {routine.exercises.map((ex, i) => (
                                            <div key={i} className="routine-detail-item">
                                                <span className="routine-detail-name">{ex.name}</span>
                                                <span className="routine-detail-sets">
                                                    {ex.setsCount} serie
                                                    {ex.targetRest && ex.targetRest !== 90 && (
                                                        <span style={{ marginLeft: 6, opacity: 0.7 }}>
                                                            · ⏱ {Math.floor(ex.targetRest / 60)}:{(ex.targetRest % 60).toString().padStart(2, '0')}
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        ))}

                                        {/* Actions */}
                                        <div className="history-actions" style={{ marginTop: 12 }}>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                style={{ flex: 1 }}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setEditingRoutineId(routine.id)
                                                    setRoutineName(routine.name)
                                                    setRoutineColor(routine.color || '#8b5cf6')
                                                    setSelectedExercises([...routine.exercises])
                                                    setShowCreate(true)
                                                    window.scrollTo({ top: 0, behavior: 'smooth' })
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
                                        </div>
                                    </div>
                                )}
                            </div>
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
                                const totalSets = routine.exercises.reduce((s, e) => s + e.setsCount, 0)
                                return (
                                    <div key={routine.id} className="routine-card" style={{ borderLeft: `5px solid ${routine.color || 'var(--border)'}` }} onClick={() => setExpandedId(isExpanded ? null : routine.id)}>
                                        <div className="routine-card-header">
                                            <div>
                                                <div className="routine-card-title">{routine.name}</div>
                                                <div className="routine-card-meta">
                                                    {routine.exercises.length} esercizi · {totalSets} serie
                                                </div>
                                            </div>
                                            <button
                                                className="btn"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (hasActiveWorkout) {
                                                        alert("Hai già un allenamento in corso. Terminalo prima di iniziarne uno nuovo.")
                                                    } else {
                                                        setShowAllRoutines(false)
                                                        onStartFromRoutine(routine)
                                                    }
                                                }}
                                                onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.88)'; e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)' }}
                                                onPointerUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.backgroundColor = 'var(--bg-input)' }}
                                                onPointerEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
                                                onPointerLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.backgroundColor = 'var(--bg-input)' }}
                                                style={{
                                                    width: 44, height: 28, padding: 0, borderRadius: 99,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    backgroundColor: 'var(--bg-input)',
                                                    border: 'none',
                                                    color: 'var(--text-secondary)',
                                                    opacity: hasActiveWorkout ? 0.4 : 1,
                                                    cursor: hasActiveWorkout ? 'not-allowed' : 'pointer',
                                                    transition: 'transform 0.15s ease, background-color 0.15s ease',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}>
                                                    <polygon points="5 3 19 12 5 21 5 3" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="routine-card-tags">
                                            {routine.exercises.map((ex, i) => (
                                                <span key={i} className="history-tag">{ex.name}</span>
                                            ))}
                                        </div>

                                        {isExpanded && (
                                            <div className="history-expanded">
                                                {routine.exercises.map((ex, i) => (
                                                    <div key={i} className="routine-detail-item">
                                                        <span className="routine-detail-name">{ex.name}</span>
                                                        <span className="routine-detail-sets">
                                                            {ex.setsCount} serie
                                                            {ex.targetRest && ex.targetRest !== 90 && (
                                                                <span style={{ marginLeft: 6, opacity: 0.7 }}>
                                                                    · ⏱ {Math.floor(ex.targetRest / 60)}:{(ex.targetRest % 60).toString().padStart(2, '0')}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                ))}

                                                <div className="history-actions" style={{ marginTop: 12 }}>
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        style={{ flex: 1 }}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setEditingRoutineId(routine.id)
                                                            setRoutineName(routine.name)
                                                            setRoutineColor(routine.color || '#8b5cf6')
                                                            setSelectedExercises([...routine.exercises])
                                                            setShowCreate(true)
                                                            setShowAllRoutines(false)
                                                            window.scrollTo({ top: 0, behavior: 'smooth' })
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
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Completed Videos Carousel inside Workout */}
            {completedVideos.length > 0 && !showCreate && (
                <div className="video-section" style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-5)' }}>
                    <div className="section-label" style={{ marginBottom: 'var(--space-2)' }}>Video Completati di Recente</div>
                    <div className="video-carousel">
                        {completedVideos.map(v => {
                            const thumb = `https://img.youtube.com/vi/${v.yt}/mqdefault.jpg`
                            return (
                                <div key={v.yt} className="video-card" onClick={() => setSelectedVideo(v)}>
                                    <div className="video-card-thumb">
                                        <img src={thumb} alt="" loading="lazy" />
                                        {v.dur && <div className="video-card-duration">{v.dur}</div>}
                                        <div className="video-card-completed">✓</div>
                                    </div>
                                    <div className="video-card-body">
                                        <div className="video-card-title" style={{ WebkitLineClamp: 1 }}>{v.title}</div>
                                        <div className="video-card-meta">
                                            {v.kcal > 0 && <span className="video-badge">🔥 {v.kcal}</span>}
                                            {v.cat && <span className="video-badge cat">{v.cat}</span>}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
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
