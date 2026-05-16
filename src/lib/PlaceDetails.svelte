<script lang="ts">
  import { distanceBetween, formatDistance, googleDirectionsUrl, openStreetMapUrl } from './geo'
  import type { Translation } from './i18n'
  import { categoryIconComponents } from './categoryIcons'
  import type { Coordinates, Language, Place } from './types'

  type Props = {
    place: Place | null
    userLocation: Coordinates | null
    language: Language
    t: Translation
  }

  let { place, userLocation, language, t }: Props = $props()

  function distanceLabel(selectedPlace: Place) {
    if (!userLocation) return ''

    return formatDistance(distanceBetween(userLocation, selectedPlace), language)
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

      <div class="detail-actions">
        <a class="primary-action" href={googleDirectionsUrl(place, userLocation)} target="_blank" rel="noreferrer">
          {t.directions}
        </a>
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
