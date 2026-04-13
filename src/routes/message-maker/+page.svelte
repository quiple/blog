<script lang="ts">
  import {Check, ChevronDown, ChevronUp, Copy, Download, Image, Plus, Spline, Upload, User, X} from '@lucide/svelte'
  import {browser} from '$app/environment'
  import * as ButtonGroup from '$lib/components/ui/button-group/index.js'
  import {Button} from '$lib/components/ui/button/index.js'
  import * as Card from '$lib/components/ui/card/index.js'
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
    momotalk: 'MomoTalk',
    imessage: 'iMessage',
    line: 'LINE',
    kakaotalk: 'KakaoTalk',
  }
  const langLabels: Record<string, string> = {
    ko: '한국어',
    en: 'English',
    ja: '日本語',
  }
</script>

<svelte:head>
  <title>메시지 만들기</title>
  <meta property="og:title" content="메시지 만들기" />
  <meta name="description" content="메신저 스타일의 대화 이미지를 만드는 도구." />
  <meta property="og:description" content="메신저 스타일의 대화 이미지를 만드는 도구." />
</svelte:head>

<h1 class="page-title">메시지 만들기</h1>

<div class="maker-layout">
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
        <Button variant="outline" size="sm" onclick={importJson} title="JSON 가져오기">
          <Upload /> 가져오기
        </Button>
        <Button variant="outline" size="sm" onclick={exportJson} title="JSON 내보내기">
          <Download /> 내보내기
        </Button>
      </ButtonGroup.Root>
    </div>

    <div class="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
      {#each messages as msg, i (i)}
        <Card.Root
          class={['overflow-visible p-2 pt-1 gap-1', msg.type === 'left' && 'mr-6', msg.type === 'right' && 'ml-6']}
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
            <Button variant="outline" size="sm" onclick={() => addBubble(i)}>
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
          <label class="setting-label" for="setting-theme">테마</label>
          <Select.Root type="single" bind:value={themeName}>
            <Select.Trigger class="w-full" id="setting-theme">
              {themeLabels[themeName]}
            </Select.Trigger>
            <Select.Content>
              <Select.Group>
                <Select.Item value="momotalk">모모톡</Select.Item>
                <Select.Item value="imessage">iMessage</Select.Item>
                <Select.Item value="line">LINE</Select.Item>
                <Select.Item value="kakaotalk">카카오톡</Select.Item>
              </Select.Group>
            </Select.Content>
          </Select.Root>
        </div>
      {/if}

      <div class="grid gap-2">
        <label class="setting-label" for="setting-lang">언어 (Language)</label>
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
              PNG로 내보내기
            </Button>
            <Button class="grow" variant="outline" onclick={handleCopyPng}>
              {#if isCopied}
                <Check />
              {:else}
                <Copy />
              {/if}
              {isCopied ? '복사됨!' : 'PNG로 복사하기'}
            </Button>
          </ButtonGroup.Root>
          <ButtonGroup.Root class="grow">
            <Button class="grow" variant="outline" onclick={() => canvasEl && exportAsVectorSvg(messages, themeName)}>
              <Spline />
              SVG로 내보내기
            </Button>
          </ButtonGroup.Root>
        </ButtonGroup.Root>
      </div>
    </div>
  </div>
</div>

<!-- ━━━ 학생 선택 대화 상자 ━━━ -->
{#if showStudentDialog}
  <div
    class="dialog-overlay"
    onclick={() => {
      showStudentDialog = false
      showCustomInput = false
      studentSearchQuery = ''
    }}
    onkeydown={(e) => {
      if (e.key === 'Escape') {
        showStudentDialog = false
        showCustomInput = false
        studentSearchQuery = ''
      }
    }}
    role="presentation"
  >
    <div
      class="dialog"
      onclick={(e) => e.stopPropagation()}
      onkeydown={() => {}}
      role="dialog"
      aria-label="학생 선택"
      tabindex="-1"
    >
      <div class="dialog-header">
        <h2 class="dialog-title">학생 선택</h2>
        <button
          class="btn-icon"
          aria-label="닫기"
          onclick={() => {
            showStudentDialog = false
            showCustomInput = false
            studentSearchQuery = ''
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg
          >
        </button>
      </div>

      {#if !showCustomInput}
        <div class="dialog-search">
          <input type="text" class="search-input" placeholder="학생 이름 검색..." bind:value={studentSearchQuery} />
        </div>

        <div class="dialog-body">
          <div class="student-grid">
            {#each filteredStudents as student, si (student.name.en)}
              <div class="student-card-wrapper">
                <button
                  class="student-card"
                  onclick={() => {
                    if (student.portrait.length > 1) {
                      toggleStudentExpand(si)
                    } else {
                      selectStudent(student, 0)
                    }
                  }}
                >
                  <img
                    class="student-portrait"
                    src="/img/blue-archive/{student.portrait[0]}.png"
                    alt={student.name[lang]}
                    loading="lazy"
                  />
                  <span class="student-name">{student.name[lang]}</span>
                  {#if student.portrait.length > 1}
                    <span class="portrait-count">{student.portrait.length}</span>
                  {/if}
                </button>

                {#if expandedStudentIndex === si && student.portrait.length > 1}
                  <div class="portrait-variants">
                    {#each student.portrait as p, pi}
                      <button class="variant-btn" onclick={() => selectStudent(student, pi)}>
                        <img
                          class="variant-img"
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

        <div class="dialog-footer">
          <button class="btn btn-custom" onclick={selectCustomStudent}> 사용자 지정 </button>
        </div>
      {:else}
        <div class="dialog-body custom-body">
          <div class="custom-form">
            <div class="custom-field">
              <label class="custom-label" for="custom-name-input">이름</label>
              <input
                id="custom-name-input"
                type="text"
                class="custom-input"
                placeholder="이름 입력..."
                bind:value={customName}
              />
            </div>
            <div class="custom-field">
              <label class="custom-label" for="custom-portrait-upload">프로필 사진</label>
              {#if customPortraitUrl}
                <img class="custom-preview" src={customPortraitUrl} alt="미리보기" />
              {/if}
              <input
                id="custom-portrait-upload"
                type="file"
                accept="image/*"
                onchange={handleCustomPortraitUpload}
                class="custom-file-input"
              />
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button
            class="btn btn-sm"
            onclick={() => {
              showCustomInput = false
            }}
          >
            뒤로
          </button>
          <button class="btn btn-primary btn-sm" onclick={confirmCustomStudent}> 확인 </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style lang="sass">
  @reference '#app.css'

  :global(main)
    @apply pb-0!

  .maker-layout
    @apply grid grid-cols-3 gap-0 h-[calc(100vh-var(--header-height))] -mx-4 sm:-mx-6

  .col
    @apply flex flex-col border-r border-border last:border-r-0

  // ── 열 헤더 공통 ──
  .preview-header, .editor-header, .settings-header
    @apply flex items-center justify-between h-11 px-4 border-b border-border bg-muted/50 shrink-0

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

  .editor-actions
    @apply flex gap-1.5

  .editor-scroll
    @apply flex-1 overflow-y-auto p-3 flex flex-col gap-2.5

  .msg-card
    @apply bg-card rounded-lg border border-border p-3 transition-shadow hover:shadow-sm

  .msg-card.msg-sensei
    @apply border-blue-300/40 bg-blue-50/30

  :global(.dark) .msg-card.msg-sensei
    @apply border-blue-800/30 bg-blue-950/20

  .msg-card-header
    @apply flex items-center gap-2 mb-2

  .msg-index
    @apply text-xs font-mono text-muted-foreground

  .msg-type-badge
    @apply text-xs px-1.5 py-0.5 rounded-full font-medium

  .badge-student
    @apply bg-pink-100 text-pink-700

  :global(.dark) .badge-student
    @apply bg-pink-950/40 text-pink-300

  .badge-sensei
    @apply bg-blue-100 text-blue-700

  :global(.dark) .badge-sensei
    @apply bg-blue-950/40 text-blue-300

  .msg-card-actions
    @apply ml-auto flex gap-0.5

  .msg-student-info
    @apply flex items-center gap-2 mb-2

  .msg-portrait-thumb
    @apply size-8 rounded-full object-cover border border-border

  .msg-portrait-placeholder
    @apply size-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground

  .msg-student-name
    @apply text-sm font-medium flex-1 truncate

  .msg-textarea
    @apply w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-1 focus:ring-ring flex-1

  .msg-bubbles
    @apply flex flex-col gap-1.5

  .bubble-row
    @apply flex items-start gap-1.5

  .bubble-index
    @apply text-[10px] font-mono text-muted-foreground mt-2.5 w-3 text-right shrink-0

  .bubble-remove
    @apply mt-1.5 shrink-0 size-6

  .btn-add-bubble
    @apply self-start text-muted-foreground border-dashed mt-0.5

  // ── 버튼 ──
  .btn
    @apply inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground

  .btn-sm
    @apply text-xs px-2 py-1

  .btn-xs
    @apply text-xs px-1.5 py-0.5

  .btn-primary
    @apply bg-primary text-primary-foreground border-primary hover:bg-primary/90

  .btn-icon
    @apply inline-flex items-center justify-center size-7 rounded-md transition-colors hover:bg-accent text-muted-foreground hover:text-foreground

  .btn-danger
    @apply hover:bg-destructive/10 hover:text-destructive

  .add-buttons
    @apply flex gap-2 pt-2

  .btn-add
    @apply flex-1 justify-center py-2 border-dashed

  .btn-add-student
    @apply border-pink-300 text-pink-600 hover:bg-pink-50

  :global(.dark) .btn-add-student
    @apply border-pink-800 text-pink-400 hover:bg-pink-950/30

  .btn-add-sensei
    @apply border-blue-300 text-blue-600 hover:bg-blue-50

  :global(.dark) .btn-add-sensei
    @apply border-blue-800 text-blue-400 hover:bg-blue-950/30

  // ── 3열: 설정 ──
  .col-settings
    @apply overflow-hidden

  .settings-scroll
    @apply flex-1 overflow-y-auto p-4 flex flex-col gap-4

  .setting-group
    @apply flex flex-col gap-1.5

  .setting-label
    @apply text-sm font-medium text-foreground

  .setting-select
    @apply w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-1 focus:ring-ring

  .setting-divider
    @apply border-border

  .export-buttons
    @apply flex flex-col gap-2.5

  .btn-export
    @apply justify-center py-2.5 text-sm font-semibold

  .btn-png
    @apply bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700

  .btn-copy
    @apply bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700

  .btn-svg
    @apply bg-violet-600 text-white border-violet-600 hover:bg-violet-700

  // ── 대화 상자 ──
  .dialog-overlay
    @apply fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm

  .dialog
    @apply bg-card rounded-xl shadow-2xl border border-border w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden

  .dialog-header
    @apply flex items-center justify-between px-5 py-3.5 border-b border-border

  .dialog-title
    @apply text-base font-semibold

  .dialog-search
    @apply px-4 pt-3 pb-2

  .search-input
    @apply w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring

  .dialog-body
    @apply flex-1 overflow-y-auto px-4 py-3

  .dialog-footer
    @apply flex items-center justify-end gap-2 px-4 py-3 border-t border-border

  // 학생 그리드
  .student-grid
    @apply grid grid-cols-4 gap-2

  .student-card-wrapper
    @apply flex flex-col

  .student-card
    @apply flex flex-col items-center gap-1 rounded-lg p-2 transition-colors hover:bg-accent cursor-pointer border border-transparent hover:border-border relative

  .student-portrait
    @apply size-14 rounded-full object-cover

  .student-name
    @apply text-xs text-center font-medium line-clamp-1

  .portrait-count
    @apply absolute top-1 right-1 bg-muted text-muted-foreground text-[10px] size-4 rounded-full flex items-center justify-center font-bold

  .portrait-variants
    @apply flex gap-1 p-1.5 bg-muted rounded-lg mt-1 flex-wrap justify-center

  .variant-btn
    @apply rounded-md overflow-hidden transition-transform hover:scale-105 border-2 border-transparent hover:border-primary

  .variant-img
    @apply size-12 object-cover rounded-md

  .btn-custom
    @apply mr-auto

  // 사용자 지정 입력
  .custom-body
    @apply p-6

  .custom-form
    @apply flex flex-col gap-4

  .custom-field
    @apply flex flex-col gap-1.5

  .custom-label
    @apply text-sm font-medium

  .custom-input
    @apply rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring

  .custom-preview
    @apply size-16 rounded-full object-cover border border-border

  .custom-file-input
    @apply text-sm
</style>
