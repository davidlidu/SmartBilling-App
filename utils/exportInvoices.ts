import { Invoice, Client } from '../types';
import { formatDateForDisplay, formatDateForInput } from './formatting';

// ── Períodos predefinidos para exportar reportes de facturas ──
export type PeriodKey = 'day' | 'week' | 'month' | '3months' | '6months' | 'year' | 'custom';

export interface PeriodOption {
  key: PeriodKey;
  label: string;
}

export const PERIOD_OPTIONS: PeriodOption[] = [
  { key: 'day', label: 'Hoy' },
  { key: 'week', label: 'Última semana' },
  { key: 'month', label: 'Último mes' },
  { key: '3months', label: 'Últimos 3 meses' },
  { key: '6months', label: 'Últimos 6 meses' },
  { key: 'year', label: 'Último año' },
  { key: 'custom', label: 'Personalizado' },
];

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

/**
 * Calcula el rango de fechas [desde, hasta] para un período dado.
 * Para 'custom' devuelve el rango proporcionado por el usuario.
 */
export const getPeriodRange = (
  key: PeriodKey,
  customFrom = '',
  customTo = ''
): DateRange => {
  if (key === 'custom') {
    return { from: customFrom, to: customTo };
  }

  const today = new Date();
  const to = formatDateForInput(today);
  const start = new Date(today);

  switch (key) {
    case 'day':
      // Solo el día de hoy
      break;
    case 'week':
      start.setDate(start.getDate() - 6); // últimos 7 días
      break;
    case 'month':
      start.setMonth(start.getMonth() - 1);
      break;
    case '3months':
      start.setMonth(start.getMonth() - 3);
      break;
    case '6months':
      start.setMonth(start.getMonth() - 6);
      break;
    case 'year':
      start.setFullYear(start.getFullYear() - 1);
      break;
  }

  return { from: formatDateForInput(start), to };
};

const invoiceTotal = (invoice: any): number => {
  if (invoice.totalAmount !== undefined && invoice.totalAmount !== null) {
    return parseFloat(invoice.totalAmount);
  }
  if (invoice.lineItems && Array.isArray(invoice.lineItems)) {
    return invoice.lineItems.reduce(
      (sum: number, item: any) => sum + item.quantity * item.unitPrice,
      0
    );
  }
  return 0;
};

const invoiceDateOnly = (invoice: Invoice): string =>
  invoice.date ? String(invoice.date).split('T')[0] : '';

/**
 * Filtra las facturas dentro de un rango de fechas (inclusivo) y opcionalmente por cliente.
 */
export const filterInvoicesByPeriod = (
  invoices: Invoice[],
  range: DateRange,
  clientId = ''
): Invoice[] => {
  return invoices
    .filter(inv => {
      const d = invoiceDateOnly(inv);
      const matchesFrom = !range.from || d >= range.from;
      const matchesTo = !range.to || d <= range.to;
      const matchesClient = !clientId || inv.clientId === clientId;
      return matchesFrom && matchesTo && matchesClient;
    })
    .sort((a, b) => invoiceDateOnly(a).localeCompare(invoiceDateOnly(b)));
};

const csvCell = (value: string | number): string => {
  const s = String(value ?? '');
  return `"${s.replace(/"/g, '""')}"`;
};

/**
 * Genera y descarga un archivo CSV con el reporte de facturas indicadas.
 */
export const exportInvoicesToCSV = (
  invoices: Invoice[],
  clients: Client[],
  range: DateRange,
  fileNameHint = 'reporte'
): void => {
  const clientName = (clientId: string) =>
    clients.find(c => c.id === clientId)?.name || 'N/A';

  const headers = ['Factura #', 'Cliente', 'Fecha', 'Total'];
  const rows = invoices.map(inv => [
    inv.invoiceNumber,
    clientName(inv.clientId),
    formatDateForDisplay(inv.date),
    invoiceTotal(inv),
  ]);

  const totalGeneral = invoices.reduce((s, inv) => s + invoiceTotal(inv), 0);

  const rangeLabel =
    range.from || range.to
      ? `Período,${csvCell(`${range.from || '—'} a ${range.to || '—'}`)}`
      : '';

  const csvLines = [
    rangeLabel,
    `Facturas,${invoices.length}`,
    '',
    headers.map(csvCell).join(','),
    ...rows.map(row => row.map(csvCell).join(',')),
    '',
    ['Total General', '', '', totalGeneral].map(csvCell).join(','),
  ].filter(line => line !== '');

  const blob = new Blob(['﻿' + csvLines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const suffix = range.to || formatDateForInput(new Date());
  link.href = url;
  link.download = `${fileNameHint}_facturas_${suffix}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
