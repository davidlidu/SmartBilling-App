import React, { useState, useEffect, ChangeEvent, FormEvent, useCallback } from 'react';
import { SenderDetails } from '../types';
import { getSettings, saveSettings, resetSettingsFrontendCache } from '../services/settingsService';
import { DEFAULT_SENDER_DETAILS } from '../constants';
import LoadingSpinner from '../components/LoadingSpinner';
import { Save, RotateCcw, ImageUp, Trash2 } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SenderDetails>(DEFAULT_SENDER_DETAILS);
  const [isLoading, setIsLoading] = useState(true); // For page load and save operations
  const [isPageLoading, setIsPageLoading] = useState(true); // Specifically for initial data fetch
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchInitialSettings = useCallback(async () => {
    setIsPageLoading(true);
    try {
      const currentSettings = await getSettings();
      setSettings(currentSettings || DEFAULT_SENDER_DETAILS); // Use default if backend returns null
    } catch (error) {
      console.error("Error al cargar la configuración inicial:", error);
      setFeedback({ type: 'error', message: 'No se pudo cargar la configuración. Usando valores predeterminados.' });
      setSettings(DEFAULT_SENDER_DETAILS); // Fallback to default on error
    } finally {
      setIsPageLoading(false);
      setIsLoading(false); // General loading state also stops
    }
  }, []);

  useEffect(() => {
    fetchInitialSettings();
  }, [fetchInitialSettings]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'signatureImageUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (field: 'logoUrl' | 'signatureImageUrl') => {
    setSettings(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);
    try {
      const updatedSettings = await saveSettings(settings);
      setSettings(updatedSettings); // Update state with potentially backend-modified data (e.g. profile_id)
      setFeedback({ type: 'success', message: '¡Configuración guardada exitosamente!' });
    } catch (error: any) {
      console.error("Error al guardar configuración:", error);
      setFeedback({ type: 'error', message: error.message || 'Error al guardar la configuración. Por favor, inténtelo de nuevo.' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setFeedback(null), 3000); 
    }
  };

  const handleReset = async () => {
    // This function now primarily resets frontend state to defaults.
    // True backend reset would require specific backend endpoint or logic in saveSettings.
    setIsLoading(true);
    setFeedback(null);
    try {
      // Option 1: Just reset frontend state and rely on next save to push defaults if desired
      // setSettings(DEFAULT_SENDER_DETAILS); 
      // feedback for frontend reset:
      // setFeedback({ type: 'success', message: 'Campos restablecidos. Guarde para aplicar los valores predeterminados.' });
      
      // Option 2: Attempt to save DEFAULT_SENDER_DETAILS to backend
      const resetToDefaults = await saveSettings(DEFAULT_SENDER_DETAILS);
      setSettings(resetToDefaults);
      setFeedback({ type: 'success', message: '¡Configuración restablecida y guardada en el servidor!' });
    } catch (error: any) {
      console.error("Error al restablecer configuración:", error);
      setFeedback({ type: 'error', message: error.message || 'Error al restablecer la configuración.' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  if (isPageLoading) { 
    return <div className="flex justify-center items-center h-64"><LoadingSpinner size={12} /></div>;
  }

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-semibold text-gray-700">Configuración de Plantilla de Factura</h2>
        <button
            onClick={handleReset}
            type="button"
            disabled={isLoading}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center transition-colors disabled:opacity-50"
        >
            <RotateCcw size={18} className="mr-2" /> Restablecer y Guardar Predeterminados
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-md text-white ${feedback.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {feedback.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg space-y-8">
        {/* Sender Info Section */}
        <section>
          <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Información del Remitente</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo / Razón Social</label>
              <input type="text" name="name" id="name" value={settings.name} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary" required />
            </div>
            <div>
              <label htmlFor="nit" className="block text-sm font-medium text-gray-700 mb-1">NIT / CC</label>
              <input type="text" name="nit" id="nit" value={settings.nit} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary" required />
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Tipo (ej: Persona Natural)</label>
              <input type="text" name="type" id="type" value={settings.type} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary" />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input type="tel" name="phone" id="phone" value={settings.phone} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input type="text" name="address" id="address" value={settings.address} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
              <input type="email" name="email" id="email" value={settings.email} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary" />
            </div>
          </div>
        </section>

        {/* Branding Section */}
        <section>
          <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Personalización (Branding)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div>
              <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700 mb-1">Imagen del Logo (URL o Base64)</label>
              <input type="file" id="logoUpload" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoUrl')} className="mb-2 w-full p-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-light/20 file:text-primary hover:file:bg-primary-light/30" />
              <input type="text" name="logoUrl" placeholder="O pegue la URL del logo aquí" value={settings.logoUrl || ''} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary" />

              {settings.logoUrl && (
                <div className="mt-2 p-2 border rounded-md inline-block relative">
                  <img src={settings.logoUrl} alt="Vista previa del Logo" className="h-16 object-contain" />
                  <button type="button" onClick={() => removeImage('logoUrl')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-700" title="Eliminar logo"><Trash2 size={14} /></button>
                </div>
              )}
            </div>
             <div>
              <label htmlFor="signatureImageUrl" className="block text-sm font-medium text-gray-700 mb-1">Imagen de la Firma (URL o Base64)</label>
              <input type="file" id="signatureUpload" accept="image/*" onChange={(e) => handleImageUpload(e, 'signatureImageUrl')} className="mb-2 w-full p-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-light/20 file:text-primary hover:file:bg-primary-light/30" />
               <input type="text" name="signatureImageUrl" placeholder="O pegue la URL de la firma aquí" value={settings.signatureImageUrl || ''} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary" />
              {settings.signatureImageUrl && (
                 <div className="mt-2 p-2 border rounded-md inline-block relative">
                    <img src={settings.signatureImageUrl} alt="Vista previa de la Firma" className="h-16 object-contain bg-gray-100" />
                     <button type="button" onClick={() => removeImage('signatureImageUrl')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-700" title="Eliminar imagen de firma"><Trash2 size={14} /></button>
                 </div>
              )}
            </div>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
             <div>
              <label htmlFor="signatureName" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Firmante (Impreso)</label>
              <input type="text" name="signatureName" id="signatureName" value={settings.signatureName} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary" />
            </div>
            <div>
              <label htmlFor="signatureCC" className="block text-sm font-medium text-gray-700 mb-1">CC del Firmante (Impreso)</label>
              <input type="text" name="signatureCC" id="signatureCC" value={settings.signatureCC} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary" />
            </div>
           </div>
        </section>

        {/* Payment Info Section */}
        <section>
          <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Información de Pago</h3>
          <div>
            <label htmlFor="bankAccountInfo" className="block text-sm font-medium text-gray-700 mb-1">Detalles de Cuenta Bancaria (Notas predeterminadas en nuevas facturas)</label>
            <textarea name="bankAccountInfo" id="bankAccountInfo" value={settings.bankAccountInfo} onChange={handleChange} rows={4} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary" placeholder="Ej: Cuenta de ahorros Bancolombia XXX-XXXXXX-X&#10;Nombre Titular&#10;CC. XXXXXXX" />
          </div>
        </section>

        <div className="flex justify-end pt-6 border-t">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg shadow-md flex items-center transition-colors disabled:opacity-50"
          >
            {isLoading && !feedback ? <LoadingSpinner size={5} /> : <Save size={20} className="mr-2" />}
            {isLoading && !feedback ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
