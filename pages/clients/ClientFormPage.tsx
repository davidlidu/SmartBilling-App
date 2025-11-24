import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Client } from '../../types';
import { getClientById, createClient, updateClient } from '../../services/clientService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Save, ArrowLeft } from 'lucide-react';

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
    return <div className="text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center mb-6">
        <Link to="/clients" className="text-primary hover:text-primary-dark p-2 rounded-full hover:bg-primary-light/10">
            <ArrowLeft size={24} />
        </Link>
        <h2 className="text-3xl font-semibold text-gray-700 ml-2">
          {isEditing ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}
        </h2>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Cliente</label>
          <input
            type="text"
            name="name"
            id="name"
            value={client.name}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="nitOrCc" className="block text-sm font-medium text-gray-700 mb-1">NIT / CC</label>
              <input
                type="text"
                name="nitOrCc"
                id="nitOrCc"
                value={client.nitOrCc}
                onChange={handleChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="tel"
                name="phone"
                id="phone"
                value={client.phone}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
              />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input
                    type="text"
                    name="address"
                    id="address"
                    value={client.address}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                />
            </div>
            <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                <input
                    type="text"
                    name="city"
                    id="city"
                    value={client.city}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                />
            </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg shadow-md flex items-center transition-colors disabled:opacity-50"
          >
            <Save size={20} className="mr-2" />
            {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar Cliente' : 'Crear Cliente')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientFormPage;