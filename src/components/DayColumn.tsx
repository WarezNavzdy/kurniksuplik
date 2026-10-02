import { CalendarDays } from 'lucide-react'
import type { ScheduleDay } from '../types/schedule'
import { getPublicHolidayName } from '../utils/holidays'
import { hasScheduleConflict } from '../utils/schedule'
import { SubjectCard } from './SubjectCard'

const DAY_START = 7 * 60
const DAY_END = 19 * 60
const MINUTE_HEIGHT = 1.75

function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function computeSubjectLayout(subjects: ScheduleDay['subjects']) {
  const items = subjects.map((subject) => {
    const start = toMinutes(subject.startTime)
    const end = toMinutes(subject.endTime)
    const overlapCount = subjects.filter((other) => {
      if (other.id === subject.id) return false
      const otherStart = toMinutes(other.startTime)
      const otherEnd = toMinutes(other.endTime)
      return otherStart !== null && otherEnd !== null && start !== null && end !== null && start < otherEnd && end > otherStart
    }).length + 1

    return { subject, start, end, overlapCount }
  })

  const laneEnds: number[] = []

  return items.map((item) => {
    const laneIndex = laneEnds.findIndex((end) => item.start !== null && item.start >= end)
    if (laneIndex >= 0) {
      laneEnds[laneIndex] = item.end ?? item.start ?? 0
    } else {
      laneEnds.push(item.end ?? item.start ?? 0)
    }

    const laneCount = Math.max(1, item.overlapCount)
    const safeLaneCount = Math.min(3, laneCount)
    const laneOffset = (laneIndex >= 0 ? laneIndex : laneEnds.length - 1) * (100 / safeLaneCount)
    const laneWidth = Math.max(32, 100 / safeLaneCount - 4)

    return {
      ...item,
      laneIndex: laneIndex >= 0 ? laneIndex : laneEnds.length - 1,
      laneCount: safeLaneCount,
      laneOffset,
      laneWidth,
    }
  })
}

export function DayColumn({ day, isToday = false }: { day: ScheduleDay; isToday?: boolean }) {
  const publicHoliday = !day.subjects.length ? getPublicHolidayName(day.date) : null
  const freeDayLabel = publicHoliday
    ? `Svátek: ${publicHoliday}`
    : 'Volný den'
  const sortedSubjects = [...day.subjects].sort(
    (first, second) => toMinutes(first.startTime) - toMinutes(second.startTime)
  )

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const isWithinDayHours = isToday && currentMinutes >= DAY_START && currentMinutes <= DAY_END
  const currentTimeTop = isWithinDayHours ? (currentMinutes - DAY_START) * MINUTE_HEIGHT : null

  return (
    <section
      id={isToday ? 'today-column' : undefined}
      className={`min-w-0 flex-[0_0_100%] snap-start rounded-2xl border transition-all duration-200 sm:flex-[0_0_300px] lg:flex-auto ${
        isToday
          ? 'border-amber-400/80 bg-slate-900/95 shadow-lg shadow-amber-500/5 ring-1 ring-amber-400/30'
          : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700/80'
      }`}
    >
      {/* Sticky Day Column Header */}
      <header
        className={`sticky top-0 z-20 flex items-center justify-between rounded-t-2xl border-b px-3.5 py-3 backdrop-blur-md transition-colors ${
          isToday
            ? 'border-amber-400/40 bg-slate-900/95'
            : 'border-slate-800/90 bg-slate-900/90'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-sm text-white sm:text-base">{day.dayName}</h2>
            {isToday && (
              <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-950">
                Dnes
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 font-medium">{day.date || '—'}</p>
        </div>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-xl ${
            isToday ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-800/80 text-slate-400'
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

        {/* Live current time indicator line */}
        {currentTimeTop !== null && (
          <div
            className="pointer-events-none absolute left-0 right-0 z-20 flex items-center"
            style={{ top: `${currentTimeTop}px` }}
          >
            <div className="h-2 w-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400 ring-2 ring-amber-400/50" />
            <div className="h-[2px] flex-1 bg-amber-400 shadow-sm shadow-amber-400" />
          </div>
        )}

        {/* Transfer time between classes */}
        {sortedSubjects.map((subject, index) => {
          const previousSubject = sortedSubjects[index - 1]
          if (!previousSubject) return null

          const previousEnd = toMinutes(previousSubject.endTime)
          const gapMinutes = toMinutes(subject.startTime) - previousEnd
          if (gapMinutes <= 0) return null

          const hours = Math.floor(gapMinutes / 60)
          const remainingMinutes = gapMinutes % 60
          const duration = hours
            ? `${hours} h${remainingMinutes ? ` ${remainingMinutes} min` : ''}`
            : `${gapMinutes} min`

          return (
            <div
              key={`transfer-${previousSubject.id}-${subject.id}`}
              className="pointer-events-none absolute left-8 right-1 z-10 flex items-center justify-center"
              style={{
                top: `${(previousEnd - DAY_START) * MINUTE_HEIGHT}px`,
                height: `${gapMinutes * MINUTE_HEIGHT}px`,
              }}
            >
              <span className="rounded-full border border-slate-800 bg-slate-950/90 px-2 py-0.5 text-[9px] font-semibold leading-none text-slate-400">
                Přesun: {duration}
              </span>
            </div>
          )
        })}

        {/* Subjects */}
        {computeSubjectLayout(sortedSubjects).map(({ subject, laneIndex, laneCount, laneOffset, laneWidth, start, end }) => {
          const top = Math.max(0, (start ?? 0) - DAY_START) * MINUTE_HEIGHT
          const duration = Math.max(30, (end ?? start ?? 0) - (start ?? 0))
          const cardHeight = duration * MINUTE_HEIGHT

          const isCurrent = isToday && currentMinutes >= (start ?? 0) && currentMinutes < (end ?? 0)

          return (
            <div
              key={subject.id}
              className="absolute left-8 right-1"
              style={{
                top: `${top}px`,
                height: `${cardHeight}px`,
                zIndex: 20 + laneIndex,
              }}
            >
              <div
                className="absolute inset-y-0"
                style={{ left: `${laneOffset}%`, width: `${laneWidth}%` }}
              >
                <SubjectCard
                  subject={subject}
                  variant="timeline"
                  isCurrent={isCurrent}
                  hasConflict={hasScheduleConflict(subject, sortedSubjects)}
                />
              </div>
            </div>
          )
        })}

        {/* Free day / Holiday banner */}
        {!day.subjects.length && (
          <div className="absolute inset-x-3 top-8 z-30 flex justify-center">
            <div
              className={`max-w-[220px] rounded-xl border px-3 py-2 text-center text-xs font-semibold shadow-lg shadow-slate-950/30 ${
                publicHoliday
                  ? 'border-amber-400/40 bg-amber-400/10 text-amber-200 shadow-amber-950/20'
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