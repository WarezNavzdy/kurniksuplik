import { CalendarDays, Coffee, Sparkles } from 'lucide-react'
import type { ScheduleDay } from '../types/schedule'
import { getPublicHolidayName } from '../utils/holidays'
import { SubjectCard } from './SubjectCard'

interface DayAgendaProps {
  day: ScheduleDay
  isToday?: boolean
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function DayAgenda({ day, isToday = false }: DayAgendaProps) {
  const publicHoliday = !day.subjects.length ? getPublicHolidayName(day.date) : null
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  // Sort subjects chronologically
  const sortedSubjects = [...day.subjects].sort(
    (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime)
  )

  return (
    <div className="space-y-3">
      {/* Day summary header */}
      <div className="flex items-center justify-between rounded-xl bg-slate-900/90 px-4 py-3 border border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <CalendarDays size={18} className="text-amber-400" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base">{day.dayName}</span>
              {isToday && (
                <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-950">
                  Dnes
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">{day.date || 'Bez data'}</p>
          </div>
        </div>

        <span className="text-xs font-semibold text-slate-400 bg-slate-800/80 rounded-lg px-2.5 py-1">
          {sortedSubjects.length === 0
            ? 'Volno'
            : `${sortedSubjects.length} ${
                sortedSubjects.length === 1
                  ? 'hodina'
                  : sortedSubjects.length < 5
                  ? 'hodiny'
                  : 'hodin'
              }`}
        </span>
      </div>

      {/* Class List */}
      {sortedSubjects.length > 0 ? (
        <div className="space-y-3">
          {sortedSubjects.map((subject) => {
            const startM = toMinutes(subject.startTime)
            const endM = toMinutes(subject.endTime)
            const isCurrent = isToday && currentMinutes >= startM && currentMinutes < endM

            return (
              <SubjectCard
                key={subject.id}
                subject={subject}
                variant="agenda"
                isCurrent={isCurrent}
              />
            )
          })}
        </div>
      ) : (
        /* Empty / Holiday State */
        <div
          className={`flex flex-col items-center justify-center rounded-2xl border p-8 text-center transition-all ${
            publicHoliday
              ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-slate-900 text-amber-200'
              : 'border-slate-800 bg-slate-900/60 text-slate-400'
          }`}
        >
          {publicHoliday ? (
            <>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/30">
                <Sparkles size={24} />
              </div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-amber-300">
                Státní svátek
              </h4>
              <p className="mt-1.5 max-w-sm text-base font-semibold text-slate-100">
                {publicHoliday}
              </p>
              {day.date && <p className="mt-1 text-xs text-amber-300/70">{day.date}</p>}
            </>
          ) : (
            <>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-400 ring-1 ring-slate-700/50">
                <Coffee size={24} className="text-amber-400/80" />
              </div>
              <h4 className="text-base font-bold text-slate-200">Volný den</h4>
              <p className="mt-1 text-sm text-slate-400">
                Pro tento den nemáš v rozvrhu žádnou výuku. Užij si volno!
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

