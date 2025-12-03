import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useLocation, useSearchParams } from 'react-router-dom'; // Importamos useSearchParams aquí
import { Invoice, Client, SenderDetails } from '../../types';
import { getInvoiceById } from '../../services/invoiceService';
import { getClientById } from '../../services/clientService'; 
import { getSettings } from '../../services/settingsService';
import { DEFAULT_SENDER_DETAILS } from '../../constants';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatCurrency, formatDateForDisplay } from '../../utils/formatting';
import { generatePdfFromElement } from '../../services/pdfService';
import { Download, ArrowLeft } from 'lucide-react';

const InvoicePdfViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  
  // --- CORRECCIÓN: Hooks movidos ADENTRO del componente ---
  const [searchParams] = useSearchParams();
  const autoDownload = searchParams.get('download'); 
  // --------------------------------------------------------

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [configuredSender, setConfiguredSender] = useState<SenderDetails>(DEFAULT_SENDER_DETAILS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [hasTriggeredDownload, setHasTriggeredDownload] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) {
      setError("Falta el ID de la factura.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const settingsPromise = getSettings();
      const invoiceDataPromise = getInvoiceById(id);

      const [settingsData, invoiceData] = await Promise.all([settingsPromise, invoiceDataPromise]);
      
      setConfiguredSender(settingsData || DEFAULT_SENDER_DETAILS);

      if (!invoiceData) {
        setError("Factura no encontrada.");
        setIsLoading(false);
        return;
      }
      setInvoice(invoiceData);

      if (invoiceData.clientId) {
        const clientData = await getClientById(invoiceData.clientId);
        setClient(clientData || invoiceData.client || null);
      } else if (invoiceData.client) {
         setClient(invoiceData.client);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al cargar los detalles de la factura.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGeneratePdf = async (quality: 'high' | 'low' = 'high') => {
    if (!invoice || !client) return; // Aseguramos que client exista también
    setIsGeneratingPdf(true);
    try {
      const suffix = quality === 'low' ? '-Web' : '';
      // Usamos client.name con seguridad (usando optional chaining o el estado client)
      const clientName = client?.name || invoice.client?.name || 'Cliente';
      
      await generatePdfFromElement(
        'invoice-pdf-content', 
        `Cuenta de Cobro-${invoice.invoiceNumber}${suffix} ${clientName}.pdf`, 
        quality
      );
    } catch(e) {
        console.error("Error en la generación del PDF:", e);
    } finally {
        setIsGeneratingPdf(false);
    }
  };
  
  // Efecto para la autodescarga
  useEffect(() => {
    const shouldDownload = autoDownload === 'true';

    // Wait for data to load, then trigger download if requested
    if (shouldDownload && !isLoading && !error && invoice && !isGeneratingPdf && !hasTriggeredDownload) {
        // Usamos un pequeño timeout para asegurar que el DOM se pintó
        const timer = setTimeout(() => {
             handleGeneratePdf('high');
             setHasTriggeredDownload(true);
        }, 800);
        
        return () => clearTimeout(timer);
    }
  }, [autoDownload, isLoading, error, invoice, isGeneratingPdf, hasTriggeredDownload]);


  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner size={16} /></div>;
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 bg-red-100 p-4 rounded-md text-xl">{error}</p>
        <Link to="/invoices" className="mt-4 inline-block bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark">
          Volver a Facturas
        </Link>
      </div>
    );
  }
  
  const displayClient = client || invoice?.client;

  if (!invoice || !displayClient) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Datos de factura o cliente no disponibles. Verifique que la factura y el cliente asociado existan.</p>
        <Link to="/invoices" className="mt-4 inline-block bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark">
          Volver a Facturas
        </Link>
      </div>
    );
  }

  const totalAmount = invoice.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return (
    <div className="bg-gray-100 min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <Link to="/invoices" className="text-primary hover:text-primary-dark p-2 rounded-full hover:bg-primary-light/10 flex items-center self-start">
                <ArrowLeft size={20} className="mr-1" /> Volver al Listado
            </Link>
            
            <div className="flex gap-2">
                <button
                    onClick={() => handleGeneratePdf('high')}
                    disabled={isGeneratingPdf}
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center transition-colors disabled:opacity-50"
                >
                    {isGeneratingPdf ? <LoadingSpinner size={5} /> : <Download size={20} className="mr-2" />}
                    {isGeneratingPdf ? 'Generando...' : 'Descargar PDF'}
                </button>
            </div>
        </div>

      <div id="invoice-pdf-content" className="bg-white p-8 md:p-10 shadow-xl max-w-4xl mx-auto text-sm font-['Verdana', 'sans-serif']">
        {/* Header */}
        <div className="grid grid-cols-3 gap-4 mb-8 pb-4 border-b border-gray-300">
          <div className="col-span-2">
            {configuredSender.logoUrl && <img src={configuredSender.logoUrl} alt="Logo Empresa" className="h-32 mb-2 object-contain max-w-full" />}
            {/* <h1 className="text-2xl font-bold text-gray-800">{configuredSender.name}</h1>
            <p className="text-gray-600">{configuredSender.nit}</p>
            <p className="text-gray-600">{configuredSender.type}</p> */}
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold text-primary-dark">CUENTA DE COBRO</h2>
            <p className="text-2xl font-bold text-gray-700">{invoice.invoiceNumber}</p>
            <p className="text-gray-600 mt-2"><strong>Fecha:</strong> {formatDateForDisplay(invoice.date)}</p>
          </div>
        </div>

        {/* Client Info */}
        <div className="grid grid-cols-2 gap-4 mb-8 pb-4 border-b border-gray-300">
          <div>
            <h3 className="font-semibold text-gray-500 uppercase tracking-wider text-xs mb-1">CLIENTE:</h3>
            <p className="font-bold text-gray-700">{displayClient.name}</p>
            <p className="text-gray-600">NIT/CC: {displayClient.nitOrCc}</p>
            <p className="text-gray-600">Dirección: {displayClient.address}</p>
            <p className="text-gray-600">Teléfono: {displayClient.phone}</p>
            <p className="text-gray-600">Ciudad: {displayClient.city}</p>
          </div>
        </div>

        {/* Line Items Table */}
        <table className="w-full mb-8 text-left table-fixed"> {/* CAMBIO 1: table-fixed */}
          <thead className="border-b-2 border-gray-700">
            <tr>
              <th className="py-2 px-1 text-xs font-semibold text-gray-600 uppercase text-center w-[5%]">Ítem</th>
              {/* w-2/5 equivale al 40%, aseguramos que se respete */}
              <th className="py-2 px-1 text-xs font-semibold text-gray-600 uppercase w-[45%]">Descripción</th> 
              <th className="py-2 px-1 text-xs font-semibold text-gray-600 uppercase text-right w-[10%]">Cantidad</th>
              <th className="py-2 px-1 text-xs font-semibold text-gray-600 uppercase text-center w-[10%]">Unidad</th>
              <th className="py-2 px-1 text-xs font-semibold text-gray-600 uppercase text-right w-[15%]">Vr. Unitario</th>
              <th className="py-2 px-1 text-xs font-semibold text-gray-600 uppercase text-right w-[15%]">Vr. Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item, index) => (
              <tr key={item.id} className="border-b border-gray-300 last:border-b-0">
                <td className="py-2 px-1 text-center align-top">{index + 1}</td>
                
                {/* CAMBIO 2: break-words y whitespace-pre-wrap */}
                <td className="py-2 px-1 break-words whitespace-pre-wrap align-top">
                    {/* OPCIÓN A: Si solo es texto plano (lo que tienes ahora) */}
                    {item.description}

                    {/* OPCIÓN B: Si quieres que renderice HTML/Imágenes/Links (como hablamos en el paso anterior) 
                      Usa esto EN LUGAR de {item.description}:
                      
                      <div dangerouslySetInnerHTML={{ __html: item.description }} />
                    */}
                </td>

                <td className="py-2 px-1 text-right align-top">{item.quantity.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                <td className="py-2 px-1 text-center align-top">{item.unit}</td>
                <td className="py-2 px-1 text-right align-top">{formatCurrency(item.unitPrice)}</td>
                <td className="py-2 px-1 text-right align-top">{formatCurrency(item.quantity * item.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div className="flex justify-end mb-8">
          <div className="w-auto min-w-[200px] sm:min-w-[250px]">
            <div className="flex justify-between p-2 bg-gray-100">
              <span className="font-bold text-gray-700 uppercase">Valor Total</span>
              <span className="font-bold text-gray-700">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-8">
          {invoice.notes && (
            <p className="text-xs text-gray-600 mb-2 whitespace-pre-line">{invoice.notes}</p>
          )}
        </div>

        {/* Signature Area */}
        <div className="pt-12 mt-12 border-t-2 border-dotted border-gray-400">
          {configuredSender.signatureImageUrl ? (
            <img src={configuredSender.signatureImageUrl} alt="Firma Autorizada" className="h-16 mb-2 object-contain" />
          ) : (
            <div className="w-48 h-12 border-b border-gray-400 mb-2">
            </div>
          )}
          <p className="font-semibold text-gray-700">{configuredSender.signatureName}</p>
          <p className="text-gray-600">{configuredSender.signatureCC}</p>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 pt-8 mt-8 border-t border-gray-300">
          <p>{configuredSender.name} - {configuredSender.address} - Cel. {configuredSender.phone} - {configuredSender.email}</p>
        </div>
      </div>
    </div>
  );
};

export default InvoicePdfViewPage;