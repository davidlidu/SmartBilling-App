import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Invoice, Client, LineItem, SenderDetails } from '../../types'; 
import { getInvoiceById, createInvoice, updateInvoice, getNextInvoiceNumber } from '../../services/invoiceService';
import { getClients } from '../../services/clientService';
import { getSettings } from '../../services/settingsService'; 
import LoadingSpinner from '../../components/LoadingSpinner';
import { DEFAULT_UNIT, DEFAULT_SENDER_DETAILS } from '../../constants';
import { formatCurrency, formatDateForInput } from '../../utils/formatting';
import { Save, Plus, Trash2, ArrowLeft } from 'lucide-react';

const InvoiceFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Partial<Invoice>>({
    invoiceNumber: '',
    date: formatDateForInput(new Date()),
    clientId: '',
    lineItems: [{ id: String(Date.now()), description: '', quantity: 1, unit: DEFAULT_UNIT, unitPrice: 0 }],
    notes: '', 
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false); 
  const [isPageLoading, setIsPageLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(id);

  const lineItemUnitOptions = ["UND", "HORA", "SERVICIO"];

  const fetchRequiredData = useCallback(async () => {
    setIsPageLoading(true);
    setError(null);
    try {
      const clientDataPromise = getClients();
      const appSettingsPromise = getSettings();
      
      let invoiceDataPromise: Promise<Invoice | undefined | null> = Promise.resolve(null);
      let nextInvNumPromise: Promise<string> = Promise.resolve('');

      if (isEditing && id) {
        invoiceDataPromise = getInvoiceById(id);
      } else {
        nextInvNumPromise = getNextInvoiceNumber();
      }

      const [clientData, appSettings, fetchedInvoiceData, nextInvNum] = await Promise.all([
        clientDataPromise,
        appSettingsPromise,
        invoiceDataPromise,
        nextInvNumPromise
      ]);
      
      setClients(clientData);

      if (isEditing) {
        if (fetchedInvoiceData) {
          setInvoice(fetchedInvoiceData);
        } else {
          setError('Factura no encontrada.');
        }
      } else {
        setInvoice(prev => ({ 
          ...prev, 
          invoiceNumber: nextInvNum,
          lineItems: [{ id: String(Date.now()), description: '', quantity: 1, unit: lineItemUnitOptions.includes(DEFAULT_UNIT) ? DEFAULT_UNIT : lineItemUnitOptions[0], unitPrice: 0 }],
          notes: appSettings?.bankAccountInfo || DEFAULT_SENDER_DETAILS.bankAccountInfo 
        }));
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al cargar datos para el formulario de factura.');
    } finally {
      setIsPageLoading(false);
    }
  }, [id, isEditing]);


  useEffect(() => {
    fetchRequiredData();
  }, [fetchRequiredData]);
  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInvoice(prev => ({ ...prev, [name]: value }));
  };

  const handleLineItemChange = (index: number, field: keyof LineItem, value: string | number) => {
    const updatedLineItems = [...(invoice.lineItems || [])];
    const itemToUpdate = { ...updatedLineItems[index] };
    
    if (field === 'quantity' || field === 'unitPrice') {
        // @ts-ignore
        itemToUpdate[field] = parseFloat(value as string) || 0;
    } else {
        // @ts-ignore
        itemToUpdate[field] = value;
    }
    updatedLineItems[index] = itemToUpdate;
    setInvoice(prev => ({ ...prev, lineItems: updatedLineItems }));
  };

  const addLineItem = () => {
    setInvoice(prev => ({
      ...prev,
      lineItems: [
        ...(prev.lineItems || []),
        { id: String(Date.now()), description: '', quantity: 1, unit: lineItemUnitOptions.includes(DEFAULT_UNIT) ? DEFAULT_UNIT : lineItemUnitOptions[0], unitPrice: 0 }
      ]
    }));
  };

  const removeLineItem = (index: number) => {
    setInvoice(prev => ({
      ...prev,
      lineItems: (prev.lineItems || []).filter((_, i) => i !== index)
    }));
  };

  const calculateTotal = (): number => {
    return (invoice.lineItems || []).reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!invoice.clientId) {
        setError("Por favor, seleccione un cliente.");
        return;
    }
    if (!invoice.lineItems || invoice.lineItems.length === 0) {
        setError("Por favor, agregue al menos un ítem.");
        return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const payload: Omit<Invoice, 'id' | 'client'> = {
        invoiceNumber: invoice.invoiceNumber || '',
        date: invoice.date || formatDateForInput(new Date()),
        clientId: invoice.clientId,
        lineItems: invoice.lineItems,
        notes: invoice.notes || '',
      };

      if (isEditing && id) {
        await updateInvoice(id, payload);
      } else {
        await createInvoice(payload);
      }
      navigate('/invoices');
    } catch (err: any) {
      console.error(err);
      setError(err.message || `Error al ${isEditing ? 'actualizar' : 'crear'} la factura.`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isPageLoading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner size={12} /></div>;
  }

  if (error && !isEditing && clients.length === 0 && !isPageLoading) { 
      return <div className="text-red-500 bg-red-100 p-4 rounded-md">{error} <Link to="/invoices" className="underline ml-2">Volver al listado</Link></div>;
  }

  return (
    <div className="container mx-auto pb-10">
      <div className="flex items-center mb-6">
         <Link to="/invoices" className="text-primary hover:text-primary-dark p-2 rounded-full hover:bg-primary-light/10">
            <ArrowLeft size={24} />
        </Link>
        <h2 className="text-3xl font-semibold text-gray-700 ml-2">
          {isEditing ? `Editar Factura #${invoice.invoiceNumber}` : 'Crear Nueva Factura'}
        </h2>
      </div>
      
      {error && <div className="mb-4 text-red-600 bg-red-100 p-3 rounded-md">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg space-y-8">
        {/* Invoice Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700 mb-1">Número de Factura</label>
            <input
              type="text"
              name="invoiceNumber"
              id="invoiceNumber"
              value={invoice.invoiceNumber || ''}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              name="date"
              id="date"
              value={invoice.date || ''}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <select
              name="clientId"
              id="clientId"
              value={invoice.clientId || ''}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary bg-white"
            >
              <option value="" disabled>Seleccione un cliente</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-700 border-b pb-2">Ítems</h3>
          {(invoice.lineItems || []).map((item, index) => (
            <div key={item.id || index} className="grid grid-cols-12 gap-3 items-start p-4 bg-gray-50 rounded-md border border-gray-200">
              
              {/* CAMBIO: Input ahora es Textarea y ocupa más espacio vertical */}
              <div className="col-span-12 md:col-span-5">
                 <label htmlFor={`description-${index}`} className="block text-xs font-medium text-gray-500 mb-1">Descripción (Texto/HTML)</label>
                <textarea
                  id={`description-${index}`}
                  placeholder="Descripción del ítem..."
                  value={item.description}
                  onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                  required
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-light focus:border-primary-light resize-y text-sm"
                />
                <p className="text-[10px] text-gray-400 mt-1">Soporta texto largo y URLs.</p>
              </div>

              <div className="col-span-4 md:col-span-2">
                <label htmlFor={`quantity-${index}`} className="block text-xs font-medium text-gray-500 mb-1">Cantidad</label>
                <input
                  type="number"
                  id={`quantity-${index}`}
                  placeholder="Cant."
                  value={item.quantity}
                  onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                  required
                  min="0"
                  step="any"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-light focus:border-primary-light h-[42px]"
                />
              </div>
               <div className="col-span-4 md:col-span-2">
                <label htmlFor={`unit-${index}`} className="block text-xs font-medium text-gray-500 mb-1">Unidad</label>
                <select
                  id={`unit-${index}`}
                  value={item.unit}
                  onChange={(e) => handleLineItemChange(index, 'unit', e.target.value)}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-light focus:border-primary-light bg-white h-[42px]"
                >
                  {lineItemUnitOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-4 md:col-span-2">
                <label htmlFor={`unitPrice-${index}`} className="block text-xs font-medium text-gray-500 mb-1">Precio Unit.</label>
                <input
                  type="number"
                  id={`unitPrice-${index}`}
                  placeholder="Precio"
                  value={item.unitPrice}
                  onChange={(e) => handleLineItemChange(index, 'unitPrice', e.target.value)}
                  required
                  min="0"
                  step="any"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-light focus:border-primary-light h-[42px]"
                />
              </div>
              <div className="col-span-12 md:col-span-1 flex justify-end md:justify-center items-center h-full pt-6">
                <button
                  type="button"
                  onClick={() => removeLineItem(index)}
                  className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                  title="Eliminar ítem"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addLineItem}
            className="mt-2 flex items-center text-primary hover:text-primary-dark font-medium py-2 px-4 rounded-lg border border-primary hover:bg-primary-light/10 transition-colors"
          >
            <Plus size={18} className="mr-2" /> Agregar Ítem
          </button>
        </div>

        {/* Totals */}
        <div className="flex justify-end items-center pt-4 border-t">
            <div className="text-right">
                <p className="text-sm text-gray-500">Monto Total</p>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(calculateTotal())}</p>
            </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notas / Información de Pago</label>
          <textarea
            name="notes"
            id="notes"
            value={invoice.notes || ''}
            onChange={handleChange}
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
            placeholder="Ej: Detalles de cuenta bancaria, términos y condiciones..."
          />
        </div>

        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={isLoading || isPageLoading} 
            className="bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg shadow-md flex items-center transition-colors disabled:opacity-50"
          >
            <Save size={20} className="mr-2" />
            {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar Factura' : 'Crear Factura')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceFormPage;