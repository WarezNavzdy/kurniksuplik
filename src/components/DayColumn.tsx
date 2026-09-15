import { CalendarDays } from 'lucide-react'
import type { ScheduleDay } from '../types/schedule'
import { SubjectCard } from './SubjectCard'

const DAY_START = 7 * 60
const DAY_END = 19 * 60
const MINUTE_HEIGHT = 1.75

function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function getEasterSunday(year: number) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1

  return new Date(year, month - 1, day)
}

function dateMatches(date: Date, day: number, month: number) {
  return date.getDate() === day && date.getMonth() + 1 === month
}

function getPublicHolidayName(dateText: string) {
  const match = dateText.match(/^(\d{1,2})\.(\d{1,2})\.?$/)
  if (!match) return null

  const day = Number(match[1])
  const month = Number(match[2])
  const currentYear = new Date().getFullYear()

  for (const year of [currentYear - 1, currentYear, currentYear + 1]) {
    const fixedHolidays: Record<string, string> = {
      '1.1': 'Nový rok',
      '1.5': 'Svátek práce',
      '8.5': 'Den vítězství',
      '5.7': 'Den slovanských věrozvěstů Cyrila a Metoděje',
      '6.7': 'Den upálení mistra Jana Husa',
      '28.9': 'Den české státnosti',
      '28.10': 'Den vzniku samostatného československého státu',
      '17.11': 'Den boje za svobodu a demokracii',
      '24.12': 'Štědrý den',
      '25.12': '1. svátek vánoční',
      '26.12': '2. svátek vánoční',
    }

    const fixedKey = `${day}.${month}`
    if (fixedHolidays[fixedKey]) return fixedHolidays[fixedKey]

    const easterSunday = getEasterSunday(year)
    const holidays = [
      { date: addDays(easterSunday, -2), label: 'Velký pátek' },
      { date: addDays(easterSunday, 1), label: 'Velikonoční pondělí' },
      { date: addDays(easterSunday, 39), label: 'Nanebevstoupení Páně' },
      { date: addDays(easterSunday, 50), label: 'Svatodušní pondělí' },
    ]

    const holiday = holidays.find(({ date }) => dateMatches(date, day, month))
    if (holiday) return holiday.label
  }

  return null
}

export function DayColumn({ day, isToday = false }: { day: ScheduleDay; isToday?: boolean }) {
  const publicHoliday = !day.subjects.length ? getPublicHolidayName(day.date) : null
  const freeDayLabel = publicHoliday
    ? `Státní svátek — ${publicHoliday}${day.date ? ` (${day.date})` : ''}`
    : day.date
      ? `Volný den — ${day.date}`
      : 'Volný den'
  const freeDayClasses = publicHoliday
    ? 'border-amber-300 bg-amber-100 text-amber-900 shadow-sm shadow-amber-200/70'
    : 'border-slate-300 bg-slate-200 text-slate-600 shadow-sm shadow-slate-200/50'
  const freeDayTextClasses = publicHoliday ? 'text-[11px] leading-snug' : 'text-[11px] leading-snug'

  return (
    <section className={`min-w-0 flex-[0_0_calc(100vw-3.5rem)] snap-start rounded-2xl border p-1 sm:flex-[0_0_320px] lg:flex-auto ${isToday ? 'border-amber-400 bg-amber-50 shadow-lg shadow-amber-950/10' : 'border-slate-200 bg-slate-100/90'}`}>
      <header className="mb-3 flex items-center justify-between border-b border-slate-200 px-2 pb-3">
        <div><h2 className="font-bold text-slate-900">{day.dayName}{isToday && <span className="ml-2 rounded-full bg-amber-400 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-950">Dnes</span>}</h2><p className="text-xs text-slate-500">{day.date}</p></div>
        <CalendarDays size={18} className="text-teal-700" />
      </header>
      <div className="relative" style={{ height: `${(DAY_END - DAY_START) * MINUTE_HEIGHT}px` }}>
        <div className="pointer-events-none absolute inset-0 ml-4 border-l border-slate-200" />
        {Array.from({ length: 49 }, (_, index) => (
          <div key={index} className="pointer-events-none absolute inset-x-0" style={{ top: `${index * 15 * MINUTE_HEIGHT}px` }}>
            {index < 48 && index % 4 === 0 && <span className="absolute left-0 -translate-y-1 text-[9px] font-semibold leading-none text-slate-400">{7 + index / 4}</span>}
            {index < 48 && <span className={`absolute left-4 right-0 border-t ${index % 4 === 0 ? 'border-slate-200/90' : 'border-slate-200/45'}`} />}
          </div>
        ))}
        {day.subjects.map((subject) => {
          const top = Math.max(0, toMinutes(subject.startTime) - DAY_START) * MINUTE_HEIGHT
          const duration = Math.max(30, toMinutes(subject.endTime) - toMinutes(subject.startTime))

          const cardHeight = duration * MINUTE_HEIGHT

          return <div key={subject.id} className="absolute left-4 right-0" style={{ top: `${top}px`, height: `${cardHeight}px` }}><SubjectCard subject={subject} /></div>
        })}
        {!day.subjects.length && (
          <div className="absolute inset-x-2 top-6 flex justify-center">
            <div className={`max-w-[calc(100%-1rem)] rounded-full border px-2.5 py-1 text-center font-bold uppercase tracking-[0.04em] ${freeDayClasses} ${freeDayTextClasses}`}>
              <div className="whitespace-normal break-words">
                {freeDayLabel}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}