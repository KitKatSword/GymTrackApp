import { useEffect, useRef, useState } from 'react'

export default function ExerciseSetupPanel({ exercise, setup, onSave }) {
    const [expanded, setExpanded] = useState(false)
    const [note, setNote] = useState(setup?.note || '')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const fileRef = useRef(null)

    useEffect(() => {
        setNote(setup?.note || '')
    }, [setup?.note, exercise.id])

    if (!onSave) return null

    const save = async (updates) => {
        setBusy(true)
        setError('')
        try {
            await onSave(exercise, updates)
        } catch (saveError) {
            setError(saveError?.message || 'Impossibile salvare il setup.')
        } finally {
            setBusy(false)
        }
    }

    const handleFile = async (event) => {
        const file = event.target.files?.[0]
        if (file) await save({ photoFile: file, note })
        event.target.value = ''
    }

    return (
        <div className="exercise-setup-panel">
            <button
                type="button"
                className={`exercise-setup-toggle ${setup?.image || setup?.note ? 'has-setup' : ''}`}
                onClick={() => setExpanded(value => !value)}
            >
                <span>📷 Setup esercizio</span>
                <span>{expanded ? '−' : '+'}</span>
            </button>

            {expanded && (
                <div className="exercise-setup-content">
                    {setup?.image && (
                        <img
                            className="exercise-setup-image"
                            src={setup.image}
                            alt={`Setup ${exercise.name}`}
                        />
                    )}

                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFile}
                        hidden
                    />
                    <div className="exercise-setup-actions">
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            disabled={busy}
                            onClick={() => fileRef.current?.click()}
                        >
                            {setup?.image ? 'Cambia foto' : 'Aggiungi foto'}
                        </button>
                        {setup?.image && (
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                disabled={busy}
                                onClick={() => save({ removePhoto: true, note })}
                            >
                                Rimuovi
                            </button>
                        )}
                    </div>

                    <textarea
                        className="input exercise-setup-note"
                        rows="2"
                        placeholder="Es. anelli foro 6, safety pin 12, seduta altezza 4..."
                        value={note}
                        onChange={event => setNote(event.target.value)}
                        onBlur={() => {
                            if (note.trim() !== (setup?.note || '')) save({ note })
                        }}
                    />
                    {busy && <div className="media-status">Salvataggio…</div>}
                    {error && <div className="media-error">{error}</div>}
                </div>
            )}
        </div>
    )
}
