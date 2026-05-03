import { useEffect, useMemo, useRef, useState } from 'react';
import StartScreen from './components/StartScreen.jsx';
import PeopleSelector from './components/PeopleSelector.jsx';
import StyleSelector from './components/StyleSelector.jsx';
import MenuEditor from './components/MenuEditor.jsx';
import SauceSelector from './components/SauceSelector.jsx';
import ResultCard from './components/ResultCard.jsx';
import { toPng } from 'html-to-image';
import menu from './data/menu.json';
import presets from './data/presets.json';
import sauces from './data/sauces.json';
import { calculateCartSummary } from './utils/priceCalculator.js';
import { buildSimulationResult } from './utils/resultAnalyzer.js';
import { formatCurrency, formatPeopleLabel } from './utils/formatter.js';

const STEPS = {
  start: 'start',
  people: 'people',
  style: 'style',
  editor: 'editor',
  sauce: 'sauce',
  result: 'result',
};

const STEP_META = {
  [STEPS.people]: { index: 1, label: '인원 선택' },
  [STEPS.style]: { index: 2, label: '스타일 선택' },
  [STEPS.editor]: { index: 3, label: '메뉴 조정' },
  [STEPS.sauce]: { index: 4, label: '소스 조합' },
  [STEPS.result]: { index: 5, label: '결과 확인' },
};

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

function buildCartFromQuantities(menuItems, quantities) {
  return menuItems
    .map((item) => ({
      ...item,
      quantity: quantities[item.id] ?? 0,
    }))
    .filter((item) => item.quantity > 0);
}

function buildQuantitiesFromPreset(preset, peopleCount) {
  return preset.items.reduce((accumulator, presetItem) => {
    const quantity =
      presetItem.quantityType === 'perPerson' ? peopleCount : (presetItem.quantity ?? 0);
    accumulator[presetItem.menuId] = quantity;
    return accumulator;
  }, {});
}

function inferSoupCourseFromPreset(preset) {
  const firstSoupItem = preset.items
    .map((item) => menu.find((menuItem) => menuItem.id === item.menuId))
    .find((menuItem) => menuItem?.category === 'soup');

  return getSoupCourseFromName(firstSoupItem?.name) ?? 'quad';
}

function StepHeader({ currentStep, onBack }) {
  const stepInfo = STEP_META[currentStep];

  if (!stepInfo) {
    return null;
  }

  return (
    <header className="step-header">
      <button className="step-back-button" type="button" onClick={onBack}>
        이전
      </button>
      <div className="step-header-copy">
        <span>
          {stepInfo.index}/5 단계
        </span>
        <strong>{stepInfo.label}</strong>
      </div>
    </header>
  );
}

