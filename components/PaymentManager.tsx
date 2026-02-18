import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { Payment, Client } from '../types';
import { getPaymentsByClient, createPayment, deletePayment } from '../services/paymentService';
import LoadingSpinner from './LoadingSpinner';
import { formatCurrency, formatDateForDisplay, formatDateForInput } from '../utils/formatting';
import { Trash2, PlusCircle, DollarSign, AlertCircle } from 'lucide-react';

interface PaymentManagerProps {
  client: Client;
  onClose: () => void;
}

const PaymentManager: React.FC<PaymentManagerProps> = ({ client }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
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
    if (!newPayment.amount || Number(newPayment.amount) <= 0) {
      setError('Por favor ingrese un monto válido.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const paymentData = {
        clientId: client.id,
        amount: parseFloat(newPayment.amount),
        date: newPayment.date,
        method: newPayment.method,
        notes: newPayment.notes,
      };
      await createPayment(paymentData);
      setNewPayment({
        amount: '',
        date: formatDateForInput(new Date()),
        method: 'Transferencia',
        notes: ''
      });
      setSuccessMsg('Pago registrado correctamente.');
      fetchPayments();
    } catch (err: any) {
      setError(err.message || 'Error al registrar el pago.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const handleDelete = async (paymentId: string) => {
    if (window.confirm('¿Está seguro que desea eliminar este pago?')) {
      try {
        await deletePayment(paymentId);
        fetchPayments();
      } catch (err: any) {
        setError(err.message || 'Error al eliminar el pago.');
      }
    }
  };

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      {error && (
        <div className="bg-danger-50 border border-danger/20 p-3 rounded-xl flex items-center text-sm animate-fadeIn">
          <AlertCircle className="text-danger mr-2 flex-shrink-0" size={18} />
          <p className="text-danger font-medium">{error}</p>
        </div>
      )}
      {successMsg && (
        <div className="bg-success-50 border border-success/20 p-3 rounded-xl text-sm animate-fadeIn">
          <p className="text-success-dark font-medium">{successMsg}</p>
        </div>
      )}

      {/* New Payment Form */}
      <form onSubmit={handleSubmit} className="p-5 bg-primary-50/50 rounded-xl border border-primary-100 space-y-4">
        <h4 className="text-sm font-bold text-secondary-800 flex items-center">
          <PlusCircle size={18} className="mr-2 text-primary" />
          Registrar Nuevo Pago
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="amount" className="block text-xs font-semibold text-secondary-500 mb-1 uppercase tracking-wider">Monto ($)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-secondary-400 text-sm">$</span>
              </div>
              <input
                type="number"
                name="amount"
                id="amount"
                value={newPayment.amount}
                onChange={handleInputChange}
                required
                min="1"
                step="any"
                placeholder="0.00"
                className="w-full pl-7 p-2.5 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-sm"
              />
            </div>
          </div>
          <div>
            <label htmlFor="date" className="block text-xs font-semibold text-secondary-500 mb-1 uppercase tracking-wider">Fecha</label>
            <input
              type="date"
              name="date"
              id="date"
              value={newPayment.date}
              onChange={handleInputChange}
              required
              className="w-full p-2.5 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="method" className="block text-xs font-semibold text-secondary-500 mb-1 uppercase tracking-wider">Método de Pago</label>
            <select name="method" id="method" value={newPayment.method} onChange={handleInputChange} className="w-full p-2.5 border border-secondary-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-sm">
              <option>Transferencia Bancaria</option>
              <option>Efectivo</option>
              <option>PSE</option>
              <option>Tarjeta de Crédito</option>
              <option>Cheque</option>
              <option>Otro</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="notes" className="block text-xs font-semibold text-secondary-500 mb-1 uppercase tracking-wider">Notas (Opcional)</label>
            <textarea name="notes" id="notes" value={newPayment.notes} onChange={handleInputChange} rows={2} className="w-full p-2.5 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-sm" placeholder="Referencia, concepto, etc." />
          </div>
        </div>
        <div className="text-right pt-2">
          <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white font-semibold py-2.5 px-6 rounded-xl shadow-md transition-all disabled:opacity-50 inline-flex justify-center items-center text-sm">
            {isSubmitting ? <LoadingSpinner size={4} /> : <DollarSign size={18} className="mr-2" />}
            {isSubmitting ? 'Guardando...' : 'Guardar Pago'}
          </button>
        </div>
      </form>

      {/* Payment History */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-bold text-secondary-800">Historial de Pagos</h4>
          <span className="text-xs font-bold bg-success-50 text-success-dark px-3 py-1 rounded-lg border border-success/20">
            Total: {formatCurrency(totalPaid)}
          </span>
        </div>

        {isLoading ? (
          <div className="py-8"><LoadingSpinner /></div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8 bg-secondary-50 rounded-xl border border-dashed border-secondary-200">
            <DollarSign size={32} className="mx-auto text-secondary-300 mb-2" />
            <p className="text-secondary-400 text-sm">No hay pagos registrados para este cliente.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-secondary-100 rounded-xl shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-secondary-50 border-b border-secondary-200">
                <tr>
                  <th className="p-3 text-left text-[11px] font-bold text-secondary-500 uppercase tracking-wider">Fecha</th>
                  <th className="p-3 text-left text-[11px] font-bold text-secondary-500 uppercase tracking-wider">Monto</th>
                  <th className="p-3 text-left text-[11px] font-bold text-secondary-500 uppercase tracking-wider">Método</th>
                  <th className="p-3 text-left text-[11px] font-bold text-secondary-500 uppercase tracking-wider">Notas</th>
                  <th className="p-3 text-center text-[11px] font-bold text-secondary-500 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-100">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-primary-50/30 transition-colors group">
                    <td className="p-3 whitespace-nowrap text-secondary-600">{formatDateForDisplay(p.date)}</td>
                    <td className="p-3 whitespace-nowrap font-bold text-success-dark">
                      {formatCurrency(Number(p.amount))}
                    </td>
                    <td className="p-3 whitespace-nowrap text-secondary-500">{p.method}</td>
                    <td className="p-3 text-secondary-500 max-w-xs truncate" title={p.notes}>{p.notes || '-'}</td>
                    <td className="p-3 text-center">
                      <button onClick={() => handleDelete(p.id)} className="text-secondary-300 hover:text-danger hover:bg-danger-50 p-1.5 rounded-lg transition-colors opacity-60 group-hover:opacity-100" title="Eliminar Pago">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentManager;