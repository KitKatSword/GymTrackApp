const STORAGE_KEY = 'gymtrack_completed_videos'

export function loadCompletedVideos() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return []

        const parsed = JSON.parse(raw)
        return parsed
            .map(item => typeof item === 'string' ? { yt: item } : item)
            .filter(item => typeof item === 'object' && item?.yt)
    } catch {
        return []
    }
}

export function addCompletedVideo(video) {
    const completed = loadCompletedVideos()
    if (!completed.some(item => item.yt === video.yt)) {
        completed.push({
            yt: video.yt,
            title: video.title,
            dur: video.dur,
            kcal: video.kcal,
            cat: video.cat,
        })
        localStorage.setItem(STORAGE_KEY, JSON.stringify(completed))
    }

    return [...completed]
}
