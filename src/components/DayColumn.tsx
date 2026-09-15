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

export function DayColumn({ day }: { day: ScheduleDay }) {
  return (
    <section className="min-w-0 flex-[0_0_calc(100vw-3.5rem)] snap-start rounded-2xl border border-slate-200 bg-slate-100/90 p-1 sm:flex-[0_0_320px] lg:flex-auto">
      <header className="mb-3 flex items-center justify-between border-b border-slate-200 px-2 pb-3">
        <div><h2 className="font-bold text-slate-900">{day.dayName}</h2><p className="text-xs text-slate-500">{day.date}</p></div>
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
        {!day.subjects.length && <p className="absolute left-10 top-8 text-sm text-slate-400">Volný den</p>}
      </div>
    </section>
  )
}