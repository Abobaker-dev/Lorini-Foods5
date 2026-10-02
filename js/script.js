'use strict';
/* Lorini Foods – front-end demo. Auth uses localStorage ONLY for demonstration and is NOT secure. */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const money = n => '£' + n.toFixed(2);
const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};

/* ---------- Webhook (Zapier) ----------
   Each event type is POSTed to its own Zap. Leave a URL empty to disable it. URLs are visible to anyone who views the page source.
   Passwords are never sent. */
const WEBHOOKS = {
  reservation: 'https://hooks.zapier.com/hooks/catch/29020443/4mzf4qu/',
  order: 'https://hooks.zapier.com/hooks/catch/29020443/4mzf4qu/',
  signup: 'https://hooks.zapier.com/hooks/catch/29020443/4mzlexb/',
  login: 'https://hooks.zapier.com/hooks/catch/29020443/4mzlje4/'
};
async function sendToWebhook(type, data) {
  const url = WEBHOOKS[type];
  if (!url) return true;
  try {
    const body = new URLSearchParams({ type, submitted_at: new Date().toISOString(), ...data });
    // no-cors: Zapier doesn't send CORS headers, so the response can't be read; the request is still delivered
    await fetch(url, { method: 'POST', mode: 'no-cors', body });
    return true;
  } catch { return false; }
}

/* ---------- Data ---------- */
const MENU = {
  Starters: [
    ['Creamy Garlic Mushrooms', 'Chestnut mushrooms in a garlic cream sauce on toasted sourdough.', 8.95],
    ['Crispy Calamari', 'Lightly dusted squid with lemon aioli and chilli salt.', 9.50],
    ['Burrata & Tomato', 'Creamy burrata, heritage tomatoes, basil oil and aged balsamic.', 10.50],
    ['Truffle Parmesan Fries', 'Skin-on fries tossed with truffle oil and shaved Parmesan.', 6.95]],
  'Main Courses': [
    ['Grilled Ribeye Steak', 'Char-grilled premium ribeye served with roasted vegetables and our signature sauce.', 24.95],
    ['Creamy Tuscan Chicken', 'Pan-roasted chicken, sun-dried tomato, spinach and parmesan cream.', 17.95],
    ['Mediterranean Sea Bass', 'Crisp-skinned fillet, olive crushed potatoes, capers and lemon butter.', 21.50],
    ['Lorini Signature Pasta', 'Fresh tagliatelle, slow-cooked ragù, basil and aged pecorino.', 16.50],
    ['Truffle Mushroom Risotto', 'Carnaroli rice, wild mushrooms, truffle butter and chives.', 15.95]],
  Desserts: [
    ['Classic Tiramisu', 'Mascarpone cream, espresso-soaked sponge and cocoa.', 7.95],
    ['Chocolate Fondant', 'Warm dark chocolate pudding with a molten centre and vanilla ice cream.', 8.50],
    ['Vanilla Panna Cotta', 'Silky Madagascan vanilla cream with a seasonal berry compote.', 7.50],
    ['Berry Cheesecake', 'Baked New York-style cheesecake with mixed berry coulis.', 7.95]],
  Drinks: [
    ['Fresh Lemonade', 'Pressed lemons, mint and a touch of sugar, served over ice.', 3.95],
    ['Italian Soda', 'Sparkling water with your choice of raspberry, peach or elderflower.', 4.25],
    ['Espresso', 'Rich single-origin espresso, freshly pulled.', 2.95],
    ['Cappuccino', 'Velvety steamed milk over a double espresso shot.', 3.75],
    ['Signature Mocktail', 'Passion fruit, lime, ginger and rosemary with a sparkling finish.', 6.50]]
};
const IMG = id => `https://images.unsplash.com/photo-${id}?w=1000&q=75`;
const GALLERY = [
  ['1414235077428-338989a2e8c0', 'Chef’s plating'], ['1559339352-11d035aa65de', 'Dining room'],
  ['1577219491135-ce391730fb2c', 'Our chef at work'], ['1555396273-367ea4eb4db5', 'Evening ambience'],
  ['1551024709-8f23befc6f87', 'Signature drinks'], ['1551024506-0bccd828d307', 'Dessert'],
  ['1544025162-d76694265947', 'Ribeye steak'], ['1504674900247-0877df9cc836', 'Seasonal plates']
];
const ITEMS = Object.entries(MENU).flatMap(([cat, list]) => list.map(([name, desc, price]) => ({ id: name, name, desc, price, cat })));

/* ---------- UI helpers ---------- */
let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2600);
}
const openModal = id => { closeAll(); $('#' + id).classList.add('on'); document.body.style.overflow = 'hidden'; };
function closeAll() {
  $$('.modal,.lightbox,.drawer,.overlay').forEach(e => e.classList.remove('on'));
  document.body.style.overflow = '';
}
function showMsg(title, text) { $('#msg-t').textContent = title; $('#msg-p').textContent = text; openModal('m-msg'); }
document.addEventListener('click', e => {
  const t = e.target;
  if (t.closest('[data-close]') || t.classList.contains('modal') || t.id === 'overlay' || t.id === 'lightbox') closeAll();
  const sw = t.closest('[data-switch]'); if (sw) { e.preventDefault(); openModal(sw.dataset.switch); }
  if (t.closest('[data-cart]')) openDrawer();
  const op = t.closest('[data-open]'); if (op) { closeLinks(); openModal(op.dataset.open); }
});
document.addEventListener('keydown', e => e.key === 'Escape' && closeAll());

