<script lang="ts">
  import {Shuffle} from '@lucide/svelte'
  import {Button} from '$lib/components/ui/button/index.js'
  import {Checkbox} from '$lib/components/ui/checkbox/index.js'
  import {Label} from '$lib/components/ui/label/index.js'
  import * as Select from '$lib/components/ui/select/index.js'
  import {Slider} from '$lib/components/ui/slider/index.js'
  import {Textarea} from '$lib/components/ui/textarea/index.js'
  import ALargeSmallIcon from '@lucide/svelte/icons/a-large-small'
  import ListChevronsUpDownIcon from '@lucide/svelte/icons/list-chevrons-up-down'

  let {font}: {font?: string} = $props()
  let selectedFontValue = $state('g11')
  const galmuris = [
    {value: 'g14', label: 'Galmuri14', size: 15, family: 'Galmuri14-web', weight: 400, stretch: 'normal'},
    {value: 'g11', label: 'Galmuri11', size: 12, family: 'Galmuri11-web', weight: 400, stretch: 'normal'},
    {value: 'g11b', label: 'Galmuri11 Bold', size: 12, family: 'Galmuri11-web', weight: 700, stretch: 'normal'},
    {
      value: 'g11c',
      label: 'Galmuri11 Condensed',
      size: 12,
      family: 'Galmuri11-web',
      weight: 400,
      stretch: 'condensed',
    },
    {value: 'g9', label: 'Galmuri9', size: 10, family: 'Galmuri9-web', weight: 400, stretch: 'normal'},
    {value: 'g7', label: 'Galmuri7', size: 8, family: 'Galmuri7-web', weight: 400, stretch: 'normal'},
    {value: 'gm11', label: 'GalmuriMono11', size: 12, family: 'GalmuriMono11-web', weight: 400, stretch: 'normal'},
    {value: 'gm9', label: 'GalmuriMono9', size: 10, family: 'GalmuriMono9-web', weight: 400, stretch: 'normal'},
    {value: 'gm7', label: 'GalmuriMono7', size: 8, family: 'GalmuriMono7-web', weight: 400, stretch: 'normal'},
  ]
  const selectedFont = $derived(galmuris.find((entry) => entry.value === selectedFontValue) ?? galmuris[1])
  const fontSize = $derived(selectedFont.size)
  let previewFontSize = $state(24)
  let previewLineHeight = $state(1)
  let previewFontWeight = $state(400)
  let previewOpticalSize = $state(14)
  let automaticOpticalSizing = $state(true)
  const previewFontSizeMax = $derived(fontSize * 8)
  $effect(() => {
    previewFontSize = fontSize * 2
  })

  const fontProps = $derived.by(() => {
    if (font === 'astr') {
      return {family: 'Astr', weight: previewFontWeight, stretch: 'normal'}
    }
    if (font === 'maruminya') {
      return {family: 'x12y12pxMaruMinyaHangul-web', weight: 400, stretch: 'normal'}
    }
    if (font === 'denkichip') {
      return {family: 'x10y12pxDenkiChipHangul-web', weight: 400, stretch: 'normal'}
    }
    return {family: selectedFont.family, weight: selectedFont.weight, stretch: selectedFont.stretch}
  })
  const testerStyle = $derived(
    [
      `font-size: ${previewFontSize}px`,
      `line-height: ${previewLineHeight}`,
      `font-family: ${fontProps.family}`,
      `font-weight: ${fontProps.weight}`,
      `font-stretch: ${fontProps.stretch}`,
      'font-feature-settings: normal',
      ...(font === 'astr'
        ? [
            `font-optical-sizing: ${automaticOpticalSizing ? 'auto' : 'none'}`,
            ...(automaticOpticalSizing ? [] : [`font-variation-settings: 'opsz' ${previewOpticalSize}`]),
          ]
        : []),
    ].join('; '),
  )

  const triggerContent = $derived(selectedFont.label)

  function pickRandom<T>(items: readonly T[], previous?: T): T {
    if (items.length === 1) return items[0]
    let item: T
    do item = items[Math.floor(Math.random() * items.length)]
    while (item === previous)
    return item
  }

  let exampleText = $state('')

  const pangramEn = [
    'The quick brown fox jumps over the lazy dog',
    'Glib jocks quiz nymph to vex dwarf',
    'How quickly daft jumping zebras vex',
    'Waltz, bad nymph, for quick jigs vex',
    'Sphinx of black quartz, judge my vow',
    'The five boxing wizards jump quickly',
    'Jackdaws love my big sphinx of quartz',
    'Pack my box with five dozen liquor jugs',
    'Go, lazy fat vixen; be shrewd, jump quick',
    'When zombies arrive, quickly fax Judge Pat',
    'Amazingly few discotheques provide jukeboxes',
    'Puzzled women bequeath jerks very exotic gifts',
    'The quick onyx goblin jumps over the lazy dwarf',
    'Brawny gods just flocked up to quiz and vex him',
    'Watch “Jeopardy!”, Alex Trebek’s fun TV quiz game',
    'My faxed joke won a pager in the cable TV quiz show',
    'Six big devils from Japan quickly forgot how to waltz',
    'Five or six big jet planes zoomed quickly by the tower',
    'Lorem ipsum dolor sit amet,\nconsectetur adipiscing elit',
    'Jack amazed a few girls\nby dropping the antique onyx vase',
    'Grumpy wizards make toxic brew\nfor the evil Queen and Jack',
    'A quick movement of the enemy\nwill jeopardize six gunboats',
    'Jaded zombies acted quaintly\nbut kept driving their oxen forward',

    'Tie my tongue or love instead?',
    'My heart beats a rhythm just for you',
    'Hold your breath now\nIt’s all a simulation',
    'I wish that I could fall a little bit harder',
    'Beneath the virtual sky\nI can hear you call',
    'So let the Anthropocene watch me going fucking crazy',
    'Don’t you find it all romantic,\nthe way things used to be?',

    'Thank you sex',
    'No event, good life!',
    'If you want to be happy, be',
    'For I just threw out the love of my dreams',
    'But the moon’s not burning through my skin tonight',
    'I wanna be an ordinary man,\nnot just an ego caught inside a trend',
    'This way is a waterslide away from me\nthat takes you further every day',
  ]

  const pangramKo = [
    // 팬그램
    '다람쥐 헌 쳇바퀴에 타고파',
    '동녘 구름 틈새로 퍼지는 햇빛',
    '찦차를 타고 온 펲시맨과 쑛다리 똠방각하',
    '그는 미쳐서 칼부림하는 인성파탄자일 뿐이다',
    '추운 겨울에는 따뜻한 커피와 티를 마셔야지요',
    '정 참판 양반댁 규수 큰 교자 타고 혼례 치른 날',
    '꽃을 잘 키우려면 수분과 윤기 먹은 토양이 필요하다',
    '덧글은 통신 예절 지키면서 표현 자유 추구하는 방향으로',
    '컴퓨터 출판물의 양이 늘면\n타입킷의 활용도 많아지게 된다',
    '참나무 타는 소리와 야경만큼\n밤의 여유를 표현해 주는 것도 없다',
    '콩고물과 우유가 들어간 빙수는\n차게 먹어야 특별한 맛이 잘 표현된다',
    '키스의 고유 조건은 입술끼리 만나야 하고\n특별한 기술은 필요치 않다',
    // 조선말 큰사전
    '말은 사람의 특징이요, 겨레의 보람이요, 문화의 표상이다',

    // 더백혼
    '인간관계, 투명거미집\n헬리콥터 소리로 세계는 파멸',
    '계속 뒤로 미뤄왔던 작은 일들이 쌓여서\n눈사태를 일으켜 홀로 생매장당해',
    // 삼보마스터
    '세상은 그것을 사랑이라고 부른다',
    // 이스턴유스
    '울고 싶은 순간에 눈물은 나오는가',
    '더러운 안경이 푸르게 물들면 발을 울리며 나도 웃으리라',
    '아직 산 채로 끝나지 않은 이 몸이라면\n죄도 악도 나와 더불어 있으니',
    // 코크로치
    '물러난 백색충은 산탄총에 흩날리고\n푸른 하늘을 꿈꾸며 피아노 선이 되었네',
    '오늘 밤은 연회, 붉은 고기를 먹는다\n우리를 업신여긴 그 자식의 고기를 먹는다',
    // 오모리세이코
    '한 번뿐인 인생이니까 좋은 추억을 만들자',
    '강은 바다로 넓어지고 사람은 죽음으로 넘치네',
    '네가 좋아하는 일이 바로 너만이 할 수 있는 일이야',
    '그 한 번의 실수로 모든 것을 부정당해도 기죽지 마',
    '기적은 손수 만드는 것이고 모든 것은 땅으로 이어진다',
    '새벽녘의 기억은 흐릿하고\n집에 돌아가기 위해 살아 있는 몸',
    '사랑해 달란 말을 하지 않는 이유는\n아침해가 눈부셔서, 그저 그것뿐',
    '내 꿈은 네가 걷어찬 못생기고 너덜너덜한 삶을\n주워모아서 커다란 거울을 만드는 것',
    // 팝시나나이데
    '아름답게 살고 싶을 뿐',
    '우리는 역시 지리멸렬히 사랑하고 사랑받지 않겠는가',
    '사막에서 걷는 법을 알려줘\n신발에 모래가 들어가서 발을 델 것 같아',
    '옥상 끝에서 난간을 잡고 하늘을 올려다봐\n아래를 내려다보면 빨려 들어가 내딛고 싶어지니까',
    '잘 생각해보면 그래, 저 애들한테도 생활이 있고\n분명 즐겁지만은 않은 인생 위를 걷고 있겠지',
    // 와스레란네요
    '하늘을 올려다봐도 하늘밖에 없다',
    '여태껏 우리의 음악을 깔봐 온 그 자식을\n음악의 힘으로 뛰어넘고 싶어',
    '난 더러워진 티셔츠인데 또 너는 내 신경을 쓴다고\n빙글빙글 돌리는 게 불쌍하다며 세탁기에 넣질 않아',
    // 수중그것은괴롭다
    '신께서는 이 세상을 엿새만에 만드시고\n이레째에 마술을 했다고 한다',
    // 시소애니
    '너희처럼 살고 싶지 않다며 소설가를 믿은 채\n열여덟살의 사상을 모두 꽃으로 만들었네',
    // 쿠하쿠곳코
    '한 번 눈을 감고 점점 낙담하던 내가\n앞에서는 웃고 있어',
    // 유유시키
    '흔해빠진 말로도 다정함이 오고가서\n절묘한 곳으로 만들어 주네',
    // 로열갸루
    '그 순수한 마음만이 부러워',
    // 가쿠마스
    '안심해, 나는 돌아가지 않아, 봐',

    '승리를 위하여 이글스여 함성을 외쳐라',
    '언젠가 그가 너를 맘 아프게 해\n너 혼자 울고 있는 걸 봤어',
    '사랑도 명예도 이름도 남김없이\n한평생 나가자던 뜨거운 맹세',
    '내 조그만 공간 속에 추억만 쌓이고\n까닭 모를 눈물만이 아른거리네',
    '그러니 우리 우연히라도\n그때의 맘 그날의 밤 떠오르게 만들지는 마요',
    '오 때론 난 망가져 갈지도 모르지\n허나 젊음엔 그건 중요한 게 아니야',

    '뭉탱이로 있다가 유링게숭 아니 그냥',
    '맛스타 해외승인 직불출금 십이만천육백팔십칠원',
    '마즈피플 코스프레 나도 이제 할 수 있다\n(너도 할 수 있다)',
    '마즈피플 지구인들과 친해지고 싶다\n지구의 피자와 햄버거가 그렇게 맛있다던데',
    '자기가 잘 못해서 죽어놓고 게임 탓하고 있으면\n누가 그걸 보고 좋아하겠어요',
  ]

  const pangramJa = [
    // 더백혼
    '人間関係　とうめいくもの巣\nヘリコプターの音で世界は破滅',
    'ずっと後回しにしてきたちっぽけな事が重なって\n雪崩を起こして生き埋めさ　独りぼっちで',
    // 삼보마스터
    '世界はそれを愛と呼ぶんだぜ',
    // 이스턴유스
    '泣きたい瞬間に涙は出るか',
    // 코크로치
    // 오모리세이코
    '奇跡は手作り　全ては地続き',
    '川は海へとひろがる　人は死へと溢れる',
    '君の好きなことが君にしかできないことだよ',
    'そのひとつのミスで全てを否定されても怯むな',
    // 팝시나나이데
    '美しく生きていたいだけ',
    '僕らはやっぱり支離滅裂に愛し愛されようじゃないか',
    '屋上の縁から柵を持って空を見上げる\n下を見れば吸い込まれて踏み出したくなるから',
    'よく考えればそうだな　あの子たちにも生活があって\nきっと楽しいだけではない人生の上を歩いているんだ',
    // 와스레란네요
    '空を見上げても空しかねえよ',
    'ねえ僕は汚れたTシャツさ　なのに君はまた僕を気遣って\nぐるぐる回すのがかわいそうだからって洗濯機に入れない',
    // 수중그것은괴롭다
    '神さまはこの世界を六日間で作り上げ\n七日目に手品をしたという',
    // 시소애니
    // 쿠하쿠곳코
    // 유유시키
    'ありふれた言葉でさえ優しさ行き交って\n絶妙な居場所にしてくれるね',
    // 로열갸루
    'そのピュアな心だけが羨ましい',
    // 가쿠마스
    '安心して, 僕は帰らない, ほらね',

    '愛も名誉も名前も残さず\n一生進んで行こうという熱い誓',
    '言葉は人の特徴であり、民族の誇りであり、文化の表象である',
    'だから僕たち　偶然にでも\nあの時の気持ち　あの日の夜を思い出させないで',
    '僕の小さな空間の中に思い出だけがつまって\nわけもなく涙だけが目に浮かぶよ',
  ]

  let prevEn: string | undefined
  let prevKo: string | undefined
  let prevJa: string | undefined

  function shuffle() {
    const en = pickRandom(pangramEn, prevEn)
    const ko = pickRandom(pangramKo, prevKo)
    prevEn = en
    prevKo = ko

    if (font === 'astr') {
      exampleText = [en, ko].join('\n')
      return
    }

    const ja = pickRandom(pangramJa, prevJa)
    prevJa = ja
    exampleText = [en, ko, ja].join('\n')
  }

  shuffle()
