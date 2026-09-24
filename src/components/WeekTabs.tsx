import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef } from 'react'
import type { ScheduleWeek } from '../types/schedule'

interface WeekTabsProps {
  weeks: ScheduleWeek[]
  activeWeekId: string
  currentWeekId?: string
  onChange: (weekId: string) => void
}

export function WeekTabs({ weeks, activeWeekId, currentWeekId, onChange }: WeekTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const activeIndex = weeks.findIndex((w) => w.id === activeWeekId)

  const handlePrev = () => {
    if (activeIndex > 0) {
      onChange(weeks[activeIndex - 1].id)
    }
  }

  const handleNext = () => {
    if (activeIndex >= 0 && activeIndex < weeks.length - 1) {
      onChange(weeks[activeIndex + 1].id)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Prev button (hidden on tiny screens if not needed, or compact) */}
      <button
        type="button"
        onClick={handlePrev}
        disabled={activeIndex <= 0}
        aria-label="Předchozí týden"
        className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Week pills horizontal scroll */}
      <nav
        ref={scrollContainerRef}
        aria-label="Výběr týdne"
        className="schedule-scroll flex flex-1 snap-x gap-1.5 overflow-x-auto py-1 px-0.5"
      >
        {weeks.map((week, index) => {
          const isActive = week.id === activeWeekId
          const isCurrent = week.id === currentWeekId

          return (
            <button
              key={week.id}
              type="button"
              onClick={() => onChange(week.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex shrink-0 snap-start items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all duration-150 ${
                isActive
                  ? 'border-amber-400 bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : isCurrent
                  ? 'border-amber-400/60 bg-slate-900 text-amber-300 hover:bg-slate-850 hover:border-amber-400'
                  : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:bg-slate-850 hover:text-white'
              }`}
            >
              <CalendarDays size={14} className={isActive ? 'text-slate-950' : 'text-slate-400'} />
              <span className="text-xs font-semibold sm:text-sm whitespace-nowrap">
                {week.label || `Týden ${index + 1}`}
              </span>
              {isCurrent && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                    isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-amber-400 text-slate-950'
                  }`}
                >
                  Aktuální
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Next button */}
      <button
        type="button"
        onClick={handleNext}
        disabled={activeIndex >= weeks.length - 1}
        aria-label="Následující týden"
        className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}