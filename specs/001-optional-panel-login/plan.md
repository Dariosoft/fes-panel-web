# Plan 001 — Entrada opcional al panel

## Resumen técnico

Implementar en `panel-web` (Angular 21, SPA standalone) la identidad **opcional** del panel: usar el panel sin cuenta; entrar con Google vía **solo** `panel-api`; mostrar nombre y correo; salir; y restaurar o invalidar el estado al abrir, recargar o recibir una respuesta de sesión no reconocida. Este front **no** habla con el servicio de cuentas ni persiste la cuenta.

**Nota de gobernanza:** no existe `docs/constitution.md`. Se aplica `AGENTS.md` del proyecto. La nota de que Keycloak/identidad están diferidos **queda anulada por esta spec**: la autenticación de este corte está autorizada y se implementa según `specs/001-optional-panel-login/spec.md`.

## Historias cubiertas

- H1 → uso anónimo del panel (RF-1, RF-8).
- H2 → entrar con la misma cuenta de la tienda vía panel-api (RF-2, RF-3, RF-4, RF-9, RF-10).
- H3 → ver quién soy (RF-5, RF-9).
- H4 → salir y seguir usando el panel (RF-6, RF-7, RF-8).

## Estado actual del proyecto (punto de partida)

- App mínima en `src/main.ts` (componente raíz inline, sin HttpClient, sin rutas, sin capa de servicios).
- Convenciones: código en inglés, UI en español; separar presentación / HTTP / estado; host de API fuera de componentes; sin credenciales en el bundle.
- Frontera HTTP: únicamente `panel-api`.

## Arquitectura propuesta

### Capas

| Capa | Responsabilidad | No hace |
|------|-----------------|---------|
| Presentación (componentes / shell) | Botón Entrar / Salir, identidad visible, avisos; no bloquea el resto del panel | No llama URLs ni interpreta contratos HTTP crudos |
| Estado de sesión (servicio) | Fuente de verdad en memoria: anónimo \| identificado + perfil (nombre, correo); acciones entrar/salir/refrescar | No guarda la cuenta en `localStorage`/IndexedDB/cookies propias del front (RF-11) |
| Acceso HTTP (cliente hacia panel-api) | Entrar, salir, consultar sesión/quién soy; `withCredentials` si la sesión compartida es cookie | No llama al servicio de cuentas (RF-10) |
| Configuración | Base URL de `panel-api` vía environment / runtime config | No embebe secretos ni client secrets de Google |

### Principios

- La sesión compartida vive en el backend (`panel-api`); el front solo refleja el resultado de las consultas y mutaciones.
- Entrar inicia el flujo Google **sin formularios** de usuario/contraseña en este front; la redirección o el handshake concreto lo define el contrato de `panel-api` (RF-3).
- Fallos de entrar/salir no cambian el estado de identidad salvo lo indicado por RF-12 / RF-13 / RF-15.
- Quien no está identificado sigue navegando y usando el shell del panel (RF-1, RF-8; RNF de no bloqueo).

## Desglose técnico por capacidad

### 1. Uso del panel sin identificación

**Cubre:** RF-1, RF-8

- El arranque de la SPA y las vistas existentes del panel no exigen sesión.
- No hay route guard ni interceptor que redirija a “login obligatorio”.
- Tras salir con éxito, o si nunca entró, el usuario permanece en el panel usable.

### 2. Opción de entrar cuando no hay sesión

**Cubre:** RF-2

- En el shell (p. ej. barra lateral / cabecera del Admin UI), mientras el estado sea “sin identificar”, mostrar control “Entrar” (texto en español).
- El control no debe ocultar ni deshabilitar el resto del panel.

### 3. Inicio de acceso con Google solo vía panel-api

**Cubre:** RF-3, RF-9, RF-10

- Al pulsar Entrar, el servicio de sesión delega en el cliente HTTP de `panel-api` para iniciar el acceso Google (redirect, URL de autorización, o endpoint de start según contrato de panel-api).
- No hay inputs de email/contraseña en este front.
- Ningún módulo importa ni llama hosts del servicio de cuentas.

### 4. Confirmación de entrada → estado identificado

**Cubre:** RF-4, RF-12

- Tras el retorno del flujo (callback de la SPA o respuesta del API), consultar o interpretar la confirmación de `panel-api`.
- Si confirma: marcar estado identificado y cargar perfil (nombre + correo) — encaja con RF-5.
- Si no confirma (rechazo, error, cancelación): permanecer sin identificar y mostrar aviso en español de que no pudo entrar (RF-12).

### 5. Mostrar quién es el usuario identificado

**Cubre:** RF-5, RF-9

- Mientras identificado: mostrar nombre y correo de Google devueltos por `panel-api`.
- Datos solo en estado de aplicación en memoria (más lo que el navegador ya gestione por la cookie de sesión del API); no “guardar la cuenta” como entidad local (RF-11).

### 6. Opción de salir y cierre de sesión compartida

**Cubre:** RF-6, RF-7, RF-8, RF-13

- Mientras identificado: control “Salir”.
- Al solicitar salir: llamar solo a `panel-api` para cerrar la sesión compartida.
- Si panel-api confirma: pasar a sin identificar y permitir seguir usando el panel (RF-7, RF-8).
- Si no confirma: mantener identificado y avisar que no pudo salir (RF-13).

### 7. Frontera exclusiva con panel-api y sin persistencia de cuenta

**Cubre:** RF-9, RF-10, RF-11

- Un único cliente HTTP de identidad apuntando a la base URL de `panel-api`.
- Checklist de implementación: cero referencias al servicio de cuentas en código, environments y tests de este corte.
- No persistir perfil ni “cuenta” en almacenamiento del front; al recargar, la verdad sale de consultar sesión en panel-api (RF-14).

