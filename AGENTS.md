# Agent-Only Context (Codex / GLM)

이 문서는 **에이전트 전용 운영 메모**다.  
사용자에게 직접 노출되는 제품 문서가 아니라, 이 저장소에서 작업할 때 맥락 유지를 위한 지침이다.

## 1) Project Snapshot
- 프로젝트명: `ability-paradox-generator` (`The Divine Paradox`)
- 성격: 정적 프런트엔드 + Netlify Serverless Function 기반 능력 생성기
- 핵심 경험:
  - 신성한 능력 + 치명적 대가를 한 문장으로 생성
  - 다국어 UI (`en`, `ko`, `ja`, `zh`)
  - 저장/복사/스킵(다음 생성 시 암묵 스킵) 기반 취향 학습
  - 콤보/희귀도/업적/트레저리(컬렉션) 시스템

## 2) Runtime Architecture
- 프런트:
  - `index.html`: UI 뼈대, 모달, 통계, 액션 버튼
  - `style.css`: 테마/애니메이션/반응형 스타일
  - `main.js`: 앱 상태, i18n, 생성 플로우, 게임 시스템, 로컬스토리지
- 백엔드:
  - `netlify/functions/generate.js`: `/api/generate` 처리
  - OpenAI Responses API 호출 + JSON schema 출력 강제 + 폴백/재시도
- 라우팅:
  - `netlify.toml`에서 `/api/generate -> /.netlify/functions/generate`

## 3) Data & State Model (Browser)
- 주요 로컬스토리지 키:
  - `divine_generatedTotal`
  - `divine_recentAbilities`
  - `divine_likedAbilities`
  - `divine_skippedAbilities`
  - `divine_combo`
  - `divine_achievements`
  - `divine_treasury`
  - `divine_attitude`
  - `divine_daily`, `divine_dailyStreak` (UI와 일부 분리된 잔존 로직 있음)
- 현재 UX 규칙:
  - 무시하기 버튼은 제거됨
  - 저장/복사 없이 새 생성을 누르면 이전 결과를 스킵으로 처리
  - Divine Favor는 표시상 `1x`부터 시작

## 4) i18n Contract
- 단일 번역 소스: `main.js`의 `UI_TEXT`
- 새 UI 문구를 추가할 때:
  - `en/ko/ja/zh` 모두 키를 채운다
  - `applyLang()`에서 DOM 반영 경로를 같이 추가한다
  - 하드코딩 토스트/confirm/placeholder를 남기지 않는다
- 희귀도 텍스트는 `rarityLabels`를 통해 언어별 노출한다

## 5) OpenAI Function Contract
- 필수 환경변수:
  - `OPENAI_API_KEY` (또는 `OPENAI_KEY`, `OPENAI_API_TOKEN`)
- 선택 환경변수:
  - `OPENAI_MODEL` (기본 `gpt-5-nano`)
  - `DEBUG_OPENAI=1`
- 요청 바디(핵심):
  - `lang`, `recentAbilities`, `preferencePatterns`
- 응답:
  - 기본 `{ result: string }`
  - 디버그 활성 시 `{ result, debug }`

## 6) Change Safety Rules
- 이 저장소는 단일 파일(`main.js`)에 로직이 응집되어 있어 회귀 위험이 큼.
- 수정 시 최소 확인:
  1. `node --check main.js`
  2. 다국어 전환 시 버튼/모달/토스트 문구 반영 확인
  3. 생성 -> 저장/복사 -> 재생성 플로우 확인
  4. 생성 -> 저장/복사 없이 재생성 시 스킵 반영 확인
- 성능/안정성 원칙:
  - DOM 조회 중복을 줄이고, 상단 상수화된 요소를 재사용
  - 문자열 상수는 번역 테이블로 집약

## 7) Known Caveats
- `index.html`의 Privacy 본문은 대부분 영어 고정 텍스트다(완전 i18n 미완료 가능).
- `main.js`에는 UI와 분리된 daily/attitude 계열 잔존 로직이 존재할 수 있음.
- 현재 테스트 스크립트가 사실상 없음(`npm test`는 placeholder).

## 8) Guidance for Codex / GLM
- 우선순위:
  1. 사용자 체감 동작 회귀 방지
  2. i18n 일관성 유지
  3. 저장 데이터 호환성 유지(로컬스토리지 키 임의 변경 금지)
- 큰 리팩터링 전에는 사용자 요청 범위를 벗어나지 않는 최소 변경을 우선한다.
- UI 문구 변경 요청은 항상 4개 언어 동시 반영을 기본값으로 처리한다.