</script>

<div class="grid w-full gap-1">
  <div class="-my-1.5 flex">
    <Label for="tester">사용해 보기</Label>
    <Button variant="ghost" size="icon-sm" onclick={shuffle} aria-label="무작위 예문 표시">
      <Shuffle />
    </Button>
    {#if font === 'galmuri'}
      <Select.Root type="single" name="favoriteFruit" bind:value={selectedFontValue}>
        <Select.Trigger size="sm">
          {triggerContent}
        </Select.Trigger>
        <Select.Content>
          <Select.Group>
            {#each galmuris as font (font.value)}
              <Select.Item value={font.value} label={font.label}>
                {font.label}
              </Select.Item>
            {/each}
          </Select.Group>
        </Select.Content>
      </Select.Root>
    {/if}
  </div>
  <div class="flex items-center gap-1.5 tabular-nums print:hidden">
    <Label for="font-size" class="gap-1 text-muted-foreground">
      <ALargeSmallIcon class="size-4" />
      {previewFontSize}px
    </Label>
    <Slider
      id="font-size"
      type="single"
      bind:value={previewFontSize}
      min={fontSize}
      max={previewFontSizeMax}
      step={font === 'astr' ? 1 : fontSize}
    />
  </div>
  <div class="flex items-center gap-1.5 tabular-nums print:hidden">
    <Label for="line-height" class="gap-1 text-muted-foreground">
      <ListChevronsUpDownIcon class="size-4" />
      {Math.round(previewLineHeight * 100)}%
    </Label>
    <Slider id="line-height" type="single" bind:value={previewLineHeight} min={1} max={2} step={0.01} />
  </div>
  {#if font === 'astr'}
    <div class="flex items-center gap-1.5 tabular-nums print:hidden">
      <Label for="font-weight" class="gap-1 text-muted-foreground">
        <span class="font-mono text-xs font-semibold">wght</span>
        {previewFontWeight}
      </Label>
      <Slider id="font-weight" type="single" bind:value={previewFontWeight} min={200} max={600} step={1} />
    </div>
    <div class="flex items-center gap-1.5 tabular-nums print:hidden">
      <Label for="optical-size" class="gap-1 text-muted-foreground">
        <span class="font-mono text-xs font-semibold">opsz</span>
        {automaticOpticalSizing ? 'auto' : previewOpticalSize}
      </Label>
      <Slider
        id="optical-size"
        type="single"
        bind:value={previewOpticalSize}
        min={14}
        max={32}
        step={1}
        disabled={automaticOpticalSizing}
      />
    </div>
    <div class="flex items-center gap-2 print:hidden">
      <Checkbox id="automatic-optical-sizing" bind:checked={automaticOpticalSizing} />
      <Label for="automatic-optical-sizing" class="cursor-pointer text-muted-foreground">opsz 자동 조절</Label>
    </div>
  {/if}
  <Textarea
    id="tester"
    class="mt-1 pt-[calc(1em/12*4)] pr-[calc(1em/12*3)] pb-[calc(1em/12*3)] pl-[calc(1em/12*4)]"
    style={testerStyle}
    spellcheck="false"
    bind:value={exampleText}
  />
</div>

<style>
  @font-face {
    font-family: x12y12pxMaruMinyaHangul-web;
    font-style: normal;
    font-weight: 400;
    font-display: block;
    src: url('/fonts/x12y12pxMaruMinyaHangul.woff2') format('woff2');
  }
  @font-face {
    font-family: x10y12pxDenkiChipHangul-web;
    font-style: normal;
    font-weight: 400;
    font-display: block;
    src: url('/fonts/x10y12pxDenkiChipHangul.woff2') format('woff2');
  }
  @font-face {
    font-family: Galmuri14-web;
    font-style: normal;
    font-stretch: normal;
    font-weight: 400;
    font-display: block;
    src: url('/fonts/galmuri/Galmuri14.woff2') format('woff2');
  }
  @font-face {
    font-family: Galmuri11-web;
    font-style: normal;
    font-stretch: normal;
    font-weight: 400;
    font-display: block;
    src: url('/fonts/galmuri/Galmuri11.woff2') format('woff2');
  }
  @font-face {
    font-family: Galmuri11-web;
    font-style: normal;
    font-stretch: normal;
    font-weight: 700;
    font-display: block;
    src: url('/fonts/galmuri/Galmuri11-Bold.woff2') format('woff2');
  }
  @font-face {
    font-family: Galmuri11-web;
    font-style: normal;
    font-stretch: condensed;
    font-weight: 400;
    font-display: block;
    src: url('/fonts/galmuri/Galmuri11-Condensed.woff2') format('woff2');
  }
  @font-face {
    font-family: Galmuri9-web;
    font-style: normal;
    font-stretch: normal;
    font-weight: 400;
    font-display: block;
    src: url('/fonts/galmuri/Galmuri9.woff2') format('woff2');
  }
  @font-face {
    font-family: Galmuri7-web;
    font-style: normal;
    font-stretch: normal;
    font-weight: 400;
    font-display: block;
    src: url('/fonts/galmuri/Galmuri7.woff2') format('woff2');
  }
  @font-face {
    font-family: GalmuriMono11-web;
    font-style: normal;
    font-stretch: normal;
    font-weight: 400;
    font-display: block;
    src: url('/fonts/galmuri/GalmuriMono11.woff2') format('woff2');
  }
  @font-face {
    font-family: GalmuriMono9-web;
    font-style: normal;
    font-stretch: normal;
    font-weight: 400;
    font-display: block;
    src: url('/fonts/galmuri/GalmuriMono9.woff2') format('woff2');
  }
  @font-face {
    font-family: GalmuriMono7-web;
    font-style: normal;
    font-stretch: normal;
    font-weight: 400;
    font-display: block;
    src: url('/fonts/galmuri/GalmuriMono7.woff2') format('woff2');
  }
</style>
