<script lang="ts">
  import {isTimed, type LocalizedLyricLine} from '$lib/lyrics/model'
  let {line, onseek}: {line: LocalizedLyricLine; onseek?: (time: number) => void} = $props()
</script>

{#snippet words()}
  {#each line.words as word}<span class="inline-flex flex-col align-top whitespace-pre-wrap">
      <span
        >{#if word.ruby?.length}<ruby
            >{word.word}<rp>(</rp><rt>{word.ruby.map((part) => part.word).join('')}</rt><rp>)</rp></ruby
          >{:else}{word.word}{/if}</span
      >
      {#if word.romanWord}<span
          lang={line.pronunciationLang ?? ''}
          class="text-[0.5em] leading-relaxed font-normal text-muted-foreground">{word.romanWord}</span
        >{/if}
    </span>{/each}
{/snippet}

<div class:text-right={line.isDuet} class:pl-10={line.isDuet} class:pr-10={!line.isDuet} class:opacity-70={line.isBG}>
  <div lang={line.lang ?? ''} class={line.isBG ? 'text-lg leading-relaxed' : 'text-2xl leading-relaxed font-medium'}>
    {#if onseek && isTimed(line)}
      <button
        type="button"
        class="text-inherit hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
        style="text-align: inherit"
        onclick={() => onseek?.(line.startTime)}>{@render words()}</button
      >
    {:else}
      <p>{@render words()}</p>
    {/if}
  </div>
  {#if line.translatedLyric}<p lang={line.translationLang ?? ''} class="mt-2 whitespace-pre-line text-muted-foreground">
      {line.translatedLyric}
    </p>{/if}
  {#if line.romanLyric}<p
      lang={line.pronunciationLang ?? ''}
      class="mt-2 text-sm whitespace-pre-line text-muted-foreground"
    >
      {line.romanLyric}
    </p>{/if}
</div>
