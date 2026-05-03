import { useMemo, useState } from 'react';
import CartSummary from './CartSummary.jsx';
import { formatCurrency } from '../utils/formatter.js';

const CATEGORY_LABELS = {
  soup: '탕',
  meat: '고기',
  seafood: '해산물',
  vegetable: '야채',
  'tofu-noodle': '두부·면',
  side: '사이드',
  uncategorized: '기타',
};

const SOUP_COURSE_OPTIONS = [
  { id: 'single', label: '한가지탕', helper: '탕 1칸만 고르기' },
  { id: 'double', label: '두가지탕', helper: '탕 2칸 기준으로 담기' },
  { id: 'quad', label: '네가지탕', helper: '탕 4칸 기준으로 담기' },
];

function getSoupCourseFromName(name = '') {
  if (name.startsWith('한가지탕 옵션')) {
    return 'single';
  }

  if (name.startsWith('두가지탕 옵션')) {
    return 'double';
  }

  if (name.startsWith('네가지탕 옵션')) {
    return 'quad';
  }

  return null;
}

function formatSoupOptionName(name = '') {
  return name.replace(/^.+?옵션 -\s*/, '');
}

function normalizeSearchText(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/\s+/g, '');
}

function getDisplayName(item, activeCategory) {
  return activeCategory === 'soup' || item.category === 'soup'
    ? formatSoupOptionName(item.name)
    : item.name;
}

