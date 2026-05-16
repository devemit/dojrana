<script lang="ts">
  import { LoaderCircle, LocateFixed, Search } from '@lucide/svelte'
  import CategoryFilter from './lib/CategoryFilter.svelte'
  import MapView from './lib/MapView.svelte'
  import PlaceDetails from './lib/PlaceDetails.svelte'
  import PlaceList from './lib/PlaceList.svelte'
  import { categories, places } from './lib/data/places'
  import { distanceBetween } from './lib/geo'
  import { translations } from './lib/i18n'
  import { getRoute, RouteRequestError } from './lib/routing'
  import type {
    CategoryFilterId,
    Coordinates,
    Language,
    Place,
    RouteErrorCode,
    RouteMode,
    RouteResult,
    RouteStatus,
  } from './lib/types'

  type LocationStatus =
    | 'idle'
    | 'locating'
    | 'granted'
    | 'denied'
    | 'unavailable'
    | 'unsupported'

  const languageStorageKey = 'dojrana:language'

  let language = $state<Language>('mk')
  let activeCategory = $state<CategoryFilterId>('featured')
  let searchQuery = $state('')
  let selectedPlaceId = $state(places.find((place) => place.featured)?.id ?? places[0].id)
  let userLocation = $state<Coordinates | null>(null)
  let userFocusRequest = $state(0)
  let locationStatus = $state<LocationStatus>('idle')
  let routeMode = $state<RouteMode>('foot-walking')
  let routeStatus = $state<RouteStatus>('idle')
  let routeError = $state<RouteErrorCode | null>(null)
  let activeRoute = $state<RouteResult | null>(null)
  let activeRoutePlaceId = $state<string | null>(null)
  let activeRouteOrigin = $state<Coordinates | null>(null)
  let routeFocusRequest = $state(0)
  let routeRequestSerial = 0
  let previousRouteSelectedId = ''

  const t = $derived(translations[language])

  const filteredPlaces = $derived.by(() => {
    const normalizedQuery = normalizeSearch(searchQuery)

    return places?.filter((place) => {
      const matchesCategory =
        activeCategory === 'all' ||
        (activeCategory === 'featured' ? place.featured : placeHasCategory(place, activeCategory))

      if (!matchesCategory) return false
      if (!normalizedQuery) return true

      const searchable = normalizeSearch(
        [
          place.name.mk,
          place.name.en,
          place.description.mk,
          place.description.en,
          place.address?.mk,
          place.address?.en,
          place.tags?.join(' '),
        ]
          .filter(Boolean)
          .join(' '),
      )

      return searchable.includes(normalizedQuery)
    })
  })

  const selectedPlace = $derived(
    filteredPlaces?.find((place) => place.id === selectedPlaceId) ?? filteredPlaces?.[0] ?? null,
  )

  const categoryCounts = $derived.by(() => {
    const counts = Object.fromEntries(categories.map((category) => [category.id, 0])) as Record<
      CategoryFilterId,
      number
    >

    counts.all = places.length
    counts.featured = places.filter((place) => place.featured).length

    for (const place of places) {
      for (const category of placeCategoryIds(place)) {
        counts[category] += 1
      }
    }

    return counts
  })

  $effect(() => {
    const savedLanguage = localStorage.getItem(languageStorageKey)

    if (savedLanguage === 'mk' || savedLanguage === 'en') {
      language = savedLanguage
    }
  })

  $effect(() => {
    document.documentElement.lang = language
    localStorage.setItem(languageStorageKey, language)
  })

  $effect(() => {
    if (filteredPlaces.length === 0) return

    if (!filteredPlaces.some((place) => place.id === selectedPlaceId)) {
      selectedPlaceId = filteredPlaces[0].id
    }
  })

  $effect(() => {
    const selectedId = selectedPlace?.id ?? ''

    if (!selectedId) {
      clearRoute()
      previousRouteSelectedId = ''
      return
    }

    if (previousRouteSelectedId && previousRouteSelectedId !== selectedId) {
      clearRoute()
    }

    previousRouteSelectedId = selectedId
  })

  $effect(() => {
    if (!activeRoute || !activeRouteOrigin || !userLocation) return

    if (distanceBetween(activeRouteOrigin, userLocation) > 50) {
      clearRoute()
    }
  })

  function normalizeSearch(value: string) {
    return value.trim().toLocaleLowerCase('mk-MK')
  }

  function placeHasCategory(place: Place, category: CategoryFilterId) {
    if (category === 'all') return true
    if (category === 'featured') return Boolean(place.featured)

    return placeCategoryIds(place).includes(category)
  }

  function placeCategoryIds(place: Place) {
    return [place.category, ...(place.additionalCategories ?? [])]
  }

  function setLanguage(nextLanguage: Language) {
    language = nextLanguage
  }

  function setActiveCategory(category: CategoryFilterId) {
    activeCategory = category
  }

  function selectPlace(placeId: string) {
    selectedPlaceId = placeId
  }

  function locateUser() {
    if (userLocation) {
      userFocusRequest += 1
    }

    void requestCurrentLocation().catch(() => undefined)
  }

  function requestCurrentLocation() {
    if (!('geolocation' in navigator)) {
      locationStatus = 'unsupported'
      return Promise.reject(new RouteRequestError('missing-location', 'Geolocation is not supported.'))
    }

    locationStatus = 'locating'

    return new Promise<Coordinates>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const nextLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }

          userLocation = nextLocation
          locationStatus = 'granted'
          userFocusRequest += 1
          resolve(nextLocation)
        },
        (error) => {
          locationStatus = error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable'
          reject(new RouteRequestError('missing-location', 'Location is unavailable.'))
        },
        {
          enableHighAccuracy: true,
          maximumAge: 30000,
          timeout: 10000,
        },
      )
    })
  }

  function clearRoute() {
    routeRequestSerial += 1
    activeRoute = null
    activeRoutePlaceId = null
    activeRouteOrigin = null
    routeStatus = 'idle'
    routeError = null
  }

  function setRouteMode(nextMode: RouteMode) {
    routeMode = nextMode

    if (activeRoutePlaceId === selectedPlace?.id) {
      void requestRoute(nextMode)
      return
    }

    if (routeStatus === 'error') {
      routeStatus = 'idle'
      routeError = null
    }
  }

  async function requestRoute(mode = routeMode) {
    const destination = selectedPlace

    if (!destination) return

    routeMode = mode
    routeStatus = 'loading'
    routeError = null

    const requestId = ++routeRequestSerial

    try {
      const origin = userLocation ?? (await requestCurrentLocation())
      const route = await getRoute(origin, destination, mode)

      if (requestId !== routeRequestSerial) return

      activeRoute = route
      activeRoutePlaceId = destination.id
      activeRouteOrigin = origin
      routeStatus = 'ready'
      routeFocusRequest += 1
    } catch (error) {
      if (requestId !== routeRequestSerial) return

      activeRoute = null
      activeRoutePlaceId = null
      activeRouteOrigin = null
      routeStatus = 'error'
      routeError = error instanceof RouteRequestError ? error.code : 'request-failed'
    }
  }
