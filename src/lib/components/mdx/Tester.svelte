<script lang="ts">
  import {Label} from '$lib/components/ui/label/index.js'
  import {Slider} from '$lib/components/ui/slider/index.js'
  import {Textarea} from '$lib/components/ui/textarea/index.js'

  let fontSize = $state(24)

  function pickRandom<T>(set: Set<T>): T {
    const arr = [...set]
    return arr[Math.floor(Math.random() * arr.length)]
  }

  let exampleText = $state('')

  const pangramEn = new Set([
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
    'I wish that I could fall a little bit harder',
    'So let the Anthropocene watch me going fucking crazy',
    'Don’t you find it all romantic,\nthe way things used to be?',
    'Thank you sex',
    'But the moon’s not burning through my skin tonight',
    'I wanna be an ordinary man,\nnot just an ego caught inside a trend',
    'For I just threw out the love of my dreams',
    'This way is a waterslide away from me\nthat takes her further every day',
  ])

  const pangramKo = new Set([
    // 팬그램
    '다람쥐 헌 쳇바퀴에 타고파',
    '동녘 구름 틈새로 퍼지는 햇빛',
    '그는 미쳐서 칼부림하는 인성파탄자일 뿐이다',
    '추운 겨울에는 따뜻한 커피와 티를 마셔야지요',
    '정 참판 양반댁 규수 큰 교자 타고 혼례 치른 날',
    '꽃을 잘 키우려면 수분과 윤기 먹은 토양이 필요하다',
    '덧글은 통신 예절 지키면서 표현 자유 추구하는 방향으로',
    '컴퓨터 출판물의 양이 늘면\n타입킷의 활용도 많아지게 된다',
    '참나무 타는 소리와 야경만큼\n밤의 여유를 표현해 주는 것도 없다',
    '키스의 고유 조건은 입술끼리 만나야 하고\n특별한 기술은 필요치 않다',
    '콩고물과 우유가 들어간 빙수는\n차게 먹어야 특별한 맛이 잘 표현된다',

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
    '여태껏 우리의 음악을 깔봐온 그 자식을\n음악의 힘으로 뛰어넘고 싶어',
    '난 더러워진 티셔츠인데 또 너는 내 신경을 쓴다고\n빙글빙글 돌리는 게 불쌍하다며 세탁기에 넣질 않아',
    // 수중그것은괴롭다
    '신께서는 이 세상을 엿새만에 만드시고\n이레째에 마술을 했다고 한다',
    // 시소애니
    '너희처럼 살고 싶지 않다며 소설가를 믿은 채\n열여덟살의 사상을 모두 꽃으로 만들었네',
    // 쿠하쿠곳코
    '한 번 눈을 감고 점점 낙담해 간 내가\n저 앞에서는 웃고 있어',
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
  ])

  const pangramJa = new Set([
    // 더백혼
    '人間関係　とうめいくもの巣\nヘリコプターの音で世界は破滅',
    'ずっと後回しにしてきたちっぽけな事が重なって\n雪崩を起こして生き埋めさ　独りぼっちで',
    // 삼보마스터
    '世界はそれを愛と呼ぶんだぜ',
    // 이스턴유스
    '泣きたい瞬間に涙は出るか',
    // 코크로치
    // 오모리세이코
    '君の好きなことが君にしかできないことだよ',
    // 팝시나나이데
    '美しく生きていたいだけ',
    '僕らはやっぱり支離滅裂に愛し愛されようじゃないか',
    // 와스레란네요
    '空を見上げても空しかねえよ',
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
  ])

  exampleText = [pickRandom(pangramEn), pickRandom(pangramKo), pickRandom(pangramJa)].join('\n')
</script>

<div class="grid w-full gap-1.5">
  <Label for="tester">사용해 보기</Label>
  <div class="flex gap-1.5 items-center tabular-nums">
    <Label for="font-size" class="text-muted-foreground">{fontSize}px</Label>
    <Slider id="font-size" type="single" bind:value={fontSize} min={12} max={96} step={12} />
  </div>
  <Textarea
    id="tester"
    class="font-['x12y12pxMaruMinyaHangul-web'] leading-none pl-[calc(1em/12*4)] pb-[calc(1em/12*4)] pt-[calc(1em/12*3)] pr-[calc(1em/12*3)]"
    style="font-size: {fontSize}px"
    spellcheck="false"
    bind:value={exampleText}
  />
</div>

<style lang="sass">
  @font-face
    font:
      family: 'x12y12pxMaruMinyaHangul-web'
      style: normal
      weight: 400
      display: block
    src: url('/fonts/x12y12pxMaruMinyaHangul.woff2') format('woff2')
</style>
