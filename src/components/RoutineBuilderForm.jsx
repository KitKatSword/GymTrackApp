import { ROUTINE_COLORS } from '../constants/colors'
import { getInitials } from '../utils/text'

export default function RoutineBuilderForm({
    title,
    routineName,
    onRoutineNameChange,
    routineColor,
    onRoutineColorChange,
    selectedExercises,
    onSetCountChange,
    onRemoveExercise,
    onOpenExercisePicker,
    onSave,
    saveDisabled,
}) {
    return (
        <div className="create-form" style={{ marginBottom: 'var(--space-4)', marginTop: 0 }}>
            <div className="create-form-title">{title}</div>

            <input
                className="input"
                type="text"
                placeholder="Nome routine (es. Push Day, Gambe...)"
                value={routineName}
                onChange={(event) => onRoutineNameChange(event.target.value)}
                style={{ marginBottom: 'var(--space-3)' }}
            />

            <div style={{ marginBottom: 'var(--space-4)' }}>
                <div className="create-form-section-label" style={{ marginBottom: 8 }}>Colore Etichetta</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {ROUTINE_COLORS.map(color => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => onRoutineColorChange(color)}
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                backgroundColor: color,
                                border: routineColor === color ? '2px solid white' : '2px solid transparent',
                                boxShadow: routineColor === color ? `0 0 0 2px ${color}` : 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                padding: 0,
                            }}
                        />
                    ))}
                </div>
            </div>

            {selectedExercises.length > 0 && (
                <div style={{ marginBottom: 'var(--space-3)' }}>
                    <div className="create-form-section-label">Esercizi ({selectedExercises.length})</div>
                    {selectedExercises.map((exercise, index) => (
                        <div key={`${exercise.exerciseId || exercise.id || exercise.name}-${index}`} className="routine-exercise-item">
                            <div className="routine-exercise-icon">
                                {exercise.image ? (
                                    <img src={exercise.image} alt="" className="routine-exercise-img" />
                                ) : getInitials(exercise.name)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{exercise.name}</div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{exercise.category}</div>
                            </div>
                            <div className="routine-sets-control">
                                <button className="routine-sets-btn" onClick={() => onSetCountChange(index, exercise.setsCount - 1)}>−</button>
                                <span className="routine-sets-value">{exercise.setsCount}</span>
                                <button className="routine-sets-btn" onClick={() => onSetCountChange(index, exercise.setsCount + 1)}>+</button>
                            </div>
                            <button className="exercise-delete-btn" onClick={() => onRemoveExercise(index)}>✕</button>
                        </div>
                    ))}
                </div>
            )}

            <button
                className="btn btn-secondary btn-full btn-sm"
                onClick={onOpenExercisePicker}
                style={{ marginBottom: 'var(--space-3)' }}
            >
                + Aggiungi Esercizio
            </button>

            <button
                className="btn btn-primary btn-full"
                onClick={onSave}
                disabled={saveDisabled}
                style={{ opacity: saveDisabled ? 0.4 : 1 }}
            >
                Salva Routine
            </button>
        </div>
    )
}
