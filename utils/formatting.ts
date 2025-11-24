
// Formats a number as currency, e.g., 120000 -> $120.000
export const formatCurrency = (amount: number, currencySymbol: string = '$'): string => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    console.warn(`formatCurrency received invalid amount type or NaN: ${amount} (type: ${typeof amount}). Returning default value.`);
    return `${currencySymbol}0`; // Return a default value like $0 or $--.--
  }
  // Using Intl.NumberFormat for locale-aware formatting (though specific dot for thousands is tricky)
  // Forcing dot as thousands separator and comma as decimal separator if needed (e.g. for COP like formats)
  const parts = amount.toFixed(0).toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${currencySymbol}${parts.join(',')}`;
};

// Formats a YYYY-MM-DD date string to DD/MM/YYYY for display
export const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const [year, month, day] = dateString.split('-');
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
    return dateString; // Fallback
  } catch (e) {
    return dateString; // Fallback
  }
};

// Formats a Date object to YYYY-MM-DD for input[type=date]
export const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};