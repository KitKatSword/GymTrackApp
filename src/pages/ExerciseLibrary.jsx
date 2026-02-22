import { useState, useMemo } from 'react'
import { getAllExercises, getCustomExercises, saveCustomExercise, deleteCustomExercise, PARAM_TYPES, categories } from '../data/exercises'

function generateId() {
    return 'custom-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

function abbr(name) {
    const words = name.trim().split(/\s+/)
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase()
    return (words[0][0] + words[1][0]).toUpperCase()
}

const CATEGORY_OPTIONS = categories.filter(c => c !== 'Tutti' && c !== 'Custom')

export default function ExerciseLibrary() {
    const [refreshKey, setRefreshKey] = useState(0)
    const [showForm, setShowForm] = useState(false)
    const [newName, setNewName] = useState('')
    const [newCategory, setNewCategory] = useState('Petto')
    const [newParams, setNewParams] = useState(['weight', 'reps'])
    const [filterCategory, setFilterCategory] = useState('Custom')
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    const customExercises = useMemo(() => getCustomExercises(), [refreshKey])

    const toggleParam = (pid) =>
        setNewParams(prev => prev.includes(pid) ? prev.filter(p => p !== pid) : [...prev, pid])

    const handleCreate = () => {
        if (!newName.trim() || newParams.length === 0) return
        saveCustomExercise({
            id: generateId(),
            name: newName.trim(),
            emoji: '',
            category: newCategory,
            params: newParams,
            isCustom: true,
        })
        setNewName(''); setNewParams(['weight', 'reps'])
        setShowForm(false); setRefreshKey(k => k + 1)
    }

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-title">Esercizi</div>
                <div className="page-subtitle">Libreria esercizi personalizzati</div>
            </div>

            {/* Create button */}
            <button
                className="btn btn-secondary btn-full"
                onClick={() => setShowForm(!showForm)}
                style={{ marginBottom: 'var(--space-4)' }}
            >
                {showForm ? '✕ Chiudi' : '+ Nuovo esercizio'}
            </button>

            {/* Create form */}
            {showForm && (
                <div className="create-form" style={{ marginBottom: 'var(--space-4)', marginTop: 0 }}>
                    <div className="create-form-title">Nuovo esercizio</div>

                    <input
                        className="input"
                        type="text"
                        placeholder="Nome..."
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        style={{ marginBottom: 'var(--space-3)' }}
                    />

                    {/* Category */}
                    <div className="create-form-section">
                        <div className="create-form-section-label">Categoria</div>
                        <div className="create-form-chips-wrap">
                            {CATEGORY_OPTIONS.map(c => (
                                <button
                                    key={c}
                                    className={`chip ${newCategory === c ? 'active' : ''}`}
                                    onClick={() => setNewCategory(c)}
                                    style={{ fontSize: 'var(--text-xs)', minHeight: 30, padding: '4px 10px' }}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Params */}
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                        <div className="create-form-section-label">Parametri</div>
                        <div className="create-form-chips">
                            {PARAM_TYPES.map(p => (
                                <button
                                    key={p.id}
                                    className={`chip ${newParams.includes(p.id) ? 'active' : ''}`}
                                    onClick={() => toggleParam(p.id)}
                                    style={{ flex: 1 }}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        {newParams.length === 0 && (
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)', marginTop: 4 }}>Seleziona almeno un parametro</div>
                        )}
                    </div>

                    <button
                        className="btn btn-primary btn-full"
                        onClick={handleCreate}
                        disabled={!newName.trim() || newParams.length === 0}
                        style={{ opacity: (!newName.trim() || newParams.length === 0) ? 0.4 : 1 }}
                    >
                        Crea esercizio
                    </button>
                </div>
            )}

            {/* Custom exercises list */}
            {customExercises.length === 0 ? (
                <div className="empty-state">
                    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                    <div className="title">Nessun esercizio custom</div>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Crea il primo esercizio personalizzato</p>
                </div>
            ) : (
                <>
                    <div className="section-label">
                        I tuoi esercizi ({customExercises.length})
                    </div>
                    {customExercises.map(ex => (
                        <div key={ex.id} className="library-item">
                            <div className="library-item-icon">{abbr(ex.name)}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: 'var(--text-md)' }}>{ex.name}</div>
                                <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                                    <span className="param-badge">{ex.category}</span>
                                    {(ex.params || []).map(p => {
                                        const pt = PARAM_TYPES.find(pt => pt.id === p)
                                        return pt ? <span key={p} className="param-badge">{pt.label}</span> : null
                                    })}
                                </div>
                            </div>
                            <button
                                className="exercise-delete-btn"
                                onClick={() => setDeleteConfirm(ex.id)}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </>
            )}

            {/* Delete confirm */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-handle" />
                        <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)', marginBottom: 8 }}>Elimina esercizio?</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>Questa azione non può essere annullata.</div>
                        <div className="confirm-actions">
                            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Annulla</button>
                            <button className="btn btn-danger" onClick={() => {
                                deleteCustomExercise(deleteConfirm)
                                setRefreshKey(k => k + 1)
                                setDeleteConfirm(null)
                            }}>Elimina</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
