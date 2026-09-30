import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Invoice, Client, LineItem, SenderDetails, InvoiceCurrency, TrmInfo } from '../../types';
import { getInvoiceById, createInvoice, updateInvoice, getNextInvoiceNumber, getTrm } from '../../services/invoiceService';
import { getClients } from '../../services/clientService';
import { getSettings } from '../../services/settingsService';
import LoadingSpinner from '../../components/LoadingSpinner';
import RichTextEditor from '../../components/RichTextEditor';
import { DEFAULT_UNIT, DEFAULT_SENDER_DETAILS } from '../../constants';
import { formatCurrency, formatDateForInput, formatTrm, formatDateForDisplay } from '../../utils/formatting';
import { Save, Plus, Trash2, ArrowLeft, Hash, Calendar, UserCheck, Package, DollarSign, RefreshCw } from 'lucide-react';

const InvoiceFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  // Preserve list filters (client / date range / search) carried in the URL.
  const backToList = `/invoices${location.search || ''}`;
  const [invoice, setInvoice] = useState<Partial<Invoice>>({
    invoiceNumber: '',
    date: formatDateForInput(new Date()),
    clientId: '',
    lineItems: [{ id: String(Date.now()), description: '', quantity: 1, unit: DEFAULT_UNIT, unitPrice: 0 }],
    notes: '',
    currency: 'COP',
    exchangeRate: null,
  });
  const [trmInfo, setTrmInfo] = useState<TrmInfo | null>(null);
  const [isTrmLoading, setIsTrmLoading] = useState(false);
  const [trmError, setTrmError] = useState<string | null>(null);
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
          setInvoice({ ...fetchedInvoiceData, currency: fetchedInvoiceData.currency || 'COP' });
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


  const isUsd = invoice.currency === 'USD';

  // Consulta la TRM oficial vigente para la fecha de la factura y la fija en la factura.
  const fetchTrm = async (date: string) => {
    setIsTrmLoading(true);
    setTrmError(null);
    try {
      const trm = await getTrm(date);
      setTrmInfo(trm);
      setInvoice(prev => ({ ...prev, exchangeRate: trm.value }));
    } catch (err: any) {
      console.error(err);
      setTrmInfo(null);
      setTrmError(err.message || 'No se pudo consultar la TRM. Ingrésela manualmente.');
    } finally {
      setIsTrmLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInvoice(prev => ({ ...prev, [name]: value }));
    // Al generar una factura nueva en USD, la TRM sigue a la fecha de la factura.
    // En facturas existentes la TRM queda fija (se puede actualizar con el botón).
    if (name === 'date' && isUsd && !isEditing && value) {
      fetchTrm(value);
    }
  };

  const handleCurrencyChange = (currency: InvoiceCurrency) => {
    setInvoice(prev => ({ ...prev, currency }));
    setTrmError(null);
    if (currency === 'USD' && !invoice.exchangeRate) {
      fetchTrm(invoice.date || formatDateForInput(new Date()));
    }
  };

  const handleExchangeRateChange = (value: string) => {
    setTrmInfo(null); // valor manual: ya no corresponde a la consulta oficial
    setInvoice(prev => ({ ...prev, exchangeRate: parseFloat(value) || null }));
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

  // Total en COP (para USD: total USD x TRM, redondeado al peso como en el backend)
  const calculateTotalCop = (): number => {
    const total = calculateTotal();
    return isUsd ? Math.round(total * (invoice.exchangeRate || 0)) : total;
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
    if (isUsd && !(invoice.exchangeRate && invoice.exchangeRate > 0)) {
      setError("Ingrese o consulte la TRM para facturar en USD.");
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
        currency: invoice.currency || 'COP',
        exchangeRate: isUsd ? invoice.exchangeRate : null,
      };

      if (isEditing && id) {
        await updateInvoice(id, payload);
      } else {
        await createInvoice(payload);
      }
      navigate(backToList);
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
    return <div className="text-danger bg-danger-50 p-4 rounded-2xl border border-danger/20">{error} <Link to={backToList} className="underline ml-2 font-medium">Volver al listado</Link></div>;
  }

  return (
    <div className="container mx-auto pb-10 max-w-5xl animate-fadeIn">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link to={backToList} className="text-secondary-400 hover:text-primary p-2 rounded-xl hover:bg-primary-50 transition-colors">
          <ArrowLeft size={22} />
        </Link>
        <div className="ml-3">
          <h2 className="text-2xl font-bold text-secondary-800">
            {isEditing ? `Editar Factura` : 'Crear Nueva Factura'}
          </h2>
          {isEditing && <p className="text-sm text-secondary-400">#{invoice.invoiceNumber}</p>}
        </div>
      </div>

      {error && <div className="mb-4 text-danger bg-danger-50 border border-danger/20 p-3 rounded-xl text-sm font-medium animate-fadeIn">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Invoice Header Card */}
        <div className="bg-white p-6 rounded-2xl shadow-card border border-secondary-100">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-primary-50 rounded-lg">
              <Hash size={18} className="text-primary" />
            </div>
            <h3 className="text-base font-bold text-secondary-800">Información General</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label htmlFor="invoiceNumber" className="block text-xs font-semibold text-secondary-500 mb-1.5 uppercase tracking-wider">Número de Factura</label>
              <input
                type="text"
                name="invoiceNumber"
                id="invoiceNumber"
                value={invoice.invoiceNumber || ''}
                onChange={handleChange}
                required
                className="w-full p-3 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-sm"
              />
            </div>
            <div>
              <label htmlFor="date" className="block text-xs font-semibold text-secondary-500 mb-1.5 uppercase tracking-wider">Fecha</label>
              <input
                type="date"
                name="date"
                id="date"
                value={invoice.date || ''}
                onChange={handleChange}
                required
                className="w-full p-3 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-sm"
              />
            </div>
            <div>
              <label htmlFor="clientId" className="block text-xs font-semibold text-secondary-500 mb-1.5 uppercase tracking-wider">Cliente</label>
              <select
                name="clientId"
                id="clientId"
                value={invoice.clientId || ''}
                onChange={handleChange}
                required
                className="w-full p-3 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all bg-white text-sm"
              >
                <option value="" disabled>Seleccione un cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Moneda y TRM */}
          <div className="mt-5 pt-5 border-t border-secondary-100 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-secondary-500 mb-1.5 uppercase tracking-wider">Moneda de cobro</label>
              <div className="flex rounded-xl border border-secondary-200 p-1 bg-secondary-50">
                {(['COP', 'USD'] as InvoiceCurrency[]).map(cur => (
                  <button
                    key={cur}
                    type="button"
                    onClick={() => handleCurrencyChange(cur)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${invoice.currency === cur ? 'bg-white text-primary-700 shadow-sm' : 'text-secondary-400 hover:text-secondary-600'}`}
                  >
                    {cur === 'COP' ? 'Pesos (COP)' : 'Dólares (USD)'}
                  </button>
                ))}
              </div>
            </div>

            {isUsd && (
              <div className="md:col-span-2">
                <label htmlFor="exchangeRate" className="block text-xs font-semibold text-secondary-500 mb-1.5 uppercase tracking-wider">TRM (COP por 1 USD)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
                    <input
                      type="number"
                      id="exchangeRate"
                      value={invoice.exchangeRate ?? ''}
                      onChange={(e) => handleExchangeRateChange(e.target.value)}
                      required
                      min="0"
                      step="0.01"
                      placeholder={isTrmLoading ? 'Consultando...' : 'Ej: 4000.00'}
                      className="w-full p-3 pl-9 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchTrm(invoice.date || formatDateForInput(new Date()))}
                    disabled={isTrmLoading}
                    className="flex items-center gap-1.5 px-4 rounded-xl border border-primary-200 text-primary-700 hover:bg-primary-50 text-sm font-semibold transition-all disabled:opacity-50"
                    title="Consultar TRM oficial para la fecha de la factura"
                  >
                    <RefreshCw size={16} className={isTrmLoading ? 'animate-spin' : ''} />
                    TRM oficial
                  </button>
                </div>
                {trmInfo && (
                  <p className="text-xs text-secondary-400 mt-1.5">
                    TRM vigente {formatDateForDisplay(trmInfo.validFrom)}
                    {trmInfo.validTo !== trmInfo.validFrom ? ` – ${formatDateForDisplay(trmInfo.validTo)}` : ''} · {trmInfo.source}
                  </p>
                )}
                {!trmInfo && isEditing && invoice.exchangeRate && !trmError && (
                  <p className="text-xs text-secondary-400 mt-1.5">TRM fijada al generar la factura.</p>
                )}
                {trmError && <p className="text-xs text-danger mt-1.5">{trmError}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Line Items Card */}
        <div className="bg-white p-6 rounded-2xl shadow-card border border-secondary-100">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Package size={18} className="text-emerald-600" />
              </div>
              <h3 className="text-base font-bold text-secondary-800">Ítems</h3>
            </div>
            <span className="text-xs text-secondary-400 bg-secondary-50 px-3 py-1 rounded-full font-medium">
              {(invoice.lineItems || []).length} ítem{(invoice.lineItems || []).length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-4">
            {(invoice.lineItems || []).map((item, index) => (
              <div key={item.id || index} className="relative p-4 bg-secondary-50/50 rounded-xl border border-secondary-100 hover:border-primary-200 transition-colors group">
                {/* Row number */}
                <div className="absolute -left-0 top-4 w-7 h-7 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>

                <div className="grid grid-cols-12 gap-3 items-start pl-6">
                  {/* Description - WYSIWYG */}
                  <div className="col-span-12 md:col-span-5">
                    <label className="block text-xs font-semibold text-secondary-500 mb-1.5">Descripción</label>
                    <RichTextEditor
                      value={item.description}
                      onChange={(html) => handleLineItemChange(index, 'description', html)}
                      placeholder="Descripción del ítem..."
                      minHeight="60px"
                    />
                  </div>

                  <div className="col-span-4 md:col-span-2">
                    <label htmlFor={`quantity-${index}`} className="block text-xs font-semibold text-secondary-500 mb-1.5">Cantidad</label>
                    <input
                      type="number"
                      id={`quantity-${index}`}
                      placeholder="Cant."
                      value={item.quantity}
                      onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                      required
                      min="0"
                      step="any"
                      className="w-full p-2.5 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-sm"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <label htmlFor={`unit-${index}`} className="block text-xs font-semibold text-secondary-500 mb-1.5">Unidad</label>
                    <select
                      id={`unit-${index}`}
                      value={item.unit}
                      onChange={(e) => handleLineItemChange(index, 'unit', e.target.value)}
                      required
                      className="w-full p-2.5 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all bg-white text-sm"
                    >
                      {lineItemUnitOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <label htmlFor={`unitPrice-${index}`} className="block text-xs font-semibold text-secondary-500 mb-1.5">Precio Unit.{isUsd ? ' (USD)' : ''}</label>
                    <input
                      type="number"
                      id={`unitPrice-${index}`}
                      placeholder="Precio"
                      value={item.unitPrice}
                      onChange={(e) => handleLineItemChange(index, 'unitPrice', e.target.value)}
                      required
                      min="0"
                      step="any"
                      className="w-full p-2.5 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-sm"
                    />
                  </div>
                  <div className="col-span-12 md:col-span-1 flex justify-end md:justify-center items-center h-full pt-6">
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      className="text-secondary-300 hover:text-danger hover:bg-danger-50 p-2 rounded-xl transition-all opacity-60 group-hover:opacity-100"
                      title="Eliminar ítem"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addLineItem}
            className="mt-4 flex items-center text-primary hover:text-primary-700 font-semibold py-2.5 px-5 rounded-xl border-2 border-dashed border-primary-200 hover:border-primary-400 hover:bg-primary-50 transition-all text-sm w-full justify-center"
          >
            <Plus size={18} className="mr-2" /> Agregar Ítem
          </button>
        </div>

        {/* Total */}
        <div className="flex justify-end">
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white px-8 py-4 rounded-2xl shadow-glow">
            <p className="text-xs text-primary-200 font-medium uppercase tracking-wider">Monto Total</p>
            <p className="text-3xl font-bold mt-0.5">{formatCurrency(calculateTotal(), invoice.currency)}</p>
            {isUsd && (
              <p className="text-sm text-primary-100 mt-1">
                ≈ {formatCurrency(calculateTotalCop())} <span className="text-primary-200 text-xs">· TRM {formatTrm(invoice.exchangeRate)}</span>
              </p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white p-6 rounded-2xl shadow-card border border-secondary-100">
          <label htmlFor="notes" className="block text-xs font-semibold text-secondary-500 mb-1.5 uppercase tracking-wider">Notas / Información de Pago</label>
          <textarea
            name="notes"
            id="notes"
            value={invoice.notes || ''}
            onChange={handleChange}
            rows={3}
            className="w-full p-3 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-sm"
            placeholder="Ej: Detalles de cuenta bancaria, términos y condiciones..."
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isLoading || isPageLoading}
            className="bg-gradient-to-r from-primary to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-glow flex items-center transition-all disabled:opacity-50 text-sm"
          >
            <Save size={18} className="mr-2" />
            {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar Factura' : 'Crear Factura')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceFormPage;