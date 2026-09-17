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
- `offsets`도 초 단위입니다. `youtubeMV: 3`이면 뮤비 3초가 가사 0초입니다. `youtubeMV`, `youtubeAudio`, `spotify`를 각각 생략하거나 지정할 수 있습니다.
- 음악 서비스에는 전체 URL 대신 고유 ID만 입력합니다. YouTube는 동영상 ID 11자, Spotify는 트랙 ID 22자입니다. Spotify의 `spotify:track:` 접두사도 제외합니다.
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

번역은 한국어만 표시합니다. `translation: 한국어 번역`처럼 문자열로 쓰거나 `translation: {ko: 한국어 번역}`으로 씁니다. 기존 다른 언어 데이터를 보존해도 `ko`가 없으면 화면에는 번역이 표시되지 않습니다. 문자열 번역은 한국어로 취급하며, 번역 언어 메타데이터는 지정하지 않습니다. 발음은 여러 언어가 있으면 선택 메뉴가 나타납니다.

```yaml
translation:
  ko: 빛 속으로
  en: Into the light
pronunciation:
  ko: 히카리 에
  ja-Latn: hikari e
```

원문의 `lang`은 원문 줄에만 적용하며 번역 줄은 최상위 `html`의 `lang="ko"`를 상속합니다. 발음의 언어는 언어별 데이터 또는 메타데이터의 `pronunciationLang: ja-Latn`으로 지정합니다. 전체 보기에도 동일하게 적용됩니다.

단어의 `pronunciation`과 배경 보컬에도 같은 방식을 사용할 수 있습니다. AMLL이 지원하는 줄·단어 타이밍, 듀엣, 배경 보컬, 번역, 줄·단어 발음, 타이밍이 있는 루비를 연결합니다. TTML XML의 레이아웃·스타일 속성을 재현하는 형식은 아닙니다.

## 소스별 시간 보정과 수동 전환

`offsets.youtubeMV: 2.125`는 뮤비 2.125초가 가사 0초라는 뜻입니다. 음수가 될 수도 있습니다. 소스별 보정값을 지정하면 전체 가사의 타이밍을 수정할 필요가 없습니다.

소스는 각각 독립적으로 재생되며 종료해도 다른 소스로 넘어가지 않습니다. 소스 버튼을 직접 누르면 보정값을 적용해 같은 가사 위치와 재생·일시정지 상태를 유지합니다. 대상 소스의 길이를 넘는 위치에서 전환할 때는 버튼에 ‘처음부터’가 표시되며 해당 소스를 처음부터 재생합니다. 현재 소스 범위를 벗어나는 가사는 전체 보기에서 읽을 수 있지만 눌러도 다른 소스로 이동하지 않습니다.

## 재생 연동

YouTube는 IFrame API, Spotify는 iFrame API의 `playback_update`로 동기화합니다. Spotify는 계정·지역·곡에 따라 미리듣기와 시간 전달 동작이 달라질 수 있습니다.
Spotify의 가사 클릭 탐색은 행의 시작 부분이 잘리지 않도록 정수 초로 내림합니다. API 제약으로 선택한 행의 시작보다 최대 1초 미만 앞에서 재생될 수 있습니다. 0초 탐색은 `seek(0)`이 무시되므로 `restart()`로 처음부터 재생합니다. 가사 데이터와 오프셋의 밀리초 정밀도는 그대로 유지됩니다.

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

# Apple Music / Spotify ID: 해당 서비스에서 직접 가사 가져오기 (.env.local 인증 필요)
nub run import -a 1737842246 --slug wrong-world-new
nub run import -s 0tNSVPZeJjpNH7Q9VqrbyJ --slug wrong-world-new

