import { useEffect, useState } from 'react'
import type { ApiScheduleResponse, SchedulePayload, ScheduleWeek, Subject } from '../types/schedule'

const API_URL = 'https://pytle.warezovaadresa.workers.dev/'
const BUILDING_MAP_URL = 'https://wareznavzdy.github.io/rozvrh/pytle.json'
const electiveScheduleCache = new Map<string, Promise<ScheduleWeek[]>>()

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

function parseDayDate(dateText: string): Date | null {
  const match = dateText.match(/^(\d{1,2})\.(\d{1,2})\.?$/)
  if (!match) return null

  const day = Number(match[1])
  const month = Number(match[2])
  if (!day || !month) return null

  const today = new Date()
  return new Date(today.getFullYear(), month - 1, day)
}

function formatDayDate(value: Date) {
  return `${value.getDate()}.${value.getMonth() + 1}.`
}

function normalizeDays(days: ScheduleWeek['days']): ScheduleWeek['days'] {
  const daysByName = new Map(days.map((day) => {
    const dayIndex = WEEKDAY_ALIASES.indexOf(day.dayName.toLocaleLowerCase('cs-CZ'))
    const canonicalDayName = dayIndex >= 0 ? WEEKDAYS[dayIndex] : day.dayName
    return [canonicalDayName, day]
  }))

  const knownDates = new Map<string, Date>()
  days.forEach((day) => {
    const parsedDate = parseDayDate(day.date)
    if (!parsedDate) return

    const dayIndex = WEEKDAY_ALIASES.indexOf(day.dayName.toLocaleLowerCase('cs-CZ'))
    const canonicalDayName = dayIndex >= 0 ? WEEKDAYS[dayIndex] : day.dayName
    knownDates.set(canonicalDayName, parsedDate)
  })

  return WEEKDAYS.map((dayName) => {
    const existingDay = daysByName.get(dayName)
    if (existingDay) return existingDay

    const targetIndex = WEEKDAYS.indexOf(dayName)
    let bestKnownDayName: string | null = null
    let bestKnownDate: Date | null = null
    let bestOffset = Number.POSITIVE_INFINITY

    for (const [knownDayName, knownDate] of knownDates.entries()) {
      const knownIndex = WEEKDAYS.indexOf(knownDayName)
      if (knownIndex < 0) continue

      const offset = Math.abs(targetIndex - knownIndex)
      if (offset >= bestOffset) continue

      bestKnownDayName = knownDayName
      bestKnownDate = knownDate
      bestOffset = offset
    }

    if (!bestKnownDayName || !bestKnownDate) {
      return {
        date: '',
        dayName,
        subjects: [],
      }
    }

    const knownIndex = WEEKDAYS.indexOf(bestKnownDayName)
    const inferredDate = new Date(bestKnownDate)
    inferredDate.setDate(inferredDate.getDate() + (targetIndex - knownIndex))

    return {
      date: formatDayDate(inferredDate),
      dayName,
      subjects: [],
    }
  })
}

