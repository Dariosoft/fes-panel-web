# Plan 002 — Catálogo: ABM local, estados y publicación

## Resumen técnico

Implementar en `panel-web` (Angular 21, SPA standalone, TypeScript estricto) la sección «Catálogo»: listado, alta y edición de productos con etapa (`draft`/`published`) y posesión (con o sin dueño). Sin sesión, los productos viven solo en la sesión local del navegador; con sesión, la cuenta gestiona los productos del servidor. Los productos locales sin dueño **no** se asocian al iniciar sesión: se muestran en un grupo separado y pasan a la cuenta al publicarlos («Publicar») o al publicar el catálogo («Publicar catálogo»). Cada operación con sesión pasa por `fes-panel-api` (`/panel/catalog/...`) con la cookie `fes_session`; un 401 reinicia el login y reintenta la operación. El panel no define el esquema definitivo ni sube imágenes a MinIO.

**Gobernanza:** aplican `AGENTS.md`, `/admin-ui-arquitecture` (shell, sidebar, `views/`, `core/` por categoría), `/angular-developer` (signals, `HttpClient` como Observables, formularios reactivos en v21, lazy routes, accesibilidad) y `/ui-ux-pro-max` (accesibilidad, touch, feedback, responsive, lenguaje Admin UI ya establecido en `src/styles.css`). No se añaden dependencias: no se incorpora NgRx Signal Store (el estado se modela con signals locales, como exige la convención del repo).

## Historias cubiertas

- H1 → alta y edición sin sesión (RF-19, RF-20).
- H2 → alta y edición con sesión como draft de la cuenta (RF-21, RF-22, RF-45, RF-46).
- H3 → etapa y posesión visibles (RF-23, RF-24, RF-25).
- H4 → publicar, despublicar y eliminar con modal (RF-26–RF-34, RF-39–RF-42).
- H5 → publicar catálogo y tomar posesión (RF-35–RF-38, RF-50).
- H6 → separar locales sin dueño de los ya asociados (RF-6, RF-7, RF-8, RF-9).

## Estado actual del proyecto

- Shell Admin UI persistente en `src/app/app.ts` / `app.html`: aside con marca y `session-bar`, contenido en `<router-outlet />`; sin navegación de secciones todavía.
- `app.routes.ts`: `''` → `HomeView` y `'**'` → redirect; sin rutas de catálogo.
- `app.config.ts`: `provideRouter`, `provideHttpClient()` y `provideAppInitializer` → `Session.hydrate()`.
- Sesión existente de la spec 001: `Session` (signals `status`, `profile`, `notice`, `authenticated`, acciones `hydrate`, `enterWithGoogle`, `logout`) y `PanelSession` (solo `/panel/identity/*`).
- Environments `src/environments/*` con `apiBaseUrl` sin barra final.
- Estilos globales Tailwind v4 + Fira Sans / Fira Code, tema Admin UI oscuro, usable desde 320 px.
- Convenciones: código en inglés, textos en español; presentación ≠ HTTP ≠ estado; hosts de API fuera de componentes; sin credenciales en bundle; CSS legible (una declaración por línea, media queries en líneas propias).
- Frontera de este corte: únicamente rutas `/panel/catalog/*` del anfitrión configurado; no se llama a `fes-catalog-api` ni a MinIO.

## Decisiones de arquitectura

