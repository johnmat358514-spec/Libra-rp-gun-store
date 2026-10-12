'use strict';

const $ = selector => document.querySelector(selector);
const fmt = amount => '$' + Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const STORAGE_KEY = 'ammu-nation-15-loadout-v2';
const MAX_QUANTITY = 100000;
const typeNames = { gun: 'Weapon', ammo: 'Ammunition', armor: 'Armor' };
const tierNames = { clan: 'Clan & Cartel', reseller: 'Reseller' };
let filter = 'all';
let expanded = false;
let tier = 'clan';
let cart = {};
let toastTimer;
let storageAvailable = true;
const quantities = {};

function clampQuantity(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(1, Math.min(MAX_QUANTITY, Math.floor(number))) : 1;
}
function minimums() { return tier === 'clan' ? { gun: 10, ammo: 5000 } : { gun: 50, ammo: 10000 }; }
function unitCents(product) { return Math.round(product[tier] * 100); }
function defaultQuantity(product) { return product.type === 'ammo' ? 1000 : 1; }
function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== 'object') return;
    if (['clan', 'reseller'].includes(saved.tier)) tier = saved.tier;
    if (saved.cart && typeof saved.cart === 'object' && !Array.isArray(saved.cart)) {
      for (const [index, quantity] of Object.entries(saved.cart)) {
        if (/^\d+$/.test(index) && products[Number(index)] && Number.isInteger(quantity) && quantity > 0) {
          cart[Number(index)] = Math.min(MAX_QUANTITY, quantity);
        }
      }
    }
  } catch { storageAvailable = false; }
}
function saveCart() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ tier, cart })); }
  catch { storageAvailable = false; }
}
function totals() {
  return Object.entries(cart).reduce((result, [index, quantity]) => {
    const product = products[Number(index)];
    result[product.type] += quantity;
    result.cents += unitCents(product) * quantity;
    result.lines++;
    return result;
  }, { gun: 0, ammo: 0, armor: 0, cents: 0, lines: 0 });
}
function status(message, error = false) {
  $('#status').textContent = message;
  $('#status').classList.toggle('error', error);
}
function toast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2800);
}
function renderProducts() {
  const query = $('#search').value.trim().toLowerCase();
  const sort = $('#sort').value;
  let visible = products.map((product, index) => ({ ...product, index })).filter(product =>
    (filter === 'all' || product.type === filter) && product.name.toLowerCase().includes(query));
  if (sort === 'low') visible.sort((a, b) => a[tier] - b[tier]);
  if (sort === 'high') visible.sort((a, b) => b[tier] - a[tier]);
  if (sort === 'name') visible.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'featured' && filter === 'all' && !query) {
    const featured = [0, 1, 21, 17, 8, 7];
    const rank = index => featured.includes(index) ? featured.indexOf(index) : index + featured.length;
    visible.sort((a, b) => rank(a.index) - rank(b.index));
  }
  const count = visible.length;
  if (!expanded && !query) visible = visible.slice(0, 6);
  $('#resultcount').textContent = `${visible.length < count ? `${visible.length} of ` : ''}${count} ${count === 1 ? 'item' : 'items'} ${query ? 'matching your search' : 'in the armory'}`;
  const otherTier = tier === 'clan' ? 'reseller' : 'clan';
  $('#products').innerHTML = visible.map(product => {
    const name = escapeHTML(product.name);
    const quantity = quantities[product.index] || defaultQuantity(product);
    return `<article class="product" data-type="${product.type}">
      <button class="product-image" data-detail="${product.index}" aria-label="View ${name} details">
        <span class="product-tag">${product.type === 'armor' ? 'PROTECTION' : product.type === 'ammo' ? 'KEEP IT LOADED' : 'THE ARMORY / 15'}</span>
        <img src="${product.image}" alt="${name}" class="${product.image.includes('studio') ? 'image-studio' : ''}" loading="lazy" width="160" height="145">
        <span class="product-id">AN–${String(product.index + 1).padStart(3, '0')}</span><span class="zoom-mark" aria-hidden="true">↗</span>
      </button>
      <div class="product-body"><div class="product-kind">${typeNames[product.type]}</div><h3><button class="product-title" data-detail="${product.index}">${name}</button></h3>
      <div class="product-price"><strong>${fmt(product[tier])}</strong><small>/ ${product.type === 'ammo' ? 'round' : 'unit'}</small></div>
      <div class="alt-price">${tierNames[otherTier]}: ${fmt(product[otherTier])}</div>
      <div class="product-buy"><div class="quantity"><button data-step="${product.index},-1" aria-label="Decrease ${name} quantity">−</button><input type="number" inputmode="numeric" min="1" max="${MAX_QUANTITY}" step="1" value="${quantity}" id="qty-${product.index}" data-quantity="${product.index}" aria-label="${name} quantity"><button data-step="${product.index},1" aria-label="Increase ${name} quantity">+</button></div><button class="add" data-add="${product.index}" aria-label="Add ${name} to your order">Add <span aria-hidden="true">+</span></button></div></div></article>`;
  }).join('') || `<div class="empty-results"><strong>No gear found.</strong>Try another name or browse the full armory.<br><button id="reset-filters">Reset filters</button></div>`;
  if (count > 6 && !query) $('#products').insertAdjacentHTML('beforeend', `<button class="load-more" id="load-more">${expanded ? 'Show less' : `Explore all ${count} items`} <span aria-hidden="true">${expanded ? '−' : '+'}</span></button>`);
}
function renderCart() {
  const result = totals();
  const min = minimums();
  for (const id of ['cartcount', 'headercount', 'mobile-count']) $('#' + id).textContent = result.lines;
  $('#grand').textContent = fmt(result.cents / 100);
  $('#mobile-total').textContent = fmt(result.cents / 100);
  $('#cart-tier').textContent = `${tierNames[tier]} pricing`;
  $('#clear').disabled = result.lines === 0;
  $('#cartitems').innerHTML = Object.entries(cart).map(([index, quantity]) => {
    const product = products[Number(index)], name = escapeHTML(product.name);
    return `<div class="cart-item"><img class="cart-thumb" src="${product.image}" alt=""><div class="cart-info"><div class="cart-item-top"><strong>${name}</strong><button class="remove" data-remove="${index}" aria-label="Remove ${name}">×</button></div><div class="cart-unit">${fmt(product[tier])} / ${product.type === 'ammo' ? 'round' : 'unit'}</div><div class="cart-item-bottom"><div class="cart-qty"><button data-change="${index},-1" aria-label="Decrease ${name} in order">−</button><span>${quantity.toLocaleString()}</span><button data-change="${index},1" aria-label="Increase ${name} in order">+</button></div><strong>${fmt(unitCents(product) * quantity / 100)}</strong></div></div></div>`;
  }).join('') || `<div class="cart-empty"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="m7 13 13-7 13 7v16l-13 7-13-7V13Zm0 0 13 7 13-7M20 20v16M13 10l13 7"/><path d="M16 25h8"/></svg><strong>A fresh start. A new loadout.</strong><p>Your order is looking a little light.<br>Find your gear and make it yours.</p><a href="#store">Explore the armory ↗</a></div>`;
  const requiredTypes = ['gun', 'ammo'].filter(type => result[type] > 0);
  $('#requirements').innerHTML = requiredTypes.length ? requiredTypes.map(type => `<div class="requirement ${result[type] >= min[type] ? 'complete' : ''}"><div class="requirement-label"><span>${type === 'gun' ? 'Weapons' : 'Ammo'} minimum</span><span>${result[type].toLocaleString()} / ${min[type].toLocaleString()} ${result[type] >= min[type] ? '✓' : ''}</span></div><div class="progress-track" role="progressbar" aria-label="${type === 'gun' ? 'Weapon' : 'Ammunition'} minimum" aria-valuemin="0" aria-valuemax="${min[type]}" aria-valuenow="${Math.min(min[type], result[type])}"><span style="width:${Math.min(100, result[type] / min[type] * 100)}%"></span></div></div>`).join('') : `<p class="minimum-hint">${tierNames[tier]} minimums: ${min.gun} weapons / ${min.ammo.toLocaleString()} ammo. Applies only to categories ordered.</p>`;
  saveCart();
  if (!storageAvailable) status('Your order is available this visit. Browser storage is unavailable.');
}
function validationError() {
  const result = totals(), min = minimums();
  if (!result.lines) return 'Add some gear to your order first.';
  const needed = [];
  if (result.gun && result.gun < min.gun) needed.push(`${min.gun - result.gun} more weapons`);
  if (result.ammo && result.ammo < min.ammo) needed.push(`${(min.ammo - result.ammo).toLocaleString()} more ammo rounds`);
  return needed.length ? `Add ${needed.join(' and ')} to meet ${tierNames[tier]} minimums.` : null;
}
function updateOrderStatus() {
  const error = validationError();
  status(error || 'Your loadout is ready. Copy or download to share in-game.', !!error && totals().lines > 0);
}
function orderText() {
  return ['AMMU-NATION #15 — LIBRA RP IN-GAME ORDER', 'Sandy Shores | Map 1', `Customer category: ${tierNames[tier]}`, '----------------------------------------',
    ...Object.entries(cart).map(([index, quantity]) => `${products[index].name} x ${quantity} @ ${fmt(products[index][tier])} = ${fmt(unitCents(products[index]) * quantity / 100)}`),
    '----------------------------------------', `GRAND TOTAL: ${fmt(totals().cents / 100)}`, '', 'VIRTUAL ROLEPLAY ORDER ONLY — NO REAL GOODS', 'All amounts are fictional in-game currency.'].join('\r\n');
}
function addItem(index, quantity) {
  const previous = cart[index] || 0;
  cart[index] = Math.min(MAX_QUANTITY, previous + clampQuantity(quantity));
  const added = cart[index] - previous;
  renderCart();
  updateOrderStatus();
  toast(added ? `${added.toLocaleString()} × ${products[index].name} added to your loadout` : 'Maximum quantity reached for this item.');
}
function showProduct(index) {
  const product = products[index];
  const name = escapeHTML(product.name);
  const descriptions = {
    gun: 'Part of the Ammu-Nation #15 weapon collection. Add it to your crew’s next in-game loadout.',
    ammo: 'Restock your in-game loadout. Pricing is per round; the quantity selector starts at 1,000 rounds.',
    armor: 'Complete your in-game loadout with a body armor vest. Available individually, with no bulk minimum.'
  };
  $('#dialog-content').innerHTML = `<div class="dialog-layout"><div class="dialog-image"><img src="${product.image}" alt="${name}"></div><div class="dialog-info"><div class="eyebrow">${typeNames[product.type]} / AN–${String(index + 1).padStart(3, '0')}</div><h2 id="dialog-title">${name}</h2><p>${descriptions[product.type]}</p><div class="product-price"><strong>${fmt(product[tier])}</strong><small>/ ${product.type === 'ammo' ? 'round' : 'unit'}</small></div><p>${tierNames[tier]} pricing</p><button class="button orange" data-dialog-add="${index}">Add ${defaultQuantity(product).toLocaleString()} to loadout +</button><small>Representative product imagery. Virtual Libra RP item.</small></div></div>`;
  $('#product-dialog').showModal();
}
async function copyOrder() {
  const error = validationError();
  if (error) { status(error, true); toast(error); return; }
  const text = orderText();
  try {
    if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard API unavailable');
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.cssText = 'position:fixed;top:0;left:-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch { /* Download remains available. */ }
    textarea.remove();
    $('#copy').focus({ preventScroll: true });
    if (!copied) { status('Clipboard unavailable. Use Download order instead.', true); return; }
  }
  status('Order copied. Share it with the Ammu-Nation #15 team in-game.');
  toast('Order copied. You’re ready to roll.');
}
function downloadOrder() {
  const error = validationError();
  if (error) { status(error, true); toast(error); return; }
  const url = URL.createObjectURL(new Blob([orderText()], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'ammu-nation-15-order.txt';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  status('Order downloaded. Share it with the Ammu-Nation #15 team in-game.');
}
function setFilter(value) {
  filter = value;
  expanded = false;
  document.querySelectorAll('[data-filter]').forEach(button => {
    const active = button.dataset.filter === value;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  renderProducts();
}
document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.filter) setFilter(button.dataset.filter);
  if (button.id === 'load-more') { expanded = !expanded; renderProducts(); if (!expanded) $('#store').scrollIntoView({ behavior: 'smooth' }); $('#load-more')?.focus({ preventScroll: true }); }
  if (button.dataset.step) {
    const [index, direction] = button.dataset.step.split(',').map(Number);
    const input = $('#qty-' + index);
    const step = products[index].type === 'ammo' ? 1000 : 1;
    input.value = clampQuantity(clampQuantity(input.value) + direction * step);
    quantities[index] = Number(input.value);
  }
  if (button.dataset.add !== undefined) {
    const index = Number(button.dataset.add);
    const input = $('#qty-' + index);
    input.value = clampQuantity(input.value);
    quantities[index] = Number(input.value);
    addItem(index, input.value);
  }
  if (button.dataset.detail !== undefined) showProduct(Number(button.dataset.detail));
  if (button.dataset.dialogAdd !== undefined) {
    const index = Number(button.dataset.dialogAdd);
    addItem(index, defaultQuantity(products[index]));
    $('#product-dialog').close();
  }
  if (button.classList.contains('dialog-close')) $('#product-dialog').close();
  if (button.dataset.change) {
    const [index, direction] = button.dataset.change.split(',').map(Number);
    const step = products[index].type === 'ammo' ? 1000 : 1;
    cart[index] = Math.min(MAX_QUANTITY, cart[index] + direction * step);
    if (cart[index] <= 0) delete cart[index];
    renderCart();
    updateOrderStatus();
    const next = document.querySelector(`[data-change="${index},${direction}"]`) || $('#clear');
    next.focus({ preventScroll: true });
  }
  if (button.dataset.remove !== undefined) {
    const name = products[Number(button.dataset.remove)].name;
    delete cart[Number(button.dataset.remove)];
    renderCart(); updateOrderStatus(); toast(`${name} removed from your order`);
    ($('#cartitems .remove') || $('#copy')).focus({ preventScroll: true });
  }
  if (button.id === 'clear') { cart = {}; renderCart(); status('Order cleared. Ready for a fresh loadout.'); toast('Your order has been cleared'); $('#copy').focus({ preventScroll: true }); }
  if (button.id === 'copy') copyOrder();
  if (button.id === 'download') downloadOrder();
  if (button.id === 'reset-filters') { $('#search').value = ''; setFilter('all'); $('#search').focus(); }
});
document.addEventListener('change', event => {
  if (event.target.dataset.quantity !== undefined) {
    event.target.value = clampQuantity(event.target.value);
    quantities[Number(event.target.dataset.quantity)] = Number(event.target.value);
  }
});
$('#tier').addEventListener('change', event => {
  tier = event.target.value;
  renderProducts(); renderCart(); updateOrderStatus();
  toast(`Switched to ${tierNames[tier]} prices. Your items are saved.`);
});
$('#search').addEventListener('input', renderProducts);
$('#sort').addEventListener('change', renderProducts);
$('#product-dialog').addEventListener('click', event => {
  if (event.target !== $('#product-dialog')) return;
  const bounds = event.target.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.target.close();
});
loadCart();
$('#tier').value = tier;
renderProducts();
renderCart();
if (totals().lines) updateOrderStatus();