/* ---------- Navbar ---------- */
const nav = $('#nav'), burger = $('#burger'), links = $('#links');
const onScroll = () => nav.classList.toggle('scrolled', scrollY > 40);
addEventListener('scroll', onScroll, { passive: true }); onScroll();
function closeLinks() { links.classList.remove('on'); burger.classList.remove('on'); }
burger.onclick = () => { links.classList.toggle('on'); burger.classList.toggle('on'); };
$$('#links>a').forEach(a => a.addEventListener('click', closeLinks));

/* ---------- Scroll reveal ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
$$('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 4) * 80 + 'ms'; io.observe(el); });

/* ---------- Menu ---------- */
let activeCat = Object.keys(MENU)[0];
function renderTabs() {
  $('#tabs').innerHTML = Object.keys(MENU).map(c => `<button role="tab" class="${c === activeCat ? 'on' : ''}" data-cat="${c}">${c}</button>`).join('');
}
function renderMenu() {
  $('#menu-grid').innerHTML = MENU[activeCat].map(([name, desc, price], i) => `
    <article class="item" style="animation-delay:${i * 70}ms">
      <div class="item-b"><div class="item-t"><h3>${name}</h3><span class="price">${money(price)}</span></div>
      <p>${desc}</p><button class="btn sm line" data-add="${name}"><i class="fa-solid fa-plus"></i> Add to Order</button></div>
    </article>`).join('');
}
$('#tabs').addEventListener('click', e => {
  const b = e.target.closest('[data-cat]'); if (!b) return;
  activeCat = b.dataset.cat; renderTabs(); renderMenu();
});
$('#menu-grid').addEventListener('click', e => {
  const b = e.target.closest('[data-add]'); if (!b) return;
  addToCart(b.dataset.add);
});

/* ---------- Cart ---------- */
let cart = store.get('lorini_cart', {}); // { itemId: qty }
const find = id => ITEMS.find(i => i.id === id);
function addToCart(id) { cart[id] = (cart[id] || 0) + 1; saveCart(); toast(`${id} added to your order`); }
function setQty(id, q) { if (q <= 0) delete cart[id]; else cart[id] = q; saveCart(); }
function saveCart() { store.set('lorini_cart', cart); renderCart(); }
function renderCart() {
  const rows = Object.entries(cart).filter(([id]) => find(id));
  const total = rows.reduce((s, [id, q]) => s + find(id).price * q, 0);
  $('#count').textContent = rows.reduce((s, [, q]) => s + q, 0);
  $('#cart-items').innerHTML = rows.length ? rows.map(([id, q]) => `
    <div class="line-i"><b>${id} × ${q}</b><span class="p">${money(find(id).price * q)}</span>
      <div class="qty"><button data-q="${id}" data-d="-1" aria-label="Decrease">−</button><span>${q}</span><button data-q="${id}" data-d="1" aria-label="Increase">+</button></div>
      <button class="rm" data-rm="${id}">Remove</button></div>`).join('')
    : '<div class="empty"><i class="fa-solid fa-bag-shopping"></i><p>Your order is empty.<br>Add something delicious from our menu.</p></div>';
  $('#sub').textContent = $('#total').textContent = money(total);
}
$('#cart-items').addEventListener('click', e => {
  const q = e.target.closest('[data-q]'), r = e.target.closest('[data-rm]');
  if (q) setQty(q.dataset.q, (cart[q.dataset.q] || 0) + +q.dataset.d);
  if (r) setQty(r.dataset.rm, 0);
});
function openDrawer() { closeAll(); $('#drawer').classList.add('on'); $('#overlay').classList.add('on'); document.body.style.overflow = 'hidden'; }
$('#checkout').onclick = async () => {
  if (!Object.keys(cart).length) return toast('Your order is empty – add an item first');
  const total = $('#total').textContent, user = getUser();
  const items = Object.entries(cart).map(([id, q]) => `${id} x${q}`).join(', ');
  if (!await sendToWebhook('order', { items, total, customer_name: user?.name || 'Guest', customer_email: user?.email || '' }))
    return toast('Could not send your order. Please check your connection and try again');
  cart = {}; saveCart();
  showMsg('Order Confirmed', `Thank you${user ? ', ' + user.name.split(' ')[0] : ''}! Your demo order of ${total} has been placed. No payment was taken.`);
};

