# Plan 002 — Catálogo: ABM local, estados y publicación

## Resumen técnico

Implementar en `panel-web` (Angular 21, SPA standalone, TypeScript estricto) la sección «Catálogo»: listado, alta y edición de productos con etapa (`draft`/`published`) y posesión (con o sin dueño). Sin sesión, los productos viven solo en la sesión local del navegador (`sessionStorage`); con sesión, la cuenta gestiona los productos del servidor. Los productos locales sin dueño **no** se asocian al iniciar sesión: se muestran en un grupo separado y pasan a la cuenta al publicarlos («Publicar») o al publicar el catálogo («Publicar catálogo»). El filtro por nombre lo resuelve el backend (`GET /panel/catalog/products?name=...`), con los locales sin dueño filtrados en el cliente y sin filtrado en vivo. El shell es responsive: menú lateral colapsable en escritorio, barra superior con menú desplegable en móvil y layout de alto fijo con scroll solo del contenido. La sesión se hidrata antes de renderizar y el login/logout conservan la ruta actual. Cada operación con sesión pasa por `fes-panel-api` (`/panel/catalog/...`) con la cookie `fes_session`; un 401 reinicia el login y reintenta la operación. El panel no define el esquema definitivo ni sube imágenes a MinIO.

**Gobernanza:** aplican `AGENTS.md`, `/admin-ui-arquitecture` (shell, sidebar, `views/`, `core/` por categoría), `/angular-developer` (signals, `HttpClient` como Observables, formularios reactivos en v21, lazy routes, accesibilidad) y `/ui-ux-pro-max` (accesibilidad, touch, feedback, responsive, lenguaje Admin UI ya establecido en `src/styles.css`).

**Dependencias as-built:** se incorporan `@angular/forms` (formularios reactivos) y `lucide-angular` (iconos). No se añade NgRx ni otra librería de estado: el estado se modela con signals locales.

## Historias cubiertas

- H1 → alta y edición sin sesión (RF-19, RF-20).
- H2 → alta y edición con sesión como draft de la cuenta (RF-21, RF-22, RF-45, RF-46).
- H3 → etapa visible y distinción de los sin dueño (RF-23, RF-24, RF-25).
- H4 → publicar, despublicar y eliminar con modal (RF-26–RF-34, RF-39–RF-42).
- H5 → publicar catálogo y tomar posesión (RF-35–RF-38, RF-50).
- H6 → separar locales sin dueño de los ya asociados (RF-6, RF-7, RF-8, RF-9, RF-70, RF-71).
- H7 → navegación compacta en escritorio y móvil (RF-54–RF-59, RF-77–RF-80).
- H8 → aviso de productos locales que se pueden perder (RF-72).

## Estado actual del proyecto (as-built)

- Shell Admin UI persistente en `src/app/app.ts` / `app.html`: layout `h-dvh` con header móvil fijo, `<aside>` colapsable en escritorio, barra de filtros/secciones, `<main>` con `overflow-hidden` y `<router-outlet />`.
- `app.routes.ts`: `''` → `HomeView`; `catalog`, `catalog/new` y `catalog/:id/edit` con `loadComponent()` y `title` en español; `'**'` → redirect.
- `app.config.ts`: `provideRouter`, `provideHttpClient()` y `provideAppInitializer` que llama `Session.hydrate()` y **espera** `Session.whenHydrated`.
- Sesión: `Session` (signals `status`, `profile`, `notice`, `authenticated`; acciones `hydrate`, `enterWithGoogle` con `return_to`, `logout` con recarga) y `PanelSession` (`/panel/identity/*`).
- Catálogo: servicios `Catalog`, `PanelCatalog`, `LocalCatalog`, `CatalogRecovery` e `ImageCarousel`; componentes genéricos `ConfirmDialog`, `ImageSelector`, `Gallery` y `StatusPill`; vistas `CatalogListView` y `CatalogFormView`.
- Environments `src/environments/*` con `apiBaseUrl` sin barra final.
- Estilos globales Tailwind v4 + Fira Sans / Fira Code, tema Admin UI oscuro, `html,body{height:100%}` y `body{overflow:hidden}`.
- Convenciones: código en inglés, textos en español; presentación ≠ HTTP ≠ estado; hosts de API fuera de componentes; sin credenciales en bundle; CSS legible (una declaración por línea, media queries en líneas propias).
- Frontera de este corte: únicamente rutas `/panel/catalog/*` del anfitrión configurado; no se llama a `fes-catalog-api` ni a MinIO.

