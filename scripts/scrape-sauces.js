import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIRESTORE_API_URL =
  'https://firestore.googleapis.com/v1/projects/hotpot-8c321/databases/(default)/documents/source?pageSize=200';
const SOURCE_PAGE_URL = 'https://twitter-michelin.web.app/hotpot/';
const OUTPUT_PATH = path.resolve(__dirname, '../src/data/sauces.json');

function decodeFirestoreValue(value) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  if ('stringValue' in value) {
    return value.stringValue;
  }

  if ('integerValue' in value) {
    return Number.parseInt(value.integerValue, 10);
  }

  if ('doubleValue' in value) {
    return Number.parseFloat(value.doubleValue);
  }

  if ('booleanValue' in value) {
    return Boolean(value.booleanValue);
  }

  if ('arrayValue' in value) {
    const items = value.arrayValue?.values ?? [];
    return items.map((item) => decodeFirestoreValue(item));
  }

  if ('mapValue' in value) {
    const fields = value.mapValue?.fields ?? {};
    return Object.fromEntries(
      Object.entries(fields).map(([key, childValue]) => [key, decodeFirestoreValue(childValue)]),
    );
  }

  return null;
}

function decodeDocument(document) {
  const fields = document?.fields ?? {};

  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, decodeFirestoreValue(value)]),
  );
}

function normalizeText(value) {
  return String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value) {
  const slug = normalizeText(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return slug || 'sauce';
}

function sanitizeRecipeName(name) {
  const normalized = normalizeText(name);

  if (normalized === '하이디 소스') {
    return '기본 육수 간장 소스';
  }

  return normalized;
}

function parseIngredient(rawIngredient) {
  const raw = normalizeText(rawIngredient);
  const match = raw.match(/^(.*?)(?:\s+([0-9./~]+(?:\s*방울|\s*국자|\s*숟가락|\s*집게)?|많이))$/);

  if (!match) {
    return {
      name: raw,
      amount: null,
      raw,
    };
  }

  return {
    name: normalizeText(match[1]),
    amount: normalizeText(match[2]) || null,
    raw,
  };
}

function normalizeRecipe(document) {
  const decoded = decodeDocument(document);
  const sourceId = document.name.split('/').at(-1);
  const rawName = decoded.name || decoded.src_name || `소스 ${sourceId}`;
  const recipeName = sanitizeRecipeName(rawName);
  const keyword = normalizeText(decoded.keyword);
  const ingredients = Array.isArray(decoded.ingredients)
    ? decoded.ingredients.map((item) => parseIngredient(item))
    : [];
  const viewCount = Number(decoded.view ?? decoded.view_cnt ?? 0);

  return {
    id: sourceId,
    slug: slugify(recipeName),
    name: recipeName,
    keyword: keyword || null,
    viewCount,
    ingredientCount: ingredients.length,
    ingredients,
    ingredientText: ingredients.map((item) => item.raw),
    sourceUrl: `${SOURCE_PAGE_URL}detail/${sourceId}`,
    collectedAt: new Date().toISOString(),
  };
}

async function fetchAllRecipes() {
  const response = await fetch(FIRESTORE_API_URL, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`소스 목록 요청 실패: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  return payload.documents ?? [];
}

async function writeSauceFile(sauces) {
  const json = `${JSON.stringify(sauces, null, 2)}\n`;
  await fs.writeFile(OUTPUT_PATH, json, 'utf8');
}

export async function scrapeSauces() {
  const documents = await fetchAllRecipes();
  const sauces = documents
    .map((document) => normalizeRecipe(document))
    .sort((left, right) => right.viewCount - left.viewCount);

  await writeSauceFile(sauces);

  console.log(`sauces.json 생성 완료: ${OUTPUT_PATH}`);
  console.log(`총 ${sauces.length}개 소스 저장`);

  return sauces;
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  scrapeSauces().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
