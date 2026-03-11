function pad2(value) {
    return String(value).padStart(2, '0')
}

export function toLocalDateString(date = new Date()) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function getStartOfWeekDateString(date = new Date(), weekStartsOn = 1) {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const offset = (start.getDay() - weekStartsOn + 7) % 7
    start.setDate(start.getDate() - offset)
    return toLocalDateString(start)
}
