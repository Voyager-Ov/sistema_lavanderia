# Frontend - Sistema de Lavandería

Este es el cliente Frontend desarrollado en **Next.js (App Router)**, utilizando React, TypeScript, Tailwind CSS, y GSAP para animaciones fluidas y modernas con estética "Glass".

## 🚀 Arquitectura y Estado

### Cliente de API (`src/shared/lib/api-client.ts`)
Todas las peticiones hacia el backend (`http://localhost:5000/api`) se centralizan mediante un cliente API personalizado basado en la API nativa `fetch`.
- **Inyección Automática**: Extrae el token JWT del almacenamiento local e inyecta la cabecera `Authorization: Bearer <token>` en todas las peticiones automáticamente.
- **Manejo de Errores**: Normaliza los errores del backend en una clase `ApiError` estándar para que sean fácilmente atrapados en las pantallas.

### Estado Global: Zustand (`src/shared/store/useAuthStore.ts`)
El estado de la autenticación se maneja globalmente con **Zustand** utilizando el middleware `persist`.
- Guarda los datos del `user` y el `token` directamente en el `localStorage` del navegador, permitiendo persistir la sesión.

### Validaciones e Interacciones: React Hook Form + Zod
Todas las pantallas que reciben datos (Auth, Perfil, etc) utilizan **React Hook Form** con el resolver de **Zod** para validaciones.
- Se configuran en modo `mode: "onChange"` para proveer retroalimentación **en tiempo real** al usuario mientras escribe.
- Garantiza que las contraseñas, correos y requerimientos estrictos del backend (como longitud alfanumérica) se cumplan antes de disparar la petición HTTP, ahorrando tráfico de red.

## 🔐 Flujo de Autenticación (Auth Flow)

1. **Registro (`/register`)**: 
   - El usuario crea su cuenta ingresando su nombre, email, contraseña y nombre del negocio.
   - Es automáticamente redirigido a `/verify-email`.
2. **Verificación (`/verify-email`)**: 
   - El usuario debe introducir el token de 6 dígitos que se le envió al correo.
   - Cuenta con una opción para solicitar el reenvío del código invocando el endpoint de `resend-verification`.
3. **Inicio de Sesión (`/login`)**:
   - Acceso tradicional (email/password) o mediante botón oficial de **Google** (vía `@react-oauth/google`).
   - Si se intenta iniciar sesión con una cuenta no verificada, el flujo redirige de manera inteligente a `/verify-email`.
4. **Recuperación de Contraseña**:
   - `/forgot-password`: Solicita token de recuperación al correo.
   - `/reset-password`: Formulario que exige comprobación de contraseña nueva y recibe el token por parámetro de URL.

## 📦 Iniciar el Servidor de Desarrollo

1. Asegúrate de tener tu `.env` con las variables correspondientes (ej. `NEXT_PUBLIC_GOOGLE_CLIENT_ID`).
2. Instala las dependencias si no lo has hecho:
   ```bash
   npm install
   ```
3. Levanta el proyecto:
   ```bash
   npm run dev
   ```
Visita [http://localhost:3000](http://localhost:3000) en el navegador.