function MenuEditor({
  menuItems,
  quantities,
  peopleCount,
  selectedPreset,
  soupCourse,
  summary,
  onQuantityChange,
  onSelectSoupCourse,
  onShowResult,
}) {
  const categories = useMemo(() => {
    const deduped = [...new Set(menuItems.map((item) => item.category || 'uncategorized'))];
    return deduped.map((category) => ({
      id: category,
      label: CATEGORY_LABELS[category] ?? category,
    }));
  }, [menuItems]);

  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? 'soup');
  const [searchQuery, setSearchQuery] = useState('');
  const normalizedSearchQuery = normalizeSearchText(searchQuery);

  const filteredItems = useMemo(() => {
    const items = menuItems.filter((item) => (item.category || 'uncategorized') === activeCategory);

    if (activeCategory !== 'soup') {
      return items;
    }

    return items.filter((item) => getSoupCourseFromName(item.name) === soupCourse);
  }, [activeCategory, menuItems, soupCourse]);
  const groupedSearchResults = useMemo(() => {
    if (!normalizedSearchQuery) {
      return [];
    }

    return categories
      .map((category) => {
        const items = menuItems
          .filter((item) => (item.category || 'uncategorized') === category.id)
          .filter((item) => {
            if (item.category === 'soup') {
              return getSoupCourseFromName(item.name) === soupCourse;
            }

            return true;
          })
          .filter((item) => {
            const haystack = normalizeSearchText(
              [
                item.name,
                getDisplayName(item, category.id),
                CATEGORY_LABELS[item.category] ?? item.category,
              ]
                .filter(Boolean)
                .join(' '),
            );

            return haystack.includes(normalizedSearchQuery);
          })
          .sort((left, right) => {
            const quantityGap = (quantities[right.id] ?? 0) - (quantities[left.id] ?? 0);

            if (quantityGap !== 0) {
              return quantityGap;
            }

            return getDisplayName(left, category.id).localeCompare(getDisplayName(right, category.id), 'ko');
          });

        if (items.length === 0) {
          return null;
        }

        return {
          ...category,
          items,
        };
      })
      .filter(Boolean);
  }, [categories, menuItems, normalizedSearchQuery, quantities, soupCourse]);
  const totalSearchResults = groupedSearchResults.reduce(
    (accumulator, group) => accumulator + group.items.length,
    0,
  );
  const showSearchResults = Boolean(normalizedSearchQuery);

  return (
    <section className="editor-layout">
      <div className="panel-card">
        <div className="section-heading">
          <h1>메뉴를 취향대로 다듬기</h1>
          <p>
            {selectedPreset
              ? `${selectedPreset.name} 프리셋이 적용된 상태입니다.`
              : '직접 메뉴를 담고 있습니다.'}
            {' '}필요한 메뉴만 더하고 뺄 수 있습니다.
          </p>
        </div>

        <div className="menu-search-shell">
          <label className="menu-search-field" htmlFor="menu-search-input">
            <span>메뉴 빠르게 찾기</span>
            <div className="menu-search-input-row">
              <input
                id="menu-search-input"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="예: 우삼겹, 버섯, 소스바"
              />
              {searchQuery ? (
                <button
                  className="menu-search-clear"
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="검색어 지우기"
                >
                  ×
                </button>
              ) : null}
            </div>
          </label>
          {showSearchResults ? (
            <p className="menu-search-meta">
              검색 결과 {totalSearchResults}개
              {totalSearchResults > 0 ? ' · 카테고리별로 다시 묶어서 보여주는 중' : ''}
            </p>
          ) : null}
        </div>

        <div className="category-tabs" role="tablist" aria-label="메뉴 카테고리">
          {categories.map((category) => {
            const isActive = category.id === activeCategory;

            return (
              <button
                key={category.id}
                className={`category-tab ${isActive ? 'is-active' : ''}`}
                type="button"
                onClick={() => setActiveCategory(category.id)}
              >
                {category.label}
              </button>
            );
          })}
        </div>

        {(activeCategory === 'soup' || showSearchResults) ? (
          <div className="soup-course-section">
            <div className="section-heading soup-course-heading">
              <h2>먼저 탕 칸 수 고르기</h2>
              <p>
                한가지, 두가지, 네가지 중 하나를 정한 뒤 그 형태에 맞는 탕만 담습니다.
              </p>
            </div>

            <div className="option-grid soup-course-grid">
              {SOUP_COURSE_OPTIONS.map((option) => {
                const isSelected = option.id === soupCourse;

                return (
                  <button
                    key={option.id}
                    className={`option-card ${isSelected ? 'is-selected' : ''}`}
                    type="button"
                    onClick={() => onSelectSoupCourse(option.id)}
                  >
                    <strong>{option.label}</strong>
                    <span>{option.helper}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {showSearchResults ? (
          totalSearchResults > 0 ? (
            <div className="search-result-groups">
              {groupedSearchResults.map((group) => (
                <section key={group.id} className="search-result-group">
                  <div className="search-result-group-header">
                    <strong>{group.label}</strong>
                    <span>{group.items.length}개</span>
                  </div>

                  <div className="menu-card-list">
                    {group.items.map((item) => {
                      const quantity = quantities[item.id] ?? 0;
                      const displayName = getDisplayName(item, group.id);

                      return (
                        <article key={item.id} className={`menu-card ${quantity > 0 ? 'is-active' : ''}`}>
                          <div className="menu-card-copy">
                            <strong>{displayName}</strong>
                            <span>{formatCurrency(item.price ?? 0)}</span>
                          </div>

                          <div className="quantity-pad">
                            <button
                              type="button"
                              aria-label={`${item.name} 수량 줄이기`}
                              onClick={() => onQuantityChange(item.id, quantity - 1)}
                            >
                              -
                            </button>
                            <strong>{quantity}</strong>
                            <button
                              type="button"
                              aria-label={`${item.name} 수량 늘리기`}
                              onClick={() => onQuantityChange(item.id, quantity + 1)}
                            >
                              +
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="menu-empty-state">
              <strong>검색 결과가 없어요</strong>
              <p>메뉴 이름 일부만 입력하거나 다른 표현으로 다시 찾아보세요.</p>
            </div>
          )
        ) : (
          <div className="menu-card-list">
            {filteredItems.map((item) => {
              const quantity = quantities[item.id] ?? 0;
              const displayName = getDisplayName(item, activeCategory);

              return (
                <article key={item.id} className={`menu-card ${quantity > 0 ? 'is-active' : ''}`}>
                  <div className="menu-card-copy">
                    <strong>{displayName}</strong>
                    <span>{formatCurrency(item.price ?? 0)}</span>
                  </div>

                  <div className="quantity-pad">
                    <button
                      type="button"
                      aria-label={`${item.name} 수량 줄이기`}
                      onClick={() => onQuantityChange(item.id, quantity - 1)}
                    >
                      -
                    </button>
                    <strong>{quantity}</strong>
                    <button
                      type="button"
                      aria-label={`${item.name} 수량 늘리기`}
                      onClick={() => onQuantityChange(item.id, quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <CartSummary
        peopleCount={peopleCount}
        summary={summary}
        onConfirm={onShowResult}
      />
    </section>
  );
}

export default MenuEditor;
