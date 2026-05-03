import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TARGET_URLS = [
  'https://pcmap.place.naver.com/restaurant/1583520034/menu/list?from=map&fromPanelNum=1&additionalHeight=76&locale=ko&svcName=map_pcv5',
];

const OUTPUT_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../src/data/menu.raw.json',
);

const DEFAULT_TIMEOUT_MS = 20_000;

const MENU_START_MARKERS = ['정보'];
const MENU_END_MARKERS = ['메뉴 항목과 가격은', '이용약관', '고객센터'];
const SKIP_LINES = new Set([
  '대표',
  '변동',
  '메뉴',
  '예약',
  '리뷰',
  '사진',
  '정보',
]);

function normalizeText(value) {
  return String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectCategoryFromName(menuName) {
  const rules = [
    { category: '탕', keywords: ['탕', '훠궈', '마라', '토마토', '삼선', '똠양꿍', '후추'] },
    { category: '육류', keywords: ['소고기', '양고기', '우삼겹', '갈비', '곱창', '천엽', '닭다리', '소시지', '차돌', '삼겹', '오리창자'] },
    { category: '해산물', keywords: ['새우', '해산물', '메기살', '오징어', '완자'] },
    { category: '채소', keywords: ['청경채', '배추', '버섯', '숙주', '궁채', '야채'] },
    { category: '면·사리', keywords: ['면', '당면', '곤약', '사리'] },
    { category: '두부·완자', keywords: ['두부', '두유피', '두부피', '푸주', '오리피'] },
    { category: '사이드', keywords: ['루로우판', '탄탄면', '튀김', '유탸오', '파전병', '밥', '쿵푸면'] },
  ];

  const matched = rules.find(({ keywords }) => keywords.some((keyword) => menuName.includes(keyword)));
  return matched?.category ?? '미분류';
}

function cleanMenuName(menuName) {
  const normalizedName = normalizeText(menuName);
  const replacements = [
    ['하이디라오 특제소고기', '특제소고기'],
    ['하이다라오 특제소고기', '특제소고기'],
    ['하이디라오 천엽', '특제 천엽'],
    ['하이다라오 천엽', '특제 천엽'],
    ['닭다리 고기', '닭다리고기'],
  ];

  let cleanedName = normalizedName;

  for (const [source, target] of replacements) {
    cleanedName = cleanedName.replace(source, target);
  }

  return cleanedName;
}

function isPriceText(text) {
  return /[\d,]+\s*원/.test(text) || /선택시:/.test(text);
}

function extractMenuSection(bodyText) {
  const text = String(bodyText ?? '');
  const startIndex = MENU_START_MARKERS
    .map((marker) => text.indexOf(marker))
    .find((index) => index >= 0);

  if (startIndex == null || startIndex < 0) {
    throw new Error(
      [
        '메뉴 섹션 시작 지점을 찾지 못했습니다.',
        `시도한 시작 마커: ${MENU_START_MARKERS.join(', ')}`,
      ].join('\n'),
    );
  }

  const fromMenu = text.slice(startIndex);
  const endCandidates = MENU_END_MARKERS
    .map((marker) => {
      const index = fromMenu.indexOf(marker);
      return index > 0 ? index : Number.POSITIVE_INFINITY;
    });
  const endIndex = Math.min(...endCandidates);

  return Number.isFinite(endIndex) ? fromMenu.slice(0, endIndex) : fromMenu;
}

function parseMenuEntries(menuSection, sourceUrl, existingCategoryByName) {
  const lines = menuSection
    .split('\n')
    .map((line) => normalizeText(line))
    .filter(Boolean)
    .filter((line) => !SKIP_LINES.has(line));

  const crawledAt = new Date().toISOString();
  const entries = [];

  for (let index = 0; index < lines.length - 1; index += 1) {
    const menuName = cleanMenuName(lines[index]);
    const priceText = lines[index + 1];

    if (!menuName || !priceText) {
      continue;
    }

    if (menuName.length < 2 || !isPriceText(priceText)) {
      continue;
    }

    const preservedCategory = existingCategoryByName.get(menuName);

    entries.push({
      menuName,
      priceText,
      categoryHint: preservedCategory || detectCategoryFromName(menuName),
      sourceUrl,
      crawledAt,
    });

    index += 1;
  }

  const deduped = [];
  const seen = new Set();

  for (const item of entries) {
    const key = `${item.menuName}::${item.priceText}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(item);
  }

  return deduped;
}

async function readExistingRawItems() {
  try {
    const raw = await fs.readFile(OUTPUT_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildExistingCategoryByName(rawItems) {
  return new Map(
    rawItems
      .filter((item) => item?.menuName)
      .map((item) => [normalizeText(item.menuName), normalizeText(item.categoryHint)]),
  );
}

function collectManualItems(rawItems) {
  return rawItems.filter((item) => normalizeText(item.sourceUrl) === 'manual');
}

async function scrapeSingleUrl(browser, sourceUrl, existingCategoryByName) {
  const page = await browser.newPage();

  try {
    await page.goto(sourceUrl, {
      waitUntil: 'networkidle',
      timeout: DEFAULT_TIMEOUT_MS,
    });

    await page.waitForTimeout(2_000);
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const moreLink = page.locator('a.fvwqf', { hasText: '펼쳐서 더보기' });
      if (!(await moreLink.count())) {
        break;
      }

      await moreLink.first().click();
      await page.waitForTimeout(1_200);
    }

    const bodyText = await page.locator('body').innerText();
    const menuSection = extractMenuSection(bodyText);
    const items = parseMenuEntries(menuSection, sourceUrl, existingCategoryByName);

    if (items.length === 0) {
      throw new Error(
        [
          '메뉴 항목을 추출하지 못했습니다.',
          `시도한 URL: ${sourceUrl}`,
          `메뉴 섹션 일부: ${menuSection.slice(0, 800)}`,
        ].join('\n'),
      );
    }

    return items;
  } catch (error) {
    throw new Error(
      [
        `크롤링 실패: ${sourceUrl}`,
        error.message,
      ].join('\n'),
    );
  } finally {
    await page.close();
  }
}

async function saveRawMenuData(items) {
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(items, null, 2)}\n`, 'utf8');
}

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch (error) {
    throw new Error(
      [
        'playwright 패키지를 찾을 수 없습니다.',
        '다음 순서로 준비해 주세요:',
        '1. npm install -D playwright',
        '2. npx playwright install chromium',
        '',
        `원본 오류: ${error.message}`,
      ].join('\n'),
    );
  }
}