# AMLL DB 검색 / 파일명 / 다운로드 링크 / 로컬 TTML
nub run import --search '雑踏、僕らの街' --slug wrong-world-new
nub run import --amll 1779284741800-68000793-I1W5DuF4.ttml --slug wrong-world-new
nub run import --amll 'https://amlldb.bikonoo.com/raw-lyrics/1779284741800-68000793-I1W5DuF4.ttml' --slug wrong-world-new
nub run import --file ./lyrics.ttml --slug music-title
```

`node --env-file-if-exists=.env.local import.ts …`로도 실행할 수 있습니다. `nubx import.ts`는 패키지 실행용 명령이어서 로컬 TypeScript 파일을 찾지 못하므로 위 명령을 사용하세요.

후보가 여러 개면 **↑/↓ 방향키로 이동하고 Enter로 선택**합니다. Esc 또는 Ctrl+C로 취소할 수 있습니다. 비대화형 실행에서는 `--select 2`처럼 후보 번호(1부터)를 지정하세요. 후보가 여러 개인데 번호를 지정하지 않으면 목록을 출력하고 파일을 만들지 않습니다.

결과는 `src/posts/lyric/{슬러그}.yaml`에 저장됩니다. 맨 위 주석에는 원본 출처 URL 또는 로컬 경로, TTML 기여자(제공된 경우), 선택한 자막 종류·언어, 가져온 시각이 기록됩니다. 기존 파일은 덮어쓰지 않습니다. `--stdout`은 파일 생성 없이 결과를 출력하고 `--out-dir 경로`는 출력 폴더를 지정합니다. 슬러그는 제목의 영문·숫자 또는 서비스 ID로 기본 생성되며, `--slug`로 직접 정할 수 있습니다.

- `--artist`에는 이미 등록된 아티스트 슬러그를 입력합니다. 여러 번 지정하면 배열로 저장합니다. 원본의 아티스트명을 임의로 슬러그로 바꾸거나 아티스트 파일을 자동 생성하지 않습니다.
- `--title`, `--lang`으로 제목과 원문 언어를 지정할 수 있습니다. 제목 언어(`titleLang`)에는 가사 언어(`lang`)와 같은 값을 저장합니다. YouTube는 기본 `youtube.mv`에 저장하며 `--audio`를 붙이면 `youtube.audio`에 저장합니다.
- YouTube에는 별도로 **yt-dlp**가 필요합니다(macOS: `brew install yt-dlp`). 미디어는 다운로드하지 않고 메타데이터와 선택한 자막만 가져옵니다. 기본 후보는 등록 자막이며 `--auto`를 붙이면 자동 생성 자막도 표시합니다. 자동 자막은 노래 가사와 다를 수 있습니다.
- YouTube 자막은 제공된 행별 타이밍을 사용하며 단어별 타이밍을 임의 생성하지 않습니다. TTML은 단어·루비 타이밍, 번역·발음, 듀엣·배경 보컬을 YAML로 변환합니다. 타이밍은 0.001초 단위로 유지합니다.
- Apple Music·Spotify는 로그인된 웹 플레이어의 비공개 API에 직접 요청합니다. 공식 공개 가사 API가 아니므로 서비스 변경, 구독·지역·곡의 가사 제공 여부에 따라 실패할 수 있습니다. AMLL DB로 자동 대체하지 않습니다. DB 가사는 `--search` 또는 `--amll`로 가져오세요.
- `-a` / `--apple`에는 Apple Music 곡 ID를 입력합니다. `/song/곡ID`의 마지막 숫자 또는 `/album/…/앨범ID?i=곡ID`의 `i` 값을 사용합니다. Apple Music 링크는 YAML 상단 출처 주석에만 기록하며, 재생 제공자로 추가하지 않습니다.
- AMLL에서 가져온 타이밍과 YouTube 뮤비의 편집 시점은 다를 수 있으므로 `offsets`를 확인하세요. 출처의 언어별 번역은 보존되며, 사이트에서는 기존 규칙대로 한국어만 표시합니다.

관련 명세: [AMLL HTTP API](https://amll.dev/reference/http-api/native), [AMLL DB](https://github.com/amll-dev/amll-ttml-db), [yt-dlp 자막 옵션](https://github.com/yt-dlp/yt-dlp#subtitle-options).

### Apple Music·Spotify 인증

`nub run import`는 Git에서 제외된 `.env.local`을 읽습니다. `.env.example`의 빈 항목을 참고해 필요한 서비스의 값만 추가하세요. 토큰은 코드·YAML·명령행 인자에 넣지 않습니다. 이 설정은 로컬 import 전용이며 배포 환경에 설정할 필요가 없습니다.

- **Spotify:** 로그인한 `open.spotify.com`에서 가사를 연 뒤 브라우저 개발자 도구 → Network에서 `color-lyrics` 요청을 찾습니다. Request Headers의 `authorization: Bearer …`에서 토큰 부분을 `SPOTIFY_ACCESS_TOKEN`에 넣으세요. 일반 Spotify 개발자 API용 Client Credentials 토큰과 다릅니다. 만료되면 새 값을 넣어야 합니다.
- **Apple Music:** 로그인한 `music.apple.com`에서 가사를 연 뒤 Network의 `amp-api.music.apple.com` 요청에서 `authorization`의 Bearer 토큰을 `APPLE_MUSIC_TOKEN`, `media-user-token`을 `APPLE_MUSIC_USER_TOKEN`에 넣으세요. 후자는 브라우저의 같은 이름 쿠키에서도 확인할 수 있습니다. `APPLE_MUSIC_STOREFRONT`는 생략하면 계정에서 조회하며, 직접 지정할 경우 `kr`, `us`, `jp`처럼 입력합니다.

Apple Music은 제공된 음절별·행별 TTML을 후보로 표시하므로 여러 개면 기존 방향키 선택창에서 고릅니다. 행별 가사는 `text`로 저장합니다. 타이밍 방식이 명시되지 않은 TTML은 행마다 서로 다른 시간을 가진 여러 조각인지 판별하며, 행 전체를 감싼 단일 조각이나 같은 시간을 공유하는 조각은 `text`로 합칩니다. 루비 등 단어 단위 정보가 있으면 정보 보존을 위해 `words`를 유지합니다. TTML에 포함된 타이밍과 주석 데이터를 기존 변환기로 처리합니다. Spotify는 제공된 행별 타이밍을 사용합니다. 종료 시각이 0/누락이면 다음 큐(빈 행 포함)의 시작 또는 곡 길이로 보완하고 이 사실을 출처 주석에 기록합니다. 비동기화 가사는 시간을 만들지 않습니다. Spotify 곡명과 마지막 행의 종료 시각을 위해 트랙 메타데이터도 요청합니다.

인증값이 없거나 HTTP 401/403이면 저장하지 않고 오류를 표시합니다. 인증된 요청은 리디렉션을 따라가지 않고, 인증값을 출처 주석이나 오류 응답 본문에 기록하지 않습니다. `--stdout`으로 결과를 확인한 뒤 저장할 수 있습니다.

요청 형식 참고: [Apple Music 가사 클라이언트](https://github.com/dropcreations/Manzana-Apple-Music-Lyrics), [Spotify 가사 클라이언트](https://github.com/akashrchandran/spotify-lyrics-api). 외부 클라이언트를 설치하거나 그 코드·인증 토큰 발급기를 포함하지 않습니다.

## 음원 간 오프셋 비교

```sh
nub run diff life-kinda-sucks
nub run diff life-kinda-sucks --reference youtubeMV
nub run diff life-kinda-sucks --seconds 60
nub run diff song-slug --file spotify=/path/to/full-song.flac
```

`yt-dlp`와 `ffmpeg`가 필요합니다(macOS: `brew install yt-dlp ffmpeg`). 등록된 YouTube 오디오를 임시로 내려받아 비교하고 실행이 끝나면 임시 파일을 삭제합니다. Spotify는 전체 스트림을 자동 추출하지 않으며, 해당 서비스 버전의 **처음부터 시작하는 전체 음원**을 `--file 소스=경로`로 지정합니다. 중간부터 시작하는 미리듣기 파일은 전체 음원의 오프셋을 구하는 데 사용할 수 없습니다. 로컬 파일은 YouTube 소스에도 지정할 수 있습니다.

기본 기준은 접근 가능한 소스 중 Spotify → YouTube 뮤비 → YouTube 음원 순서입니다. `--reference youtubeMV` 등으로 바꿀 수 있습니다. 기본적으로 처음 180초를 분석하며 `--seconds`로 6~900초를 지정합니다. 도입 영상 등으로 시작 시점이 크게 다르면, 먼저 추정한 시간 차이로 두 소스가 실제로 겹치는 범위를 찾고 그 안에서 다시 검증합니다. 겹치는 구간의 최소 세 지점에서 차이가 일치해야 출력하며, 곡 중간 편집으로 차이가 달라지면 불일치로 처리합니다. 결과는 분석한 범위에만 해당합니다.

여러 구간의 음량 패턴으로 대응 위치를 찾고 파형 상관도로 시간 차이를 세밀하게 추정합니다. 양수는 대상 소스에서 같은 소리가 기준보다 늦게 나온다는 뜻입니다. 일치 구간이 부족하거나 구간별 차이가 달라지면 시간 차이를 확정하지 않고 짧은 오류를 출력합니다. 다른 믹스·대사·반복 구간 때문에 추정이 실패할 수도 있습니다. 소수점 셋째 자리까지 출력하지만 1ms 정확도를 보장하는 것은 아닙니다.

출력은 기준 소스를 `0.000초 (기준)`으로 두고 각 소스의 상대 시간 차이만 표시합니다. YAML의 기존 `offsets` 값은 계산에 사용하지 않으며 추천값·구간별 분석·진행 메시지는 출력하지 않습니다.

```text
youtubeAudio: 0.000초 (기준)
youtubeMV: -0.333초
```

YAML은 수정하지 않습니다. 종료 코드는 성공 `0`, 입력·기준 음원 오류 `1`, 일부 소스 비교 실패·불확실 `2`입니다.

## 한글 발음 자동 추가

```sh
nub run pron anhelo
nub run pron anhelo --dry-run # 저장하지 않고 결과 YAML 보기
nub run pron anhelo --force   # 기존 한글/문자열 발음 덮어쓰기
nub run pron anhelo --lang spa
```

로컬 [Hangulize](https://github.com/hangulize/hangulize) CLI를 사용합니다. 현재 검증한 버전은 0.5.0입니다. Go를 설치한 환경에서 한 번 설치하고 실행 파일 경로를 PATH에 추가하세요.

```sh
go install github.com/hangulize/hangulize/cmd/hangulize@v0.5.0
export PATH="$(go env GOPATH)/bin:$PATH"
```

`HANGULIZE_BIN`으로 실행 파일을 지정할 수도 있습니다. 지정하지 않으면 프로젝트의 `node_modules/.bin/hangulize`, PATH 순서로 찾습니다. 브라우저 번들에는 추가되지 않고, 변환은 로컬에서 수행합니다.

YAML의 `lang`에서 원문 언어를 읽으며 `es`는 `spa`, `pt-BR`은 `por-br`로 변환합니다. 각 행과 배경 보컬에 `pronunciation: 한글 발음`을 추가합니다. `words`는 공백을 포함한 원문을 연결해 행 전체의 발음을 만들며 단어별 타이밍이나 루비를 변경하지 않습니다. 문자열 행/배경 보컬은 `text`를 가진 객체로 바뀝니다. 주석, 원문, 번역, 시간 정보는 보존하지만 YAML 직렬화에 따라 따옴표 등의 서식은 정리될 수 있습니다.

기존 발음은 기본적으로 건너뜁니다. 새 발음은 한글 문자열로 저장하며, `--force`는 기존 발음을 한글 문자열로 교체합니다. 오류가 발생하면 파일을 저장하지 않습니다.

Hangulize는 외래어 표기 규칙에 따른 한글 변환 도구입니다. 실제 가창의 연음·방언·강세를 분석하지 않으므로 교정용 초안으로 사용하세요. 영어는 지원하지 않습니다. 스페인어 지역 태그는 기본 스페인어 규칙을 사용하며, 브라질 포르투갈어는 별도 규칙을 사용합니다.

일본어(`lang: ja`, `--lang jpn`)는 Hangulize 0.5.0의 기본 일본어 규칙에서 **カ행·タ행을 어두에서도 거센소리로 표기하고, ツ를 츠로, 단독 ヴ의 브 표기를 부로 표기**하도록 수정한 규칙을 사용합니다. 예: カ → 카, チ → 치, ツ → 츠, 東京 → 토쿄. ヴァ·ヴィ·ヴェ·ヴォ 같은 결합 표기는 유지합니다. ガ행·ダ행, 촉음·장음 등 나머지 처리는 기존 규칙을 따릅니다. `jpn-ck`는 별개의 명시적 표기법이므로 이 수정이 적용되지 않습니다.

이 일본어 변형은 `scripts/lyrics/japanese`의 작은 Go 실행기로 필요한 기본 규칙만 변경하고, 한자 읽기 분석은 Hangulize를 그대로 사용합니다. 실행할 때 Go가 필요하며 최초 실행은 모듈 다운로드 때문에 인터넷 연결과 시간이 필요합니다. 이후에는 Go 빌드 캐시를 사용합니다. 이미 작성한 발음을 새 규칙으로 바꾸려면 `--force`를 사용하세요.
