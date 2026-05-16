<script lang="ts">
  import { LoaderCircle, LocateFixed, Search } from '@lucide/svelte'
  import CategoryFilter from './lib/CategoryFilter.svelte'
  import MapView from './lib/MapView.svelte'
  import PlaceDetails from './lib/PlaceDetails.svelte'
  import PlaceList from './lib/PlaceList.svelte'
  import { categories, places } from './lib/data/places'
  import { translations } from './lib/i18n'
  import type { CategoryFilterId, Coordinates, Language } from './lib/types'

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

  const t = $derived(translations[language])

  const filteredPlaces = $derived.by(() => {
    const normalizedQuery = normalizeSearch(searchQuery)

    return places.filter((place) => {
      const matchesCategory =
        activeCategory === 'all' ||
        (activeCategory === 'featured' ? place.featured : place.category === activeCategory)

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
    filteredPlaces.find((place) => place.id === selectedPlaceId) ?? filteredPlaces[0] ?? null,
  )

  const categoryCounts = $derived.by(() => {
    const counts = Object.fromEntries(categories.map((category) => [category.id, 0])) as Record<
      CategoryFilterId,
      number
    >

    counts.all = places.length
    counts.featured = places.filter((place) => place.featured).length

    for (const place of places) {
      counts[place.category] += 1
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

  function normalizeSearch(value: string) {
    return value.trim().toLocaleLowerCase('mk-MK')
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
    if (!('geolocation' in navigator)) {
      locationStatus = 'unsupported'
      return
    }

    if (userLocation) {
      userFocusRequest += 1
    }

    locationStatus = 'locating'

    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        locationStatus = 'granted'
        userFocusRequest += 1
      },
      (error) => {
        locationStatus = error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable'
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 10000,
      },
    )
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
        onSelectPlace={selectPlace}
      />
    </section>

    <aside class="results-panel">
      <PlaceDetails place={selectedPlace} {userLocation} {language} {t} />
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
