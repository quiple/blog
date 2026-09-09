# 가사 작성

`src/posts/lyric/{슬러그}.yaml` 파일 하나를 추가하면 `/lyric/{슬러그}`에 표시됩니다. `.yml`도 사용할 수 있습니다. 같은 슬러그의 파일을 중복해서 만들지 마세요.

가장 간단한 형태:

```yaml
lines:
  - 첫 번째 가사
  - 두 번째 가사
```

메타데이터는 **모두 선택 사항**입니다. 제목을 생략하면 파일명을 사용합니다. 음악 ID가 없어도 가사를 읽을 수 있습니다.

```yaml
title: 곡 제목
titleTranslation: 한국어 제목
titleLang: ja
artist: togenashi-togeari
lang: ja
youtube:
  mv: oT-G1wS-57c
  audio: oT-G1wS-57c
appleMusic: 1502503864
spotify: 0123456789ABCDEFGHIJKL
# 각 ID는 실제 원하는 영상·곡 ID로 교체하세요.
offsets:
  youtubeMV: 3
  youtubeAudio: 0

lines:
  - text: 첫 번째 가사
    time: [1.501, 6.125]
    translation: 한국어 번역
    pronunciation: cheot beonjjae gasa
  - text: 다른 목소리
    time: [5, 10]
    duet: true
    background: 함께
  - 타이밍 없이 읽을 가사
```

- `time: [시작, 종료]`는 **초 단위 소수점 셋째 자리(0.001초)**까지 사용할 수 있습니다. 예를 들어 `12.345`는 12초 345밀리초입니다. AMLL에는 정수 밀리초로 전달합니다. 모든 시간은 곡 시작 기준의 절대 시간입니다.
- `offsets`도 초 단위입니다. `youtubeMV: 3`이면 뮤비 3초가 가사 0초입니다. `youtubeMV`, `youtubeAudio`, `appleMusic`, `spotify`를 각각 생략하거나 지정할 수 있습니다.
- 음악 서비스에는 전체 URL 대신 고유 ID만 입력합니다. YouTube는 동영상 ID 11자, Spotify는 트랙 ID 22자입니다. Spotify의 `spotify:track:` 접두사도 제외합니다.
- Apple Music은 **곡 ID**를 입력합니다. `/song/123456` 링크라면 마지막 숫자, `/album/…/앨범ID?i=곡ID` 링크라면 `i=` 뒤의 숫자입니다. 숫자 또는 따옴표로 감싼 문자열 모두 지원하며, 한국 스토어의 곡 링크와 임베드 주소를 자동 생성합니다.
- YouTube `mv`와 `audio`는 독립적입니다. 하나만 있어도 되고 둘 다 없어도 됩니다. 있는 소스만 선택 버튼에 표시됩니다.
- `duet: true`인 줄은 오른쪽에 표시됩니다. 여러 목소리의 시간 범위는 겹칠 수 있습니다. 줄은 시작 시간 순서로 작성하세요.
- `background`는 해당 줄의 배경 보컬입니다. 문자열로 쓰면 본 가사의 시간을 따릅니다. 별도 시간이 필요하면 아래처럼 객체로 씁니다.
- `translation`은 번역, `pronunciation`은 발음입니다. 둘 다 생략할 수 있습니다.
- 시간이 없는 줄은 동기화 보기 아래에, 전체 보기에서는 원래 순서에 표시됩니다.

## 제목과 아티스트

제목의 언어는 `titleLang`을 사용하며 생략하면 곡의 `lang`을 따릅니다. 한국어 제목은 `titleTranslation`에 입력합니다. 플레이어 아래에 제목, 한국어 제목, 아티스트 순서로 표시합니다.

아티스트 정보는 `src/posts/artist/{슬러그}.yaml`에 작성합니다. 예를 들어 `togenashi-togeari.yaml`:

```yaml
name: トゲナシトゲアリ
lang: ja
translation: 토게나시 토게아리
```

곡에서 `artist: togenashi-togeari` 또는 `artist: [togenashi-togeari, another-artist]`처럼 참조합니다. 각 슬러그의 아티스트 파일을 먼저 추가하세요. 원명·번역명으로 검색하는 호환 처리는 없으며, 등록되지 않은 슬러그는 오류로 처리됩니다. 가사 페이지에서는 한국어 번역명만 표시하며, 번역명이 없으면 원명을 표시합니다. 이름을 누르면 `/artist/{슬러그}`로 이동하여 원명, 번역명, 곡 목록을 볼 수 있습니다.

YouTube 음원 임베드는 정사각형, 뮤비는 16:9입니다. 동기화 가사는 별도 스크롤 영역 없이 문서 전체에 펼쳐지며 재생 중인 줄을 따라 페이지가 스크롤됩니다. 직접 휠·터치·키보드로 스크롤하면 5초 동안 자동 따라가기를 멈춥니다.

