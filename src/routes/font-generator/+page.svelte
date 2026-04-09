<script lang="ts">
  import {Copy, Download, LoaderCircle} from '@lucide/svelte'
  import {getCharset, getCharsetGroups} from '$lib/charsets'
  import {Button} from '$lib/components/ui/button'
  import * as Card from '$lib/components/ui/card/index.js'
  import {Input} from '$lib/components/ui/input'
  import {Label} from '$lib/components/ui/label'
  import * as Select from '$lib/components/ui/select/index.js'
  import {Textarea} from '$lib/components/ui/textarea'
  import {Bitmap, $Bitmap as createBitmap, $Font as createFont} from 'bdfparser'
  import fetchline from 'fetchline'

  interface FontDef {
    name: string
    value: string
    size: string
  }
  interface FontGroup {
    label: string
    fonts: FontDef[]
  }
  const fontGroups: FontGroup[] = [
    {
      label: 'quiple',
      fonts: [
        {name: 'MaruMinyaHangul', value: 'maruminyahangul', size: '12px'},
        {name: 'HBIOS-SYS', value: 'hbios-sys', size: '16px'},
        {name: 'Galmuri14', value: 'Galmuri14', size: '15px'},
        {name: 'Galmuri11', value: 'Galmuri11', size: '12px'},
        {name: 'Galmuri11 Bold', value: 'Galmuri11-Bold', size: '12px'},
        {name: 'Galmuri11 Condensed', value: 'Galmuri11-Condensed', size: '12px'},
        {name: 'Galmuri9', value: 'Galmuri9', size: '10px'},
        {name: 'Galmuri7', value: 'Galmuri7', size: '8px'},
        {name: 'GalmuriMono11', value: 'GalmuriMono11', size: '12px'},
        {name: 'GalmuriMono9', value: 'GalmuriMono9', size: '10px'},
        {name: 'GalmuriMono7', value: 'GalmuriMono7', size: '8px'},
      ],
    },
    {
      label: 'Num Kadoma',
      fonts: [
        {name: 'k6x8 Gothic', value: 'k6x8-gothic', size: '8px'},
        {name: 'k6x8 Mincho', value: 'k6x8-mincho', size: '8px'},
        {name: 'Misaki Gothic', value: 'misaki-gothic', size: '8px'},
        {name: 'Misaki Gothic 2nd', value: 'misaki-gothic-2nd', size: '8px'},
        {name: 'Misaki Mincho', value: 'misaki-mincho', size: '8px'},
        {name: 'k8x12', value: 'k8x12', size: '12px'},
        {name: 'k8x12L', value: 'k8x12l', size: '12px'},
        {name: 'k8x12S', value: 'k8x12s', size: '12px'},
        {name: 'k12x8', value: 'k12x8', size: '8px'},
      ],
    },
    {
      label: '기타',
      fonts: [
        {name: 'Unifont', value: 'unifont', size: '16px'},
        {name: 'Unifont JP', value: 'unifont_jp', size: '16px'},
        {name: 'Zpix', value: 'zpix', size: '12px'},
      ],
    },
  ]

  const fontTriggerContent = $derived.by(() => {
    const font = fontGroups.flatMap((g) => g.fonts).find((f) => f.value === fontValue)
    return font ? `${font.name} (${font.size})` : 'MaruMinyaHangul (12px)'
  })

  // Height from baseline to ascent
  const fontSizeMap: Record<string, number> = {
    Galmuri14: 14,
    Galmuri11: 11,
    'Galmuri11-Bold': 11,
    'Galmuri11-Condensed': 11,
    Galmuri9: 9,
    Galmuri7: 7,
    GalmuriMono11: 11,
    GalmuriMono9: 9,
    GalmuriMono7: 7,
    'k6x8-gothic': 7,
    'k6x8-mincho': 7,
    'misaki-gothic': 6,
    'misaki-gothic-2nd': 7,
    'misaki-mincho': 6,
    k8x12: 10,
    k8x12l: 10,
    k8x12s: 10,
    k12x8: 7,
    'hbios-sys': 13,
    unifont: 14,
    unifont_jp: 14,
    maruminyahangul: 11,
    zpix: 9,
  }
  const getFontSize = (font: string): number => fontSizeMap[font] ?? 16

  const fontFilenameMap: Record<string, string> = {
    maruminyahangul: 'x12y12pxMaruMinyaHangul',
    Galmuri14: 'Galmuri14',
    Galmuri11: 'Galmuri11',
    'Galmuri11-Bold': 'Galmuri11-Bold',
    'Galmuri11-Condensed': 'Galmuri11-Condensed',
    Galmuri9: 'Galmuri9',
    Galmuri7: 'Galmuri7',
    GalmuriMono11: 'GalmuriMono11',
    GalmuriMono9: 'GalmuriMono9',
    GalmuriMono7: 'GalmuriMono7',
    'k6x8-gothic': 'k6x8_gothic',
    'k6x8-mincho': 'k6x8_mincho',
    'misaki-gothic': 'misaki_gothic',
    'misaki-gothic-2nd': 'misaki_gothic_2nd',
    'misaki-mincho': 'misaki_mincho',
    k8x12: 'k8x12',
    k8x12l: 'k8x12L',
    k8x12s: 'k8x12S',
    k12x8: 'k12x8',
    'hbios-sys': 'hbios-sys',
    unifont: 'unifont',
    unifont_jp: 'unifont_jp',
    zpix: 'zpix',
  }
  const getFontPath = (font: string): string => `/fonts/bdfs/${fontFilenameMap[font]}.bdf`

  // ── Charset groups (from shared charsets index) ─────────────────────
  const charsetGroups = getCharsetGroups()

  const charsetTriggerContent = $derived.by(() => {
    if (charsetKey === 'custom') return '사용자 지정 문자 집합 입력'
    const entry = charsetGroups
      .values()
      .flatMap((entries) => entries)
      .find((e) => e.key === charsetKey)
    return entry
      ? entry.group === entry.label
        ? entry.label
        : `${entry.group} – ${entry.label}`
      : '한글 음절 – 2,350자'
  })

  // ── State ───────────────────────────────────────────────────────────
  let fontValue = $state('maruminyahangul')
  let charsetKey = $state('set2350')
  let customCharset = $state('')

  let xOffset = $state(0)
  let yOffset = $state(0)
  let tileWidth = $state(16)
  let tileHeight = $state(16)
  let tileColumn = $state(64)

  let foreground = $state('63cf63')
  let background = $state('000000')
  let shadowColor = $state('3933ff')

  let shadowPositions = $state<Record<string, boolean>>({
    topleft: false,
    top: false,
    topright: false,
    left: false,
    right: false,
    bottomleft: false,
    bottom: false,
    bottomright: false,
  })

  const shadowValues: Record<string, [number, number]> = {
    topleft: [-1, 1],
    top: [0, 1],
    topright: [1, 1],
    left: [-1, 0],
    right: [1, 0],
    bottomleft: [-1, -1],
    bottom: [0, -1],
    bottomright: [1, -1],
  }

  let drawing = $state(false)
  let canvasReady = $state(false)
  let copyLabel = $state('복사하기')
  let canvasEl: HTMLCanvasElement | undefined = $state()
  let previewAreaEl: HTMLDivElement | undefined = $state()
  let downloadHref = $state('#')
  let downloadName = $state('')

  let isDragging = $state(false)
  let startX = $state(0)
  let startY = $state(0)
  let scrollLeft = $state(0)
  let scrollTop = $state(0)

  // Derived: current charset string for preview
  let charsetPreview = $derived(getCharset(charsetKey))
  let charsetLang = $derived(
    ['jis2965', 'jis6355', 'unicode2965', 'unicode6355', 'shiftjis', 'shiftjis_level1'].some((c) =>
      charsetKey.startsWith(c),
    )
      ? 'ja'
      : 'ko',
  )

  // ── Helpers ─────────────────────────────────────────────────────────
  function sanitizeHex(value: string): string {
    return value.replaceAll(/[^\dabcdefABCDEF]/g, '')
  }

  // ── Draw ────────────────────────────────────────────────────────────
  // Cache parsed fonts to prevent repeated slow parsing
  const fontCache = new Map<string, any>()

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()

    if (charsetKey === 'custom' && !customCharset) {
      alert('사용자 지정 문자 집합을 입력하세요.')
      return
    }
    if (!tileWidth || !tileHeight || tileWidth <= 0 || tileHeight <= 0) {
      alert('타일 크기에 양숫값을 입력하세요.')
      return
    }
    if (!tileColumn || tileColumn <= 0) {
      alert('열 수에 양숫값을 입력하세요.')
      return
    }
    if (!foreground) {
      alert('전경색을 입력하세요.')
      return
    }

    drawing = true
    canvasReady = false

    // Wait for the DOM to update the spinner visibility before starting heavy logic
    await new Promise((r) => requestAnimationFrame(r))
    await new Promise((r) => setTimeout(r, 0))

    let lastYield = performance.now()
    const checkYield = async () => {
      // Yield to the event loop every 15ms to maintain smooth UI ~60fps animation
      if (performance.now() - lastYield > 15) {
        // setTimeout 0 allows the browser to paint
        await new Promise((r) => setTimeout(r, 0))
        lastYield = performance.now()
      }
    }

    const __fontSize = getFontSize(fontValue)

    // Gather active shadow positions
    const positions: number[][] = []
    for (const [key, active] of Object.entries(shadowPositions)) {
      if (active) positions.push(shadowValues[key])
    }

    let xOff = xOffset
    let yOff = yOffset
    const includesArr = (data: number[][], arr: number[]) =>
      data.some((e) => Array.isArray(e) && e.every((o, i) => Object.is(arr[i], o)))

    if (includesArr(positions, [-1, -1]) || includesArr(positions, [-1, 0]) || includesArr(positions, [-1, 1])) {
      xOff++
    }
    if (includesArr(positions, [-1, 1]) || includesArr(positions, [0, 1]) || includesArr(positions, [1, 1])) {
      yOff++
    }

    let __charset = charsetKey === 'custom' ? customCharset : getCharset(charsetKey)

    const cvs = canvasEl!
    cvs.width = tileWidth * tileColumn
    cvs.height = tileHeight * Math.ceil(__charset.length / tileColumn)
    const ctx = cvs.getContext('2d')!
    ctx.reset()

    if (background !== '') {
      ctx.fillStyle = `#${background}`
      ctx.fillRect(0, 0, tileWidth * tileColumn, tileHeight * Math.floor(__charset.length / tileColumn))
      ctx.fillRect(
        0,
        tileHeight * Math.floor(__charset.length / tileColumn),
        tileWidth * (__charset.length % tileColumn),
        tileHeight * Math.ceil(__charset.length / tileColumn),
      )
    }

    let font = fontCache.get(fontValue)
    if (!font) {
      const url = getFontPath(fontValue)
      const linesIter = fetchline(url)
      async function* yieldyFetchline() {
        for await (const line of linesIter) {
          yield line
          await checkYield()
        }
      }
      font = await createFont(yieldyFetchline())
      fontCache.set(fontValue, font)
    }

    const tWidth = Number(tileWidth)
    const tHeight = Number(tileHeight)
    const tCol = Number(tileColumn)
    const bbX = -Number(xOff)
    const bbY = -(tHeight - __fontSize) + Number(yOff)
    const bb: [number, number, number, number] = [tWidth, tHeight, bbX, bbY]

    const emptyTile = createBitmap(Array.from({length: tHeight}).fill('0'.repeat(tWidth)) as string[])
    const cps = Array.from(__charset).map((c) => c.codePointAt(0) || 8203)

    // Pre-calculate target bitmaps
    const targetBitmaps = []
    for (let i = 0; i < cps.length; i++) {
      let g = font.glyphbycp(cps[i]) || font.glyphbycp(8203)
      targetBitmaps.push(g ? g.draw(-1, bb) : emptyTile)
      // yield during bitmap creation
      await checkYield()
    }

    // Pass 1: Draw all shadows
    if (positions.length > 0 && shadowColor) {
      ctx.fillStyle = `#${shadowColor}`
      for (let i = 0; i < targetBitmaps.length; i++) {
        const tileBmp = targetBitmaps[i]
        const col = i % tCol
        const row = Math.floor(i / tCol)
        const offsetX = col * tWidth
        const offsetY = row * tHeight
        const data = tileBmp.bindata

        for (let y = 0; y < data.length; y++) {
          const r = data[y]
          let inSegment = false
          let segmentStartX = 0

          for (let x = 0; x <= r.length; x++) {
            const isFilled = x < r.length && r[x] === '1'
            if (isFilled && !inSegment) {
              inSegment = true
              segmentStartX = x
            } else if (!isFilled && inSegment) {
              inSegment = false
              const segmentWidth = x - segmentStartX
              for (const pos of positions) {
                const dx = pos[0]
                const dy = -pos[1]
                ctx.fillRect(offsetX + segmentStartX + dx, offsetY + y + dy, segmentWidth, 1)
              }
            }
          }
        }
        await checkYield()
      }
    }

    // Pass 2: Draw all foregrounds
    ctx.fillStyle = `#${foreground}`
    for (let i = 0; i < targetBitmaps.length; i++) {
      const tileBmp = targetBitmaps[i]
      const col = i % tCol
      const row = Math.floor(i / tCol)
      const offsetX = col * tWidth
      const offsetY = row * tHeight
      const data = tileBmp.bindata

      for (let y = 0; y < data.length; y++) {
        const r = data[y]
        let inSegment = false
        let segmentStartX = 0

        for (let x = 0; x <= r.length; x++) {
          const isFilled = x < r.length && r[x] === '1'
          if (isFilled && !inSegment) {
            inSegment = true
            segmentStartX = x
          } else if (!isFilled && inSegment) {
            inSegment = false
            const segmentWidth = x - segmentStartX
            ctx.fillRect(offsetX + segmentStartX, offsetY + y, segmentWidth, 1)
          }
        }
      }
      await checkYield()
    }

    cvs.toBlob((blob) => {
      if (blob) {
        if (downloadHref && downloadHref.startsWith('blob:')) {
          URL.revokeObjectURL(downloadHref)
        }
        downloadHref = URL.createObjectURL(blob)
      }
      canvasReady = true
      downloadName = `${fontValue}_${tileWidth}x${tileHeight}`
      drawing = false
    })
  }

  async function handleCopy() {
    if (!canvasEl) return
    try {
      const blobPromise = new Promise<Blob>((resolve, reject) => {
        canvasEl!.toBlob((blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Canvas to Blob failed'))
        })
      })

      const item = new ClipboardItem({'image/png': blobPromise})
      await navigator.clipboard.write([item])

      copyLabel = '복사됨!'
      setTimeout(() => {
        copyLabel = '복사하기'
      }, 2000)
    } catch (err) {
      alert('이미지를 복사하지 못했습니다.')
    }
  }

  function handleMouseDown(e: MouseEvent) {
    if (!previewAreaEl) return
    isDragging = true
    startX = e.pageX - previewAreaEl.offsetLeft
    startY = e.pageY - previewAreaEl.offsetTop
    scrollLeft = previewAreaEl.scrollLeft
    scrollTop = previewAreaEl.scrollTop
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDragging || !previewAreaEl) return
    e.preventDefault()
    const x = e.pageX - previewAreaEl.offsetLeft
    const y = e.pageY - previewAreaEl.offsetTop
    const walkX = x - startX
    const walkY = y - startY
    previewAreaEl.scrollLeft = scrollLeft - walkX
    previewAreaEl.scrollTop = scrollTop - walkY
  }

  function handleMouseUp() {
    isDragging = false
  }
