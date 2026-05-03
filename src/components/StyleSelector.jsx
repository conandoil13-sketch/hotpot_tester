function StyleSelector({ presets, selectedPresetId, onApplyPreset, onStartCustomCart }) {
  return (
    <section className="panel-card">
      <div className="section-heading">
        <h1>어떤 스타일로 먹을까요?</h1>
        <p>프리셋을 고르면 장바구니가 자동으로 채워지고, 다음 단계에서 수량을 자유롭게 고칠 수 있습니다.</p>
      </div>

      <div className="preset-grid">
        <button
          className={`preset-card ${selectedPresetId === 'custom' ? 'is-selected' : ''}`}
          type="button"
          onClick={onStartCustomCart}
        >
          <div className="preset-card-header">
            <strong>내가 직접 담기</strong>
            <span>{selectedPresetId === 'custom' ? '선택됨' : '선택'}</span>
          </div>
          <p>프리셋 없이 빈 장바구니로 시작해서 원하는 메뉴만 직접 담습니다.</p>
          <div className="tag-row">
            <span className="tag-chip">수동 시작</span>
            <span className="tag-chip">자유 조합</span>
            <span className="tag-chip">내 취향 우선</span>
          </div>
        </button>

        {presets.map((preset) => {
          const isSelected = preset.id === selectedPresetId;

          return (
            <button
              key={preset.id}
              className={`preset-card ${isSelected ? 'is-selected' : ''}`}
              type="button"
              onClick={() => onApplyPreset(preset)}
            >
              <div className="preset-card-header">
                <strong>{preset.name}</strong>
                <span>{isSelected ? '선택됨' : '선택'}</span>
              </div>
              <p>{preset.description}</p>
              <div className="tag-row">
                {preset.tags.map((tag) => (
                  <span key={tag} className="tag-chip">
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default StyleSelector;
