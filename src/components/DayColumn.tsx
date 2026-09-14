import { CalendarDays } from 'lucide-react'
import type { ScheduleDay } from '../types/schedule'
import { SubjectCard } from './SubjectCard'

export function DayColumn({ day }: { day: ScheduleDay }) {
  return (
    <section className="min-w-0 flex-[0_0_calc(100vw-3.5rem)] snap-start rounded-2xl border border-slate-200 bg-slate-50/80 p-3 sm:flex-[0_0_320px] lg:flex-auto">
      <header className="mb-3 flex items-center justify-between border-b border-slate-200 px-2 pb-3">
        <div><h2 className="font-bold text-slate-900">{day.dayName}</h2><p className="text-xs text-slate-500">{day.date}</p></div>
        <CalendarDays size={18} className="text-teal-700" />
      </header>
      <div className="space-y-3">{day.subjects.length ? day.subjects.map((subject) => <SubjectCard key={subject.id} subject={subject} />) : <p className="px-2 py-4 text-sm text-slate-400">Volný den</p>}</div>
    </section>
  )
}