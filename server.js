// Simple Express server to handle register/login and serve static files
const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'users.txt');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// ensure data folder and file exist
fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '');

function validatePassword(pw){
  // at least one uppercase, one lowercase, one digit, only alphanumeric, min length 6
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/.test(pw);
}

function readUsers(){
  const raw = fs.readFileSync(DATA_FILE, 'utf8').trim();
  if (!raw) return {};
  // store as JSON lines: username:hash
  const lines = raw.split('\n');
  const users = {};
  lines.forEach(l=>{
    const idx = l.indexOf(':');
    if (idx>0){
      const u = l.substring(0, idx);
      const h = l.substring(idx+1);
      users[u]=h;
    }
  });
  return users;
}

app.post('/api/register', async (req,res)=>{
  const { username, password } = req.body||{};
  if (!username || !password) return res.status(400).json({ message: 'Usuario y contraseña requeridos.' });
  if (!/^[A-Za-z0-9]+$/.test(username)) return res.status(400).json({ message: 'Usuario solo permite letras y números.' });
  if (!validatePassword(password)) return res.status(400).json({ message: 'Contraseña no cumple los requisitos.' });
  const users = readUsers();
  if (users[username]) return res.status(409).json({ message: 'Usuario ya existe.' });
  const hash = await bcrypt.hash(password, 10);
  fs.appendFileSync(DATA_FILE, `${username}:${hash}\n`);
  return res.json({ message: 'Registrado correctamente.' });
});

app.post('/api/login', async (req,res)=>{
  const { username, password } = req.body||{};
  if (!username || !password) return res.status(400).json({ message: 'Usuario y contraseña requeridos.' });
  const users = readUsers();
  const hash = users[username];
  if (!hash) return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
  const ok = await bcrypt.compare(password, hash);
  if (!ok) return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
  return res.json({ message: 'Ingreso exitoso.' });
});

app.listen(PORT, ()=>{
  console.log(`Server listening on http://localhost:${PORT}`);
});
