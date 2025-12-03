export const formatCurrency = (amount: number | string | undefined): string => {
  if (amount === undefined || amount === null || amount === '') return '$0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0.00';
  
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

// --- CORRECCIÓN DE FECHA (MÉTODO MANUAL) ---
export const formatDateForDisplay = (dateString: string | Date): string => {
  if (!dateString) return 'N/A';
  
  let dateStr = '';

  // 1. Aseguramos tener un string tipo "AAAA-MM-DD"
  if (dateString instanceof Date) {
    // Truco para obtener la fecha local en formato ISO sin que reste horas
    const offset = dateString.getTimezoneOffset() * 60000;
    dateStr = new Date(dateString.getTime() - offset).toISOString().split('T')[0];
  } else {
    // Si viene como string (ej: "2025-12-03T00:00:00.000Z"), nos quedamos solo con la parte de la fecha
    dateStr = String(dateString).split('T')[0];
  }

  // 2. Parseamos manualmente "2025-12-03" para evitar que Javascript aplique zonas horarias
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }

  return dateStr; // Fallback por si acaso
};

// --- CORRECCIÓN PARA EL INPUT DEL FORMULARIO ---
export const formatDateForInput = (date: Date): string => {
  // Ajustamos la zona horaria para que al crear una factura hoy,
  // no aparezca la fecha de mañana (o ayer) por culpa del UTC.
  const offset = date.getTimezoneOffset();
  const dateLocal = new Date(date.getTime() - (offset * 60 * 1000));
  return dateLocal.toISOString().split('T')[0];
};