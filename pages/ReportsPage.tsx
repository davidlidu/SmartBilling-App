import React, { useEffect, useState, useCallback } from 'react';
import { getInvoices } from '../services/invoiceService';
import { getClients } from '../services/clientService';
import { getAllPayments } from '../services/paymentService';
import { Invoice, Client, Payment } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatDateForDisplay } from '../utils/formatting';
import { BarChart2, Users, FileText, TrendingUp, DollarSign, AlertCircle, X } from 'lucide-react';

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const calculateTotal = (invoice: any): number => {
  if (invoice.totalAmount !== undefined && invoice.totalAmount !== null) return parseFloat(invoice.totalAmount);
  if (invoice.lineItems && Array.isArray(invoice.lineItems)) {
    return invoice.lineItems.reduce((s: number, i: any) => s + i.quantity * i.unitPrice, 0);
  }
  return 0;
};

const ReportsPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [filterClientId, setFilterClientId] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [invData, cliData, payData] = await Promise.all([
        getInvoices(),
        getClients(),
        getAllPayments(),
      ]);
      setInvoices(invData);
      setClients(cliData);
      setPayments(payData);
    } catch (err: any) {
      setError('Error al cargar los datos de reportes.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getClientName = (clientId: string) => clients.find(c => c.id === clientId)?.name || 'N/A';

  // ── Apply client filter to base data ──
  const filteredInvoices = filterClientId
    ? invoices.filter(inv => inv.clientId === filterClientId)
    : invoices;

  const filteredPayments = filterClientId
    ? payments.filter(p => p.clientId === filterClientId)
    : payments;

  // ── Filtered by year (on top of client filter) ──
  const invoicesInYear = filteredInvoices.filter(inv => {
    const y = new Date(inv.date.split('T')[0]).getFullYear();
    return y === yearFilter;
  });

  const paymentsInYear = filteredPayments.filter(p => {
    const y = new Date(p.date.split('T')[0]).getFullYear();
    return y === yearFilter;
  });

  // ── Revenue by month ──
  const revenueByMonth: number[] = Array(12).fill(0);
  invoicesInYear.forEach(inv => {
    const m = new Date(inv.date.split('T')[0]).getMonth();
    revenueByMonth[m] += calculateTotal(inv);
  });
  const maxMonthRevenue = Math.max(...revenueByMonth, 1);

  // ── Payments by month ──
  const paidByMonth: number[] = Array(12).fill(0);
  paymentsInYear.forEach(p => {
    const m = new Date(p.date.split('T')[0]).getMonth();
    paidByMonth[m] += Number(p.amount);
  });

  // ── Top clients (always global, no client filter applied) ──
  const clientTotals: Record<string, number> = {};
  invoices.forEach(inv => {
    clientTotals[inv.clientId] = (clientTotals[inv.clientId] || 0) + calculateTotal(inv);
  });
  const topClients = Object.entries(clientTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxClientTotal = topClients.length > 0 ? topClients[0][1] : 1;

  // ── Summary stats ──
  const totalRevenue = filteredInvoices.reduce((s, inv) => s + calculateTotal(inv), 0);
  const totalPaid = filteredPayments.reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = Math.max(0, totalRevenue - totalPaid);
  const totalRevenueYear = invoicesInYear.reduce((s, inv) => s + calculateTotal(inv), 0);
  const totalPaidYear = paymentsInYear.reduce((s, p) => s + Number(p.amount), 0);

  const availableYears = Array.from(
    new Set(invoices.map(inv => new Date(inv.date.split('T')[0]).getFullYear()))
  ).sort((a, b) => b - a);
  if (!availableYears.includes(yearFilter)) availableYears.unshift(yearFilter);

  const selectedClient = clients.find(c => c.id === filterClientId);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner size={12} /></div>;
  }

  return (
    <div className="container mx-auto space-y-6 max-w-6xl animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-secondary-800">Reportes</h2>
          <p className="text-sm text-secondary-400 mt-0.5">Resumen financiero y estadísticas</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <label className="text-sm text-secondary-500 font-medium">Año:</label>
          <select
            value={yearFilter}
            onChange={e => setYearFilter(Number(e.target.value))}
            className="p-2 border border-secondary-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-300 text-sm"
          >
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Client filter bar */}
      <div className="bg-white p-4 rounded-2xl shadow-card border border-secondary-100">
        <div className="flex items-center gap-3">
          <Users size={16} className="text-secondary-400 flex-shrink-0" />
          <label className="text-sm font-semibold text-secondary-600 flex-shrink-0">Filtrar por cliente:</label>
          <select
            value={filterClientId}
            onChange={e => setFilterClientId(e.target.value)}
            className="flex-1 p-2 border border-secondary-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-sm"
          >
            <option value="">Todos los clientes</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {filterClientId && (
            <button
              onClick={() => setFilterClientId('')}
              className="flex items-center gap-1.5 text-sm text-secondary-400 hover:text-danger transition-colors flex-shrink-0"
              title="Quitar filtro"
            >
              <X size={16} />
              <span className="hidden sm:inline">Limpiar</span>
            </button>
          )}
        </div>
        {selectedClient && (
          <div className="mt-3 pt-3 border-t border-secondary-100 flex flex-wrap gap-4 text-xs text-secondary-500">
            <span><span className="font-semibold text-secondary-700">NIT/CC:</span> {selectedClient.nitOrCc}</span>
            <span><span className="font-semibold text-secondary-700">Ciudad:</span> {selectedClient.city}</span>
            <span><span className="font-semibold text-secondary-700">Teléfono:</span> {selectedClient.phone}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger/20 p-4 rounded-2xl flex items-center gap-2">
          <AlertCircle className="text-danger flex-shrink-0" size={18} />
          <p className="text-danger font-medium text-sm">{error}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-card border border-secondary-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">Facturado total</p>
            <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
              <FileText size={18} className="text-primary" />
            </div>
          </div>
          <p className="text-xl font-bold text-secondary-800">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-secondary-400 mt-1">{filteredInvoices.length} facturas</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-card border border-secondary-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">Total pagado</p>
            <div className="w-9 h-9 bg-success-50 rounded-xl flex items-center justify-center">
              <DollarSign size={18} className="text-success-dark" />
            </div>
          </div>
          <p className="text-xl font-bold text-success-dark">{formatCurrency(totalPaid)}</p>
          <p className="text-xs text-secondary-400 mt-1">{filteredPayments.length} pagos</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-card border border-secondary-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">Saldo pendiente</p>
            <div className="w-9 h-9 bg-danger-50 rounded-xl flex items-center justify-center">
              <AlertCircle size={18} className="text-danger" />
            </div>
          </div>
          <p className="text-xl font-bold text-danger">{formatCurrency(totalPending)}</p>
          <p className="text-xs text-secondary-400 mt-1">por cobrar</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-card border border-secondary-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">
              {filterClientId ? 'Cliente' : 'Clientes'}
            </p>
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users size={18} className="text-blue-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-secondary-800">
            {filterClientId ? 1 : clients.length}
          </p>
          <p className="text-xs text-secondary-400 mt-1 truncate">
            {filterClientId ? (selectedClient?.name || 'seleccionado') : 'registrados'}
          </p>
        </div>
      </div>

      {/* Revenue by Month Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-card border border-secondary-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-secondary-800 flex items-center gap-2">
              <BarChart2 size={18} className="text-primary" />
              Facturación mensual {yearFilter}
              {selectedClient && (
                <span className="text-xs font-normal bg-primary-50 text-primary-700 px-2 py-0.5 rounded-lg">
                  {selectedClient.name}
                </span>
              )}
            </h3>
            <p className="text-xs text-secondary-400 mt-0.5">Total: {formatCurrency(totalRevenueYear)}</p>
          </div>
        </div>
        <div className="flex items-end gap-2 h-40">
          {revenueByMonth.map((amount, i) => {
            const heightPct = maxMonthRevenue > 0 ? (amount / maxMonthRevenue) * 100 : 0;
            const paidAmt = paidByMonth[i];
            const paidPct = amount > 0 ? Math.min((paidAmt / amount) * 100, 100) : 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="relative w-full flex flex-col justify-end" style={{ height: '120px' }}>
                  {amount > 0 && (
                    <div
                      className="absolute bottom-0 left-0 right-0 rounded-t-lg overflow-hidden"
                      style={{ height: `${heightPct}%` }}
                      title={`${MONTHS_ES[i]}: ${formatCurrency(amount)}\nPagado: ${formatCurrency(paidAmt)}`}
                    >
                      <div className="w-full h-full bg-primary-100 relative">
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary to-primary-400 rounded-t-lg transition-all"
                          style={{ height: `${paidPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {amount === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary-100 rounded" />
                  )}
                </div>
                <span className="text-[10px] text-secondary-400 font-medium">{MONTHS_ES[i]}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-4 text-xs text-secondary-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-primary inline-block" />
            Pagado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-primary-100 inline-block" />
            Facturado (sin pagar)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clients — only shown when no client filter active */}
        {!filterClientId ? (
          <div className="bg-white p-6 rounded-2xl shadow-card border border-secondary-100">
            <h3 className="font-bold text-secondary-800 flex items-center gap-2 mb-5">
              <TrendingUp size={18} className="text-primary" />
              Top clientes por facturación
            </h3>
            {topClients.length === 0 ? (
              <p className="text-secondary-400 text-sm text-center py-8">Sin datos</p>
            ) : (
              <div className="space-y-3">
                {topClients.map(([clientId, total], idx) => (
                  <div key={clientId}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-secondary-400 w-4">{idx + 1}.</span>
                        <button
                          className="text-sm font-medium text-secondary-700 hover:text-primary transition-colors truncate max-w-[160px] text-left"
                          onClick={() => setFilterClientId(clientId)}
                          title="Filtrar por este cliente"
                        >
                          {getClientName(clientId)}
                        </button>
                      </div>
                      <span className="text-sm font-bold text-secondary-800">{formatCurrency(total)}</span>
                    </div>
                    <div className="w-full h-2 bg-secondary-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary-400 rounded-full transition-all"
                        style={{ width: `${(total / maxClientTotal) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Client detail card when filtered */
          <div className="bg-white p-6 rounded-2xl shadow-card border border-secondary-100">
            <h3 className="font-bold text-secondary-800 flex items-center gap-2 mb-5">
              <Users size={18} className="text-primary" />
              Detalle del cliente
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-secondary-50">
                <span className="text-sm text-secondary-500">Nombre</span>
                <span className="text-sm font-semibold text-secondary-800">{selectedClient?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-secondary-50">
                <span className="text-sm text-secondary-500">NIT / CC</span>
                <span className="text-sm font-semibold text-secondary-800">{selectedClient?.nitOrCc}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-secondary-50">
                <span className="text-sm text-secondary-500">Ciudad</span>
                <span className="text-sm font-semibold text-secondary-800">{selectedClient?.city}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-secondary-50">
                <span className="text-sm text-secondary-500">Total facturas</span>
                <span className="text-sm font-bold text-secondary-800">{filteredInvoices.length}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-secondary-50">
                <span className="text-sm text-secondary-500">Total facturado</span>
                <span className="text-sm font-bold text-secondary-800">{formatCurrency(totalRevenue)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-secondary-50">
                <span className="text-sm text-secondary-500">Total pagado</span>
                <span className="text-sm font-bold text-success-dark">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-secondary-500">Saldo pendiente</span>
                <span className={`text-sm font-bold ${totalPending > 0 ? 'text-danger' : 'text-secondary-400'}`}>
                  {formatCurrency(totalPending)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Recent Invoices */}
        <div className="bg-white p-6 rounded-2xl shadow-card border border-secondary-100">
          <h3 className="font-bold text-secondary-800 flex items-center gap-2 mb-5">
            <FileText size={18} className="text-primary" />
            {filterClientId ? 'Últimas facturas del cliente' : 'Últimas 5 facturas'}
          </h3>
          {filteredInvoices.length === 0 ? (
            <p className="text-secondary-400 text-sm text-center py-8">Sin datos</p>
          ) : (
            <div className="space-y-2">
              {filteredInvoices.slice(0, 5).map(inv => (
                <div key={inv.id} className="flex items-center justify-between py-2 border-b border-secondary-50 last:border-0">
                  <div>
                    <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-lg font-bold mr-2">
                      #{inv.invoiceNumber}
                    </span>
                    {!filterClientId && (
                      <span className="text-sm text-secondary-600">{getClientName(inv.clientId)}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-secondary-800">{formatCurrency(calculateTotal(inv))}</p>
                    <p className="text-xs text-secondary-400">{formatDateForDisplay(inv.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Monthly summary table */}
      <div className="bg-white p-6 rounded-2xl shadow-card border border-secondary-100">
        <h3 className="font-bold text-secondary-800 flex items-center gap-2 mb-5">
          <BarChart2 size={18} className="text-primary" />
          Resumen mensual {yearFilter}
          {selectedClient && (
            <span className="text-xs font-normal bg-primary-50 text-primary-700 px-2 py-0.5 rounded-lg">
              {selectedClient.name}
            </span>
          )}
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-secondary-50 border-b border-secondary-200">
                <th className="px-4 py-3 text-left text-[11px] font-bold text-secondary-500 uppercase tracking-wider">Mes</th>
                <th className="px-4 py-3 text-right text-[11px] font-bold text-secondary-500 uppercase tracking-wider">Facturas</th>
                <th className="px-4 py-3 text-right text-[11px] font-bold text-secondary-500 uppercase tracking-wider">Facturado</th>
                <th className="px-4 py-3 text-right text-[11px] font-bold text-secondary-500 uppercase tracking-wider">Pagado</th>
                <th className="px-4 py-3 text-right text-[11px] font-bold text-secondary-500 uppercase tracking-wider">Pendiente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {MONTHS_ES.map((month, i) => {
                const invoiceCount = invoicesInYear.filter(inv => new Date(inv.date.split('T')[0]).getMonth() === i).length;
                const rev = revenueByMonth[i];
                const paid = paidByMonth[i];
                const pending = Math.max(0, rev - paid);
                if (invoiceCount === 0 && paid === 0) return null;
                return (
                  <tr key={i} className="hover:bg-primary-50/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-secondary-700">{month} {yearFilter}</td>
                    <td className="px-4 py-3 text-right text-secondary-500">{invoiceCount}</td>
                    <td className="px-4 py-3 text-right font-bold text-secondary-800">{formatCurrency(rev)}</td>
                    <td className="px-4 py-3 text-right font-bold text-success-dark">{formatCurrency(paid)}</td>
                    <td className={`px-4 py-3 text-right font-bold ${pending > 0 ? 'text-danger' : 'text-secondary-400'}`}>
                      {formatCurrency(pending)}
                    </td>
                  </tr>
                );
              })}
              {invoicesInYear.length === 0 && paymentsInYear.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-secondary-400 text-sm">
                    Sin datos para {yearFilter}{selectedClient ? ` — ${selectedClient.name}` : ''}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-secondary-50 border-t-2 border-secondary-200">
                <td className="px-4 py-3 font-bold text-secondary-800">Total {yearFilter}</td>
                <td className="px-4 py-3 text-right font-bold text-secondary-700">{invoicesInYear.length}</td>
                <td className="px-4 py-3 text-right font-bold text-secondary-800">{formatCurrency(totalRevenueYear)}</td>
                <td className="px-4 py-3 text-right font-bold text-success-dark">{formatCurrency(totalPaidYear)}</td>
                <td className={`px-4 py-3 text-right font-bold ${totalRevenueYear - totalPaidYear > 0 ? 'text-danger' : 'text-secondary-400'}`}>
                  {formatCurrency(Math.max(0, totalRevenueYear - totalPaidYear))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
