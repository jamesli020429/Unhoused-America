/* This viewer reads public ArcGIS data; it never edits the original web map. */
(() => {
  const service = 'https://services1.arcgis.com/qN3V93cYGMKQCOxL/arcgis/rest/services/Homelessness_Rate_WFL1/FeatureServer';
  const topic = new URLSearchParams(window.location.search).get('topic') || 'race';
  const config = Object.prototype.hasOwnProperty.call(window.demographicMaps, topic)
    ? window.demographicMaps[topic] : null;
  const categories = config ? config.categories : [
    { field: 'PEH_BLACK', label: 'Black & African American', color: '#cced2a' },
    { field: 'PEH_WHITE', label: 'White', color: '#78b2ff' },
    { field: 'PEH_ASIAN', label: 'Asian', color: '#ff4545' },
    { field: 'PEH_HAWAII', label: 'Native Hawaiian & Pacific Islander', color: '#c79be3' },
    { field: 'PEH_MENA', label: 'Middle Eastern & North African', color: '#ffaa00' },
    { field: 'PEH_MULTI', label: 'Multiracial', color: '#b18e7a' },
    { field: 'PEH_INDIG', label: 'American Indian, Alaska Native & Indigenous', color: '#eee3ce' }
  ];
  const active = new Set(categories.map(category => category.field));
  const status = document.getElementById('status');
  const regionSelect = document.getElementById('region');
  const details = document.getElementById('details');
  let raceLayer, view, raceLayerView, highlight, requestId = 0;
  const fields = ['FID', 'COCNAME', 'STATE_NAME', 'TOT_PEH', 'PEHRATE10K', ...categories.map(category => category.field)];
  const format = (value, digits = 0) => value == null || !Number.isFinite(Number(value))
    ? 'Not available' : Number(value).toLocaleString('en-US', { maximumFractionDigits: digits });
  function notice(message) { status.textContent = message; status.hidden = !message; }
  function updateRenderer() {
    if (!raceLayer || config) return;
    const renderer = raceLayer.renderer.clone();
    renderer.attributes = categories.filter(category => active.has(category.field));
    raceLayer.visible = active.size > 0;
    if (active.size) raceLayer.renderer = renderer;
  }
  (config ? [] : categories).forEach(category => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'legend-item';
    button.setAttribute('aria-pressed', 'true');
    button.style.setProperty('--swatch', category.color);
    const swatch = document.createElement('span');
    swatch.className = 'swatch';
    swatch.setAttribute('aria-hidden', 'true');
    button.append(swatch, document.createTextNode(category.label));
    button.addEventListener('click', () => {
      active.has(category.field) ? active.delete(category.field) : active.add(category.field);
      button.setAttribute('aria-pressed', String(active.has(category.field)));
      updateRenderer();
    });
    document.getElementById('legend').append(button);
  });
  document.getElementById('reset-categories').addEventListener('click', () => {
    categories.forEach(category => active.add(category.field));
    document.querySelectorAll('.legend-item').forEach(button => button.setAttribute('aria-pressed', 'true'));
    updateRenderer();
  });
  function closeDetails() {
    requestId += 1;
    details.hidden = true;
    if (highlight) { highlight.remove(); highlight = null; }
  }
  document.getElementById('close-details').addEventListener('click', closeDetails);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeDetails(); });
  function showDetails(feature, moveFocus = false) {
    const data = feature.attributes;
    document.getElementById('region-name').textContent = data.COCNAME || 'Unnamed region';
    document.getElementById('region-state').textContent = data.STATE_NAME || '';
    document.getElementById('region-rate').textContent = format(data.PEHRATE10K, 1);
    document.getElementById('region-total').textContent = format(data.TOT_PEH);
    const counts = document.getElementById('region-counts');
    counts.replaceChildren();
    categories.forEach(category => {
      const row = document.createElement('div'); row.className = 'count-row';
      const term = document.createElement('dt'); term.textContent = category.label;
      const value = document.createElement('dd'); value.textContent = format(data[category.field], config ? 3 : 0);
      row.append(term, value); counts.append(row);
    });
    if (highlight) highlight.remove();
    highlight = raceLayerView.highlight(feature);
    regionSelect.value = String(data.FID);
    details.hidden = false;
    if (moveFocus) document.getElementById('close-details').focus();
  }
  async function selectRegion(query, moveFocus = false) {
    const current = ++requestId;
    notice('Loading region details…');
    try {
      const result = await raceLayer.queryFeatures({ ...query, outFields: fields, returnGeometry: true });
      if (current !== requestId) return;
      notice('');
      if (result.features.length) showDetails(result.features[0], moveFocus);
      else { closeDetails(); notice('No reported region at this location. Try another area.'); }
    } catch (error) {
      if (current === requestId) notice('Region details could not load. Please try again.');
    }
  }
  if (typeof window.require !== 'function') {
    notice('ArcGIS could not load. Please refresh the page or check your connection.');
    return;
  }
  window.require([
    'esri/Map', 'esri/Basemap', 'esri/layers/VectorTileLayer',
    'esri/layers/FeatureLayer', 'esri/views/MapView', 'esri/renderers/DotDensityRenderer', 'esri/geometry/Extent'
  ], async (Map, Basemap, VectorTileLayer, FeatureLayer, MapView, DotDensityRenderer, Extent) => {
    try {
      const rateLayers = config ? categories.map(category => new FeatureLayer({
        url: service + '/' + category.layer, outFields: fields, popupEnabled: false,
        visible: category.layer === config.layer
      })) : [];
      raceLayer = config ? rateLayers[0] : new FeatureLayer({
        url: service + '/' + (config ? config.layer : 13), outFields: fields, popupEnabled: false,
        renderer: new DotDensityRenderer({
          dotValue: 10, referenceScale: 0, dotSize: 1.25, seed: 13,
          outline: null, backgroundColor: [0, 0, 0, 0], attributes: categories
        })
      });
      const states = new FeatureLayer({
        url: service + '/12', popupEnabled: false,
        renderer: { type: 'simple', symbol: { type: 'simple-fill', color: [0, 0, 0, 0], outline: { color: '#100c32', width: 0.8 } } }
      });
      const map = new Map({
        basemap: new Basemap({ baseLayers: [new VectorTileLayer({
          url: 'https://cdn.arcgis.com/sharing/rest/content/items/5e9b3685f4c24d8781073dd928ebda50/resources/styles/root.json',
          blendMode: 'screen'
        })] }),
        layers: [...(config ? rateLayers : [raceLayer]), states]
      });
      const startExtent = new Extent({ xmin: -14000000, ymin: 2800000, xmax: -7400000, ymax: 6500000, spatialReference: { wkid: 3857 } });
      view = new MapView({
        container: 'map', map, extent: startExtent,
        background: { color: '#05003b' },
        constraints: { snapToZoom: false, minZoom: 2, maxZoom: 12 },
        navigation: { mouseWheelZoomEnabled: false },
        popupEnabled: false, ui: { components: ['attribution'] },
        highlightOptions: { color: '#ede3dd', fillOpacity: 0.08, haloOpacity: 0.9 }
      });
      await Promise.all([view.when(), raceLayer.load(), states.load()]);
      raceLayerView = await view.whenLayerView(raceLayer);
      if (config) {
        const legend = document.getElementById('legend');
        function renderRateLegend() {
          legend.replaceChildren();
          raceLayer.renderer.classBreakInfos.forEach(info => {
            const row = document.createElement('div'); row.className = 'legend-item';
            const swatch = document.createElement('span'); swatch.className = 'swatch rate-swatch';
            swatch.style.background = info.symbol.color.toCss(true);
            swatch.setAttribute('aria-hidden', 'true');
            row.append(swatch, document.createTextNode(info.label)); legend.append(row);
          });
        }
        renderRateLegend();
        if (categories.length > 1) {
          const label = document.createElement('label'); label.htmlFor = 'rate-layer';
          label.textContent = 'Show map';
          const selector = document.createElement('select'); selector.id = 'rate-layer';
          categories.forEach((category, index) => {
            const option = document.createElement('option');
            option.value = String(index); option.textContent = category.label; selector.append(option);
          });
          legend.before(label, selector);
          selector.addEventListener('change', async () => {
            selector.disabled = true; closeDetails(); notice('Loading map layer…');
            const previousLayer = raceLayer;
            try {
              const layer = rateLayers[Number(selector.value)];
              await layer.load();
              const layerView = await view.whenLayerView(layer);
              rateLayers.forEach(item => { item.visible = item === layer; });
              raceLayer = layer; raceLayerView = layerView;
              renderRateLegend(); notice('');
            } catch (error) {
              selector.value = String(rateLayers.indexOf(previousLayer));
              notice('This layer could not load. Please try again.');
            } finally { selector.disabled = false; }
          });
        }
      }
      updateRenderer();
      notice('Click a region to explore its data. Use + and − to zoom.');
      view.on('click', event => selectRegion({ geometry: event.mapPoint, spatialRelationship: 'intersects' }));
      document.getElementById('home').addEventListener('click', () => {
        closeDetails(); notice(''); view.goTo(startExtent).catch(() => {});
      });
      document.getElementById('zoom-in').addEventListener('click', () => view.goTo({ zoom: view.zoom + 1 }).catch(() => {}));
      document.getElementById('zoom-out').addEventListener('click', () => view.goTo({ zoom: view.zoom - 1 }).catch(() => {}));
      regionSelect.addEventListener('change', () => {
        if (regionSelect.value) selectRegion({ objectIds: [Number(regionSelect.value)] }, true);
        else closeDetails();
      });
      // Query IDs first, then bounded batches, so service transfer limits cannot hide regions.
      const ids = await raceLayer.queryObjectIds({ where: '1=1' });
      const features = [];
      for (let index = 0; index < ids.length; index += 200) {
        const result = await raceLayer.queryFeatures({ objectIds: ids.slice(index, index + 200), outFields: ['FID', 'COCNAME', 'STATE_NAME'], returnGeometry: false });
        features.push(...result.features);
      }
      const first = document.createElement('option'); first.value = ''; first.textContent = 'Choose a region…';
      regionSelect.replaceChildren(first);
      features.sort((a, b) => String(a.attributes.COCNAME).localeCompare(String(b.attributes.COCNAME))).forEach(feature => {
        const option = document.createElement('option'); option.value = feature.attributes.FID;
        option.textContent = feature.attributes.COCNAME + ' — ' + feature.attributes.STATE_NAME;
        regionSelect.append(option);
      });
      regionSelect.disabled = false;
    } catch (error) {
      notice('Some map data could not load. Refresh to try again; the original map is linked in the source note.');
    }
  }, () => notice('The map library could not load. Please refresh to try again.'));
})();