## 단어별 타이밍·루비·배경 보컬

```yaml
lines:
  - words:
      - text: 光
        time: [12, 14]
        ruby: ひかり
        pronunciation: hikari
      - text: ' の中へ'
        time: [14, 18]
        pronunciation: no naka e
    translation: 빛 속으로
    background:
      text: 함께 가자
      time: [16, 19]
      translation: 함께 가자
      pronunciation: hamkke gaja
```

`words`가 있으면 줄의 `text`와 `time`은 자동으로 계산됩니다. 줄의 `time`을 직접 지정할 수도 있습니다. 단어의 `time`을 생략하면 줄의 시간을 따릅니다. 단어 사이 공백은 `text`에 직접 넣고, 앞뒤 공백이 필요할 때는 따옴표로 감싸세요. 본 가사와 배경 보컬 모두 같은 `words`, 번역, 발음 기능을 지원합니다.

루비 음절마다 시간을 지정하려면:

```yaml
ruby:
  - text: ひ
    time: [12, 12.5]
  - text: かり
    time: [12.5, 14]
```

루비 시간은 해당 단어의 시간 범위 안에 있어야 합니다. 루비 음절 시간을 생략하면 단어 시간을 따릅니다. 단어의 `obscene: true`는 AMLL 비속어 표시 플래그이고, `emptyBeat: 2` 같은 빈 박자 수는 데이터로 전달됩니다. 빈 박자는 편집용 정보이므로 별도 화면 효과가 없습니다.

## 여러 언어

번역은 한국어만 표시합니다. `translation: 한국어 번역`처럼 문자열로 쓰거나 `translation: {ko: 한국어 번역}`으로 씁니다. 기존 다른 언어 데이터를 보존해도 `ko`가 없으면 화면에는 번역이 표시되지 않습니다. 문자열 번역에 `translationLang: en`처럼 한국어가 아닌 언어가 명시되어 있어도 표시하지 않습니다. 발음은 여러 언어가 있으면 선택 메뉴가 나타납니다.

```yaml
translation:
  ko: 빛 속으로
  en: Into the light
pronunciation:
  ko: 히카리 에
  ja-Latn: hikari e
```

원문의 `lang`은 원문 줄에만 적용하며 번역 줄에는 `lang="ko"`를 적용합니다. 발음의 언어는 언어별 데이터 또는 메타데이터의 `pronunciationLang: ja-Latn`으로 지정합니다. 전체 보기에도 동일하게 적용됩니다.

단어의 `pronunciation`과 배경 보컬에도 같은 방식을 사용할 수 있습니다. AMLL이 지원하는 줄·단어 타이밍, 듀엣, 배경 보컬, 번역, 줄·단어 발음, 타이밍이 있는 루비를 연결합니다. TTML XML의 레이아웃·스타일 속성을 재현하는 형식은 아닙니다.

## 소스별 시간 보정과 수동 전환

`offsets.youtubeMV: 2.125`는 뮤비 2.125초가 가사 0초라는 뜻입니다. 음수가 될 수도 있습니다. 소스별 보정값을 지정하면 전체 가사의 타이밍을 수정할 필요가 없습니다.

소스는 각각 독립적으로 재생되며 종료해도 다른 소스로 넘어가지 않습니다. 소스 버튼을 직접 누르면 보정값을 적용해 같은 가사 위치와 재생·일시정지 상태를 유지합니다. 대상 소스의 길이를 넘는 위치에서 전환할 때는 버튼에 ‘처음부터’가 표시되며 해당 소스를 처음부터 재생합니다. 현재 소스 범위를 벗어나는 가사는 전체 보기에서 읽을 수 있지만 눌러도 다른 소스로 이동하지 않습니다.

## 재생 연동

YouTube는 IFrame API, Spotify는 iFrame API의 `playback_update`로 동기화합니다. Spotify는 계정·지역·곡에 따라 미리듣기와 시간 전달 동작이 달라질 수 있습니다. Apple Music 일반 임베드에는 공개된 시간 연동 API가 없어 전체 가사 보기로 표시합니다. Apple Music 자동 동기화에는 별도 MusicKit 플레이어와 인증 구성이 필요합니다.

YouTube 뮤비↔음원 전환은 소스별 보정값을 적용해 같은 가사 위치와 재생·일시정지 상태를 유지합니다. 다른 서비스로 전환하면 새 플레이어를 정지 상태로 불러옵니다. 화면 밖·백그라운드에서는 AMLL 프레임 루프를 멈추고 페이지 이동 시 플레이어·관찰자·타이머를 정리합니다. YAML 파싱과 유효성 검사는 서버에서만 실행합니다.

예시의 `example: true`는 검색 엔진 `noindex` 설정입니다. 예시 안내는 YAML 주석에만 있으며, 실제 가사를 넣으면 이 속성을 제거하세요. AMLL core는 AGPL-3.0-only 라이선스입니다.