## Decisiones de arquitectura

- **Shell y navegación:** la navegación de secciones vive en el `App` (chrome global); `/catalog` es una vista routeada. El aside se colapsa en escritorio con la signal `collapsed` y los iconos `PanelLeftClose`/`PanelLeftOpen`; en móvil se muestra una barra superior fija y el menú lateral se despliega con `menuOpen`, cerrándose al elegir una opción.
- **Rutas perezosas:** `catalog-list` y `catalog-form` se cargan con `loadComponent()` para no engordar el bundle inicial.
- **Estado con signals:** `Catalog` es la fuente de verdad del listado visible (locales + servidor), del filtro, del orden y de la posesión; los componentes presentacionales reciben `input()` y emiten `output()`.
- **Persistencia local desacoplada:** `LocalCatalog` encapsula `sessionStorage` (sesión local del navegador, no `localStorage`) detrás de una interfaz; el estado y las vistas no tocan el almacenamiento directamente.
- **HTTP como Observables:** `PanelCatalog` usa `HttpClient` con `withCredentials: true` y devuelve Observables; el estado se suscribe con `subscribe({ next, error })` (sin `firstValueFrom` / `lastValueFrom` / `toPromise`). No se construyen URLs fuera del cliente HTTP.
- **Filtro resuelto por el backend:** `Catalog.applyFilter(name)` fija la signal `filter` y, con sesión, llama `PanelCatalog.list(name)` que arma `HttpParams` con `name` (`?name=...`); sin sesión solo aplica el filtro al cliente. Los locales sin dueño se filtran en el cliente con `applyLocalFilter`, con o sin sesión. No hay filtrado en vivo: el input tiene un borrador (`filterDraft`) y se aplica con el botón «Aplicar filtros» o Enter; «Eliminar filtros» limpia y recarga.
- **401 sin interceptor circular:** el interceptor idiomático no se usa aquí para evitar el ciclo `Session → PanelCatalog → HttpClient → interceptor → Session`. El estado de catálogo detecta `status === 401` en el callback de error, delega en `CatalogRecovery` y llama `Session.enterWithGoogle()`; al volver con sesión, `Catalog.resumePending()` reintenta la operación. El criterio es único para guardar, publicar, despublicar, eliminar y publicar catálogo (RF-53).
- **Formularios reactivos:** Angular 21 no tiene Signal Forms estables (llegan en v22); se usa `ReactiveFormsModule` (`@angular/forms`) con validación síncrona y mensajes de error junto al campo.
- **Publicación de un local sin dueño:** como el producto no existe en el servidor, «Publicar» primero lo crea en la cuenta (`POST /panel/catalog/products`) y luego lo publica (`POST /panel/catalog/products/{id}/publish`); «Publicar catálogo» crea primero los locales sin dueño y luego invoca `POST /panel/catalog/publish`.
- **Acciones solo-icono:** las acciones de tarjeta y de menú usan iconos Lucide con `aria-label` y `title`, sin texto visible, para mantener compacta la Admin UI.
- **Hidratación antes de renderizar:** `provideAppInitializer` devuelve `Session.whenHydrated`, que resuelve tras `getSession` (con `timeout(5000)`), evitando la carrera que dejaba el catálogo vacío al arrancar con sesión.
- **Login/logout con ruta actual:** `Session.enterWithGoogle()` pasa `router.url` como `return_to` (`/panel/identity/login/google?return_to=...`); `Session.logout()` limpia el estado y recarga la página en la ruta actual vía `ExternalNavigation.reload()`.
- **Layout de alto fijo:** el host del shell usa `h-dvh`, `html,body{height:100%;overflow:hidden}` y el contenido scrollea dentro de su propia caja con el padding inferior (`pb-4 md:pb-6`).

## Estructura de carpetas (as-built)

