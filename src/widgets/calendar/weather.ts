import { useEffect, useState } from 'react'
import { getKV, setKV } from '@/lib/db'

/**
 * Météo via Open-Meteo : gratuit, sans clé, sans compte.
 *
 * Seule dépendance réseau de LifeOS, et elle est facultative : en cas
 * d'échec ou hors ligne, le widget disparaît simplement. Rien d'autre
 * n'en dépend.
 */

const LOCATION_KEY = 'calendar.location'

export interface Location {
  name: string
  latitude: number
  longitude: number
}

export const DEFAULT_LOCATION: Location = {
  name: 'Paris',
  latitude: 48.8566,
  longitude: 2.3522,
}

export async function loadLocation(): Promise<Location> {
  return getKV<Location>(LOCATION_KEY, DEFAULT_LOCATION)
}

export async function saveLocation(location: Location): Promise<void> {
  await setKV(LOCATION_KEY, location)
}

/** Recherche une commune (géocodage Open-Meteo, gratuit). */
export async function searchCity(query: string): Promise<Location[]> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.searchParams.set('name', query)
  url.searchParams.set('count', '5')
  url.searchParams.set('language', 'fr')
  const res = await fetch(url)
  if (!res.ok) return []
  const data = (await res.json()) as {
    results?: { name: string; latitude: number; longitude: number; admin1?: string }[]
  }
  return (data.results ?? []).map((r) => ({
    name: r.admin1 ? `${r.name} (${r.admin1})` : r.name,
    latitude: r.latitude,
    longitude: r.longitude,
  }))
}

export interface DailyWeather {
  date: string
  code: number
  tempMax: number
  tempMin: number
  /** Probabilité de précipitations, en pourcentage. */
  rainChance: number
}

/** Traduction des codes WMO en libellé et emoji. */
export function describeWeather(code: number): { label: string; emoji: string } {
  if (code === 0) return { label: 'Ciel dégagé', emoji: '☀️' }
  if (code <= 2) return { label: 'Peu nuageux', emoji: '🌤️' }
  if (code === 3) return { label: 'Couvert', emoji: '☁️' }
  if (code <= 48) return { label: 'Brouillard', emoji: '🌫️' }
  if (code <= 57) return { label: 'Bruine', emoji: '🌦️' }
  if (code <= 67) return { label: 'Pluie', emoji: '🌧️' }
  if (code <= 77) return { label: 'Neige', emoji: '🌨️' }
  if (code <= 82) return { label: 'Averses', emoji: '🌦️' }
  if (code <= 86) return { label: 'Averses de neige', emoji: '🌨️' }
  return { label: 'Orage', emoji: '⛈️' }
}

export async function fetchForecast(location: Location, days = 7): Promise<DailyWeather[]> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(location.latitude))
  url.searchParams.set('longitude', String(location.longitude))
  url.searchParams.set(
    'daily',
    'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
  )
  url.searchParams.set('timezone', 'auto')
  url.searchParams.set('forecast_days', String(days))

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Météo indisponible (${res.status})`)
  const data = (await res.json()) as {
    daily: {
      time: string[]
      weather_code: number[]
      temperature_2m_max: number[]
      temperature_2m_min: number[]
      precipitation_probability_max: (number | null)[]
    }
  }

  return data.daily.time.map((date, i) => ({
    date,
    code: data.daily.weather_code[i] ?? 0,
    tempMax: Math.round(data.daily.temperature_2m_max[i] ?? 0),
    tempMin: Math.round(data.daily.temperature_2m_min[i] ?? 0),
    rainChance: data.daily.precipitation_probability_max[i] ?? 0,
  }))
}

export interface WeatherState {
  location: Location
  days: DailyWeather[]
  /** Indexé par date ISO, pour la grille du mois. */
  byDate: Map<string, DailyWeather>
  loading: boolean
  /** La météo a échoué : on n'affiche rien, sans casser la page. */
  failed: boolean
}

export function useWeather(): WeatherState {
  const [location, setLocation] = useState<Location>(DEFAULT_LOCATION)
  const [days, setDays] = useState<DailyWeather[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const loc = await loadLocation()
        if (cancelled) return
        setLocation(loc)
        const forecast = await fetchForecast(loc)
        if (cancelled) return
        setDays(forecast)
      } catch {
        if (!cancelled) setFailed(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return {
    location,
    days,
    byDate: new Map(days.map((d) => [d.date, d])),
    loading,
    failed,
  }
}
