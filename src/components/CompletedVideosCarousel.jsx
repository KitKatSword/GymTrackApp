function CompletedVideoCard({ video, onSelect }) {
    const thumb = `https://img.youtube.com/vi/${video.yt}/mqdefault.jpg`

    return (
        <div className="video-card" onClick={() => onSelect(video)}>
            <div className="video-card-thumb">
                <img src={thumb} alt="" loading="lazy" />
                {video.dur && <div className="video-card-duration">{video.dur}</div>}
                <div className="video-card-completed">✓</div>
            </div>
            <div className="video-card-body">
                <div className="video-card-title" style={{ WebkitLineClamp: 1 }}>{video.title}</div>
                <div className="video-card-meta">
                    {video.kcal > 0 && <span className="video-badge">🔥 {video.kcal}</span>}
                    {video.cat && <span className="video-badge cat">{video.cat}</span>}
                </div>
            </div>
        </div>
    )
}

export default function CompletedVideosCarousel({ title, videos = [], onSelect, style = null }) {
    if (!videos.length) return null

    return (
        <div className="video-section" style={style}>
            <div className="section-label" style={{ marginBottom: 'var(--space-2)' }}>{title}</div>
            <div className="video-carousel">
                {videos.map(video => (
                    <CompletedVideoCard key={video.yt} video={video} onSelect={onSelect} />
                ))}
            </div>
        </div>
    )
}
