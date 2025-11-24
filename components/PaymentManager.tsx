import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { Payment, Client } from '../types';
import { getPaymentsByClient, createPayment, deletePayment } from '../services/paymentService';
import LoadingSpinner from './LoadingSpinner';
import { formatCurrency, formatDateForDisplay, formatDateForInput } from '../utils/formatting';
import { Trash2, PlusCircle, DollarSign } from 'lucide-react';

interface PaymentManagerProps {
  client: Client;
  onClose: () => void;
}

const PaymentManager: React.FC<PaymentManagerProps> = ({ client }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newPayment, setNewPayment] = useState({
    amount: '',
    date: formatDateForInput(new Date()),
    method: 'Transferencia',
    notes: ''
  });

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPaymentsByClient(client.id);
      setPayments(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los pagos.');
    } finally {
      setIsLoading(false);
    }
  }, [client.id]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewPayment(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const paymentData = {
        clientId: client.id,
        amount: parseFloat(newPayment.amount),
        date: newPayment.date,
        method: newPayment.method,
        notes: newPayment.notes,
      };
      await createPayment(paymentData);
      setNewPayment({ // Reset form
        amount: '',
        date: formatDateForInput(new Date()),
        method: 'Transferencia',
        notes: ''
      });
      fetchPayments(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'Error al registrar el pago.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async (paymentId: string) => {
    if (window.confirm('¿Está seguro que desea eliminar este pago?')) {
        try {
            await deletePayment(paymentId);
            fetchPayments(); // Refresh list
        } catch (err: any) {
            setError(err.message || 'Error al eliminar el pago.');
        }
    }
  };

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      {error && <div className="text-red-500 bg-red-100 p-3 rounded-md">{error}</div>}
      
      {/* New Payment Form */}
      <form onSubmit={handleSubmit} className="p-4 bg-gray-50 rounded-lg border space-y-4">
        <h4 className="text-lg font-semibold text-gray-700">Registrar Nuevo Pago</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-600 mb-1">Monto</label>
            <input type="number" name="amount" id="amount" value={newPayment.amount} onChange={handleInputChange} required min="0.01" step="0.01" className="w-full p-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-600 mb-1">Fecha</label>
            <input type="date" name="date" id="date" value={newPayment.date} onChange={handleInputChange} required className="w-full p-2 border border-gray-300 rounded-md" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="method" className="block text-sm font-medium text-gray-600 mb-1">Método de Pago</label>
            <select name="method" id="method" value={newPayment.method} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md bg-white">
                <option>Transferencia</option>
                <option>Efectivo</option>
                <option>PSE</option>
                <option>Otro</option>
            </select>
          </div>
          <div className="md:col-span-2">
             <label htmlFor="notes" className="block text-sm font-medium text-gray-600 mb-1">Notas (Opcional)</label>
             <textarea name="notes" id="notes" value={newPayment.notes} onChange={handleInputChange} rows={2} className="w-full p-2 border border-gray-300 rounded-md" />
          </div>
        </div>
        <div className="text-right">
            <button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg shadow-sm flex items-center transition-colors disabled:opacity-50 inline-flex">
                <PlusCircle size={18} className="mr-2"/>
                {isSubmitting ? 'Registrando...' : 'Agregar Pago'}
            </button>
        </div>
      </form>

      {/* Payment History */}
      <div>
        <h4 className="text-lg font-semibold text-gray-700 mb-2">Historial de Pagos</h4>
        {isLoading ? (
          <LoadingSpinner />
        ) : payments.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-md">
            <DollarSign size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">No hay pagos registrados para este cliente.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left font-semibold text-gray-600">Fecha</th>
                  <th className="p-3 text-left font-semibold text-gray-600">Monto</th>
                  <th className="p-3 text-left font-semibold text-gray-600">Método</th>
                  <th className="p-3 text-left font-semibold text-gray-600">Notas</th>
                  <th className="p-3 text-center font-semibold text-gray-600">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {payments.map(p => (
                  <tr key={p.id} className="border-t">
                    <td className="p-3 whitespace-nowrap">{formatDateForDisplay(p.date)}</td>
                    <td className="p-3 whitespace-nowrap font-medium">{formatCurrency(p.amount)}</td>
                    <td className="p-3 whitespace-nowrap">{p.method}</td>
                    <td className="p-3">{p.notes}</td>
                    <td className="p-3 text-center">
                      <button onClick={() => handleDelete(p.id)} className="text-danger hover:text-red-700" title="Eliminar Pago">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
               <tfoot className="bg-gray-100 font-bold">
                    <tr>
                        <td className="p-3 text-right" colSpan={1}>Total Pagado:</td>
                        <td className="p-3" colSpan={4}>{formatCurrency(totalPaid)}</td>
                    </tr>
                </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentManager;
