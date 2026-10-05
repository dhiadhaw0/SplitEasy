import { Injectable } from '@angular/core';
import { recognize } from 'tesseract.js';
import { ParsedReceipt, parseReceiptText } from '../utils/receipt-parser';

export interface ReceiptScanResult extends ParsedReceipt {
  rawText: string;
}

/**
 * Client-side OCR (tesseract.js — runs entirely in the browser, nothing is uploaded anywhere).
 * French is used as the recognition language since the app is French-first; digits and amounts
 * read the same regardless, and receipt line items are usually in French for this app's audience.
 */
@Injectable({ providedIn: 'root' })
export class OcrService {
  async scanReceipt(image: File): Promise<ReceiptScanResult> {
    const { data } = await recognize(image, 'fra');
    return { ...parseReceiptText(data.text), rawText: data.text };
  }
}
