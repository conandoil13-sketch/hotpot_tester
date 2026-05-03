import { formatCurrency } from '../utils/formatter.js';

function PepperMeter({ level = 1 }) {
  const safeLevel = Math.min(5, Math.max(1, level));

  return (
    <div className="pepper-meter" aria-label={`지갑 위험도 ${safeLevel}단계`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={`pepper-${index + 1}`}
          className={`pepper-dot ${index < safeLevel ? 'is-active' : ''}`}
        >
          🌶️
        </span>
      ))}
    </div>
  );
}

function formatReceiptLineName(item) {
  return item?.category === 'soup'
    ? String(item?.name ?? '').replace(/^.+?옵션 -\s*/, '')
    : item?.name ?? '';
}

function formatReceiptDate() {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
}

function ResultSummaryBlock({ result, summary, peopleCount, selectedSauces, shareMessage }) {
  return (
    <>
      <div className="result-card-topline">
        <span>오늘의 훠궈 견적서</span>
        <strong>{peopleCount}명 주문 기준</strong>
      </div>

      <div className="result-price-block">
        <div className="result-price-main">
          <span>총액</span>
          <strong>{formatCurrency(summary.totalPrice)}</strong>
        </div>
        <div className="result-price-sub">
          <span>1인당</span>
          <strong>{formatCurrency(summary.pricePerPerson)}</strong>
        </div>
      </div>

      <div className="result-meme-block">
        <p className="result-type-badge">{result.typeTitle}</p>
        <h1 className="result-one-liner">{result.typeDescription}</h1>
        <p className="result-spicy-copy">{result.spicyComment}</p>
      </div>

      <div className="result-detail-grid">
        <div className="result-detail-card">
          <span>지갑 위험도</span>
          <PepperMeter level={result.walletRiskLevel} />
          <strong>{result.walletRiskLabel}</strong>
        </div>

        <div className="result-detail-card">
          <span>포만감 상태</span>
          <strong>{result.fullnessLabel}</strong>
          <p>메뉴 {summary.totalQuantity}개로 계산됨</p>
        </div>
      </div>

      <div className="result-share-box">
        <span>공유용 한 줄</span>
        <strong>{result.shareText}</strong>
        <p>{shareMessage}</p>
      </div>

      {selectedSauces.length > 0 ? (
        <div className="result-sauce-box">
          <span>같이 고른 소스 조합</span>
          <strong>{selectedSauces.length}개 선택</strong>
          <div className="result-sauce-list">
            {selectedSauces.map((sauce) => (
              <div key={sauce.id} className="result-sauce-item">
                <p>
                  {sauce.name} · #{sauce.keyword} · 재료 {sauce.ingredientCount}개
                </p>
                <div className="tag-row sauce-result-tags">
                  {sauce.ingredients.slice(0, 4).map((ingredient) => (
                    <span key={`${sauce.id}-${ingredient.raw}`} className="tag-chip">
                      {ingredient.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

function ResultCard({
  resultCardRef,
  receiptCardRef,
  result,
  summary,
  peopleCount,
  cart,
  selectedSauces,
  shareMessage,
  xShareMessage,
  onCopyResult,
  onShareLink,
  onSaveImage,
  onSaveReceipt,
  onShareX,
  onRestart,
}) {
  const receiptDate = formatReceiptDate();

  return (
    <>
      <section ref={resultCardRef} className="panel-card result-card">
        <div className="result-card-glow" />

        <div className="result-card-inner">
          <ResultSummaryBlock
            result={result}
            summary={summary}
            peopleCount={peopleCount}
            selectedSauces={selectedSauces}
            shareMessage={shareMessage}
          />

          <div className="result-footer">
            <button className="secondary-action result-copy-button" type="button" onClick={onCopyResult}>
              결과 텍스트 복사하기
            </button>
            <button className="primary-action" type="button" onClick={onRestart}>
              다시 하기
            </button>
            <button className="secondary-action result-link-button" type="button" onClick={onShareLink}>
              링크 공유하기
            </button>
            <button className="secondary-action result-save-button" type="button" onClick={onSaveImage}>
              결과 카드 PNG 저장
            </button>
            <button className="secondary-action result-receipt-button" type="button" onClick={onSaveReceipt}>
              영수증 저장
            </button>
            <button className="secondary-action result-x-button" type="button" onClick={onShareX}>
              X 공유 문구 만들기
            </button>
          </div>
        </div>
      </section>

      <div className="receipt-capture-shell" aria-hidden="true">
        <section ref={receiptCardRef} className="receipt-capture-card">
          <div className="receipt-header">
            <strong>HOTPOT ORDER RECEIPT</strong>
            <span>오늘의 훠궈 예상 견적 영수증</span>
          </div>

          <div className="receipt-meta">
            <div>
              <span>주문 인원</span>
              <strong>{peopleCount}명</strong>
            </div>
            <div>
              <span>생성 시각</span>
              <strong>{receiptDate}</strong>
            </div>
          </div>

          <div className="receipt-divider" />

          <div className="receipt-line-items">
            {cart.map((item) => (
              <div key={`receipt-${item.id}`} className="receipt-line-item">
                <div className="receipt-line-copy">
                  <strong>{formatReceiptLineName(item)}</strong>
                  <span>{item.quantity}개</span>
                </div>
                <strong>{formatCurrency((item.price ?? 0) * (item.quantity ?? 0))}</strong>
              </div>
            ))}
          </div>

          {selectedSauces.length > 0 ? (
            <>
              <div className="receipt-divider dashed" />
              <div className="receipt-extra">
                <span>추천 소스 조합</span>
                {selectedSauces.map((sauce) => (
                  <div key={`receipt-sauce-${sauce.id}`} className="receipt-extra-item">
                    <strong>{sauce.name}</strong>
                    <p>{sauce.ingredientText.slice(0, 5).join(' / ')}</p>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          <div className="receipt-divider" />

          <div className="receipt-summary">
            <div>
              <span>총 메뉴 수량</span>
              <strong>{summary.totalQuantity}개</strong>
            </div>
            <div>
              <span>총액</span>
              <strong>{formatCurrency(summary.totalPrice)}</strong>
            </div>
            <div>
              <span>1인당</span>
              <strong>{formatCurrency(summary.pricePerPerson)}</strong>
            </div>
          </div>

          <div className="receipt-result-box">
            <span>결과 요약</span>
            <strong>{result.typeTitle}</strong>
            <p>{result.typeDescription}</p>
            <em>{result.shareText}</em>
          </div>

          <div className="receipt-footer">
            <span>{xShareMessage}</span>
          </div>
        </section>
      </div>
    </>
  );
}

export default ResultCard;