```
src/
  environments/
    environment.ts / environment.development.ts   # apiBaseUrl (sin cambios)
  app/
    app.config.ts                                 # provideHttpClient + initializer que espera whenHydrated
    app.routes.ts                                 # '' Home; 'catalog'; 'catalog/new'; 'catalog/:id/edit'
    app.ts / app.html                             # shell h-dvh + nav (House/Boxes) + colapso + header móvil
    core/
      components/
        confirm-dialog/                           # modal reutilizable (foco atrapado, Escape, cancelable)
        gallery/                                  # Gallery (app-gallery): galería genérica de solo lectura
        image-selector/                           # ImageSelector (app-image-selector): selección/validación genérica
        status-pill/                              # StatusPill (app-status-pill): badge genérico label + tone
        session-bar/                              # control de sesión (entrar/salir) + perfil
      constants/
        product-stage.ts                          # draft | published
        product-origin.ts                         # local | server
        product-limits.ts                         # MAX_IMAGES = 10, MAX_IMAGES_WITHOUT_SESSION = 1, MAX_IMAGE_BYTES = 2 MB
        catalog-storage-keys.ts                   # claves de sessionStorage
        session-status.ts                         # anonymous | authenticated
      models/
        catalog-product.ts                        # CatalogProduct, Currency, EditableProduct; imágenes como ImageItem[]
        image-item.ts                             # ImageItem { id, name?, url?, dataUrl?, file? }
        pending-catalog-operation.ts              # intención pendiente tras 401
      services/
        navigation/
          external-navigation.ts                  # navigateTo + reload (login/logout)
        session/
          session.ts                              # signals, whenHydrated, return_to, logout+reload
          panel-session.ts                        # HTTP /panel/identity/*
        catalog/
          catalog.ts                              # estado (signals) + listado/filtro/orden + acciones
          panel-catalog.ts                        # HTTP {apiBaseUrl}/panel/catalog/* (?name=, FormData)
          local-catalog.ts                        # persistencia sessionStorage
          catalog-recovery.ts                     # guarda y reintenta la operación tras 401
        media/
          image-carousel.ts                       # estado reusable de carousel, provisto por componente
    views/
      catalog-list/                               # /catalog
      catalog-form/                               # /catalog/new y /catalog/:id/edit (vista compartida)
```

## Capas

| Capa | Responsabilidad | No hace |
|------|-----------------|---------|
| Presentación (`views/catalog-list`, `views/catalog-form`, `core/components/*`, `App`) | Shell colapsable/responsive; listado con separación accesible; header con filtro y acciones; formularios; modales; galería; badges de etapa; estados de carga/vacío/error; accesibilidad | No construye URLs de API ni decide la persistencia ni la posesión |
| Estado (`core/services/catalog/catalog.ts`) | Fuente de verdad del listado visible (locales sin dueño + servidor de la cuenta), filtro (backend + local), orden, etapa/posesión y acciones (guardar, publicar, despublicar, eliminar, publicar catálogo) | No habla HTTP directo ni toca `sessionStorage` |
| HTTP (`core/services/catalog/panel-catalog.ts`) | Solo `{apiBaseUrl}/panel/catalog/*` con credenciales; `?name=` y `multipart/form-data` | No traduce dominio ni persiste local |
| Almacenamiento local (`core/services/catalog/local-catalog.ts`) | CRUD de productos locales en `sessionStorage` | No llama a la red |
| Recuperación (`core/services/catalog/catalog-recovery.ts`) | Recuerda la operación ante 401 y la reintenta tras autenticar | No arma URLs ni pinta UI |
| Navegación externa (`core/services/navigation/external-navigation.ts`) | `navigateTo` (login Google) y `reload` (logout en la ruta actual) | No conoce el dominio del catálogo |
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

Producto local (solo en el navegador): mismo shape visible con `origin: "local"`, `owned: false`, `stage: "draft"` e `images: [{ id, name, dataUrl, file? }]`. `ImageItem` define `{ id, name?, url?, dataUrl?, file? }`, y tanto `CatalogProduct` como `EditableProduct` usan `ImageItem[]`. El modelo unificado `CatalogProduct` agrega `origin` (`local` | `server`) y `owned` (booleano) para que la UI decida la separación, el borde rojo y las acciones sin conocer detalles de transporte.

Operación pendiente tras 401 (persistida en `sessionStorage`): `{ kind: 'save' | 'publish' | 'unpublish' | 'delete' | 'publishCatalog', productId?, productOrigin?, payload? }`.

## Contrato HTTP consumido (frontera `fes-panel-api`, cookie `fes_session`)

| Operación | Método y path | RF |
|-----------|---------------|----|
| Listar productos de la cuenta (filtro opcional) | `GET {apiBaseUrl}/panel/catalog/products?name=...` | RF-44, RF-66 |
| Crear producto (draft con dueño) | `POST {apiBaseUrl}/panel/catalog/products` | RF-45 |
| Actualizar producto | `PUT {apiBaseUrl}/panel/catalog/products/{id}` | RF-46 |
| Publicar un producto | `POST {apiBaseUrl}/panel/catalog/products/{id}/publish` | RF-47 |
| Despublicar un producto | `POST {apiBaseUrl}/panel/catalog/products/{id}/unpublish` | RF-48 |
| Eliminar producto con dueño | `DELETE {apiBaseUrl}/panel/catalog/products/{id}` | RF-49 |
| Publicar catálogo (toma posesión y publica los draft de la sesión) | `POST {apiBaseUrl}/panel/catalog/publish` | RF-50 |