### 8. Hidratación al abrir o recargar

**Cubre:** RF-14

- En el bootstrap / inicialización del servicio de sesión: `GET` (o equivalente) de sesión/quién soy solo a `panel-api`.
- Si hay sesión activa: UI identificada con nombre y correo.
- Si no hay sesión o se cerró en panel o tienda: UI sin identificar, panel usable.

### 9. Sesión inválida en recarga o en solicitud posterior

**Cubre:** RF-15

- Si al consultar sesión o al enviar otra solicitud panel-api indica que ya no reconoce al usuario (p. ej. 401/403 o cuerpo “anónimo” según contrato):
  - pasar a sin identificar;
  - mostrar aviso en español;
  - no bloquear el uso del panel.
- Encaja con un interceptor HTTP ligero o manejo centralizado en el cliente, sin convertir el panel en “login wall”.

## Contrato esperado con panel-api (dependencia externa)

Este plan no implementa panel-api; asume endpoints/comportamientos alineados con la spec de panel (`entrar` / `salir` / `quién soy` / sesión compartida con la tienda). Mientras el contrato concreto no esté versionado en este repo, la capa HTTP se aísla detrás de interfaces tipadas para poder ajustar paths y payloads sin ensuciar la UI.

Operaciones lógicas:

1. **Iniciar entrada Google** → panel-api.
2. **Confirmar / obtener sesión actual** (quién soy: nombre, correo) → panel-api.
3. **Cerrar sesión compartida** → panel-api.

Todas con credenciales de cookie/sesión del API si aplica (`withCredentials`), nunca con tokens de cuenta fabricados en el front.

## Cambios de UI (Admin Panel)

- Textos en español (RNF).
- Controles de identidad en el shell existente (elegante / práctico, coherente con Admin UI): Entrar | (nombre + correo + Salir).
- Avisos no bloqueantes para: no pudo entrar; no pudo salir; sesión ya no válida.
- Responsive desde 320 px; controles accionables por teclado.
- **Fuera de este corte:** botón Publicar / publicar catálogo.

## Configuración y bootstrap Angular

- `provideHttpClient` (y con interceptors si se usa RF-15 de forma transversal).
- Environment / config con host de `panel-api` fuera de componentes.
- Separar archivos: p. ej. `session` (estado), `panel-api` auth client, componente de barra de identidad / integración en shell.
- Nombres de código en inglés; strings de UI en español.

## Pruebas y verificación

Alineado con criterios de finalización de la spec y con `AGENTS.md` (`npm test` = lint + build):

| Verificación | RF |
|--------------|-----|
| Panel usable sin sesión (manual / smoke) | RF-1, RF-8 |
| Visible “Entrar” si anónimo | RF-2 |
| Entrar dispara solo llamadas a panel-api / flujo Google sin form local | RF-3, RF-9, RF-10 |
| Tras confirmación → identificado | RF-4 |
| Nombre + correo visibles | RF-5 |
| “Salir” visible si identificado | RF-6 |
| Salir llama panel-api y deja anónimo | RF-7, RF-8, RF-9 |
| Sin llamadas a cuentas; sin persistir cuenta | RF-10, RF-11 |
| Fallo de entrada → anónimo + aviso | RF-12 |
| Fallo de salida → sigue identificado + aviso | RF-13 |
| Reload consulta sesión en panel-api | RF-14 |
| Sesión no reconocida → anónimo + aviso + panel usable | RF-15 |
| Demo manual del flujo completo + comprobar red (no account-api) | todos |

Donde sea práctico: tests unitarios del servicio de sesión (transiciones y errores) con HttpClient mockeado; el resto por demostración manual documentada.

## Fuera de alcance (no planificar implementación aquí)

- Puerta de acceso / contrato backend (panel-api).
- Crear/guardar/administrar cuenta (servicio de cuentas).
- Front de la tienda.
- Disponibilidad del servicio de cuentas en el entorno (infra).
- Publicar catálogo / botón Publicar.
- Cualquier llamada al servicio de cuentas desde este front.

## Orden de implementación sugerido

1. Config HTTP + cliente panel-api (sesión / auth) — base para RF-9, RF-10.
2. Servicio de estado de sesión + hidratación al arranque — RF-14, RF-1.
3. UI Entrar / identidad / Salir en el shell — RF-2, RF-5, RF-6.
4. Flujos entrar y salir + errores — RF-3, RF-4, RF-7, RF-8, RF-12, RF-13.
5. Invalidación de sesión en respuestas — RF-15.
6. Barrido de que no hay persistencia de cuenta ni llamadas a cuentas — RF-11, RF-10.
7. Verificación lint/build y demo manual.

## Matriz de cobertura de RF

| RF | Sección del plan |
|----|------------------|
| RF-1 | §1 Uso sin identificación; orden paso 2 |
| RF-2 | §2 Opción de entrar |
| RF-3 | §3 Inicio Google vía panel-api |
| RF-4 | §4 Confirmación de entrada |
| RF-5 | §5 Mostrar quién es |
| RF-6 | §6 Opción de salir |
| RF-7 | §6 Cierre confirmado |
| RF-8 | §1 y §6 Seguir usando el panel |
| RF-9 | §3, §5, §7 Frontera panel-api |
| RF-10 | §3, §7 Sin servicio de cuentas |
| RF-11 | §7 Sin guardar la cuenta |
| RF-12 | §4 Entrada no confirmada |
| RF-13 | §6 Salida no confirmada |
| RF-14 | §8 Hidratación al abrir/recargar |
| RF-15 | §9 Sesión ya no reconocida |

**Cobertura:** RF-1 … RF-15 (todos).
