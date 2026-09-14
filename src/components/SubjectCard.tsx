import { BookOpen, Clock3, MapPin, UserRound } from 'lucide-react'
import type { Subject } from '../types/schedule'

interface SubjectCardProps {
  subject: Subject
}

export function SubjectCard({ subject }: SubjectCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute inset-y-0 left-0 w-1 bg-amber-400" style={{ backgroundColor: subject.color || undefined }} />
      <div className="flex items-start justify-between gap-3">
        <h3 className="flex items-center gap-2 font-bold text-slate-900"><BookOpen size={16} className="text-teal-700" />{subject.name}</h3>
        <span className="whitespace-nowrap text-xs font-bold text-slate-500">{subject.startTime}–{subject.endTime}</span>
      </div>
      <div className="mt-3 space-y-1.5 text-sm text-slate-500">
        {subject.teacher && <p className="flex items-center gap-2"><UserRound size={14} />{subject.teacher}</p>}
        {subject.room && <p className="flex items-center gap-2"><MapPin size={14} />{subject.room}</p>}
        {subject.note && <p className="pt-1 text-xs italic text-slate-400">{subject.note}</p>}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-teal-700"><Clock3 size={13} />{subject.startTime} začíná</div>
    </article>
  )
}