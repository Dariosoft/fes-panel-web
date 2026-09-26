# Plan 001 — Panel con entrada Google opcional

## Resumen técnico

Implementar en `panel-web` (Angular 21, SPA standalone) la identidad **opcional** del Admin UI: el panel es usable completo sin autenticación; «Entrar con Google» navega a `GET {API}/panel/login/google`; al cargar se consulta `GET {API}/panel/session` con credenciales; con sesión se muestran nombre, correo y «Salir»; «Salir» llama `POST {API}/panel/logout` con credenciales. El front habla **solo** con el anfitrión de API configurado (panel-api vía ese host), **no** incluye el client id de Google ni llama a account-api, APIs Java de dominio ni Google.

**Gobernanza:** aplica `AGENTS.md`, `/angular-developer`, `/angular-architecture` y, en lo visual, `/ui-ux-pro-max` conservando el lenguaje Admin UI ya presente en `src/styles.css`. La nota de Keycloak diferido queda anulada **solo** para el flujo de esta spec.

## Historias cubiertas

- H1 → uso completo sin login (RF-1, RF-2).
- H2 → entrar con Google vía panel-api y ver identidad (RF-3, RF-5, RF-6, RF-9–RF-14).
- H3 → salir y cerrar la sesión compartida también para la tienda (RF-4, RF-7, RF-8, RF-16).

## Estado actual del proyecto (punto de partida)

- App mínima en `src/main.ts` (shell Admin UI inline: aside + sección; sin HttpClient, sin `src/app/`, sin environments creados aunque `angular.json` ya declara `fileReplacements`).
- Estilos globales en `src/styles.css` (panel oscuro, tipografía Georgia / system-ui, usable desde 320 px).
- Convenciones: código en inglés; textos de UI en español; presentación ≠ HTTP ≠ estado; host de API fuera de componentes; sin credenciales en el bundle.
- Frontera HTTP de este corte: únicamente rutas `/panel/*` del anfitrión de API del entorno.
- Referencia histórica en la rama `001/feat-optional-panel-login` (paths `/panel/identity/*` y arranque XHR del login): **no reutilizar esos contratos**; esta spec fija paths y navegación distintos.

## Arquitectura propuesta

### Estructura de carpetas (`/angular-architecture`)

```
src/
  main.ts                         # bootstrapApplication + providers
  environments/
    environment.ts                # apiBaseUrl del entorno (build-time)
    environment.development.ts
  app/
    app.config.ts                 # provideHttpClient, inicializadores
    app.ts                        # raíz fina o reexport del shell
    core/
      session/
        panel-session.ts          # cliente HTTP tipado → solo {API}/panel/*
        session.ts                # estado (signals) + acciones entrar/salir/hidratar
        session-profile.ts        # tipos de respuesta (sin sufijo .model)
    features/
      shell/
        shell.ts                  # layout Admin UI (aside + contenido)
        components/
          session-bar.ts          # «Entrar con Google» / perfil / «Salir» / avisos
```

- Scope Rule: `session-bar` solo lo usa el shell → `features/shell/components/`.
- Sesión es singleton de app → `core/session/` (`providedIn: 'root'`).
- Nombres sin sufijos `.component` / `.service`; `inject()`; miembros de plantilla `protected` cuando aplique; signals para estado.

### Capas

| Capa | Responsabilidad | No hace |
|------|-----------------|---------|
| Presentación (`shell`, `session-bar`) | Admin UI; botones; nombre/correo; avisos no bloqueantes | No construye URLs de API ni interpreta HTTP crudo |
| Estado (`session`) | Fuente de verdad en memoria: anónimo \| autenticado + perfil; avisos; hidratar / entrar / salir | No persiste cuenta en `localStorage` / IndexedDB; no guarda client id de Google |
| HTTP (`panel-session`) | `GET …/panel/session`, `POST …/panel/logout` con `withCredentials` / `credentials: 'include'` | No llama account-api, APIs Java ni Google |
| Configuración (`environment`) | `{API}` = `apiBaseUrl` por entorno | No embebe secretos ni `GOOGLE_CLIENT_ID` |

### Principios

- Login Google = **navegación completa del navegador** a `{apiBaseUrl}/panel/login/google` (RF-5), no XHR que espere una `authorizationUrl`.
- La cookie `fes_session` la gestiona el backend; el front solo envía credenciales en session/logout.
- Fallos de sesión o logout no convierten el panel en muro de login (RF-2, RF-15, RF-16).
- Textos de interfaz en español; contraste y foco visibles; controles ≥ 44 px; `role="alert"` / región viva para avisos (`/ui-ux-pro-max`).

## Desglose técnico por capacidad

### 1. Presentación Admin UI y uso sin autenticación

**Cubre:** RF-1, RF-2

