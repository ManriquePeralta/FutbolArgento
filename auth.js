// auth.js — handles modal behavior, validation and communicates with backend
document.addEventListener('DOMContentLoaded', ()=>{
  const openBtns = document.querySelectorAll('.btn-login, #open-auth');
  const modal = document.getElementById('auth-modal');
  const closeBtn = document.getElementById('auth-close');
  const tabs = document.querySelectorAll('.auth-tabs .tab');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const loginMsg = document.getElementById('login-msg');
  const registerMsg = document.getElementById('register-msg');

  if (!modal) return; // nothing to do

  function showModal(){ modal.setAttribute('aria-hidden', 'false'); }
  function closeModal(){ modal.setAttribute('aria-hidden', 'true'); }

  // handlers for open buttons will be establecidos por updateAuthButtons
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e)=>{ if (e.target===modal) closeModal(); });

  tabs.forEach(t => t.addEventListener('click', ()=>{
    tabs.forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    const tab = t.dataset.tab;
    document.querySelectorAll('[data-tab-content]').forEach(c=>{
      c.hidden = c.dataset.tabContent !== tab;
    });
  }));

  // password rules: at least one uppercase, one lowercase, one digit, only alphanumeric, min length 6
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/;

  if (registerForm){
    registerForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      registerMsg.textContent = '';
      const form = new FormData(registerForm);
      const username = (form.get('username')||'').trim();
      const password = form.get('password')||'';
      if (!passwordRegex.test(password)){
        registerMsg.style.color = '#a33';
        registerMsg.textContent = 'Contraseña inválida. Debe tener mínimo 6 caracteres, incluir MAYÚSCULAS, minúsculas y al menos un número. No uses símbolos.';
        return;
      }
      try{
        const res = await fetch('/api/register', {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({username, password})
        });
        const data = await res.json();
        if (res.ok) {
          registerMsg.style.color = 'green';
          registerMsg.textContent = data.message || 'Cuenta creada correctamente.';
          // auto-login (client-side) after successful registration
          try { localStorage.setItem('authUser', username); setLoggedIn(username); } catch(e){}
          setTimeout(()=>{ registerMsg.textContent=''; closeModal(); }, 1200);
        } else {
          registerMsg.style.color = '#a33';
          registerMsg.textContent = data.message || 'Error al registrar';
        }
      } catch(err){
        registerMsg.style.color = '#a33';
        registerMsg.textContent = 'Error de comunicación con el servidor.';
      }
    });
  }

  if (loginForm){
    loginForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      loginMsg.textContent = '';
      const form = new FormData(loginForm);
      const username = (form.get('username')||'').trim();
      const password = form.get('password')||'';
      try{
        const res = await fetch('/api/login', {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({username, password})
        });
        const data = await res.json();
        if (res.ok) {
          loginMsg.style.color = 'green';
          loginMsg.textContent = data.message || 'Ingreso OK';
          try { localStorage.setItem('authUser', username); setLoggedIn(username); } catch(e){}
          setTimeout(()=>{ loginMsg.textContent=''; closeModal(); }, 900);
        } else {
          loginMsg.style.color = '#a33';
          loginMsg.textContent = data.message || 'Usuario o contraseña incorrectos.';
        }
      } catch(err){
        loginMsg.style.color = '#a33';
        loginMsg.textContent = 'Error de comunicación con el servidor.';
      }
    });
  }
  
  // --- Auth UI helpers: set logged in/out state on nav button(s)
  function closeAuthMenu(){
    const existing = document.querySelector('.auth-menu');
    if (existing) existing.remove();
    document.removeEventListener('click', docClickListener);
  }

  function docClickListener(e){
    if (!e.target.closest('.auth-menu') && !e.target.closest('.btn-login') && !e.target.closest('#open-auth')){
      closeAuthMenu();
    }
  }

  function showAuthMenu(btn, username){
    closeAuthMenu();
    const rect = btn.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.className = 'auth-menu';
    menu.innerHTML = `
      <div class="username" style="padding:.4rem .9rem">${username}</div>
      <button data-action="profile">Mi cuenta</button>
      <button data-action="logout">Cerrar sesión</button>
    `;
    document.body.appendChild(menu);
    // position
    const top = rect.bottom + window.scrollY + 8;
    const left = rect.right + window.scrollX - menu.offsetWidth;
    menu.style.top = `${top}px`;
    // try align right of button
    menu.style.left = `${Math.max(8, rect.right + window.scrollX - 180)}px`;

    // handlers
    menu.querySelector('[data-action="logout"]').addEventListener('click', async ()=>{
      // call server logout if available
      try{
        await fetch('/api/logout', { method: 'POST' });
      } catch(e){}
      _doLogout();
    });
    menu.querySelector('[data-action="profile"]').addEventListener('click', ()=>{
      alert(`Cuenta: ${username}`);
      closeAuthMenu();
    });

    // close when clicking outside
    setTimeout(()=>{ document.addEventListener('click', docClickListener); }, 10);
  }

  function updateAuthButtons(username){
    const btns = document.querySelectorAll('.btn-login, #open-auth');
    btns.forEach(b => {
      if (username){
        b.textContent = `Hola, ${username}`;
        b.dataset.logged = 'true';
        b.onclick = (ev)=>{ ev.preventDefault(); showAuthMenu(b, username); };
      } else {
        b.textContent = 'Iniciar sesión';
        b.removeAttribute('data-logged');
        b.onclick = (ev)=>{ ev.preventDefault(); showModal(); };
      }
    });
  }

  function setLoggedIn(username){
    try{ localStorage.setItem('authUser', username); } catch(e){}
    updateAuthButtons(username);
  }

  function _doLogout(){
    try{ localStorage.removeItem('authUser'); } catch(e){}
    try{ sessionStorage.removeItem('futbol_cart'); } catch(e){}
    // notify other scripts
    try{ document.dispatchEvent(new CustomEvent('cartUpdated')); } catch(e){}
    updateAuthButtons(null);
    closeAuthMenu();
    // give feedback
    const toast = document.createElement('div');
    toast.textContent = 'Has cerrado sesión.';
    toast.style.position = 'fixed'; toast.style.bottom = '18px'; toast.style.right = '18px'; toast.style.background='#222'; toast.style.color='white'; toast.style.padding='8px 12px'; toast.style.borderRadius='8px'; toast.style.zIndex=4000;
    document.body.appendChild(toast);
    setTimeout(()=>toast.remove(), 1600);
  }

  function logout(){
    // wrapper for external calls
    _doLogout();
  }

  // initialize auth state from localStorage (set handlers para logged in/out)
  try{
    const existing = localStorage.getItem('authUser');
    updateAuthButtons(existing);
  } catch(e){}
});
