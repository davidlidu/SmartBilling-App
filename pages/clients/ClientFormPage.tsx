import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Client } from '../../types';
import { getClientById, createClient, updateClient } from '../../services/clientService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Save, ArrowLeft, User, CreditCard, Phone, MapPin, Building } from 'lucide-react';

const ClientFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Omit<Client, 'id'> & { id?: string }>({
    name: '',
    nitOrCc: '',
    city: '',
    phone: '',
    address: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing && id) {
      setIsLoading(true);
      getClientById(id)
        .then(data => {
          if (data) {
            setClient(data);
          } else {
            setError('Cliente no encontrado.');
          }
        })
        .catch(err => {
          console.error(err);
          setError('Error al cargar los detalles del cliente.');
        })
        .finally(() => setIsLoading(false));
    }
  }, [id, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setClient(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (isEditing && id) {
        await updateClient(id, client);
      } else {
        await createClient(client as Omit<Client, 'id'>);
      }
      navigate('/clients');
    } catch (err) {
      console.error(err);
      setError(`Error al ${isEditing ? 'actualizar' : 'crear'} el cliente. Por favor, inténtelo de nuevo.`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && isEditing) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner size={12} /></div>;
  }

  if (error) {
    return <div className="text-danger bg-danger-50 p-4 rounded-2xl border border-danger/20 font-medium">{error}</div>;
  }

  return (
    <div className="container mx-auto max-w-3xl animate-fadeIn">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link to="/clients" className="text-secondary-400 hover:text-primary p-2 rounded-xl hover:bg-primary-50 transition-colors">
          <ArrowLeft size={22} />
        </Link>
        <div className="ml-3">
          <h2 className="text-2xl font-bold text-secondary-800">
            {isEditing ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}
          </h2>
          <p className="text-sm text-secondary-400">Complete la información del cliente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Info Card */}
        <div className="bg-white p-6 rounded-2xl shadow-card border border-secondary-100">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-primary-50 rounded-lg">
              <User size={18} className="text-primary" />
            </div>
            <h3 className="text-base font-bold text-secondary-800">Información Personal</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-secondary-500 mb-1.5 uppercase tracking-wider">Nombre del Cliente</label>
              <input
                type="text"
                name="name"
                id="name"
                value={client.name}
                onChange={handleChange}
                required
                className="w-full p-3 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-sm"
                placeholder="Nombre completo o razón social"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nitOrCc" className="block text-xs font-semibold text-secondary-500 mb-1.5 uppercase tracking-wider">NIT / CC</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={16} />
                  <input
                    type="text"
                    name="nitOrCc"
                    id="nitOrCc"
                    value={client.nitOrCc}
                    onChange={handleChange}
                    required
                    className="w-full p-3 pl-10 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-sm"
                    placeholder="Ej: 123456789-0"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="phone" className="block text-xs font-semibold text-secondary-500 mb-1.5 uppercase tracking-wider">Teléfono</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={16} />
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={client.phone}
                    onChange={handleChange}
                    className="w-full p-3 pl-10 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-sm"
                    placeholder="Ej: +57 300 123 4567"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location Card */}
        <div className="bg-white p-6 rounded-2xl shadow-card border border-secondary-100">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <MapPin size={18} className="text-emerald-600" />
            </div>
            <h3 className="text-base font-bold text-secondary-800">Ubicación</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="address" className="block text-xs font-semibold text-secondary-500 mb-1.5 uppercase tracking-wider">Dirección</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={16} />
                <input
                  type="text"
                  name="address"
                  id="address"
                  value={client.address}
                  onChange={handleChange}
                  className="w-full p-3 pl-10 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-sm"
                  placeholder="Ej: Calle 123 #45-67"
                />
              </div>
            </div>
            <div>
              <label htmlFor="city" className="block text-xs font-semibold text-secondary-500 mb-1.5 uppercase tracking-wider">Ciudad</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={16} />
                <input
                  type="text"
                  name="city"
                  id="city"
                  value={client.city}
                  onChange={handleChange}
                  className="w-full p-3 pl-10 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-sm"
                  placeholder="Ej: Bogotá"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-gradient-to-r from-primary to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-glow flex items-center transition-all disabled:opacity-50 text-sm"
          >
            <Save size={18} className="mr-2" />
            {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar Cliente' : 'Crear Cliente')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientFormPage;