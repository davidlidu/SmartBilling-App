import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Client } from '../../types';
import { getClients, deleteClient as apiDeleteClient } from '../../services/clientService';
import { getInvoices } from '../../services/invoiceService';
import { getPaymentsByClient } from '../../services/paymentService';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import { PlusCircle, Edit3, Trash2, Search, Users, DollarSign } from 'lucide-react';
import PaymentManager from '../../components/PaymentManager';
import { formatCurrency } from '../../utils/formatting';

const ClientListPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [clientForPayments, setClientForPayments] = useState<Client | null>(null);

  const calculateInvoiceAmount = (inv: any) => {
    if (inv.totalAmount !== undefined && inv.totalAmount !== null) return parseFloat(inv.totalAmount);
    if (inv.lineItems && Array.isArray(inv.lineItems)) {
      return inv.lineItems.reduce((s: number, i: any) => s + (i.quantity * i.unitPrice), 0);
    }
    return 0;
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [clientsData, invoicesData] = await Promise.all([
        getClients(),
        getInvoices(),
      ]);

      setClients(clientsData);

      const paymentsPromises = clientsData.map(client =>
        getPaymentsByClient(client.id)
          .catch(err => {
            console.warn(`Error cargando pagos para ${client.name}`, err);
            return [];
          })
      );

      const paymentsResults = await Promise.all(paymentsPromises);

      const newBalances: Record<string, number> = {};

      clientsData.forEach((client, index) => {
        const cId = String(client.id);
        const clientInvoices = invoicesData.filter(inv => String(inv.clientId) === cId);
        const totalInvoiced = clientInvoices.reduce((sum, inv) => sum + calculateInvoiceAmount(inv), 0);
        const clientPayments = paymentsResults[index] || [];

        const totalPaid = clientPayments.reduce((sum, pay: any) => {
          let val = pay.amount || pay.value || pay.amountPaid || 0;
          if (typeof val === 'string') {
            val = parseFloat(val.replace(/,/g, ''));
          }
          return sum + Number(val);
        }, 0);

        newBalances[client.id] = totalInvoiced - totalPaid;
      });

      setBalances(newBalances);

    } catch (err: any) {
      setError('Error al cargar los datos. Por favor, inténtelo de nuevo.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    try {
      await apiDeleteClient(clientToDelete.id);
      setClients(prevClients => prevClients.filter(c => c.id !== clientToDelete.id));
      setClientToDelete(null);
    } catch (err: any) {
      setError(err.message || `Error al eliminar el cliente ${clientToDelete.name}.`);
      console.error(err);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.nitOrCc.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h2 className="text-2xl font-bold text-secondary-800">Clientes</h2>
          <p className="text-sm text-secondary-400 mt-0.5">{clients.length} clientes registrados</p>
        </div>
        <Link
          to="/clients/new"
          className="bg-gradient-to-r from-primary to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-glow flex items-center transition-all w-full sm:w-auto justify-center text-sm"
        >
          <PlusCircle size={18} className="mr-2" />
          Agregar Cliente
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-2xl shadow-card border border-secondary-100">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar clientes por nombre o NIT/CC..."
            className="w-full p-3 pl-10 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Buscar clientes"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" size={18} />
        </div>
      </div>

      {/* Table or Empty State */}
      {filteredClients.length === 0 && !isLoading ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-card border border-secondary-100">
          <div className="w-16 h-16 bg-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-secondary-400" />
          </div>
          <p className="text-secondary-700 text-lg font-semibold">No se encontraron clientes</p>
          <p className="text-secondary-400 text-sm mt-1">Ajusta tu búsqueda o agrega un nuevo cliente.</p>
        </div>
      ) : (
        <div className="bg-white shadow-card rounded-2xl overflow-hidden border border-secondary-100">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-secondary-50 border-b border-secondary-200">
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-secondary-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-secondary-500 uppercase tracking-wider">NIT/CC</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-secondary-500 uppercase tracking-wider">Teléfono</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-secondary-500 uppercase tracking-wider">Saldo Pendiente</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-secondary-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {filteredClients.map(client => {
                  const balance = balances[client.id] || 0;
                  const isHighBalance = balance > 1000;

                  return (
                    <tr key={client.id} className="hover:bg-primary-50/30 transition-colors group">
                      <td className="px-5 py-4 text-sm whitespace-nowrap text-secondary-700 font-medium">{client.name}</td>
                      <td className="px-5 py-4 text-sm whitespace-nowrap text-secondary-500">{client.nitOrCc}</td>
                      <td className="px-5 py-4 text-sm whitespace-nowrap text-secondary-500">{client.phone}</td>

                      <td className="px-5 py-4 text-sm whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${isHighBalance
                            ? 'bg-danger-50 text-danger border border-danger/20'
                            : 'bg-success-50 text-success-dark border border-success/20'
                          }`}>
                          {formatCurrency(balance)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm">
                        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setClientForPayments(client)}
                            className="p-2 text-secondary-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Gestionar Pagos"
                          >
                            <DollarSign size={16} />
                          </button>
                          <Link
                            to={`/clients/${client.id}/edit`}
                            className="p-2 text-secondary-400 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"
                            title="Editar Cliente"
                          >
                            <Edit3 size={16} />
                          </Link>
                          <button
                            onClick={() => setClientToDelete(client)}
                            className="p-2 text-secondary-400 hover:text-danger hover:bg-danger-50 rounded-lg transition-colors"
                            title="Eliminar Cliente"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Manager Modal */}
      {clientForPayments && (
        <Modal
          isOpen={!!clientForPayments}
          onClose={() => {
            setClientForPayments(null);
            fetchData();
          }}
          title={`Gestión de Pagos: ${clientForPayments.name}`}
          size="2xl"
        >
          <PaymentManager
            client={clientForPayments}
            onClose={() => {
              setClientForPayments(null);
              fetchData();
            }}
          />
        </Modal>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        title="Confirmar Eliminación"
        footer={
          <>
            <button
              onClick={() => setClientToDelete(null)}
              className="px-4 py-2.5 bg-secondary-100 text-secondary-700 rounded-xl hover:bg-secondary-200 transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteClient}
              className="px-4 py-2.5 bg-danger text-white rounded-xl hover:bg-danger-dark transition-colors text-sm font-medium"
            >
              Eliminar
            </button>
          </>
        }
      >
        <p className="text-secondary-700">¿Está seguro que desea eliminar el cliente "{clientToDelete?.name}"?</p>
        <p className="text-sm text-secondary-400 mt-1">Esta acción no se puede deshacer.</p>
      </Modal>
    </div>
  );
};

export default ClientListPage;