- **Shell y navegación:** añadir la navegación de secciones al aside persistente del `App` (chrome global), no dentro de las vistas; `/catalog` es una vista routeada. Cumple `/admin-ui-arquitecture` (no duplicar el sidebar en las vistas).
- **Rutas perezosas:** `catalog-list` y `catalog-form` se cargan con `loadComponent()` para no engordar el bundle inicial (`/angular-developer`, `/ui-ux-pro-max` stack angular).
- **Estado con signals:** `Catalog` es la fuente de verdad del listado visible (locales + servidor), del filtro, del orden y de la posesión; los componentes presentacionales reciben `input()` y emiten `output()`.
- **Persistencia local desacoplada:** `LocalCatalog` encapsula `sessionStorage` (sesión local del navegador, no `localStorage`) detrás de una interfaz; el estado y las vistas no tocan el almacenamiento directamente.
- **HTTP como Observables:** `PanelCatalog` usa `HttpClient` con `withCredentials: true` y devuelve Observables; la vista/estado se suscribe con `subscribe({ next, error })` (sin `firstValueFrom` / `lastValueFrom` / `toPromise`). No se construyen URLs fuera del cliente HTTP.
- **401 sin interceptor circular:** el interceptor idiomático no se usa aquí para evitar el ciclo `Session → PanelCatalog → HttpClient → interceptor → Session`. El estado de catálogo detecta `status === 401` en el callback de error, delega en `CatalogRecovery` y navega al login; al volver con sesión, `CatalogRecovery` reintenta la operación. El criterio es único para guardar, publicar, despublicar, eliminar y publicar catálogo (RF-53).
- **Formularios reactivos:** Angular 21 no tiene Signal Forms estables (llegan en v22); se usa `ReactiveFormsModule` con validación síncrona y mensajes de error junto al campo.
- **Publicación de un local sin dueño:** como el producto no existe en el servidor, «Publicar» primero lo crea en la cuenta (`POST /panel/catalog/products`) y luego lo publica (`POST /panel/catalog/products/{id}/publish`); «Publicar catálogo» crea primero los locales sin dueño y luego invoca `POST /panel/catalog/publish` para publicar todos los draft de la cuenta.

## Estructura de carpetas (planificada)

```
src/
  environments/
    environment.ts / environment.development.ts   # apiBaseUrl (sin cambios)
  app/
    app.config.ts                                 # provideHttpClient (+ withCredentials vía cliente)
    app.routes.ts                                 # '' Home; 'catalog'; 'catalog/new'; 'catalog/:id/edit'
    app.ts / app.html                             # shell + nav «Catálogo» en el aside
    core/
      components/
        confirm-dialog/                           # modal reutilizable (foco atrapado, Escape, cancelable)
        product-images/                           # carousel + placeholder + alta/validación de imágenes
        product-status/                           # badges de etapa y de posesión
      constants/
        product-stage.ts                          # draft | published
        product-origin.ts                         # local | server
        product-limits.ts                         # MAX_IMAGES = 10, MAX_IMAGE_BYTES = 2 * 1024 * 1024
        catalog-storage-keys.ts                   # claves de sessionStorage
      models/
        catalog-product.ts                        # CatalogProduct, ProductImage, Currency, EditableProduct
        pending-catalog-operation.ts              # intención pendiente tras 401
      services/
        catalog/
          catalog.ts                              # estado (signals) + listado/filtro/orden + acciones
          panel-catalog.ts                        # HTTP {apiBaseUrl}/panel/catalog/*
          local-catalog.ts                        # persistencia sessionStorage
          catalog-recovery.ts                     # guarda y reintenta la operación tras 401
    views/
      catalog-list/                               # /catalog
      catalog-form/                               # /catalog/new y /catalog/:id/edit (vista compartida)
```

## Capas

| Capa | Responsabilidad | No hace |
|------|-----------------|---------|
| Presentación (`views/catalog-list`, `views/catalog-form`, `core/components/*`) | Listado con grupos, filtro y orden; formularios; modales; carousel; placeholder; badges; estados de carga/vacío/error; accesibilidad | No construye URLs de API ni decide la persistencia ni la posesión |
| Estado (`core/services/catalog/catalog.ts`) | Fuente de verdad del listado visible (locales sin dueño + servidor de la cuenta), filtro, orden, etapa/posesión y acciones (guardar, publicar, despublicar, eliminar, publicar catálogo) | No habla HTTP directo ni toca `sessionStorage` |
| HTTP (`core/services/catalog/panel-catalog.ts`) | Solo `{apiBaseUrl}/panel/catalog/*` con credenciales | No traduce dominio ni persiste local |
| Almacenamiento local (`core/services/catalog/local-catalog.ts`) | CRUD de productos locales en `sessionStorage` | No llama a la red |
| Recuperación (`core/services/catalog/catalog-recovery.ts`) | Recuerda la operación ante 401 y la reintenta tras autenticar | No arma URLs ni pinta UI |
| Configuración (`environments/*`) | `apiBaseUrl` por entorno | No embebe secretos |

