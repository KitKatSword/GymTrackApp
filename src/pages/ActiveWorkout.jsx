import { useState, useEffect, useRef } from "react";
import ExerciseCard from "../components/ExerciseCard";
import ExerciseSearch from "../components/ExerciseSearch";

export default function ActiveWorkout({
  workout,
  timer,
  onAddExercise,
  onRemoveExercise,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  onToggleSet,
  onUpdateNotes,
  onUpdateExerciseNotes,
  onFinish,
  onGoHome,
}) {
  const [showSearch, setShowSearch] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [activeRestSetId, setActiveRestSetId] = useState(null);
  const [localSessionNotes, setLocalSessionNotes] = useState(workout?.notes || '');
  const pausedAtRef = useRef(0);
  const pausedAccRef = useRef(0);

  // Elapsed timer with pause support
  useEffect(() => {
    if (!workout) return;
    if (paused) {
      pausedAtRef.current = Date.now();
      return;
    }

    const getStartMs = () => {
      if (workout.startTimestamp) return workout.startTimestamp;
      if (!workout.startTime) return Date.now();
      const [h, m] = workout.startTime.split(":").map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return d.getTime();
    };

    const startMs = getStartMs();

    const tick = () => {
      const raw = (Date.now() - startMs) / 1000;
      setElapsed(Math.max(0, Math.floor(raw) - pausedAccRef.current));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [workout?.startTime, workout?.startTimestamp, paused]);

  const handlePauseResume = () => {
    if (!paused) {
      setPaused(true);
    } else {
      const pausedSecs = Math.floor((Date.now() - pausedAtRef.current) / 1000);
      pausedAccRef.current += pausedSecs;
      setPaused(false);
    }
  };

  const fmt = (s) => {
    const m = Math.floor(s / 60),
      sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleStartRest = (exerciseName, setIndex, setId, duration) => {
    const label = `${exerciseName} — Set ${setIndex}`;
    setActiveRestSetId(setId);
    timer.start(duration, label);
  };

  // When timer is dismissed externally, clear active set
  useEffect(() => {
    if (!timer.isActive) setActiveRestSetId(null);
  }, [timer.isActive]);

  if (!workout) {
    return (
      <div className="page">
        <div className="empty-state">
          <svg
            className="icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M6.5 6.5h11v11h-11z" />
            <path d="M3 9h3m15 0h-3m-9-6v3m0 15v-3" />
          </svg>
          <div className="title">Nessun allenamento attivo</div>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginBottom: 20 }}>
            Inizia un allenamento dalla Home
          </p>
          <button className="btn btn-secondary" onClick={onGoHome}>
            Home
          </button>
        </div>
      </div>
    );
  }

  const totalCompleted = workout.exercises.reduce(
    (s, ex) => s + ex.sets.filter((st) => st.completed).length,
    0,
  );

  return (
    <div className={`page ${timer.isActive ? "has-rest-bar" : ""}`}>
      {/* Status bar */}
      <div className="workout-status-bar">
        <div>
          <div className="workout-status-label">Allenamento</div>
          <div className={`workout-elapsed ${paused ? "paused" : ""}`}>
            {fmt(elapsed)}
            {paused ? " — Pausa" : ""}
          </div>
        </div>

        <div className="workout-status-right">
          <div className="workout-sets-count">
            <div className="workout-sets-value">{totalCompleted}</div>
            <div className="workout-sets-label">SERIE</div>
          </div>

          <button
            className="workout-pause-btn"
            onClick={handlePauseResume}
            title={paused ? "Riprendi" : "Pausa"}
          >
            {paused ? "▶" : "⏸"}
          </button>

          <button
            className="btn btn-danger btn-sm"
            onClick={() => setShowFinishConfirm(true)}
            style={{ minHeight: 36, padding: "0 14px", fontWeight: 700 }}
          >
            Fine
          </button>
        </div>
      </div>

      {/* Exercise list */}
      {workout.exercises.map((ex) => (
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
          activeRestSetId={activeRestSetId}
        />
      ))}

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
      <button
        className="add-exercise-btn"
        onClick={() => setShowSearch(true)}
      >
        + Aggiungi Esercizio
      </button>

      {/* Exercise search */}
      {showSearch && (
        <ExerciseSearch
          onSelect={(ex) => onAddExercise(workout.id, ex)}
          onClose={() => setShowSearch(false)}
        />
      )}

      {/* Finish confirm */}
      {showFinishConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setShowFinishConfirm(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ fontWeight: 700, fontSize: "var(--text-lg)", marginBottom: 8 }}>
              Termina allenamento?
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
              {totalCompleted} serie completate · {workout.exercises.length}{" "}
              esercizi · {fmt(elapsed)}
            </div>
            <div className="confirm-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowFinishConfirm(false)}
              >
                Annulla
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  onFinish(workout.id);
                  setShowFinishConfirm(false);
                }}
              >
                Termina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