</script>

<main class="app-shell">
  <header class="app-header">
    <div class="brand-row">
      <div class="brand">
        <h1>{t.appTitle}</h1>
        <p>{t.appSubtitle}</p>
      </div>

      <div class="language-toggle" aria-label="Language">
        <button
          type="button"
          class:active={language === 'mk'}
          aria-pressed={language === 'mk'}
          onclick={() => setLanguage('mk')}
        >
          MK
        </button>
        <button
          type="button"
          class:active={language === 'en'}
          aria-pressed={language === 'en'}
          onclick={() => setLanguage('en')}
        >
          EN
        </button>
      </div>
    </div>

    <div class="location-row">
      <span class={`status-dot status-dot--${locationStatus}`} aria-hidden="true"></span>
      <span>{t.location[locationStatus]}</span>
      <button type="button" onclick={locateUser} disabled={locationStatus === 'locating'}>
        {#if locationStatus === 'locating'}
          <LoaderCircle size={16} strokeWidth={2.4} aria-hidden="true" />
        {:else}
          <LocateFixed size={16} strokeWidth={2.4} aria-hidden="true" />
        {/if}
        {locationStatus === 'locating' ? t.locating : t.locate}
      </button>
    </div>
  </header>

  <section class="controls" aria-label="Search and filters">
    <label class="search-box">
      <Search size={18} strokeWidth={2.3} aria-hidden="true" />
      <input bind:value={searchQuery} type="search" placeholder={t.searchPlaceholder} />
    </label>

    <CategoryFilter
      {categories}
      {activeCategory}
      counts={categoryCounts}
      {t}
      onSelect={setActiveCategory}
    />
  </section>

  <section class="content">
    <section class="map-panel" aria-label="Dojran map">
      <MapView
        places={filteredPlaces}
        selectedPlaceId={selectedPlace?.id ?? ''}
        {userLocation}
        {language}
        mapErrorLabel={t.mapUnavailable}
        {userFocusRequest}
        routeCoordinates={activeRoutePlaceId === selectedPlace?.id ? activeRoute?.coordinates ?? null : null}
        {routeFocusRequest}
        onSelectPlace={selectPlace}
      />
    </section>

    <aside class="results-panel">
      <PlaceDetails
        place={selectedPlace}
        {userLocation}
        {language}
        {t}
        {routeMode}
        {routeStatus}
        routeSummary={activeRoutePlaceId === selectedPlace?.id ? activeRoute?.summary ?? null : null}
        {routeError}
        onRouteModeChange={setRouteMode}
        onRequestRoute={() => void requestRoute()}
      />
      <PlaceList
        places={filteredPlaces}
        selectedPlaceId={selectedPlace?.id ?? ''}
        {userLocation}
        {language}
        {t}
        onSelectPlace={selectPlace}
      />
    </aside>
  </section>
</main>