- Extraer el layout actual (aside «Friendly / Panel» + sección operativa) a `features/shell/shell.ts` manteniendo el lenguaje visual existente.
- Ningún route guard ni interceptor que exija sesión o redirija a login.
- El contenido del panel permanece usable con o sin sesión; la barra de sesión es opcional y no bloquea.

### 2. Controles de sesión en el shell (mutuamente excluyentes)

**Cubre:** RF-3, RF-4, RF-12

- Sin sesión: botón «Entrar con Google»; **no** mostrar «Salir»; **no** mostrar nombre/correo.
- Con sesión: «Salir» + nombre + correo; **no** mostrar «Entrar con Google».
- Ubicar controles en el aside del Admin UI (coherente con el shell actual), operable por teclado y responsive desde 320 px.

### 3. Configuración del anfitrión de API

**Cubre:** RF-9, RF-10

- Crear `src/environments/environment.ts` y `environment.development.ts` con `apiBaseUrl` (sin barra final), p. ej. Minikube `http://api.friendly-e-shop.test` alineado con infra; otros dominios vía file replacement / build.
- `angular.json` ya apunta esos replacements en `development`.
- Checklist: cero literales de client id / secret de Google en código, environments, templates o tests (RF-10).

### 4. Cliente HTTP solo hacia panel (vía anfitrión configurado)

**Cubre:** RF-6, RF-7, RF-9, RF-11

- `panel-session.ts` con `HttpClient`:
  - `getSession()` → `GET {apiBaseUrl}/panel/session` con credenciales.
  - `logout()` → `POST {apiBaseUrl}/panel/logout` con cuerpo vacío y credenciales.
- Tipado de respuesta alineado con el JSON que panel-api reenvía de cuentas: `authenticated`, y si aplica `id`, `name`/`nombre`, `email`/`correo` (ajustar nombres de campos al contrato real de panel-api/account-api sin acoplar a otros hosts).
- Prohibido: bases URL de account-api, catalog/order/payment, o endpoints de Google.

### 5. Entrar con Google (navegación)

**Cubre:** RF-5, RF-10, RF-11

- Al pulsar «Entrar con Google»: `location.assign(`${apiBaseUrl}/panel/login/google`)` (o equivalente).
- Sin formulario local; sin SDK de Google; sin client id en el cliente.
- panel-api se encarga de `return_to` hacia el origen del panel (fuera de alcance de este repo).

### 6. Hidratación al cargar y retorno con sesión

**Cubre:** RF-6, RF-13, RF-12

- En `provideAppInitializer` (o equivalente al arranque): llamar `getSession()` con credenciales.
- Si `authenticated` y hay nombre + correo → estado autenticado; UI con «Salir» (RF-13 tras vuelta de Google con cookie).
- Si no autenticado → anónimo + «Entrar con Google»; panel usable.

### 7. Retorno de Google sin sesión + indicador en la URL

**Cubre:** RF-14, RF-3

- Tras hidratar (o en paralelo seguro): leer `URLSearchParams` del `return_to`.
- Si está presente el **indicador de fallo de entrada** que account-api añade al redirigir (contrato de account-api RF-10; mismo indicador que consumirá la tienda), entonces:
  - mantener / forzar UI anónima («Entrar con Google»);
  - mostrar aviso en español: no se pudo entrar;
  - limpiar ese parámetro de la URL (`history.replaceState`) para no re-mostrar el aviso en cada refresh.
- No inventar un segundo indicador propio del panel.

### 8. Fallo al consultar la sesión

**Cubre:** RF-15, RF-2, RF-3

- Si `GET /panel/session` falla (red, 5xx, etc.): panel usable; estado anónimo; «Entrar con Google»; aviso breve en español (p. ej. no se pudo comprobar la sesión).
- Distinguir “200 + authenticated: false” (sin aviso de fallo) de error de consulta (con aviso).

### 9. Salir y efecto en la sesión compartida

**Cubre:** RF-7, RF-8, RF-4, RF-16

- Al pulsar «Salir»: `POST {apiBaseUrl}/panel/logout` con credenciales.
- Éxito → estado anónimo, «Entrar con Google»; la invalidación de `fes_session` en el dominio compartido es responsabilidad de panel-api/account-api — el front no llama a la tienda; RF-8 se cumple por el contrato compartido al completar el logout con éxito.
- Fallo → **mantener** autenticado, seguir mostrando «Salir» (y perfil), aviso de que no se pudo salir (RF-16).

## Contrato consumido (dependencia externa, no implementar aquí)

