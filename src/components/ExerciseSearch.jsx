import { useState, useMemo } from 'react'
import { getAllExercises, getCustomExercises, saveCustomExercise, deleteCustomExercise, categories, PARAM_TYPES } from '../data/exercises'

function generateId() {
    return 'custom-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

function abbr(str) {
    const words = str.trim().split(/\s+/)
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase()
    return (words[0][0] + words[1][0]).toUpperCase()
}

export default function ExerciseSearch({ onSelect, onClose }) {
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('Tutti')
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)

    const [newName, setNewName] = useState('')
    const [newParams, setNewParams] = useState(['weight', 'reps'])

    const allExercises = useMemo(() => getAllExercises(), [refreshKey])

    const filtered = useMemo(() => {
        return allExercises.filter(ex => {
            const matchCat = category === 'Tutti' || ex.category === category
            const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase())
            return matchCat && matchSearch
        })
    }, [search, category, allExercises])

    const toggleParam = (pid) =>
        setNewParams(prev => prev.includes(pid) ? prev.filter(p => p !== pid) : [...prev, pid])

    const handleCreate = () => {
        if (!newName.trim() || newParams.length === 0) return
        saveCustomExercise({
            id: generateId(),
            name: newName.trim(),
            emoji: '',
            category: 'Custom',
            params: newParams,
            isCustom: true,
        })
        setNewName(''); setNewParams(['weight', 'reps'])
        setShowCreateForm(false); setRefreshKey(k => k + 1)
    }

    const handleDelete = (e, id) => {
        e.stopPropagation()
        deleteCustomExercise(id)
        setRefreshKey(k => k + 1)
    }

    return (
        <div className="exercise-search">
            <div className="exercise-search-header">
                <button className="search-close-btn" onClick={onClose}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <input
                    className="input"
                    type="text"
                    placeholder="Cerca esercizio..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                />
            </div>

            <div className="category-chips">
                {categories.map(cat => (
                    <button
                        key={cat}
                        className={`chip ${category === cat ? 'active' : ''}`}
                        onClick={() => setCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Create custom exercise */}
            <div style={{ padding: '0 var(--space-4) var(--space-2)' }}>
                <button
                    className="create-exercise-toggle"
                    onClick={() => setShowCreateForm(!showCreateForm)}
                >
                    {showCreateForm ? '✕ Chiudi' : '+ Crea esercizio personalizzato'}
                </button>

                {showCreateForm && (
                    <div className="create-form">
                        <div className="create-form-title">Nuovo Esercizio</div>
                        <input
                            className="input"
                            type="text"
                            placeholder="Nome esercizio..."
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            style={{ marginBottom: 'var(--space-3)' }}
                        />

                        <div className="create-form-section">
                            <div className="create-form-section-label">Parametri da tracciare</div>
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
                        </div>

                        <button
                            onClick={handleCreate}
                            className="btn btn-primary btn-full"
                            disabled={!newName.trim() || newParams.length === 0}
                            style={{ opacity: (!newName.trim() || newParams.length === 0) ? 0.45 : 1 }}
                        >
                            Crea
                        </button>
                    </div>
                )}
            </div>

            <div className="exercise-list">
                {filtered.map(ex => (
                    <div
                        key={ex.id}
                        className="exercise-list-item"
                        onClick={() => { onSelect(ex); onClose() }}
                    >
                        <div className="exercise-list-icon">{abbr(ex.name)}</div>
                        <div className="info">
                            <div className="name">
                                {ex.name}
                                {ex.isCustom && (
                                    <span className="custom-badge">CUSTOM</span>
                                )}
                            </div>
                            <div className="category">
                                {ex.category}
                                {ex.params && (
                                    <span style={{ marginLeft: 6, opacity: 0.7 }}>
                                        {ex.params.map(p => PARAM_TYPES.find(pt => pt.id === p)?.label).join(' · ')}
                                    </span>
                                )}
                            </div>
                        </div>
                        {ex.isCustom && (
                            <button
                                className="exercise-delete-btn"
                                onClick={(e) => handleDelete(e, ex.id)}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="empty-state">
                        <svg className="icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        <div className="title">Nessun esercizio trovato</div>
                    </div>
                )}
            </div>
        </div>
    )
}