/* ---------- Form validation ---------- */
function check(form) {
  let ok = true;
  $$('input[name],select[name]', form).forEach(f => {
    const v = f.value.trim(); let err = '';
    if (f.required && !v) err = 'This field is required';
    else if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) err = 'Enter a valid email address';
    else if (f.type === 'tel' && !/^[+\d][\d\s()-]{7,}$/.test(v)) err = 'Enter a valid phone number';
    else if (f.minLength > 0 && v.length < f.minLength) err = `Use at least ${f.minLength} characters`;
    else if (f.dataset.match && v !== form.elements[f.dataset.match].value) err = 'Passwords do not match';
    else if (f.type === 'date' && v < f.min) err = 'Please choose a future date';
    const s = f.parentElement.querySelector('small');
    if (s) s.textContent = err; f.classList.toggle('bad', !!err);
    if (err) ok = false;
  });
  return ok;
}
$$('form').forEach(f => f.addEventListener('input', e => { e.target.classList.remove('bad'); const s = e.target.parentElement.querySelector('small'); if (s) s.textContent = ''; }));

/* ---------- Reservation ---------- */
const dateEl = $('#date'); dateEl.min = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
$('#time').innerHTML += Array.from({ length: 21 }, (_, i) => { const m = 12 * 60 + i * 30, h = Math.floor(m / 60);
  const l = `${h > 12 ? h - 12 : h}:${m % 60 ? '30' : '00'} ${h >= 12 ? 'PM' : 'AM'}`; return `<option>${l}</option>`; }).join('');
$('select[name=guests]').innerHTML = '<option value="">Select</option>' + Array.from({ length: 10 }, (_, i) => `<option value="${i + 1}">${i + 1} guest${i ? 's' : ''}</option>`).join('');
$('#res-form').addEventListener('submit', async e => {
  e.preventDefault(); const f = e.target; if (!check(f)) return toast('Please check the highlighted fields');
  const ok = await sendToWebhook('reservation', Object.fromEntries(new FormData(f)));
  if (!ok) return toast('Could not send your request. Please check your connection and try again');
  showMsg('Reservation Received', 'Your table request has been received. We look forward to welcoming you to Lorini Foods.');
  e.target.reset();
});

/* ---------- Demo authentication (localStorage – not secure) ---------- */
const getUser = () => store.get('lorini_session', null);
function renderAuth() {
  const u = getUser();
  $$('[data-auth]').forEach(el => el.innerHTML = u
    ? `<span class="hi"><i class="fa-regular fa-user"></i> Hi, ${u.name.split(' ')[0]}</span><button class="btn sm ghost" data-logout>Logout</button>`
    : `<button class="btn sm ghost" data-open="m-login">Login</button><button class="btn sm gold" data-open="m-signup">Create Account</button>`);
}
document.addEventListener('click', e => {
  if (e.target.closest('[data-logout]')) { localStorage.removeItem('lorini_session'); renderAuth(); closeLinks(); toast('You have been logged out'); }
});
$('#signup-form').addEventListener('submit', e => {
  e.preventDefault(); const f = e.target; if (!check(f)) return;
  const users = store.get('lorini_users', []), email = f.email.value.trim().toLowerCase();
  if (users.some(u => u.email === email)) { f.email.nextElementSibling.textContent = 'An account with this email already exists'; return; }
  const user = { name: f.name.value.trim(), email, phone: f.phone.value.trim(), password: f.password.value };
  users.push(user); store.set('lorini_users', users);
  sendToWebhook('signup', { name: user.name, email, phone: user.phone }); // fire-and-forget; no password
  store.set('lorini_session', { name: user.name, email }); f.reset(); renderAuth(); closeAll();
  toast(`Welcome to Lorini Foods, ${user.name.split(' ')[0]}!`);
});
$('#login-form').addEventListener('submit', e => {
  e.preventDefault(); const f = e.target; if (!check(f)) return;
  const u = store.get('lorini_users', []).find(u => u.email === f.email.value.trim().toLowerCase() && u.password === f.password.value);
  if (!u) { f.password.nextElementSibling.textContent = 'Incorrect email or password'; return; }
  sendToWebhook('login', { name: u.name, email: u.email }); // fire-and-forget; no password
  store.set('lorini_session', { name: u.name, email: u.email }); f.reset(); renderAuth(); closeAll(); toast(`Welcome back, ${u.name.split(' ')[0]}!`);
});
$('#forgot').onclick = e => { e.preventDefault(); showMsg('Reset Link Sent', 'In a live site, a password reset email would be sent to you. This is a front-end demo.'); };

/* ---------- Gallery & lightbox ---------- */
$('#gallery-grid').innerHTML = GALLERY.map(([id, cap]) => `<button class="reveal" data-cap="${cap}" data-src="${IMG(id)}"><img src="${IMG(id).replace('w=1000', 'w=600')}" alt="${cap}" loading="lazy" onerror="this.remove()"></button>`).join('');
$$('#gallery-grid .reveal').forEach(el => io.observe(el));
$('#gallery-grid').addEventListener('click', e => {
  const b = e.target.closest('[data-src]'); if (!b) return;
  const lb = $('#lightbox'); $('img', lb).src = b.dataset.src; $('img', lb).alt = b.dataset.cap;
  closeAll(); lb.classList.add('on'); document.body.style.overflow = 'hidden';
});

/* ---------- Init ---------- */
renderTabs(); renderMenu(); renderCart(); renderAuth();