## Modelo de datos (contratos del panel)

Producto del servidor (respuesta de `/panel/catalog/products`):

```json
{
  "id": "string",
  "name": "string",
  "price": 1234.5,
  "currency": "ARS",
  "stock": 0,
  "stage": "draft",
  "ownerAccountId": "string",
  "images": [{ "id": "string", "url": "string" }],
  "createdAt": "2026-10-01T12:00:00Z"
}
```

Producto local (solo en el navegador): mismo shape visible con `origin: "local"`, `owned: false`, `stage: "draft"` y `images: [{ "dataUrl": "data:image/..." }]`. El modelo unificado `CatalogProduct` agrega `origin` (`local` | `server`) y `owned` (booleano) para que la UI decida grupos, badges y acciones sin conocer detalles de transporte.

Operación pendiente tras 401 (persistida en `sessionStorage`): `{ kind: 'save' | 'publish' | 'unpublish' | 'delete' | 'publishCatalog', productId?, payload? }`.

## Contrato HTTP consumido (frontera `fes-panel-api`, cookie `fes_session`)

| Operación | Método y path | RF |
|-----------|---------------|----|
| Listar productos de la cuenta | `GET {apiBaseUrl}/panel/catalog/products` | RF-44 |
| Crear producto (draft con dueño) | `POST {apiBaseUrl}/panel/catalog/products` | RF-45 |
| Actualizar producto | `PUT {apiBaseUrl}/panel/catalog/products/{id}` | RF-46 |
| Publicar un producto | `POST {apiBaseUrl}/panel/catalog/products/{id}/publish` | RF-47 |
| Despublicar un producto | `POST {apiBaseUrl}/panel/catalog/products/{id}/unpublish` | RF-48 |
| Eliminar producto con dueño | `DELETE {apiBaseUrl}/panel/catalog/products/{id}` | RF-49 |
| Publicar catálogo (toma posesión y publica los draft de la sesión) | `POST {apiBaseUrl}/panel/catalog/publish` | RF-50 |

Todas con `withCredentials: true`; el cuerpo de crear/actualizar incluye los campos del producto y sus imágenes. Las imágenes viajan con el payload del producto en `multipart/form-data` (parte `images`, hasta 10 archivos ≤ 2 MB); el nombre exacto de la parte se fija contra el contrato compartido de `panel-api`/`catalog-api`. El cliente HTTP encapsula ese detalle para que el estado y las vistas no lo conozcan. El panel no llama a `fes-catalog-api` (RF-51) ni a MinIO (RF-52).

## Desglose técnico por capacidad

### §1. Shell, navegación y rutas

**Cubre:** RF-1, RF-2, RF-3, RF-4

- Añadir en `app.html` el enlace «Catálogo» en el aside persistente, con `routerLink`/`routerLinkActive`, operable por teclado y visible desde 320 px; sin duplicar el sidebar en las vistas (`/admin-ui-arquitecture`).
- Montar en `app.routes.ts`: `catalog` → `CatalogListView`, `catalog/new` → `CatalogFormView`, `catalog/:id/edit` → `CatalogFormView`, con `loadComponent()` y `title` en español.
- Las vistas de catálogo se renderizan dentro del shell; `HomeView` no se modifica salvo que se enlace al catálogo desde su contenido.

### §2. Listado, grupos, orden y filtro

**Cubre:** RF-5, RF-6, RF-7, RF-8, RF-9

- `Catalog` calcula con `computed()` el listado visible:
  - sin sesión: solo productos locales (RF-5);
  - con sesión: grupo «Locales sin dueño» (locales, `owned: false`) y grupo «De tu cuenta» (productos del servidor `draft` + `published`) (RF-6, RF-7).
- Ordenar por `createdAt` descendente (RF-8) y filtrar por nombre con un `input` de búsqueda (RF-9), ambos derivados en signals.
- Estados de carga (mientras `GET /panel/catalog/products` está en vuelo), vacío (sin productos) y error (lista de locales + aviso si el servidor falla), según `AGENTS.md`.

### §3. Formulario de producto (vista compartida)

**Cubre:** RF-10, RF-11, RF-19, RF-20, RF-21

