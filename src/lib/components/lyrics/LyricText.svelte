<script lang="ts">
  import type {LocalizedLyricLine} from '$lib/lyrics/model'
  let {line, semibold = false}: {line: LocalizedLyricLine; semibold?: boolean} = $props()
</script>

<svelte:element
  this={line.translatedLyric ? 'p' : 'span'}
  class={semibold ? 'font-semibold' : 'font-normal'}
  class:text-muted-foreground={line.isBG}
>
  <span lang={line.lang === 'ko' ? undefined : (line.lang ?? '')} class="whitespace-pre-wrap">
    {#each line.words as word}<span class="inline-flex flex-col align-baseline">
        <span
          >{#if word.ruby?.length}<ruby
              >{word.word}<rp>(</rp><rt>{word.ruby.map((part) => part.word).join('')}</rt><rp>)</rp></ruby
            >{:else}{word.word}{/if}</span
        >
        {#if word.romanWord}<span
            lang={line.pronunciationLang ?? ''}
            class="text-[0.5em] leading-relaxed text-muted-foreground">{word.romanWord}</span
          >{/if}
      </span>{/each}
  </span>
  {#if line.translatedLyric}<br /><span class="whitespace-pre-line text-muted-foreground">{line.translatedLyric}</span
    >{/if}
  {#if line.romanLyric}<br /><span
      lang={line.pronunciationLang === 'ko' ? undefined : (line.pronunciationLang ?? '')}
      class="text-sm whitespace-pre-line text-muted-foreground">{line.romanLyric}</span
    >{/if}
</svelte:element>
