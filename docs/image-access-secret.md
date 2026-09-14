# 이미지 접근용 비밀값 설정

`INTERNAL_IMAGE_SECRET`은 `/img/`로 요청할 때 `x-internal-secret` 헤더에 넣는 서버 전용 값입니다. 브라우저 코드, `wrangler.toml`의 `[vars]`, 커밋된 파일에는 넣지 않습니다.

## 로컬 개발과 이미지 크기 수집

`.env.example`을 `.env.local`로 복사하고 값을 입력합니다. 이미 `.env.local`이 있으면 덮어쓰지 말고 해당 변수만 수정합니다. 파일 권한은 `chmod 600 .env.local`로 제한합니다.

```dotenv
INTERNAL_IMAGE_SECRET=
```

- Vite 개발 서버는 `.env.local`을 읽습니다. 변경 후 개발 서버를 재시작합니다.
- `nub run sync-images`는 Node의 `--env-file-if-exists=.env.local`로 값을 읽습니다. 셸/CI에 같은 환경변수가 있으면 그 값이 우선합니다.
- Wrangler 로컬 실행은 `.dev.vars`에 같은 이름으로 설정할 수 있습니다. 이 파일도 Git에서 제외됩니다.
- `.env*`, `.dev.vars*`는 Git에서 제외하며 `.env.example`, `.dev.vars.example`만 예외입니다. 예시 파일에는 실제 값을 쓰지 않습니다. `git add -f`는 이 보호를 우회하므로 사용하지 않습니다.

```sh
git check-ignore .env.local .env.test .dev.vars
```

## 운영 환경: 배포 전에 설정

프로젝트 루트에서 설치된 Wrangler를 사용합니다.

```sh
npx wrangler secret put INTERNAL_IMAGE_SECRET
```

프롬프트에 값을 입력합니다. 명령 인수에 직접 값을 넣어 셸 이력에 남기지 않습니다. 현재 `wrangler.toml`의 Worker 대상은 `quiple-blog`입니다. 별도 Wrangler environment를 운영한다면 해당 환경에도 따로 등록해야 합니다.

Cloudflare 대시보드에서도 Worker의 Settings → Variables and Secrets에서 Secret으로 추가할 수 있습니다. 등록 없이 새 코드를 배포하면 이미지 변환 요청이 503으로 실패합니다. R2에서 직접 반환하는 허용된 원본 이미지 경로에는 이 Secret이 필요하지 않습니다.

## 기존 값 교체

기존 값은 과거 코드에 기록됐으므로 새 임의값으로 교체해야 합니다. 비밀번호 관리자의 생성 기능 등으로 충분히 긴 새 값을 만들고 안전하게 보관합니다.

1. Cloudflare WAF/사용자 지정 규칙 등에서 `x-internal-secret`을 검사하는 위치를 확인합니다. 이 저장소의 `/img/` 핸들러 자체에는 헤더 검증 코드가 없습니다. 이번 변경은 기존 송신 측 비밀값만 분리했으며 접근 제어 규칙을 새로 만들지는 않았습니다.
2. Worker Secret, 로컬 `.env.local`, 사용 중인 CI Secret과 수신 측 검사 규칙을 같은 새 값으로 맞춥니다. 코드 배포와 수신 규칙 전환을 조율해야 하며 서로 다른 값인 동안 이미지 요청이 실패할 수 있습니다.
3. 실제 이미지 표시와 이미지 크기 수집을 확인하고, 기존 값이 더 이상 수신 규칙에서 허용되지 않는지 확인합니다. 기존 값의 유효성은 Git 파일을 삭제한다고 없어지지 않습니다.

Cloudflare Secret 등록/교체, 수신 규칙 변경과 배포는 이번 코드 변경으로 자동 실행되지 않습니다.

## Git 이력과 공개 배포본

현재 추적 파일의 하드코딩만 제거한 상태입니다. 이 변경을 커밋해도 과거 커밋에는 이전 값이 남습니다.

- 정리한 코드의 새 공개 저장소를 만들 경우 기존 `.git`이나 `.env.local`을 복사하지 않습니다. 공개할 파일을 명시적으로 선택해 내보냅니다.
- 기존 저장소와 이력을 공개할 경우 `git-filter-repo` 등으로 모든 관련 브랜치/태그의 값을 제거하는 별도 이력 정리가 필요합니다. 커밋 해시 변경과 강제 푸시를 수반하므로 백업·협업자 조율 후 진행합니다. 삭제된 과거 파일도 대상입니다.
- 이미 공유된 복제본, 원격 캐시, 빌드 산출물은 이력 재작성만으로 회수되지 않습니다. 키 교체가 우선입니다.

공개 직전에는 실제 공개할 파일/참조를 다시 검사합니다. `.gitignore`는 이미 추적 중인 파일이나 과거 커밋을 지우지 않습니다.

참고: [Cloudflare Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/).
