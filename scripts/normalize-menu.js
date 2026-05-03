import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RAW_MENU_PATH = path.resolve(__dirname, '../src/data/menu.raw.json');
const NORMALIZED_MENU_PATH = path.resolve(__dirname, '../src/data/menu.json');

const CATEGORY_RULES = [
  { category: 'soup', keywords: ['탕', '훠궈', '마라', '토마토'] },
  {
    category: 'meat',
    keywords: [
      '소고기',
      '양고기',
      '우삼겹',
      '목심',
      '갈비',
      '차돌',
      '삼겹',
      '천엽',
      '닭다리',
      '닭발',
      '닭똥집',
      '우설',
      '곱창',
      '깐양',
      '양어깨살',
      '양갈비살',
      '소세지',
      '소스지',
      '소시지',
      '햄',
      '황후',
      '양념소고기',
      '오리창자',
      '특제양고기',
      '돈 목살',
      '돈 삼겹살',
      '소목심살',
      '한우목심',
      '특제소고기',
      '마라닭',
      '루닭발',
    ],
  },
  {
    category: 'seafood',
    keywords: [
      '새우',
      '완자',
      '어묵',
      '해산물',
      '전복',
      '게맛살',
      '메기살',
      '갑오징어',
      '피쉬두부',
    ],
  },
  {
    category: 'vegetable',
    keywords: [
      '배추',
      '청경채',
      '버섯',
      '숙주',
      '미나리',
      '고수',
      '연근',
      '다시마',
      '죽순',
      '옥수수',
      '감자',
      '궁채',
      '목이버섯',
      '얼걸이배추',
      '폭포감자채',
      '야채',
    ],
  },
  {
    category: 'tofu-noodle',
    keywords: [
      '두부',
      '당면',
      '떡',
      '푸주',
      '유부',
      '분모자',
      '곤약',
      '생면',
      '면',
      '고구마당면',
      '감자당면',
      '유부피',
      '두유피',
      '말린두부',
      '말랑두부',
      '냉동두부',
      '두부피',
    ],
  },
  {
    category: 'side',
    keywords: [
      '밥',
      '튀김',
      '참깨볼',
      '흑당유심고',
      '꽃빵튀김',
      '만두',
      '메추리알',
      '탕후루',
      '쿵푸면',
      '루로우판',
      '탄탄면',
      '소스바',
      '음료',
    ],
  },
];

const CATEGORY_HINT_MAP = {
  탕: 'soup',
  육류: 'meat',
  해산물: 'seafood',
  채소: 'vegetable',
  '두부·완자': 'tofu-noodle',
  '두부·면': 'tofu-noodle',
  '면·사리': 'tofu-noodle',
  사이드: 'side',
  음료: 'side',
  미분류: 'uncategorized',
};

