<script lang="ts">
  import { Car, Footprints, LoaderCircle, Route } from '@lucide/svelte'
  import { distanceBetween, formatDistance, formatDuration, openStreetMapUrl } from './geo'
  import type { Translation } from './i18n'
  import { categoryIconComponents } from './categoryIcons'
  import type {
    Coordinates,
    Language,
    Place,
    RouteErrorCode,
    RouteMode,
    RouteStatus,
    RouteSummary,
  } from './types'

  type Props = {
    place: Place | null
    userLocation: Coordinates | null
    language: Language
    t: Translation
    routeMode: RouteMode
    routeStatus: RouteStatus
    routeSummary: RouteSummary | null
    routeError: RouteErrorCode | null
    onRouteModeChange: (mode: RouteMode) => void
    onRequestRoute: () => void
  }

  let {
    place,
    userLocation,
    language,
    t,
    routeMode,
    routeStatus,
    routeSummary,
    routeError,
    onRouteModeChange,
    onRequestRoute,
  }: Props = $props()

  function distanceLabel(selectedPlace: Place) {
    if (!userLocation) return ''

    return formatDistance(distanceBetween(userLocation, selectedPlace), language)
  }

  function routeDistanceLabel(summary: RouteSummary) {
    return formatDistance(summary.distanceMeters, language)
  }

  function routeDurationLabel(summary: RouteSummary) {
    return formatDuration(summary.durationSeconds, language)
  }
</script>

<section class="place-details" aria-labelledby="place-details-title">
  <div class="panel-heading">
    <h2 id="place-details-title">{t.detailsTitle}</h2>
  </div>

  {#if place}
    {@const Icon = categoryIconComponents[place.category]}
    <div class="detail-content">
      <div>
        <span class="detail-category">
          <Icon size={15} strokeWidth={2.35} aria-hidden="true" />
          {t.categories[place.category]}
        </span>
        <h3>{place.name[language]}</h3>
      </div>

      <p>{place.description[language]}</p>

      <div class="detail-meta">
        {#if place.address}
          <span>{place.address[language]}</span>
        {/if}

        {#if userLocation}
          <span>{distanceLabel(place)} {t.distanceAway}</span>
        {/if}

        {#if place.coordinateNote}
          <span>{place.coordinateNote[language]}</span>
        {/if}
      </div>

      <div class="route-controls">
        <div class="route-mode-toggle" aria-label={t.directions}>
          <button
            type="button"
            class:active={routeMode === 'foot-walking'}
            aria-pressed={routeMode === 'foot-walking'}
            onclick={() => onRouteModeChange('foot-walking')}
          >
            <Footprints size={15} strokeWidth={2.35} aria-hidden="true" />
            {t.walking}
          </button>
          <button
            type="button"
            class:active={routeMode === 'driving-car'}
            aria-pressed={routeMode === 'driving-car'}
            onclick={() => onRouteModeChange('driving-car')}
          >
            <Car size={15} strokeWidth={2.35} aria-hidden="true" />
            {t.driving}
          </button>
        </div>

        {#if routeSummary && routeStatus === 'ready'}
          <div class="route-summary" role="status">
            <Route size={16} strokeWidth={2.35} aria-hidden="true" />
            <span>
              {t.routeSummary}: {routeDistanceLabel(routeSummary)} · {routeDurationLabel(routeSummary)}
            </span>
          </div>
        {/if}

        {#if routeStatus === 'error' && routeError}
          <p class="route-error" role="alert">{t.routeErrors[routeError]}</p>
        {/if}
      </div>

      <div class="detail-actions">
        <button class="primary-action" type="button" onclick={onRequestRoute} disabled={routeStatus === 'loading'}>
          {#if routeStatus === 'loading'}
            <LoaderCircle size={16} strokeWidth={2.35} aria-hidden="true" />
            {t.routeLoading}
          {:else}
            <Route size={16} strokeWidth={2.35} aria-hidden="true" />
            {t.routeAction}
          {/if}
        </button>
        <a href={openStreetMapUrl(place)} target="_blank" rel="noreferrer">
          {t.openMap}
        </a>

        {#if place.phone}
          <a href={`tel:${place.phone}`}>
            {t.call}
          </a>
        {/if}

        {#if place.website}
          <a href={place.website} target="_blank" rel="noreferrer">
            {t.website}
          </a>
        {/if}

        {#if place.osmUrl || place.sourceUrl}
          <a href={place.osmUrl ?? place.sourceUrl} target="_blank" rel="noreferrer">
            {t.source}
          </a>
        {/if}
      </div>
    </div>
  {:else}
    <p class="empty-state">{t.noResults}</p>
  {/if}
</section>
