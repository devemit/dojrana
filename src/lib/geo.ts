import type { Coordinates, Language, Place } from './types'

const EARTH_RADIUS_METERS = 6371000

const toRadians = (degrees: number) => (degrees * Math.PI) / 180

export function distanceBetween(from: Coordinates, to: Coordinates): number {
  const deltaLat = toRadians(to.lat - from.lat)
  const deltaLng = toRadians(to.lng - from.lng)
  const fromLat = toRadians(from.lat)
  const toLat = toRadians(to.lat)

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(fromLat) *
      Math.cos(toLat) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2)

  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(meters: number, language: Language): string {
  if (meters < 1000) {
    return `${Math.round(meters / 10) * 10} m`
  }

  const value = meters / 1000
  return `${value.toLocaleString(language === 'mk' ? 'mk-MK' : 'en', {
    maximumFractionDigits: value < 10 ? 1 : 0,
  })} km`
}

export function googleDirectionsUrl(place: Place, origin?: Coordinates | null): string {
  const destination = `${place.lat},${place.lng}`

  if (!origin) {
    return `https://www.google.com/maps/search/?api=1&query=${destination}`
  }

  return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination}`
}

export function openStreetMapUrl(place: Place): string {
  return `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=17/${place.lat}/${place.lng}`
}
