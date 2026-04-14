<script lang="ts">
  import {Check, ChevronDown, ChevronUp, Copy, Download, Image, Plus, Spline, Upload, User, X} from '@lucide/svelte'
  import {browser} from '$app/environment'
  import {Badge} from '$lib/components/ui/badge/index.js'
  import * as ButtonGroup from '$lib/components/ui/button-group/index.js'
  import {Button, buttonVariants} from '$lib/components/ui/button/index.js'
  import * as Card from '$lib/components/ui/card/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import {Input} from '$lib/components/ui/input/index.js'
  import * as Select from '$lib/components/ui/select/index.js'
  import {Textarea} from '$lib/components/ui/textarea/index.js'
  import type {Language, ThemeName} from '$lib/message-maker/configs'
  import {themes} from '$lib/message-maker/configs'
  import {
    copyCanvasToClipboard,
    exportAsPng,
    exportAsVectorSvg,
    renderCanvas,
    type ConversationData,
    type MessageItem,
  } from '$lib/message-maker/renderer'
  import students, {type Student} from '$lib/message-maker/students'

  const isProd = import.meta.env.PROD

  // ── 상태 ──
  let themeName: ThemeName = $state('momotalk')
  let lang: Language = $state('ko')
  let density: number = $state(2)
  let canvasEl: HTMLCanvasElement | undefined = $state()
  let previewContainer: HTMLDivElement | undefined = $state()
  let messages: MessageItem[] = $state([
    {
      type: 'left',
      name: '유우카',
      portrait: '/img/blue-archive/Student_Portrait_Yuuka_Collection.png',
      text: ['안녕하세요, 선생님. 유우카입니다.'],
    },
    {
      type: 'left',
      name: '유우카',
      portrait: '/img/blue-archive/Student_Portrait_Yuuka_Collection.png',
      text: ['저 기억하고 계시죠?'],
    },
    {
      type: 'right',
      text: ['아아. 당연하지.'],
    },
    {
      type: 'left',
      name: '유우카',
      portrait: '/img/blue-archive/Student_Portrait_Yuuka_Collection.png',
      text: ['뭐, 그럼 다행이구요.'],
    },
    {
      type: 'left',
      name: '유우카',
      portrait: '/img/blue-archive/Student_Portrait_Yuuka_Collection.png',
      text: [
        '선생님의 연락처를 받아두길 잘했네요.',
        '모모톡으로 연락드린 건 다름이 아니라…….',
        '지난번 살레 탈환 당시 사용했던 탄환의 경비 처리가 늦어지고 있어서요.',
      ],
    },
    {
      type: 'left',
      name: '유우카',
      portrait: '/img/blue-archive/Student_Portrait_Yuuka_Collection.png',
      text: ['경비는 언제쯤 청구받을 수 있을까요?'],
    },
    {
      type: 'right',
      text: ['이쪽에서 처리해야 하는 거였어……?'],
    },
    {
      type: 'left',
      name: '유우카',
      portrait: '/img/blue-archive/Student_Portrait_Yuuka_Collection.png',
      text: [
        '물론이죠. 탄환도 공짜는 아니니까요.',
        '청구서를 작성해서 보내주시면 총학생회에서',
        '대신 잔금을 치러줄 거예요.',
      ],
    },
    {
      type: 'right',
      text: ['청구서는 어떻게 써야 하지…….'],
    },
    {
      type: 'left',
      name: '유우카',
      portrait: '/img/blue-archive/Student_Portrait_Yuuka_Collection.png',
      text: ['청구서 양식이라면 밀레니엄 학원에서 쓰는 것이 있어요.', '다음에 샬레를 방문할 때 가져다드릴게요.'],
    },
    {
      type: 'right',
      text: ['도와줘서 고마워.'],
    },
    {
      type: 'left',
      name: '유우카',
      portrait: '/img/blue-archive/Student_Portrait_Yuuka_Collection.png',
      text: ['어려운 일도 아닌걸요.', '그럼 좋은 하루 되세요.'],
    },
  ])

  // 학생 선택 대화 상자
  let showStudentDialog = $state(false)
  let dialogTargetIndex = $state(-1)
  let studentSearchQuery = $state('')
  let showCustomInput = $state(false)
  let customName = $state('')
  let customPortraitUrl = $state('')
  let customPortraitFile: File | null = $state(null)

  // 포커스할 입력 인덱스
  let focusIndex = $state(-1)

  // 복사 상태 피드백
  let isCopied = $state(false)

  // 학생 목록 필터링
  let filteredStudents = $derived.by(() => {
    if (!studentSearchQuery) return students
    const q = studentSearchQuery.toLowerCase()
    return students.filter(
      (s) =>
        s.name.ko.toLowerCase().includes(q) ||
        s.name.en.toLowerCase().includes(q) ||
        s.name.ja.toLowerCase().includes(q),
    )
  })

  // 대화 JSON 내보내기
  function exportJson() {
    const data: ConversationData = {messages, theme: themeName, lang}
    const json = JSON.stringify(data)
    const blob = new Blob([json], {type: 'application/json'})
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = 'conversation.json'
    link.href = url
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // 대화 JSON 가져오기
  function importJson() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const text = await file.text()
      try {
        const data = JSON.parse(text) as ConversationData
        if (data.messages) {
          // 하위 호환성: text가 string인 경우 string[]으로 변환
          messages = data.messages.map((m) => ({
            ...m,
            text: Array.isArray(m.text) ? m.text : [m.text as unknown as string],
          }))
        }
        if (data.theme) themeName = data.theme
        if (data.lang) lang = data.lang
        requestRedraw()
      } catch {
        alert('유효하지 않은 JSON 파일입니다.')
      }
    }
    input.click()
  }

  // 메시지 추가
  function addMessage(type: 'left' | 'right') {
    if (type === 'right') {
      messages = [...messages, {type: 'right', name: '', portrait: '', text: ['']}]
      focusIndex = messages.length - 1
    } else {
      messages = [...messages, {type: 'left', name: '', portrait: '', text: ['']}]
      // 학생 선택 대화 상자 표시
      dialogTargetIndex = messages.length - 1
      showStudentDialog = true
    }
  }

  // 말풍선 추가 (해당 메시지에 프로필 없이 딸림 말풍선 추가)
  function addBubble(msgIndex: number) {
    messages[msgIndex].text = [...messages[msgIndex].text, '']
    messages = [...messages]
    // 새로 추가된 말풍선에 포커스
    setTimeout(() => {
      const input = document.getElementById(
        `msg-input-${msgIndex}-${messages[msgIndex].text.length - 1}`,
      ) as HTMLTextAreaElement
      input?.focus()
    }, 50)
  }

  // 말풍선 삭제 (최소 1개는 유지)
  function removeBubble(msgIndex: number, bubbleIndex: number) {
    if (messages[msgIndex].text.length <= 1) return
    messages[msgIndex].text = messages[msgIndex].text.filter((_, i) => i !== bubbleIndex)
    messages = [...messages]
    requestRedraw()
  }

  // 메시지 삭제
  function removeMessage(index: number) {
    messages = messages.filter((_, i) => i !== index)
    requestRedraw()
  }

  // 메시지 순서 변경
  function moveMessage(index: number, direction: -1 | 1) {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= messages.length) return
    const newMessages = [...messages]
    ;[newMessages[index], newMessages[newIndex]] = [newMessages[newIndex], newMessages[index]]
    messages = newMessages
    requestRedraw()
  }

  // 학생 선택
  function selectStudent(student: Student, portraitIndex: number = 0) {
    if (dialogTargetIndex < 0 || dialogTargetIndex >= messages.length) return
    const portraitFile = student.portrait[portraitIndex]
    messages[dialogTargetIndex] = {
      ...messages[dialogTargetIndex],
      name: student.name[lang],
      portrait: `/img/blue-archive/${portraitFile}.png`,
    }
    messages = [...messages]
    showStudentDialog = false
    showCustomInput = false
    studentSearchQuery = ''
    focusIndex = dialogTargetIndex
    requestRedraw()
  }

  // 학생 프로필 사진 선택 (같은 학생의 다른 의상)
  let expandedStudentIndex = $state(-1)

  function toggleStudentExpand(index: number) {
    expandedStudentIndex = expandedStudentIndex === index ? -1 : index
  }

  // 사용자 지정 학생
  function selectCustomStudent() {
    showCustomInput = true
    expandedStudentIndex = -1
  }

  function confirmCustomStudent() {
    if (dialogTargetIndex < 0 || dialogTargetIndex >= messages.length) return
    let portrait = customPortraitUrl
    if (customPortraitFile) {
      portrait = URL.createObjectURL(customPortraitFile)
    }
    messages[dialogTargetIndex] = {
      ...messages[dialogTargetIndex],
      name: customName || '사용자 지정',
      portrait: portrait,
    }
    messages = [...messages]
    showStudentDialog = false
    showCustomInput = false
    customName = ''
    customPortraitUrl = ''
    customPortraitFile = null
    studentSearchQuery = ''
    focusIndex = dialogTargetIndex
    requestRedraw()
  }

  function handleCustomPortraitUpload(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) {
      customPortraitFile = file
      customPortraitUrl = URL.createObjectURL(file)
    }
  }

  // 학생 선택 대화 상자 열기 (기존 메시지 편집)
  function openStudentDialog(index: number) {
    dialogTargetIndex = index
    showStudentDialog = true
    showCustomInput = false
    studentSearchQuery = ''
    expandedStudentIndex = -1
  }

  // Canvas 다시 그리기
  let drawTimer: ReturnType<typeof setTimeout> | undefined
  function requestRedraw() {
    if (drawTimer) clearTimeout(drawTimer)
    drawTimer = setTimeout(() => {
      doRedraw()
    }, 100)
  }

  async function handleCopyPng() {
    if (!canvasEl) return
    try {
      await copyCanvasToClipboard(canvasEl)
      isCopied = true
      setTimeout(() => {
        isCopied = false
      }, 2000)
    } catch {
      alert('클립보드 복사에 실패했습니다.')
    }
  }

  async function doRedraw() {
    if (!browser || !canvasEl) return
    try {
      await renderCanvas(canvasEl, messages, themeName, lang)
    } catch (e) {
      console.error('Render error:', e)
    }
  }

  // 초기 렌더링 및 감시
  $effect(() => {
    if (browser && canvasEl) {
      doRedraw()
    }
  })

  // 테마/언어 변경 시 재렌더링
  $effect(() => {
    // 의존성 추적
    void themeName
    void lang
    requestRedraw()
  })

  // 포커스 처리
  $effect(() => {
    if (focusIndex >= 0 && browser) {
      const idx = focusIndex
      focusIndex = -1
      setTimeout(() => {
        const input = document.getElementById(`msg-input-${idx}-0`) as HTMLTextAreaElement
        input?.focus()
      }, 50)
    }
  })
  const themeLabels: Record<string, string> = {
    momotalk: '모모톡',
    imessage: 'iMessage',
    line: 'LINE',
    kakaotalk: '카카오톡',
  }
  const langLabels: Record<string, string> = {
    ko: '한국어',
    ja: '日本語',
    en: 'English',
  }
