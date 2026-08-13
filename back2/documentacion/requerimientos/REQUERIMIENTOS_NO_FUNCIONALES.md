# Requerimientos No Funcionales (RNF)

Este documento detalla las restricciones de diseño, estándares de calidad, atributos de seguridad, rendimiento e integración (Requerimientos No Funcionales) aplicados al desarrollo del backend (`back2`) de la lavandería SaaS.

---

## 1. Atributos de Seguridad (Security)

*   **RNF-01: Aislamiento Estricto de Datos (Multi-Tenant):**
    *   Toda consulta a la base de datos operativa de un inquilino debe ejecutarse de forma aislada dentro de su esquema físico correspondiente (`tenant_{id}`).
    *   Queda estrictamente prohibida la fuga de información entre negocios. La base de datos central (`public`) solo contendrá la facturación general, inquilinos y credenciales básicas de acceso.
*   **RNF-02: Protección y Encriptación de Credenciales:**
    *   Las contraseñas de los usuarios deben encriptarse de forma irreversible antes de guardarse en la base de datos utilizando el algoritmo **bcryptjs** con un costo de encriptación (salting) mínimo de 10 rondas.
*   **RNF-03: Comunicaciones Seguras (Cifrado en Tránsito):**
    *   Toda transferencia de información en entornos de homologación y producción debe realizarse exclusivamente a través de protocolos seguros con cifrado de capa de transporte (**TLS/HTTPS**).
*   **RNF-04: Sesiones sin Estado y Firmadas (JWT):**
    *   La autorización de la API se implementará mediante Tokens Web JSON (**JWT**) firmados criptográficamente con un secreto del sistema (`JWT_SECRET`).
    *   Los tokens de sesión tendrán una expiración de 8 horas.
*   **RNF-05: Prevención de Fuerza Bruta y DDoS:**
    *   La API debe implementar mecanismos de control de tasa de solicitudes (Rate Limiting).
    *   Los endpoints generales limitarán solicitudes por IP a un máximo de 1000 peticiones cada 15 minutos, mientras que los endpoints de autenticación (`/api/auth/*`) aplicarán un límite estricto de 25 peticiones cada 15 minutos.

---

## 2. Rendimiento y Usabilidad (Performance & Usability)

*   **RNF-06: Tiempos de Respuesta de la API:**
    *   Los endpoints locales del backend (que no requieran llamadas de red a APIs de terceros) deben responder en un promedio menor a **200 milisegundos** bajo condiciones normales de carga.
    *   Las consultas a la base de datos relacional deben estar optimizadas con índices adecuados para ejecutarse en menos de **100 milisegundos**.
*   **RNF-07: Concurrencia de WebSockets:**
    *   El servidor de WebSockets (Socket.io) debe ser capaz de soportar hasta **50 conexiones simultáneas activas** por lavandería de forma fluida, distribuyendo eventos de trazabilidad en tiempo real sin encolamiento visible.

---

## 3. Confiabilidad y Robustez (Reliability)

*   **RNF-08: Tolerancia a Fallos de Base de Datos:**
    *   El módulo de conexión (`connectionManager.js`) debe contar con lógica de reintento automático de conexión ante micro-cortes de red de la base de datos PostgreSQL en la nube (Neon).
*   **RNF-09: Arranque a Prueba de Errores (Fail-Fast):**
    *   El sistema no debe iniciar si faltan variables de entorno críticas (como `JWT_SECRET` o credenciales de base de datos), deteniendo el proceso inmediatamente y reportando el fallo en los logs.
*   **RNF-10: Apagado Controlado (Graceful Shutdown):**
    *   Ante una orden de detención (SIGTERM o SIGINT), el servidor HTTP debe dejar de aceptar nuevas conexiones, esperar a que finalicen las peticiones activas (máximo 10 segundos) y cerrar de manera ordenada las conexiones activas a la base de datos antes de apagarse.

---

## 4. Estándares y Compatibilidad (Compatibility & Constraints)

*   **RNF-11: Estilo de API RESTful:**
    *   La API debe apegarse a los estándares REST, utilizando los verbos HTTP correctos (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) y códigos de estado semánticos (200, 201, 400, 401, 403, 404, 409, 500) para indicar el resultado de las operaciones.
*   **RNF-12: Integración con los Web Services de AFIP:**
    *   El sistema debe ser compatible con los estándares criptográficos requeridos por la AFIP en Argentina (firma digital PKCS#7 y generación de tokens de acceso mediante el WSASS utilizando certificados digitales X.509).
*   **RNF-13: Formato Estándar de Intercambio de Datos:**
    *   El backend intercambiará información exclusivamente en formato **JSON** (JavaScript Object Notation), tanto para las peticiones (`application/json` en Content-Type) como para las respuestas.
