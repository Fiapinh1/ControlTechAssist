const ALLOWED_MAP_HOSTS = new Set([
  'maps.app.goo.gl',
  'goo.gl',
  'maps.google.com',
  'www.google.com',
  'google.com'
]);

function isAllowedMapUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && ALLOWED_MAP_HOSTS.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function coordinatePair(lat, lng) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { lat: latitude, lng: longitude };
}

function extractCoordinates(value) {
  let decoded = String(value || '');
  try { decoded = decodeURIComponent(decoded); } catch { /* Keep the original URL. */ }

  const patterns = [
    /@(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/i,
    /\/maps\/(?:place|search)\/(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/i,
    /[?&](?:query|q|ll|destination)=(-?\d{1,2}(?:\.\d+)?)[,%20\s]+(-?\d{1,3}(?:\.\d+)?)/i,
    /!3d(-?\d{1,2}(?:\.\d+)?).*?!4d(-?\d{1,3}(?:\.\d+)?)/i
  ];

  for (const pattern of patterns) {
    const match = decoded.match(pattern);
    const point = match && coordinatePair(match[1], match[2]);
    if (point) return point;
  }
  return null;
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Metodo nao permitido.' });
  }

  const rawUrl = Array.isArray(request.query?.url) ? request.query.url[0] : request.query?.url;
  if (!rawUrl || rawUrl.length > 2048 || !isAllowedMapUrl(rawUrl)) {
    return response.status(400).json({ error: 'Link do Google Maps invalido.' });
  }

  try {
    let finalUrl = rawUrl;
    let point = extractCoordinates(finalUrl);
    for (let step = 0; step < 6 && !point; step += 1) {
      const result = await fetch(finalUrl, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(10000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ControlTechAssist/1.0)' }
      });
      const location = result.headers.get('location');
      result.body?.cancel().catch(() => {});
      if (!location) break;
      const nextUrl = new URL(location, finalUrl).toString();
      if (!isAllowedMapUrl(nextUrl)) throw new Error('Redirect fora do Google Maps.');
      finalUrl = nextUrl;
      point = extractCoordinates(finalUrl);
    }
    if (!point) {
      return response.status(422).json({ error: 'O link foi aberto, mas nao continha coordenadas reconheciveis.' });
    }

    response.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return response.status(200).json({ ...point, resolvedUrl: finalUrl });
  } catch {
    return response.status(502).json({ error: 'Nao foi possivel abrir o link do Google Maps.' });
  }
}

export { extractCoordinates, isAllowedMapUrl };