| Operación | Método y path | Credenciales | Rol en este plan |
|-----------|---------------|--------------|------------------|
| Iniciar Google | `GET {API}/panel/login/google` | Navegación browser | RF-5 |
| Consultar sesión | `GET {API}/panel/session` | Sí | RF-6, RF-12–RF-15 |
| Cerrar sesión | `POST {API}/panel/logout` | Sí | RF-7, RF-8, RF-16 |

Respuesta de sesión (esperada vía panel-api): JSON de cuentas con `authenticated` y, si true, identidad con nombre y correo (RF-12). Errores de disponibilidad (p. ej. 503) → rama RF-15 / RF-16 según la operación.

## Cambios de UI (Admin Panel)

- Conservar atmósfera Admin UI actual (RF-1); no rediseñar el hero operativo en este corte.
- Textos: «Entrar con Google», «Salir», avisos en español.
- Avisos no bloqueantes con `role="alert"` (o live region), foco visible, contraste adecuado.
- Responsive ≥ 320 px; botones accionables por teclado.

## Bootstrap Angular

- `provideHttpClient()` en `app.config.ts` / `bootstrapApplication`.
- `provideAppInitializer` → `session.hydrate()` (consulta sesión + lectura del indicador de URL).
- Environments vía imports de `environment`; sin URLs hardcodeadas en componentes.

## Pruebas y verificación

Alineado con `AGENTS.md` (`npm test` = unit + lint + build) y criterios de finalización de la spec:

| Verificación | RF |
|--------------|-----|
| Aspecto Admin UI (móvil / escritorio) | RF-1 |
| Panel usable sin login | RF-2 |
| Sin sesión → «Entrar con Google», sin «Salir» | RF-3 |
| Con sesión → «Salir», sin «Entrar con Google» | RF-4 |
| Clic Entrar → navegación a `{API}/panel/login/google` | RF-5 |
| Al cargar → `GET {API}/panel/session` con credenciales | RF-6 |
| Salir → `POST {API}/panel/logout` con credenciales | RF-7 |
| Logout OK → anónimo; sesión compartida inválida también para tienda (demo) | RF-8 |
| Solo host `{API}` configurado | RF-9 |
| Sin Google client id en bundle | RF-10 |
| Sin llamadas a account-api / APIs Java / Google desde el panel | RF-11 |
| Con sesión → nombre y correo | RF-12 |
| Retorno Google con sesión → «Salir» | RF-13 |
| Retorno con indicador URL → Entrar + aviso | RF-14 |
| Fallo GET session → usable + Entrar + aviso | RF-15 |
| Fallo logout → sigue «Salir» + aviso | RF-16 |

Unitarios prioritarios: `session` (transiciones hydrate / logout éxito-error / indicador URL) con `HttpClientTestingModule` o mocks; el flujo OAuth completo por demo manual.

## Fuera de alcance (no implementar en este plan)

- Implementar panel-api / account-api / infra.
- Llamadas a account-api, APIs Java o Google desde el panel.
- Publicar catálogos, alta de tienda, membresía de vendedor.
- Incluir `GOOGLE_CLIENT_ID` en el front.
- Keycloak u otros métodos de auth no descritos.

## Orden de implementación sugerido

1. Environments + `provideHttpClient` + esqueleto `core/session` y `panel-session` — RF-9, RF-10, RF-11.
2. Extracción del shell Admin UI + `session-bar` presentacional — RF-1, RF-2, RF-3, RF-4.
3. Hidratación `GET /panel/session` + pintar perfil — RF-6, RF-12, RF-13, RF-15.
4. Navegación «Entrar con Google» — RF-5.
5. Indicador de fallo en URL — RF-14.
6. Logout + manejo de error — RF-7, RF-8, RF-16.
7. Barrido de frontera (red / código) + `npm test` + demo manual móvil/escritorio.

## Matriz de cobertura de RF

| RF | Sección del plan |
|----|------------------|
| RF-1 | §1 Presentación Admin UI |
| RF-2 | §1 Uso sin autenticación; §8 |
| RF-3 | §2 Controles sin sesión; §7 |
| RF-4 | §2 Controles con sesión; §9 |
| RF-5 | §5 Entrar con Google |
| RF-6 | §4 Cliente HTTP; §6 Hidratación |
| RF-7 | §4 Cliente HTTP; §9 Salir |
| RF-8 | §9 Salir y sesión compartida |
| RF-9 | §3 Configuración; §4 Cliente HTTP |
| RF-10 | §3 Configuración; §5 Entrar |
| RF-11 | §4 Cliente HTTP; §5 Entrar |
| RF-12 | §2 Controles; §6 Hidratación |
| RF-13 | §6 Retorno con sesión |
| RF-14 | §7 Indicador en URL |
| RF-15 | §8 Fallo al consultar sesión |
| RF-16 | §9 Fallo al cerrar sesión |

**Cobertura:** RF-1 … RF-16 (todos).
