// Standalone native SVG graphics; no bitmap kit is requested at runtime.
const catalog = await fetch('assets/vector/catalog.json').then(r => r.json());
const regions = new Map(catalog.assets.map(a => [a.id, a]));
export const region = id => regions.get(id);
const href = a => 'assets/vector/' + a.file;
export function sprite(id, cls='') {
  const a = region(id);
  return a ? `<span class="kit-sprite ${cls}" data-kit="${id}" aria-hidden="true"><img src="${href(a)}" alt="" width="${a.width}" height="${a.height}" decoding="async"></span>` : '';
}
// Nine-slice native SVG rendering preserves corner shapes while panels adapt.
export function frame(id, cls='') {
  const a = region(id); if (!a) return '';
  const edge = Math.floor(Math.min(a.width, a.height) * .23);
  return `<span class="kit-frame ${cls}" data-kit="${id}" aria-hidden="true" style="border-image-source:url('${href(a)}');border-image-slice:${edge} fill"></span>`;
}
export function decorate(root=document) {
  const put=(selector,id,cls='')=>root.querySelectorAll(selector).forEach(el=>{
    if(el.querySelector(':scope > .kit-frame,:scope > .kit-bg'))return;
    el.insertAdjacentHTML('afterbegin',frame(typeof id==='function'?id(el):id,cls));
    el.classList.add('kit-backed');
  });
  put('.panel,.paper', 'panel-medium', 'panel-frame');
  put('.topbar,.sidebar', 'panel-wide','bar-frame');
  put('.head-badge,.party-rule,.stat,.rule-card,.effect-banner,.supreme-box', 'card-default','small-frame');
  put('.party-card',el=>el.classList.contains('selected')?'card-selected-violet':'card-default','row-frame');
  put('.button,.nav-button,.tab,.paper-tabs button,.player-switch button', el=>el.matches('.primary,.active')?'button-primary':'button-default','button-frame');
  put('.dex-row,.shop-row',el=>el.classList.contains('selected')?'card-selected-violet':'card-default','row-frame');
  put('.menu-tile',el=>el.classList.contains('featured')?'panel-wide':'panel-medium','tile-frame');
  put('.item-slot',el=>el.classList.contains('selected')?'slot-selected':'slot-default','slot-frame');
  root.querySelectorAll('.box-slot,.portrait,.mini,.evo-img,.hero-art,.item-hero').forEach(el=>{
    if(el.querySelector(':scope > .kit-bg'))return;
    el.insertAdjacentHTML('afterbegin',sprite(el.closest('.selected,.active')?'circle-selected':'circle-default','kit-bg'));
    el.classList.add('kit-circle');
  });
}
export const kitCatalog=catalog;
await Promise.all(catalog.assets.filter(a=>a.kind!=='command').map(a=>{
  const img=new Image();img.src=href(a);return img.decode();
}));
