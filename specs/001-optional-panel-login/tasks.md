# Tasks 001 — Entrada opcional al panel

Tareas pequeñas (~20–30 min), en orden de dependencias. Cada una indica los RF que cubre y un criterio verificable.

## Fundación: configuración y HTTP

- [x] **T1 — Configurar la base URL de panel-api fuera de componentes**  
  **RF:** RF-9  
  **Done when:** Existe environment / runtime config con el host de `panel-api`; ningún componente hardcodea la URL; no hay secretos ni client secrets de Google en el bundle.

- [x] **T2 — Registrar HttpClient en el bootstrap de la SPA**  
  **RF:** RF-9  
  **Done when:** `provideHttpClient` está cableado en el arranque; la app arranca sin errores y puede inyectar `HttpClient`.

- [x] **T3 — Crear el cliente HTTP tipado de identidad hacia panel-api**  
  **RF:** RF-9, RF-10  
  **Done when:** Existe un cliente (interfaces + métodos) para iniciar entrada Google, consultar sesión/quién soy y cerrar sesión, apuntando solo a la base URL de `panel-api`, con `withCredentials` si aplica; cero imports o URLs del servicio de cuentas.

## Estado de sesión e hidratación

- [x] **T4 — Crear el servicio de estado de sesión en memoria**  
  **RF:** RF-1, RF-11  
  **Done when:** El servicio expone estado anónimo | identificado + perfil (nombre, correo) solo en memoria; no escribe perfil/cuenta en `localStorage`, IndexedDB ni cookies propias del front.

- [x] **T5 — Hidratar la sesión al abrir o recargar el panel**  
  **RF:** RF-14, RF-1  
  **Done when:** Al bootstrap, el servicio consulta sesión/quién soy solo a `panel-api`; si hay sesión activa el estado queda identificado; si no hay sesión o está cerrada, queda anónimo y el panel sigue usable (sin route guard de login obligatorio).

## UI del shell (identidad)

- [x] **T6 — Mostrar «Entrar» cuando el usuario no está identificado**  
  **RF:** RF-2  
  **Done when:** En el shell (cabecera/barra), con estado anónimo, aparece el control «Entrar» en español; el resto del panel permanece visible y usable; accionable por teclado y usable desde 320 px.

- [x] **T7 — Mostrar nombre y correo cuando el usuario está identificado**
  **RF:** RF-5, RF-9  
  **Done when:** Con estado identificado, el shell muestra el nombre y el correo devueltos por `panel-api`; los datos salen del estado en memoria (no de almacenamiento local de cuenta).

- [x] **T8 — Mostrar «Salir» cuando el usuario está identificado**
  **RF:** RF-6  
  **Done when:** Con estado identificado, aparece el control «Salir» en español; no se muestra «Entrar» a la vez; el resto del panel sigue usable.

## Flujos entrar y salir

- [x] **T9 — Conectar «Entrar» al inicio de acceso Google solo vía panel-api**  
  **RF:** RF-3, RF-9, RF-10  
  **Done when:** Al pulsar Entrar, el servicio delega en el cliente HTTP de `panel-api` para iniciar Google; no hay formulario de email/contraseña en este front; la red no llama al servicio de cuentas.

- [x] **T10 — Confirmar entrada y marcar estado identificado**  
  **RF:** RF-4, RF-5  
  **Done when:** Tras confirmación de `panel-api` (callback o respuesta), el estado pasa a identificado y la UI muestra nombre y correo.

- [x] **T11 — Manejar entrada no confirmada (aviso, seguir anónimo)**  
  **RF:** RF-12  
  **Done when:** Si la entrada falla, se rechaza o se cancela, el estado permanece anónimo, se muestra aviso en español de que no pudo entrar, y el panel sigue usable.

