import { AlertCircle, GraduationCap, LoaderCircle, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { DayColumn } from './components/DayColumn'
import { WeekTabs } from './components/WeekTabs'
import { useSchedule } from './hooks/useSchedule'

function formatUpdatedAt(value: string | null) {
  if (!value) return 'Čas aktualizace není k dispozici'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Čas aktualizace není k dispozici'

  return new Intl.DateTimeFormat('cs-CZ', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function App() {
  const { weeks, updatedAt, loading, error } = useSchedule()
  const [activeWeekId, setActiveWeekId] = useState('')
  const activeWeek = weeks.find((week) => week.id === activeWeekId) || weeks[0]

  return <main className="min-h-screen bg-slate-950 text-slate-100">
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-amber-400"><GraduationCap size={18} />Školní přehled</p><h1 className="text-4xl font-black tracking-tight sm:text-5xl">Můj rozvrh<span className="text-amber-400">.</span></h1><p className="mt-3 max-w-lg text-slate-400">Všechny hodiny přehledně na jednom místě.</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-400"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />Naposledy aktualizováno: {loading ? 'načítám…' : formatUpdatedAt(updatedAt)}</div>
      </header>
      {loading && <div className="flex min-h-64 items-center justify-center rounded-3xl bg-white text-slate-500"><LoaderCircle className="mr-3 animate-spin" />Načítám rozvrh…</div>}
      {error && <div role="alert" className="flex items-center gap-3 rounded-2xl border border-red-300 bg-red-50 p-5 text-red-800"><AlertCircle />{error}</div>}
      {!loading && !error && weeks.length === 0 && <div className="rounded-3xl bg-white p-10 text-center text-slate-500">API nevrátilo žádné týdny.</div>}
      {!loading && !error && activeWeek && <section className="space-y-5"><WeekTabs weeks={weeks} activeWeekId={activeWeek.id} onChange={setActiveWeekId} /><div className="schedule-scroll flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-3 lg:grid lg:grid-cols-[repeat(5,minmax(230px,1fr))] lg:gap-4 lg:overflow-x-auto lg:px-0">{activeWeek.days.map((day) => <DayColumn key={day.date} day={day} />)}</div></section>}
      {error && <button type="button" onClick={() => window.location.reload()} className="mt-4 flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 font-bold text-slate-950"><RefreshCw size={16} />Zkusit znovu</button>}
    </div>
  </main>
}

export default App