Todas con `withCredentials: true`. El cuerpo de crear/actualizar es `FormData` (`multipart/form-data`) con `name`, `price`, `currency`, `stock` (si existe) y la parte repetida `images` (hasta 10 archivos ≤ 2 MB). El nombre exacto de las partes se fija contra el contrato compartido de `panel-api`/`catalog-api`; el cliente HTTP encapsula ese detalle. El panel no llama a `fes-catalog-api` (RF-51) ni a MinIO (RF-52).

## Desglose técnico por capacidad

### §1. Shell, navegación, layout y rutas

**Cubre:** RF-1, RF-2, RF-3, RF-4, RF-54–RF-61, RF-77–RF-80

- `App` (`app.ts`/`app.html`): contenedor `flex h-dvh flex-col overflow-hidden md:flex-row`. Header móvil fijo (`md:hidden`) con logo, texto «Panel», botón de menú (`Menu`/`X`) y control de sesión. `<aside>` oculto en móvil y visible en `md+`, con `collapsed` que lo lleva a `md:w-16` (solo iconos) o `md:w-60`, y toggle `PanelLeftClose`/`PanelLeftOpen`. Navegación con `routerLink`/`routerLinkActive`: Inicio (`House`) y Catálogo (`Boxes`); `session-bar` emite entrar (`LogIn`) o salir (`LogOut`). El menú móvil se abre con `menuOpen` y cada opción llama `closeMenu()`.
- `main` con `overflow-hidden` y `<router-outlet />`; el padding inferior vive en el contenido scrollable de cada vista.
- `app.routes.ts`: `catalog` → `CatalogListView`, `catalog/new` y `catalog/:id/edit` → `CatalogFormView`, con `loadComponent()` y `title` en español.
- `styles.css`: `html,body{height:100%}` y `body{overflow:hidden}` para el alto fijo sin scroll de cuerpo.

### §2. Listado, separación, orden y filtro

**Cubre:** RF-5, RF-6, RF-7, RF-8, RF-9, RF-65–RF-72

- `Catalog` calcula con `computed()`:
  - sin sesión: `localGroup` con productos locales filtrados en cliente (RF-5, RF-67);
  - con sesión: `localGroup` (locales sin dueño, filtrados en cliente) y `accountGroup` (productos del servidor `draft` + `published`) (RF-6, RF-7, RF-67).
- Orden por `createdAt` descendente en ambos grupos (RF-8).
- `CatalogListView.groups()` arma secciones sin título visible, con `aria-label` por sección (RF-70). Cada tarjeta sin dueño lleva `inset-ring-1 inset-ring-destructive/60` (RF-71). Si `hasLocalProducts()`, se muestra un aviso `role="status"` (RF-72).
- Filtro: input `type="search"` con borrador local `filterDraft`; «Aplicar filtros» (`Funnel`) o Enter llaman `catalog.applyFilter(filterDraft())` (RF-65, RF-66, RF-69); «Eliminar filtros» (`FunnelX`) llama `catalog.clearFilters()` (RF-68). Sin sesión, el filtro del servidor no aplica y solo se filtra en cliente.
- Estados de carga (`loading`), vacío (sin grupos; mensaje distinto si hay filtro) y error (`error`), más `actionError` para fallos de acciones.

### §3. Formulario de producto (vista compartida)

**Cubre:** RF-10, RF-11, RF-19, RF-20, RF-21

- `CatalogFormView` sirve `/catalog/new` y `/catalog/:id/edit`: con `id` carga el producto (local o servidor); sin `id` parte de un producto vacío. Si no lo encuentra, muestra error con enlace de vuelta.
- `ReactiveFormsModule` con `name` (obligatorio), `price` (numérico, ≥ 0), `currency` (`ARS` por defecto, `USD`) y `stock` opcional (≥ 0) (RF-10, RF-11).
- Al guardar: `Catalog.save()` decide; sin sesión o producto local → `LocalCatalog` (`sessionStorage`) (RF-19, RF-20); con sesión → `POST` (nuevo) o `PUT` (existente) y refresca el listado (RF-21, RF-45, RF-46).
- Mensajes de error junto al campo, `saving` con texto «Guardando…» y `saveError` para fallos.

