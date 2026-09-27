# Tasks 001 — Panel con entrada Google opcional

Ordenadas por dependencia. Cada tarea ~20–30 min. No implementar fuera de este listado.

## Configuración y esqueleto HTTP

- [x] **T1.** Crear `src/environments/environment.ts` y `environment.development.ts` con `apiBaseUrl` (sin barra final; p. ej. Minikube `http://api.friendly-e-shop.test`), alineado con los `fileReplacements` ya declarados en `angular.json`.  
  **RFs:** RF-9, RF-10  
  **Done when:** el build de desarrollo resuelve un `apiBaseUrl` distinto del de producción (o el valor por defecto del entorno) y no hay literales de client id / secret de Google en environments.

- [x] **T2.** Añadir `app/app.config.ts` con `provideHttpClient()` e integrar el bootstrap en `main.ts` (providers del app config).  
  **RFs:** RF-9  
  **Done when:** la app arranca con `HttpClient` disponible vía DI y no hay URLs de API hardcodeadas en el bootstrap.

- [x] **T3.** Crear `app/core/session/session-profile.ts` con los tipos de respuesta de sesión (`authenticated` e identidad con nombre/correo según el contrato de panel-api).  
  **RFs:** RF-6, RF-12  
  **Done when:** los tipos compilan en estricto y modelan anónimo vs autenticado sin depender de hosts ajenos a `{API}`.

- [x] **T4.** Crear `app/core/session/panel-session.ts` con `getSession()` → `GET {apiBaseUrl}/panel/session` y `logout()` → `POST {apiBaseUrl}/panel/logout` (cuerpo vacío), ambos con credenciales de sesión (`withCredentials` / equivalente).  
  **RFs:** RF-6, RF-7, RF-9, RF-11  
  **Done when:** el cliente solo construye URLs bajo `{apiBaseUrl}/panel/*` y no referencia account-api, APIs Java de dominio ni Google.

## Shell Admin UI y barra de sesión

- [x] **T5.** Extraer el layout actual (aside «Friendly / Panel» + sección operativa) a `app/features/shell/shell.ts` y cablear la raíz fina (`app.ts` / `main.ts`) sin route guards ni interceptores que exijan login.  
  **RFs:** RF-1, RF-2  
  **Done when:** el panel se ve como Admin UI (mismo lenguaje visual de `styles.css`) y todo el contenido es usable sin autenticación.

- [x] **T6.** Crear `app/features/shell/components/session-bar.ts` presentacional: sin sesión muestra «Entrar con Google» y no «Salir»; con sesión muestra «Salir» y no «Entrar con Google»; textos en español; operable por teclado y usable desde 320 px.  
  **RFs:** RF-3, RF-4  
  **Done when:** al forzar estado anónimo/autenticado en la plantilla, los controles son mutuamente excluyentes y accesibles por teclado.

- [x] **T7.** En `session-bar`, con sesión mostrar nombre y correo; sin sesión no mostrar esos datos; avisos no bloqueantes con `role="alert"` (o live region), foco visible y controles ≥ 44 px.  
  **RFs:** RF-12  
  **Done when:** el perfil (nombre + correo) solo aparece en estado autenticado y los avisos son anunciables por AT.

## Estado de sesión e hidratación

- [x] **T8.** Crear `app/core/session/session.ts` (signals, `providedIn: 'root'`) como fuente de verdad: anónimo | autenticado + perfil + avisos; acciones `hydrate` / `enterWithGoogle` / `logout` sin persistir en `localStorage` / IndexedDB.  
  **RFs:** RF-2, RF-11  
  **Done when:** el estado en memoria refleja anónimo/autenticado y no guarda client id de Google ni datos de cuenta en almacenamiento local.

- [x] **T9.** Implementar `hydrate()` llamando `getSession()` con credenciales; si `authenticated` con nombre y correo → autenticado; si no autenticado (200) → anónimo sin aviso de fallo; registrar `provideAppInitializer` que ejecute `hydrate()`.  
  **RFs:** RF-6, RF-12, RF-13  
  **Done when:** al cargar la página se emite `GET {API}/panel/session` con credenciales y, con cookie de sesión válida, la UI muestra «Salir» y el perfil (equivale al retorno de Google con sesión).

