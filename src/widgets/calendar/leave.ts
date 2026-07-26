import { useLiveQuery } from 'dexie-react-hooks'
import { getKV, setKV } from '@/lib/db'
import { holidayMap, isWorkday, toISODate } from '@/lib/holidays'

/**
 * Congés posés par l'utilisateur.
 *
 * Stockés comme une simple liste de dates ISO : le volume est minuscule
 * et cela reste lisible dans un export. Le solde se calcule à partir
 * d'un droit annuel réglable (25 jours ouvrés par défaut en France).
 */

const DAYS_KEY = 'calendar.leaveDays'
const ALLOWANCE_KEY = 'calendar.leaveAllowance'

export const DEFAULT_ALLOWANCE = 25

export async function loadLeaveDays(): Promise<string[]> {
  return getKV<string[]>(DAYS_KEY, [])
}

export async function toggleLeaveDay(date: string): Promise<void> {
  const days = await loadLeaveDays()
  const next = days.includes(date) ? days.filter((d) => d !== date) : [...days, date]
  await setKV(DAYS_KEY, next.sort())
}

export async function setAllowance(days: number): Promise<void> {
  await setKV(ALLOWANCE_KEY, days)
}

export interface LeaveState {
  days: Set<string>
  allowance: number
  /** Congés posés sur l'année en cours. */
  usedThisYear: number
  remaining: number
}

export function useLeave(year: number): LeaveState {
  const state = useLiveQuery(async () => {
    const [days, allowance] = await Promise.all([
      loadLeaveDays(),
      getKV<number>(ALLOWANCE_KEY, DEFAULT_ALLOWANCE),
    ])
    const used = days.filter((d) => d.startsWith(`${year}-`)).length
    return {
      days: new Set(days),
      allowance,
      usedThisYear: used,
      remaining: allowance - used,
    }
  }, [year])

  return (
    state ?? {
      days: new Set<string>(),
      allowance: DEFAULT_ALLOWANCE,
      usedThisYear: 0,
      remaining: DEFAULT_ALLOWANCE,
    }
  )
}

/**
 * Jours de congé à poser pour couvrir une période, en ne comptant que les
 * jours ouvrés : poser le vendredi d'un pont ne coûte qu'un seul jour.
 */
export function leaveCost(dates: string[], years: number[]): number {
  const holidays = holidayMap(years)
  return dates.filter((d) => {
    const [y, m, day] = d.split('-').map(Number)
    return isWorkday(new Date(y!, m! - 1, day!), holidays)
  }).length
}

export { toISODate }