### §4. Imágenes: límites, galería y placeholder

**Cubre:** RF-12, RF-13, RF-14, RF-15, RF-16, RF-17, RF-18, RF-75, RF-76

- `ImageSelector` (`app-image-selector`) gestiona de forma genérica el alta con `input type="file" multiple`, `FileReader`, validación de cantidad/tamaño, eliminación y navegación por teclado. Recibe `images`, `maxImages`, `maxImageBytes`, `label`, `helperText`, `limitExceededMessage`, `accept` e `inputId`, y emite `imagesChange`; no importa autenticación ni dominio de producto. `CatalogFormView` conserva las reglas de sesión/producto y le pasa hasta `MAX_IMAGES` (10) de `MAX_IMAGE_BYTES` (2 MB) con sesión o `MAX_IMAGES_WITHOUT_SESSION` (1) y los textos correspondientes (RF-12–RF-18). El máximo es 1 si no hay sesión **o** si el producto editado todavía es local sin dueño (aunque haya sesión), con un mensaje que invita a publicarlo para adjuntar más (RF-13, RF-81).
- `Gallery` (`app-gallery`) recibe `images` y `alt` genéricos y es de solo lectura: muestra `url` o `dataUrl` con controles ‹/› y etiqueta `n / total` cuando hay más de una imagen (RF-75). `CatalogListView` le pasa las imágenes y el nombre como texto alternativo, y solo la renderiza si `product.images.length > 0` (RF-76).
- Ambos componentes declaran `providers: [ImageCarousel]`; el servicio reusable conserva `items`/`activeIndex` y expone `current`, `source`, `total`, `hasMany`, `indexLabel`, `setImages`, `next` y `previous`. No está registrado con `providedIn: 'root'`, por lo que cada instancia de componente mantiene un carrusel aislado.

### §5. Etapa y posesión

**Cubre:** RF-23, RF-24, RF-25, RF-73

- `StatusPill` (`app-status-pill`) muestra un badge genérico a partir de `label` y `tone` (`accent` | `muted` | `destructive`), sin importar `PRODUCT_STAGE` ni conocer el catálogo. `CatalogListView` traduce la etapa a label/tone y no muestra pill de posesión (RF-23, RF-73).
- La posesión se representa como borde/inset-ring rojo en la tarjeta del producto sin dueño (RF-24).
- La UI nunca ofrece pasar un producto sin dueño a `published` sin tomar posesión; ese estado no es alcanzable en el flujo normal (RF-25).

### §6. Publicar y despublicar un producto

**Cubre:** RF-26, RF-27, RF-28, RF-29, RF-30, RF-31, RF-47, RF-48, RF-74

- En etapa `draft` se ofrece «Publicar» (icono `Eye`) (RF-26, RF-74); sin sesión se marca `aria-disabled`, con `aria-describedby` a la ayuda y `title` que indica que se requiere sesión (RF-27, RF-28).
- En etapa `published` se ofrece «Despublicar» (icono `EyeOff`) (RF-30, RF-74).
- Confirmado «Publicar» (RF-39): si el producto es local sin dueño, `Catalog.publish()` lo crea en la cuenta (`POST /panel/catalog/products`) y lo publica (`POST .../{id}/publish`), quitándolo de `sessionStorage` (RF-29, RF-45, RF-47); si es un draft del servidor, solo publica (RF-47).
- Confirmado «Despublicar» (RF-40): `POST .../{id}/unpublish` y el producto pasa a `draft` (RF-31, RF-48).

### §7. Eliminar según posesión

**Cubre:** RF-32, RF-33, RF-34, RF-49, RF-74

- «Eliminar» (icono `Trash2`) visible en cada producto (RF-32, RF-74) y detrás de modal de confirmación (RF-41).
- Con dueño: `DELETE {apiBaseUrl}/panel/catalog/products/{id}` y se quita del listado (RF-33, RF-49). Local sin dueño: se quita de `sessionStorage`, sin red (RF-34).

### §8. Publicar catálogo

**Cubre:** RF-35, RF-36, RF-37, RF-38, RF-50

