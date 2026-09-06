<script lang="ts">
  import {Copy, Download, LoaderCircle} from '@lucide/svelte'
  import {page} from '$app/state'
  import {toast} from 'svelte-sonner'
  import {getCharset, getCharsetGroups} from '$lib/charsets'
  import {Button} from '$lib/components/ui/button'
  import PageTitle from '$lib/components/page-title.svelte'
  import * as Card from '$lib/components/ui/card/index.js'
  import HexColorInput from '$lib/components/hex-color-input.svelte'
  import {Input} from '$lib/components/ui/input'
  import {Label} from '$lib/components/ui/label'
  import * as Select from '$lib/components/ui/select/index.js'
  import {Toaster} from '$lib/components/ui/sonner'
  import {Textarea} from '$lib/components/ui/textarea'
  import {onDestroy} from 'svelte'
  import {browser} from '$app/environment'
  import type {RenderPayload, RenderResult, WorkerMessage} from './font-render-types'
  import {getRenderSize, isRenderSizeAllowed} from './font-render-limits'

  interface FontDef {
    name: string
    value: string
    size: string
    baseline: number
    file: string
  }
  interface FontGroup {
    label: string
    fonts: FontDef[]
  }
  const fontGroups: FontGroup[] = [
    {
      label: 'quiple',
      fonts: [
        {
          name: 'MaruMinyaHangul',
          value: 'maruminyahangul',
          size: '12px',
          baseline: 11,
          file: 'x12y12pxMaruMinyaHangul',
        },
        {
          name: 'DenkiChipHangul',
          value: 'denkichiphangul',
          size: '12px',
          baseline: 11,
          file: 'x10y12pxDenkiChipHangul',
        },
        {name: 'HBIOS-SYS', value: 'hbios-sys', size: '16px', baseline: 13, file: 'hbios-sys'},
        {name: 'Galmuri14', value: 'Galmuri14', size: '15px', baseline: 14, file: 'Galmuri14'},
        {name: 'Galmuri11', value: 'Galmuri11', size: '12px', baseline: 11, file: 'Galmuri11'},
        {
          name: 'Galmuri11 Bold',
          value: 'Galmuri11-Bold',
          size: '12px',
          baseline: 11,
          file: 'Galmuri11-Bold',
        },
        {
          name: 'Galmuri11 Condensed',
          value: 'Galmuri11-Condensed',
          size: '12px',
          baseline: 11,
          file: 'Galmuri11-Condensed',
        },
        {name: 'Galmuri9', value: 'Galmuri9', size: '10px', baseline: 9, file: 'Galmuri9'},
        {name: 'Galmuri7', value: 'Galmuri7', size: '8px', baseline: 7, file: 'Galmuri7'},
        {name: 'GalmuriMono11', value: 'GalmuriMono11', size: '12px', baseline: 11, file: 'GalmuriMono11'},
        {name: 'GalmuriMono9', value: 'GalmuriMono9', size: '10px', baseline: 9, file: 'GalmuriMono9'},
        {name: 'GalmuriMono7', value: 'GalmuriMono7', size: '8px', baseline: 7, file: 'GalmuriMono7'},
      ],
    },
    {
      label: 'Num Kadoma',
      fonts: [
        {name: 'k6x8 Gothic', value: 'k6x8-gothic', size: '8px', baseline: 7, file: 'k6x8_gothic'},
        {name: 'k6x8 Mincho', value: 'k6x8-mincho', size: '8px', baseline: 7, file: 'k6x8_mincho'},
        {name: 'Misaki Gothic', value: 'misaki-gothic', size: '8px', baseline: 6, file: 'misaki_gothic'},
        {
          name: 'Misaki Gothic 2nd',
          value: 'misaki-gothic-2nd',
          size: '8px',
          baseline: 7,
          file: 'misaki_gothic_2nd',
        },
        {name: 'Misaki Mincho', value: 'misaki-mincho', size: '8px', baseline: 6, file: 'misaki_mincho'},
        {name: 'k8x12', value: 'k8x12', size: '12px', baseline: 10, file: 'k8x12'},
        {name: 'k8x12L', value: 'k8x12l', size: '12px', baseline: 10, file: 'k8x12L'},
        {name: 'k8x12S', value: 'k8x12s', size: '12px', baseline: 10, file: 'k8x12S'},
        {name: 'k12x8', value: 'k12x8', size: '8px', baseline: 7, file: 'k12x8'},
      ],
    },
    {
      label: '기타',
      fonts: [
        {name: 'Unifont', value: 'unifont', size: '16px', baseline: 14, file: 'unifont'},
        {name: 'Unifont JP', value: 'unifont_jp', size: '16px', baseline: 14, file: 'unifont_jp'},
        {name: 'Zpix', value: 'zpix', size: '12px', baseline: 9, file: 'zpix'},
      ],
    },
  ]

  const allFonts = fontGroups.flatMap((g) => g.fonts)
  const fontsByValue = new Map(allFonts.map((font) => [font.value, font]))

  const fontTriggerContent = $derived.by(() => {
    const font = fontsByValue.get(fontValue)
    return font ? `${font.name} (${font.size})` : 'MaruMinyaHangul (12px)'
  })

  // ── Charset groups (from shared charsets index) ─────────────────────
  const charsetGroups = [...getCharsetGroups()]
  const charsetsByKey = new Map(charsetGroups.flatMap(([, entries]) => entries).map((entry) => [entry.key, entry]))

  const charsetTriggerContent = $derived.by(() => {
    if (charsetKey === 'custom') return '사용자 지정 문자 집합 입력'
    const entry = charsetsByKey.get(charsetKey)
    return entry
      ? entry.group === entry.label
        ? entry.label
        : `${entry.group} – ${entry.label}`
      : '한글 완성자 – 2,350자'
  })

  // ── State ───────────────────────────────────────────────────────────
  const initialFont = page.url.searchParams.get('font')
  const defaultFont = initialFont && fontsByValue.has(initialFont) ? initialFont : 'maruminyahangul'
  let fontValue = $state(defaultFont)

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
  const shadowControls = [
    'topleft',
    'top',
    'topright',
    'left',
    null,
    'right',
    'bottomleft',
    'bottom',
    'bottomright',
  ] as const

  let drawing = $state(false)
  let canvasReady = $state(false)
  let canvasEl: HTMLCanvasElement | undefined = $state()
  let previewAreaEl: HTMLDivElement | undefined = $state()
  let downloadHref = $state('')
  let downloadName = $state('')
  let downloadBlob: Blob | undefined

  let isDragging = $state(false)
  let startX = 0
  let startY = 0
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

  // ── Draw (Web Worker delegation) ────────────────────────────────────
  let worker: Worker | undefined
  let workerResolve: ((value: RenderResult) => void) | undefined
  let workerReject: ((reason: Error) => void) | undefined
  let destroyed = false

  function getWorker() {
    if (worker) return worker
    if (!browser) return

    worker = new Worker(new URL('./font-worker.ts', import.meta.url), {type: 'module'})
    worker.onmessage = ({data}: MessageEvent<WorkerMessage>) => {
      const resolve = workerResolve
      const reject = workerReject
      workerResolve = undefined
      workerReject = undefined

      if (data.success) {
        if (resolve) resolve(data)
        else if ('bitmap' in data) data.bitmap.close()
      } else reject?.(new Error(data.error || 'Worker error'))
    }
    worker.onerror = () => {
      workerReject?.(new Error('워커에서 이미지를 만들지 못했습니다.'))
      workerResolve = undefined
      workerReject = undefined
      worker?.terminate()
      worker = undefined
    }
    return worker
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (drawing || destroyed) return

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

    const font = fontsByValue.get(fontValue) ?? fontsByValue.get('maruminyahangul')!
    const fontPath = `/fonts/bdfs/${font.file}.bdf`
    const __charset = charsetKey === 'custom' ? customCharset : getCharset(charsetKey)
    let characterCount = 0
    for (const _ of __charset) characterCount++
    const {width, height} = getRenderSize(characterCount, Number(tileWidth), Number(tileHeight), Number(tileColumn))
    if (!isRenderSizeAllowed(width, height)) {
      toast.error('이미지가 너무 큽니다. 타일 크기 또는 열 수를 줄여 주세요.')
      return
    }

    drawing = true
    canvasReady = false
    downloadBlob = undefined

    if (downloadHref) {
      URL.revokeObjectURL(downloadHref)
      downloadHref = ''
    }
    if (canvasEl) {
      canvasEl.width = 0
      canvasEl.height = 0
    }

    // Wait for the DOM to update the spinner visibility
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

    if (destroyed) return

    const renderWorker = getWorker()
    if (!renderWorker) {
      alert('워커가 로드되지 않았습니다.')
      drawing = false
      return
    }

    const payload: RenderPayload = {
      fontValue,
      fontPath,
      charset: __charset,
      tileWidth,
      tileHeight,
      tileColumn,
      xOffset,
      yOffset,
      fontSize: font.baseline,
      background,
      foreground,
      shadowColor,
      shadowPositions: $state.snapshot(shadowPositions),
      shadowValues,
    }

    try {
      const renderPromise = new Promise<RenderResult>((resolve, reject) => {
        workerResolve = resolve
        workerReject = reject
        renderWorker.postMessage(payload)
      })

      const result = await renderPromise
      let blob: Blob
      try {
        if (destroyed) return
        const cvs = canvasEl
        if (!cvs) throw new Error('캔버스를 초기화하지 못했습니다.')
        cvs.width = result.width
        cvs.height = result.height
        const ctx = cvs.getContext('2d')
        if (!ctx) throw new Error('캔버스를 초기화하지 못했습니다.')

        if ('bitmap' in result) {
          ctx.drawImage(result.bitmap, 0, 0)
          blob = result.blob
        } else {
          ctx.putImageData(new ImageData(result.buffer, result.width, result.height), 0, 0)
          blob = await new Promise<Blob>((resolve, reject) => {
            cvs.toBlob((value) => {
              if (value) resolve(value)
              else reject(new Error('PNG 파일을 만들지 못했습니다.'))
            })
          })
        }
      } finally {
        if ('bitmap' in result) result.bitmap.close()
      }
      if (destroyed) return

      downloadBlob = blob
      downloadHref = URL.createObjectURL(blob)
      canvasReady = true
      downloadName = `${payload.fontValue}_${payload.tileWidth}x${payload.tileHeight}`
      drawing = false
    } catch (error) {
      if (destroyed) return
      toast.error(`이미지 생성 실패: ${error instanceof Error ? error.message : String(error)}`)
      drawing = false
    }
  }

  async function handleCopy() {
    if (!downloadBlob || !canvasReady) return
    try {
      const item = new ClipboardItem({'image/png': downloadBlob})
      await navigator.clipboard.write([item])

      toast.success('이미지를 클립보드에 복사했습니다')
    } catch {
      toast.error('이미지를 복사하지 못했습니다')
    }
  }

  function handlePointerDown(e: PointerEvent) {
    if (!previewAreaEl || !canvasReady) return
    isDragging = true
    startX = e.clientX
    startY = e.clientY
    scrollLeft = previewAreaEl.scrollLeft
    scrollTop = previewAreaEl.scrollTop
    previewAreaEl.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isDragging || !previewAreaEl) return
    e.preventDefault()
    const walkX = e.clientX - startX
    const walkY = e.clientY - startY
    previewAreaEl.scrollLeft = scrollLeft - walkX
    previewAreaEl.scrollTop = scrollTop - walkY
  }

  function handlePointerUp(e: PointerEvent) {
    isDragging = false
    if (previewAreaEl?.hasPointerCapture(e.pointerId)) previewAreaEl.releasePointerCapture(e.pointerId)
  }

  onDestroy(() => {
    destroyed = true
    downloadBlob = undefined
    const reject = workerReject
    workerResolve = undefined
    workerReject = undefined
    reject?.(new Error('페이지를 떠나 이미지 생성을 중단했습니다.'))
    worker?.terminate()
    worker = undefined
    if (downloadHref) URL.revokeObjectURL(downloadHref)
    if (canvasEl) {
      canvasEl.width = 0
      canvasEl.height = 0
    }
  })
