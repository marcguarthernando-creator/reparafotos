# Guía de Despliegue - REPARAFOTOS

Sigue estos pasos para poner tu aplicación pública y funcional:

## 1. Desplegar el Backend (Servicio FFmpeg)
El backend es el "cerebro" que repara los archivos. Te recomiendo **Render.com** por su facilidad con Docker.

1.  Crea una cuenta en [Render.com](https://render.com).
2.  Crea un nuevo **Web Service**.
3.  Conecta tu repositorio (o sube la carpeta `backend`).
4.  Render detectará el `Dockerfile` automáticamente.
5.  **Variables de Entorno** en Render:
    - `VITE_SUPABASE_URL`: Tu URL de Supabase.
    - `VITE_SUPABASE_ANON_KEY`: Tu Anon Key de Supabase.
    - `SUPABASE_SERVICE_ROLE_KEY`: (Opcional pero recomendado para borrar archivos) Tu Service Role Key de Supabase.
6.  Copia la URL que te dé Render (ej: `https://reparafotos-backend.onrender.com`).

## 2. Desplegar el Frontend (Vercel)
Aquí es donde conseguirás tu link `reparafotos.vercel.app`.

1.  Ve a [Vercel.com](https://vercel.com) y dale a **"Add New Project"**.
2.  Importa tu repositorio de GitHub.
3.  **Environment Variables** en Vercel:
    - `VITE_SUPABASE_URL`: Tu URL de Supabase.
    - `VITE_SUPABASE_ANON_KEY`: Tu Anon Key de Supabase.
    - `VITE_BACKEND_URL`: **La URL que copiaste de Render en el paso anterior.**
4.  Dale a **Deploy**.
5.  Vercel te asignará una URL automática (ej: `reparafotos-five.vercel.app`).
6.  Puedes cambiarla a `reparafotos.vercel.app` en **Settings -> Domains** dentro de Vercel.

---

## 3. Verificación Final
Una vez desplegados ambos:
1.  Entra en la URL de Vercel.
2.  Pon tu Access Key.
3.  Sube un archivo.
4.  Pulsa "Reparar Todo".
5.  Espera a que el proceso termine y descarga tu archivo reparado.

¡Listo! Tu aplicación ya es pública y funcional.
