import { CalendarDays } from 'lucide-react'
import type { ScheduleWeek } from '../types/schedule'

interface WeekTabsProps {
  weeks: ScheduleWeek[]
  activeWeekId: string
  onChange: (weekId: string) => void
}

export function WeekTabs({ weeks, activeWeekId, onChange }: WeekTabsProps) {
  return (
    <nav aria-label="Výběr týdne" className="schedule-scroll flex snap-x gap-2 overflow-x-auto px-1 pb-3">
      {weeks.map((week, index) => (
        <button
          key={week.id}
          type="button"
          onClick={() => onChange(week.id)}
          aria-current={week.id === activeWeekId ? 'page' : undefined}
          className={`flex min-w-max snap-start items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition sm:px-4 sm:py-3 ${week.id === activeWeekId
            ? 'border-amber-400 bg-amber-400 text-slate-950 shadow-lg shadow-amber-950/20'
            : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-500 hover:bg-slate-700'
            }`}
        >
          <CalendarDays size={17} />
          <span className="text-sm font-semibold">{week.label || `Týden ${index + 1}`}</span>
        </button>
      ))}
    </nav>
  )
}