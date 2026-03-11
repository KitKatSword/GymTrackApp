import { useState, useEffect, useRef, useCallback } from "react";

/**
 * EmomCard - Componente per esercizi EMOM (Every Minute On the Minute)
 *
 * Persisted in exercise data (survives tab switch):
 *   exercise.emomBlocks = [{ minutes: 6, reps: 5 }, ...]
 *   exercise.emomWeight = "20"
 *   exercise.emomCompleted = true/false
 *   exercise.emomStartedAt = timestamp (ms) — when EMOM was started
 *   exercise.emomPausedAt = timestamp (ms) — when paused (null if running)
 *   exercise.emomPausedAcc = total ms accumulated in pauses
 */

function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Given totalElapsed seconds and blocks config, derive the current position.
 */
function derivePosition(blocks, elapsedSec) {
    if (elapsedSec < 10) {
        return {
            isPrep: true,
            blockIdx: 0,
            round: 0,
            secondsLeft: 10 - elapsedSec,
            finished: false,
        };
    }

    let remaining = elapsedSec - 10;
    for (let bi = 0; bi < blocks.length; bi++) {
        const blockTotalSec = blocks[bi].minutes * 60;
        if (remaining < blockTotalSec) {
            const roundInBlock = Math.floor(remaining / 60); // 0-indexed
            const secInRound = remaining % 60;
            return {
                isPrep: false,
                blockIdx: bi,
                round: roundInBlock + 1, // 1-indexed
                secondsLeft: 60 - secInRound,
                finished: false,
            };
        }
        remaining -= blockTotalSec;
    }
    return { isPrep: false, blockIdx: blocks.length - 1, round: blocks[blocks.length - 1].minutes, secondsLeft: 0, finished: true };
}

