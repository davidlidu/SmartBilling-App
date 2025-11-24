
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Users, PlusCircle, DollarSign, Edit } from 'lucide-react';
import { getInvoices } from '../services/invoiceService';
import { getClients } from '../services/clientService';
import { formatCurrency } from '../utils/formatting';
import { Invoice } from '../types'; // Added Invoice type import
import LoadingSpinner from '../components/LoadingSpinner';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; linkTo?: string }> = ({ title, value, icon, color, linkTo }) => {
  const cardContent = (
    <div className={`bg-white p-6 rounded-lg shadow-lg flex items-center space-x-4 border-l-4 ${color} h-full`}>
      <div className="p-3 bg-gray-100 rounded-full">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo} className="block hover:shadow-xl transition-shadow duration-200">{cardContent}</Link>;
  }
  return cardContent;
};

const QuickAccessButton: React.FC<{ to: string; icon: React.ReactNode; label: string; colorClass: string }> = ({ to, icon, label, colorClass }) => (
  <Link
    to={to}
    className={`flex items-center justify-center w-full sm:w-auto px-6 py-3 text-white font-semibold rounded-lg shadow-md hover:opacity-90 transition-opacity ${colorClass}`}
  >
    {icon}
    <span className="ml-2">{label}</span>
  </Link>
);


const DashboardPage: React.FC = () => {
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [totalClients, setTotalClients] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const invoicesData = await getInvoices();
        const clientsData = await getClients();
        
        setTotalInvoices(invoicesData.length);
        setTotalClients(clientsData.length);
        
        const revenue = invoicesData.reduce((sum, inv) => {
          const invoiceTotal = inv.lineItems.reduce((itemSum, item) => itemSum + (item.quantity * item.unitPrice), 0);
          return sum + invoiceTotal; // Correctly return the accumulated sum
        }, 0); // Initialize sum with 0
        setTotalRevenue(revenue);

      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError("No se pudieron cargar los datos del panel. Inténtelo de nuevo más tarde.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner size={12} /></div>;
  }

  if (error) {
    return <div className="text-red-500 bg-red-100 p-4 rounded-md text-center">{error}</div>;
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-semibold text-gray-700">Resumen General</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Total Facturas" 
          value={totalInvoices} 
          icon={<FileText size={24} className="text-blue-500" />} 
          color="border-blue-500"
          linkTo="/invoices"
        />
        <StatCard 
          title="Total Clientes" 
          value={totalClients} 
          icon={<Users size={24} className="text-green-500" />} 
          color="border-green-500"
          linkTo="/clients"
        />
        <StatCard 
          title="Ingresos Totales" 
          value={formatCurrency(totalRevenue)} 
          icon={<DollarSign size={24} className="text-yellow-500" />} 
          color="border-yellow-500"
        />
      </div>

      <div className="mt-10 pt-6 border-t">
        <h3 className="text-2xl font-semibold text-gray-700 mb-6">Accesos Rápidos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickAccessButton 
            to="/invoices/new"
            icon={<PlusCircle size={20} />}
            label="Crear Nueva Factura"
            colorClass="bg-primary hover:bg-primary-dark"
          />
          <QuickAccessButton 
            to="/clients/new"
            icon={<Users size={20} />}
            label="Agregar Nuevo Cliente"
            colorClass="bg-green-500 hover:bg-green-600"
          />
           <QuickAccessButton 
            to="/settings"
            icon={<Edit size={20} />} // Using Edit icon for settings, could be Settings icon too
            label="Configurar Plantilla"
            colorClass="bg-indigo-500 hover:bg-indigo-600"
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
