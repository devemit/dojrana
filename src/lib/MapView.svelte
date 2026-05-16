<script lang="ts">
  import { onMount } from 'svelte'
  import * as L from 'leaflet'
  import type { Coordinates, Language, Place } from './types'
  import { categoryMarkerSvg } from './categoryIcons'
  import { categoryColors } from './data/places'

  type Props = {
    places: Place[]
    selectedPlaceId: string
    userLocation: Coordinates | null
    language: Language
    mapErrorLabel: string
    userFocusRequest: number
    onSelectPlace: (id: string) => void
  }

  let {
    places,
    selectedPlaceId,
    userLocation,
    language,
    mapErrorLabel,
    userFocusRequest,
    onSelectPlace,
  }: Props = $props()

  let mapElement = $state<HTMLDivElement>()
  let mapError = $state(false)

  let map: L.Map | null = null
  let userMarker: L.CircleMarker | null = null
  let previousVisibleKey = ''
  let previousSelectedId = ''
  let previousUserFocusRequest = 0
  const markers = new globalThis.Map<string, L.Marker>()
  const dojranaCenter: L.LatLngExpression = [41.18647, 22.7203]

  onMount(() => {
    if (!mapElement) return

    map = L.map(mapElement, {
      center: dojranaCenter,
      zoom: 14,
      zoomControl: false,
      attributionControl: true,
    })

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    })

    tiles.on('tileerror', () => {
      mapError = true
    })

    tiles.addTo(map)
    syncMarkers()
    syncUserMarker()

    const invalidateSize = () => map?.invalidateSize()
    window.addEventListener('resize', invalidateSize)
    setTimeout(invalidateSize, 50)

    return () => {
      window.removeEventListener('resize', invalidateSize)
      map?.remove()
      map = null
      markers.clear()
      userMarker = null
    }
  })

  $effect(() => {
    if (!map) return
    syncMarkers()
  })

  $effect(() => {
    if (!map) return
    syncUserMarker()
    focusUserLocation()
  })

  function syncMarkers() {
    if (!map) return

    const visibleIds = new Set(places.map((place) => place.id))

    for (const [id, marker] of markers) {
      if (!visibleIds.has(id)) {
        marker.remove()
        markers.delete(id)
      }
    }

    for (const place of places) {
      const selected = place.id === selectedPlaceId
      const label = place.name[language]
      const icon = createPlaceIcon(place, selected)
      const existingMarker = markers.get(place.id)

      if (existingMarker) {
        existingMarker.setLatLng([place.lat, place.lng])
        existingMarker.setIcon(icon)
        existingMarker.setZIndexOffset(selected ? 1000 : 0)
        existingMarker.unbindTooltip()
        existingMarker.bindTooltip(label)
        continue
      }

      const marker = L.marker([place.lat, place.lng], {
        icon,
        zIndexOffset: selected ? 1000 : 0,
        title: label,
      })

      marker.on('click', () => onSelectPlace(place.id))
      marker.bindTooltip(label)
      marker.addTo(map)
      markers.set(place.id, marker)
    }

    const visibleKey = places.map((place) => place.id).join('|')
    if (visibleKey !== previousVisibleKey) {
      previousVisibleKey = visibleKey
      fitVisiblePlaces()
    }

    if (selectedPlaceId !== previousSelectedId) {
      previousSelectedId = selectedPlaceId
      const selectedPlace = places.find((place) => place.id === selectedPlaceId)
      if (selectedPlace) {
        map.panTo([selectedPlace.lat, selectedPlace.lng], { animate: true })
      }
    }
  }

  function syncUserMarker() {
    if (!map) return

    if (!userLocation) {
      userMarker?.remove()
      userMarker = null
      return
    }

    if (!userMarker) {
      userMarker = L.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 9,
        color: '#114d64',
        weight: 3,
        fillColor: '#4fc3df',
        fillOpacity: 0.9,
      }).addTo(map)
      return
    }

    userMarker.setLatLng([userLocation.lat, userLocation.lng])
  }

  function fitVisiblePlaces() {
    if (!map) return

    if (places.length === 0) {
      map.setView(dojranaCenter, 14)
      return
    }

    const bounds = L.latLngBounds(places.map((place) => [place.lat, place.lng]))
    map.fitBounds(bounds.pad(0.2), {
      maxZoom: 15,
      animate: true,
    })
  }

  function createPlaceIcon(place: Place, selected: boolean) {
    const label = place.name[language]
    const color = categoryColors[place.category]
    const selectedClass = selected ? ' is-selected' : ''

    return L.divIcon({
      className: 'place-marker-shell',
      html: `<span class="place-pin${selectedClass}" style="--pin-color: ${color}" aria-label="${escapeHtml(label)}"><span class="place-pin-icon">${categoryMarkerSvg(place.category)}</span></span>`,
      iconSize: [38, 42],
      iconAnchor: [19, 38],
      tooltipAnchor: [0, -32],
    })
  }

  function focusUserLocation() {
    if (!map || !userLocation) return
    if (userFocusRequest === previousUserFocusRequest) return

    previousUserFocusRequest = userFocusRequest
    map.setView([userLocation.lat, userLocation.lng], Math.max(map.getZoom(), 16), {
      animate: true,
    })
  }

  function escapeHtml(value: string) {
    return value.replace(/[&<>"']/g, (character) => {
      const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      }

      return entities[character]
    })
  }
</script>

<div class="map-wrap">
  <div class="map-canvas" bind:this={mapElement}></div>

  {#if mapError}
    <div class="map-error" role="status">
      {mapErrorLabel}
    </div>
  {/if}
</div>
