import { useState } from "react";
import ExerciseCard from "../components/ExerciseCard";
import EmomCard from "../components/EmomCard";
import ExerciseSearch from "../components/ExerciseSearch";
import { getWorkoutCompletedSetCount } from "../utils/workouts";

const MONTHS_SHORT = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

function formatDate(ds) {
    const d = new Date(ds + 'T12:00:00');
    const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    return `${days[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

// Calendar mini SVG icon
const CalendarIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

// Save icon SVG
const SaveIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
    </svg>
);

export default function LogPastWorkout({
    workout,
    onAddExercise,
    onRemoveExercise,
    onAddSet,
    onRemoveSet,
    onUpdateSet,
    onToggleSet,
    onUpdateExerciseNotes,
    onUpdateExerciseRest,
    onUpdateEmom,
    onUpdateNotes,
    onFinish,
    onGoBack,
    onCreateRoutine,
    onLoadRoutine,
    routines,
}) {
    const [showSearch, setShowSearch] = useState(false);
    const [showFinishConfirm, setShowFinishConfirm] = useState(false);
    const [showRoutinePicker, setShowRoutinePicker] = useState(false);
    const [localSessionNotes, setLocalSessionNotes] = useState(workout?.notes || '');
    const [saveAsRoutine, setSaveAsRoutine] = useState(false);
    const [routineName, setRoutineName] = useState('');
    const [startTime, setStartTime] = useState(workout?.startTime || '09:00');
    const [endTime, setEndTime] = useState('10:00');

    if (!workout) {
        return (
            <div className="page">
                <div className="empty-state">
                    <div className="title">Nessun allenamento</div>
                    <button className="btn btn-secondary" onClick={onGoBack}>Indietro</button>
                </div>
            </div>
        );
    }

    const totalCompleted = getWorkoutCompletedSetCount(workout);

    const handleStartRest = () => { };

    const handleLoadRoutine = (routine) => {
        if (onLoadRoutine) {
            onLoadRoutine(workout.id, routine);
        }
        setShowRoutinePicker(false);
    };

    return (
        <div className="page">
            {/* Header */}
            <div className="log-past-header">
                <button className="btn btn-ghost" style={{ padding: '0 var(--space-2)', minHeight: 40 }} onClick={onGoBack}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
                <div style={{ flex: 1 }}>
                    <div className="page-title" style={{ fontSize: 'var(--text-xl)' }}>Registra Allenamento</div>
                    <div className="log-past-date-badge">
                        <CalendarIcon />
                        <span>{formatDate(workout.date)}</span>
                    </div>
                </div>
            </div>

            {/* Time inputs */}
            <div className="past-workout-time-bar">
                <div className="past-workout-time-group">
                    <label className="past-workout-time-label">Inizio</label>
                    <input
                        type="time"
                        className="past-workout-time-input"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                    />
                </div>
                <div className="past-workout-time-separator">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                </div>
                <div className="past-workout-time-group">
                    <label className="past-workout-time-label">Fine</label>
                    <input
                        type="time"
                        className="past-workout-time-input"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                    />
                </div>
            </div>

            {/* Quick routine loader */}
            {workout.exercises.length === 0 && routines && routines.length > 0 && (
                <div className="log-past-routine-section">
                    <div className="log-past-section-label">Carica da Routine</div>
                    <div className="log-past-routine-list">
                        {routines.map(r => (
                            <button
                                key={r.id}
                                className="log-past-routine-chip"
                                onClick={() => handleLoadRoutine(r)}
                                style={{ borderLeftColor: r.color || 'var(--border)' }}
                            >
                                <span className="log-past-routine-name">{r.name}</span>
                                <span className="log-past-routine-meta">{r.exercises.length} es.</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Exercise list */}
            {workout.exercises.map((ex) =>
                ex.isEmom ? (
                    <EmomCard
                        key={ex.id}
                        exercise={ex}
                        workoutId={workout.id}
                        onRemoveExercise={onRemoveExercise}
                        onUpdateEmom={onUpdateEmom}
                        onUpdateNotes={onUpdateExerciseNotes}
                        isPastLog={true}
                    />
                ) : (
                    <ExerciseCard
                        key={ex.id}
                        exercise={ex}
                        workoutId={workout.id}
                        onAddSet={onAddSet}
                        onRemoveSet={onRemoveSet}
                        onUpdateSet={onUpdateSet}
                        onToggleSet={onToggleSet}
                        onRemoveExercise={onRemoveExercise}
                        onStartRest={handleStartRest}
                        onUpdateNotes={onUpdateExerciseNotes}
                        onUpdateExerciseRest={onUpdateExerciseRest}
                        activeRestSetId={null}
                        isPastLog={true}
                    />
                )
            )}

            {/* Session Notes */}
            <div style={{ marginTop: 12, marginBottom: 8 }}>
                <input
                    type="text"
                    className="workout-note workout-note-session"
                    placeholder="Nota generale allenamento..."
                    value={localSessionNotes}
                    onChange={(e) => setLocalSessionNotes(e.target.value)}
                    onBlur={() => { if (onUpdateNotes) onUpdateNotes(workout.id, localSessionNotes) }}
                />
            </div>

            {/* Add exercise */}
            <button className="add-exercise-btn" onClick={() => setShowSearch(true)}>
                + Aggiungi Esercizio
            </button>

            {/* Save button */}
            <button
                className="btn btn-primary btn-full log-past-save-btn"
                onClick={() => setShowFinishConfirm(true)}
                disabled={workout.exercises.length === 0}
            >
                <SaveIcon />
                Salva Allenamento
            </button>

            {/* Exercise search */}
            {showSearch && (
                <ExerciseSearch
                    onSelect={(ex) => onAddExercise(workout.id, ex)}
                    onClose={() => setShowSearch(false)}
                />
            )}

            {/* Save confirm */}
            {showFinishConfirm && (
                <div className="modal-overlay" onClick={() => setShowFinishConfirm(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-handle" />
                        <div style={{ fontWeight: 700, fontSize: "var(--text-lg)", marginBottom: 8 }}>
                            Salva allenamento del {formatDate(workout.date)}?
                        </div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
                            {totalCompleted} serie completate · {workout.exercises.length} esercizi
                            <br />
                            Orario: {startTime} – {endTime}
                        </div>

                        {workout.exercises.length > 0 && (
                            <div style={{ marginTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', cursor: 'pointer', color: 'var(--text-primary)' }}>
                                    <input
                                        type="checkbox"
                                        checked={saveAsRoutine}
                                        onChange={(e) => setSaveAsRoutine(e.target.checked)}
                                        style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
                                    />
                                    <span style={{ fontWeight: 500 }}>Salva come nuova routine</span>
                                </label>
                                {saveAsRoutine && (
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Nome routine..."
                                        value={routineName}
                                        onChange={(e) => setRoutineName(e.target.value)}
                                        style={{ padding: '8px 12px', fontSize: 'var(--text-sm)', marginTop: 4 }}
                                    />
                                )}
                            </div>
                        )}

                        <div className="confirm-actions" style={{ marginTop: 'var(--space-4)' }}>
                            <button className="btn btn-secondary" onClick={() => setShowFinishConfirm(false)}>
                                Annulla
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    let finalName = null;
                                    if (saveAsRoutine) {
                                        finalName = routineName.trim() || `Routine del ${formatDate(workout.date)}`;
                                        if (onCreateRoutine) onCreateRoutine(finalName, workout.exercises);
                                    }
                                    onFinish(workout.id, startTime, endTime, finalName);
                                    setShowFinishConfirm(false);
                                }}
                            >
                                Salva
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
