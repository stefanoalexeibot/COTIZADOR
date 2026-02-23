# TornillaQuote 🔩

Cotizador inteligente de tornillería con IA.

---

## 🚀 Cómo subir a Vercel (paso a paso)

### Paso 1 — Crear cuenta en GitHub (si no tienes)
1. Ve a https://github.com
2. Clic en **Sign up** y crea tu cuenta gratis

### Paso 2 — Subir el proyecto a GitHub
1. Ve a https://github.com/new
2. En **Repository name** escribe: `tornillaquote`
3. Deja en **Private** (para que nadie más vea tu código)
4. Clic en **Create repository**
5. En la página que aparece, haz clic en **uploading an existing file**
6. Arrastra TODOS los archivos de esta carpeta (excepto `node_modules` si existe)
7. Clic en **Commit changes**

### Paso 3 — Crear cuenta en Vercel
1. Ve a https://vercel.com
2. Clic en **Sign Up** → elige **Continue with GitHub**
3. Autoriza Vercel

### Paso 4 — Subir el proyecto a Vercel
1. En Vercel, clic en **Add New Project**
2. Busca y selecciona tu repositorio `tornillaquote`
3. Vercel detecta automáticamente que es Vite/React
4. **IMPORTANTE** — Antes de hacer Deploy, ve a **Environment Variables** y agrega:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** tu API key de Anthropic (la consigues en https://console.anthropic.com)
5. Clic en **Deploy**
6. En 2-3 minutos tendrás tu URL: `tornillaquote.vercel.app`

---

## 🔑 Obtener tu API Key de Anthropic
1. Ve a https://console.anthropic.com
2. Crea una cuenta o inicia sesión
3. Ve a **API Keys** → **Create Key**
4. Copia la key (empieza con `sk-ant-...`)
5. Úsala en el paso 4 de arriba

---

## 💻 Correr localmente (opcional)
```bash
npm install
npm run dev
```
Luego abre http://localhost:5173

Necesitas crear un archivo `.env` con:
```
ANTHROPIC_API_KEY=sk-ant-tu-key-aqui
```

---

## 📱 Usar la app
La URL de Vercel funciona en cualquier computadora, celular o tablet con navegador.
No necesita instalación.
