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

<style lang="sass">
  @reference '#app.css'

  .color-input
    @apply relative
    .hash
      @apply absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground z-1 pointer-events-none
    .color-swatch
      @apply absolute right-1.5 top-1/2 -translate-y-1/2 size-5 rounded inner-border
</style>
