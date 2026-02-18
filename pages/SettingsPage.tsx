import React, { useState, useEffect, ChangeEvent, FormEvent, useCallback } from 'react';
import { SenderDetails } from '../types';
import { getSettings, saveSettings, resetSettingsFrontendCache } from '../services/settingsService';
import { DEFAULT_SENDER_DETAILS } from '../constants';
import LoadingSpinner from '../components/LoadingSpinner';
import { Save, RotateCcw, Trash2, User, Palette, CreditCard, ImageUp, PenLine } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SenderDetails>(DEFAULT_SENDER_DETAILS);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchInitialSettings = useCallback(async () => {
    setIsPageLoading(true);
    try {
      const currentSettings = await getSettings();
      setSettings(currentSettings || DEFAULT_SENDER_DETAILS);
    } catch (error) {
      console.error("Error al cargar la configuración inicial:", error);
      setFeedback({ type: 'error', message: 'No se pudo cargar la configuración. Usando valores predeterminados.' });
      setSettings(DEFAULT_SENDER_DETAILS);
    } finally {
      setIsPageLoading(false);
      setIsLoading(false);
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
      setSettings(updatedSettings);
      setFeedback({ type: 'success', message: '¡Configuración guardada exitosamente!' });
    } catch (error: any) {
      console.error("Error al guardar configuración:", error);
      setFeedback({ type: 'error', message: error.message || 'Error al guardar la configuración.' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleReset = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
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
    <div className="container mx-auto space-y-6 max-w-4xl animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-secondary-800">Configuración de Plantilla</h2>
          <p className="text-sm text-secondary-400 mt-0.5">Personaliza tu factura y datos de remitente</p>
        </div>
        <button
          onClick={handleReset}
          type="button"
          disabled={isLoading}
          className="bg-warning hover:bg-warning-dark text-white font-semibold py-2.5 px-5 rounded-xl shadow-md flex items-center transition-all disabled:opacity-50 text-sm"
        >
          <RotateCcw size={16} className="mr-2" /> Restablecer
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`p-4 rounded-xl font-medium text-sm animate-fadeIn ${feedback.type === 'success'
            ? 'bg-success-50 text-success-dark border border-success/20'
            : 'bg-danger-50 text-danger border border-danger/20'
          }`}>
          {feedback.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sender Info Section */}
        <div className="bg-white p-6 rounded-2xl shadow-card border border-secondary-100">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-primary-50 rounded-lg">
              <User size={18} className="text-primary" />
            </div>
            <h3 className="text-base font-bold text-secondary-800">Información del Remitente</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-secondary-500 mb-1.5 uppercase tracking-wider">Nombre / Razón Social</label>
              <input type="text" name="name" id="name" value={settings.name} onChange={handleChange} className="w-full p-3 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-sm" required />
            </div>
            <div>
              <label htmlFor="nit" className="block text-xs font-semibold text-secondary-500 mb-1.5 uppercase tracking-wider">NIT / CC</label>
              <input type="text" name="nit" id="nit" value={settings.nit} onChange={handleChange} className="w-full p-3 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-sm" required />
            </div>
            <div>
              <label htmlFor="type" className="block text-xs font-semibold text-secondary-500 mb-1.5 uppercase tracking-wider">Tipo (ej: Persona Natural)</label>
              <input type="text" name="type" id="type" value={settings.type} onChange={handleChange} className="w-full p-3 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-sm" />
            </div>
            <div>
              <label htmlFor="phone" className="block text-xs font-semibold text-secondary-500 mb-1.5 uppercase tracking-wider">Teléfono</label>
              <input type="tel" name="phone" id="phone" value={settings.phone} onChange={handleChange} className="w-full p-3 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-sm" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-xs font-semibold text-secondary-500 mb-1.5 uppercase tracking-wider">Dirección</label>
              <input type="text" name="address" id="address" value={settings.address} onChange={handleChange} className="w-full p-3 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-sm" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="email" className="block text-xs font-semibold text-secondary-500 mb-1.5 uppercase tracking-wider">Correo Electrónico</label>
              <input type="email" name="email" id="email" value={settings.email} onChange={handleChange} className="w-full p-3 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-sm" />
            </div>
          </div>
        </div>

        {/* Branding Section */}
        <div className="bg-white p-6 rounded-2xl shadow-card border border-secondary-100">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-violet-50 rounded-lg">
              <Palette size={18} className="text-violet-600" />
            </div>
            <h3 className="text-base font-bold text-secondary-800">Personalización (Branding)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Logo */}
            <div>
              <label className="block text-xs font-semibold text-secondary-500 mb-1.5 uppercase tracking-wider">Logo</label>
              <div className="border-2 border-dashed border-secondary-200 rounded-xl p-4 text-center hover:border-primary-300 transition-colors">
                <ImageUp size={24} className="mx-auto text-secondary-400 mb-2" />
                <input type="file" id="logoUpload" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoUrl')} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary hover:file:bg-primary-100 cursor-pointer" />
              </div>
              <input type="text" name="logoUrl" placeholder="O pegue la URL del logo" value={settings.logoUrl || ''} onChange={handleChange} className="w-full p-3 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-sm mt-2" />
              {settings.logoUrl && (
                <div className="mt-3 p-3 border border-secondary-200 rounded-xl inline-block relative bg-secondary-50">
                  <img src={settings.logoUrl} alt="Logo" className="h-16 object-contain" />
                  <button type="button" onClick={() => removeImage('logoUrl')} className="absolute -top-2 -right-2 bg-danger text-white rounded-full p-1 hover:bg-danger-dark shadow-md" title="Eliminar logo">
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Signature Image */}
            <div>
              <label className="block text-xs font-semibold text-secondary-500 mb-1.5 uppercase tracking-wider">Firma</label>
              <div className="border-2 border-dashed border-secondary-200 rounded-xl p-4 text-center hover:border-primary-300 transition-colors">
                <PenLine size={24} className="mx-auto text-secondary-400 mb-2" />
                <input type="file" id="signatureUpload" accept="image/*" onChange={(e) => handleImageUpload(e, 'signatureImageUrl')} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary hover:file:bg-primary-100 cursor-pointer" />
              </div>
              <input type="text" name="signatureImageUrl" placeholder="O pegue la URL de la firma" value={settings.signatureImageUrl || ''} onChange={handleChange} className="w-full p-3 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-sm mt-2" />
              {settings.signatureImageUrl && (
                <div className="mt-3 p-3 border border-secondary-200 rounded-xl inline-block relative bg-secondary-50">
                  <img src={settings.signatureImageUrl} alt="Firma" className="h-16 object-contain" />
                  <button type="button" onClick={() => removeImage('signatureImageUrl')} className="absolute -top-2 -right-2 bg-danger text-white rounded-full p-1 hover:bg-danger-dark shadow-md" title="Eliminar firma">
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
            <div>
              <label htmlFor="signatureName" className="block text-xs font-semibold text-secondary-500 mb-1.5 uppercase tracking-wider">Nombre del Firmante</label>
              <input type="text" name="signatureName" id="signatureName" value={settings.signatureName} onChange={handleChange} className="w-full p-3 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-sm" />
            </div>
            <div>
              <label htmlFor="signatureCC" className="block text-xs font-semibold text-secondary-500 mb-1.5 uppercase tracking-wider">CC del Firmante</label>
              <input type="text" name="signatureCC" id="signatureCC" value={settings.signatureCC} onChange={handleChange} className="w-full p-3 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-sm" />
            </div>
          </div>
        </div>

        {/* Payment Info Section */}
        <div className="bg-white p-6 rounded-2xl shadow-card border border-secondary-100">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <CreditCard size={18} className="text-emerald-600" />
            </div>
            <h3 className="text-base font-bold text-secondary-800">Información de Pago</h3>
          </div>
          <div>
            <label htmlFor="bankAccountInfo" className="block text-xs font-semibold text-secondary-500 mb-1.5 uppercase tracking-wider">Detalles de Cuenta Bancaria</label>
            <textarea name="bankAccountInfo" id="bankAccountInfo" value={settings.bankAccountInfo} onChange={handleChange} rows={4} className="w-full p-3 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-sm" placeholder="Ej: Cuenta de ahorros Bancolombia XXX-XXXXXX-X&#10;Nombre Titular&#10;CC. XXXXXXX" />
            <p className="text-[11px] text-secondary-400 mt-1">Esta información aparecerá como nota predeterminada en nuevas facturas.</p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-gradient-to-r from-primary to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-glow flex items-center transition-all disabled:opacity-50 text-sm"
          >
            {isLoading && !feedback ? <LoadingSpinner size={5} /> : <Save size={18} className="mr-2" />}
            {isLoading && !feedback ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
