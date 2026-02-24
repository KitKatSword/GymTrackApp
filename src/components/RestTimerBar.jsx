export default function RestTimerBar({ timer }) {
  const {
    isActive,
    isRunning,
    isFinished,
    remaining,
    duration,
    label,
    progress,
    dismiss,
    formatTime,
  } = timer;

  if (!isActive) return null;

  const fillPct = Math.max(0, Math.min(100, (1 - progress) * 100));

  return (
    <div className={`rest-timer-bar ${isFinished ? "timer-finished-glow" : ""}`}>
      {/* Progress line at top */}
      <div className="rest-timer-bar-progress">
        <div
          className="rest-timer-bar-fill"
          style={{
            width: `${fillPct}%`,
            background: isFinished ? "var(--success)" : undefined,
          }}
        />
      </div>

      {/* Label + time */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {label && <div className="rest-timer-label">{label}</div>}
        <div className={`rest-timer-time ${isFinished ? "finished" : ""}`}>
          {formatTime(remaining)}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
        <button
          className="rest-timer-control-btn"
          onClick={() => timer.adjust(-15)}
        >
          -15
        </button>

        <button
          className="rest-timer-control-btn"
          onClick={() => timer.adjust(15)}
        >
          +15
        </button>

        <button
          className="rest-timer-action-btn"
          style={{ background: isFinished ? "var(--success)" : "var(--accent)" }}
          onClick={dismiss}
        >
          {isFinished ? "Fatto" : "Salta"}
        </button>
      </div>
    </div>
  );
}
