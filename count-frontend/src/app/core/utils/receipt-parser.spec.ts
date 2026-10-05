import { parseReceiptText } from './receipt-parser';

describe('parseReceiptText', () => {
  it('extracts the amount on a TOTAL line, even with other numbers present', () => {
    const text = ['SUPERMARCHÉ BONJOUR', 'Pain 2,50', 'Lait 1,20', 'TOTAL 45,90', 'Merci de votre visite'].join('\n');

    expect(parseReceiptText(text).amount).toBe(45.9);
  });

  it('falls back to the largest amount when no TOTAL line is found', () => {
    const text = ['Pain 2,50', 'Lait 1,20', 'Fromage 8,00'].join('\n');

    expect(parseReceiptText(text).amount).toBe(8);
  });

  it('handles a thousand separator and a dot decimal', () => {
    const text = 'Montant à payer: 1 234.56';

    expect(parseReceiptText(text).amount).toBe(1234.56);
  });

  it('returns null when there is no number at all', () => {
    expect(parseReceiptText('Merci de votre visite').amount).toBeNull();
  });

  it('extracts a dd/mm/yyyy date', () => {
    expect(parseReceiptText('Ticket du 05/03/2026').date).toBe('2026-03-05');
  });

  it('extracts an iso yyyy-mm-dd date', () => {
    expect(parseReceiptText('Date: 2026-03-05').date).toBe('2026-03-05');
  });

  it('expands a two-digit year to 20xx', () => {
    expect(parseReceiptText('05/03/26').date).toBe('2026-03-05');
  });

  it('returns null when no date-like pattern is present', () => {
    expect(parseReceiptText('TOTAL 12,00').date).toBeNull();
  });

  it('picks the first plausible text line as the merchant name', () => {
    const text = ['', 'CAFÉ DE PARIS', '12,00'].join('\n');

    expect(parseReceiptText(text).merchant).toBe('CAFÉ DE PARIS');
  });

  it('skips a TOTAL line when guessing the merchant', () => {
    const text = ['TOTAL 12,00', 'CAFÉ DE PARIS'].join('\n');

    expect(parseReceiptText(text).merchant).toBe('CAFÉ DE PARIS');
  });

  it('returns null merchant when every line is too short or numeric', () => {
    expect(parseReceiptText('12,00\n05/03/2026').merchant).toBeNull();
  });
});
