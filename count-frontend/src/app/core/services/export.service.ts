import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GroupDetail } from '../models/group.model';
import { Expense } from '../models/expense.model';
import { Budget } from '../models/budget.model';
import { SavingsGoal } from '../models/savings-goal.model';
import { CATEGORY_LABELS, Category } from '../models/enums';

const BRAND_TEAL: [number, number, number] = [15, 94, 92];
const BRAND_MINT_BG: [number, number, number] = [230, 242, 241];
const BRAND_VIOLET: [number, number, number] = [139, 92, 246];
const BRAND_VIOLET_BG: [number, number, number] = [241, 234, 255];

/**
 * Exports a group's expenses as CSV (Excel/Sheets-friendly, for accounting/reimbursement) or a
 * formatted PDF report. On the web this triggers a normal browser download; inside the native
 * Capacitor shell, browsers can't just "download" a file, so we write it to the cache directory
 * and hand it to the OS share sheet instead (save to Drive, send by email, etc.).
 */
@Injectable({ providedIn: 'root' })
export class ExportService {
  async exportCsv(group: GroupDetail, expenses: Expense[]): Promise<void> {
    const header = ['Date', 'Titre', 'Catégorie', 'Payé par', 'Montant', 'Devise'];
    const rows = expenses.map(expense => [
      expense.date,
      expense.title,
      CATEGORY_LABELS[expense.category],
      expense.paidBy.name,
      expense.amount.toFixed(2),
      group.currency
    ]);
    const csv = [header, ...rows].map(row => row.map(escapeCsvCell).join(';')).join('\r\n');
    // Leading BOM so Excel detects UTF-8 and renders accented characters correctly.
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });

    await this.saveOrShare(`${slugify(group.name)}-depenses.csv`, blob);
  }

  async exportPdf(group: GroupDetail, expenses: Expense[]): Promise<void> {
    const doc = new jsPDF();
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    doc.setFontSize(16);
    doc.text(`SplitEasy — ${group.name}`, 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')} — ${expenses.length} dépense(s)`, 14, 25);

    autoTable(doc, {
      startY: 32,
      head: [['Date', 'Titre', 'Catégorie', 'Payé par', 'Montant']],
      body: expenses.map(expense => [
        expense.date,
        expense.title,
        CATEGORY_LABELS[expense.category],
        expense.paidBy.name,
        `${expense.amount.toFixed(2)} ${group.currency}`
      ]),
      foot: [['', '', '', 'Total', `${total.toFixed(2)} ${group.currency}`]],
      headStyles: { fillColor: BRAND_TEAL },
      footStyles: { fillColor: BRAND_MINT_BG, textColor: BRAND_TEAL, fontStyle: 'bold' }
    });

    const blob = doc.output('blob');
    await this.saveOrShare(`${slugify(group.name)}-depenses.pdf`, blob);
  }

  /** PDF summary of the CURRENT calendar month: total spent + category breakdown, every budget's
   * status, and every savings goal's progress — the data already shown on the Budget tab, just
   * bundled into something shareable. `expenses` is the group's full list; filtered here to the
   * current month so callers don't need to know the date-range query shape. */
  async exportMonthlyReport(group: GroupDetail, expenses: Expense[], budgets: Budget[], goals: SavingsGoal[]): Promise<void> {
    const now = new Date();
    const monthExpenses = expenses.filter(expense => {
      const date = new Date(`${expense.date}T00:00:00`);
      return expense.type !== 'TRANSFER' && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    });
    const total = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    const byCategory = new Map<Category, number>();
    for (const expense of monthExpenses) {
      byCategory.set(expense.category, (byCategory.get(expense.category) ?? 0) + expense.amount);
    }

    const monthLabel = capitalize(now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('SplitEasy — Rapport mensuel', 14, 18);
    doc.setFontSize(11);
    doc.setTextColor(90);
    doc.text(`${group.name} — ${monthLabel}`, 14, 25);
    doc.setFontSize(9);
    doc.setTextColor(140);
    doc.text(`Généré le ${now.toLocaleDateString('fr-FR')}`, 14, 30);

    doc.setFontSize(12);
    doc.setTextColor(30);
    doc.text(`Total dépensé ce mois : ${total.toFixed(2)} ${group.currency}`, 14, 40);

    autoTable(doc, {
      startY: 45,
      head: [['Catégorie', 'Montant']],
      body: [...byCategory.entries()].map(([category, amount]) => [CATEGORY_LABELS[category], `${amount.toFixed(2)} ${group.currency}`]),
      headStyles: { fillColor: BRAND_TEAL }
    });
    let cursorY = lastTableBottom(doc);

    if (budgets.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(30);
      doc.text('Budgets', 14, cursorY);
      autoTable(doc, {
        startY: cursorY + 4,
        head: [['Budget', 'Limite', 'Dépensé', 'Statut']],
        body: budgets.map(budget => [
          budget.category ? CATEGORY_LABELS[budget.category] : 'Toutes catégories',
          `${budget.amountLimit.toFixed(2)} ${group.currency}`,
          `${budget.spent.toFixed(2)} ${group.currency}`,
          budget.exceeded ? 'Dépassé' : 'OK'
        ]),
        headStyles: { fillColor: BRAND_TEAL }
      });
      cursorY = lastTableBottom(doc);
    }

    if (goals.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(30);
      doc.text('Cagnottes', 14, cursorY);
      autoTable(doc, {
        startY: cursorY + 4,
        head: [['Cagnotte', 'Objectif', 'Actuel', 'Progression']],
        body: goals.map(goal => [
          goal.name,
          `${goal.targetAmount.toFixed(2)} ${group.currency}`,
          `${goal.currentAmount.toFixed(2)} ${group.currency}`,
          `${goal.percentage}%`
        ]),
        headStyles: { fillColor: BRAND_VIOLET },
        footStyles: { fillColor: BRAND_VIOLET_BG, textColor: BRAND_VIOLET, fontStyle: 'bold' }
      });
    }

    const blob = doc.output('blob');
    await this.saveOrShare(`${slugify(group.name)}-rapport-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}.pdf`, blob);
  }

  private async saveOrShare(fileName: string, blob: Blob): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      downloadInBrowser(fileName, blob);
      return;
    }

    const base64 = await blobToBase64(blob);
    const written = await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
    await Share.share({ title: fileName, url: written.uri });
  }
}

/** jspdf-autotable attaches this to the doc instance after each call; not in jsPDF's own types. */
function lastTableBottom(doc: jsPDF): number {
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function escapeCsvCell(value: string): string {
  return /[;"\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'groupe';
}

function downloadInBrowser(fileName: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // "data:<mime>;base64,AAAA..." — Filesystem.writeFile wants just the base64 payload.
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
