import type { Subject } from '../types/schedule'

function toMinutes(time: string): number | null {
  const [hours, minutes] = time.split(':').map(Number)
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null
  return hours * 60 + minutes
}

export function hasScheduleConflict(subject: Subject, subjects: Subject[]): boolean {
  const start = toMinutes(subject.startTime)
  const end = toMinutes(subject.endTime)
  if (start === null || end === null || start >= end) return false

  return subjects.some((other) => {
    if (other === subject) return false
    const otherStart = toMinutes(other.startTime)
    const otherEnd = toMinutes(other.endTime)
    return otherStart !== null && otherEnd !== null && start < otherEnd && end > otherStart
  })
}