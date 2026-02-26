import { useState } from "react";
import { PARAM_TYPES } from "../data/exercises";
import TimePickerModal from "./TimePickerModal";

function getParamLabel(p) {
    switch (p) {
        case "weight":
            return "KG";
        case "reps":
            return "REPS";
        case "time":
            return "SEC";
        default:
            return p.toUpperCase();
    }
}

function getParamInputMode(p) {
    return p === "weight" ? "decimal" : "numeric";
}

function formatMinSec(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function ExerciseCard({
    exercise,
    workoutId,
    onAddSet,
    onRemoveSet,
    onUpdateSet,
    onToggleSet,
    onRemoveExercise,
    onStartRest,
    onUpdateNotes,
    onUpdateExerciseRest,
    activeRestSetId,
}) {
    const targetRest = exercise.targetRest || 90;
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [localNotes, setLocalNotes] = useState(exercise.notes || '');

    const params = exercise.params || ["weight", "reps"];
    const gridTemplate = `28px ${params.map(() => "1fr").join(" ")} 36px`;

    const isResting = exercise.sets.some(s => s.id === activeRestSetId);

    const handleNotesBlur = () => {
        if (onUpdateNotes) onUpdateNotes(workoutId, exercise.id, localNotes);
    };

    return (
        <div className={`exercise-card ${isResting ? "resting" : ""}`}>
            <div className="exercise-header">
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="exercise-name">{exercise.name}</div>
                    <div className="exercise-category-badge">
                        {exercise.category}
                        {exercise.isCustom ? " · Custom" : ""}
                    </div>
                </div>

                <button
                    className="exercise-rest-settings"
                    onClick={() => setShowTimePicker(true)}
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    {formatMinSec(targetRest)}
                </button>

                <button
                    className="exercise-delete-btn"
                    onClick={() => onRemoveExercise(workoutId, exercise.id)}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M9 6V4h6v2" />
                    </svg>
                </button>
            </div>

            {showTimePicker && (
                <TimePickerModal
                    initialSeconds={targetRest}
                    onClose={() => setShowTimePicker(false)}
                    onSave={(val) => {
                        if (onUpdateExerciseRest) {
                            onUpdateExerciseRest(workoutId, exercise.id, val);
                        }
                        setShowTimePicker(false);
                    }}
                />
            )}

            {/* Header row */}
            <div
                className="set-row"
                style={{
                    gridTemplateColumns: gridTemplate,
                    borderBottom: "1px solid var(--border)",
                }}
            >
                <div className="set-label">#</div>
                {params.map((p) => (
                    <div key={p} className="set-label">
                        {getParamLabel(p)}
                    </div>
                ))}
                <div className="set-label">✓</div>
            </div>

            {exercise.sets.map((set, idx) => {
                const isRestingThis = activeRestSetId === set.id;
                return (
                    <div
                        key={set.id}
                        className="set-row"
                        style={{ gridTemplateColumns: gridTemplate }}
                    >
                        <div className={`set-number ${isRestingThis ? "resting" : ""}`}>
                            {idx + 1}
                        </div>

                        {params.map((p) => (
                            <div key={p} className="set-input-group">
                                <input
                                    type="number"
                                    inputMode={getParamInputMode(p)}
                                    className="input input-number"
                                    value={set[p] ?? ""}
                                    onChange={(e) =>
                                        onUpdateSet(
                                            workoutId,
                                            exercise.id,
                                            set.id,
                                            p,
                                            e.target.value,
                                        )
                                    }
                                    placeholder="—"
                                />
                            </div>
                        ))}

                        <button
                            className={`check-btn ${set.completed ? "checked" : ""}`}
                            onClick={() => {
                                onToggleSet(workoutId, exercise.id, set.id);
                                if (!set.completed) {
                                    onStartRest(exercise.name, idx + 1, set.id, targetRest);
                                }
                            }}
                        >
                            {set.completed ? "✓" : ""}
                        </button>
                    </div>
                );
            })}

            <button
                className="exercise-add-set-btn"
                onClick={() => onAddSet(workoutId, exercise.id)}
            >
                + Aggiungi Serie
            </button>

            <div style={{ marginTop: 6 }}>
                <input
                    type="text"
                    className="workout-note"
                    placeholder="Nota esercizio..."
                    value={localNotes}
                    onChange={(e) => setLocalNotes(e.target.value)}
                    onBlur={handleNotesBlur}
                />
            </div>
        </div>
    );
}