- `CatalogFormView` sirve `/catalog/new` y `/catalog/:id/edit`: con `id` carga el producto (local o servidor); sin `id` parte de un producto vacío.
- Formulario reactivo con `name` (obligatorio), `price` (numérico), `currency` (`ARS` por defecto, `USD` alternativa) y `stock` opcional (RF-10, RF-11).
- Al guardar: si hay sesión → crear (`POST`) o actualizar (`PUT`) draft de la cuenta (RF-21, RF-45, RF-46); si no → persistir solo en `sessionStorage` (RF-19, RF-20).
- Mensajes de error junto al campo y botón de guardar con estado de envío (feedback de carga).

### §4. Imágenes: límites, carousel y placeholder

**Cubre:** RF-12, RF-13, RF-14, RF-15, RF-16, RF-17, RF-18

- `product-images` gestiona el alta de archivos con `input type="file"` multiple y previsualización:
  - con sesión: hasta 10 archivos de hasta 2 MB, enviados al servidor en cada guardado (RF-12);
  - sin sesión: hasta 1 archivo, guardado como `dataUrl` local, con aviso de que más requiere iniciar sesión (RF-13, RF-14).
- Rechazar el excedente con mensaje de límite (RF-17) y cada archivo > 2 MB con mensaje de tamaño (RF-18), sin romper el formulario.
- Carousel con controles accesibles y navegación por teclado cuando hay imágenes (RF-15); placeholder cuando no las hay (RF-16).

### §5. Etapa y posesión

**Cubre:** RF-23, RF-24, RF-25

- `product-status` muestra dos badges: etapa (`draft`/`published`) y posesión («Sin dueño» / «De tu cuenta») (RF-23, RF-24).
- La UI nunca ofrece pasar un producto sin dueño a `published` sin tomar posesión; ese estado no es alcanzable en el flujo normal (RF-25).

### §6. Publicar y despublicar un producto

**Cubre:** RF-26, RF-27, RF-28, RF-29, RF-30, RF-31, RF-47, RF-48

- En etapa `draft` se ofrece «Publicar» (RF-26); sin sesión se muestra deshabilitado con tooltip accesible que indica que se requiere sesión (RF-27, RF-28).
- En etapa `published` se ofrece «Despublicar» (RF-30).
- Confirmado «Publicar» (RF-39): si el producto es local sin dueño, `Catalog` lo crea en la cuenta (`POST /panel/catalog/products`) y lo publica (`POST .../{id}/publish`) (RF-29, RF-45, RF-47); si es un draft del servidor, solo publica (RF-47).
- Confirmado «Despublicar» (RF-40): `POST .../{id}/unpublish` y el producto pasa a `draft` (RF-31, RF-48).

### §7. Eliminar según posesión

**Cubre:** RF-32, RF-33, RF-34, RF-49

- «Eliminar» visible en cada producto (RF-32) y detrás de modal de confirmación (RF-41).
- Con dueño: `DELETE {apiBaseUrl}/panel/catalog/products/{id}` (RF-33, RF-49). Local sin dueño: se quita de `sessionStorage`, sin red (RF-34).

### §8. Publicar catálogo

**Cubre:** RF-35, RF-36, RF-37, RF-38, RF-50

- «Publicar catálogo» se habilita cuando hay cambios sin publicar (RF-35); sin sesión se muestra deshabilitado con indicación de que se requiere sesión (RF-36).
- Confirmado (RF-42): `Catalog` toma los draft visibles —locales sin dueño + draft del servidor de la cuenta— (RF-38), crea los locales en la cuenta (`POST /panel/catalog/products`) y luego invoca `POST {apiBaseUrl}/panel/catalog/publish`, publicando y tomando posesión de todos (RF-37, RF-50).
- La operación es cancelable antes de ejecutarse y reporta éxito o error sin dejar el listado inconsistente.

### §9. Modales de confirmación

**Cubre:** RF-39, RF-40, RF-41, RF-42

- `confirm-dialog` es reutilizable: título, mensaje, acción principal y «Cancelar»; cierra con Escape y con el botón de cancelar sin ejecutar la acción (NFR).
- Se usa para publicar, despublicar, eliminar y publicar catálogo (RF-39–RF-42), con foco inicial en el diálogo, `role="dialog"` + `aria-modal` y retorno de foco al abridor.

