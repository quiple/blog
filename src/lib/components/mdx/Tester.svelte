<script lang="ts">
  import {Label} from '$lib/components/ui/label/index.js'
  import {Slider} from '$lib/components/ui/slider/index.js'
  import {Textarea} from '$lib/components/ui/textarea/index.js'

  let fontSize = $state(24)
</script>

<div class="grid w-full gap-1.5">
  <Label for="tester">사용해 보기</Label>
  <div class="flex gap-1.5 items-center tabular-nums">
    <Label for="font-size" class="text-muted-foreground">{fontSize}px</Label>
    <Slider id="font-size" type="single" bind:value={fontSize} min={12} max={96} step={1} />
  </div>
  <Textarea
    id="tester"
    class="font-['x12y12pxMaruMinyaHangul-web'] leading-none pl-[calc(1em/12*4)] pb-[calc(1em/12*3)] pt-[calc(1em/12*2)] pr-[calc(1em/12*3)]"
    style="font-size: {fontSize}px"
    spellcheck="false"
    placeholder="Type your message here."
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
