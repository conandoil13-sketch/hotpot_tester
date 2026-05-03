function toSafeNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function resolveCartItems(cart = [], menuData = []) {
  const menuById = new Map(menuData.map((item) => [item.id, item]));

  return cart.map((item) => {
    if (item?.category) {
      return item;
    }

    return {
      ...menuById.get(item?.id),
      ...item,
    };
  });
}

function getTopCategoryBySpend(categoryTotals = {}) {
  const entries = Object.entries(categoryTotals);

  if (entries.length === 0) {
    return null;
  }

  return entries.reduce((currentTop, nextEntry) => {
    if (!currentTop || nextEntry[1] > currentTop[1]) {
      return nextEntry;
    }

    return currentTop;
  }, null)?.[0] ?? null;
}

function getWalletRisk(pricePerPerson = 0) {
  if (pricePerPerson >= 50000) {
    return {
      walletRiskLevel: 4,
      walletRiskLabel: '자아 상실',
    };
  }

  if (pricePerPerson >= 40000) {
    return {
      walletRiskLevel: 3,
      walletRiskLabel: '지갑 마라맛',
    };
  }

  if (pricePerPerson >= 30000) {
    return {
      walletRiskLevel: 2,
      walletRiskLabel: '슬슬 위험',
    };
  }

  return {
    walletRiskLevel: 1,
    walletRiskLabel: '이성적 훠궈',
  };
}

function getFullnessLabel(fullnessScore = 0, totalQuantity = 0, peopleCount = 1) {
  if (totalQuantity >= peopleCount * 5) {
    return '폭주형';
  }

  if (fullnessScore >= 2.5) {
    return '배터지기 직전';
  }

  if (fullnessScore >= 1.6) {
    return '든든 국룰';
  }

  if (fullnessScore >= 1) {
    return '적당히 행복';
  }

  return '2차 가야 할 수도';
}

function getSpicyComment(cartItems = []) {
  const soupNames = cartItems
    .filter((item) => item?.category === 'soup')
    .map((item) => item?.name ?? '');

  const hasMala = soupNames.some((name) => name.includes('마라'));
  const hasTomato = soupNames.some((name) => name.includes('토마토'));
  const hasPlainWater = soupNames.some((name) => name.includes('맹물'));

  if (hasMala && hasPlainWater) {
    return '맵게 달리다가 맹물로 정신줄 붙잡는 조합';
  }

  if (hasMala) {
    return '마라 기어 올린 상태, 혀가 오늘 야근함';
  }

  if (hasTomato) {
    return '토마토탕으로 부드럽게 가는 척하지만 꽤 진심임';
  }

  return '국물은 비교적 순한데 지출은 안 순할 수도';
}

function getTypeProfile({ categoryTotals = {}, totalQuantity = 0, peopleCount = 1 }) {
  const topCategory = getTopCategoryBySpend(categoryTotals);

  if (totalQuantity >= peopleCount * 5) {
    return {
      typeTitle: '폭주형',
      typeDescription: '수량부터 심상치 않음. 메뉴판이랑 맞다이 뜬 사람.',
    };
  }

  switch (topCategory) {
    case 'meat':
      return {
        typeTitle: '고기파',
        typeDescription: '채소는 명분이고 진짜 목표는 고기 추가 버튼.',
      };
    case 'soup':
      return {
        typeTitle: '탕에서 예산 터진 사람',
        typeDescription: '국물 칸 고르다가 예산표가 먼저 끓기 시작함.',
      };
    case 'vegetable':
      return {
        typeTitle: '야채 먹는 척하는 사람',
        typeDescription: '청경채 담으면서도 마음은 이미 다른 메뉴에 가 있음.',
      };
    case 'side':
    case 'tofu-noodle':
      return {
        typeTitle: '탄수화물 엔딩',
        typeDescription: '사리랑 사이드가 슬쩍 판을 뒤집음. 배부름은 확실.',
      };
    case 'seafood':
      return {
        typeTitle: '해산물 욕심러',
        typeDescription: '오늘의 예산은 바다 냄새 나는 메뉴들이 끌고 감.',
      };
    default:
      return {
        typeTitle: '균형 잡힌 척하는 사람',
        typeDescription: '겉보기엔 균형형인데 자세히 보면 취향이 다 티 남.',
      };
  }
}

function buildShareText({
  typeTitle,
  walletRiskLabel,
  fullnessLabel,
  calculationResult,
}) {
  const pricePerPerson = toSafeNumber(calculationResult?.pricePerPerson, 0);

  return `오늘 훠궈 결과: ${typeTitle} / ${walletRiskLabel} / ${fullnessLabel} · 1인당 ${Math.round(pricePerPerson).toLocaleString('ko-KR')}원`;
}

export function analyzeResult({
  cart = [],
  menuData = [],
  peopleCount = 1,
  calculationResult = {},
} = {}) {
  const cartItems = resolveCartItems(cart, menuData);
  const pricePerPerson = toSafeNumber(calculationResult?.pricePerPerson, 0);
  const totalQuantity = toSafeNumber(calculationResult?.totalQuantity, 0);
  const fullnessScore = toSafeNumber(calculationResult?.fullnessScore, 0);
  const categoryTotals = calculationResult?.categoryTotals ?? {};

  const { typeTitle, typeDescription } = getTypeProfile({
    categoryTotals,
    totalQuantity,
    peopleCount,
  });
  const { walletRiskLevel, walletRiskLabel } = getWalletRisk(pricePerPerson);
  const fullnessLabel = getFullnessLabel(fullnessScore, totalQuantity, peopleCount);
  const spicyComment = getSpicyComment(cartItems);
  const shareText = buildShareText({
    typeTitle,
    walletRiskLabel,
    fullnessLabel,
    calculationResult,
  });

  return {
    typeTitle,
    typeDescription,
    walletRiskLevel,
    walletRiskLabel,
    fullnessLabel,
    spicyComment,
    shareText,
  };
}

export function buildSimulationResult({
  cart = [],
  menuData = [],
  peopleCount = 1,
  calculationResult = {},
} = {}) {
  return analyzeResult({
    cart,
    menuData,
    peopleCount,
    calculationResult,
  });
}