- [x] **T10.** En `hydrate()`, si `GET /panel/session` falla (red, 5xx, etc.): dejar el panel usable, estado anónimo, «Entrar con Google» y aviso breve en español (p. ej. no se pudo comprobar la sesión); distinguir de `authenticated: false` sin aviso.  
  **RFs:** RF-15, RF-2, RF-3  
  **Done when:** un mock/error de sesión deja el shell operable con «Entrar con Google» + aviso, y un 200 anónimo no muestra ese aviso de fallo.

## Entrar con Google y retorno con error

- [x] **T11.** Al elegir «Entrar con Google», `enterWithGoogle` hace navegación completa del navegador a `{apiBaseUrl}/panel/login/google` (p. ej. `location.assign`); sin XHR de authorizationUrl, sin SDK de Google y sin client id en el cliente.  
  **RFs:** RF-5, RF-10, RF-11  
  **Done when:** el clic navega a `{API}/panel/login/google` y un barrido del código/bundle no encuentra `GOOGLE_CLIENT_ID` ni llamadas a Google/account-api/APIs Java.

- [x] **T12.** Tras hidratar (o en paralelo seguro), leer el indicador de fallo de entrada en `URLSearchParams` (mismo contrato que account-api / tienda); si está presente: forzar UI anónima («Entrar con Google»), aviso en español de que no se pudo entrar, y limpiar el parámetro con `history.replaceState`.  
  **RFs:** RF-14, RF-3  
  **Done when:** una URL con el indicador muestra Entrar + aviso y, tras limpiar, un refresh no re-muestra el aviso por el mismo parámetro.

## Salir y sesión compartida

- [x] **T13.** Al elegir «Salir», llamar `POST {apiBaseUrl}/panel/logout` con credenciales; en éxito pasar a anónimo («Entrar con Google», sin perfil), confiando en panel-api/account-api para invalidar `fes_session` también para la tienda (sin llamar a la tienda desde el panel).  
  **RFs:** RF-7, RF-8, RF-4  
  **Done when:** un logout 2xx deja la UI anónima y la petición fue `POST …/panel/logout` con credenciales.

- [x] **T14.** Si el logout falla: mantener estado autenticado, seguir mostrando «Salir» y el perfil, y mostrar aviso en español de que no se pudo salir.  
  **RFs:** RF-16, RF-4  
  **Done when:** un mock/error de logout no cambia a «Entrar con Google» y el aviso de fallo de salida es visible.

## Pruebas y verificación final

- [x] **T15.** Tests unitarios de `session` (hydrate éxito/anónimo/error, indicador URL, logout éxito/error) con `HttpClientTestingModule` o mocks.  
  **RFs:** RF-6, RF-7, RF-14, RF-15, RF-16  
  **Done when:** los tests cubren las transiciones anteriores y pasan con el runner del proyecto.

- [ ] **T16.** Barrido de frontera + `npm test` (unit + lint + build) + demo manual móvil/escritorio del flujo principal (uso sin login, entrar vía panel-api, sesión al cargar, salir y efecto en sesión compartida).  
  **RFs:** RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, RF-7, RF-8, RF-9, RF-10, RF-11, RF-12, RF-13, RF-14, RF-15, RF-16  
  **Done when:** `npm test` pasa; no hay client id de Google ni hosts ajenos a `{API}` en el bundle; la demo manual verifica el checklist de RF de la spec/plan.

## Matriz RF → tareas

| RF | Tareas |
|----|--------|
| RF-1 | T5, T16 |
| RF-2 | T5, T8, T10, T16 |
| RF-3 | T6, T10, T12, T16 |
| RF-4 | T6, T13, T14, T16 |
| RF-5 | T11, T16 |
| RF-6 | T3, T4, T9, T15, T16 |
| RF-7 | T4, T13, T15, T16 |
| RF-8 | T13, T16 |
| RF-9 | T1, T2, T4, T16 |
| RF-10 | T1, T11, T16 |
| RF-11 | T4, T8, T11, T16 |
| RF-12 | T3, T7, T9, T16 |
| RF-13 | T9, T16 |
| RF-14 | T12, T15, T16 |
| RF-15 | T10, T15, T16 |
| RF-16 | T14, T15, T16 |

**Cobertura:** RF-1 … RF-16 (todos).
