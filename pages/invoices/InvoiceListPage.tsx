import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Invoice, Client } from '../../types';
import { getInvoices, deleteInvoice as apiDeleteInvoice } from '../../services/invoiceService';
import { getClients } from '../../services/clientService';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import { PlusCircle, Edit3, Trash2, Search, FileText, Eye } from 'lucide-react';
import { formatCurrency, formatDateForDisplay } from '../../utils/formatting';

const InvoiceListPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

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

  const filteredInvoices = invoices.filter(invoice => {
    const clientName = getClientName(invoice.clientId).toLowerCase();
    const invoiceNumber = invoice.invoiceNumber.toLowerCase();
    const searchTermLower = searchTerm.toLowerCase();
    return clientName.includes(searchTermLower) || invoiceNumber.includes(searchTermLower);
  });

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
          <p className="text-sm text-secondary-400 mt-0.5">{invoices.length} facturas registradas</p>
        </div>
        <Link
          to="/invoices/new"
          className="bg-gradient-to-r from-primary to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-glow flex items-center transition-all w-full sm:w-auto justify-center text-sm"
        >
          <PlusCircle size={18} className="mr-2" />
          Crear Factura
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-2xl shadow-card border border-secondary-100">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar facturas por número o nombre de cliente..."
            className="w-full p-3 pl-10 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Buscar facturas"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" size={18} />
        </div>
      </div>

      {/* Table or Empty State */}
      {filteredInvoices.length === 0 && !isLoading ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-card border border-secondary-100">
          <div className="w-16 h-16 bg-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-secondary-400" />
          </div>
          <p className="text-secondary-700 text-lg font-semibold">No se encontraron facturas</p>
          <p className="text-secondary-400 text-sm mt-1">Intenta ajustar tu búsqueda o crea una nueva factura.</p>
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