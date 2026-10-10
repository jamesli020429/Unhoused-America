/* Exact descriptions from the archived StoryMap; published ArcGIS rate renderers. */
window.demographicMaps = {
  rate: {
    title: 'Rate of Homelessness', next: 'unsheltered', layer: 8,
    description: 'Using HUD Continuum of Care regions, our platform will feature customizable mapping of homelessness across the US, disaggregated by demographics to identify regional “hot spots” and thematic disparities often overlooked in other publicly available data.',
    legend: 'Homelessness Rate per 10,000 Residents', countsTitle: 'Reported homelessness rate',
    categories: [{ field: 'PEHRATE10K', label: 'Homelessness rate per 10,000 residents', layer: 8 }]
  },
  unsheltered: {
    title: 'Unsheltered Homelessness', next: 'sheltered', layer: 3,
    description: 'The unsheltered v sheltered population is an insight into the intersectional injustices that impact communities who have less access to receiving temporary housing, supportive housing, or transitional housing to ensure their experience is not lived in public. Gender expansive people, and the Native American and Asian American communities are overrepresented in unsheltered housing.',
    legend: 'Unsheltered Homelessness Rate', countsTitle: 'Reported unsheltered homelessness rate',
    categories: [{ field: 'USHLT_RATE', label: 'Unsheltered homelessness rate', layer: 3 }]
  },
  sheltered: {
    title: 'Sheltered Homelessness', next: 'rate', layer: 4,
    description: 'The unsheltered v sheltered population is an insight into the intersectional injustices that impact communities who have less access to receiving temporary housing, supportive housing, or transitional housing to ensure their experience is not lived in public. Gender expansive people, and the Native American and Asian American communities are overrepresented in unsheltered housing.',
    legend: 'Sheltered Homelessness Rate', countsTitle: 'Reported sheltered homelessness rate',
    categories: [{ field: 'SHLT_RATE', label: 'Sheltered homelessness rate', layer: 4 }]
  },
  age: {
    title: 'Age and Homelessness', next: 'gender', layer: 18,
    description: 'With the average saving amount necessary to retire comfortability within the United States rising, adults older than 55 are the fastest growing age group becoming houseless. Access to jobs with standard retirement compensations are dwindling, and causing the insecurity for affordable housing and the ability to provide for oneself into old age.',
    legend: 'Homelessness Rate by Age Group', countsTitle: 'Reported homelessness rates',
    categories: [
      { field: 'YTH_RATE', label: 'Youth Homelessness Rate', layer: 18 },
      { field: 'ELDER_RATE', label: 'Elder Homelessness Rate', layer: 17 }
    ]
  },
  gender: {
    title: 'Gender and Homelessness', next: 'veteran', layer: 22,
    description: 'The houseless rate among men is significant, and when localized to individual Continuums of Care (CoCs) it is evident that there is a disproportionate representation of male-identified persons: in almost all CoCs, 97 percent of them, men are the majority population.',
    legend: 'Rate of Homelessness by Gender', countsTitle: 'Reported homelessness rates',
    categories: [
      { field: 'MEN_RATE', label: 'Male Homelessness Rate', layer: 22 },
      { field: 'WOM_RATE', label: 'Female Homelessness Rate', layer: 21 }
    ]
  },
  veteran: {
    title: 'Veteran Homelessness', next: 'race', layer: 25,
    description: "Due to the protected class status, and extensive wrap around services, Veteran's, while still struggling have greater success on their path to being housed. As a result, the model for supporting unhoused Veterans should be outsourced to support all communities.",
    legend: 'Homelessness Rate Among Veterans', countsTitle: 'Reported homelessness rate',
    categories: [{ field: 'VET_RATE', label: 'Veteran Homelessness Rate', layer: 25 }]
  }
};
(() => {
  const topic = new URLSearchParams(window.location.search).get('topic');
  if (!Object.prototype.hasOwnProperty.call(window.demographicMaps, topic)) return;
  const config = window.demographicMaps[topic];
  document.title = config.title;
  document.getElementById('map-title').textContent = config.title;
  document.getElementById('map-description').textContent = config.description;
  document.querySelector('.race-context').hidden = true;
  document.getElementById('legend-title').textContent = config.legend;
  document.getElementById('legend').setAttribute('aria-label', 'Published rate legend');
  document.querySelector('#legend-title + p').textContent = 'Original StoryMap rate classifications';
  document.getElementById('counts-title').textContent = config.countsTitle;
  document.getElementById('reset-categories').hidden = true;
  document.querySelector('.methodology').textContent = 'Colors show regional rates using the original ArcGIS layer and class breaks, not individual locations. Select a region for its reported values.';
  const nextLink = document.getElementById('next-map');
  nextLink.href = '/map/' + config.next;
  nextLink.textContent = 'Next map: ' + config.next.charAt(0).toUpperCase() + config.next.slice(1) + ' →';
  document.getElementById('status').textContent = 'Loading ' + config.title.toLowerCase() + ' data…';
})();
