# quiple.dev

[quiple.dev](https://quiple.dev)의 SvelteKit 소스 코드입니다. Cloudflare Workers와 R2를 사용합니다.

## 라이선스

Copyright © 2025–2026 Lee Minseo and contributors.

별도 고지가 없는 이 프로젝트의 소프트웨어 소스 코드는 **GNU Affero General Public License version 3 only (`AGPL-3.0-only`)**로 배포합니다. 라이선스 조건에 따라 사용·수정·재배포할 수 있으며, 상품성이나 특정 목적 적합성을 포함한 어떠한 보증도 제공하지 않습니다. 전체 조건은 [LICENSE](LICENSE)를 확인하세요.

가사 플레이어에 사용하는 `@applemusic-like-lyrics/core`와 `@applemusic-like-lyrics/ttml`도 AGPL-3.0-only입니다. 이 저장소에는 AMLL을 앱의 전체 페이지 스크롤, 언어 표시 및 재생 상태와 연결하는 수정·확장 코드가 포함됩니다. 수정 이력은 Git 커밋으로 기록합니다.

- **코드:** Svelte/TypeScript/JavaScript, 스타일, 실행·빌드 스크립트 및 관련 설정에는 위 라이선스가 적용됩니다. 게시물 안에 포함되어도 프로그램의 일부인 실행 코드는 이에 포함됩니다.
- **콘텐츠:** 글, 가사와 그 번역, 이미지, 오디오 및 영상 등 독립적인 콘텐츠는 위 코드 라이선스로 이용을 허락하는 대상이 아닙니다. 별도 고지가 없다면 각 권리자에게 권리가 유보됩니다. 저장소 공개나 출처 표시는 콘텐츠 재사용 허락을 의미하지 않습니다.
- **제3자 자료:** 패키지, 폰트/BDF, 아이콘 등에는 각 원저작자의 라이선스와 고지가 적용됩니다. [패키지 고지](THIRD_PARTY_NOTICES.md)는 npm 의존성에 한정되며, 저장소의 다른 자료에 대한 권리 검토를 대신하지 않습니다. 브랜드명·로고의 상표권도 별개입니다.

## 소스 코드 제공

공개 소스: <https://github.com/quiple/blog>

사이트 하단의 **소스 코드 · AGPL-3.0** 링크에서도 접근할 수 있습니다. 수정한 앱을 배포하거나 네트워크로 제공할 때는 AGPL 조건에 맞춰 해당 버전의 Corresponding Source를 제공해야 합니다. 여기에는 필요한 실행 코드, 빌드·설치 스크립트, 의존성 정보 및 수정 사항이 포함됩니다. 배포한 버전과 소스를 일치시키고, 필요한 의존성 소스와 그 라이선스도 함께 확보하세요. 게시물 전체를 제외하는 방식으로 실행 코드까지 누락하지 마세요.

인증 토큰과 운영 비밀값을 소스에 포함할 필요는 없습니다. 환경변수 이름과 설정 방법은 공개하고, 각 배포자가 자신의 값을 설정합니다. [이미지 접근용 Secret 설정](docs/image-access-secret.md)을 참고하세요.

## 개발과 빌드

Node.js 26과 `nub`을 사용합니다. 의존성 버전은 `nub.lock`에 기록합니다.

```sh
nub install
nub run dev
nub run check
nub run lint
nub run build:fast
```

`build:fast`는 기본 빌드이고, `build`는 OG 이미지 사전 생성을 추가로 실행합니다. 운영 이미지 원본은 R2에 있으므로 저장소 복제만으로 운영 콘텐츠 전체가 제공되지는 않습니다. 자체 배포 시 `wrangler.toml`의 Worker·R2 설정을 자신의 리소스로 변경하고 필요한 이미지와 Secret을 설정하세요.

가사 데이터와 가져오기 명령은 [가사 작성 안내](src/posts/lyric/README.md)에 정리되어 있습니다.

## 의존성 고지 갱신

```sh
nub run licenses
```

설치된 직접·간접 의존성의 라이선스 메타데이터와 포함된 LICENSE/COPYING/NOTICE 문서를 수집합니다. 의존성을 갱신하거나 배포 환경을 바꾸면 다시 생성하고 검토하세요. 설치되지 않은 플랫폼별 선택 의존성은 포함되지 않으며, 패키지에 누락된 고지나 별도 폰트·콘텐츠의 허가까지 자동으로 해결하지는 않습니다.