### §10. Cliente HTTP de frontera

**Cubre:** RF-43, RF-44, RF-45, RF-46, RF-47, RF-48, RF-49, RF-50, RF-51, RF-52

- `panel-catalog.ts` construye únicamente `${environment.apiBaseUrl}/panel/catalog/[...]` con `withCredentials: true` (RF-43) y expone un método por operación (RF-44–RF-50).
- Prohibido referenciar `fes-catalog-api` (RF-51), MinIO (RF-52) o credenciales en el bundle.
- Todos los métodos devuelven Observables; el estado los consume con `subscribe({ next, error })`.

### §11. Recuperación ante 401

**Cubre:** RF-53

- Cuando cualquier operación con sesión falla con 401, `Catalog` delega en `CatalogRecovery.remember(...)` con la intención (y el payload si aplica), y luego llama `Session.enterWithGoogle()`.
- La intención queda en `sessionStorage` para sobrevivir a la navegación completa del login. Al volver autenticado, `CatalogRecovery.resumeIfPending()` reintenta la operación una vez y limpia la intención; un 401 repetido no genera bucles (se descarta la intención).
- Mismo criterio único para guardar, publicar, despublicar, eliminar y publicar catálogo (RF-53).

## Cambios de UI (Admin Panel)

- Conservar el lenguaje visual Admin UI actual (Tailwind v4 + Fira Sans / Fira Code, tema oscuro) y el aside persistente (`/ui-ux-pro-max`, `/admin-ui-arquitectura`).
- Listado como tarjetas/segmentos con badges de etapa y posesión, separador de grupo «Locales sin dueño» y encabezado de filtro por nombre; estados de carga/vacío/error visibles.
- Botones «Publicar», «Despublicar», «Eliminar» y «Publicar catálogo» con jerarquía clara; acciones destructivas en color `destructive`.
- Tooltip del botón «Publicar» sin sesión accesible por teclado y con `aria-describedby`; no depender solo del hover.
- Controles ≥ 44 px, contraste 4.5:1, foco visible, `prefers-reduced-motion` respetado (transiciones con `motion-reduce`).
- Carousel con controles etiquetados y placeholder accesible (`alt`/`aria-label`).
- Formulario con etiquetas visibles, error junto al campo y feedback de guardado.
- CSS legible: una declaración por línea, una regla separada de la siguiente y media queries con su contenido en líneas propias.

## Pruebas y verificación

Alineado con `AGENTS.md` (`npm test` = unit + lint + build):

| Verificación | RF |
|--------------|----|
| «Catálogo» en el aside; rutas `catalog`, `catalog/new`, `catalog/:id/edit` | RF-1–RF-4 |
| Listado sin sesión (solo locales) / con sesión (grupo sin dueño + servidor) | RF-5–RF-7 |
| Orden por creación reciente y filtro por nombre | RF-8, RF-9 |
| Alta/edición con `name`, `price`, `currency` (ARS por defecto, USD), `stock` | RF-10, RF-11 |
| Imágenes: 10×2 MB con sesión; 1 con aviso sin sesión; carousel; placeholder; rechazos | RF-12–RF-18 |
| Guardar sin sesión solo en `sessionStorage`; con sesión crea/actualiza draft | RF-19–RF-21 |
| Login con locales sin dueño no los asocia y los agrupa aparte | RF-6, RF-22 |
| Badges de etapa y posesión; `published` sin dueño no alcanzable | RF-23–RF-25 |
| «Publicar» habilita/deshabilita (tooltip) y publica tomando posesión del local | RF-26–RF-29, RF-47 |
| «Despublicar» pasa a `draft` | RF-30, RF-31, RF-48 |
| «Eliminar» borra en servidor si hay dueño o solo en la sesión si es local | RF-32–RF-34, RF-49 |
| «Publicar catálogo» habilita con cambios, deshabilita sin sesión y publica los draft visibles | RF-35–RF-38, RF-50 |
| Modales de confirmación cancelables en las cuatro acciones | RF-39–RF-42 |
| Cookie `fes_session` y paths `/panel/catalog/*`; sin `fes-catalog-api` ni MinIO | RF-43–RF-52 |
| 401 → login + reintento único de la operación | RF-53 |

