// Consulta de la TRM (Tasa Representativa del Mercado) oficial de Colombia.
// Fuente: Superintendencia Financiera vía Datos Abiertos (datos.gov.co, dataset 32sa-8pi3).
// Devuelve la TRM vigente para la fecha dada (YYYY-MM-DD): la última publicada
// cuya vigencia inicia en o antes de esa fecha (cubre fines de semana y festivos).

const TRM_API_URL = process.env.TRM_API_URL || 'https://www.datos.gov.co/resource/32sa-8pi3.json';

async function getTrmForDate(date) {
  const where = `vigenciadesde <= '${date}T00:00:00'`;
  const url = `${TRM_API_URL}?$where=${encodeURIComponent(where)}&$order=${encodeURIComponent('vigenciadesde DESC')}&$limit=1`;

  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) {
    throw new Error(`El servicio de TRM respondió ${res.status}`);
  }
  const rows = await res.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(`No se encontró TRM para la fecha ${date}`);
  }
  const value = parseFloat(rows[0].valor);
  if (!value || isNaN(value)) {
    throw new Error('Respuesta de TRM inválida');
  }
  return {
    value,
    date,
    validFrom: String(rows[0].vigenciadesde).split('T')[0],
    validTo: String(rows[0].vigenciahasta).split('T')[0],
    source: 'datos.gov.co (Superfinanciera)',
  };
}

module.exports = { getTrmForDate };
