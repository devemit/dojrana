import type { Coordinates, RouteErrorCode, RouteMode, RouteResult } from './types'

type OrsRouteFeature = {
  geometry?: {
    type: 'LineString'
    coordinates: [number, number][]
  }
  properties?: {
    summary?: {
      distance?: number
      duration?: number
    }
  }
}

type OrsRouteResponse = {
  features?: OrsRouteFeature[]
}

export class RouteRequestError extends Error {
  constructor(
    public code: RouteErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'RouteRequestError'
  }
}

export async function getRoute(
  origin: Coordinates,
  destination: Coordinates,
  mode: RouteMode,
): Promise<RouteResult> {
  const apiKey = import.meta.env.VITE_ORS_API_KEY?.trim()

  if (!apiKey) {
    throw new RouteRequestError('missing-key', 'OpenRouteService API key is missing.')
  }

  const response = await fetch(`https://api.openrouteservice.org/v2/directions/${mode}/geojson`, {
    method: 'POST',
    headers: {
      Accept: 'application/geo+json',
      Authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      coordinates: [
        [origin.lng, origin.lat],
        [destination.lng, destination.lat],
      ],
    }),
  })

  if (!response.ok) {
    throw new RouteRequestError(
      response.status === 404 ? 'no-route' : 'request-failed',
      `OpenRouteService request failed with status ${response.status}.`,
    )
  }

  const data = (await response.json()) as OrsRouteResponse
  const feature = data.features?.[0]
  const coordinates = feature?.geometry?.coordinates
  const summary = feature?.properties?.summary

  if (!coordinates?.length || !summary?.distance || !summary?.duration) {
    throw new RouteRequestError('no-route', 'OpenRouteService did not return a usable route.')
  }

  return {
    coordinates: coordinates.map(([lng, lat]) => ({ lat, lng })),
    summary: {
      distanceMeters: summary.distance,
      durationSeconds: summary.duration,
    },
  }
}
