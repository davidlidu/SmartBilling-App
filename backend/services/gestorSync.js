// Sincronización de abonos con el Gestor Financiero Lidutech.
// Cuando se registra un pago en SmartBilling, se envía como INGRESO al Gestor.
//
// Es "best-effort": si el Gestor no responde, NO se rompe el registro del pago;
// solo se deja traza en el log. El endpoint del Gestor es idempotente por
// 'reference' (id del pago), así que reintentar es seguro.
//
// Config (variables de entorno del backend de SmartBilling):
//   GESTOR_API_URL     -> ej: http://gestor-backend:4000/api  (red interna Dokploy)
//   GESTOR_SERVICE_KEY -> debe coincidir con SERVICE_API_KEY del Gestor

const db = require('../database');

async function getClientName(clientId) {
  try {
    const [rows] = await db.query('SELECT name FROM clients WHERE id = ?', [clientId]);
    return rows.length ? rows[0].name : null;
  } catch (_) {
    return null;
  }
}

/**
 * Envía un abono al Gestor como ingreso. No lanza errores hacia arriba.
 * @param {{id:string, clientId:string, amount:number, date:string, method?:string}} payment
 */
async function syncPaymentToGestor(payment) {
  const apiUrl = process.env.GESTOR_API_URL;
  const serviceKey = process.env.GESTOR_SERVICE_KEY;

  if (!apiUrl || !serviceKey) {
    console.warn('[gestorSync] Integración desactivada (falta GESTOR_API_URL o GESTOR_SERVICE_KEY). Pago no sincronizado.');
    return;
  }

  const clientName = await getClientName(payment.clientId);

  // El Gestor solo acepta 'cash' | 'transfer'. Efectivo -> cash, el resto -> transfer.
  const paymentMethod = /efectivo|cash/i.test(payment.method || '') ? 'cash' : 'transfer';

  const body = {
    amount: payment.amount,
    date: payment.date,
    reference: payment.id, // idempotencia
    clientName,
    paymentMethod,
  };

  try {
    const res = await fetch(`${apiUrl.replace(/\/$/, '')}/integrations/billing-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': serviceKey,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[gestorSync] El Gestor respondió ${res.status}: ${text}`);
    } else {
      console.log(`[gestorSync] Abono ${payment.id} sincronizado como ingreso en el Gestor.`);
    }
  } catch (err) {
    console.error('[gestorSync] No se pudo contactar al Gestor:', err.message);
  }
}

module.exports = { syncPaymentToGestor };
