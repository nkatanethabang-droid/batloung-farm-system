const express = require('express');
const router = express.Router();
const { authRequired, adminOnly } = require('../auth/security');

// Limkokwing University of Creative Technology, Moshoeshoe Road, Maseru Central.
// Coordinates are an approximate campus pin; the routing origin can be adjusted here
// if the farm's actual loading/dispatch entrance is different.
const FARM_ORIGIN = {
  name: 'Limkokwing University of Creative Technology, Moshoeshoe Road, Maseru Central, Maseru, Lesotho',
  latitude: -29.3060385,
  longitude: 27.4870795
};

const USER_AGENT = 'BatloungFarm/1.0 (vendor location search)';
let lastNominatimRequest = 0;
let nominatimQueue = Promise.resolve();
const nominatimCache = new Map();
let lastRoutingRequest = 0;
let routingQueue = Promise.resolve();

async function nominatim(url) {
  const cacheKey = String(url);
  if (nominatimCache.has(cacheKey)) return nominatimCache.get(cacheKey);
  // Public Nominatim asks applications to stay at or below one request per second.
  const task = nominatimQueue.then(async () => {
    const wait = Math.max(0, 1100 - (Date.now() - lastNominatimRequest));
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
    lastNominatimRequest = Date.now();
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en' },
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw new Error(`OpenStreetMap search returned ${response.status}`);
    const payload = await response.json();
    if (nominatimCache.size > 250) nominatimCache.clear();
    nominatimCache.set(cacheKey, payload);
    return payload;
  });
  nominatimQueue = task.catch(() => {});
  return task;
}

router.get('/config', (req, res) => {
  res.json({ success: true, provider: 'OpenStreetMap', origin: FARM_ORIGIN });
});

router.get('/search', authRequired, adminOnly, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 3) return res.json({ success: true, data: [] });
    if (q.length > 160) return res.status(400).json({ success: false, message: 'Search text is too long.' });
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.search = new URLSearchParams({ q, format: 'jsonv2', addressdetails: '1', limit: '6', countrycodes: 'ls' }).toString();
    const data = await nominatim(url);
    res.json({ success: true, data: data.map(item => ({
      osmType: item.osm_type, osmId: item.osm_id, displayName: item.display_name,
      latitude: Number(item.lat), longitude: Number(item.lon), address: item.address || {}
    })) });
  } catch (error) {
    console.error('OpenStreetMap search error:', error.message);
    res.status(502).json({ success: false, message: 'Location search is temporarily unavailable. You can still select the point directly on the map.' });
  }
});

router.get('/reverse', authRequired, adminOnly, async (req, res) => {
  try {
    const lat = Number(req.query.lat), lon = Number(req.query.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180)
      return res.status(400).json({ success: false, message: 'Select a valid point on the map.' });
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.search = new URLSearchParams({ lat: String(lat), lon: String(lon), format: 'jsonv2', addressdetails: '1', zoom: '18' }).toString();
    const item = await nominatim(url);
    res.json({ success: true, data: { displayName: item.display_name, latitude: Number(item.lat), longitude: Number(item.lon), address: item.address || {}, osmType: item.osm_type, osmId: item.osm_id } });
  } catch (error) {
    console.error('OpenStreetMap reverse lookup error:', error.message);
    res.status(502).json({ success: false, message: 'Could not retrieve a detailed address for this point. Try selecting a nearby point.' });
  }
});

async function getRoute(profile, from, to) {
  const queued = routingQueue.then(async () => {
    const wait = Math.max(0, 1100 - (Date.now() - lastRoutingRequest));
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
    lastRoutingRequest = Date.now();
  });
  routingQueue = queued.catch(() => {});
  await queued;
  const base = profile === 'foot'
    ? 'https://routing.openstreetmap.de/routed-foot/route/v1/driving/'
    : 'https://routing.openstreetmap.de/routed-car/route/v1/driving/';
  const url = `${base}${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson&steps=false`;
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(20000) });
  const data = await response.json();
  if (!response.ok || data.code !== 'Ok' || !data.routes?.[0]) throw new Error(data.message || `${profile} route unavailable`);
  const route = data.routes[0];
  return { distanceMeters: route.distance, durationSeconds: route.duration, geometry: route.geometry };
}

router.post('/routes', authRequired, adminOnly, async (req, res) => {
  try {
    const latitude = Number(req.body?.latitude), longitude = Number(req.body?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180)
      return res.status(400).json({ success: false, message: 'Select a valid vendor location on the map.' });
    const destination = { latitude, longitude };
    // Keep requests sequential to respect the public FOSSGIS routing service's light-use policy.
    const results = [];
    results.push(await Promise.resolve().then(() => getRoute('car', FARM_ORIGIN, destination)).then(value => ({ status: 'fulfilled', value })).catch(reason => ({ status: 'rejected', reason })));
    results.push(await Promise.resolve().then(() => getRoute('foot', FARM_ORIGIN, destination)).then(value => ({ status: 'fulfilled', value })).catch(reason => ({ status: 'rejected', reason }))); 
    const driving = results[0].status === 'fulfilled' ? results[0].value : null;
    const walking = results[1].status === 'fulfilled' ? results[1].value : null;
    if (!driving && !walking) throw new Error('Both driving and walking route services are temporarily unavailable.');
    res.json({ success: true, data: {
      origin: FARM_ORIGIN,
      driving,
      walking,
      errors: { driving: results[0].status === 'rejected' ? results[0].reason.message : null, walking: results[1].status === 'rejected' ? results[1].reason.message : null }
    } });
  } catch (error) {
    console.error('OpenStreetMap route error:', error.message);
    res.status(502).json({ success: false, message: error.message || 'Unable to calculate routes right now.' });
  }
});

module.exports = router;