Unitarios prioritarios: `Catalog` (grupos, orden, filtro, publicar/despublicar/eliminar/publicar catálogo con mocks), `PanelCatalog` (paths, credenciales y 401), `LocalCatalog` (`sessionStorage`), `CatalogRecovery` (recordar/reintentar/descartar) y las vistas con `TestBed`. Demo manual móvil/escritorio del flujo principal.

## Matriz de cobertura de RF

| RF | Sección del plan |
|----|------------------|
| RF-1 | §1 Shell, navegación y rutas |
| RF-2 | §1 |
| RF-3 | §1 |
| RF-4 | §1 |
| RF-5 | §2 Listado, grupos, orden y filtro |
| RF-6 | §2; §5 |
| RF-7 | §2 |
| RF-8 | §2 |
| RF-9 | §2 |
| RF-10 | §3 Formulario |
| RF-11 | §3 |
| RF-12 | §4 Imágenes |
| RF-13 | §4 |
| RF-14 | §4 |
| RF-15 | §4 |
| RF-16 | §4 |
| RF-17 | §4 |
| RF-18 | §4 |
| RF-19 | §3 |
| RF-20 | §3 |
| RF-21 | §3 |
| RF-22 | §2; §3 |
| RF-23 | §5 Etapa y posesión |
| RF-24 | §5 |
| RF-25 | §5; §6 |
| RF-26 | §6 Publicar y despublicar |
| RF-27 | §6 |
| RF-28 | §6 |
| RF-29 | §6 |
| RF-30 | §6 |
| RF-31 | §6 |
| RF-32 | §7 Eliminar |
| RF-33 | §7 |
| RF-34 | §7 |
| RF-35 | §8 Publicar catálogo |
| RF-36 | §8 |
| RF-37 | §8 |
| RF-38 | §8 |
| RF-39 | §9 Modales |
| RF-40 | §9 |
| RF-41 | §9 |
| RF-42 | §9 |
| RF-43 | §10 Cliente HTTP |
| RF-44 | §10 |
| RF-45 | §10; §3; §6; §8 |
| RF-46 | §10; §3 |
| RF-47 | §10; §6 |
| RF-48 | §10; §6 |
| RF-49 | §10; §7 |
| RF-50 | §10; §8 |
| RF-51 | §10; §1 |
| RF-52 | §10 |
| RF-53 | §11 Recuperación ante 401 |

**Cobertura:** RF-1 … RF-53 (todos).

## Fuera de alcance (no implementar en este plan)

- Implementar `panel-api`, `catalog-api`, MinIO o infraestructura.
- Definir y persistir el esquema definitivo de productos.
- Subir imágenes a MinIO desde el panel.
- Implementar autenticación (se reutiliza el login Google de la spec 001).
- Llamar a `fes-catalog-api` directamente.
- Publicar o leer el catálogo en la tienda (`fes-client-web`).
- Validar reglas de negocio de precio, moneda o stock más allá de capturarlos.
- Añadir NgRx u otras dependencias de estado.

## Orden de implementación sugerido

1. Rutas, navegación del aside y modelos/constantes del catálogo — RF-1–RF-4, RF-23–RF-25.
2. `LocalCatalog` (`sessionStorage`) y `PanelCatalog` (`/panel/catalog/*`, credenciales, 401) — RF-20, RF-43–RF-52.
3. `Catalog` (grupos, orden, filtro, alta/edición local vs servidor) — RF-5–RF-9, RF-19, RF-21, RF-22.
4. Vistas de listado y formulario + `product-images` y `product-status` — RF-10–RF-16.
5. Acciones publicar/despublicar/eliminar/publicar catálogo + `confirm-dialog` — RF-26–RF-42, RF-44–RF-50.
6. `CatalogRecovery` y reintento tras 401 — RF-53.
7. Barrido de frontera (sin `fes-catalog-api`/MinIO/secretos), `npm test` y demo manual móvil/escritorio — RF-1–RF-53.
