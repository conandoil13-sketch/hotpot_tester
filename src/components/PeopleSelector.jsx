const PEOPLE_OPTIONS = [
  { value: 1, label: '1명' },
  { value: 2, label: '2명' },
  { value: 3, label: '3명' },
  { value: 4, label: '4명' },
  { value: 5, label: '5명' },
];

function PeopleSelector({ peopleCount, onChange, onNext }) {
  const isCustomSelected = peopleCount > 5;

  return (
    <section className="panel-card">
      <div className="section-heading">
        <h1>몇 명이서 먹나요?</h1>
        <p>인원 수를 먼저 고르면 1인당 가격과 프리셋 구성이 더 자연스럽게 맞춰집니다.</p>
      </div>

      <div className="option-grid">
        {PEOPLE_OPTIONS.map((option) => {
          const isSelected = option.value === peopleCount;

          return (
            <button
              key={option.value}
              className={`option-card ${isSelected ? 'is-selected' : ''}`}
              type="button"
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          );
        })}

        <button
          className={`option-card ${isCustomSelected ? 'is-selected' : ''}`}
          type="button"
          onClick={() => onChange(Math.max(6, peopleCount))}
        >
          직접 입력
        </button>
      </div>

      {isCustomSelected ? (
        <label className="custom-people-field">
          <span>직접 입력한 인원</span>
          <input
            type="number"
            min="6"
            step="1"
            value={peopleCount}
            onChange={(event) => onChange(Math.max(6, Number(event.target.value) || 6))}
          />
        </label>
      ) : null}

      <button className="primary-action" type="button" onClick={onNext}>
        이 인원으로 계속하기
      </button>
    </section>
  );
}

export default PeopleSelector;