export async function scrapeMenu() {
  const existingRawItems = await readExistingRawItems();
  const existingCategoryByName = buildExistingCategoryByName(existingRawItems);
  const manualItems = collectManualItems(existingRawItems);

  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({ headless: true });
  const scrapedItems = [];
  const failures = [];

  try {
    for (const sourceUrl of TARGET_URLS) {
      try {
        const items = await scrapeSingleUrl(browser, sourceUrl, existingCategoryByName);
        scrapedItems.push(...items);
        console.log(`[OK] ${sourceUrl} -> ${items.length}개 항목 추출`);
      } catch (error) {
        failures.push(error.message);
        console.error(`[ERROR] ${sourceUrl}`);
        console.error(error.message);
      }
    }
  } finally {
    await browser.close();
  }

  const allItems = [...scrapedItems, ...manualItems];

  if (allItems.length > 0) {
    await saveRawMenuData(allItems);
    console.log(`menu.raw.json 저장 완료: ${OUTPUT_PATH}`);
    console.log(`총 ${allItems.length}개 항목 수집`);
  }

  if (failures.length > 0) {
    throw new Error(
      [
        '일부 URL에서 크롤링이 실패했습니다.',
        ...failures,
      ].join('\n\n'),
    );
  }

  if (allItems.length === 0) {
    throw new Error('수집된 메뉴가 없습니다. 페이지 구조나 마커를 확인해 주세요.');
  }

  return allItems;
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  scrapeMenu().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
