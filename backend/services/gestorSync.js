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

// Devuelve la config de la integración o null si está desactivada.
function getConfig() {
  const apiUrl = process.env.GESTOR_API_URL;
  const serviceKey = process.env.GESTOR_SERVICE_KEY;
  if (!apiUrl || !serviceKey) {
    console.warn('[gestorSync] Integración desactivada (falta GESTOR_API_URL o GESTOR_SERVICE_KEY).');
    return null;
  }
  return { base: apiUrl.replace(/\/$/, ''), serviceKey };
}

// Llamada HTTP genérica al Gestor. Best-effort: nunca lanza.
async function callGestor(method, path, body, action) {
  const cfg = getConfig();
  if (!cfg) return;
  try {
    const res = await fetch(`${cfg.base}/integrations/billing-payment${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': cfg.serviceKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[gestorSync] ${action} -> el Gestor respondió ${res.status}: ${text}`);
    }
  } catch (err) {
    console.error(`[gestorSync] ${action} -> no se pudo contactar al Gestor: ${err.message}`);
  }
}

// El Gestor solo acepta 'cash' | 'transfer'. Efectivo -> cash, el resto -> transfer.
function mapMethod(method) {
  return /efectivo|cash/i.test(method || '') ? 'cash' : 'transfer';
}

/**
 * Crea el ingreso en el Gestor a partir de un abono.
 * @param {{id:string, clientId:string, amount:number, date:string, method?:string}} payment
 */
async function syncPaymentToGestor(payment) {
  if (!getConfig()) return;
  const clientName = await getClientName(payment.clientId);
  await callGestor('POST', '', {
    amount: payment.amount,
    date: payment.date,
    reference: payment.id,
    clientName,
    paymentMethod: mapMethod(payment.method),
  }, `crear abono ${payment.id}`);
}

/**
 * Actualiza el ingreso en el Gestor cuando se edita un abono.
 * @param {{id:string, clientId:string, amount:number, date:string, method?:string}} payment
 */
async function updatePaymentInGestor(payment) {
  if (!getConfig()) return;
  const clientName = await getClientName(payment.clientId);
  await callGestor('PUT', `/${encodeURIComponent(payment.id)}`, {
    amount: payment.amount,
    date: payment.date,
    clientName,
    paymentMethod: mapMethod(payment.method),
  }, `editar abono ${payment.id}`);
}

/**
 * Elimina el ingreso en el Gestor cuando se elimina un abono.
 * @param {string} paymentId
 */
async function deletePaymentInGestor(paymentId) {
  if (!getConfig()) return;
  await callGestor('DELETE', `/${encodeURIComponent(paymentId)}`, null, `eliminar abono ${paymentId}`);
}

module.exports = { syncPaymentToGestor, updatePaymentInGestor, deletePaymentInGestor };
