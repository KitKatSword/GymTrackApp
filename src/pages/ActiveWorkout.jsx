import { useState, useEffect, useRef } from "react";
import ExerciseCard from "../components/ExerciseCard";
import EmomCard from "../components/EmomCard";
import VideoExerciseCard from "../components/VideoExerciseCard";
import ExerciseSearch from "../components/ExerciseSearch";
import { getExerciseSets } from "../utils/workouts";

function getWorkoutStartMs(workout) {
  if (workout?.startTimestamp) return workout.startTimestamp;
  if (!workout?.startTime) return Date.now();

  const [h, m] = workout.startTime.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

function getElapsedSeconds(workout, isPaused, pausedAt, pausedAcc) {
  if (!workout) return 0;

  const compareTime = isPaused && pausedAt ? pausedAt : Date.now();
  const raw = (compareTime - getWorkoutStartMs(workout)) / 1000;
  return Math.max(0, Math.floor(raw) - (pausedAcc || 0));
}

function getExerciseStructureSignature(exercise) {
  if (!exercise) return null;

  const isEmom = exercise.isEmom || exercise.params?.includes("emom");
  if (isEmom) {
    const blocks = Array.isArray(exercise.emomBlocks) ? exercise.emomBlocks : [];
    const normalizedBlocks = blocks.map(block => ({
      minutes: Math.max(1, Number(block?.minutes) || 1),
      reps: Math.max(1, Number(block?.reps) || 1),
    }));

    return {
      name: exercise.name,
      isEmom: true,
      blocks: normalizedBlocks,
    };
  }

  return {
    name: exercise.name,
    isEmom: false,
    setsCount: exercise.setsCount || getExerciseSets(exercise).length,
  };
}

export default function ActiveWorkout({
  workout,
  routines,
  timer,
  onAddExercise,
  onRemoveExercise,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  onToggleSet,
  onUpdateNotes,
  onUpdateExerciseNotes,
  onUpdateExerciseRest,
  onUpdateEmom,
  onUpdateTimerState,
  onFinish,
  onGoBack,
  onCreateRoutine,
}) {
  const [showSearch, setShowSearch] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(workout?.isPaused || false);
  const [activeRestSetId, setActiveRestSetId] = useState(null);
  const [localSessionNotes, setLocalSessionNotes] = useState(workout?.notes || '');
  const [saveAsRoutine, setSaveAsRoutine] = useState(false);
  const [routineName, setRoutineName] = useState('');
  const pausedAtRef = useRef(workout?.pausedAt || 0);
  const pausedAccRef = useRef(workout?.pausedAcc || 0);

  // Sync state if workout changes (e.g. initial mount or resume after tab switch)
  useEffect(() => {
    if (workout) {
      if (workout.isPaused !== undefined && workout.isPaused !== paused) setPaused(workout.isPaused);
      if (workout.pausedAt !== undefined) pausedAtRef.current = workout.pausedAt;
      if (workout.pausedAcc !== undefined) pausedAccRef.current = workout.pausedAcc;
      setLocalSessionNotes(workout.notes || "");
      setElapsed(getElapsedSeconds(workout, !!workout.isPaused, workout.pausedAt, workout.pausedAcc));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workout?.id, workout?.notes, workout?.isPaused, workout?.pausedAt, workout?.pausedAcc]);

  // Elapsed timer with pause support
  useEffect(() => {
    if (!workout) return;
    if (paused) return;

    const tick = () => {
      setElapsed(getElapsedSeconds(workout, false, null, pausedAccRef.current));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [workout?.startTime, workout?.startTimestamp, paused]);

  const handlePauseResume = (forcePaused) => {
    const isBool = typeof forcePaused === 'boolean';
    const shouldPause = isBool ? forcePaused : !paused;

    if (shouldPause && !paused) {
      const now = Date.now();
      pausedAtRef.current = now;
      setPaused(true);
      if (onUpdateTimerState && workout) {
        onUpdateTimerState(workout.id, { isPaused: true, pausedAt: now });
      }
    } else if (!shouldPause && paused) {
      const now = Date.now();
      const pausedSecs = Math.floor((now - pausedAtRef.current) / 1000);
      pausedAccRef.current += pausedSecs;
      setPaused(false);
      if (onUpdateTimerState && workout) {
        onUpdateTimerState(workout.id, { isPaused: false, pausedAt: null, pausedAcc: pausedAccRef.current });
      }
    }
  };

  // Sync EMOM pause with main workout timer
  const handleEmomPause = (emomIsPaused) => {
    handlePauseResume(emomIsPaused);
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

  const handleCancelRest = (setId) => {
    if (activeRestSetId !== setId) return;
    timer.dismiss();
    setActiveRestSetId(null);
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
          <button className="btn btn-secondary" onClick={onGoBack}>
            Indietro
          </button>
        </div>
      </div>
    );
  }

  const totalCompleted = workout.exercises.reduce(
    (s, ex) => s + getExerciseSets(ex).filter((st) => st.completed).length,
    0,
  );

  const isWorkoutIdenticalToRoutine = (currentWorkout, existingRoutines) => {
    if (!currentWorkout) return false;

    // An empty workout shouldn't be saved as a new routine
    if (!currentWorkout.exercises || currentWorkout.exercises.length === 0) return true;

    // Safely check against routines
    if (!existingRoutines || existingRoutines.length === 0) return false;

    return existingRoutines.some(routine => {
      if (!routine.exercises || routine.exercises.length !== currentWorkout.exercises.length) return false;

      return routine.exercises.every((routineEx, index) => {
        const workoutEx = currentWorkout.exercises[index];
        const routineSig = getExerciseStructureSignature(routineEx);
        const workoutSig = getExerciseStructureSignature(workoutEx);

        if (!routineSig || !workoutSig) return false;
        if (routineSig.name !== workoutSig.name || routineSig.isEmom !== workoutSig.isEmom) return false;

        if (routineSig.isEmom) {
          if (routineSig.blocks.length !== workoutSig.blocks.length) return false;
          return routineSig.blocks.every((block, blockIndex) => {
            const workoutBlock = workoutSig.blocks[blockIndex];
            return block.minutes === workoutBlock.minutes && block.reps === workoutBlock.reps;
          });
        }

        return routineSig.setsCount === workoutSig.setsCount;
      });
    });
  };

  const isIdentical = isWorkoutIdenticalToRoutine(workout, routines);

  return (
    <div className={`page ${timer.isActive ? "has-rest-bar" : ""}`}>
      {/* Header Secondary Interface */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <button
          className="btn btn-ghost"
          style={{ padding: '0 var(--space-2)', minHeight: 40 }}
          onClick={onGoBack}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <div className="page-title" style={{ fontSize: 'var(--text-xl)' }}>Allenamento Attivo</div>
      </div>

      {/* Status bar */}
      <div className="workout-status-bar" style={{ padding: 'var(--space-3) var(--space-4)' }}>
        <div>
          <div className="workout-status-label" style={{ color: paused ? 'var(--warning)' : 'var(--text-muted)' }}>
            {paused ? "In Pausa" : "Tempo"}
          </div>
          <div className={`workout-elapsed ${paused ? "paused" : ""}`} style={{ color: paused ? 'var(--warning)' : 'var(--text-primary)' }}>
            {fmt(elapsed)}
          </div>
        </div>

        <div className="workout-status-right">
          <button
            className="workout-pause-btn"
            onClick={handlePauseResume}
            title={paused ? "Riprendi" : "Pausa"}
            style={{
              borderColor: paused ? 'var(--warning)' : 'var(--border-accent)',
              color: paused ? 'var(--warning)' : 'var(--text-secondary)'
            }}
          >
            {paused ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
            )}
          </button>

          <button
            className="btn btn-stop-workout btn-sm"
            onClick={() => setShowFinishConfirm(true)}
            style={{ minHeight: 36, padding: "0 14px", fontWeight: 700 }}
          >
            Fine
          </button>
        </div>
      </div>

      {/* Exercise list */}
      {
        workout.exercises.map((ex) =>
          ex.isVideo || ex.videoYt ? (
            <VideoExerciseCard
              key={ex.id}
              exercise={ex}
              workoutId={workout.id}
              onToggleSet={onToggleSet}
              onRemoveExercise={onRemoveExercise}
              onUpdateNotes={onUpdateExerciseNotes}
            />
          ) : ex.isEmom ? (
            <EmomCard
              key={ex.id}
              exercise={ex}
              workoutId={workout.id}
              onRemoveExercise={onRemoveExercise}
              onUpdateEmom={onUpdateEmom}
              onUpdateNotes={onUpdateExerciseNotes}
              onEmomPause={handleEmomPause}
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
              onCancelRest={handleCancelRest}
              onUpdateNotes={onUpdateExerciseNotes}
              onUpdateExerciseRest={onUpdateExerciseRest}
              activeRestSetId={activeRestSetId}
            />
          )
        )
      }

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
      {
        showSearch && (
          <ExerciseSearch
            onSelect={(ex) => onAddExercise(workout.id, ex)}
            onClose={() => setShowSearch(false)}
          />
        )
      }

      {/* Finish confirm */}
      {
        showFinishConfirm && (
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

              {workout.exercises.length > 0 && !isIdentical && (
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
                      placeholder="Nome routine (es. Workout di oggi)"
                      value={routineName}
                      onChange={(e) => setRoutineName(e.target.value)}
                      style={{ padding: '8px 12px', fontSize: 'var(--text-sm)', marginTop: 4 }}
                    />
                  )}
                </div>
              )}

              <div className="confirm-actions" style={{ marginTop: 'var(--space-4)' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowFinishConfirm(false)}
                >
                  Annulla
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    let finalName = null;
                    if (saveAsRoutine) {
                      finalName = routineName.trim() || `Routine del ${new Date().toLocaleDateString()}`;
                      if (onCreateRoutine) onCreateRoutine(finalName, workout.exercises);
                    }
                    onFinish(workout.id, finalName);
                    setShowFinishConfirm(false);
                  }}
                >
                  Termina
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
