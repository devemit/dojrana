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

export type Coordinates = {
  lat: number
  lng: number
}

export type Place = Coordinates & {
  id: string
  category: CategoryId
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
