import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import VideoPlayer from '../components/VideoPlayer'

const BASE = './fixfit/'

function getCompletedVideos() {
    try {
        const raw = localStorage.getItem('gymtrack_completed_videos')
        if (!raw) return []
        const parsed = JSON.parse(raw)
        // Convert old string format to object format if necessary
        return parsed.map(item => typeof item === 'string' ? { yt: item } : item)
    } catch { return [] }
}

function markCompleted(video) {
    const completed = getCompletedVideos()
    if (!completed.some(v => v.yt === video.yt)) {
        completed.push({
            yt: video.yt,
            title: video.title,
            dur: video.dur,
            kcal: video.kcal,
            cat: video.cat
        })
        localStorage.setItem('gymtrack_completed_videos', JSON.stringify(completed))
    }
    return [...completed]
}

export default function VideoLibrary({ onLogVideo }) {
    const [latestVideos, setLatestVideos] = useState([])
    const [categories, setCategories] = useState([])
    const [categoryVideos, setCategoryVideos] = useState({})
    const [completedVideos, setCompletedVideos] = useState(getCompletedVideos)
    const [selectedVideo, setSelectedVideo] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const loadedCats = useRef(new Set())

    useEffect(() => {
        // Load latest videos
        fetch(BASE + 'latest.json')
            .then(r => r.ok ? r.json() : [])
            .then(data => setLatestVideos(data))
            .catch(() => {
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
        setCompletedVideos(markCompleted(video))
        if (onLogVideo) onLogVideo(video)
    }, [onLogVideo])

    const completedIds = useMemo(() => completedVideos.map(v => v.yt), [completedVideos])

    // Flatten all loaded videos for search
    const allKnownVideos = useMemo(() => {
        const map = new Map()
        latestVideos.forEach(v => map.set(v.yt, v))
        Object.values(categoryVideos).flat().forEach(v => map.set(v.yt, v))
        return Array.from(map.values())
    }, [latestVideos, categoryVideos])

    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return []
        const q = searchQuery.toLowerCase()
        return allKnownVideos.filter(v => v.title.toLowerCase().includes(q))
    }, [searchQuery, allKnownVideos])

    return (
        <div className="page" style={{ overflowX: 'hidden' }}>
            <div className="page-header">
                <div className="page-title">Video Library</div>
                <div className="page-subtitle">Allenamenti guidati Fixfit</div>
            </div>

            {/* Search Bar */}
            <div style={{ padding: 'var(--space-2) var(--space-4)', margin: '0 calc(-1 * var(--space-4)) var(--space-4)', borderBottom: '1px solid var(--border)' }}>
                <input
                    type="text"
                    className="input"
                    placeholder="Cerca tra i video caricati..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Search Results */}
            {searchQuery.trim().length > 0 ? (
                <div className="video-section">
                    <div className="video-section-header">
                        <div className="video-section-title">Risultati Ricerca</div>
                        <span className="video-section-count">{searchResults.length} trovati</span>
                    </div>
                    {searchResults.length === 0 ? (
                        <div className="empty-state" style={{ padding: 'var(--space-6) 0' }}>
                            Nessun video trovato. Scorri le categorie per caricarne altri.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: 'var(--space-3)', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                            {searchResults.map(v => (
                                <div key={`search-${v.yt}`} style={{ display: 'flex' }}>
                                    <VideoCard
                                        video={v}
                                        isCompleted={completedIds.includes(v.yt)}
                                        onClick={() => setSelectedVideo(v)}
                                        style={{ width: '100%', maxWidth: 'none', margin: 0, minWidth: 0, flex: 1 }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* Follow Along — Latest */}
                    {latestVideos.length > 0 && (
                        <div className="video-section">
                            <div className="video-section-header">
                                <div className="video-section-title">🌟 Novità</div>
                            </div>
                            <div className="video-carousel">
                                {latestVideos.map(v => (
                                    <VideoCard
                                        key={`latest-${v.yt}`}
                                        video={v}
                                        isCompleted={completedIds.includes(v.yt)}
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
                            completedIds={completedIds}
                            onLoad={() => loadCategory(cat.slug, cat.file)}
                            onSelectVideo={setSelectedVideo}
                        />
                    ))}
                </>
            )}

            {/* Video Player Modal */}
            {selectedVideo && (
                <VideoPlayer
                    video={selectedVideo}
                    onClose={() => setSelectedVideo(null)}
                    onComplete={handleComplete}
                    isCompleted={completedIds.includes(selectedVideo.yt)}
                />
            )}
        </div>
    )
}

function LazyCategory({ category, videos, completedIds, onLoad, onSelectVideo }) {
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
                            key={`cat-${v.yt}`}
                            video={{ ...v, cat: category.name }}
                            isCompleted={completedIds.includes(v.yt)}
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
