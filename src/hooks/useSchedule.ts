import { useEffect, useState } from 'react'
import type { ApiScheduleResponse, SchedulePayload, ScheduleWeek } from '../types/schedule'

const API_URL = 'https://pytle.warezovaadresa.workers.dev/'

function normalizeSchedule(payload: SchedulePayload): ScheduleWeek[] {
  if (Array.isArray(payload)) return payload
  if ('weeks' in payload) return payload.weeks

  const groupedDays = new Map<string, ApiScheduleResponse['days']>()
  let currentWeekKey = '1'

  payload.days.forEach((day) => {
    // API labels only Mondays; following days belong to that same week.
    if (day.week !== null && day.week !== undefined) currentWeekKey = String(day.week)
    const weekKey = currentWeekKey
    const days = groupedDays.get(weekKey) || []
    days.push(day)
    groupedDays.set(weekKey, days)
  })

  return [...groupedDays.entries()].map(([weekKey, days], index) => ({
    id: `week-${weekKey}`,
    label: `Týden ${weekKey}`,
    weekNumber: Number.isNaN(Number(weekKey)) ? index + 1 : Number(weekKey),
    days: days.map((day) => ({
      date: day.date,
      dayName: day.day,
      subjects: day.classes.map((item) => ({
        id: item.subjectId,
        name: item.subject,
        teacher: item.teacher,
        room: item.room,
        startTime: item.start,
        endTime: item.end,
        color: item.color,
        note: [item.course, item.type].filter(Boolean).join(' · ') || undefined,
      })),
    })),
  }))
}

export function useSchedule() {
  const [weeks, setWeeks] = useState<ScheduleWeek[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadSchedule() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(API_URL, { signal: controller.signal })
        if (!response.ok) throw new Error(`Server odpověděl kódem ${response.status}.`)

        const payload = (await response.json()) as SchedulePayload
        const normalizedWeeks = normalizeSchedule(payload)
        if (!Array.isArray(normalizedWeeks)) throw new Error('Odpověď API nemá očekávanou strukturu.')
        setWeeks(normalizedWeeks)
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') return
        setError(fetchError instanceof Error ? fetchError.message : 'Rozvrh se nepodařilo načíst.')
      } finally {
        setLoading(false)
      }
    }

    void loadSchedule()
    return () => controller.abort()
  }, [])

  return { weeks, loading, error }
}