import { useMemo, useState } from 'react';

const KEYWORD_LABELS = {
  매콤: '매콤',
  짭잘: '짭짤',
  새콤: '새콤',
  달콤: '달콤',
  고소: '고소',
};

function SauceSelector({
  sauces,
  peopleCount,
  selectedSauceIds,
  onSelectSauces,
  onSkip,
  onNext,
}) {
  const [wantsSauce, setWantsSauce] = useState(selectedSauceIds.length > 0 ? 'yes' : '');
  const [activeKeyword, setActiveKeyword] = useState('all');
  const [expandedSauceIds, setExpandedSauceIds] = useState([]);
  const [checkedIngredientsBySauce, setCheckedIngredientsBySauce] = useState({});

  const keywords = useMemo(() => {
    return ['all', ...new Set(sauces.map((sauce) => sauce.keyword).filter(Boolean))];
  }, [sauces]);

  const filteredSauces = useMemo(() => {
    const base = [...sauces].sort((left, right) => right.viewCount - left.viewCount);

    if (activeKeyword === 'all') {
      return base;
    }

    return base.filter((sauce) => sauce.keyword === activeKeyword);
  }, [activeKeyword, sauces]);

  const canContinue = wantsSauce === 'no' || selectedSauceIds.length > 0;

  const handleToggleSauce = (sauceId) => {
    const isSelected = selectedSauceIds.includes(sauceId);

    if (isSelected) {
      onSelectSauces(selectedSauceIds.filter((id) => id !== sauceId));
      return;
    }

    if (selectedSauceIds.length >= peopleCount) {
      return;
    }

    onSelectSauces([...selectedSauceIds, sauceId]);
  };

  const handleToggleExpanded = (sauceId) => {
    setExpandedSauceIds((currentIds) =>
      currentIds.includes(sauceId)
        ? currentIds.filter((id) => id !== sauceId)
        : [...currentIds, sauceId],
    );
  };

  const handleToggleIngredient = (sauceId, ingredientRaw) => {
    setCheckedIngredientsBySauce((currentState) => {
      const currentChecked = currentState[sauceId] ?? [];
      const nextChecked = currentChecked.includes(ingredientRaw)
        ? currentChecked.filter((item) => item !== ingredientRaw)
        : [...currentChecked, ingredientRaw];

      return {
        ...currentState,
        [sauceId]: nextChecked,
      };
    });
  };

  return (
    <section className="panel-card sauce-step-card">
      <div className="section-heading">
        <h1>소스 조합도 정하고 갈까?</h1>
        <p>원하면 인기 소스 조합을 인원수만큼 골라서 결과 화면에 붙여드립니다.</p>
      </div>

      <div className="option-grid sauce-choice-grid">
        <button
          className={`option-card ${wantsSauce === 'yes' ? 'is-selected' : ''}`}
          type="button"
          onClick={() => setWantsSauce('yes')}
        >
          <strong>좋아, 소스도 고르기</strong>
          <span>인기 조합 보고 하나 픽하기</span>
        </button>
        <button
          className={`option-card ${wantsSauce === 'no' ? 'is-selected' : ''}`}
          type="button"
          onClick={() => {
            setWantsSauce('no');
            onSelectSauces([]);
          }}
        >
          <strong>괜찮아, 바로 결과 보기</strong>
          <span>소스는 현장 감으로 해결</span>
        </button>
      </div>

      {wantsSauce === 'yes' ? (
        <div className="sauce-picker-section">
          <p className="menu-search-meta">
            최대 {peopleCount}개까지 선택 가능 · 현재 {selectedSauceIds.length}개 선택됨
          </p>

          <div className="sauce-keyword-row" role="tablist" aria-label="소스 키워드">
            {keywords.map((keyword) => {
              const isActive = keyword === activeKeyword;
              const label = keyword === 'all' ? '전체' : (KEYWORD_LABELS[keyword] ?? keyword);

              return (
                <button
                  key={keyword}
                  className={`tag-chip sauce-keyword-chip ${isActive ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => setActiveKeyword(keyword)}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="sauce-card-list">
            {filteredSauces.map((sauce) => {
              const isSelected = selectedSauceIds.includes(sauce.id);
              const isDisabled = !isSelected && selectedSauceIds.length >= peopleCount;
              const isExpanded = expandedSauceIds.includes(sauce.id);
              const checkedIngredients = checkedIngredientsBySauce[sauce.id] ?? [];

              return (
                <article
                  key={sauce.id}
                  className={`sauce-card ${isSelected ? 'is-selected' : ''} ${isDisabled ? 'is-disabled' : ''}`}
                >
                  <div className="sauce-card-top">
                    <button
                      className="sauce-select-button"
                      type="button"
                      onClick={() => handleToggleSauce(sauce.id)}
                      disabled={isDisabled}
                    >
                      <strong>{sauce.name}</strong>
                      <span>{isSelected ? '선택됨' : isDisabled ? '선택 마감' : '선택 가능'}</span>
                    </button>
                    <button
                      className="sauce-expand-button"
                      type="button"
                      onClick={() => handleToggleExpanded(sauce.id)}
                    >
                      {isExpanded ? '접기' : '레시피 전체'}
                    </button>
                  </div>
                  <p>
                    #{KEYWORD_LABELS[sauce.keyword] ?? sauce.keyword} · 재료 {sauce.ingredientCount}개
                  </p>
                  <div className="tag-row sauce-ingredient-row">
                    {sauce.ingredients.slice(0, 4).map((ingredient) => (
                      <span key={`${sauce.id}-${ingredient.raw}`} className="tag-chip">
                        {ingredient.name}
                      </span>
                    ))}
                  </div>

                  {isExpanded ? (
                    <div className="sauce-recipe-panel">
                      <div className="sauce-recipe-header">
                        <strong>전체 레시피 체크</strong>
                        <span>{checkedIngredients.length}/{sauce.ingredients.length} 체크됨</span>
                      </div>

                      <div className="sauce-recipe-list">
                        {sauce.ingredients.map((ingredient) => {
                          const isChecked = checkedIngredients.includes(ingredient.raw);

                          return (
                            <label
                              key={`${sauce.id}-${ingredient.raw}-checkbox`}
                              className={`sauce-recipe-item ${isChecked ? 'is-checked' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleIngredient(sauce.id, ingredient.raw)}
                              />
                              <span>{ingredient.raw}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      ) : null}

      <aside className="sticky-cart-summary sauce-floating-summary">
        <div className="sticky-cart-copy">
          <span>
            {wantsSauce === 'yes'
              ? `소스 ${selectedSauceIds.length}/${peopleCount}개 선택`
              : '소스 선택 없이 결과로 이동'}
          </span>
          <strong>{wantsSauce === 'yes' ? '취향 반영 중' : '바로 진행'}</strong>
        </div>

        <div className="sticky-cart-meta">
          <span>
            {wantsSauce === 'yes'
              ? '인원수만큼 여러 조합 선택 가능'
              : '현장 감으로 소스 해결'}
          </span>
        </div>

        <button
          className="primary-action"
          type="button"
          onClick={() => {
            if (wantsSauce === 'no') {
              onSkip();
              return;
            }

            onNext();
          }}
          disabled={!canContinue}
        >
          결과 보러 가기
        </button>
      </aside>
    </section>
  );
}

export default SauceSelector;