- «Publicar catálogo» (icono `Eye`) se habilita cuando `canPublishCatalog()` (algún draft visible) y hay sesión (RF-35); sin sesión queda `aria-disabled` con indicación de que se requiere sesión (RF-36).
- Confirmado (RF-42): `Catalog.publishCatalog()` toma los draft visibles —locales sin dueño + draft del servidor de la cuenta— (RF-38), crea los locales en la cuenta (`POST /panel/catalog/products`) y luego invoca `POST {apiBaseUrl}/panel/catalog/publish`, publicando y tomando posesión de todos (RF-37, RF-50). Al terminar, recarga el listado del servidor y vacía los locales ya asociados.
- La operación es cancelable antes de ejecutarse y reporta éxito o error sin dejar el listado inconsistente.

### §9. Modales de confirmación

**Cubre:** RF-39, RF-40, RF-41, RF-42

- `ConfirmDialog` es reutilizable: título, mensaje, acción principal y «Cancelar»; cierra con Escape y con el botón de cancelar sin ejecutar la acción (NFR). `destructive` colorea la confirmación de «Eliminar».
- Se usa para publicar, despublicar, eliminar y publicar catálogo (RF-39–RF-42), con foco inicial, `role="dialog"`, `aria-modal` y retorno de foco al abridor.

### §10. Cliente HTTP de frontera

**Cubre:** RF-43, RF-44, RF-45, RF-46, RF-47, RF-48, RF-49, RF-50, RF-51, RF-52

- `panel-catalog.ts` construye únicamente `${environment.apiBaseUrl}/panel/catalog/[...]` con `withCredentials: true` (RF-43). `list(name?)` agrega `HttpParams` con `name` cuando existe (RF-44, RF-66). `create`/`update` envían `FormData` (`name`, `price`, `currency`, `stock`, `images`) (RF-45, RF-46). El resto de métodos usa los paths de publicar, despublicar, eliminar y publicar catálogo (RF-47–RF-50).
- Prohibido referenciar `fes-catalog-api` (RF-51), MinIO (RF-52) o credenciales en el bundle.
- Todos los métodos devuelven Observables; el estado los consume con `subscribe({ next, error })`.

### §11. Recuperación ante 401

**Cubre:** RF-53

- Cuando cualquier operación con sesión falla con 401, `Catalog.fail()` delega en `CatalogRecovery.remember(...)` con la intención (y el payload si aplica), y luego llama `Session.enterWithGoogle()`.
- La intención queda en `sessionStorage` (`fes.catalog.pending-operation`) para sobrevivir a la navegación completa del login. Al volver autenticado, el `effect` de `Catalog` detecta `authenticated()` y llama `resumePending()`, que reintenta la operación una vez y limpia la intención; un 401 repetido no genera bucles (`CatalogRecovery.resumeIfPending` limpia tanto en `next` como en `error`).

### §12. Sesión, arranque, login y logout

**Cubre:** RF-62, RF-63, RF-64

- `app.config.ts` registra `provideAppInitializer` que llama `Session.hydrate()` y devuelve `Session.whenHydrated`: las vistas esperan la sesión resuelta (RF-62). `hydrate()` aplica `timeout(5000)` y resuelve `whenHydrated` tanto en `next` como en `error`.
- `Session.enterWithGoogle()` toma `router.url` como `currentPath()` y `PanelSession.enterWithGoogle(returnTo)` navega a `/panel/identity/login/google?return_to=<ruta>` (RF-64).
- `Session.logout()` llama `PanelSession.logout()`; al responder, limpia el estado y `ExternalNavigation.reload()` recarga la ruta actual (no navega a home) (RF-63).

### §13. Componentes presentacionales y dependencias

**Cubre:** RF-15, RF-16, RF-23, RF-54–RF-56, RF-73–RF-76

- `StatusPill` (`app-status-pill`): inputs genéricos `label` y `tone`; la vista decide cómo representar la etapa.
- `Gallery` (`app-gallery`): inputs genéricos `images` y `alt`; delega el índice y la navegación a su `ImageCarousel` de instancia; solo lectura.
- `ImageSelector` (`app-image-selector`): inputs genéricos de imágenes, límites y textos; alta/validación con `FileReader`, eliminación, teclado, placeholder y emisión `imagesChange`; delega el carousel a su `ImageCarousel` de instancia.
- `ImageCarousel`: servicio reusable sin `providedIn: 'root'`; `Gallery` e `ImageSelector` lo declaran en `providers` para evitar compartir estado entre instancias.
- `ConfirmDialog`: modal reutilizable.
- `@angular/forms` habilita `ReactiveFormsModule`; `lucide-angular` provee los iconos usados (`House`, `Boxes`, `LogIn`, `LogOut`, `Menu`, `X`, `PanelLeftClose`, `PanelLeftOpen`, `Funnel`, `FunnelX`, `Eye`, `EyeOff`, `Pencil`, `Trash2`, `Plus`, `EllipsisVertical`).

