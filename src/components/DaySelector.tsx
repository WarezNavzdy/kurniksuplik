import type { ScheduleDay } from '../types/schedule'

interface DaySelectorProps {
  days: ScheduleDay[]
  activeDate: string
  todayDate?: string
  onSelectDay: (date: string) => void
}

const SHORT_DAY_NAMES: Record<string, string> = {
  Pondělí: 'Po',
  Úterý: 'Út',
  Středa: 'St',
  Čtvrtek: 'Čt',
  Pátek: 'Pá',
  Sobota: 'So',
  Neděle: 'Ne',
}

export function DaySelector({ days, activeDate, todayDate, onSelectDay }: DaySelectorProps) {
  return (
    <div className="grid grid-cols-5 gap-1.5 rounded-2xl bg-slate-900/90 p-1.5 border border-slate-800/80">
      {days.map((day) => {
        const isSelected = day.date === activeDate
        const isToday = day.date === todayDate
        const shortName = SHORT_DAY_NAMES[day.dayName] || day.dayName.slice(0, 2)
        const hasClasses = day.subjects.length > 0

        return (
          <button
            key={day.date || day.dayName}
            type="button"
            onClick={() => onSelectDay(day.date)}
            aria-selected={isSelected}
            className={`relative flex flex-col items-center justify-center rounded-xl py-2 px-1 text-center transition-all duration-150 ${
              isSelected
                ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            {/* Day name */}
            <span className="text-xs font-bold uppercase tracking-wider">{shortName}</span>

            {/* Date */}
            <span
              className={`text-[11px] font-medium leading-tight ${
                isSelected ? 'text-slate-950' : 'text-slate-400'
              }`}
            >
              {day.date.replace(/\.$/, '')}
            </span>

            {/* Indicator dots: Today & Has classes */}
            <div className="mt-1 flex items-center gap-1">
              {isToday && (
                <span
                  title="Dnes"
                  className={`h-1.5 w-1.5 rounded-full ${
                    isSelected ? 'bg-slate-950 ring-1 ring-slate-900' : 'bg-amber-400 ring-1 ring-amber-400/50'
                  }`}
                />
              )}
              {hasClasses && !isToday && (
                <span
                  className={`h-1 w-1 rounded-full ${
                    isSelected ? 'bg-slate-900/60' : 'bg-slate-500'
                  }`}
                />
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

