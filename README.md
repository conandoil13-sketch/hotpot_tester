# hotpot-simulator

인원수와 주문 성향을 바탕으로 예상 주문 금액, 1인당 가격, 주문 타입을 보여주기 위한 모바일 우선 웹앱 프로젝트입니다.

이번 초기 세팅 단계에서는 기능 구현보다 프로젝트 구조 분리, 데이터 파일 위치 고정, Vite + React 실행 환경 구성에 집중했습니다.

## 기술 스택

- Vite
- React
- GitHub Pages 배포를 고려한 정적 빌드 구조

## 로컬 실행

```bash
npm install
npm run dev
```

기본 개발 서버가 실행되면 브라우저에서 안내된 로컬 주소로 접속해 확인할 수 있습니다.

## 빌드

```bash
npm run build
```

빌드 결과물은 `dist/` 폴더에 생성됩니다.

## GitHub Pages 배포

이 프로젝트는 `main` 브랜치에 push 하면 GitHub Actions로 자동 배포되도록 설정되어 있습니다.

1. GitHub 저장소의 `Settings > Pages`로 이동합니다.
2. `Build and deployment`의 `Source`를 `GitHub Actions`로 선택합니다.
3. `main` 브랜치에 push 하면 `.github/workflows/deploy-pages.yml`이 실행됩니다.
4. 배포가 끝나면 GitHub Pages 주소에서 사이트를 확인할 수 있습니다.

현재 `vite.config.js`의 `base`는 `/hotpot-simulator/`로 설정되어 있습니다. 저장소 이름이 다르면 이 값을 함께 바꿔야 합니다.

## 폴더 구조

```text
hotpot-simulator/
├─ index.html
├─ package.json
├─ README.md
├─ vite.config.js
├─ public/
│  ├─ og-image.png
│  └─ icons/
├─ src/
│  ├─ main.jsx
│  ├─ App.jsx
│  ├─ style.css
│  ├─ data/
│  │  ├─ menu.json
│  │  ├─ menu.raw.json
│  │  ├─ presets.json
│  │  └─ sauces.json
│  ├─ components/
│  │  ├─ StartScreen.jsx
│  │  ├─ PeopleSelector.jsx
│  │  ├─ StyleSelector.jsx
│  │  ├─ SoupSelector.jsx
│  │  ├─ MenuEditor.jsx
│  │  ├─ MenuGrid.jsx
│  │  ├─ CartSummary.jsx
│  │  └─ ResultCard.jsx
│  └─ utils/
│     ├─ priceCalculator.js
│     ├─ resultAnalyzer.js
│     └─ formatter.js
└─ scripts/
   ├─ scrape-menu.js
   ├─ scrape-sauces.js
   ├─ normalize-menu.js
   └─ validate-menu.js
```

## 데이터 파일

- `src/data/menu.json`: 앱에서 사용할 정제된 메뉴 데이터
- `src/data/menu.raw.json`: 수집 직후의 원본 형태 데이터를 임시 보관할 파일
- `src/data/presets.json`: 주문 성향 프리셋 데이터
- `src/data/sauces.json`: 훠궈 소스 추천 조합 데이터

현재는 최소 더미 데이터만 넣어두었고, 이후 단계에서 구조를 구체화하면 됩니다.

## 스크립트 폴더

`scripts/` 폴더는 개발 중 1회성 데이터 준비 작업을 위한 자리만 만들어 두었습니다.

- `scrape-menu.js`: 메뉴 수집용 스크립트 자리
- `scrape-sauces.js`: 공개 소스 추천 데이터를 수집해 `src/data/sauces.json`으로 저장하는 스크립트
- `normalize-menu.js`: 원본 메뉴 데이터 정리용 스크립트 자리
- `validate-menu.js`: 메뉴 데이터 검증용 스크립트 자리

소스 데이터는 아래 명령으로 다시 수집할 수 있습니다.

```bash
npm run collect:sauces
```

## 배포 메모

- `vite.config.js`의 `base`는 GitHub Pages 저장소 경로 기준입니다.
- 자동 배포 워크플로는 [deploy-pages.yml](/Users/alltimesuho/Desktop/코딩/hugugugu/hotpot-simulator/.github/workflows/deploy-pages.yml)에 있습니다.