## Cambios de UI (Admin Panel)

- Conservar el lenguaje visual Admin UI actual (Tailwind v4 + Fira Sans / Fira Code, tema oscuro) y el aside persistente (`/ui-ux-pro-max`, `/admin-ui-arquitectura`).
- Shell de alto fijo: header fijo, contenido con scroll propio y padding inferior dentro del área scrollable.
- Listado sin títulos de grupo visibles, separación accesible por `aria-label`; tarjetas con borde rojo cuando no tienen dueño y aviso `role="status"` de productos locales.
- Header con título a la izquierda y acciones a la derecha (`items-end`); filtro por nombre dentro del header; en `sm+` botones inline «Publicar catálogo» y «Nuevo producto», en móvil un menú `EllipsisVertical`.
- Acciones de tarjeta solo-icono con `aria-label`/`title`; jerarquía clara y acciones destructivas en color `destructive`.
- Galería de solo lectura a la derecha de la tarjeta solo si hay imágenes; placeholder en el formulario cuando no las hay.
- Controles ≥ 44 px, contraste 4.5:1, foco visible, `prefers-reduced-motion` respetado (transiciones con `motion-reduce`).
- Formulario con etiquetas visibles, error junto al campo y feedback de guardado.
- CSS legible: una declaración por línea, una regla separada de la siguiente y media queries con su contenido en líneas propias.

## Pruebas y verificación

Alineado con `AGENTS.md` (`npm test` = unit + lint + build):

| Verificación | RF |
|--------------|----|
| «Catálogo» en el aside; rutas `catalog`, `catalog/new`, `catalog/:id/edit` | RF-1–RF-4 |
| Nav con iconos, colapso en escritorio, barra y menú móvil | RF-54–RF-59 |
| Layout `h-dvh` sin scroll de body; padding en contenido scrollable | RF-60, RF-61 |
| Listado sin sesión (solo locales) / con sesión (sin dueño + servidor); sin títulos visibles | RF-5–RF-7, RF-70 |
| Orden por creación reciente; filtro por backend `?name=`; locales en cliente; aplicar/limpiar | RF-8, RF-9, RF-65–RF-69 |
| Tarjeta: solo etapa, borde rojo sin dueño, galería a la derecha, acciones icon-only, aviso de locales | RF-71–RF-76 |
| Header: título/acciones `items-end`, botones inline `sm+`, dropdown móvil, filtro dentro | RF-77–RF-80 |
| Alta/edición con `name`, `price`, `currency` (ARS por defecto, USD), `stock` | RF-10, RF-11 |
| Imágenes: 10×2 MB con sesión; 1 con aviso sin sesión; carousel; placeholder; rechazos | RF-12–RF-18 |
| Guardar sin sesión solo en `sessionStorage`; con sesión crea/actualiza draft | RF-19–RF-21 |
| Login con locales sin dueño no los asocia y los agrupa aparte | RF-6, RF-22 |
| Badge de etapa; `published` sin dueño no alcanzable | RF-23, RF-25, RF-73 |
| «Publicar» habilita/deshabilita (aviso) y publica tomando posesión del local | RF-26–RF-29, RF-47 |
| «Despublicar» pasa a `draft` | RF-30, RF-31, RF-48 |
| «Eliminar» borra en servidor si hay dueño o solo en la sesión si es local | RF-32–RF-34, RF-49 |
| «Publicar catálogo» habilita con cambios, deshabilita sin sesión y publica los draft visibles | RF-35–RF-38, RF-50 |
| Modales de confirmación cancelables en las cuatro acciones | RF-39–RF-42 |
| Cookie `fes_session` y paths `/panel/catalog/*`; sin `fes-catalog-api` ni MinIO | RF-43–RF-52 |
| 401 → login + reintento único de la operación | RF-53 |
| Hidratación antes de renderizar; login con `return_to`; logout recarga la ruta actual | RF-62–RF-64 |

Unitarios prioritarios: `Catalog` (grupos, orden, filtro backend/local, guardar local/servidor, publicar/despublicar/eliminar/publicar catálogo con mocks), `PanelCatalog` (paths, `?name=`, credenciales y 401), `LocalCatalog` (`sessionStorage`), `CatalogRecovery` (recordar/reintentar/descartar), `Session`/`PanelSession` (`return_to`, `reload`) y las vistas con `TestBed`. Demo manual móvil/escritorio del flujo principal.

