function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function getEasterSunday(year: number) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1

  return new Date(year, month - 1, day)
}

function dateMatches(date: Date, day: number, month: number) {
  return date.getDate() === day && date.getMonth() + 1 === month
}

export function getPublicHolidayName(dateText: string): string | null {
  const match = dateText.match(/^(\d{1,2})\.(\d{1,2})\.?$/)
  if (!match) return null

  const day = Number(match[1])
  const month = Number(match[2])
  const currentYear = new Date().getFullYear()

  for (const year of [currentYear - 1, currentYear, currentYear + 1]) {
    const fixedHolidays: Record<string, string> = {
      '1.1': 'Nový rok',
      '1.5': 'Svátek práce - jako student toto slovo neznám',
      '8.5': 'Den vítězství - ou jé',
      '5.7': 'Den slovanských věrozvěstů Cyrila a Metoděje',
      '6.7': 'Den upálení mistra Jana Husa - Honzo, upaluj',
      '28.9': 'Den české státnosti - zabili Vaška',
      '28.10': 'Den vzniku samostatného československého státu - tatíček Masařík',
      '17.11': 'Den boje za svobodu a demokracii - slova, závist, zášť',
      '24.12': 'Štědrý den - Purpura na plotně voníííí',
      '25.12': '1. svátek vánoční',
      '26.12': '2. svátek vánoční',
    }

    const fixedKey = `${day}.${month}`
    if (fixedHolidays[fixedKey]) return fixedHolidays[fixedKey]

    const easterSunday = getEasterSunday(year)
    const holidays = [
      { date: addDays(easterSunday, -2), label: 'Velký pátek' },
      { date: addDays(easterSunday, 1), label: 'Velikonoční pondělí' },
      { date: addDays(easterSunday, 39), label: 'Nanebevstoupení Páně' },
      { date: addDays(easterSunday, 50), label: 'Svatodušní pondělí' },
    ]

    const holiday = holidays.find(({ date }) => dateMatches(date, day, month))
    if (holiday) return holiday.label
  }

  return null
}

