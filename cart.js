// cart.js — maneja catálogo, búsqueda y carrito en sessionStorage
(function(){
  const CART_KEY = 'futbol_cart';
  const SEARCH_KEY = 'futbol_search';

  // Product data per page (id, name, price, image)
  const CATALOG = {
    camisetas: [
      { id: 'c1', name: 'Camiseta Edición Clásica', price: 4999, image: 'imagenes/camiseta1.jpeg' },
      { id: 'c2', name: 'Edición Especial', price: 8999, image: 'imagenes/camiseta1.jpeg' },
      { id: 'c3', name: 'Camiseta Retro', price: 6299, image: 'imagenes/camiseta2.jpg' },
      { id: 'c4', name: 'Camiseta Entrenamiento', price: 3999, image: 'imagenes/camiseta2.jpg' }
    ],
    botines: [
      { id: 'b1', name: 'Botín Clásico de Cuero', price: 7499, image: 'imagenes/botines1.webp' },
      { id: 'b2', name: 'Botín Velocidad', price: 9999, image: 'imagenes/botines2.webp' },
      { id: 'b3', name: 'Botín Sintético', price: 6999, image: 'imagenes/botines3.jpg' },
      { id: 'b4', name: 'Edición Limitada', price: 12999, image: 'imagenes/botines4.webp' }
    ],
    pelotas: [
      { id: 'p1', name: 'Pelota Profesional', price: 4299, image: 'imagenes/bocha1.jpg' },
      { id: 'p2', name: 'Pelota Entrenamiento', price: 1999, image: 'imagenes/bocha2.webp' },
      { id: 'p3', name: 'Pelota Retro', price: 2499, image: 'imagenes/bocha3.webp' },
      { id: 'p4', name: 'Edición Limitada', price: 5999, image: 'imagenes/bocha4.webp' }
    ]
  };

  function formatPrice(v){ return '$' + (v/100).toFixed(2); }

  // Cart storage
  function getCart(){
    try{
      const raw = sessionStorage.getItem(CART_KEY);
      if (!raw) return { items: [] };
      return JSON.parse(raw);
    } catch(e){ return { items: [] }; }
  }
  function saveCart(cart){
    try{ sessionStorage.setItem(CART_KEY, JSON.stringify(cart)); }catch(e){}
    updateCartCount();
    document.dispatchEvent(new CustomEvent('cartUpdated'));
  }

  function addToCart(product){
    const user = localStorage.getItem('authUser');
    if (!user){
      // open auth modal
      const auth = document.getElementById('auth-modal');
      if (auth) auth.setAttribute('aria-hidden','false');
      else alert('Necesitas iniciar sesión para agregar al carrito.');
      return false;
    }
    const cart = getCart();
    const found = cart.items.find(i=>i.id===product.id);
    if (found) found.qty += 1; else cart.items.push({ ...product, qty: 1 });
    saveCart(cart);
    return true;
  }

  function removeFromCart(id){
    const cart = getCart();
    cart.items = cart.items.filter(i=>i.id!==id);
    saveCart(cart);
  }
  function changeQty(id, qty){
    const cart = getCart();
    const it = cart.items.find(i=>i.id===id);
    if (!it) return;
    it.qty = Math.max(0, qty);
    if (it.qty===0) cart.items = cart.items.filter(i=>i.id!==id);
    saveCart(cart);
  }

  function updateCartCount(){
    const cart = getCart();
    const n = cart.items.reduce((s,i)=>s+i.qty,0);
    document.querySelectorAll('.cart-count').forEach(el=> el.textContent = n);
    // update nav button text
    const btns = document.querySelectorAll('#open-cart');
    btns.forEach(b => b.textContent = `Carrito (${n})`);
  }

  // Render products into #product-list
  function renderProducts(category, filter=''){
    const list = document.getElementById('product-list');
    if (!list) return;
    let products = (CATALOG[category]||[]).slice();
    if (filter){
      const f = filter.toLowerCase();
      products = products.filter(p=>p.name.toLowerCase().includes(f));
    }
    list.innerHTML = products.map(p=>`
      <article class="producto-card" data-id="${p.id}">
        <img src="${p.image}" alt="${p.name}">
        <div class="card-body">
          <h4>${p.name}</h4>
          <div class="card-meta">
            <span class="price">${formatPrice(p.price)}</span>
            <button class="boton add-to-cart" data-id="${p.id}">Añadir al Carrito</button>
          </div>
        </div>
      </article>
    `).join('');
    // bind add buttons
    list.querySelectorAll('.add-to-cart').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = btn.dataset.id; const prod = (CATALOG[category]||[]).find(x=>x.id===id);
        if (!prod) return;
        const ok = addToCart(prod);
        if (ok){
          // flash or small feedback
          btn.textContent = 'Añadido ✓';
          setTimeout(()=>btn.textContent = 'Añadir al Carrito',700);
        }
      });
    });
  }

  // Cart modal rendering
  function renderCartModal(){
    const modal = document.getElementById('cart-modal');
    if (!modal) return;
    const body = modal.querySelector('.cart-body');
    const cart = getCart();
    if (!body) return;
    if (!cart.items.length){
      body.innerHTML = '<p>Tu carrito está vacío.</p>';
      modal.querySelector('.cart-total').textContent = '$0.00';
      updateCartCount();
      return;
    }
    body.innerHTML = cart.items.map(i=>`
      <div class="cart-item" data-id="${i.id}">
        <img src="${i.image}" alt="${i.name}">
        <div class="ci-info">
          <div class="ci-name">${i.name}</div>
          <div class="ci-controls">
            <button class="qty-minus">-</button>
            <input class="qty" type="number" min="1" value="${i.qty}">
            <button class="qty-plus">+</button>
            <button class="remove">Eliminar</button>
          </div>
        </div>
        <div class="ci-price">${formatPrice(i.price * i.qty)}</div>
      </div>
    `).join('');
    // bind controls
    body.querySelectorAll('.cart-item').forEach(el=>{
      const id = el.dataset.id;
      const minus = el.querySelector('.qty-minus');
      const plus = el.querySelector('.qty-plus');
      const inp = el.querySelector('.qty');
      const rem = el.querySelector('.remove');
      minus.addEventListener('click', ()=>{ changeQty(id, Number(inp.value)-1); renderCartModal(); });
      plus.addEventListener('click', ()=>{ changeQty(id, Number(inp.value)+1); renderCartModal(); });
      inp.addEventListener('change', ()=>{ let v = Number(inp.value)||1; changeQty(id, v); renderCartModal(); });
      rem.addEventListener('click', ()=>{ removeFromCart(id); renderCartModal(); });
    });
    const total = cart.items.reduce((s,i)=>s + i.price*i.qty, 0);
    modal.querySelector('.cart-total').textContent = formatPrice(total);
    updateCartCount();
  }

  // Open/close cart modal
  function openCart(){ const m = document.getElementById('cart-modal'); if (m) m.setAttribute('aria-hidden','false'); renderCartModal(); }
  function closeCart(){ const m = document.getElementById('cart-modal'); if (m) m.setAttribute('aria-hidden','true'); }

  // search handling
  function initSearch(category){
    const s = document.getElementById('search-input');
    if (!s) return;
    // restore
    try{ const last = sessionStorage.getItem(SEARCH_KEY); if (last) s.value = last; }catch(e){}
    renderProducts(category, s.value);
    s.addEventListener('input', ()=>{
      const v = s.value.trim();
      try{ sessionStorage.setItem(SEARCH_KEY, v); }catch(e){}
      renderProducts(category, v);
    });
  }

  // detect page category
  function pageCategory(){
    const path = location.pathname.toLowerCase();
    if (path.includes('camisetas')) return 'camisetas';
    if (path.includes('botines')) return 'botines';
    if (path.includes('pelotas') || path.includes('bochas')) return 'pelotas';
    return null;
  }

  // setup cart button
  document.addEventListener('DOMContentLoaded', ()=>{
    updateCartCount();
    const cat = pageCategory();
    if (cat){ initSearch(cat); }
    // open cart button
    const open = document.getElementById('open-cart');
    if (open) open.addEventListener('click', (e)=>{ e.preventDefault(); openCart(); });
    // close cart buttons
    document.querySelectorAll('.cart-close').forEach(b=> b.addEventListener('click', ()=> closeCart()));

    // listen for cartUpdated (from other scripts)
    document.addEventListener('cartUpdated', ()=>{ updateCartCount(); renderCartModal(); });

    // clear cart on logout (auth.js may also do this), ensure UI sync
    window.addEventListener('storage', (e)=>{
      if (e.key === 'authUser' && !e.newValue){
        try{ sessionStorage.removeItem(CART_KEY); }catch(err){}
        updateCartCount();
      }
    });
  });

})();
