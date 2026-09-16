export interface Subject {
  id: string
  name: string
  source?: 'circle' | 'elective'
  sourceCode?: string
  teacher?: string
  course?: string
  room?: string
  building?: string
  mapUrl?: string
  startTime: string
  endTime: string
  color?: string
  note?: string
}

export interface ScheduleDay {
  date: string
  dayName: string
  subjects: Subject[]
}

export interface ScheduleWeek {
  id: string
  label: string
  weekNumber?: number
  days: ScheduleDay[]
}

export interface ScheduleResponse {
  weeks: ScheduleWeek[]
}

export interface ApiClass {
  subject: string
  teacher?: string
  course?: string
  room?: string
  building?: string
  start: string
  end: string
  type?: string
  subjectId: string
  color?: string
}

export interface ApiDay {
  day: string
  date: string
  week: string | number | null
  classes: ApiClass[]
}

export interface ApiScheduleResponse {
  source?: string
  group?: string
  semester?: string
  generatedAt?: string
  days: ApiDay[]
}

export type SchedulePayload = ScheduleWeek[] | ScheduleResponse | ApiScheduleResponse