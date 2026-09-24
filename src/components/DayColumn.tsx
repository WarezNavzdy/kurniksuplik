import { CalendarDays, Sparkles } from 'lucide-react'
import type { ScheduleDay } from '../types/schedule'
import { getPublicHolidayName } from '../utils/holidays'
import { SubjectCard } from './SubjectCard'

const DAY_START = 7 * 60
const DAY_END = 19 * 60
const MINUTE_HEIGHT = 1.75

function toMinutes(time?: string) {
  if (!time || typeof time !== 'string') return 0
  const [hours = 0, minutes = 0] = time.split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0
  return hours * 60 + minutes
}

export function DayColumn({ day, isToday = false }: { day: ScheduleDay; isToday?: boolean }) {
  const publicHoliday = !day.subjects?.length ? getPublicHolidayName(day.date) : null
  const freeDayLabel = publicHoliday
    ? `Svátek: ${publicHoliday}`
    : 'Volný den'

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const isWithinDayHours = isToday && currentMinutes >= DAY_START && currentMinutes <= DAY_END
  const currentTimeTop = isWithinDayHours ? (currentMinutes - DAY_START) * MINUTE_HEIGHT : null

  return (
    <section
      id={isToday ? 'today-column' : undefined}
      className={`min-w-0 flex-[0_0_82vw] snap-center sm:snap-start rounded-2xl transition-all duration-200 sm:flex-[0_0_310px] lg:flex-1 ${
        isToday
          ? 'border-2 border-amber-400 bg-slate-900/95 shadow-xl shadow-amber-500/10 ring-2 ring-amber-400/20'
          : 'border border-slate-800/80 bg-slate-900/60 hover:border-slate-700/80'
      }`}
    >
      {/* Sticky Day Column Header */}
      <header
        className={`sticky top-0 z-20 flex items-center justify-between rounded-t-2xl border-b px-3.5 py-3 backdrop-blur-md transition-colors ${
          isToday
            ? 'border-amber-400/60 bg-slate-900/95 shadow-sm'
            : 'border-slate-800/90 bg-slate-900/90'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <h2
              className={`font-black text-base sm:text-lg ${
                isToday ? 'text-amber-300' : 'text-white'
              }`}
            >
              {day.dayName}
            </h2>
            {isToday && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-slate-950 shadow-md shadow-amber-400/30">
                <Sparkles size={11} className="text-slate-950" />
                Dnes
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 font-semibold">{day.date || '—'}</p>
        </div>

        <div
          className={`flex h-8 w-8 items-center justify-center rounded-xl font-bold ${
            isToday
              ? 'bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/30'
              : 'bg-slate-800/80 text-slate-400'
          }`}
        >
          <CalendarDays size={16} />
        </div>
      </header>

      {/* Timeline Body */}
      <div
        className="relative px-1"
        style={{ height: `${(DAY_END - DAY_START) * MINUTE_HEIGHT}px` }}
      >
        {/* Left vertical border for time markings */}
        <div className="pointer-events-none absolute inset-0 ml-7 border-l border-slate-800/80" />

        {/* 15-minute and 1-hour grid lines */}
        {Array.from({ length: 49 }, (_, index) => {
          const isHour = index % 4 === 0
          return (
            <div
              key={index}
              className="pointer-events-none absolute inset-x-0"
              style={{ top: `${index * 15 * MINUTE_HEIGHT}px` }}
            >
              {index < 48 && isHour && (
                <span className="absolute left-0.5 -translate-y-2 text-[10px] font-bold leading-none text-slate-400 select-none">
                  {7 + index / 4}:00
                </span>
              )}
              {index < 48 && (
                <span
                  className={`absolute left-7 right-0 border-t ${
                    isHour ? 'border-slate-800' : 'border-slate-800/30'
                  }`}
                />
              )}
            </div>
          )
        })}

        {/* Live current time indicator line for today */}
        {currentTimeTop !== null && (
          <div
            className="pointer-events-none absolute left-0 right-0 z-20 flex items-center"
            style={{ top: `${currentTimeTop}px` }}
          >
            <div className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-md shadow-amber-400 ring-2 ring-amber-400/60" />
            <div className="h-[2px] flex-1 bg-amber-400 shadow-md shadow-amber-400" />
          </div>
        )}

        {/* Subjects */}
        {(day.subjects || []).map((subject, sIdx) => {
          const top = Math.max(0, toMinutes(subject.startTime) - DAY_START) * MINUTE_HEIGHT
          const duration = Math.max(30, toMinutes(subject.endTime) - toMinutes(subject.startTime))
          const cardHeight = duration * MINUTE_HEIGHT

          const startM = toMinutes(subject.startTime)
          const endM = toMinutes(subject.endTime)
          const isCurrent = isToday && currentMinutes >= startM && currentMinutes < endM

          return (
            <div
              key={`${subject.id || sIdx}-${subject.startTime}-${subject.endTime}`}
              className="absolute left-8 right-1"
              style={{ top: `${top}px`, height: `${cardHeight}px` }}
            >
              <SubjectCard subject={subject} variant="timeline" isCurrent={isCurrent} />
            </div>
          )
        })}

        {/* Free day / Holiday banner */}
        {(!day.subjects || day.subjects.length === 0) && (
          <div className="absolute inset-x-3 top-8 flex justify-center">
            <div
              className={`rounded-xl border px-3 py-2 text-center text-xs font-semibold ${
                publicHoliday
                  ? 'border-amber-400/40 bg-amber-400/10 text-amber-200 shadow-md shadow-amber-950/20'
                  : 'border-slate-800 bg-slate-800/60 text-slate-400'
              }`}
            >
              {freeDayLabel}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}