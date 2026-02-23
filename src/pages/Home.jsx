import { useState, useEffect, useCallback, useRef } from 'react'
import VideoPlayer from '../components/VideoPlayer'

const BASE = './fixfit/'

function getCompletedVideos() {
    try {
        return JSON.parse(localStorage.getItem('gymtrack_completed_videos') || '[]')
    } catch { return [] }
}

function markCompleted(ytId) {
    const completed = getCompletedVideos()
    if (!completed.includes(ytId)) {
        completed.push(ytId)
        localStorage.setItem('gymtrack_completed_videos', JSON.stringify(completed))
    }
    return [...completed]
}

export default function Home({ stats, todayWorkout, onStartWorkout, onResumeWorkout, onExport, onImport, theme, onToggleTheme, onLogVideo }) {
    const today = new Date()
    const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']
    const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']

    const [latestVideos, setLatestVideos] = useState([])
    const [categories, setCategories] = useState([])
    const [categoryVideos, setCategoryVideos] = useState({})
    const [completedVideos, setCompletedVideos] = useState(getCompletedVideos)
    const [selectedVideo, setSelectedVideo] = useState(null)
    const loadedCats = useRef(new Set())

    // Load index + latest on mount
    useEffect(() => {
        // Load latest videos for the hero carousel
        fetch(BASE + 'latest.json')
            .then(r => r.ok ? r.json() : [])
            .then(data => setLatestVideos(data))
            .catch(() => {
                // Fallback to old single file
                fetch('./fixfit-catalog.json')
                    .then(r => r.ok ? r.json() : [])
                    .then(data => setLatestVideos(data.slice(0, 30)))
                    .catch(() => setLatestVideos([]))
            })

        // Load category index
        fetch(BASE + 'index.json')
            .then(r => r.ok ? r.json() : [])
            .then(data => setCategories(data))
            .catch(() => setCategories([]))
    }, [])

    // Lazy load category videos when a category becomes visible
    const loadCategory = useCallback((slug, file) => {
        if (loadedCats.current.has(slug)) return
        loadedCats.current.add(slug)

        fetch(BASE + file)
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                setCategoryVideos(prev => ({ ...prev, [slug]: data }))
            })
            .catch(() => { })
    }, [])

    const handleComplete = useCallback((video) => {
        setCompletedVideos(markCompleted(video.yt))
        if (onLogVideo) onLogVideo(video)
    }, [onLogVideo])

    return (
        <div className="page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div className="page-subtitle">
                        {dayNames[today.getDay()]}, {today.getDate()} {monthNames[today.getMonth()]}
                    </div>
                    <div className="page-title">GymTrack</div>
                </div>
                <button className="theme-toggle" onClick={onToggleTheme} aria-label="Cambia tema">
                    {theme === 'dark' ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                        </svg>
                    ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Stats */}
            <div className="stat-grid">
                <div className="stat-card">
                    <div className="stat-value">{stats.streak}</div>
                    <div className="stat-label">Streak</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.thisWeekCount}</div>
                    <div className="stat-label">Settimana</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.totalSets}</div>
                    <div className="stat-label">Serie tot</div>
                </div>
            </div>

            {/* Active workout / start CTA */}
            {todayWorkout ? (
                <div className="active-workout-card">
                    <div className="active-workout-card-header">
                        <div>
                            <div className="active-workout-card-title">Allenamento in corso</div>
                            <div className="active-workout-card-subtitle">
                                Iniziato alle {todayWorkout.startTime}
                            </div>
                        </div>
                        <div className="pulse-dot" />
                    </div>
                    <div className="active-workout-card-meta">
                        {todayWorkout.exercises.length} esercizi · {todayWorkout.exercises.reduce((s, e) => s + e.sets.filter(st => st.completed).length, 0)} serie completate
                    </div>
                    <button className="btn btn-primary btn-full" onClick={onResumeWorkout}>
                        Continua →
                    </button>
                </div>
            ) : (
                <button
                    className="btn btn-primary btn-full btn-lg"
                    onClick={onStartWorkout}
                    style={{ marginBottom: 'var(--space-4)' }}
                >
                    Inizia Allenamento
                </button>
            )}

            {/* Follow Along — Latest */}
            {latestVideos.length > 0 && (
                <div className="video-section">
                    <div className="video-section-header">
                        <div className="video-section-title">📺 Follow Along</div>
                    </div>
                    <div className="video-carousel">
                        {latestVideos.map(v => (
                            <VideoCard
                                key={v.yt}
                                video={v}
                                isCompleted={completedVideos.includes(v.yt)}
                                onClick={() => setSelectedVideo(v)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Category carousels — loaded progressively */}
            {categories.map(cat => (
                <LazyCategory
                    key={cat.slug}
                    category={cat}
                    videos={categoryVideos[cat.slug]}
                    completedVideos={completedVideos}
                    onLoad={() => loadCategory(cat.slug, cat.file)}
                    onSelectVideo={setSelectedVideo}
                />
            ))}

            {/* Motivation card */}
            <div className="motivation-card">
                <div className="motivation-card-title">
                    {stats.totalWorkouts === 0
                        ? 'Inizia il tuo percorso'
                        : stats.streak >= 7
                            ? 'Settimana perfetta!'
                            : stats.streak >= 3
                                ? 'Grande costanza!'
                                : 'Continua così!'
                    }
                </div>
                <div className="motivation-card-subtitle">
                    {stats.totalWorkouts} allenamenti completati
                </div>
            </div>

            {/* Backup section */}
            <div className="backup-section">
                <div className="section-label">Backup Dati</div>
                <div className="backup-buttons">
                    <button className="btn btn-secondary btn-sm" onClick={onExport} style={{ flex: 1 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Esporta
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={onImport} style={{ flex: 1 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Importa
                    </button>
                </div>
            </div>

            {/* Video Player Modal */}
            {selectedVideo && (
                <VideoPlayer
                    video={selectedVideo}
                    onClose={() => setSelectedVideo(null)}
                    onComplete={handleComplete}
                    isCompleted={completedVideos.includes(selectedVideo.yt)}
                />
            )}
        </div>
    )
}

// Lazy-loading category carousel — loads JSON when scrolled into view
function LazyCategory({ category, videos, completedVideos, onLoad, onSelectVideo }) {
    const ref = useRef(null)

    useEffect(() => {
        if (!ref.current) return
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { onLoad(); observer.disconnect(); } },
            { rootMargin: '200px' }
        )
        observer.observe(ref.current)
        return () => observer.disconnect()
    }, [onLoad])

    const displayVideos = videos ? videos.slice(0, 20) : []

    return (
        <div className="video-section" ref={ref}>
            <div className="video-section-header">
                <div className="video-section-title">{category.name}</div>
                {category.count > 0 && (
                    <span className="video-section-count">{category.count} video</span>
                )}
            </div>
            {!videos ? (
                <div className="video-carousel">
                    {[1, 2, 3].map(i => <div key={i} className="video-card video-card-skeleton" />)}
                </div>
            ) : (
                <div className="video-carousel">
                    {displayVideos.map(v => (
                        <VideoCard
                            key={v.yt}
                            video={{ ...v, cat: category.name }}
                            isCompleted={completedVideos.includes(v.yt)}
                            onClick={() => onSelectVideo({ ...v, cat: category.name })}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

function VideoCard({ video, isCompleted, onClick }) {
    const thumb = `https://img.youtube.com/vi/${video.yt}/mqdefault.jpg`

    return (
        <div className="video-card" onClick={onClick}>
            <div className="video-card-thumb">
                <img src={thumb} alt="" loading="lazy" />
                {video.dur && <div className="video-card-duration">{video.dur}</div>}
                {isCompleted && <div className="video-card-completed">✓</div>}
            </div>
            <div className="video-card-body">
                <div className="video-card-title">{video.title}</div>
                <div className="video-card-meta">
                    {video.kcal > 0 && <span className="video-badge">🔥 {video.kcal}</span>}
                    {video.lvl && <span className="video-badge lvl">{video.lvl}</span>}
                    {video.cat && <span className="video-badge cat">{video.cat}</span>}
                </div>
            </div>
        </div>
    )
}