function App() {
  const [step, setStep] = useState(STEPS.start);
  const [peopleCount, setPeopleCount] = useState(2);
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [quantities, setQuantities] = useState({});
  const [soupCourse, setSoupCourse] = useState('quad');
  const [selectedSauceIds, setSelectedSauceIds] = useState([]);
  const [toastMessage, setToastMessage] = useState('');
  const resultCardRef = useRef(null);
  const receiptCardRef = useRef(null);

  const selectedPreset = presets.find((preset) => preset.id === selectedPresetId) ?? null;
  const selectedSauces = sauces.filter((sauce) => selectedSauceIds.includes(sauce.id));
  const cart = useMemo(() => buildCartFromQuantities(menu, quantities), [quantities]);
  const summary = useMemo(
    () => calculateCartSummary(cart, peopleCount),
    [cart, peopleCount],
  );
  const result = useMemo(
    () =>
      buildSimulationResult({
        cart,
        menuData: menu,
        peopleCount,
        calculationResult: summary,
      }),
    [cart, peopleCount, summary],
  );
  const siteUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return 'https://conandoil13-sketch.github.io/hotpot_tester/';
    }

    return window.location.href;
  }, []);
  const shareMessage = useMemo(() => {
    return [
      '오늘 훠궈 예상 견적',
      `${formatPeopleLabel(peopleCount)} / 총 ${formatCurrency(summary.totalPrice)} / 1인당 ${formatCurrency(summary.pricePerPerson)}`,
      `결과: ${result.typeTitle}`,
      `너도 계산해보기: ${siteUrl}`,
    ].join('\n');
  }, [peopleCount, result.typeTitle, siteUrl, summary.pricePerPerson, summary.totalPrice]);
  const xShareMessage = useMemo(() => {
    return [
      '오늘 훠궈 예상 견적',
      `${formatPeopleLabel(peopleCount)} / 총 ${formatCurrency(summary.totalPrice)} / 1인당 ${formatCurrency(summary.pricePerPerson)}`,
      `결과: ${result.typeTitle}`,
      result.shareText,
      siteUrl,
    ].join('\n');
  }, [
    peopleCount,
    result.shareText,
    result.typeTitle,
    siteUrl,
    summary.pricePerPerson,
    summary.totalPrice,
  ]);

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setToastMessage('');
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  const showToast = (message) => {
    setToastMessage(message);
  };

  const handleCopyResult = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      showToast('복사 완료');
    } catch (error) {
      console.error(error);
      showToast('복사 실패');
    }
  };

  const handleShareLink = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: '오늘 훠궈 얼마 나옴?',
          text: shareMessage,
          url: siteUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(siteUrl);
      showToast('링크 복사 완료');
    } catch (error) {
      console.error(error);
      showToast('링크 공유 실패');
    }
  };

  const downloadDataUrl = (dataUrl, fileName) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    link.click();
  };

  const handleSaveResultImage = async () => {
    try {
      if (!resultCardRef.current) {
        throw new Error('결과 카드 영역을 찾을 수 없습니다.');
      }

      const dataUrl = await toPng(resultCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#160d12',
      });

      downloadDataUrl(dataUrl, 'hotpot-result-card.png');
      showToast('PNG 저장 완료');
    } catch (error) {
      console.error(error);
      showToast('PNG 저장 실패');
    }
  };

  const handleSaveReceiptImage = async () => {
    try {
      if (!receiptCardRef.current) {
        throw new Error('영수증 영역을 찾을 수 없습니다.');
      }

      const dataUrl = await toPng(receiptCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#f8f4eb',
      });

      downloadDataUrl(dataUrl, 'hotpot-receipt.png');
      showToast('영수증 저장 완료');
    } catch (error) {
      console.error(error);
      showToast('영수증 저장 실패');
    }
  };

  const handleShareX = async () => {
    try {
      const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(xShareMessage)}`;

      if (typeof window !== 'undefined') {
        window.open(intentUrl, '_blank', 'noopener,noreferrer');
      }

      await navigator.clipboard.writeText(xShareMessage);
      showToast('X 문구 복사 완료');
    } catch (error) {
      console.error(error);
      showToast('X 공유 실패');
    }
  };

  const handleStart = () => {
    setStep(STEPS.people);
  };

  const handleSelectPeopleCount = (nextPeopleCount) => {
    setPeopleCount(nextPeopleCount);
  };

  const handleContinueToStyle = () => {
    setStep(STEPS.style);
  };

  const handlePresetApply = (preset) => {
    setSelectedPresetId(preset.id);
    setQuantities(buildQuantitiesFromPreset(preset, peopleCount));
    setSoupCourse(inferSoupCourseFromPreset(preset));
    setStep(STEPS.editor);
  };

  const handleQuantityChange = (menuId, nextQuantity) => {
    setQuantities((currentQuantities) => {
      const safeQuantity = Math.max(0, nextQuantity);

      if (safeQuantity === 0) {
        const { [menuId]: _removed, ...rest } = currentQuantities;
        return rest;
      }

      return {
        ...currentQuantities,
        [menuId]: safeQuantity,
      };
    });
  };

  const handleOpenResult = () => {
    setStep(STEPS.sauce);
  };

  const handleOpenSauceResult = () => {
    setStep(STEPS.result);
  };

  const handleRestart = () => {
    setStep(STEPS.start);
    setPeopleCount(2);
    setSelectedPresetId('');
    setQuantities({});
    setSoupCourse('quad');
    setSelectedSauceIds([]);
  };

  const handleSelectSoupCourse = (nextSoupCourse) => {
    const soupIds = menu
      .filter((item) => item.category === 'soup')
      .map((item) => item.id);

    setSoupCourse(nextSoupCourse);
    setQuantities((currentQuantities) => {
      const nextQuantities = { ...currentQuantities };

      for (const soupId of soupIds) {
        delete nextQuantities[soupId];
      }

      return nextQuantities;
    });
  };

  const handleBack = () => {
    if (step === STEPS.style) {
      setStep(STEPS.people);
      return;
    }

    if (step === STEPS.editor) {
      setStep(STEPS.style);
      return;
    }

    if (step === STEPS.sauce) {
      setStep(STEPS.editor);
      return;
    }

    if (step === STEPS.result) {
      setStep(STEPS.sauce);
    }
  };

  return (
    <div className="app-shell">
      {step === STEPS.start ? (
        <StartScreen onStart={handleStart} />
      ) : (
        <main className="app-layout">
          <StepHeader currentStep={step} onBack={handleBack} />

          {step === STEPS.people ? (
            <PeopleSelector
              peopleCount={peopleCount}
              onChange={handleSelectPeopleCount}
              onNext={handleContinueToStyle}
            />
          ) : null}

          {step === STEPS.style ? (
            <StyleSelector
              presets={presets}
              selectedPresetId={selectedPresetId}
              onApplyPreset={handlePresetApply}
              onStartCustomCart={() => {
                setSelectedPresetId('custom');
                setQuantities({});
                setSoupCourse('quad');
                setStep(STEPS.editor);
              }}
            />
          ) : null}

          {step === STEPS.editor ? (
            <MenuEditor
              menuItems={menu}
              quantities={quantities}
              peopleCount={peopleCount}
              selectedPreset={selectedPreset}
              soupCourse={soupCourse}
              summary={summary}
              onQuantityChange={handleQuantityChange}
              onSelectSoupCourse={handleSelectSoupCourse}
              onShowResult={handleOpenResult}
            />
          ) : null}

          {step === STEPS.sauce ? (
            <SauceSelector
              sauces={sauces}
              peopleCount={peopleCount}
              selectedSauceIds={selectedSauceIds}
              onSelectSauces={setSelectedSauceIds}
              onSkip={handleOpenSauceResult}
              onNext={handleOpenSauceResult}
            />
          ) : null}

          {step === STEPS.result ? (
            <ResultCard
              resultCardRef={resultCardRef}
              receiptCardRef={receiptCardRef}
              result={result}
              summary={summary}
              peopleCount={peopleCount}
              cart={cart}
              selectedSauces={selectedSauces}
              shareMessage={shareMessage}
              xShareMessage={xShareMessage}
              onCopyResult={handleCopyResult}
              onShareLink={handleShareLink}
              onSaveImage={handleSaveResultImage}
              onSaveReceipt={handleSaveReceiptImage}
              onShareX={handleShareX}
              onRestart={handleRestart}
            />
          ) : null}
        </main>
      )}

      {toastMessage ? (
        <div className="app-toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}

export default App;
