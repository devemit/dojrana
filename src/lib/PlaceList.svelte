<script lang="ts">
  import { distanceBetween, formatDistance } from './geo'
  import type { Translation } from './i18n'
  import { categoryIconComponents } from './categoryIcons'
  import type { Coordinates, Language, Place } from './types'

  type Props = {
    places: Place[]
    selectedPlaceId: string
    userLocation: Coordinates | null
    language: Language
    t: Translation
    onSelectPlace: (id: string) => void
  }

  let {
    places,
    selectedPlaceId,
    userLocation,
    language,
    t,
    onSelectPlace,
  }: Props = $props()

  function distanceLabel(place: Place) {
    if (!userLocation) return ''

    return formatDistance(distanceBetween(userLocation, place), language)
  }
</script>

<section class="place-list" aria-labelledby="place-list-title">
  <div class="panel-heading">
    <h2 id="place-list-title">{t.listTitle}</h2>
    <span>{places.length} {t.resultsLabel}</span>
  </div>

  {#if places.length === 0}
    <p class="empty-state">{t.noResults}</p>
  {:else}
    <div class="place-list-items">
      {#each places as place}
        {@const Icon = categoryIconComponents[place.category]}
        <button
          type="button"
          class:active={selectedPlaceId === place.id}
          onclick={() => onSelectPlace(place.id)}
        >
          <span class="place-row-icon" aria-hidden="true">
            <Icon size={16} strokeWidth={2.3} />
          </span>
          <span class="place-row-main">
            <strong>{place.name[language]}</strong>
            <span>{t.categories[place.category]}</span>
          </span>

          {#if userLocation}
            <span class="distance-pill">
              {distanceLabel(place)}
            </span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</section>
