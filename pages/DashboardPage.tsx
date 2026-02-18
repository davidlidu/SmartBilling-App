import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Users, PlusCircle, DollarSign, Edit, TrendingUp, ArrowUpRight } from 'lucide-react';
import { getInvoices } from '../services/invoiceService';
import { getClients } from '../services/clientService';
import { formatCurrency } from '../utils/formatting';
import { Invoice } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; gradient: string; linkTo?: string; delay?: string }> = ({ title, value, icon, gradient, linkTo, delay = '' }) => {
  const cardContent = (
    <div className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-card hover:shadow-card-hover transition-all duration-300 ${gradient} animate-fadeInUp opacity-0 ${delay}`}>
      <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
      <div className="absolute bottom-0 right-4 w-16 h-16 rounded-full bg-white/5" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
            {icon}
          </div>
          {linkTo && <ArrowUpRight size={18} className="text-white/60" />}
        </div>
        <p className="text-sm text-white/80 font-medium">{title}</p>
        <p className="text-3xl font-bold mt-1 tracking-tight">{value}</p>
      </div>
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo} className="block hover:scale-[1.02] transition-transform duration-200">{cardContent}</Link>;
  }
  return cardContent;
};

const QuickAccessButton: React.FC<{ to: string; icon: React.ReactNode; label: string; description: string; gradient: string }> = ({ to, icon, label, description, gradient }) => (
  <Link
    to={to}
    className="group flex items-center p-4 bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 border border-secondary-100 hover:border-primary-200"
  >
    <div className={`flex-shrink-0 p-3 rounded-xl ${gradient} text-white shadow-md group-hover:scale-110 transition-transform duration-200`}>
      {icon}
    </div>
    <div className="ml-4">
      <p className="font-semibold text-secondary-800 text-sm">{label}</p>
      <p className="text-xs text-secondary-400 mt-0.5">{description}</p>
    </div>
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

        const revenue = invoicesData.reduce((sum, inv: any) => {
          let invoiceTotal = 0;
          if (inv.totalAmount !== undefined && inv.totalAmount !== null) {
            invoiceTotal = parseFloat(inv.totalAmount);
          } else if (inv.lineItems && inv.lineItems.length > 0) {
            invoiceTotal = inv.lineItems.reduce((itemSum: number, item: any) => itemSum + (item.quantity * item.unitPrice), 0);
          }
          return sum + invoiceTotal;
        }, 0);

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
    return <div className="text-danger bg-danger-50 p-4 rounded-2xl text-center border border-danger/20 font-medium">{error}</div>;
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="animate-fadeIn">
        <h2 className="text-3xl font-bold text-secondary-800">Resumen General</h2>
        <p className="text-secondary-500 mt-1">Vista general de tu negocio</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard
          title="Cantidad Facturas"
          value={totalInvoices}
          icon={<FileText size={22} />}
          gradient="bg-gradient-to-br from-blue-500 to-blue-700"
          linkTo="/invoices"
          delay="delay-100"
        />
        <StatCard
          title="Total Clientes"
          value={totalClients}
          icon={<Users size={22} />}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
          linkTo="/clients"
          delay="delay-200"
        />
        <StatCard
          title="Valor Facturado Total"
          value={formatCurrency(totalRevenue)}
          icon={<TrendingUp size={22} />}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          delay="delay-300"
        />
      </div>

      {/* Quick Access */}
      <div className="pt-4 animate-fadeIn" style={{ animationDelay: '400ms' }}>
        <h3 className="text-xl font-bold text-secondary-800 mb-4">Accesos Rápidos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickAccessButton
            to="/invoices/new"
            icon={<PlusCircle size={20} />}
            label="Crear Nueva Factura"
            description="Generar una nueva cuenta de cobro"
            gradient="bg-gradient-to-br from-primary to-primary-700"
          />
          <QuickAccessButton
            to="/clients/new"
            icon={<Users size={20} />}
            label="Agregar Nuevo Cliente"
            description="Registrar un nuevo cliente"
            gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
          />
          <QuickAccessButton
            to="/settings"
            icon={<Edit size={20} />}
            label="Configurar Plantilla"
            description="Personalizar tu factura"
            gradient="bg-gradient-to-br from-violet-500 to-violet-700"
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;