- [x] **T12 — Conectar «Salir» al cierre de sesión compartida en panel-api**  
  **RF:** RF-7, RF-8, RF-9  
  **Done when:** Al pulsar Salir, se llama solo a `panel-api` para cerrar la sesión; si confirma, el estado pasa a anónimo y el usuario puede seguir usando el panel sin cuenta.

- [x] **T13 — Manejar salida no confirmada (mantener identificado + aviso)**  
  **RF:** RF-13  
  **Done when:** Si salir falla, el estado sigue identificado (nombre/correo visibles), se muestra aviso en español de que no pudo salir, y no se pierde la identidad en UI.

- [x] **T14 — Garantizar uso del panel sin identificación y tras salir**  
  **RF:** RF-1, RF-8  
  **Done when:** Sin sesión, tras salir con éxito, o nunca habiendo entrado, no hay redirect a login obligatorio ni interceptor que bloquee el shell; demostrable que el panel permanece usable.

## Sesión inválida y barreras de alcance

- [x] **T15 — Invalidar sesión cuando panel-api ya no reconoce al usuario**  
  **RF:** RF-15  
  **Done when:** Ante 401/403 o cuerpo anónimo (según contrato) en consulta de sesión u otra solicitud, el estado pasa a anónimo, se muestra aviso en español, y el panel sigue usable (sin “login wall”).

- [x] **T16 — Verificar que este front no guarda la cuenta**  
  **RF:** RF-11  
  **Done when:** Revisión de código/tests confirma que no se persiste perfil ni “cuenta” en almacenamiento del front; tras recarga, la verdad solo viene de consultar sesión en `panel-api`.

- [x] **T17 — Verificar frontera exclusiva: sin llamadas al servicio de cuentas**  
  **RF:** RF-10, RF-9  
  **Done when:** Checklist en código, environments y tests de este corte: cero referencias a hosts/URLs del servicio de cuentas; entrar, salir y quién soy solo hablan con `panel-api`.

## Pruebas y cierre

- [x] **T18 — Tests unitarios del servicio de sesión (transiciones y errores)**  
  **RF:** RF-4, RF-7, RF-12, RF-13, RF-14, RF-15  
  **Done when:** Con HttpClient mockeado, hay pruebas que cubren: confirmación de entrada → identificado; fallo de entrada → anónimo + aviso; salida OK → anónimo; fallo de salida → sigue identificado; hidratación con/sin sesión; sesión no reconocida → anónimo + aviso.

- [x] **T19 — Textos de UI en español y avisos no bloqueantes**
  **RF:** RF-2, RF-5, RF-6, RF-12, RF-13, RF-15  
  **Done when:** Controles Entrar/Salir, identidad y avisos (no pudo entrar / no pudo salir / sesión ya no válida) están en español; los avisos no bloquean el uso del resto del panel.

- [ ] **T20 — Verificación final: lint, build y demo manual del flujo completo**
  **RF:** RF-1 … RF-15  
  **Done when:** `npm test` (lint + build) en verde; demo manual: usar panel sin entrar → Entrar → ver quién soy → Salir → seguir usando el panel; en red, ninguna llamada al servicio de cuentas en esos flujos.

## Matriz de cobertura RF → tareas

| RF | Tareas |
|----|--------|
| RF-1 | T4, T5, T14, T20 |
| RF-2 | T6, T19, T20 |
| RF-3 | T9, T20 |
| RF-4 | T10, T18, T20 |
| RF-5 | T7, T10, T19, T20 |
| RF-6 | T8, T19, T20 |
| RF-7 | T12, T18, T20 |
| RF-8 | T12, T14, T20 |
| RF-9 | T1, T2, T3, T7, T9, T12, T17, T20 |
| RF-10 | T3, T9, T17, T20 |
| RF-11 | T4, T16, T20 |
| RF-12 | T11, T18, T19, T20 |
| RF-13 | T13, T18, T19, T20 |
| RF-14 | T5, T18, T20 |
| RF-15 | T15, T18, T19, T20 |

**Cobertura:** RF-1 … RF-15 (todos).
