const readLocalArray = key => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const state = {
  products: [],
  cart: readLocalArray('katana-cart'),
  wishlist: readLocalArray('katana-wishlist'),
  query: '',
  gender: '',
  sort: 'newest',
  max: ''
};
const $ = selector => document.querySelector(selector);
const api = async url => {
  const response = await fetch(url);
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : null;
  if (!response.ok) throw new Error(data?.message || `تعذر تحميل البيانات (HTTP ${response.status})`);
  if (!data) throw new Error('استجابة الخادم غير صالحة');
  return data;
};
const money = amount => `${Number(amount || 0).toLocaleString('fr-MA')} DH`;
const fallbackImage = 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=700&q=80';
const toast = message => {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  setTimeout(() => element.classList.remove('show'), 2800);
};

async function loadSettings() {
  try {
    const settings = await api('/api/settings');
    if (settings.heroTitle) $('#heroTitle').textContent = settings.heroTitle;
    if (settings.heroDescription) $('#heroDescription').textContent = settings.heroDescription;
    const whatsapp = document.querySelector('.whatsapp');
    if (whatsapp && settings.whatsapp) {
      whatsapp.href = `https://wa.me/${settings.whatsapp.replace(/\D/g, '').replace(/^0/, '212')}`;
    }
  } catch (error) {
    console.warn(error.message);
  }
}

async function loadProducts() {
  const params = new URLSearchParams({ sort: state.sort, limit: '100' });
  if (state.query) params.set('q', state.query);
  if (state.gender) params.set('gender', state.gender);
  if (state.max) params.set('max', state.max);

  try {
    const data = await api(`/api/products?${params}`);
    state.products = data.products;
    renderProducts();
  } catch (error) {
    toast(error.message);
  }
}

function renderProducts() {
  const grid = $('#productsGrid');
  $('#emptyState').hidden = state.products.length > 0;
  grid.innerHTML = state.products.map(product => {
    const image = product.images?.[0] || fallbackImage;
    return `<article class="product-card"><div class="product-image"><button class="heart" data-wish="${product._id}" aria-label="Wishlist">${state.wishlist.includes(product._id) ? '♥' : '♡'}</button>${product.isNew ? '<span class="product-badge">NEW</span>' : ''}<img loading="lazy" src="${image}" alt="${product.name}" data-product="${product._id}"></div><div class="product-info"><small>${product.gender} · ${product.volume}</small><h3>${product.name}</h3><div class="product-meta"><strong>${money(product.price)}</strong><span>★ ${product.rating || '4.8'}</span></div></div></article>`;
  }).join('');

  grid.querySelectorAll('[data-product]').forEach(element => {
    element.addEventListener('click', () => openProduct(element.dataset.product));
  });
  grid.querySelectorAll('[data-wish]').forEach(element => {
    element.addEventListener('click', () => toggleWish(element.dataset.wish));
  });
}

async function openProduct(id) {
  try {
    const product = state.products.find(item => item._id === id) || await api(`/api/products/${id}`);
    const image = product.images?.[0] || fallbackImage;
    $('#modalContent').innerHTML = `<button class="close-modal">×</button><img src="${image}" alt="${product.name}"><div class="modal-copy"><small class="eyebrow">${product.category || 'SIGNATURE COLLECTION'}</small><h2>${product.name}</h2><strong>${money(product.price)}</strong><p>${product.description || product.shortDescription || 'تركيبة فاخرة صممت لتترك أثرًا.'}</p><p><b>العائلة:</b> ${product.fragranceFamily || 'Elegant'}<br><b>النوتات:</b> ${(product.topNotes || []).join(' · ')}</p><button class="button button-gold full" data-add="${product._id}">أضف إلى السلة <span>←</span></button></div>`;
    $('#productModal').hidden = false;
    $('.close-modal').onclick = () => { $('#productModal').hidden = true; };
    $('#modalContent [data-add]').onclick = () => {
      addCart(product);
      $('#productModal').hidden = true;
    };
  } catch (error) {
    toast(error.message);
  }
}

