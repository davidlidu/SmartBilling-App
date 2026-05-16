import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Invoice, Client } from '../../types';
import { getInvoices, deleteInvoice as apiDeleteInvoice } from '../../services/invoiceService';
import { getClients } from '../../services/clientService';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import { PlusCircle, Edit3, Trash2, Search, FileText, Eye, Filter, Download, X } from 'lucide-react';
import { formatCurrency, formatDateForDisplay } from '../../utils/formatting';

const InvoiceListPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  // Filters persisted in the URL so they survive navigation
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm    = searchParams.get('q')      ?? '';
  const filterClientId = searchParams.get('client') ?? '';
  const filterDateFrom = searchParams.get('from')   ?? '';
  const filterDateTo   = searchParams.get('to')     ?? '';
  const showFilters    = !!(filterClientId || filterDateFrom || filterDateTo || searchParams.get('filters') === '1');

  const setParam = (key: string, value: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value); else next.delete(key);
      return next;
    }, { replace: true });
  };

  const toggleFilters = () => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      const visible = next.get('filters') === '1' || filterClientId || filterDateFrom || filterDateTo;
      if (visible) next.set('filters', '0'); else next.set('filters', '1');
      return next;
    }, { replace: true });
  };

  const showFiltersPanel = showFilters || searchParams.get('filters') === '1';

  const fetchInvoicesAndClients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [invoiceData, clientData] = await Promise.all([getInvoices(), getClients()]);
      setInvoices(invoiceData);
      setClients(clientData);
    } catch (err) {
      setError('Error al cargar los datos. Por favor, inténtelo de nuevo.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoicesAndClients();
  }, [fetchInvoicesAndClients]);

  const getClientName = (clientId: string): string => {
    return clients.find(c => c.id === clientId)?.name || 'N/A';
  };

  const calculateInvoiceTotal = (invoice: any): number => {
    if (invoice.totalAmount !== undefined && invoice.totalAmount !== null) {
      return parseFloat(invoice.totalAmount);
    }
    if (invoice.lineItems && Array.isArray(invoice.lineItems)) {
      return invoice.lineItems.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
    }
    return 0;
  };

  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    try {
      await apiDeleteInvoice(invoiceToDelete.id);
      setInvoices(prevInvoices => prevInvoices.filter(inv => inv.id !== invoiceToDelete.id));
      setInvoiceToDelete(null);
    } catch (err) {
      setError(`Error al eliminar la factura #${invoiceToDelete.invoiceNumber}.`);
      console.error(err);
    }
  };

  const hasActiveFilters = filterClientId || filterDateFrom || filterDateTo;

  const clearFilters = () => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('client');
      next.delete('from');
      next.delete('to');
      return next;
    }, { replace: true });
  };

  const filteredInvoices = invoices.filter(invoice => {
    const clientName = getClientName(invoice.clientId).toLowerCase();
    const invoiceNumber = invoice.invoiceNumber.toLowerCase();
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = clientName.includes(searchTermLower) || invoiceNumber.includes(searchTermLower);

    const matchesClient = !filterClientId || invoice.clientId === filterClientId;

    const invoiceDate = invoice.date ? invoice.date.split('T')[0] : '';
    const matchesFrom = !filterDateFrom || invoiceDate >= filterDateFrom;
    const matchesTo = !filterDateTo || invoiceDate <= filterDateTo;

    return matchesSearch && matchesClient && matchesFrom && matchesTo;
  });

  const exportToCSV = () => {
    const rows = filteredInvoices.map(invoice => ({
      'Factura #': invoice.invoiceNumber,
      'Cliente': getClientName(invoice.clientId),
      'Fecha': formatDateForDisplay(invoice.date),
      'Total': calculateInvoiceTotal(invoice),
    }));

    const totalGeneral = filteredInvoices.reduce((sum, inv) => sum + calculateInvoiceTotal(inv), 0);

    const headers = Object.keys(rows[0] || { 'Factura #': '', 'Cliente': '', 'Fecha': '', 'Total': '' });
    const csvLines = [
      headers.join(','),
      ...rows.map(row => headers.map(h => `"${(row as any)[h]}"`).join(',')),
      '',
      `"Total General","","","${totalGeneral}"`,
    ];

    const blob = new Blob(['﻿' + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `facturas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner size={12} /></div>;
  }

  if (error) {
    return <div className="text-danger bg-danger-50 p-4 rounded-2xl border border-danger/20 font-medium">{error}</div>;
  }

  return (
    <div className="container mx-auto space-y-6 max-w-6xl animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-secondary-800">Facturas</h2>
          <p className="text-sm text-secondary-400 mt-0.5">
            {filteredInvoices.length} de {invoices.length} facturas
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={exportToCSV}
            disabled={filteredInvoices.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-secondary-200 text-secondary-700 hover:bg-secondary-50 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            title="Exportar a CSV"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
          <Link
            to="/invoices/new"
            className="bg-gradient-to-r from-primary to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-glow flex items-center transition-all flex-1 sm:flex-none justify-center text-sm"
          >
            <PlusCircle size={18} className="mr-2" />
            Crear Factura
          </Link>
        </div>
      </div>

      {/* Search + Filters bar */}
      <div className="bg-white p-3 rounded-2xl shadow-card border border-secondary-100 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar por número o cliente..."
              className="w-full p-3 pl-10 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setParam('q', e.target.value)}
              aria-label="Buscar facturas"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" size={18} />
          </div>
          <button
            onClick={toggleFilters}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              showFiltersPanel || hasActiveFilters
                ? 'bg-primary-50 border-primary-300 text-primary-700'
                : 'bg-white border-secondary-200 text-secondary-600 hover:bg-secondary-50'
            }`}
          >
            <Filter size={16} />
            <span className="hidden sm:inline">Filtros</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
          </button>
        </div>

        {showFiltersPanel && (
          <div className="pt-2 border-t border-secondary-100 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fadeIn">
            <div>
              <label className="block text-[11px] font-bold text-secondary-500 uppercase tracking-wider mb-1">Cliente</label>
              <select
                value={filterClientId}
                onChange={e => setParam('client', e.target.value)}
                className="w-full p-2.5 border border-secondary-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-sm"
              >
                <option value="">Todos los clientes</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-secondary-500 uppercase tracking-wider mb-1">Fecha desde</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={e => setParam('from', e.target.value)}
                className="w-full p-2.5 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-secondary-500 uppercase tracking-wider mb-1">Fecha hasta</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={e => setParam('to', e.target.value)}
                className="w-full p-2.5 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-sm"
              />
            </div>
            {hasActiveFilters && (
              <div className="sm:col-span-3 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-sm text-secondary-500 hover:text-danger transition-colors"
                >
                  <X size={14} />
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary row */}
      {filteredInvoices.length > 0 && (
        <div className="flex justify-end">
          <div className="bg-white px-4 py-2 rounded-xl border border-secondary-100 shadow-sm text-sm">
            <span className="text-secondary-500">Total mostrado: </span>
            <span className="font-bold text-secondary-800">
              {formatCurrency(filteredInvoices.reduce((s, inv) => s + calculateInvoiceTotal(inv), 0))}
            </span>
          </div>
        </div>
      )}

      {/* Table or Empty State */}
      {filteredInvoices.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-card border border-secondary-100">
          <div className="w-16 h-16 bg-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-secondary-400" />
          </div>
          <p className="text-secondary-700 text-lg font-semibold">No se encontraron facturas</p>
          <p className="text-secondary-400 text-sm mt-1">Ajusta los filtros o crea una nueva factura.</p>
        </div>
      ) : (
        <div className="bg-white shadow-card rounded-2xl overflow-hidden border border-secondary-100">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-secondary-50 border-b border-secondary-200">
                  <th className="px-4 py-3.5 text-left text-[11px] font-bold text-secondary-500 uppercase tracking-wider">Fact. #</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-secondary-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-secondary-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-secondary-500 uppercase tracking-wider">Total</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-secondary-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {filteredInvoices.map(invoice => (
                  <tr key={invoice.id} className="hover:bg-primary-50/30 transition-colors group">
                    <td className="px-4 py-4 text-sm whitespace-nowrap">
                      <span className="bg-primary-50 text-primary-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                        {invoice.invoiceNumber}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm whitespace-nowrap text-secondary-700 font-medium">{getClientName(invoice.clientId)}</td>
                    <td className="px-5 py-4 text-sm whitespace-nowrap text-secondary-500">{formatDateForDisplay(invoice.date)}</td>
                    <td className="px-5 py-4 text-sm whitespace-nowrap text-secondary-800 font-bold">{formatCurrency(calculateInvoiceTotal(invoice))}</td>
                    <td className="px-5 py-4 text-sm">
                      <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <Link
                          to={`/invoices/${invoice.id}/view`}
                          className="p-2 text-secondary-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver Factura"
                        >
                          <Eye size={16} />
                        </Link>
                        <Link
                          to={`/invoices/${invoice.id}/edit`}
                          className="p-2 text-secondary-400 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"
                          title="Editar Factura"
                        >
                          <Edit3 size={16} />
                        </Link>
                        <button
                          onClick={() => setInvoiceToDelete(invoice)}
                          className="p-2 text-secondary-400 hover:text-danger hover:bg-danger-50 rounded-lg transition-colors"
                          title="Eliminar Factura"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={!!invoiceToDelete}
        onClose={() => setInvoiceToDelete(null)}
        title="Confirmar Eliminación"
        footer={
          <>
            <button
              onClick={() => setInvoiceToDelete(null)}
              className="px-4 py-2.5 bg-secondary-100 text-secondary-700 rounded-xl hover:bg-secondary-200 transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteInvoice}
              className="px-4 py-2.5 bg-danger text-white rounded-xl hover:bg-danger-dark transition-colors text-sm font-medium"
            >
              Eliminar
            </button>
          </>
        }
      >
        <p className="text-secondary-700">¿Está seguro que desea eliminar la factura #{invoiceToDelete?.invoiceNumber}?</p>
        <p className="text-sm text-secondary-400 mt-1">Esta acción no se puede deshacer.</p>
      </Modal>
    </div>
  );
};

export default InvoiceListPage;
