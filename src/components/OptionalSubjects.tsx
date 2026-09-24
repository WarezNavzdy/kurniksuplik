import { AlertTriangle, Check, ChevronDown, Search, Sparkles, X } from 'lucide-react'
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

export function OptionalSubjects({
  subjects,
  selectedCodes,
  loading,
  error,
  scheduleErrors,
  onToggle,
}: OptionalSubjectsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')

  const normalizedQuery = (query || '').trim().toLocaleLowerCase('cs-CZ')
  const filteredSubjects = subjects.filter((subject) =>
    [subject.code, subject.name, subject.instituteCode].some((value) =>
      (value || '').toLocaleLowerCase('cs-CZ').includes(normalizedQuery)
    )
  )

  const failingSelectedCodes = selectedCodes.filter((code) => Boolean(scheduleErrors[code]))

  function handleRemoveUnavailable() {
    failingSelectedCodes.forEach((code) => onToggle(code, false))
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-sm transition-all duration-200">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3.5 text-left font-bold text-slate-100 hover:text-white"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/20 text-teal-300">
            <Sparkles size={15} />
          </div>
          <span className="text-sm font-bold sm:text-base">Volitelné předměty</span>
          {selectedCodes.length > 0 && (
            <span className="rounded-full bg-teal-400 px-2 py-0.5 text-xs font-black text-slate-950">
              {selectedCodes.length}
            </span>
          )}
          {failingSelectedCodes.length > 0 && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300"
              title={`${failingSelectedCodes.length} předmětů se nepodařilo načíst`}
            >
              <AlertTriangle size={11} className="text-amber-400" />
              {failingSelectedCodes.length} nedostupných
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedCodes.length > 0 && (
            <span className="text-xs text-slate-400 hidden sm:inline">
              vybráno {selectedCodes.length}
            </span>
          )}
          <ChevronDown
            size={18}
            className={`text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-teal-400' : ''
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-slate-800/80 p-4">
          {loading && (
            <p className="py-2 text-sm text-slate-400">Načítám seznam volitelných předmětů…</p>
          )}
          {error && (
            <p role="alert" className="py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          {!loading && !error && (
            <>
              {/* Notice when some selected electives cannot be loaded */}
              {failingSelectedCodes.length > 0 && (
                <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle size={14} className="shrink-0 text-amber-400" />
                    <span>
                      {failingSelectedCodes.length}{' '}
                      {failingSelectedCodes.length === 1 ? 'předmět nemá' : 'předměty nemají'} v SIS
                      žádné rozvrhové hodiny.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveUnavailable}
                    className="shrink-0 rounded-lg bg-amber-400/20 px-2 py-1 font-bold text-amber-300 hover:bg-amber-400/30 transition-colors"
                  >
                    Odebrat nedostupné
                  </button>
                </div>
              )}

              {/* Search input with clear button */}
              <div className="relative mb-3">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Hledat předmět podle názvu nebo kódu…"
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-800/90 py-2.5 pl-9 pr-9 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-teal-400 focus:ring-1 focus:ring-teal-400/40"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label="Vymazat hledání"
                    title="Vymazat hledání"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Subject items list */}
              <div className="max-h-64 space-y-1 overflow-y-auto pr-1 schedule-scroll">
                {filteredSubjects.map((subject) => {
                  const checked = selectedCodes.includes(subject.code)
                  const hasScheduleError = scheduleErrors[subject.code]

                  return (
                    <label
                      key={subject.code}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl p-2.5 transition-colors ${
                        checked
                          ? hasScheduleError
                            ? 'bg-amber-950/30 border border-amber-800/40'
                            : 'bg-teal-950/40 border border-teal-800/50'
                          : 'hover:bg-slate-800/70 border border-transparent'
                      }`}
                    >
                      <div className="relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-slate-600 bg-slate-800">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => onToggle(subject.code, event.target.checked)}
                          className="peer sr-only"
                        />
                        {checked && (
                          <Check
                            size={12}
                            className={
                              hasScheduleError
                                ? 'text-amber-400 stroke-[3]'
                                : 'text-teal-400 stroke-[3]'
                            }
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 text-xs sm:text-sm">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-white">{subject.code}</span>
                          <span className="text-[11px] font-medium text-slate-400">
                            ({subject.instituteCode})
                          </span>
                        </div>
                        <span className="mt-0.5 block break-words text-slate-300">
                          {subject.name}
                        </span>
                        {hasScheduleError && (
                          <span className="mt-1 inline-flex items-center gap-1 rounded bg-amber-400/10 px-1.5 py-0.5 text-[11px] font-medium text-amber-300">
                            <AlertTriangle size={11} className="text-amber-400" />
                            {hasScheduleError}
                          </span>
                        )}
                      </div>
                    </label>
                  )
                })}

                {!filteredSubjects.length && (
                  <p className="py-4 text-center text-sm text-slate-400">
                    Žádný předmět neodpovídá hledání.
                  </p>
                )}
              </div>

              {/* Footer status */}
              <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-xs text-slate-400">
                <span>
                  Vybráno {selectedCodes.length} z {subjects.length} předmětů
                </span>
                {selectedCodes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      selectedCodes.forEach((code) => onToggle(code, false))
                    }}
                    className="font-semibold text-slate-400 hover:text-red-300 transition-colors"
                  >
                    Odznačit vše
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}