import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Invoice, Client } from '../../types';
import { getInvoices, deleteInvoice as apiDeleteInvoice } from '../../services/invoiceService';
import { getClients } from '../../services/clientService';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import { PlusCircle, Edit3, Trash2, Download, Search, FileText, Eye } from 'lucide-react';
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

  const calculateInvoiceTotal = (invoice: Invoice): number => {
    return invoice.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
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
    return <div className="text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
  }

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-semibold text-gray-700">Facturas</h2>
        <Link
          to="/invoices/new"
          className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center transition-colors w-full sm:w-auto justify-center"
        >
          <PlusCircle size={20} className="mr-2" />
          Crear Factura
        </Link>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar facturas por número o nombre de cliente..."
            className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Buscar facturas"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        </div>
      </div>

      {filteredInvoices.length === 0 && !isLoading ? (
         <div className="text-center py-10 bg-white rounded-lg shadow">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-xl">No se encontraron facturas.</p>
            <p className="text-gray-500">Intenta ajustar tu búsqueda o crea una nueva factura.</p>
        </div>
      ) : (
      <div className="bg-white shadow-lg rounded-lg overflow-x-auto"> {/* Added overflow-x-auto */}
        <table className="min-w-full leading-normal">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-black-600 uppercase tracking-wider whitespace-nowrap">Fact. #</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cliente</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map(invoice => (
              <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-4 border-b border-gray-200 text-sm whitespace-nowrap">
                  <span className="bg-slate-200 text-slate-700 px-2 py-1 rounded-md text-xs font-medium">
                    {invoice.invoiceNumber}
                  </span>
                </td>
                <td className="px-5 py-4 border-b border-gray-200 text-sm whitespace-nowrap text-gray-800">{getClientName(invoice.clientId)}</td>
                <td className="px-5 py-4 border-b border-gray-200 text-sm whitespace-nowrap text-gray-800">{formatDateForDisplay(invoice.date)}</td>
                <td className="px-5 py-4 border-b border-gray-200 text-sm whitespace-nowrap text-gray-800">{formatCurrency(calculateInvoiceTotal(invoice))}</td>
                <td className="px-5 py-4 border-b border-gray-200 text-sm">
                  <div className="flex space-x-3">
                    <Link to={`/invoices/${invoice.id}/view`} className="text-gray-600 hover:text-gray-900 p-1" title="Ver Factura">
                        <Eye size={18} />
                    </Link>
                    <a href={`#/invoices/${invoice.id}/view?download=true`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 p-1" title="Descargar PDF Comprimido">
                        <Download size={18} />
                    </a>
                    <Link to={`/invoices/${invoice.id}/edit`} className="text-primary-dark hover:text-primary p-1" title="Editar Factura">
                      <Edit3 size={18} />
                    </Link>
                    <button onClick={() => setInvoiceToDelete(invoice)} className="text-danger hover:text-red-700 p-1" title="Eliminar Factura">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      <Modal
        isOpen={!!invoiceToDelete}
        onClose={() => setInvoiceToDelete(null)}
        title="Confirmar Eliminación"
        footer={
          <>
            <button
              onClick={() => setInvoiceToDelete(null)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteInvoice}
              className="px-4 py-2 bg-danger text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Eliminar
            </button>
          </>
        }
      >
        <p>¿Está seguro que desea eliminar la factura #{invoiceToDelete?.invoiceNumber}?</p>
        <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
      </Modal>
    </div>
  );
};

export default InvoiceListPage;