</script>

<svelte:head>
  <title>비트맵 폰트 이미지 생성기</title>
  <meta property="og:title" content="비트맵 폰트 이미지 생성기" />
  <meta name="description" content="비트맵 폰트 이미지를 만드는 도구." />
  <meta property="og:description" content="비트맵 폰트 이미지를 만드는 도구." />
</svelte:head>

<h1 class="page-title">비트맵 폰트 이미지 생성기</h1>

<div class="generator">
  <!-- ── Canvas preview area ──────────────────────────────────────── -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="preview-area"
    class:cursor-grab={canvasReady && !isDragging}
    class:cursor-grabbing={canvasReady && isDragging}
    bind:this={previewAreaEl}
    onmousedown={handleMouseDown}
    onmousemove={handleMouseMove}
    onmouseup={handleMouseUp}
    onmouseleave={handleMouseUp}
  >
    <div class="canvas-wrapper" class:hidden={!canvasReady}>
      <canvas bind:this={canvasEl} id="preview" class="preview-canvas"></canvas>
    </div>
    {#if drawing}
      <div class="placeholder">
        <LoaderCircle class="animate-spin size-6 text-muted-foreground" />
      </div>
    {:else if !canvasReady}
      <div class="placeholder">폰트 이미지를 만들려면 조건을 설정하고 만들기 버튼을 누르세요.</div>
    {/if}
  </div>

  <!-- ── Sidebar form ─────────────────────────────────────────────── -->
  <aside class="sidebar">
    <Card.Root class="w-full py-4">
      <form onsubmit={handleSubmit} class="flex flex-col gap-4">
        <Card.Content class="px-4">
          <div class="flex flex-col gap-4">
            <!-- 폰트 -->
            <div class="grid gap-2">
              <Label for="font">폰트</Label>
              <Select.Root type="single" name="font" bind:value={fontValue}>
                <Select.Trigger class="w-full">
                  {fontTriggerContent}
                </Select.Trigger>
                <Select.Content>
                  {#each fontGroups as group}
                    <Select.Group>
                      <Select.Label>{group.label}</Select.Label>
                      {#each group.fonts as f}
                        <Select.Item value={f.value}>
                          {f.name} ({f.size})
                        </Select.Item>
                      {/each}
                    </Select.Group>
                  {/each}
                </Select.Content>
              </Select.Root>
            </div>

            <!-- 문자 집합 -->
            <div class="grid gap-2">
              <Label for="charset">문자 집합</Label>
              <Select.Root type="single" name="charset" bind:value={charsetKey}>
                <Select.Trigger class="w-full">{charsetTriggerContent}</Select.Trigger>
                <Select.Content>
                  {#each [...charsetGroups] as [groupName, entries]}
                    <Select.Group>
                      <Select.Label>{groupName}</Select.Label>
                      {#each entries as entry}
                        <Select.Item value={entry.key}>
                          {entry.label}
                        </Select.Item>
                      {/each}
                    </Select.Group>
                  {/each}
                  <Select.Group>
                    <Select.Item value="custom">사용자 지정 문자 집합 입력</Select.Item>
                  </Select.Group>
                </Select.Content>
              </Select.Root>
            </div>

            <!-- 문자 집합 미리보기 / 사용자 지정 -->
            {#if charsetKey !== 'custom'}
              <div class="grid gap-2">
                <Label for="charset-preview">문자 집합 미리보기</Label>
                <Textarea
                  id="charset-preview"
                  value={charsetPreview}
                  lang={charsetLang}
                  readonly
                  class="min-h-20 h-20 break-all text-xs!"
                  spellcheck="false"
                  onclick={(e: MouseEvent) => (e.currentTarget as HTMLTextAreaElement).select()}
                />
              </div>
            {:else}
              <div class="grid gap-2">
                <Label for="custom-charset">사용자 지정 문자 집합</Label>
                <Textarea
                  id="custom-charset"
                  bind:value={customCharset}
                  class="min-h-20 h-20 break-all text-xs"
                  spellcheck="false"
                  placeholder="사용자 지정 문자 집합을 입력하세요."
                />
              </div>
            {/if}

            <!-- 오프셋 -->
            <div class="grid gap-2">
              <Label for="x-offset">오프셋</Label>
              <div class="input-pairs">
                <div class="input-pair">
                  <span class="whitespace-nowrap">x:</span>
                  <Input id="x-offset" type="number" bind:value={xOffset} class="tabular-nums" />
                  <span>px</span>
                </div>
                <div class="input-pair">
                  <span class="whitespace-nowrap">y:</span>
                  <Input id="y-offset" type="number" bind:value={yOffset} class="tabular-nums" />
                  <span>px</span>
                </div>
              </div>
            </div>

            <!-- 타일 크기 -->
            <div class="grid gap-2">
              <Label for="tile-width">타일 크기</Label>
              <div class="input-pairs">
                <div class="input-pair">
                  <span class="whitespace-nowrap">너비:</span>
                  <Input id="tile-width" type="number" min={1} bind:value={tileWidth} class="tabular-nums" />
                  <span>px</span>
                </div>
                <div class="input-pair">
                  <span class="whitespace-nowrap">높이:</span>
                  <Input id="tile-height" type="number" min={1} bind:value={tileHeight} class="tabular-nums" />
                  <span>px</span>
                </div>
              </div>
            </div>

            <!-- 열 수 -->
            <div class="grid gap-2">
              <Label for="tile-column">열 수</Label>
              <Input id="tile-column" type="number" min={1} bind:value={tileColumn} class="tabular-nums" />
            </div>

            <!-- 전경색 -->
            <div class="grid gap-2">
              <Label for="foreground">전경색</Label>
              <div class="color-input">
                <span class="hash">#</span>
                <Input
                  id="foreground"
                  type="text"
                  spellcheck={false}
                  value={foreground}
                  oninput={(e: Event) => {
                    const t = e.currentTarget as HTMLInputElement
                    foreground = sanitizeHex(t.value)
                    t.value = foreground
                  }}
                  class="tabular-nums pl-6"
                />
                <span class="color-swatch" style="background: #{foreground}"></span>
              </div>
            </div>

            <!-- 배경색 -->
            <div class="grid gap-2">
              <Label for="background">
                <abbr title="비워 두면 투명을 사용합니다.">배경색</abbr>
              </Label>
              <div class="color-input">
                <span class="hash">#</span>
                <Input
                  id="background"
                  type="text"
                  spellcheck={false}
                  value={background}
                  oninput={(e: Event) => {
                    const t = e.currentTarget as HTMLInputElement
                    background = sanitizeHex(t.value)
                    t.value = background
                  }}
                  class="tabular-nums pl-6"
                />
                <span class="color-swatch" style="background: #{background}"></span>
              </div>
            </div>

            <!-- 그림자 색 -->
            <div class="grid gap-2">
              <Label for="shadow-color">그림자 색</Label>
              <div class="color-input">
                <span class="hash">#</span>
                <Input
                  id="shadow-color"
                  type="text"
                  spellcheck={false}
                  value={shadowColor}
                  oninput={(e: Event) => {
                    const t = e.currentTarget as HTMLInputElement
                    shadowColor = sanitizeHex(t.value)
                    t.value = shadowColor
                  }}
                  class="tabular-nums pl-6"
                />
                <span class="color-swatch" style="background: #{shadowColor}"></span>
              </div>
            </div>

            <!-- 그림자 위치 -->
            <div class="grid gap-2">
              <Label>그림자 위치</Label>
              <div class="shadow-grid">
                <input type="checkbox" id="shadow-topleft" bind:checked={shadowPositions.topleft} />
                <input type="checkbox" id="shadow-top" bind:checked={shadowPositions.top} />
                <input type="checkbox" id="shadow-topright" bind:checked={shadowPositions.topright} />
                <input type="checkbox" id="shadow-left" bind:checked={shadowPositions.left} />
                <input type="checkbox" disabled />
                <input type="checkbox" id="shadow-right" bind:checked={shadowPositions.right} />
                <input type="checkbox" id="shadow-bottomleft" bind:checked={shadowPositions.bottomleft} />
                <input type="checkbox" id="shadow-bottom" bind:checked={shadowPositions.bottom} />
                <input type="checkbox" id="shadow-bottomright" bind:checked={shadowPositions.bottomright} />
              </div>
            </div>
          </div>
        </Card.Content>
        <Card.Footer class="flex-col gap-2 px-4">
          <!-- 액션 버튼들 -->
          <Button type="submit" disabled={drawing} class="w-full" size="lg">
            {#if drawing}
              <LoaderCircle class="animate-spin size-4" />
              만드는 중...
            {:else}
              만들기
            {/if}
          </Button>
          <div class="w-full flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!canvasReady}
              onclick={handleCopy}
              class="flex-1"
              size="sm"
            >
              <Copy />
              {copyLabel}
            </Button>
            <Button
              href={canvasReady ? downloadHref : undefined}
              variant="outline"
              disabled={!canvasReady}
              class="flex-1"
              size="sm"
              download={downloadName}
            >
              <Download />
              다운로드
            </Button>
          </div>
        </Card.Footer>
      </form>
    </Card.Root>

    <!-- 문자 집합 설명 -->
    <article class="charset-info prose-shadcn">
      <ul>
        <li>
          한글 음절
          <ul>
            <li>
              2,350자: <a
                href="https://www.unicode.org/Public/MAPPINGS/OBSOLETE/EASTASIA/KSC/KSX1001.TXT"
                target="_blank"
                rel="noopener noreferrer">KS X 1001</a
              >의 모든 한글 음절.
            </li>
            <li>
              2,355자: KS X 1001의 모든 한글 음절에
              <abbr title="KS X 1001에 포함된 뢨, 썅, 쏀, 쓩, 쭁을 입력하기 위한 보충 문자.">뢔, 쌰, 쎼, 쓔, 쬬</abbr>
              5자가 추가된 집합.
            </li>
            <li>
              2,780자: <a href="https://github.com/adobe-type-tools/Adobe-KR" target="_blank" rel="noopener noreferrer"
                >Adobe-KR-0</a
              >의 모든 한글 음절. KS X 1001의 2,350자를 포함합니다.
            </li>
            <li>
              4,358자: Adobe-KR-0과 Adobe-KR-1의 모든 한글 음절. KS X 1001,
              <a href="https://en.wikipedia.org/wiki/KS_X_1002" target="_blank" rel="noopener noreferrer">KS X 1002</a>,
              <a
                href="https://www.unicode.org/L2/L2018/18011-info-kps9566-2011.pdf"
                target="_blank"
                rel="noopener noreferrer">KPS 9566</a
              >,
              <a
                href="https://ccjktype.fonts.adobe.com/wp-content/uploads/2014/12/gb12052-uni.txt"
                target="_blank"
                rel="noopener noreferrer">GB/T 12052</a
              >의 모든 한글 음절을 포함합니다.
            </li>
            <li>11,172자: 현대 한글의 모든 음절.</li>
          </ul>
        </li>
        <li>
          한자
          <ul>
            <li>
              KS 4,888자: <a
                href="https://www.unicode.org/Public/MAPPINGS/OBSOLETE/EASTASIA/KSC/KSX1001.TXT"
                target="_blank"
                rel="noopener noreferrer">KS X 1001</a
              >의 모든 한자.
            </li>
            <li>
              JIS 2,965자: <a
                href="https://www.unicode.org/Public/MAPPINGS/OBSOLETE/EASTASIA/JIS/JIS0208.TXT"
                target="_blank"
                rel="noopener noreferrer">JIS X 0208</a
              >의 제1수준 한자.
            </li>
            <li>JIS 6,355자: JIS X 0208의 제1&middot;제2수준 한자.</li>
          </ul>
        </li>
        <li>
          EUC-KR
          <ul>
            <li>EUC-KR: KS X 1001과 KS X 1003을 포함하는 문자 집합. 로마자와 기호, 한자 등을 포함합니다.</li>
            <li>한자 제외: EUC-KR에서 한자를 제외한 문자 집합.</li>
          </ul>
        </li>
        <li>
          Shift_JIS
          <ul>
            <li>
              Shift_JIS: <a
                href="https://www.unicode.org/Public/MAPPINGS/OBSOLETE/EASTASIA/JIS/JIS0201.TXT"
                target="_blank"
                rel="noopener noreferrer">JIS X 0201</a
              >과 JIS X 0208을 포함하는 문자 집합. 로마자와 기호 등을 포함합니다.
            </li>
            <li>제1수준 한자만 포함: Shift_JIS에서 JIS X 0208의 제2수준 한자 3,390자를 제외한 문자 집합.</li>
          </ul>
        </li>
      </ul>
      <small>&copy; 2026 Lee Minseo. 각 폰트는 해당 소유자, 저작권자 및 사용 허가자의 상표 및 저작권 자산입니다.</small>
    </article>
  </aside>
</div>

<style lang="sass">
  @reference '#app.css'

  :global(main:has(> .generator))
    @apply pt-4 sm:pt-6 -mt-(--header-height)

  .generator
    @apply flex flex-col lg:flex-row items-start gap-4

  .preview-area
    @apply block flex-1 w-full min-h-40 bg-secondary/50 rounded-lg h-[calc(100vh-3rem)] overflow-hidden lg:sticky top-6
    .placeholder
      @apply absolute inset-0 text-sm text-muted-foreground p-6 flex items-center justify-center text-center pointer-events-none
    .canvas-wrapper
      @apply flex items-center justify-center min-w-full min-h-full w-max h-max p-6 [&.hidden]:hidden
      .preview-canvas
        image-rendering: pixelated

  .sidebar
    @apply sticky top-5 flex flex-col w-full lg:w-2xs shrink-0

  .input-pairs
    @apply flex flex-col gap-2
    .input-pair
      @apply flex items-center gap-2 text-sm [&_span]:text-muted-foreground

  .color-input
    @apply relative
    .hash
      @apply absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground z-1 pointer-events-none
    .color-swatch
      @apply absolute right-1.5 top-1/2 -translate-y-1/2 size-5 rounded inner-border after:rounded

  .shadow-grid
    @apply grid grid-cols-3 gap-0 w-fit
    input[type='checkbox']
      @apply size-4 accent-primary cursor-pointer
      &:disabled
        @apply opacity-30 cursor-not-allowed

  .charset-info
    @apply text-xs
    small
      @apply text-xs text-muted-foreground
</style>
