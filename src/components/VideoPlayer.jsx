import { useState, useEffect } from 'react'

export default function VideoPlayer({ video, onClose, onComplete, isCompleted }) {
    const [showPlayer, setShowPlayer] = useState(false)

    // Request landscape when video plays
    useEffect(() => {
        if (!showPlayer) return
        let locked = false
        try {
            const orientation = screen.orientation
            if (orientation?.lock) {
                orientation.lock('landscape').then(() => { locked = true }).catch(() => { })
            }
        } catch { }
        return () => {
            if (locked) {
                try { screen.orientation.unlock() } catch { }
            }
        }
    }, [showPlayer])

    if (!video) return null

    const thumb = `https://img.youtube.com/vi/${video.yt}/mqdefault.jpg`

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="video-player-modal" onClick={e => e.stopPropagation()}>
                <div className="video-player-header">
                    <button className="video-close-btn" onClick={onClose}>✕</button>
                </div>

                {/* Video embed */}
                <div className="video-player-embed">
                    {showPlayer ? (
                        <iframe
                            src={`https://www.youtube-nocookie.com/embed/${video.yt}?autoplay=1&rel=0`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="video-iframe"
                        />
                    ) : (
                        <div className="video-thumbnail-container" onClick={() => setShowPlayer(true)}>
                            <img src={thumb} alt="" className="video-thumbnail-large" />
                            <div className="video-play-btn">▶</div>
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="video-player-info">
                    <div className="video-player-title">{video.title}</div>
                    <div className="video-player-meta">
                        {video.dur && <span className="video-badge">{video.dur}</span>}
                        {video.kcal > 0 && <span className="video-badge">🔥 {video.kcal} kcal</span>}
                        {video.lvl && <span className="video-badge lvl">{video.lvl}</span>}
                        <span className="video-badge cat">{video.cat}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="video-player-actions">
                    <button
                        className={`btn ${isCompleted ? 'btn-secondary' : 'btn-primary'} btn-full`}
                        onClick={() => { if (!isCompleted) onComplete(video); }}
                    >
                        {isCompleted ? '✓ Completato' : '✓ Segna come completato'}
                    </button>
                </div>
            </div>
        </div>
    )
}
