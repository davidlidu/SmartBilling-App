import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Client } from '../../types';
import { getClients, deleteClient as apiDeleteClient } from '../../services/clientService';
import { getInvoices } from '../../services/invoiceService';
// CAMBIO IMPORTANTE: Usamos la función específica por cliente que sabemos que funciona
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

  // Función para calcular total de una factura
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
      // 1. Primero cargamos Clientes y Facturas
      const [clientsData, invoicesData] = await Promise.all([
        getClients(),
        getInvoices(),
      ]);

      setClients(clientsData);

      // 2. ESTRATEGIA SEGURA: Cargar pagos por cada cliente
      // Creamos una lista de peticiones (una por cliente)
      const paymentsPromises = clientsData.map(client => 
        getPaymentsByClient(client.id)
            .catch(err => {
                console.warn(`Error cargando pagos para ${client.name}`, err);
                return []; // Si falla uno, retornamos array vacío para no romper todo
            })
      );

      // Ejecutamos todas las peticiones en paralelo (rápido)
      const paymentsResults = await Promise.all(paymentsPromises);

      // 3. Calcular Saldos
      const newBalances: Record<string, number> = {};

      clientsData.forEach((client, index) => {
        const cId = String(client.id);

        // A. Sumar Facturas
        const clientInvoices = invoicesData.filter(inv => String(inv.clientId) === cId);
        const totalInvoiced = clientInvoices.reduce((sum, inv) => sum + calculateInvoiceAmount(inv), 0);

        // B. Sumar Pagos
        // paymentsResults[index] contiene los pagos del cliente en la misma posición
        const clientPayments = paymentsResults[index] || []; 
        
        const totalPaid = clientPayments.reduce((sum, pay: any) => {
            // Limpiamos el valor por si viene como string con comas o texto
            let val = pay.amount || pay.value || pay.amountPaid || 0;
            if (typeof val === 'string') {
                val = parseFloat(val.replace(/,/g, '')); // Quitamos comas si existen
            }
            return sum + Number(val);
        }, 0);

        // DEBUG: Descomenta esto si quieres ver los números en la consola
        // console.log(`Cliente: ${client.name} | Facturado: ${totalInvoiced} | Pagado: ${totalPaid}`);

        // C. Saldo = Facturado - Pagado
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
    return <div className="text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
  }

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-semibold text-gray-700">Clientes</h2>
        <Link
          to="/clients/new"
          className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center transition-colors w-full sm:w-auto justify-center"
        >
          <PlusCircle size={20} className="mr-2" />
          Agregar Cliente
        </Link>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar clientes por nombre o NIT/CC..."
            className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Buscar clientes"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        </div>
      </div>
      
      {filteredClients.length === 0 && !isLoading ? (
         <div className="text-center py-10 bg-white rounded-lg shadow">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-xl">No se encontraron clientes.</p>
        </div>
      ) : (
      <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nombre</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">NIT/CC</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Teléfono</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Saldo Pendiente</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map(client => {
              const balance = balances[client.id] || 0;
              // Si el saldo es mayor a $1000, lo mostramos rojo. Si es menor o cero (a favor), verde.
              const balanceColor = balance > 1000 ? 'text-red-600 font-bold' : 'text-green-600 font-medium';

              return (
              <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4 border-b border-gray-200 text-sm whitespace-nowrap text-gray-800">{client.name}</td>
                <td className="px-5 py-4 border-b border-gray-200 text-sm whitespace-nowrap text-gray-800">{client.nitOrCc}</td>
                <td className="px-5 py-4 border-b border-gray-200 text-sm whitespace-nowrap text-gray-800">{client.phone}</td>
                
                {/* Columna de Saldo */}
                <td className={`px-5 py-4 border-b border-gray-200 text-sm whitespace-nowrap ${balanceColor}`}>
                    {formatCurrency(balance)}
                </td>

                <td className="px-5 py-4 border-b border-gray-200 text-sm">
                  <div className="flex space-x-2">
                    <button 
                        onClick={() => setClientForPayments(client)} 
                        className="bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-900 p-2 rounded-md transition-colors" 
                        title="Gestionar Pagos"
                    >
                        <DollarSign size={18} />
                    </button>
                    <Link to={`/clients/${client.id}/edit`} className="text-primary-dark hover:text-primary p-2" title="Editar Cliente">
                      <Edit3 size={18} />
                    </Link>
                    <button onClick={() => setClientToDelete(client)} className="text-danger hover:text-red-700 p-2" title="Eliminar Cliente">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
      )}

      {clientForPayments && (
        <Modal
            isOpen={!!clientForPayments}
            onClose={() => {
                setClientForPayments(null);
                fetchData(); // Recargamos para actualizar el saldo al cerrar
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

      <Modal
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        title="Confirmar Eliminación"
        footer={
          <>
            <button
              onClick={() => setClientToDelete(null)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteClient}
              className="px-4 py-2 bg-danger text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Eliminar
            </button>
          </>
        }
      >
        <p>¿Está seguro que desea eliminar el cliente "{clientToDelete?.name}"?</p>
        <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
      </Modal>
    </div>
  );
};

export default ClientListPage;