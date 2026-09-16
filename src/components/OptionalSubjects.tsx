import { ChevronDown, Search, Sparkles } from 'lucide-react'
import { useState } from 'react'

export interface OptionalSubject {
  code: string
  instituteCode: string
  name: string
}

interface OptionalSubjectsProps {
  subjects: OptionalSubject[]
  selectedCodes: string[]
  loading: boolean
  error: string | null
  scheduleErrors: Record<string, string>
  onToggle: (code: string, selected: boolean) => void
}

export function OptionalSubjects({ subjects, selectedCodes, loading, error, scheduleErrors, onToggle }: OptionalSubjectsProps) {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLocaleLowerCase('cs-CZ')
  const filteredSubjects = subjects.filter((subject) => [subject.code, subject.name, subject.instituteCode].some((value) => value.toLocaleLowerCase('cs-CZ').includes(normalizedQuery)))

  return (
    <details className="mb-8 rounded-2xl border border-slate-800 bg-slate-900">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 font-bold text-slate-100 marker:hidden [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2"><Sparkles size={17} className="text-teal-300" />Volitelné předměty <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">{selectedCodes.length}</span></span>
        <ChevronDown size={18} className="text-slate-400" />
      </summary>
      <div className="border-t border-slate-800 p-4">
        {loading && <p className="mb-3 text-sm text-slate-400">Načítám seznam předmětů…</p>}
        {error && <p role="alert" className="text-sm text-red-300">Seznam volitelných předmětů se nepodařilo načíst.</p>}
        {!loading && !error && <>
          <label className="relative block">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Hledat předmět…" className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 pl-9 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-teal-400" />
          </label>
          <div className="mt-3 max-h-72 space-y-1 overflow-y-auto pr-1">
            {filteredSubjects.map((subject) => {
              const checked = selectedCodes.includes(subject.code)
              return <label key={subject.code} className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2.5 hover:bg-slate-800">
                <input type="checkbox" checked={checked} onChange={(event) => onToggle(subject.code, event.target.checked)} className="mt-1 h-4 w-4 accent-teal-400" />
                <span className="min-w-0 text-sm"><span className="font-bold text-slate-100">{subject.code}</span><span className="ml-2 text-slate-500">{subject.instituteCode}</span><span className="block break-words text-slate-300">{subject.name}</span>{scheduleErrors[subject.code] && <span className="block text-xs text-red-300">{scheduleErrors[subject.code]}</span>}</span>
              </label>
            })}
            {!filteredSubjects.length && <p className="px-2 py-4 text-sm text-slate-500">Žádný předmět neodpovídá hledání.</p>}
          </div>
          <p className="mt-3 text-xs text-slate-500">Vybráno: {selectedCodes.length} předmětů</p>
        </>}
      </div>
    </details>
  )
}