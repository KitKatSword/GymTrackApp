export default function RestTimerBar({ timer }) {
  const {
    isActive,
    isRunning,
    isFinished,
    remaining,
    duration,
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

      {/* Main row: -15 | TIME | +15 */}
      <div className="rest-timer-main-row">
        <button
          className="rest-timer-adjust-btn"
          onClick={() => timer.adjust(-15)}
        >
          <span className="rest-timer-adjust-icon">−</span>
          <span className="rest-timer-adjust-label">15s</span>
        </button>

        <div className={`rest-timer-time ${isFinished ? "finished" : ""}`}>
          {formatTime(remaining)}
        </div>

        <button
          className="rest-timer-adjust-btn"
          onClick={() => timer.adjust(15)}
        >
          <span className="rest-timer-adjust-icon">+</span>
          <span className="rest-timer-adjust-label">15s</span>
        </button>
      </div>

      {/* Skip / Done button */}
      <button
        className={`rest-timer-skip-btn ${isFinished ? "done" : ""}`}
        onClick={dismiss}
      >
        {isFinished ? "✓ Fatto" : "Salta riposo"}
      </button>
    </div>
  );
}
