import { formatCurrency } from '../utils/formatter.js';

function CartSummary({ peopleCount, summary, onConfirm }) {
  return (
    <aside className="sticky-cart-summary">
      <div className="sticky-cart-copy">
        <span>
          {peopleCount}명 · 메뉴 {summary.totalQuantity}개
        </span>
        <strong>{formatCurrency(summary.totalPrice)}</strong>
      </div>

      <div className="sticky-cart-meta">
        <span>1인당 {formatCurrency(summary.pricePerPerson)}</span>
        <span>포만감 {summary.fullnessScore.toFixed(1)}</span>
      </div>

      <button className="primary-action" type="button" onClick={onConfirm}>
        결과 보기
      </button>
    </aside>
  );
}

export default CartSummary;