</script>

<svelte:head>
  <title>비트맵 폰트 이미지 생성기 – quiple</title>
  <meta property="og:title" content="비트맵 폰트 이미지 생성기" />
  <meta name="description" content="비트맵 폰트 이미지를 만드는 도구." />
  <meta property="og:description" content="비트맵 폰트 이미지를 만드는 도구." />
</svelte:head>

<Toaster />

<PageTitle>비트맵 폰트 이미지 생성기</PageTitle>

<div class="generator">
  <!-- ── Canvas preview area ──────────────────────────────────────── -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="preview-area"
    class:cursor-grab={canvasReady && !isDragging}
    class:cursor-grabbing={canvasReady && isDragging}
    bind:this={previewAreaEl}
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
    onpointercancel={handlePointerUp}
  >
    <div class="canvas-wrapper" class:hidden={!canvasReady}>
      <canvas bind:this={canvasEl} id="preview" class="preview-canvas"></canvas>
    </div>
    {#if drawing}
      <div class="placeholder">
        <LoaderCircle class="size-6 animate-spin text-muted-foreground" />
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
                <Select.Trigger class="w-full" id="font">
                  {fontTriggerContent}
                </Select.Trigger>
                <Select.Content class="max-h-[calc(100dvh-var(--header-height)-5rem)]">
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
                <Select.Trigger class="w-full" id="charset">{charsetTriggerContent}</Select.Trigger>
                <Select.Content class="max-h-[calc(100dvh-var(--header-height)-9.25rem)]">
                  {#each charsetGroups as [groupName, entries]}
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
                  class="h-20 min-h-20 text-xs! break-all"
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
                  class="h-20 min-h-20 text-xs break-all"
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

            <HexColorInput id="foreground" label="전경색" bind:value={foreground} />
            <HexColorInput id="background" label="배경색" help="비워 두면 투명을 사용합니다." bind:value={background} />
            <HexColorInput id="shadow-color" label="그림자 색" bind:value={shadowColor} />

            <!-- 그림자 위치 -->
            <div class="grid gap-2">
              <Label>그림자 위치</Label>
              <div class="shadow-grid">
                {#each shadowControls as position}
                  {#if position}
                    <input type="checkbox" id="shadow-{position}" bind:checked={shadowPositions[position]} />
                  {:else}
                    <input type="checkbox" aria-label="그림자 없음" disabled />
                  {/if}
                {/each}
              </div>
            </div>
          </div>
        </Card.Content>
        <Card.Footer class="flex-col gap-2 px-4">
          <!-- 액션 버튼들 -->
          <Button type="submit" disabled={drawing} class="w-full" size="lg">
            {#if drawing}
              <LoaderCircle class="size-4 animate-spin" />
              만드는 중...
            {:else}
              만들기
            {/if}
          </Button>
          <div class="flex w-full gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!canvasReady}
              onclick={handleCopy}
              class="flex-1"
              size="sm"
            >
              <Copy />
              복사하기
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
              내보내기
            </Button>
          </div>
        </Card.Footer>
      </form>
    </Card.Root>

    <!-- 문자 집합 설명 -->
    <article class="charset-info">
      <h2>한글 완성자</h2>
      <ul>
        <li>
          2,350자: <a
            href="https://www.unicode.org/Public/MAPPINGS/OBSOLETE/EASTASIA/KSC/KSX1001.TXT"
            target="_blank"
            rel="noopener noreferrer">KS X 1001</a
          >의 모든 한글 완성자.
        </li>
        <li>
          2,355자: KS X 1001의 모든 한글 완성자에
          <abbr title="KS X 1001에 포함된 뢨, 썅, 쏀, 쓩, 쭁을 입력하기 위한 보충 문자.">뢔, 쌰, 쎼, 쓔, 쬬</abbr>
          5자가 추가된 집합.
        </li>
        <li>
          2,780자: <a href="https://github.com/adobe-type-tools/Adobe-KR" target="_blank" rel="noopener noreferrer"
            >Adobe-KR-0</a
          >의 모든 한글 완성자. KS X 1001의 2,350자를 포함합니다.
        </li>
        <li>
          4,358자: Adobe-KR-0과 Adobe-KR-1의 모든 한글 완성자. KS X 1001,
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
          >의 모든 한글 완성자를 포함합니다.
        </li>
        <li>11,172자: 현대 한글의 모든 완성자.</li>
      </ul>
      <h2>한자</h2>
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
      <h2>EUC-KR</h2>
      <ul>
        <li>EUC-KR: KS X 1001과 KS X 1003을 포함하는 문자 집합. 로마자와 기호, 한자 등을 포함합니다.</li>
        <li>한자 제외: EUC-KR에서 한자를 제외한 문자 집합.</li>
      </ul>
      <h2>Shift_JIS</h2>
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
      <small>&copy; 2026 Lee Minseo. 각 폰트는 해당 소유자, 저작권자 및 사용 허가자의 상표 및 저작권 자산입니다.</small>
    </article>
  </aside>
</div>

<style>
  @reference '#app.css';
  :global(main:has(> .generator)) {
    @apply -mt-(--header-height) pt-4 sm:pt-6;
  }

  .generator {
    @apply flex flex-col items-start gap-4 lg:flex-row;
  }

  .preview-area {
    @apply top-6 block h-[calc(100dvh-3rem)] min-h-40 w-full flex-1 overflow-hidden rounded-lg bg-muted/50 lg:sticky;
  }
  .preview-area .placeholder {
    @apply pointer-events-none absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted-foreground;
  }
  .preview-area .canvas-wrapper {
    @apply flex h-max min-h-full w-max min-w-full items-center justify-center p-6 [&.hidden]:hidden;
  }
  .preview-area .canvas-wrapper .preview-canvas {
    image-rendering: pixelated;
    image-rendering: crisp-edges;
  }

  .sidebar {
    @apply sticky top-5 flex w-full shrink-0 flex-col lg:w-2xs;
  }

  .input-pairs {
    @apply flex flex-col gap-2;
  }
  .input-pairs .input-pair {
    @apply flex items-center gap-2 text-sm [&_span]:text-muted-foreground;
  }

  .shadow-grid {
    @apply grid w-fit grid-cols-3 gap-0;
  }
  .shadow-grid input[type='checkbox'] {
    @apply size-4 cursor-pointer accent-primary;
  }
  .shadow-grid input[type='checkbox']:disabled {
    @apply cursor-not-allowed opacity-30;
  }

  .charset-info {
    @apply prose-shadcn mb-6 text-xs prose-h2:mt-6! prose-h2:mb-0! prose-h2:border-b-0! prose-h2:pb-0! prose-h2:text-sm! prose-ul:mt-0!;
  }
  .charset-info small {
    @apply text-xs text-muted-foreground;
  }
</style>
