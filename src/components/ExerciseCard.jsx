import { useEffect, useState } from "react";
import TimePickerModal from "./TimePickerModal";
import ExerciseSetupPanel from "./ExerciseSetupPanel";

function getParamLabel(p) {
    switch (p) {
        case "weight":
            return "KG";
        case "reps":
            return "REPS";
        case "time":
            return "SEC";
        case "rir":
            return "RIR";
        default:
            return p.toUpperCase();
    }
}

function getParamInputMode(p) {
    return p === "weight" || p === "rir" ? "decimal" : "numeric";
}

function getTrackingMode(params) {
    const hasReps = params.includes("reps");
    const hasRir = params.includes("rir");
    if (hasReps && hasRir) return "reps-rir";
    if (hasRir) return "rir";
    return hasReps ? "reps" : "none";
}

function applyTrackingMode(params, mode) {
    const base = params.filter(param => param !== "reps" && param !== "rir");
    if (mode === "none") return base;
    if (mode === "rir") return [...base, "rir"];
    if (mode === "reps-rir") return [...base, "reps", "rir"];
    return [...base, "reps"];
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
    onAddWarmupSet,
    onRemoveSet,
    onUpdateSet,
    onToggleSet,
    onRemoveExercise,
    onStartRest,
    onCancelRest,
    onUpdateNotes,
    onUpdateExerciseRest,
    onUpdateExerciseParams,
    activeRestSetId,
    isPastLog = false,
    setup = null,
    onSaveSetup,
}) {
    const targetRest = exercise.targetRest ?? 90;
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [localNotes, setLocalNotes] = useState(exercise.notes || '');
    const sets = Array.isArray(exercise.sets) ? exercise.sets : [];

    const params = exercise.params || ["weight", "reps"];
    const canRemoveSets = typeof onRemoveSet === "function";
    const gridTemplate = isPastLog
        ? `36px ${params.map(() => "1fr").join(" ")}${canRemoveSets ? " 32px" : ""}`
        : `28px ${params.map(() => "1fr").join(" ")} 36px${canRemoveSets ? " 32px" : ""}`;
    const canConfigureRir = params.some(param => ["weight", "reps", "rir"].includes(param));

    const isResting = sets.some(s => s.id === activeRestSetId);

    useEffect(() => {
        setLocalNotes(exercise.notes || '');
    }, [exercise.id, exercise.notes]);

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

            {canConfigureRir && onUpdateExerciseParams && (
                <label className="exercise-tracking-mode">
                    <span>Tracciamento</span>
                    <select
                        className="input"
                        value={getTrackingMode(params)}
                        onChange={(event) => onUpdateExerciseParams(
                            workoutId,
                            exercise.id,
                            applyTrackingMode(params, event.target.value),
                        )}
                    >
                        {params.some(param => param !== 'reps' && param !== 'rir') && (
                            <option value="none">Senza reps/RIR</option>
                        )}
                        <option value="reps">Ripetizioni</option>
                        <option value="reps-rir">Ripetizioni + RIR</option>
                        <option value="rir">Solo RIR</option>
                    </select>
                </label>
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
                {!isPastLog && <div className="set-label">✓</div>}
                {canRemoveSets && <div className="set-label"> </div>}
            </div>

            {sets.map((set, idx) => {
                const isRestingThis = activeRestSetId === set.id;
                const sameTypeIndex = sets
                    .slice(0, idx + 1)
                    .filter(candidate => Boolean(candidate.isWarmup) === Boolean(set.isWarmup))
                    .length;
                return (
                    <div
                        key={set.id}
                        className={`set-row ${set.isWarmup ? "warmup-set-row" : ""}`}
                        style={{ gridTemplateColumns: gridTemplate }}
                    >
                        <div className={`set-number ${isRestingThis ? "resting" : ""}`}>
                            {set.isWarmup ? `R${sameTypeIndex}` : sameTypeIndex}
                        </div>

                        {params.map((p) => (
                            <div key={p} className="set-input-group">
                                <input
                                    type="number"
                                    inputMode={getParamInputMode(p)}
                                    min="0"
                                    max={p === "rir" ? "10" : undefined}
                                    step={p === "weight" || p === "rir" ? "0.5" : "1"}
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
                                    onBlur={(event) => {
                                        if (p !== 'rir' || event.target.value === '') return
                                        const value = Number(event.target.value)
                                        if (!Number.isFinite(value)) return
                                        const clamped = Math.max(0, Math.min(10, value))
                                        if (clamped !== value) {
                                            onUpdateSet(workoutId, exercise.id, set.id, p, String(clamped))
                                        }
                                    }}
                                    placeholder="—"
                                />
                            </div>
                        ))}

                        {!isPastLog && (
                            <>
                                <button
                                    className={`check-btn ${set.completed ? "checked" : ""}`}
                                    onClick={() => {
                                        if (set.completed && onCancelRest) {
                                            onCancelRest(set.id);
                                        }
                                        onToggleSet(workoutId, exercise.id, set.id);
                                        if (!set.completed) {
                                            onStartRest(
                                                exercise.name,
                                                set.isWarmup ? `R${sameTypeIndex}` : sameTypeIndex,
                                                set.id,
                                                targetRest,
                                            );
                                        }
                                    }}
                                >
                                    {set.completed ? "✓" : ""}
                                </button>

                                {canRemoveSets && (
                                    <button
                                        type="button"
                                        className="set-remove-btn"
                                        aria-label={`Elimina ${set.isWarmup ? 'riscaldamento' : 'serie'} ${sameTypeIndex}`}
                                        onClick={() => {
                                            if (isRestingThis && onCancelRest) {
                                                onCancelRest(set.id);
                                            }
                                            onRemoveSet(workoutId, exercise.id, set.id);
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M18 6 6 18" />
                                            <path d="m6 6 12 12" />
                                        </svg>
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                );
            })}

            <div className="exercise-set-actions">
                {onAddWarmupSet && (
                    <button
                        className="exercise-add-set-btn warmup"
                        onClick={() => onAddWarmupSet(workoutId, exercise.id)}
                    >
                        + Riscaldamento
                    </button>
                )}
                <button
                    className="exercise-add-set-btn"
                    onClick={() => onAddSet(workoutId, exercise.id)}
                >
                    + Serie
                </button>
            </div>

            <ExerciseSetupPanel
                exercise={exercise}
                setup={setup}
                onSave={onSaveSetup}
            />

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
