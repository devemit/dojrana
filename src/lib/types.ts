export type Language = 'mk' | 'en'

export type CategoryId =
  | 'nature'
  | 'churches'
  | 'culture'
  | 'restaurants'
  | 'bars'
  | 'cafes'
  | 'atms'
  | 'markets'
  | 'useful'

export type CategoryFilterId = 'featured' | 'all' | CategoryId

export type LocalizedText = Record<Language, string>

export type OsmType = 'node' | 'way' | 'relation'

export type RouteMode = 'foot-walking' | 'driving-car'

export type RouteStatus = 'idle' | 'loading' | 'ready' | 'error'

export type RouteErrorCode = 'missing-key' | 'missing-location' | 'request-failed' | 'no-route'

export type RouteSummary = {
  distanceMeters: number
  durationSeconds: number
}

export type RouteResult = {
  coordinates: Coordinates[]
  summary: RouteSummary
}

export type Coordinates = {
  lat: number
  lng: number
}

export type Place = Coordinates & {
  id: string
  category: CategoryId
  additionalCategories?: CategoryId[]
  name: LocalizedText
  description: LocalizedText
  address?: LocalizedText
  phone?: string
  website?: string
  sourceUrl?: string
  osmType: OsmType
  osmId: number
  osmUrl: string
  verifiedAt: string
  coordinateNote?: LocalizedText
  featured?: boolean
  tags?: string[]
}

export type CategoryMeta = {
  id: CategoryFilterId
  color: string
}
