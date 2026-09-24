import { CalendarDays, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { useEffect, useRef } from 'react'
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

  // Scroll active tab into view when changed
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const activeBtn = container.querySelector('[aria-current="page"]') as HTMLElement | null
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [activeWeekId])

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
      {/* Prev button */}
      <button
        type="button"
        onClick={handlePrev}
        disabled={activeIndex <= 0}
        aria-label="Předchozí týden"
        className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-white disabled:opacity-25 disabled:pointer-events-none transition-colors"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Week pills horizontal scroll */}
      <nav
        ref={scrollContainerRef}
        aria-label="Výběr týdne"
        className="schedule-scroll flex flex-1 snap-x gap-2 overflow-x-auto py-1 px-0.5"
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
              className={`flex shrink-0 snap-start items-center gap-2 rounded-xl px-3.5 py-2.5 text-left transition-all duration-150 ${
                isActive
                  ? isCurrent
                    ? 'border-2 border-amber-400 bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/25 ring-2 ring-amber-400/30'
                    : 'border-2 border-amber-400 bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : isCurrent
                  ? 'border-2 border-amber-400 bg-slate-900 text-amber-300 font-bold shadow-md shadow-amber-400/15 ring-1 ring-amber-400/40 hover:bg-slate-850'
                  : 'border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:bg-slate-850 hover:text-white'
              }`}
            >
              <CalendarDays
                size={16}
                className={isActive ? 'text-slate-950' : isCurrent ? 'text-amber-400' : 'text-slate-400'}
              />
              <span className="text-xs font-bold sm:text-sm whitespace-nowrap">
                {week.label || `Týden ${index + 1}`}
              </span>

              {/* High-visibility Aktuální badge */}
              {isCurrent && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                    isActive
                      ? 'bg-slate-950 text-amber-400 ring-1 ring-slate-900'
                      : 'bg-amber-400 text-slate-950 shadow-sm'
                  }`}
                >
                  <Sparkles size={10} className={isActive ? 'text-amber-400' : 'text-slate-950'} />
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
        className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-white disabled:opacity-25 disabled:pointer-events-none transition-colors"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}