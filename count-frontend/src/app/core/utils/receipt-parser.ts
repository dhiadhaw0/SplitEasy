export interface ParsedReceipt {
  amount: number | null;
  date: string | null;
  merchant: string | null;
}

const AMOUNT_KEYWORDS = /total|montant|net\s*à\s*payer|à\s*payer|amount\s*due/i;
const NUMBER_PATTERN = /\d+(?:[ .,]\d+)*/g;
const DATE_PATTERN = /\b(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})\b|\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/;

/**
 * Best-effort extraction of the total amount, date and merchant name from a receipt's raw OCR
 * text. Receipts vary wildly in layout, so this is a set of heuristics, not a guarantee — the
 * caller always shows the result as an editable, pre-filled form rather than trusting it blindly.
 */
export function parseReceiptText(rawText: string): ParsedReceipt {
  const lines = rawText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  return {
    amount: extractAmount(lines),
    date: extractDate(rawText),
    merchant: extractMerchant(lines)
  };
}

function extractAmount(lines: string[]): number | null {
  const allAmounts: number[] = [];
  let keywordAmount: number | null = null;

  for (const line of lines) {
    const amounts = [...line.matchAll(NUMBER_PATTERN)]
      .map(match => normalizeAmount(match[0]))
      .filter((value): value is number => value !== null && value > 0);

    if (amounts.length === 0) {
      continue;
    }

    allAmounts.push(...amounts);
    if (AMOUNT_KEYWORDS.test(line)) {
      // On a "TOTAL ... 45,90" line the amount is virtually always the last number.
      keywordAmount = amounts[amounts.length - 1];
    }
  }

  if (keywordAmount !== null) {
    return keywordAmount;
  }
  // No explicit "total" line found: the total is usually the largest amount printed
  // (it's the sum of every line item, so it's rarely smaller than any of them).
  return allAmounts.length > 0 ? Math.max(...allAmounts) : null;
}

function normalizeAmount(raw: string): number | null {
  const cleaned = raw.replace(/[^\d.,]/g, '');
  if (!cleaned) {
    return null;
  }

  const decimalIndex = Math.max(cleaned.lastIndexOf(','), cleaned.lastIndexOf('.'));
  const looksLikeDecimalMarker = decimalIndex !== -1 && cleaned.length - decimalIndex - 1 <= 2;

  const integerPart = (looksLikeDecimalMarker ? cleaned.slice(0, decimalIndex) : cleaned).replace(/[.,]/g, '');
  const decimalPart = looksLikeDecimalMarker ? cleaned.slice(decimalIndex + 1) : '00';

  if (!integerPart) {
    return null;
  }

  const value = Number(`${integerPart}.${decimalPart}`);
  return Number.isFinite(value) ? value : null;
}

function extractDate(text: string): string | null {
  const match = text.match(DATE_PATTERN);
  if (!match) {
    return null;
  }

  // Two alternatives in the pattern: yyyy-mm-dd (groups 1-3) or dd-mm-yyyy (groups 4-6).
  const [, isoYear, isoMonth, isoDay, day, month, year] = match;

  const resolvedYear = isoYear ?? (year.length === 2 ? `20${year}` : year);
  const resolvedMonth = Number(isoMonth ?? month);
  const resolvedDay = Number(isoDay ?? day);

  if (resolvedMonth < 1 || resolvedMonth > 12 || resolvedDay < 1 || resolvedDay > 31) {
    return null;
  }

  return `${resolvedYear}-${String(resolvedMonth).padStart(2, '0')}-${String(resolvedDay).padStart(2, '0')}`;
}

function extractMerchant(lines: string[]): string | null {
  for (const line of lines.slice(0, 5)) {
    const letterCount = (line.match(/[a-zA-ZÀ-ÿ]/g) ?? []).length;
    if (letterCount >= 3 && line.length <= 40 && !AMOUNT_KEYWORDS.test(line)) {
      return line;
    }
  }
  return null;
}
