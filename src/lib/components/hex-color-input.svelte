<script lang="ts">
  import {Input} from '$lib/components/ui/input'
  import {Label} from '$lib/components/ui/label'

  let {
    id,
    label,
    help,
    value = $bindable(),
  }: {
    id: string
    label: string
    help?: string
    value: string
  } = $props()

  function handleInput(event: Event) {
    const input = event.currentTarget as HTMLInputElement
    value = input.value.replaceAll(/[^\dabcdefABCDEF]/g, '')
    input.value = value
  }
</script>

<div class="grid gap-2">
  <Label for={id}>
    {#if help}
      <abbr title={help}>{label}</abbr>
    {:else}
      {label}
    {/if}
  </Label>
  <div class="color-input">
    <span class="hash">#</span>
    <Input {id} type="text" spellcheck={false} {value} oninput={handleInput} class="pl-6 tabular-nums" />
    <span class="color-swatch" style:background={value ? `#${value}` : 'transparent'}></span>
  </div>
</div>

<style>
  @reference '#app.css';
  .color-input {
    @apply relative;
  }
  .color-input .hash {
    @apply pointer-events-none absolute top-1/2 left-3 z-1 -translate-y-1/2 text-sm text-muted-foreground;
  }
  .color-input .color-swatch {
    @apply absolute top-1/2 right-1.5 size-5 -translate-y-1/2 rounded inner-border;
  }
</style>
