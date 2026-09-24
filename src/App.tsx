import {
  AlertCircle,
  GraduationCap,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { DayColumn } from './components/DayColumn'
import { OptionalSubjects, type OptionalSubject } from './components/OptionalSubjects'
import { WeekTabs } from './components/WeekTabs'
import { useSchedule } from './hooks/useSchedule'
import type { ScheduleWeek } from './types/schedule'

function formatUpdatedAt(value: string | null) {
  if (!value) return 'Čas není k dispozici'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Čas není k dispozici'

  return new Intl.DateTimeFormat('cs-CZ', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const CIRCLE_COOKIE = 'rozvrh-kruh'
const ELECTIVES_COOKIE = 'rozvrh-volitelne'
const ELECTIVES_URL = 'https://wareznavzdy.github.io/rozvrh/dopytle.json'
const CIRCLES = [...Array.from({ length: 20 }, (_, index) => index + 1001), 1101, 1102, 1103, 1104]

function getSavedCircle() {
  const savedCircle = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${CIRCLE_COOKIE}=`))
    ?.split('=')[1]
  const parsedCircle = Number(savedCircle)

  return CIRCLES.includes(parsedCircle) ? parsedCircle : 1003
}

function getSavedElectives() {
  const saved = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${ELECTIVES_COOKIE}=`))
    ?.split('=')
    .slice(1)
    .join('=')
  if (!saved) return []

  try {
    const parsed = JSON.parse(decodeURIComponent(saved))
    return Array.isArray(parsed) && parsed.every((code) => typeof code === 'string') ? parsed : []
  } catch {
    return []
  }
}

function toNearestScheduleDate(value: string, now: Date) {
  const match = value.match(/^(\d{1,2})\.(\d{1,2})\.?$/)
  if (!match) return null

  const candidates = [-1, 0, 1].map(
    (yearOffset) => new Date(now.getFullYear() + yearOffset, Number(match[2]) - 1, Number(match[1]))
  )
  return candidates.reduce((closest, candidate) =>
    Math.abs(candidate.getTime() - now.getTime()) < Math.abs(closest.getTime() - now.getTime())
      ? candidate
      : closest
  )
}

function getCurrentSchedulePosition(weeks: ScheduleWeek[]) {
  const now = new Date()
  const getWeekStart = (date: Date) => {
    const start = new Date(date)
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
    start.setHours(0, 0, 0, 0)
    return start
  }
  const datedWeeks = weeks
    .map((week) => ({
      week,
      dates: week.days
        .map((day) => toNearestScheduleDate(day.date, now))
        .filter((date): date is Date => date !== null),
    }))
    .filter(({ dates }) => dates.length)
    .map((entry) => ({
      ...entry,
      start: getWeekStart(entry.dates[0]),
    }))
  const current = datedWeeks.find(({ start }) => {
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return now >= start && now <= end
  })
  const selected =
    current || (now < datedWeeks[0]?.start ? datedWeeks[0] : datedWeeks[datedWeeks.length - 1])
  if (!selected) return null

  const today = selected.week.days.find((day) => {
    const date = toNearestScheduleDate(day.date, now)
    return date?.toDateString() === now.toDateString()
  })

  return { weekId: selected.week.id, dayDate: today?.date }
}

function App() {
  const [circle, setCircle] = useState(getSavedCircle)
  const [optionalSubjects, setOptionalSubjects] = useState<OptionalSubject[]>([])
  const [optionalCodes, setOptionalCodes] = useState<string[]>([])
  const [optionalListLoading, setOptionalListLoading] = useState(true)
  const [optionalListError, setOptionalListError] = useState<string | null>(null)
  const { weeks, updatedAt, loading, error, electiveErrors, electiveLoading } = useSchedule(
    circle,
    optionalCodes
  )
  const [activeWeekId, setActiveWeekId] = useState('')
  const scheduleScrollRef = useRef<HTMLDivElement>(null)

  const currentPosition = weeks.length ? getCurrentSchedulePosition(weeks) : null
  const selectedWeekId = activeWeekId || currentPosition?.weekId || ''
  const activeWeek = weeks.find((week) => week.id === selectedWeekId) || weeks[0]
  const isCurrentWeek = Boolean(currentPosition && activeWeek?.id === currentPosition.weekId)

  // Auto-scroll on mobile to today's column when viewing current week
  useEffect(() => {
    if (isCurrentWeek && currentPosition?.dayDate) {
      const timer = setTimeout(() => {
        const todayEl = document.getElementById('today-column')
        if (todayEl) {
          todayEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
        }
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [activeWeek?.id, isCurrentWeek, currentPosition?.dayDate])

  useEffect(() => {
    const controller = new AbortController()

    async function loadOptionalSubjects() {
      try {
        const response = await fetch(ELECTIVES_URL, { signal: controller.signal })
        if (!response.ok) throw new Error(`Server odpověděl kódem ${response.status}.`)
        const rawSubjects = (await response.json()) as Record<string, { kod?: unknown; nazev?: unknown }>
        const subjects = Object.entries(rawSubjects)
          .filter(([, subject]) => typeof subject.kod === 'string' && typeof subject.nazev === 'string')
          .map(([code, subject]) => ({
            code,
            instituteCode: subject.kod as string,
            name: subject.nazev as string,
          }))
          .sort((first, second) => first.code.localeCompare(second.code, 'cs'))
        const availableCodes = new Set(subjects.map((subject) => subject.code))
        const savedCodes = getSavedElectives().filter((code) => availableCodes.has(code))
        setOptionalSubjects(subjects)
        setOptionalCodes(savedCodes)
        document.cookie = `${ELECTIVES_COOKIE}=${encodeURIComponent(
          JSON.stringify(savedCodes)
        )}; max-age=31536000; path=/; SameSite=Lax`
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') return
        setOptionalListError(
          fetchError instanceof Error ? fetchError.message : 'Seznam předmětů se nepodařilo načíst.'
        )
      } finally {
        setOptionalListLoading(false)
      }
    }

    void loadOptionalSubjects()
    return () => controller.abort()
  }, [])

  function handleCircleChange(nextCircle: number) {
    setCircle(nextCircle)
    document.cookie = `${CIRCLE_COOKIE}=${nextCircle}; max-age=31536000; path=/; SameSite=Lax`
    setActiveWeekId('')
  }

  function handleOptionalToggle(code: string, selected: boolean) {
    setOptionalCodes((currentCodes) => {
      const nextCodes = selected
        ? [...new Set([...currentCodes, code])]
        : currentCodes.filter((currentCode) => currentCode !== code)
      document.cookie = `${ELECTIVES_COOKIE}=${encodeURIComponent(
        JSON.stringify(nextCodes)
      )}; max-age=31536000; path=/; SameSite=Lax`
      return nextCodes
    })
  }

  function handleJumpToCurrentWeek() {
    if (currentPosition) {
      setActiveWeekId(currentPosition.weekId)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-amber-400 selection:text-slate-950 pb-16">
      {/* Sticky Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md safe-top">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3.5 py-3 sm:px-6 lg:px-8">
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 font-bold text-slate-950 shadow-sm shadow-amber-400/25">
              <GraduationCap size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white sm:text-xl">
                Můj rozvrh<span className="text-amber-400">.</span>
              </h1>
            </div>
          </div>

          {/* Kruh Selector Chip */}
          <label className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-200 transition-colors hover:border-slate-700 sm:px-3.5 sm:py-2 sm:text-sm">
            <UsersRound size={15} className="text-amber-400 shrink-0" />
            <span>Kruh</span>
            <select
              value={circle}
              onChange={(event) => handleCircleChange(Number(event.target.value))}
              className="cursor-pointer bg-slate-800 rounded px-1.5 py-0.5 text-white font-bold outline-none border border-slate-700 focus:border-amber-400"
              aria-label="Vybrat studijní kruh"
            >
              {CIRCLES.map((circleNumber) => (
                <option key={circleNumber} value={circleNumber} className="bg-slate-900 text-slate-100">
                  {circleNumber}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-3.5 pt-4 sm:px-6 lg:px-8 space-y-4">
        {/* Status Sub-bar: Last update & Current week status */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span>
              {loading ? 'Načítám rozvrh…' : `Aktualizováno: ${formatUpdatedAt(updatedAt)}`}
            </span>
            {electiveLoading && (
              <span className="ml-1 text-[11px] text-teal-400 flex items-center gap-1">
                <LoaderCircle size={10} className="animate-spin" /> načítám volitelné…
              </span>
            )}
          </div>

          {/* Quick jump to current week if viewing another week */}
          {currentPosition && !isCurrentWeek && (
            <button
              type="button"
              onClick={handleJumpToCurrentWeek}
              className="flex items-center gap-1.5 rounded-lg border border-amber-400/50 bg-amber-400/10 px-2.5 py-1 text-xs font-bold text-amber-300 hover:bg-amber-400/20 transition-colors"
            >
              <Sparkles size={12} className="text-amber-400" />
              <span>Zpět na aktuální týden</span>
            </button>
          )}
        </div>

        {/* Optional subjects accordion */}
        <OptionalSubjects
          subjects={optionalSubjects}
          selectedCodes={optionalCodes}
          loading={optionalListLoading}
          error={optionalListError}
          scheduleErrors={electiveErrors}
          onToggle={handleOptionalToggle}
        />

        {/* Loading state */}
        {loading && (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/60 p-12 text-slate-400 shadow-inner">
            <LoaderCircle size={36} className="animate-spin text-amber-400 mb-3" />
            <p className="text-base font-semibold text-slate-200">Načítám rozvrh hodin…</p>
            <p className="text-xs text-slate-500 mt-1">Stahuji data pro kruh {circle}</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-2xl border border-red-500/30 bg-red-950/40 p-5 text-red-200"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="text-red-400 shrink-0" size={20} />
              <span className="font-semibold">{error}</span>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-1 flex w-fit items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300 transition-colors"
            >
              <RefreshCw size={14} />
              Zkusit znovu
            </button>
          </div>
        )}

        {/* Empty weeks state */}
        {!loading && !error && weeks.length === 0 && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-10 text-center text-slate-400">
            API nevrátilo žádné týdny pro vybraný kruh.
          </div>
        )}

        {/* Weekly Schedule Overview (Single unified view) */}
        {!loading && !error && activeWeek && (
          <section className="space-y-4">
            {/* Week tabs with prominent current week badge */}
            <WeekTabs
              weeks={weeks}
              activeWeekId={activeWeek.id}
              currentWeekId={currentPosition?.weekId}
              onChange={setActiveWeekId}
            />

            {/* 5-Day Weekly Columns (Swipeable on mobile, 5 columns on desktop) */}
            <div
              ref={scheduleScrollRef}
              className="schedule-scroll flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 lg:grid lg:grid-cols-5 lg:gap-3.5 lg:overflow-x-visible"
            >
              {activeWeek.days.map((day) => (
                <DayColumn
                  key={day.date || day.dayName}
                  day={day}
                  isToday={
                    day.date === currentPosition?.dayDate &&
                    activeWeek.id === currentPosition.weekId
                  }
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

export default App