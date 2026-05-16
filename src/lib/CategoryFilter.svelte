<script lang="ts">
  import type { Translation } from './i18n'
  import { categoryIconComponents } from './categoryIcons'
  import type { CategoryFilterId, CategoryMeta } from './types'

  type Props = {
    categories: CategoryMeta[]
    activeCategory: CategoryFilterId
    counts: Record<CategoryFilterId, number>
    t: Translation
    onSelect: (category: CategoryFilterId) => void
  }

  let {
    categories,
    activeCategory,
    counts,
    t,
    onSelect,
  }: Props = $props()
</script>

<div class="category-scroll" aria-label="Place categories">
  {#each categories as category}
    {@const Icon = categoryIconComponents[category.id]}
    <button
      type="button"
      class:active={activeCategory === category.id}
      style={`--category-color: ${category.color}`}
      aria-pressed={activeCategory === category.id}
      onclick={() => onSelect(category.id)}
    >
      <span class="category-dot" aria-hidden="true"></span>
      <Icon size={15} strokeWidth={2.35} aria-hidden="true" />
      <span>{t.categories[category.id]}</span>
      <span class="category-count">{counts[category.id] ?? 0}</span>
    </button>
  {/each}
</div>