function normalizeText(value) {
  return String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractPriceNumbers(priceText) {
  const normalized = normalizeText(priceText);
  const matches = normalized.match(/\d[\d,]*/g) ?? [];

  return matches
    .map((value) => Number.parseInt(value.replaceAll(',', ''), 10))
    .filter((value) => Number.isFinite(value));
}

function resolvePrice(priceText) {
  const prices = [...new Set(extractPriceNumbers(priceText))];

  if (prices.length === 1) {
    return {
      price: prices[0],
      priceText: normalizeText(priceText) || null,
    };
  }

  return {
    price: null,
    priceText: normalizeText(priceText) || null,
  };
}

function inferCategory(menuName) {
  const normalizedName = normalizeText(menuName);
  const matchedRule = CATEGORY_RULES.find(({ keywords }) =>
    keywords.some((keyword) => normalizedName.includes(keyword)),
  );

  return matchedRule?.category ?? 'uncategorized';
}

function resolveCategory(categoryHint, menuName) {
  const normalizedHint = normalizeText(categoryHint);

  if (
    normalizedHint &&
    CATEGORY_HINT_MAP[normalizedHint] &&
    CATEGORY_HINT_MAP[normalizedHint] !== 'uncategorized'
  ) {
    return CATEGORY_HINT_MAP[normalizedHint];
  }

  return inferCategory(menuName);
}

function slugifyMenuName(menuName) {
  const normalizedName = normalizeText(menuName).toLowerCase();
  const romanizedMap = [
    ['훠궈', 'hotpot'],
    ['마라', 'mala'],
    ['토마토', 'tomato'],
    ['탕', 'tang'],
    ['소고기', 'beef'],
    ['양고기', 'lamb'],
    ['우삼겹', 'beef-belly'],
    ['목심', 'pork-shoulder'],
    ['새우', 'shrimp'],
    ['완자', 'meatball'],
    ['어묵', 'fish-cake'],
    ['해산물', 'seafood'],
    ['배추', 'napa-cabbage'],
    ['청경채', 'bok-choy'],
    ['버섯', 'mushroom'],
    ['숙주', 'bean-sprout'],
    ['두부', 'tofu'],
    ['당면', 'glass-noodle'],
    ['떡', 'rice-cake'],
    ['푸주', 'tofu-skin'],
    ['면', 'noodle'],
    ['밥', 'rice'],
    ['튀김', 'fried'],
  ];

  let slug = normalizedName;

  for (const [source, target] of romanizedMap) {
    slug = slug.replaceAll(source, ` ${target} `);
  }

  slug = slug
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return slug || 'menu-item';
}

function createUniqueId(baseId, usedIds) {
  if (!usedIds.has(baseId)) {
    usedIds.add(baseId);
    return baseId;
  }

  let suffix = 2;
  while (usedIds.has(`${baseId}-${suffix}`)) {
    suffix += 1;
  }

  const nextId = `${baseId}-${suffix}`;
  usedIds.add(nextId);
  return nextId;
}

function normalizeMenuItem(item, usedIds) {
  const menuName = normalizeText(item.menuName);
  const sourceUrl = normalizeText(item.sourceUrl) || null;
  const crawledAt = normalizeText(item.crawledAt) || null;
  const { price, priceText } = resolvePrice(item.priceText);
  const category = resolveCategory(item.categoryHint, menuName);
  const id = createUniqueId(slugifyMenuName(menuName), usedIds);

  return {
    id,
    name: menuName,
    category,
    price,
    priceText,
    sourceUrl,
    crawledAt,
  };
}

function shouldSkipMenuItem(item) {
  const priceText = normalizeText(item?.priceText);

  if (priceText.includes('선택시:')) {
    return true;
  }

  return false;
}

async function readRawMenuFile() {
  let rawContent;

  try {
    rawContent = await fs.readFile(RAW_MENU_PATH, 'utf8');
  } catch (error) {
    throw new Error(`menu.raw.json을 읽을 수 없습니다: ${RAW_MENU_PATH}\n${error.message}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(rawContent);
  } catch (error) {
    throw new Error(`menu.raw.json JSON 파싱에 실패했습니다.\n${error.message}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error('menu.raw.json의 최상위 값은 배열이어야 합니다.');
  }

  return parsed;
}

async function writeNormalizedMenuFile(menuItems) {
  const json = `${JSON.stringify(menuItems, null, 2)}\n`;
  await fs.writeFile(NORMALIZED_MENU_PATH, json, 'utf8');
}

export async function normalizeMenu() {
  const rawItems = await readRawMenuFile();
  const usedIds = new Set();

  const normalizedItems = rawItems
    .filter((item) => item && typeof item === 'object')
    .filter((item) => !shouldSkipMenuItem(item))
    .map((item) => normalizeMenuItem(item, usedIds));

  await writeNormalizedMenuFile(normalizedItems);

  console.log(`menu.json 생성 완료: ${NORMALIZED_MENU_PATH}`);
  console.log(`총 ${normalizedItems.length}개 항목 정규화`);

  return normalizedItems;
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  normalizeMenu().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