export default function EmomCard({
    exercise,
    workoutId,
    onRemoveExercise,
    onUpdateEmom,
    onUpdateNotes,
    onEmomPause,
    isPastLog = false,
}) {
    const [localNotes, setLocalNotes] = useState(exercise.notes || "");
    const [blocks, setBlocks] = useState(exercise.emomBlocks || [{ minutes: 10, reps: 5 }]);
    const [weight, setWeight] = useState(exercise.emomWeight || "");

    // Timer state derived from persisted timestamps
    const startedAt = exercise.emomStartedAt || null;
    const pausedAt = exercise.emomPausedAt || null;
    const pausedAcc = exercise.emomPausedAcc || 0;
    const isRunning = !!startedAt && !exercise.emomCompleted;
    const isPaused = isRunning && !!pausedAt;

    const [tick, setTick] = useState(0); // force re-render for timer
    const [isFinished, setIsFinished] = useState(exercise.emomCompleted || false);
    const intervalRef = useRef(null);
    const audioCtx = useRef(null);
    const prevPosRef = useRef(null);

    useEffect(() => {
        setLocalNotes(exercise.notes || "");
        setBlocks(exercise.emomBlocks || [{ minutes: 10, reps: 5 }]);
        setWeight(exercise.emomWeight || "");
        setIsFinished(exercise.emomCompleted || false);
    }, [exercise.id, exercise.notes, exercise.emomBlocks, exercise.emomWeight, exercise.emomCompleted]);

    const totalMinutes = blocks.reduce((s, b) => s + b.minutes, 0);
    const totalSeconds = totalMinutes * 60 + 10; // add 10 seconds prep
    const totalReps = blocks.reduce((s, b) => s + b.minutes * b.reps, 0);

    // Calculate elapsed seconds from persisted timestamps
    const getElapsedSec = useCallback(() => {
        if (!startedAt) return 0;
        const now = isPaused ? pausedAt : Date.now();
        const rawElapsed = now - startedAt - pausedAcc;
        return Math.max(0, Math.floor(rawElapsed / 1000));
    }, [startedAt, isPaused, pausedAt, pausedAcc]);

    const elapsedSec = getElapsedSec();
    const pos = derivePosition(blocks, elapsedSec);

    const getGlobalRound = (blockIdx, roundInBlock) => {
        let r = 0;
        for (let i = 0; i < blockIdx; i++) r += blocks[i].minutes;
        return r + roundInBlock;
    };

    const barProgress = totalSeconds > 0 ? Math.min(1, elapsedSec / totalSeconds) : 0;
    const globalRound = getGlobalRound(pos.blockIdx, pos.round);
    const currentBlock = blocks[pos.blockIdx];
    const progressPercent = isRunning ? (pos.isPrep ? ((10 - pos.secondsLeft) / 10) * 100 : ((60 - pos.secondsLeft) / 60) * 100) : 0;

    // Sync blocks/weight/timer changes to parent
    const syncToParent = useCallback(
        (data) => {
            if (onUpdateEmom) {
                onUpdateEmom(workoutId, exercise.id, data);
            }
        },
        [onUpdateEmom, workoutId, exercise.id]
    );

    const playSound = (type = 'countdown') => {
        try {
            if (!audioCtx.current) {
                audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = audioCtx.current;
            const playNote = (freq, duration, waveType = 'sine') => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = freq;
                osc.type = waveType;
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + duration);
            };

            if (type === 'countdown') {
                playNote(440, 0.15); // standard short beep
            } else if (type === 'start') {
                playNote(880, 0.5, 'triangle'); // high pitch start beep
            } else if (type === 'end') {
                playNote(300, 0.8, 'sawtooth'); // lower pitch end beep
            }
        } catch {
            // Audio not available
        }
    };

    // Tick timer (just forces re-render, state is derived from timestamps)
    useEffect(() => {
        if (!isRunning || isPaused) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }

        intervalRef.current = setInterval(() => {
            const elapsed = getElapsedSec();
            const p = derivePosition(blocks, elapsed);

            const prevP = prevPosRef.current;
            prevPosRef.current = p;

            // Beep at countdown
            if (p.secondsLeft <= 3 && p.secondsLeft > 0 && !p.finished) {
                playSound('countdown');
            } else if (prevP && !p.finished) {
                if (p.round > prevP.round || (!p.isPrep && prevP.isPrep)) {
                    playSound('start');
                }
            }

            // Check completion
            if (p.finished) {
                if (prevP && !prevP.finished) {
                    playSound('end');
                }
                clearInterval(intervalRef.current);
                setIsFinished(true);
                syncToParent({
                    emomBlocks: blocks,
                    emomWeight: weight,
                    emomCompleted: true,
                    emomStartedAt: null,
                    emomPausedAt: null,
                    emomPausedAcc: 0,
                });
                return;
            }

            setTick(t => t + 1);
        }, 1000);

        return () => clearInterval(intervalRef.current);
    }, [isRunning, isPaused, blocks, weight, getElapsedSec, syncToParent]);

    // On mount: check if was finished while away
    useEffect(() => {
        if (startedAt && !exercise.emomCompleted) {
            const elapsed = getElapsedSec();
            const p = derivePosition(blocks, elapsed);
            if (p.finished) {
                setIsFinished(true);
                syncToParent({
                    emomBlocks: blocks,
                    emomWeight: weight,
                    emomCompleted: true,
                    emomStartedAt: null,
                    emomPausedAt: null,
                    emomPausedAcc: 0,
                });
            }
        }
    }, []); // only on mount

    const handleStart = () => {
        const now = Date.now();
        setIsFinished(false);
        syncToParent({
            emomBlocks: blocks,
            emomWeight: weight,
            emomCompleted: false,
            emomStartedAt: now,
            emomPausedAt: null,
            emomPausedAcc: 0,
        });
    };

    const handlePause = () => {
        if (isPaused) {
            // Resume: accumulate paused time
            const newPausedAcc = pausedAcc + (Date.now() - pausedAt);
            syncToParent({
                emomPausedAt: null,
                emomPausedAcc: newPausedAcc,
            });
            if (onEmomPause) onEmomPause(false);
        } else {
            // Pause
            syncToParent({
                emomPausedAt: Date.now(),
            });
            if (onEmomPause) onEmomPause(true);
        }
    };

    const handleStop = () => {
        syncToParent({
            emomStartedAt: null,
            emomPausedAt: null,
            emomPausedAcc: 0,
            emomCompleted: false,
        });
        if (isPaused && onEmomPause) onEmomPause(false);
    };

    // Block management
    const addBlock = () => {
        const lastReps = blocks[blocks.length - 1].reps;
        const newBlocks = [...blocks, { minutes: 4, reps: Math.max(1, lastReps - 1) }];
        setBlocks(newBlocks);
        syncToParent({ emomBlocks: newBlocks });
    };

    const removeBlock = (idx) => {
        if (blocks.length <= 1) return;
        const newBlocks = blocks.filter((_, i) => i !== idx);
        setBlocks(newBlocks);
        syncToParent({ emomBlocks: newBlocks });
    };

    const updateBlock = (idx, field, value) => {
        const newBlocks = blocks.map((b, i) =>
            i === idx ? { ...b, [field]: Math.max(1, parseInt(value) || 1) } : b
        );
        setBlocks(newBlocks);
        syncToParent({ emomBlocks: newBlocks });
    };

    const handleWeightChange = (val) => {
        setWeight(val);
        syncToParent({ emomWeight: val });
    };

    const handleNotesBlur = () => {
        if (onUpdateNotes) onUpdateNotes(workoutId, exercise.id, localNotes);
    };

    return (
        <div className={`exercise-card emom-card ${isFinished ? "emom-completed" : ""} ${isRunning ? "emom-running" : ""}`}>
            {/* Animated left progress bar */}
            {isRunning && (
                <div className="emom-left-bar">
                    <div
                        className="emom-left-bar-fill"
                        style={{ height: `${(barProgress * 100).toFixed(2)}%` }}
                    />
                </div>
            )}

            {/* Header */}
            <div className="exercise-header">
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="exercise-name">
                        {exercise.name}
                        <span className="emom-badge">EMOM</span>
                    </div>
                    <div className="exercise-category-badge">
                        {totalMinutes} min · {totalReps} rep totali
                        {blocks.length > 1 && ` · ${blocks.length} blocchi`}
                    </div>
                </div>
                <button
                    className="exercise-delete-btn"
                    onClick={() => onRemoveExercise(workoutId, exercise.id)}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6" /><path d="M14 11v6" />
                        <path d="M9 6V4h6v2" />
                    </svg>
                </button>
            </div>

            {/* EMOM Blocks Configuration */}
            {!isRunning && !isFinished && (
                <div className="emom-config">
                    <div className="emom-config-title">Configurazione Blocchi</div>
                    {blocks.map((block, idx) => (
                        <div key={idx} className="emom-block-row">
                            <div className="emom-block-label">
                                {blocks.length > 1 ? `Blocco ${idx + 1}` : ""}
                            </div>
                            <div className="emom-block-inputs">
                                <div className="emom-input-group">
                                    <label className="emom-input-label">Min</label>
                                    <div className="emom-stepper">
                                        <button className="emom-stepper-btn" onClick={() => updateBlock(idx, "minutes", block.minutes - 1)}>−</button>
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            className="emom-stepper-value"
                                            value={block.minutes}
                                            onChange={(e) => updateBlock(idx, "minutes", e.target.value)}
                                        />
                                        <button className="emom-stepper-btn" onClick={() => updateBlock(idx, "minutes", block.minutes + 1)}>+</button>
                                    </div>
                                </div>
                                <span className="emom-separator">×</span>
                                <div className="emom-input-group">
                                    <label className="emom-input-label">Reps</label>
                                    <div className="emom-stepper">
                                        <button className="emom-stepper-btn" onClick={() => updateBlock(idx, "reps", block.reps - 1)}>−</button>
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            className="emom-stepper-value"
                                            value={block.reps}
                                            onChange={(e) => updateBlock(idx, "reps", e.target.value)}
                                        />
                                        <button className="emom-stepper-btn" onClick={() => updateBlock(idx, "reps", block.reps + 1)}>+</button>
                                    </div>
                                </div>
                                {blocks.length > 1 && (
                                    <button className="emom-block-remove" onClick={() => removeBlock(idx)}>✕</button>
                                )}
                            </div>
                        </div>
                    ))}
                    <button className="emom-add-block-btn" onClick={addBlock}>
                        + Aggiungi Blocco (Backoff)
                    </button>

                    {/* Optional weight */}
                    <div className="emom-weight-row">
                        <label className="emom-input-label">Peso (kg) — opzionale</label>
                        <input
                            type="number"
                            inputMode="decimal"
                            className="input input-number emom-weight-input"
                            placeholder="—"
                            value={weight}
                            onChange={(e) => handleWeightChange(e.target.value)}
                        />
                    </div>
                </div>
            )}

            {/* Timer Display (running) */}
            {isRunning && (
                <div className="emom-timer-display">
                    <div className="emom-progress-ring">
                        <svg viewBox="0 0 120 120" className="emom-ring-svg">
                            <circle cx="60" cy="60" r="52" className="emom-ring-bg" />
                            <circle
                                cx="60" cy="60" r="52"
                                className="emom-ring-fill"
                                style={{
                                    strokeDasharray: `${2 * Math.PI * 52}`,
                                    strokeDashoffset: `${2 * Math.PI * 52 * (1 - progressPercent / 100)}`,
                                }}
                            />
                        </svg>
                        <div className="emom-timer-text">
                            <div className="emom-timer-seconds" style={{ color: pos.isPrep ? 'var(--warning)' : 'inherit' }}>
                                {pos.isPrep ? pos.secondsLeft : formatTime(pos.secondsLeft)}
                            </div>
                            <div className="emom-timer-round" style={{ color: pos.isPrep ? 'var(--warning)' : 'inherit' }}>
                                {pos.isPrep ? "Preparazione" : `Round ${globalRound}/${totalMinutes}`}
                            </div>
                        </div>
                    </div>

                    <div className="emom-current-info">
                        {blocks.length > 1 && (
                            <div className="emom-current-block">
                                Blocco {pos.blockIdx + 1}/{blocks.length}
                            </div>
                        )}
                        <div className="emom-current-reps">
                            {pos.isPrep ? "Preparati..." : `${currentBlock.reps} reps${weight ? ` @ ${weight} kg` : ''}`}
                        </div>
                        {isPaused && (
                            <div className="emom-paused-label">In Pausa</div>
                        )}
                    </div>

                    <div className="emom-timer-controls">
                        <button className="emom-control-btn emom-pause" onClick={handlePause}>
                            {isPaused ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                            )}
                        </button>
                        <button className="emom-control-btn emom-stop" onClick={handleStop}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="2" /></svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Completed state */}
            {isFinished && !isRunning && (
                <div className="emom-completed-display">
                    <div className="emom-completed-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <div className="emom-completed-text">EMOM Completato!</div>
                    <div className="emom-completed-summary">
                        {blocks.map((b, i) => (
                            <span key={i} className="emom-summary-block">
                                {b.minutes}' × {b.reps} rep
                            </span>
                        ))}
                        {weight && <span className="emom-summary-weight">@ {weight} kg</span>}
                    </div>
                    <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => { setIsFinished(false); syncToParent({ emomCompleted: false }); }}>
                        Ripeti
                    </button>
                </div>
            )}

            {/* Start Button */}
            {!isRunning && !isFinished && !isPastLog && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button className="btn btn-primary btn-full" onClick={handleStart}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                        Avvia EMOM ({totalMinutes} min)
                    </button>
                </div>
            )}

            {/* Notes */}
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
