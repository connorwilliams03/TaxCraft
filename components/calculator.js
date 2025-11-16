import { useCallback, useMemo, useRef, useState } from 'react';

const PERSONAL_ALLOWANCE = 12570;
const BASIC_RATE_LIMIT = 37700;
const HIGHER_RATE_LIMIT = 125140 - PERSONAL_ALLOWANCE;
const BASIC_RATE = 0.2;
const HIGHER_RATE = 0.4;
const ADDITIONAL_RATE = 0.45;
const TRADING_ALLOWANCE = 1000;
const CLASS_4_LOWER = 12570;
const CLASS_4_UPPER = 50270;
const CLASS_4_LOWER_RATE = 0.09;
const CLASS_4_UPPER_RATE = 0.02;
const CLASS_2_WEEKLY = 3.45;

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value);

function calculateTax({ income, expenses, useTradingAllowance, payClass2 }) {
  const allowableExpenses = useTradingAllowance ? Math.max(expenses, TRADING_ALLOWANCE) : expenses;
  const profit = Math.max(0, income - allowableExpenses);

  let taxableIncome = Math.max(0, profit - PERSONAL_ALLOWANCE);
  let incomeTax = 0;

  if (taxableIncome > 0) {
    const basicBand = Math.min(taxableIncome, BASIC_RATE_LIMIT);
    incomeTax += basicBand * BASIC_RATE;
    taxableIncome -= basicBand;
  }

  if (taxableIncome > 0) {
    const higherBand = Math.min(taxableIncome, HIGHER_RATE_LIMIT - BASIC_RATE_LIMIT);
    incomeTax += higherBand * HIGHER_RATE;
    taxableIncome -= higherBand;
  }

  if (taxableIncome > 0) {
    incomeTax += taxableIncome * ADDITIONAL_RATE;
  }

  const class4Lower = Math.max(0, Math.min(profit - CLASS_4_LOWER, CLASS_4_UPPER - CLASS_4_LOWER));
  const class4Upper = Math.max(0, profit - CLASS_4_UPPER);
  const class4 = class4Lower * CLASS_4_LOWER_RATE + class4Upper * CLASS_4_UPPER_RATE;

  const class2 = payClass2 ? CLASS_2_WEEKLY * 52 : 0;

  const totalTax = incomeTax + class4 + class2;
  const net = profit - totalTax;

  return {
    profit,
    incomeTax,
    class4,
    class2,
    net,
  };
}

export default function Calculator() {
  const [income, setIncome] = useState('');
  const [expenses, setExpenses] = useState('');
  const [useTradingAllowance, setUseTradingAllowance] = useState(true);
  const [payClass2, setPayClass2] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const resultRef = useRef(null);

  const parsedIncome = useMemo(() => parseFloat(income) || 0, [income]);
  const parsedExpenses = useMemo(() => parseFloat(expenses) || 0, [expenses]);

  const handleCalculate = useCallback(() => {
    if (parsedIncome <= 0) {
      setError('Enter an annual income above zero.');
      setResult(null);
      return;
    }

    if (parsedExpenses < 0) {
      setError('Expenses cannot be negative.');
      setResult(null);
      return;
    }

    setError('');
    setResult(
      calculateTax({
        income: parsedIncome,
        expenses: parsedExpenses,
        useTradingAllowance,
        payClass2,
      })
    );
  }, [parsedIncome, parsedExpenses, useTradingAllowance, payClass2]);

  const exportPDF = useCallback(async () => {
    if (!resultRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const canvas = await html2canvas(resultRef.current);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth() - 40;
      const pageHeight = pdf.internal.pageSize.getHeight() - 40;
      const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
      const width = canvas.width * ratio;
      const height = canvas.height * ratio;
      pdf.addImage(imgData, 'PNG', 20, 20, width, height);
      pdf.save('taxcraft-report.pdf');
    } catch (err) {
      console.error(err);
      alert('Unable to export PDF in this environment.');
    } finally {
      setExporting(false);
    }
  }, []);

  const copyResult = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      alert('Result copied to clipboard');
    } catch (err) {
      console.error(err);
      alert('Clipboard unavailable, please copy manually.');
    }
  }, [result]);

  return (
    <div className="calculator card">
      <h3>Self-Employment Tax Estimator</h3>

      <div className="grid-two">
        <label>
          <span>Gross income (annual)</span>
          <input
            type="number"
            min="0"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            placeholder="50000"
          />
        </label>

        <label>
          <span>Allowable expenses</span>
          <input
            type="number"
            min="0"
            value={expenses}
            onChange={(e) => setExpenses(e.target.value)}
            placeholder="12000"
          />
        </label>
      </div>

      <label className="option">
        <input
          type="checkbox"
          checked={useTradingAllowance}
          onChange={(e) => setUseTradingAllowance(e.target.checked)}
        />
        Use GBP 1,000 trading allowance if beneficial
      </label>

      <label className="option">
        <input
          type="checkbox"
          checked={payClass2}
          onChange={(e) => setPayClass2(e.target.checked)}
        />
        Pay voluntary Class 2 NICs
      </label>

      <button className="btn-primary" onClick={handleCalculate}>
        Calculate
      </button>

      {error && <div className="message error">{error}</div>}

      {result && (
        <div className="results" ref={resultRef}>
          <div className="results-card">
            <div>Profit: {formatCurrency(result.profit)}</div>
            <div>Income tax: {formatCurrency(result.incomeTax)}</div>
            <div>Class 4 NICs: {formatCurrency(result.class4)}</div>
            <div>Class 2 NICs: {formatCurrency(result.class2)}</div>
            <div className="net">Net take-home: {formatCurrency(result.net)}</div>
          </div>

          <div className="actions">
            <button className="btn-ghost" onClick={exportPDF} disabled={exporting}>
              {exporting ? 'Preparing...' : 'Export PDF'}
            </button>
            <button className="btn-ghost" onClick={copyResult}>
              Copy JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
