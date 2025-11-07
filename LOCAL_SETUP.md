# Configuración Local de PowerLytics

## Requisitos Previos
- Node.js 18+ instalado
- npm o yarn instalado
- Cuenta de Supabase
- Cuenta de Mercado Pago

## Pasos de Instalación

### 1. Instalar Dependencias
\`\`\`bash
npm install
\`\`\`

### 2. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=tu_mercadopago_access_token

# Site URL (para desarrollo local)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
\`\`\`

### 3. Obtener las Credenciales

#### Supabase:
1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a Settings → API
3. Copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

#### Mercado Pago:
1. Ve a [Mercado Pago Developers](https://www.mercadopago.cl/developers)
2. Ve a "Tus integraciones" → Tu aplicación "powerlytics"
3. Copia el **Access Token de prueba** → `MERCADOPAGO_ACCESS_TOKEN`

### 4. Ejecutar la Aplicación

\`\`\`bash
npm run dev
\`\`\`

La aplicación estará disponible en `http://localhost:3000`

## Verificar que Todo Funciona

1. **Autenticación**: Intenta registrarte/iniciar sesión
2. **Dashboard**: Verifica que cargue el dashboard de coach o atleta
3. **Suscripciones**: Intenta seleccionar un plan (debería redirigir a Mercado Pago)

## Problemas Comunes

### No redirige a Mercado Pago
- Verifica que `MERCADOPAGO_ACCESS_TOKEN` esté correctamente configurado
- Revisa la consola del navegador para ver errores
- Verifica que el token sea de **prueba** (empieza con `TEST-`)

### Error de Supabase
- Verifica que todas las variables de Supabase estén correctas
- Asegúrate de que las tablas estén creadas (ejecuta los scripts SQL)

### Puerto 3000 ocupado
\`\`\`bash
# Usa otro puerto
PORT=3001 npm run dev
