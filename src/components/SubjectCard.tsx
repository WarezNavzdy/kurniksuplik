import { BookOpen, Clock, ExternalLink, MapPin, Sparkles, UserRound } from 'lucide-react'
import type { Subject } from '../types/schedule'

interface SubjectCardProps {
  subject: Subject
  variant?: 'timeline' | 'agenda'
  isCurrent?: boolean
}

function getDurationMinutes(start?: string, end?: string): number {
  if (!start || !end) return 0

  const [sh = 0, sm = 0] = start.split(':').map(Number)
  const [eh = 0, em = 0] = end.split(':').map(Number)

  if (Number.isNaN(sh) || Number.isNaN(eh)) return 0

  return eh * 60 + em - (sh * 60 + sm)
}

export function SubjectCard({ subject, variant = 'timeline', isCurrent = false }: SubjectCardProps) {
  const duration = getDurationMinutes(subject.startTime, subject.endTime)
  const hasLongName = (subject.name || '').length > 35
  const accentColor = subject.color || (subject.source === 'elective' ? '#2dd4bf' : '#fbbf24')

  if (variant === 'agenda') {
    return (
      <article
        className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 ${
          isCurrent
            ? 'border-amber-400/80 bg-slate-900 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/40'
            : 'border-slate-800/90 bg-slate-900/95 hover:border-slate-700 hover:bg-slate-900'
        }`}
      >
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1.5"
          style={{ backgroundColor: accentColor }}
        />

        <div className="p-4 pl-5">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-bold text-amber-300">
                <Clock size={13} className="text-amber-400" />
                {subject.startTime || '—'} – {subject.endTime || '—'}
              </span>
              {duration > 0 && <span className="text-[11px] font-medium text-slate-400">{duration} min</span>}
            </div>

            <div className="flex items-center gap-1.5">
              {isCurrent && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-300 ring-1 ring-amber-400/30">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                  Právě probíhá
                </span>
              )}

              {subject.source === 'elective' && (
                <span className="inline-flex items-center gap-1 rounded-full border border-teal-800/60 bg-teal-950/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-300">
                  <Sparkles size={10} className="text-teal-400" />
                  Volitelný
                </span>
              )}
            </div>
          </div>

          <h3 className="text-base font-bold leading-snug tracking-tight text-white transition-colors group-hover:text-amber-200">
            {subject.name || 'Předmět bez názvu'}
          </h3>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-800/80 pt-3 text-xs text-slate-300">
            {subject.teacher && (
              <div className="flex items-center gap-1.5 text-slate-300">
                <UserRound size={14} className="shrink-0 text-slate-400" />
                <span className="font-medium">{subject.teacher}</span>
              </div>
            )}

            {(subject.room || subject.building) && (
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="shrink-0 text-teal-400" />
                {subject.room && <span className="font-semibold text-slate-200">{subject.room}</span>}
                {subject.room && subject.building && <span className="text-slate-500">·</span>}
                {subject.building && (
                  subject.mapUrl ? (
                    <a
                      href={subject.mapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-teal-400 underline decoration-teal-500/40 underline-offset-2 transition-colors hover:text-teal-300"
                      title={`Otevřít mapu budovy ${subject.building}`}
                    >
                      {subject.building}
                      <ExternalLink size={11} />
                    </a>
                  ) : (
                    <span className="text-slate-400">{subject.building}</span>
                  )
                )}
              </div>
            )}

            {(subject.course || subject.note) && (
              <div className="text-[11px] font-medium text-slate-400">
                <span className="rounded bg-slate-800/70 px-1.5 py-0.5">
                  {[subject.course, subject.note].filter(Boolean).join(' · ')}
                </span>
              </div>
            )}
          </div>
        </div>
      </article>
    )
  }

  return (
    <article
      className={`group relative h-full overflow-hidden rounded-xl border p-2 transition-all duration-150 ${
        isCurrent
          ? 'border-amber-400/90 bg-slate-900 shadow-md ring-1 ring-amber-400/40'
          : 'border-slate-800/90 bg-slate-900/95 hover:border-amber-400/50 hover:bg-slate-850'
      }`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-1"
        style={{ backgroundColor: accentColor }}
      />

      <div className="h-full overflow-y-auto pl-1.5 pr-0.5 text-slate-200">
        <div className={`flex items-start justify-between gap-1.5 ${hasLongName ? 'flex-col' : ''}`}>
          <h3
            className={`flex min-w-0 items-start gap-1 font-bold leading-tight text-white group-hover:text-amber-200 ${
              hasLongName ? 'text-[11px]' : 'text-xs'
            }`}
          >
            <BookOpen size={12} className="mt-0.5 shrink-0 text-amber-400" />
            <span className="line-clamp-2">{subject.name || 'Předmět'}</span>
          </h3>
          <span
            className={`shrink-0 rounded bg-slate-800 px-1 py-0.5 text-[9px] font-bold text-amber-300 ${
              hasLongName ? 'self-end' : ''
            }`}
          >
            {subject.startTime || '—'}–{subject.endTime || '—'}
          </span>
        </div>

        {subject.source === 'elective' && (
          <span className="mt-1 inline-block rounded border border-teal-800/40 bg-teal-950 px-1 py-0.2 text-[8px] font-extrabold uppercase tracking-wide text-teal-300">
            Volitelný
          </span>
        )}

        <div className="mt-1.5 space-y-0.5 text-[10px] leading-tight text-slate-400">
          {subject.teacher && (
            <p className="flex min-w-0 items-center gap-1 text-slate-300">
              <UserRound size={10} className="shrink-0 text-slate-400" />
              <span className="truncate">{subject.teacher}</span>
            </p>
          )}
          <p className="flex items-center gap-1">
            <MapPin size={10} className="shrink-0 text-teal-400" />
            {subject.room || subject.building ? (
              <>
                {subject.room && <span className="font-medium text-slate-200">{subject.room}</span>}
                {subject.room && subject.building && <span>·</span>}
                {subject.building && (
                  subject.mapUrl ? (
                    <a
                      href={subject.mapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-0.5 font-medium text-teal-400 underline decoration-teal-500/40 underline-offset-1 hover:text-teal-300"
                      title={`Otevřít mapu budovy ${subject.building}`}
                    >
                      {subject.building}
                      <ExternalLink size={8} />
                    </a>
                  ) : (
                    <span>{subject.building}</span>
                  )
                )}
              </>
            ) : (
              'Místnost neuvedena'
            )}
          </p>
          {(subject.course || subject.note) && (
            <p className="truncate text-[9px] text-slate-400">
              {[subject.course, subject.note].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}
