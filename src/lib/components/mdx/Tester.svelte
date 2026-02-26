<script lang="ts">
  import {Label} from '$lib/components/ui/label/index.js'
  import {Slider} from '$lib/components/ui/slider/index.js'
  import {Textarea} from '$lib/components/ui/textarea/index.js'

  let fontSize = $state(24)
</script>

<div class="grid w-full gap-1.5">
  <Label for="tester">사용해 보기</Label>
  <div class="flex gap-2 items-center tabular-nums">
    {fontSize}px <Slider type="single" bind:value={fontSize} min={12} max={96} step={1} />
  </div>
  <Textarea
    id="tester"
    class="font-['x12y12pxMaruMinyaHangul-web'] leading-none"
    style="font-size: {fontSize}px"
    spellcheck="false"
  />
</div>

<style lang="sass">
  @font-face
    font:
      family: 'x12y12pxMaruMinyaHangul-web'
      style: normal
      weight: 400
      display: swap
    src: url('https://cdn.jsdelivr.net/gh/quiple/x12y12pxMaruMinyaHangul/fonts/x12y12pxMaruMinyaHangul.woff2') format('woff2')
</style>