</script>

<svelte:head>
  <title>메시지 만들기</title>
  <meta property="og:title" content="메시지 만들기" />
  <meta name="description" content="메신저 스타일의 대화 이미지를 만드는 도구." />
  <meta property="og:description" content="메신저 스타일의 대화 이미지를 만드는 도구." />
</svelte:head>

<h1 class="page-title">메시지 만들기</h1>

<div class="grid grid-cols-3 gap-0 h-[calc(100vh-var(--header-height))] -mx-4 sm:-mx-6 border-t">
  <!-- ━━━ 1열: 캔버스 미리보기 ━━━ -->
  <div class="col col-preview" bind:this={previewContainer}>
    <div class="preview-header">
      <span class="preview-label">미리보기</span>
    </div>
    <div class="preview-scroll">
      <canvas bind:this={canvasEl} class="preview-canvas"></canvas>
    </div>
  </div>

  <!-- ━━━ 2열: 대화 편집 ━━━ -->
  <div class="col col-editor">
    <div class="editor-header">
      <span class="editor-title">대화 편집</span>
      <ButtonGroup.Root>
        <Button variant="outline" size="sm" onclick={importJson} title="JSON으로 가져오기">
          <Upload /> 가져오기
        </Button>
        <Button variant="outline" size="sm" onclick={exportJson} title="JSON으로 내보내기">
          <Download /> 내보내기
        </Button>
      </ButtonGroup.Root>
    </div>

    <div class="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
      {#each messages as msg, i (i)}
        <Card.Root
          class={['overflow-visible p-2 pt-1 gap-1', msg.type === 'left' && 'mr-8', msg.type === 'right' && 'ml-8']}
        >
          <Card.Header class="flex items-center p-0">
            <span class="font-medium text-muted-foreground shrink-0 text-right tabular-nums text-xs min-w-4"
              >#{i + 1}</span
            >
            {#if msg.type === 'left'}
              <div class="flex items-center gap-1">
                {#if msg.portrait}
                  <div class="inner-border rounded-full after:rounded-full">
                    <img class="size-6 object-cover scale-110" src={msg.portrait} alt={msg.name} />
                  </div>
                {:else}
                  <div class="rounded-full size-6 bg-muted flex items-center justify-center text-muted-foreground">
                    <User class="size-4" />
                  </div>
                {/if}
                <span class="msg-student-name">{msg.name || '학생 미선택'}</span>
                <Button variant="outline" size="xs" class="ml-1" onclick={() => openStudentDialog(i)}>학생 선택</Button>
              </div>
            {/if}
            <div class="flex items-center justify-end grow">
              <ButtonGroup.Root class="gap-0! -mr-1">
                <ButtonGroup.Root>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onclick={() => moveMessage(i, -1)}
                    disabled={i === 0}
                    title="위로 이동"
                  >
                    <ChevronUp />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onclick={() => moveMessage(i, 1)}
                    disabled={i === messages.length - 1}
                    title="아래로 이동"
                  >
                    <ChevronDown />
                  </Button>
                </ButtonGroup.Root>
                <ButtonGroup.Root>
                  <Button variant="ghost" size="icon-sm" onclick={() => removeMessage(i)} title="삭제">
                    <X />
                  </Button>
                </ButtonGroup.Root>
              </ButtonGroup.Root>
            </div>
          </Card.Header>

          <Card.Content class="flex flex-col gap-1.5 items-end p-0">
            {#each msg.text as bubble, bi (bi)}
              <div class="flex items-start gap-1.5 w-full">
                <span class="font-medium text-muted-foreground mt-2.75 shrink-0 text-right tabular-nums text-xs min-w-4"
                  >{bi + 1}</span
                >
                <Textarea
                  id="msg-input-{i}-{bi}"
                  class="grow"
                  placeholder={msg.type === 'left' ? '왼쪽 메시지 입력...' : '오른쪽 메시지 입력...'}
                  bind:value={msg.text[bi]}
                  onkeyup={requestRedraw}
                  rows={2}
                />
                {#if msg.text.length > 1}
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    class="-mx-1.5"
                    onclick={() => removeBubble(i, bi)}
                    title="말풍선 삭제"
                  >
                    <X />
                  </Button>
                {/if}
              </div>
            {/each}
            <Button variant="outline" size="xs" onclick={() => addBubble(i)}>
              <Plus /> 말풍선 추가
            </Button>
          </Card.Content>
        </Card.Root>
      {/each}

      <div class="flex gap-2">
        <Button class="grow flex-1" size="lg" variant="outline" onclick={() => addMessage('left')}>
          <Plus /> 왼쪽 메시지 추가
        </Button>
        <Button class="grow flex-1" size="lg" variant="outline" onclick={() => addMessage('right')}>
          <Plus /> 오른쪽 메시지 추가
        </Button>
      </div>
    </div>
  </div>

  <!-- ━━━ 3열: 이미지 설정 ━━━ -->
  <div class="col col-settings">
    <div class="settings-header">
      <span class="settings-title">설정</span>
    </div>

    <div class="flex flex-col gap-4 p-4">
      {#if !isProd}
        <div class="grid gap-2">
          <label class="setting-label" for="setting-theme">
            {#if lang === 'ja'}テーマ
            {:else if lang === 'ko'}테마
            {:else}Theme
            {/if}
          </label>
          <Select.Root type="single" bind:value={themeName}>
            <Select.Trigger class="w-full" id="setting-theme">
              {themeLabels[themeName]}
            </Select.Trigger>
            <Select.Content>
              <Select.Group>
                <Select.Item value="momotalk">
                  {#if lang === 'ja'}モモトーク
                  {:else if lang === 'ko'}모모톡
                  {:else}MomoTalk
                  {/if}
                </Select.Item>
                <Select.Item value="imessage">iMessage</Select.Item>
                <Select.Item value="line">LINE</Select.Item>
                <Select.Item value="kakaotalk">카카오톡</Select.Item>
              </Select.Group>
            </Select.Content>
          </Select.Root>
        </div>

        <div class="grid gap-2">
          <label class="setting-label" for="setting-lang">
            {#if lang === 'ja'}言語 (Language)
            {:else if lang === 'ko'}언어 (Language)
            {:else}Language
            {/if}
          </label>
          <Select.Root type="single" bind:value={lang}>
            <Select.Trigger class="w-full" id="setting-lang">
              {langLabels[lang]}
            </Select.Trigger>
            <Select.Content>
              <Select.Group>
                <Select.Item value="ko">한국어</Select.Item>
                <Select.Item value="ja">日本語</Select.Item>
                <Select.Item value="en">English</Select.Item>
              </Select.Group>
            </Select.Content>
          </Select.Root>
        </div>
      {/if}

      <div class="grid gap-2">
        <label class="setting-label" for="setting-density">PNG 배율</label>
        <Select.Root
          type="single"
          value={String(density)}
          onValueChange={(v) => {
            if (v) {
              density = Number(v)
              requestRedraw()
            }
          }}
        >
          <Select.Trigger class="w-full" id="setting-density">
            {density}x
          </Select.Trigger>
          <Select.Content>
            <Select.Group>
              <Select.Item value="1">1x</Select.Item>
              <Select.Item value="2">2x</Select.Item>
              <Select.Item value="3">3x</Select.Item>
              <Select.Item value="4">4x</Select.Item>
            </Select.Group>
          </Select.Content>
        </Select.Root>
      </div>

      <div class="gap-2 flex flex-col">
        <ButtonGroup.Root class="w-full">
          <ButtonGroup.Root class="grow">
            <Button
              class="grow"
              variant="outline"
              onclick={() => canvasEl && exportAsPng(canvasEl, density, messages, themeName, lang)}
            >
              <Image />
              {#if lang === 'ja'}PNGにエクスポート
              {:else if lang === 'ko'}PNG로 내보내기
              {:else}Export as PNG
              {/if}
            </Button>
            <Button class="grow" variant="outline" onclick={handleCopyPng}>
              {#if isCopied}
                <Check />
              {:else}
                <Copy />
              {/if}
              {#if lang === 'ja'}{isCopied ? 'コピー済み!' : 'PNGにコピー'}
              {:else if lang === 'ko'}{isCopied ? '복사됨!' : 'PNG로 복사하기'}
              {:else}{isCopied ? 'Copied!' : 'Copy as PNG'}
              {/if}
            </Button>
          </ButtonGroup.Root>
          <ButtonGroup.Root class="grow">
            <Button class="grow" variant="outline" onclick={() => canvasEl && exportAsVectorSvg(messages, themeName)}>
              <Spline />
              {#if lang === 'ja'}SVGにエクスポート
              {:else if lang === 'ko'}SVG로 내보내기
              {:else}Export as SVG
              {/if}
            </Button>
          </ButtonGroup.Root>
        </ButtonGroup.Root>
      </div>
    </div>
  </div>
</div>

<!-- ━━━ 학생 선택 대화 상자 ━━━ -->
<Dialog.Root
  open={showStudentDialog}
  onOpenChange={(open) => {
    if (!open) {
      showStudentDialog = false
      showCustomInput = false
      studentSearchQuery = ''
    }
  }}
>
  <Dialog.Content class="sm:max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
    <Dialog.Header>
      <Dialog.Title lang={lang !== 'ko' ? lang : undefined}>
        {#if lang === 'ja'}生徒の選択
        {:else if lang === 'ko'}학생 선택
        {:else}Select a Student
        {/if}
      </Dialog.Title>
    </Dialog.Header>

    {#if !showCustomInput}
      <div class="shrink-0">
        <Input
          lang={lang !== 'ko' ? lang : undefined}
          type="text"
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
          placeholder={lang === 'ja' ? '検索...' : lang === 'ko' ? '검색...' : 'Search...'}
          bind:value={studentSearchQuery}
        />
      </div>

      <div class="flex-1 overflow-y-auto -m-4 p-4">
        <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1">
          {#each filteredStudents as student, si (student.name.en)}
            <div class="flex flex-col">
              <Button
                variant="ghost"
                class="flex-col h-auto py-1 relative gap-1"
                onclick={() => {
                  if (student.portrait.length > 1) {
                    toggleStudentExpand(si)
                  } else {
                    selectStudent(student, 0)
                  }
                }}
              >
                <div class="inner-border rounded-full after:rounded-full size-14">
                  <img
                    class="size-full object-cover"
                    src="/img/blue-archive/{student.portrait[0]}.png"
                    alt={student.name[lang]}
                    loading="lazy"
                  />
                </div>
                <span class="text-sm text-center font-medium line-clamp-1" lang={lang !== 'ko' ? lang : undefined}
                  >{student.name[lang]}</span
                >
                {#if student.portrait.length > 1}
                  <Badge variant="secondary" class="absolute top-2 right-2 px-1.5">
                    {student.portrait.length}
                  </Badge>
                {/if}
              </Button>

              {#if expandedStudentIndex === si && student.portrait.length > 1}
                <div
                  class="flex gap-1 p-1 bg-muted rounded-lg mt-1 flex-wrap justify-center border animate-in fade-in zoom-in-95 duration-200"
                >
                  {#each student.portrait as p, pi}
                    <button
                      class="rounded-full overflow-hidden border-2 border-transparent hover:border-primary transition-all p-0"
                      onclick={() => selectStudent(student, pi)}
                    >
                      <img
                        class="size-10 object-cover"
                        src="/img/blue-archive/{p}.png"
                        alt="{student.name[lang]} 변형 {pi + 1}"
                        loading="lazy"
                      />
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <Dialog.Footer>
        <Button variant="outline" onclick={selectCustomStudent}>사용자 지정 이미지 사용...</Button>
        <Dialog.Close type="button" class={buttonVariants({variant: 'outline'})}>취소</Dialog.Close>
      </Dialog.Footer>
    {:else}
      <div class="p-6 overflow-y-auto">
        <div class="flex flex-col gap-6 max-w-md mx-auto">
          <div class="grid gap-2">
            <label class="text-sm font-medium" for="custom-name-input">이름</label>
            <input
              id="custom-name-input"
              type="text"
              class="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
              placeholder="이름 입력..."
              bind:value={customName}
            />
          </div>
          <div class="grid gap-4">
            <label class="text-sm font-medium" for="custom-portrait-upload">프로필 사진</label>
            <div class="flex items-center gap-4">
              {#if customPortraitUrl}
                <img
                  class="size-20 rounded-full object-cover border-2 border-primary p-0.5"
                  src={customPortraitUrl}
                  alt="미리보기"
                />
              {:else}
                <div
                  class="size-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground border"
                >
                  <User class="size-10" />
                </div>
              {/if}
              <div class="flex flex-col gap-2 grow">
                <input
                  id="custom-portrait-upload"
                  type="file"
                  accept="image/*"
                  onchange={handleCustomPortraitUpload}
                  class="text-xs file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                <p class="text-[10px] text-muted-foreground">권장 사이즈: 256x256 이상 (정사각형)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Dialog.Footer>
        <Button
          variant="outline"
          onclick={() => {
            showCustomInput = false
          }}
        >
          뒤로
        </Button>
        <Button onclick={confirmCustomStudent}>적용하기</Button>
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>

<style lang="sass">
  @reference '#app.css'

  :global(main)
    @apply pb-0!

  .col
    @apply flex flex-col border-r last:border-r-0

  // ── 열 헤더 공통 ──
  .preview-header, .editor-header, .settings-header
    @apply flex items-center justify-between h-11 px-4 border-b bg-muted/50 shrink-0

  .preview-label, .editor-title, .settings-title
    @apply text-sm font-semibold text-muted-foreground

  // ── 1열: 미리보기 ──
  .col-preview
    @apply overflow-hidden

  .preview-scroll
    @apply flex-1 overflow-y-auto overflow-x-hidden bg-muted/30

  .preview-canvas
    @apply w-full h-auto block

  // ── 2열: 에디터 ──
  .col-editor
    @apply overflow-hidden

  .msg-student-name
    @apply text-sm font-medium flex-1 truncate

  // ── 3열: 설정 ──
  .col-settings
    @apply overflow-hidden

  .setting-label
    @apply text-sm font-medium text-foreground
</style>
