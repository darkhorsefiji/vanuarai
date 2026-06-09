import L from 'leaflet'

// Fresh base-layer instances each call (a Leaflet layer belongs to one map).
export function makeBaseLayers() {
  const street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '© OpenStreetMap contributors',
  })
  const satellite = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19, attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
  })
  // Keys become the labels in Leaflet's layer control; Street is the default.
  return { Street: street, Satellite: satellite }
}

export const pinIcon = L.divIcon({
  className: '', html: '<div class="pinDot"></div>', iconSize: [16, 16], iconAnchor: [8, 8],
})
