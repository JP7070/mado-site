const time = document.querySelector('#time');
function updateTime(){time.textContent=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit'}).format(new Date());}
updateTime();setInterval(updateTime,60000);
const filters = [...document.querySelectorAll('[data-filter]')];
const cards = [...document.querySelectorAll('[data-category]')];
const labels = {all:'すべて',anime:'TVアニメ',commercial:'広告・CM',spatial:'空間演出'};
function filterWorks(category, updateURL = true) {
  if (!Object.hasOwn(labels, category)) category = 'all';
  let count = 0;
  for (const card of cards) {
    card.hidden = category !== 'all' && card.dataset.category !== category;
    if (!card.hidden) { card.dataset.layout = String(count % 4); count++; }
  }
  for (const button of filters) button.setAttribute('aria-pressed', String(button.dataset.filter === category));
  document.querySelector('.result-count').textContent = `${labels[category]}の作品 · ${count}件`;
  if (updateURL) {
    const url = new URL(location.href);
    if (category === 'all') url.searchParams.delete('works');
    else url.searchParams.set('works', category);
    url.hash = 'works';
    history.pushState(null, '', url);
  }
}
for (const button of filters) button.addEventListener('click', () => filterWorks(button.dataset.filter));
function restoreFilter() { filterWorks(new URL(location.href).searchParams.get('works') || 'all', false); }
window.addEventListener('popstate', restoreFilter);
restoreFilter();
