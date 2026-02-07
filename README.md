# The Divine Paradox (ability-paradox-generator)

신성한 능력과 그에 따른 치명적 대가를 생성하는 멀티언어 웹앱입니다.  
프런트엔드는 정적 파일(`index.html`, `style.css`, `main.js`)로 구성되고, 생성 API는 Netlify Function으로 동작합니다.

## 핵심 기능
- 능력 생성: `/api/generate` 호출로 단문 능력/대가 문장 생성
- 다국어 UI: 영어/한국어/일본어/중국어 지원
- 게임화 시스템:
  - Divine Favor(콤보)
  - 희귀도(Common/Rare/Epic/Legendary)
  - Achievements(업적)
  - Treasury(저장 컬렉션)
- 사용자 행동 기반 학습:
  - 최근 생성 능력 회피
  - 저장/복사한 결과 선호 반영
  - 저장/복사 없이 다음 생성 시 스킵으로 처리

## 기술 스택
- Frontend: Vanilla HTML/CSS/JS
- Backend: Netlify Functions (Node.js)
- LLM API: OpenAI Responses API
- Storage: Browser `localStorage`

## 프로젝트 구조
```txt
.
├─ index.html                    # UI 구조, 모달/버튼/통계 영역
├─ style.css                     # 스타일, 애니메이션, 반응형
├─ main.js                       # 앱 핵심 로직(i18n/상태/이벤트/게임 시스템)
├─ netlify/functions/generate.js # 능력 생성 서버리스 함수
├─ netlify.toml                  # Netlify 빌드/리다이렉트 설정
├─ robots.txt
├─ sitemap.xml
└─ AGENTS.md                     # 에이전트(Codex/GLM) 전용 맥락 문서
```

## 동작 방식
1. 사용자가 생성 버튼 클릭
2. 프런트가 언어/최근 결과/선호 패턴을 `/api/generate`로 전송
3. 함수가 OpenAI API를 호출해 JSON 스키마 형태 응답 요청
4. 프런트가 결과를 애니메이션과 함께 렌더링
5. 저장/복사/재생성 행동이 콤보·태도·업적·선호 데이터에 반영

## 환경 변수
`netlify/functions/generate.js` 기준:

- 필수
  - `OPENAI_API_KEY`
- 대체 키명(선택)
  - `OPENAI_KEY`
  - `OPENAI_API_TOKEN`
- 선택
  - `OPENAI_MODEL` (기본: `gpt-5-nano`)
  - `DEBUG_OPENAI=1` (디버그 정보 포함 응답)

## 로컬 실행
이 프로젝트는 정적 파일 + Netlify Function 구성입니다.

### 1) 프런트 정적 파일 서빙
아무 정적 서버로 루트 디렉토리를 띄울 수 있습니다.

```bash
# 예시 (Node 내장 서버)
npx serve .
```

### 2) 함수까지 포함해 로컬 실행(Netlify 권장)
```bash
npx netlify dev
```
- `netlify.toml`의 리다이렉트 설정으로 `/api/generate`가 함수로 연결됩니다.
- 환경변수는 Netlify CLI 환경 파일/셸 환경변수로 주입합니다.

## 배포
- Netlify 배포 기준:
  - Publish directory: `.`
  - Functions directory: `netlify/functions`
  - Redirect: `/api/generate -> /.netlify/functions/generate` (200 rewrite)

## i18n 가이드
- 번역 소스는 `main.js`의 `UI_TEXT` 객체입니다.
- UI 문구를 추가할 때 `en/ko/ja/zh`를 모두 채워야 합니다.
- 하드코딩 문구(토스트, confirm, placeholder)를 남기지 말고 `UI_TEXT`를 통해 노출하세요.

## 데이터 저장(브라우저)
주요 `localStorage` 키:
- `divine_generatedTotal`
- `divine_recentAbilities`
- `divine_likedAbilities`
- `divine_skippedAbilities`
- `divine_combo`
- `divine_achievements`
- `divine_treasury`
- `divine_attitude`
- `divine_daily`
- `divine_dailyStreak`

## 품질 체크(권장)
변경 후 최소 확인:
1. `node --check main.js`
2. 4개 언어 전환 시 UI 문구 반영 확인
3. 생성/저장/복사/재생성 플로우 확인
4. 저장·복사 없이 재생성 시 스킵 반영 확인

## 라이선스
`LICENSE` 파일을 따릅니다.
