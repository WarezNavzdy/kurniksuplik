import { BookOpen, ExternalLink, MapPin, UserRound } from 'lucide-react'
import type { Subject } from '../types/schedule'

interface SubjectCardProps {
  subject: Subject
}

export function SubjectCard({ subject }: SubjectCardProps) {
  const hasLongName = subject.name.length > 40

  return (
    <article className="group relative h-full overflow-x-hidden overflow-y-auto rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute inset-y-0 left-0 w-1 bg-amber-400" style={{ backgroundColor: subject.color || undefined }} />
      <div className={`flex items-start justify-between gap-2 ${hasLongName ? 'flex-col' : ''}`}>
        <h3 className={`flex min-w-0 items-start gap-1.5 font-bold leading-tight text-slate-900 ${hasLongName ? 'text-xs' : 'text-sm'}`}><BookOpen size={13} className="mt-0.5 shrink-0 text-teal-700" />{subject.name}</h3>
        <span className={`shrink-0 text-[10px] font-bold text-slate-500 ${hasLongName ? 'self-end' : ''}`}>{subject.startTime}–{subject.endTime}</span>
      </div>
      {subject.source === 'elective' && <span className="mt-1 inline-block rounded-full bg-teal-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-teal-800">Volitelný</span>}
      <div className="mt-2 space-y-1 text-[11px] leading-tight text-slate-500">
        {subject.teacher && <p className="flex min-w-0 items-start gap-1.5"><UserRound size={12} className="mt-0.5 shrink-0" /><span>{subject.teacher}</span></p>}
        <p className="flex items-center gap-1.5"><MapPin size={12} className="shrink-0" />{subject.room || subject.building ? <>{subject.room && <span>{subject.room}</span>}{subject.room && subject.building && <span> · </span>}{subject.building && (subject.mapUrl ? <a href={subject.mapUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-teal-700 underline decoration-teal-200 underline-offset-2 hover:text-teal-900" title={`Otevřít mapu budovy ${subject.building}`}>{subject.building}<ExternalLink size={10} /></a> : <span>{subject.building}</span>)}</> : 'Místnost neuvedena'}</p>
        {(subject.course || subject.note) && <p className="pt-0.5 text-[10px] italic text-slate-400">{[subject.course, subject.note].filter(Boolean).join(' · ')}</p>}
      </div>
    </article>
  )
}