function normalizeSchedule(payload: SchedulePayload, buildingLinks: Record<string, string>, source: Subject['source'] = 'circle', sourceCode?: string): ScheduleWeek[] {
  if (Array.isArray(payload)) return payload.map((week) => ({ ...week, days: normalizeDays(week.days).map((day) => ({ ...day, subjects: day.subjects.map((subject) => ({ ...subject, source, sourceCode })) })) }))
  if ('weeks' in payload) return payload.weeks.map((week) => ({ ...week, days: normalizeDays(week.days).map((day) => ({ ...day, subjects: day.subjects.map((subject) => ({ ...subject, source, sourceCode })) })) }))

  const groupedDays = new Map<string, ApiScheduleResponse['days']>()
  let previousMonth = 0
  let year = new Date().getFullYear()
  let currentWeekKey: string | null = null

  payload.days.forEach((day) => {
    const [, dayText, monthText] = day.date.match(/^(\d{1,2})\.(\d{1,2})\.?$/) || []
    const month = Number(monthText)
    if (month && month < previousMonth) year += 1
    previousMonth = month || previousMonth

    const parsedDate = month ? new Date(year, month - 1, Number(dayText)) : null
    const monday = parsedDate ? new Date(parsedDate) : null
    if (monday) monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    if (day.week !== null && day.week !== undefined) currentWeekKey = String(day.week)
    if (!currentWeekKey && monday) currentWeekKey = `${monday.getFullYear()}-${monday.getMonth() + 1}-${monday.getDate()}`
    const weekKey = currentWeekKey || 'unknown'
    const days = groupedDays.get(weekKey) || []
    days.push(day)
    groupedDays.set(weekKey, days)
  })

  return [...groupedDays.entries()].map(([weekKey, days], index) => ({
    id: `week-${weekKey}`,
    label: `Týden ${index + 1}`,
    weekNumber: index + 1,
    days: normalizeDays(days.map((day) => ({
      date: day.date,
      dayName: day.day,
      subjects: day.classes.map((item) => {
        const location = normalizeLocation(item)

        return {
          id: `${source}-${sourceCode || 'circle'}-${item.subjectId}-${item.start}-${item.end}`,
          name: item.subject,
          source,
          sourceCode,
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

function isSisLoginUrl(value: string) {
  try {
    const url = new URL(value)
    const normalizedUrl = `${url.hostname}${url.pathname}${url.search}`.toLocaleLowerCase('cs-CZ')
    return normalizedUrl.includes('login') || normalizedUrl.includes('prihlas') || normalizedUrl.includes('přihlas')
  } catch {
    return false
  }
}

function scheduleHasSubjects(weeks: ScheduleWeek[]) {
  return weeks.some((week) => week.days.some((day) => day.subjects.length > 0))
}

function loadElectiveSchedule(code: string, buildingLinks: Record<string, string>) {
  const cached = electiveScheduleCache.get(code)
  if (cached) return cached

  const request = fetch(`${API_URL}?predmet=${encodeURIComponent(code)}`)
    .then(async (response) => {
      if (isSisLoginUrl(response.url)) throw new Error('Předmět se nepodařilo načíst: API přesměrovalo na přihlášení do SIS.')
      if (!response.ok) throw new Error(`Server odpověděl kódem ${response.status}.`)
      const weeks = normalizeSchedule(await response.json() as SchedulePayload, buildingLinks, 'elective', code)
      if (!scheduleHasSubjects(weeks)) throw new Error('Předmět nemá zavedené hodiny.')
      return weeks
    })
  electiveScheduleCache.set(code, request)
  return request
}

function mergeSchedules(baseWeeks: ScheduleWeek[], electiveWeeksByCode: Record<string, ScheduleWeek[]>) {
  const electiveWeeks = Object.values(electiveWeeksByCode)

  return baseWeeks.map((week, weekIndex) => ({
    ...week,
    days: week.days.map((day) => ({
      ...day,
      subjects: [
        ...day.subjects,
        ...electiveWeeks.flatMap((weeks) => {
          const electiveWeek = weeks.find((candidate) => candidate.id === week.id) || weeks[weekIndex]
          return electiveWeek?.days.find((candidate) => candidate.date === day.date || candidate.dayName === day.dayName)?.subjects || []
        }),
      ],
    })),
  }))
}

export function useSchedule(circle: number, electiveCodes: string[] = []) {
  const [baseWeeks, setBaseWeeks] = useState<ScheduleWeek[]>([])
  const [buildingLinks, setBuildingLinks] = useState<Record<string, string> | null>(null)
  const [electiveWeeksByCode, setElectiveWeeksByCode] = useState<Record<string, ScheduleWeek[]>>({})
  const [electiveErrors, setElectiveErrors] = useState<Record<string, string>>({})
  const [electiveLoading, setElectiveLoading] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const electiveKey = electiveCodes.join('|')

  useEffect(() => {
    const controller = new AbortController()

    async function loadSchedule() {
      try {
        setLoading(true)
        setError(null)
        const [response, buildingResponse] = await Promise.all([
          fetch(`${API_URL}?kruh=${circle}`, { signal: controller.signal }),
          fetch(BUILDING_MAP_URL, { signal: controller.signal }),
        ])
        if (!response.ok) throw new Error(`Server odpověděl kódem ${response.status}.`)
        if (!buildingResponse.ok) throw new Error(`Mapa budov odpověděla kódem ${buildingResponse.status}.`)

        const payload = (await response.json()) as SchedulePayload
        const buildingLinks = parseBuildingLinks(await buildingResponse.text())
        const normalizedWeeks = normalizeSchedule(payload, buildingLinks)
        if (!Array.isArray(normalizedWeeks)) throw new Error('Odpověď API nemá očekávanou strukturu.')
        setUpdatedAt(!Array.isArray(payload) && !('weeks' in payload) ? payload.generatedAt || null : null)
        setBuildingLinks(buildingLinks)
        setBaseWeeks(normalizedWeeks)
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') return
        setError(fetchError instanceof Error ? fetchError.message : 'Rozvrh se nepodařilo načíst.')
      } finally {
        setLoading(false)
      }
    }

    void loadSchedule()
    return () => controller.abort()
  }, [circle])

  useEffect(() => {
    const codes = electiveKey ? electiveKey.split('|') : []
    if (!buildingLinks || !codes.length) {
      setElectiveWeeksByCode({})
      setElectiveErrors({})
      setElectiveLoading(false)
      return
    }

    const links = buildingLinks
    let active = true
    setElectiveLoading(true)

    async function loadElectives() {
      const results = await Promise.all(codes.map(async (code) => {
        try {
          return { code, weeks: await loadElectiveSchedule(code, links) }
        } catch (fetchError) {
          return { code, error: fetchError instanceof Error ? fetchError.message : 'Předmět se nepodařilo načíst.' }
        }
      }))

      if (!active) return
      setElectiveWeeksByCode(Object.fromEntries(results.filter((result): result is { code: string; weeks: ScheduleWeek[] } => 'weeks' in result).map((result) => [result.code, result.weeks])))
      setElectiveErrors(Object.fromEntries(results.filter((result): result is { code: string; error: string } => 'error' in result).map((result) => [result.code, result.error])))
      setElectiveLoading(false)
    }

    void loadElectives()
    return () => { active = false }
  }, [buildingLinks, electiveKey])

  return {
    weeks: mergeSchedules(baseWeeks, electiveWeeksByCode),
    updatedAt,
    loading,
    error,
    electiveErrors,
    electiveLoading,
  }
}