## Matriz de cobertura de RF

| RF | Sección del plan |
|----|------------------|
| RF-1 | §1 Shell, navegación, layout y rutas |
| RF-2 | §1 |
| RF-3 | §1 |
| RF-4 | §1 |
| RF-5 | §2 Listado, separación, orden y filtro |
| RF-6 | §2; §5 |
| RF-7 | §2 |
| RF-8 | §2 |
| RF-9 | §2; §10 |
| RF-10 | §3 Formulario |
| RF-11 | §3 |
| RF-12 | §4 Imágenes |
| RF-13 | §4 |
| RF-14 | §4 |
| RF-15 | §4; §13 |
| RF-16 | §4; §13 |
| RF-17 | §4 |
| RF-18 | §4 |
| RF-19 | §3 |
| RF-20 | §3 |
| RF-21 | §3 |
| RF-22 | §2; §3 |
| RF-23 | §5 Etapa y posesión; §13 |
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
| RF-44 | §10; §2 |
| RF-45 | §10; §3; §6; §8 |
| RF-46 | §10; §3 |
| RF-47 | §10; §6 |
| RF-48 | §10; §6 |
| RF-49 | §10; §7 |
| RF-50 | §10; §8 |
| RF-51 | §10; §1 |
| RF-52 | §10 |
| RF-53 | §11 Recuperación ante 401 |
| RF-54 | §1; §13 |
| RF-55 | §1; §13 |
| RF-56 | §1; §13 |
| RF-57 | §1 |
| RF-58 | §1 |
| RF-59 | §1 |
| RF-60 | §1 |
| RF-61 | §1 |
| RF-62 | §12 Sesión, arranque, login y logout |
| RF-63 | §12 |
| RF-64 | §12 |
| RF-65 | §2 |
| RF-66 | §2; §10 |
| RF-67 | §2 |
| RF-68 | §2 |
| RF-69 | §2 |
| RF-70 | §2 |
| RF-71 | §2 |
| RF-72 | §2 |
| RF-73 | §5; §13 |
| RF-74 | §6; §7; §13 |
| RF-75 | §4; §13 |
| RF-76 | §4; §13 |
| RF-77 | §1 |
| RF-78 | §1 |
| RF-79 | §1 |
| RF-80 | §1 |

**Cobertura:** RF-1 … RF-80 (todos).

## Fuera de alcance (no implementar en este plan)

- Implementar `panel-api`, `catalog-api`, MinIO o infraestructura.
- Definir y persistir el esquema definitivo de productos.
- Subir imágenes a MinIO desde el panel.
- Implementar autenticación (se reutiliza el login Google de la spec 001).
- Llamar a `fes-catalog-api` directamente.
- Publicar o leer el catálogo en la tienda (`fes-client-web`).
- Validar reglas de negocio de precio, moneda o stock más allá de capturarlos.
- Añadir NgRx u otras dependencias de estado (solo se suman `@angular/forms` y `lucide-angular`).
- Filtrado en vivo mientras se escribe.
- Persistencia local más allá de la pestaña (`sessionStorage`).

## Orden de implementación sugerido

1. Rutas, navegación del aside, shell colapsable/móvil, layout de alto fijo y modelos/constantes del catálogo — RF-1–RF-4, RF-23–RF-25, RF-54–RF-61, RF-77–RF-80.
2. `LocalCatalog` (`sessionStorage`) y `PanelCatalog` (`/panel/catalog/*`, credenciales, `?name=`, FormData, 401) — RF-20, RF-43–RF-52, RF-66.
3. `Catalog` (grupos, orden, filtro backend/local, alta/edición local vs servidor) — RF-5–RF-9, RF-19, RF-21, RF-22, RF-65–RF-69.
4. Vistas de listado y formulario + `ImageSelector`, `Gallery`, `StatusPill` y `ConfirmDialog` — RF-10–RF-18, RF-70–RF-76.
5. Acciones publicar/despublicar/eliminar/publicar catálogo — RF-26–RF-42, RF-44–RF-50.
6. `CatalogRecovery`, `Session.whenHydrated`, login `return_to` y logout con recarga — RF-53, RF-62–RF-64.
7. Barrido de frontera (sin `fes-catalog-api`/MinIO/secretos), `npm test` y demo manual móvil/escritorio — RF-1–RF-80.
