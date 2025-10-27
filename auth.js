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

  if (openBtns && openBtns.length){
    openBtns.forEach(b => b.addEventListener('click', (e)=>{ e.preventDefault(); showModal(); }));
  }
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
});
