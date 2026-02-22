const PRESETS = [
    { label: '30s', seconds: 30 },
    { label: '1 min', seconds: 60 },
    { label: '1:30', seconds: 90 },
    { label: '2 min', seconds: 120 },
    { label: '3 min', seconds: 180 },
    { label: '5 min', seconds: 300 },
]

const CIRCUMFERENCE = 2 * Math.PI * 115

export default function Timer({ timer }) {
    const {
        duration, remaining, isRunning, isFinished, isVisible,
        progress, start, pause, resume, reset, stop, hide, setPreset, formatTime
    } = timer

    if (!isVisible) return null

    const dashOffset = CIRCUMFERENCE * (1 - progress)

    return (
        <div className="timer-overlay">
            <button className="btn btn-icon btn-ghost timer-close" onClick={hide}>✕</button>

            <div className={`timer-ring-container ${isFinished ? 'timer-finished' : ''}`}>
                <svg className="timer-ring" viewBox="0 0 240 240">
                    <defs>
                        <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#7c3aed" />
                            <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                    </defs>
                    <circle className="timer-ring-bg" cx="120" cy="120" r="115" />
                    <circle
                        className="timer-ring-progress"
                        cx="120" cy="120" r="115"
                        strokeDasharray={CIRCUMFERENCE}
                        strokeDashoffset={dashOffset}
                    />
                </svg>
                <div className="timer-display">
                    <div className="timer-time">{formatTime(remaining)}</div>
                    <div className="timer-label">
                        {isFinished ? '⏰ Tempo!' : isRunning ? 'Riposo' : 'Pausa'}
                    </div>
                </div>
            </div>

            <div className="timer-presets">
                {PRESETS.map(p => (
                    <button
                        key={p.seconds}
                        className={`chip ${duration === p.seconds && !isFinished ? 'active' : ''}`}
                        onClick={() => setPreset(p.seconds)}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            <div className="timer-controls">
                <button
                    className="btn btn-secondary timer-btn-secondary"
                    onClick={reset}
                >
                    🔄
                </button>
                <button
                    className="btn btn-primary timer-btn-main"
                    onClick={isRunning ? pause : (isFinished ? () => start(duration) : resume)}
                >
                    {isRunning ? '⏸' : (isFinished ? '🔁' : '▶️')}
                </button>
                <button
                    className="btn btn-secondary timer-btn-secondary"
                    onClick={stop}
                >
                    ⏹
                </button>
            </div>
        </div>
    )
}
