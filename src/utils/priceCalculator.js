function toSafeNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function toSafeQuantity(value) {
  return Math.max(0, toSafeNumber(value, 0));
}

function toSafePeopleCount(value) {
  return Math.max(1, toSafeNumber(value, 1));
}

function resolveSoupPrice(item) {
  const selectedSoupSize = item?.selectedSoupSize;
  const soupPrices = item?.prices;

  if (!selectedSoupSize || !soupPrices || typeof soupPrices !== 'object') {
    return toSafeNumber(item?.price, 0);
  }

  return toSafeNumber(soupPrices[selectedSoupSize], 0);
}

function resolveUnitPrice(item) {
  if (item?.category === 'soup' && item?.selectedSoupSize) {
    return resolveSoupPrice(item);
  }

  return toSafeNumber(item?.price, 0);
}

function createEmptyResult(peopleCount = 1) {
  const safePeopleCount = toSafePeopleCount(peopleCount);

  return {
    totalPrice: 0,
    pricePerPerson: 0,
    categoryTotals: {},
    totalQuantity: 0,
    fullnessScore: 0 / safePeopleCount,
  };
}

export function calculateEstimatedTotal(cart = []) {
  return cart.reduce((sum, item) => {
    const quantity = toSafeQuantity(item?.quantity);
    const unitPrice = resolveUnitPrice(item);
    return sum + unitPrice * quantity;
  }, 0);
}

export function calculatePricePerPerson(totalPrice, peopleCount) {
  const safePeopleCount = toSafePeopleCount(peopleCount);
  return toSafeNumber(totalPrice, 0) / safePeopleCount;
}

export function calculateCategoryTotals(cart = []) {
  return cart.reduce((totals, item) => {
    const category = item?.category || 'uncategorized';
    const quantity = toSafeQuantity(item?.quantity);
    const unitPrice = resolveUnitPrice(item);
    const itemTotal = unitPrice * quantity;

    totals[category] = (totals[category] ?? 0) + itemTotal;
    return totals;
  }, {});
}

export function calculateTotalQuantity(cart = []) {
  return cart.reduce((sum, item) => sum + toSafeQuantity(item?.quantity), 0);
}

export function calculateFullnessScore(cart = [], peopleCount = 1) {
  const safePeopleCount = toSafePeopleCount(peopleCount);
  const totalServing = cart.reduce((sum, item) => {
    const quantity = toSafeQuantity(item?.quantity);
    const serving = toSafeNumber(item?.serving, 0);
    return sum + serving * quantity;
  }, 0);

  return totalServing / safePeopleCount;
}

export function calculateCartSummary(cart = [], peopleCount = 1) {
  if (!Array.isArray(cart) || cart.length === 0) {
    return createEmptyResult(peopleCount);
  }

  const totalPrice = calculateEstimatedTotal(cart);
  const pricePerPerson = calculatePricePerPerson(totalPrice, peopleCount);
  const categoryTotals = calculateCategoryTotals(cart);
  const totalQuantity = calculateTotalQuantity(cart);
  const fullnessScore = calculateFullnessScore(cart, peopleCount);

  return {
    totalPrice,
    pricePerPerson,
    categoryTotals,
    totalQuantity,
    fullnessScore,
  };
}
