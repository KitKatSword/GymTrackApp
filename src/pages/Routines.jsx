import { useState, useMemo } from 'react'
import { getAllExercises, PARAM_TYPES } from '../data/exercises'
import ExerciseSearch from '../components/ExerciseSearch'

function abbr(name) {
    const words = name.trim().split(/\s+/)
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase()
    return (words[0][0] + words[1][0]).toUpperCase()
}

export default function Routines({ routines, onCreateRoutine, onDeleteRoutine, onStartFromRoutine }) {
    const [showCreate, setShowCreate] = useState(false)
    const [routineName, setRoutineName] = useState('')
    const [selectedExercises, setSelectedExercises] = useState([])
    const [showExercisePicker, setShowExercisePicker] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [expandedId, setExpandedId] = useState(null)

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
        onCreateRoutine(routineName.trim(), selectedExercises)
        setRoutineName('')
        setSelectedExercises([])
        setShowCreate(false)
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
                onClick={() => setShowCreate(!showCreate)}
                style={{ marginBottom: 'var(--space-4)' }}
            >
                {showCreate ? '✕ Chiudi' : '+ Nuova Routine'}
            </button>

            {/* Create form */}
            {showCreate && (
                <div className="create-form" style={{ marginBottom: 'var(--space-4)', marginTop: 0 }}>
                    <div className="create-form-title">Nuova Routine</div>

                    <input
                        className="input"
                        type="text"
                        placeholder="Nome routine (es. Push Day, Gambe...)"
                        value={routineName}
                        onChange={(e) => setRoutineName(e.target.value)}
                        style={{ marginBottom: 'var(--space-3)' }}
                    />

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
                    {routines.length > 0 && <div className="section-label">Le tue routine ({routines.length})</div>}
                    {routines.map(routine => {
                        const isExpanded = expandedId === routine.id
                        const totalSets = routine.exercises.reduce((s, e) => s + e.setsCount, 0)
                        return (
                            <div key={routine.id} className="routine-card" onClick={() => setExpandedId(isExpanded ? null : routine.id)}>
                                <div className="routine-card-header">
                                    <div>
                                        <div className="routine-card-title">{routine.name}</div>
                                        <div className="routine-card-meta">
                                            {routine.exercises.length} esercizi · {totalSets} serie
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={(e) => { e.stopPropagation(); onStartFromRoutine(routine) }}
                                        style={{ minHeight: 34, padding: '0 14px' }}
                                    >
                                        Inizia
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
                                                <span className="routine-detail-sets">{ex.setsCount} serie</span>
                                            </div>
                                        ))}
                                        <div className="history-actions">
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
        </div>
    )
}
