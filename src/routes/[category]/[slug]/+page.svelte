<script lang="ts">
  import type {PageProps} from './$types'

  let {data}: PageProps = $props()
</script>

<article>
  <h1 class="mb-2!">{data.title}</h1>
  <div class="metadata">
    {new Intl.DateTimeFormat('ko-KR', {dateStyle: 'long'}).format(data.pubDate)}{#if data.media}&#8194;&bullet;&#8194;<a
        target="_blank"
        rel="nofollow noreferrer noopener"
        href={data.source}>{data.media}</a
      >
    {/if}
  </div>
  {@html data.contentHTML}
</article>

<style lang="sass">
  @reference '#app.css'

  article
    @apply prose-shadcn max-w-xl mx-auto text-justify
    .metadata
      @apply text-muted-foreground text-sm
      a
        @apply text-muted-foreground font-normal
    :global(figure)
      @apply mx-auto max-w-fit flex flex-col items-start
      & > :global(div)
        @apply relative inner-border after:rounded-md rounded-md overflow-hidden shadow-xs
</style>
