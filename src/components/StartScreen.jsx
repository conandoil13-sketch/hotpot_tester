function StartScreen({ onStart }) {
  return (
    <main className="start-screen">
      <section className="start-card">
        <p className="eyebrow">훠궈 예산 시뮬레이터</p>
        <h1 className="start-title">오늘 훠궈 얼마 나옴?</h1>
        <p className="start-description">인원과 취향을 고르면 예상 주문 금액을 계산해줌</p>
        <button className="start-button" type="button" onClick={onStart}>
          시작하기
        </button>
      </section>
    </main>
  );
}

export default StartScreen;