- [AMLL 가사 기능](https://amll.dev/en/guides/lyric/ttml)
- [YouTube IFrame API](https://developers.google.com/youtube/iframe_api_reference)
- [Spotify iFrame API](https://developer.spotify.com/documentation/embeds/references/iframe-api)

## 명령어로 가사 가져오기

프로젝트 루트에서 실행합니다. Node.js 22.18 이상 또는 현재 프로젝트의 Node.js 26을 사용하세요.

```sh
# YouTube 동영상 ID: AMLL 가사와 제공되는 자막 중 선택
nub run import -y YDLafQ-Rg-k --slug wrong-world-new --artist togenashi-togeari

# Apple Music / Spotify ID: 공식 AMLL DB의 대응 가사 가져오기
nub run import -a 1737842246 --slug wrong-world-new
nub run import -s 0tNSVPZeJjpNH7Q9VqrbyJ --slug wrong-world-new

# AMLL DB 검색 / 파일명 / 다운로드 링크 / 로컬 TTML
nub run import --search '雑踏、僕らの街' --slug wrong-world-new
nub run import --amll 1779284741800-68000793-I1W5DuF4.ttml --slug wrong-world-new
nub run import --amll 'https://amlldb.bikonoo.com/raw-lyrics/1779284741800-68000793-I1W5DuF4.ttml' --slug wrong-world-new
nub run import --file ./lyrics.ttml --slug music-title
```

`node import.ts …`로도 실행할 수 있습니다. `nubx import.ts`는 패키지 실행용 명령이어서 로컬 TypeScript 파일을 찾지 못하므로 위 명령을 사용하세요.

후보가 여러 개면 **↑/↓ 방향키로 이동하고 Enter로 선택**합니다. Esc 또는 Ctrl+C로 취소할 수 있습니다. 비대화형 실행에서는 `--select 2`처럼 후보 번호(1부터)를 지정하세요. 후보가 여러 개인데 번호를 지정하지 않으면 목록을 출력하고 파일을 만들지 않습니다.

결과는 `src/posts/lyric/{슬러그}.yaml`에 저장됩니다. 맨 위 주석에는 원본 출처 URL 또는 로컬 경로, TTML 기여자(제공된 경우), 선택한 자막 종류·언어, 가져온 시각이 기록됩니다. 기존 파일은 덮어쓰지 않습니다. `--stdout`은 파일 생성 없이 결과를 출력하고 `--out-dir 경로`는 출력 폴더를 지정합니다. 슬러그는 제목의 영문·숫자 또는 서비스 ID로 기본 생성되며, `--slug`로 직접 정할 수 있습니다.

- `--artist`에는 이미 등록된 아티스트 슬러그를 입력합니다. 여러 번 지정하면 배열로 저장합니다. 원본의 아티스트명을 임의로 슬러그로 바꾸거나 아티스트 파일을 자동 생성하지 않습니다.
- `--title`, `--lang`으로 제목과 원문 언어를 지정할 수 있습니다. YouTube는 기본 `youtube.mv`에 저장하며 `--audio`를 붙이면 `youtube.audio`에 저장합니다.
- YouTube에는 별도로 **yt-dlp**가 필요합니다(macOS: `brew install yt-dlp`). 미디어는 다운로드하지 않고 메타데이터와 선택한 자막만 가져옵니다. 기본 후보는 등록 자막이며 `--auto`를 붙이면 자동 생성 자막도 표시합니다. 자동 자막은 노래 가사와 다를 수 있습니다.
- YouTube 자막은 제공된 행별 타이밍을 사용하며 단어별 타이밍을 임의 생성하지 않습니다. TTML은 단어·루비 타이밍, 번역·발음, 듀엣·배경 보컬을 YAML로 변환합니다. 타이밍은 0.001초 단위로 유지합니다.
- Apple Music·Spotify는 **해당 서비스에서 비공개 가사를 추출하는 기능이 아닙니다**. 입력한 곡 ID에 연결된 공식 AMLL DB 가사를 검색합니다. DB에 없는 곡은 `--search`, `--file` 또는 직접 다운로드한 TTML을 사용하세요. 로그인 쿠키나 토큰을 요구하지 않습니다.
- AMLL에서 가져온 타이밍과 YouTube 뮤비의 편집 시점은 다를 수 있으므로 `offsets`를 확인하세요. 출처의 언어별 번역은 보존되며, 사이트에서는 기존 규칙대로 한국어만 표시합니다.

관련 명세: [AMLL HTTP API](https://amll.dev/reference/http-api/native), [AMLL DB](https://github.com/amll-dev/amll-ttml-db), [yt-dlp 자막 옵션](https://github.com/yt-dlp/yt-dlp#subtitle-options).