function addCart(product) {
  const item = state.cart.find(entry => entry.product === product._id);
  if (item) item.quantity += 1;
  else {
    state.cart.push({
      product: product._id,
      name: product.name,
      price: product.price,
      image: product.images?.[0],
      quantity: 1
    });
  }
  saveCart();
  toast('أضيف العطر إلى سلتك');
}

function saveCart() {
  localStorage.setItem('katana-cart', JSON.stringify(state.cart));
  $('#cartCount').textContent = state.cart.reduce((count, item) => count + item.quantity, 0);
  renderCart();
}

function renderCart() {
  $('#cartItems').innerHTML = state.cart.length
    ? state.cart.map(item => `<div class="cart-item"><img src="${item.image || fallbackImage}" alt=""><div><h4>${item.name}</h4><p>${money(item.price)}</p><div class="qty"><button data-dec="${item.product}">−</button>${item.quantity}<button data-inc="${item.product}">+</button></div></div></div>`).join('')
    : '<div class="empty-state">سلتك فارغة حاليًا.</div>';
  $('#cartTotal').textContent = money(
    state.cart.reduce((total, item) => total + item.price * item.quantity, 0)
  );
  $('#cartItems').querySelectorAll('[data-inc]').forEach(button => {
    button.onclick = () => changeQty(button.dataset.inc, 1);
  });
  $('#cartItems').querySelectorAll('[data-dec]').forEach(button => {
    button.onclick = () => changeQty(button.dataset.dec, -1);
  });
}

function changeQty(id, delta) {
  const item = state.cart.find(entry => entry.product === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity < 1) state.cart = state.cart.filter(entry => entry.product !== id);
  saveCart();
}

function toggleWish(id) {
  state.wishlist = state.wishlist.includes(id)
    ? state.wishlist.filter(productId => productId !== id)
    : [...state.wishlist, id];
  localStorage.setItem('katana-wishlist', JSON.stringify(state.wishlist));
  renderProducts();
  toast('تم تحديث المفضلة');
}

let searchDebounce;
$('#searchInput').oninput = event => {
  clearTimeout(searchDebounce);
  state.query = event.target.value;
  $('#suggestions').replaceChildren();
  if (state.query.length > 1) {
    searchDebounce = setTimeout(async () => {
      try {
        const data = await api(`/api/products?q=${encodeURIComponent(state.query)}&limit=5`);
        $('#suggestions').innerHTML = data.products.map(product =>
          `<div data-suggestion="${product._id}">${product.name} <small>${money(product.price)}</small></div>`
        ).join('');
        $('#suggestions').querySelectorAll('[data-suggestion]').forEach(element => {
          element.onclick = () => openProduct(element.dataset.suggestion);
        });
        await loadProducts();
      } catch (error) {
        toast(error.message);
      }
    }, 350);
  } else {
    loadProducts();
  }
};

$('#sortSelect').onchange = event => {
  state.sort = event.target.value;
  loadProducts();
};
$('#maxPrice').onchange = event => {
  state.max = event.target.value;
  loadProducts();
};
document.querySelectorAll('.filter-chip').forEach(button => {
  button.onclick = () => {
    document.querySelector('.filter-chip.active')?.classList.remove('active');
    button.classList.add('active');
    state.gender = button.dataset.gender;
    loadProducts();
  };
});
$('#filterToggle').onclick = () => $('#filters').classList.toggle('open');
$('#cartBtn').onclick = () => $('#cartDrawer').classList.add('open');
$('#closeCart').onclick = () => $('#cartDrawer').classList.remove('open');
$('#checkoutBtn').onclick = () => { location.href = '/checkout.html'; };
$('#finderHero').onclick = () => { location.href = '#finder'; };
$('#findBtn').onclick = () => {
  state.query = $('#finderStyle').value;
  state.gender = $('#finderGender').value;
  state.max = $('#finderBudget').value;
  location.href = '#shop';
  loadProducts();
};

loadSettings();
loadProducts();
saveCart();
