import { useEffect, useState } from 'react'
import type { ApiScheduleResponse, SchedulePayload, ScheduleWeek } from '../types/schedule'

const API_URL = 'https://pytle.warezovaadresa.workers.dev/'
const BUILDING_MAP_URL = 'https://wareznavzdy.github.io/rozvrh/pytle.json'

const WEEKDAYS = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek']
const WEEKDAY_ALIASES = ['po', 'út', 'st', 'čt', 'pá']

function normalizeLocation(item: ApiScheduleResponse['days'][number]['classes'][number]) {
  const roomLooksLikeCourse = item.room?.match(/^B\d{5}$/i)
  const courseLooksLikeRoom = item.course && !item.course.match(/^B\d{5}$/i)

  return roomLooksLikeCourse && courseLooksLikeRoom
    ? { course: item.room, room: item.course }
    : { course: item.course, room: item.room }
}

function parseBuildingLinks(rawJson: string): Record<string, string> {
  try {
    return JSON.parse(rawJson) as Record<string, string>
  } catch {
    return JSON.parse(rawJson.replace(/,\s*([}\]])/g, '$1')) as Record<string, string>
  }
}

function normalizeDays(days: ScheduleWeek['days']): ScheduleWeek['days'] {
  const daysByName = new Map(days.map((day) => {
    const dayIndex = WEEKDAY_ALIASES.indexOf(day.dayName.toLocaleLowerCase('cs-CZ'))
    return [dayIndex >= 0 ? WEEKDAYS[dayIndex].toLocaleLowerCase('cs-CZ') : day.dayName.toLocaleLowerCase('cs-CZ'), day]
  }))

  return WEEKDAYS.map((dayName) => daysByName.get(dayName.toLocaleLowerCase('cs-CZ')) || {
    date: '',
    dayName,
    subjects: [],
  })
}

function normalizeSchedule(payload: SchedulePayload, buildingLinks: Record<string, string>): ScheduleWeek[] {
  if (Array.isArray(payload)) return payload.map((week) => ({ ...week, days: normalizeDays(week.days) }))
  if ('weeks' in payload) return payload.weeks.map((week) => ({ ...week, days: normalizeDays(week.days) }))

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
    days: normalizeDays(days.map((day) => ({
      date: day.date,
      dayName: day.day,
      subjects: day.classes.map((item) => {
        const location = normalizeLocation(item)

        return {
          id: item.subjectId,
          name: item.subject,
          teacher: item.teacher,
          course: location.course,
          room: location.room,
        building: item.building,
          mapUrl: item.building ? buildingLinks[item.building] : undefined,
          startTime: item.start,
          endTime: item.end,
          color: item.color,
          note: item.type,
        }
      }),
    }))),
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
        const [response, buildingResponse] = await Promise.all([
          fetch(API_URL, { signal: controller.signal }),
          fetch(BUILDING_MAP_URL, { signal: controller.signal }),
        ])
        if (!response.ok) throw new Error(`Server odpověděl kódem ${response.status}.`)
        if (!buildingResponse.ok) throw new Error(`Mapa budov odpověděla kódem ${buildingResponse.status}.`)

        const payload = (await response.json()) as SchedulePayload
        const buildingLinks = parseBuildingLinks(await buildingResponse.text())
        const normalizedWeeks = normalizeSchedule(payload, buildingLinks)
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