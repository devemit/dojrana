import {
  Banknote,
  Beer,
  Bus,
  Church,
  Coffee,
  Fuel,
  Info,
  Landmark,
  MapPinned,
  ShoppingBasket,
  Star,
  Utensils,
  Waves,
} from '@lucide/svelte'
import type { CategoryFilterId, CategoryId } from './types'

export const categoryIconComponents = {
  featured: Star,
  all: MapPinned,
  nature: Waves,
  churches: Church,
  culture: Landmark,
  restaurants: Utensils,
  bars: Beer,
  cafes: Coffee,
  atms: Banknote,
  markets: ShoppingBasket,
  useful: Info,
} satisfies Record<CategoryFilterId | CategoryId, typeof Star>

const categoryIconPaths: Record<CategoryId, string[]> = {
  nature: ['M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0', 'M2 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0'],
  churches: ['M12 2v4', 'M10 4h4', 'M6 10l6-5 6 5v10H6z', 'M10 20v-5a2 2 0 0 1 4 0v5'],
  culture: ['M3 21h18', 'M5 10h14', 'M6 10l6-6 6 6', 'M7 10v8', 'M12 10v8', 'M17 10v8'],
  restaurants: ['M4 3v7', 'M8 3v7', 'M4 7h4', 'M6 10v11', 'M14 3v18', 'M14 3a5 5 0 0 1 5 5v4h-5'],
  bars: ['M8 21h8', 'M12 15v6', 'M5 3h14l-2 8a5 5 0 0 1-10 0z', 'M7 8h10'],
  cafes: ['M6 8h11a1 1 0 0 1 1 1v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1', 'M18 10h1a3 3 0 0 1 0 6h-1', 'M8 2v3', 'M12 2v3', 'M16 2v3'],
  atms: ['M4 6h16v12H4z', 'M7 10h4', 'M7 14h2', 'M15 10v4', 'M13 12h4'],
  markets: ['M6 8h15l-2 9H8z', 'M6 8 5 4H2', 'M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2', 'M18 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2'],
  useful: ['M12 17v-5', 'M12 8h.01', 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0'],
}

export function categoryMarkerSvg(category: CategoryId) {
  const paths = categoryIconPaths[category]
    .map((path) => `<path d="${path}" />`)
    .join('')

  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths}</svg>`
}

export function usefulIconForTags(tags: string[] | undefined) {
  if (!tags) return Info
  if (tags.includes('bus')) return Bus
  if (tags.includes('fuel')) return Fuel
  return Info
}
