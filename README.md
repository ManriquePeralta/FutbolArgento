Instrucciones rápidas para ejecutar el servidor localmente

1) Abrir PowerShell y situarse en la carpeta del proyecto:

   cd "C:\Users\lukim\OneDrive\Desktop\TPFInalTesting"

2) Instalar dependencias (solo la primera vez):

   npm install

3) Iniciar servidor local:

   npm start

4) Abrir en el navegador:

   http://localhost:3000/index.html

Notas:
- El registro guarda usuarios en `data/users.txt` con formato `usuario:hash` por línea.
- La contraseña exige: mínimo 6 caracteres, al menos 1 mayúscula, 1 minúscula y 1 número. No se permiten símbolos.
- Este servidor es para desarrollo/demostración. No exponerlo en producción sin mejoras de seguridad.
