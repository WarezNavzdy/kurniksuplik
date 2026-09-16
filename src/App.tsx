import { AlertCircle, GraduationCap, LoaderCircle, RefreshCw, UsersRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { DayColumn } from './components/DayColumn'
import { OptionalSubjects, type OptionalSubject } from './components/OptionalSubjects'
import { WeekTabs } from './components/WeekTabs'
import { useSchedule } from './hooks/useSchedule'
import type { ScheduleWeek } from './types/schedule'

function formatUpdatedAt(value: string | null) {
  if (!value) return 'Čas aktualizace není k dispozici'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Čas aktualizace není k dispozici'

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
  const saved = document.cookie.split('; ').find((cookie) => cookie.startsWith(`${ELECTIVES_COOKIE}=`))?.split('=').slice(1).join('=')
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

  const candidates = [-1, 0, 1].map((yearOffset) => new Date(now.getFullYear() + yearOffset, Number(match[2]) - 1, Number(match[1])))
  return candidates.reduce((closest, candidate) => Math.abs(candidate.getTime() - now.getTime()) < Math.abs(closest.getTime() - now.getTime()) ? candidate : closest)
}

function getCurrentSchedulePosition(weeks: ScheduleWeek[]) {
  const now = new Date()
  const getWeekStart = (date: Date) => {
    const start = new Date(date)
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
    start.setHours(0, 0, 0, 0)
    return start
  }
  const datedWeeks = weeks.map((week) => ({
    week,
    dates: week.days.map((day) => toNearestScheduleDate(day.date, now)).filter((date): date is Date => date !== null),
  })).filter(({ dates }) => dates.length).map((entry) => ({
    ...entry,
    start: getWeekStart(entry.dates[0]),
  }))
  const current = datedWeeks.find(({ start }) => {
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return now >= start && now <= end
  })
  const selected = current || (now < datedWeeks[0].start ? datedWeeks[0] : datedWeeks[datedWeeks.length - 1])
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
  const { weeks, updatedAt, loading, error, electiveErrors, electiveLoading } = useSchedule(circle, optionalCodes)
  const [activeWeekId, setActiveWeekId] = useState('')
  const currentPosition = weeks.length ? getCurrentSchedulePosition(weeks) : null
  const selectedWeekId = activeWeekId || currentPosition?.weekId || ''
  const activeWeek = weeks.find((week) => week.id === selectedWeekId) || weeks[0]

  useEffect(() => {
    const controller = new AbortController()

    async function loadOptionalSubjects() {
      try {
        const response = await fetch(ELECTIVES_URL, { signal: controller.signal })
        if (!response.ok) throw new Error(`Server odpověděl kódem ${response.status}.`)
        const rawSubjects = await response.json() as Record<string, { kod?: unknown; nazev?: unknown }>
        const subjects = Object.entries(rawSubjects)
          .filter(([, subject]) => typeof subject.kod === 'string' && typeof subject.nazev === 'string')
          .map(([code, subject]) => ({ code, instituteCode: subject.kod as string, name: subject.nazev as string }))
          .sort((first, second) => first.code.localeCompare(second.code, 'cs'))
        const availableCodes = new Set(subjects.map((subject) => subject.code))
        const savedCodes = getSavedElectives().filter((code) => availableCodes.has(code))
        setOptionalSubjects(subjects)
        setOptionalCodes(savedCodes)
        document.cookie = `${ELECTIVES_COOKIE}=${encodeURIComponent(JSON.stringify(savedCodes))}; max-age=31536000; path=/; SameSite=Lax`
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') return
        setOptionalListError(fetchError instanceof Error ? fetchError.message : 'Seznam předmětů se nepodařilo načíst.')
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
      const nextCodes = selected ? [...new Set([...currentCodes, code])] : currentCodes.filter((currentCode) => currentCode !== code)
      document.cookie = `${ELECTIVES_COOKIE}=${encodeURIComponent(JSON.stringify(nextCodes))}; max-age=31536000; path=/; SameSite=Lax`
      return nextCodes
    })
  }

  return <main className="min-h-screen bg-slate-950 text-slate-100">
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-amber-400"><GraduationCap size={18} />Školní přehled</p><h1 className="text-4xl font-black tracking-tight sm:text-5xl">Můj rozvrh<span className="text-amber-400">.</span></h1><p className="mt-3 max-w-lg text-slate-400">Všechny hodiny přehledně na jednom místě.</p></div>
        <div className="flex flex-col gap-3 sm:items-end">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-bold text-slate-200">
            <UsersRound size={18} className="text-amber-400" />
            <span>Kruh</span>
            <select value={circle} onChange={(event) => handleCircleChange(Number(event.target.value))} className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100 outline-none focus:border-amber-400">
              {CIRCLES.map((circleNumber) => <option key={circleNumber} value={circleNumber}>{circleNumber}</option>)}
            </select>
          </label>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-400"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />Naposledy aktualizováno: {loading ? 'načítám…' : formatUpdatedAt(updatedAt)}</div>
        </div>
      </header>
      <OptionalSubjects subjects={optionalSubjects} selectedCodes={optionalCodes} loading={optionalListLoading} error={optionalListError} scheduleErrors={electiveErrors} onToggle={handleOptionalToggle} />
      {loading && <div className="flex min-h-64 items-center justify-center rounded-3xl bg-white text-slate-500"><LoaderCircle className="mr-3 animate-spin" />Načítám rozvrh…</div>}
      {error && <div role="alert" className="flex items-center gap-3 rounded-2xl border border-red-300 bg-red-50 p-5 text-red-800"><AlertCircle />{error}</div>}
      {!loading && !error && weeks.length === 0 && <div className="rounded-3xl bg-white p-10 text-center text-slate-500">API nevrátilo žádné týdny.</div>}
      {!loading && !error && activeWeek && <section className="space-y-5"><WeekTabs weeks={weeks} activeWeekId={activeWeek.id} currentWeekId={currentPosition?.weekId} onChange={setActiveWeekId} /><div className="schedule-scroll flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-3 lg:grid lg:grid-cols-[repeat(5,minmax(230px,1fr))] lg:gap-4 lg:overflow-x-auto lg:px-0">{activeWeek.days.map((day) => <DayColumn key={day.date} day={day} isToday={day.date === currentPosition?.dayDate && activeWeek.id === currentPosition.weekId} />)}</div></section>}
      {error && <button type="button" onClick={() => window.location.reload()} className="mt-4 flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 font-bold text-slate-950"><RefreshCw size={16} />Zkusit znovu</button>}
    </div>
  </main>
}

export default App