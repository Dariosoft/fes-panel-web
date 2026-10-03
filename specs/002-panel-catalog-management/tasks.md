# Tasks 002 — Catálogo: ABM local, estados y publicación

Ordenadas por dependencia. Cada tarea ~20–30 min. No implementar fuera de este listado.

## Modelos, constantes y rutas

- [x] **T1.** Crear `core/models/catalog-product.ts` (`CatalogProduct`, `ProductImage`, `Currency`, `EditableProduct`) y `core/models/pending-catalog-operation.ts`; crear las constantes `core/constants/product-stage.ts` (`draft` | `published`), `product-origin.ts` (`local` | `server`), `product-limits.ts` (`MAX_IMAGES = 10`, `MAX_IMAGE_BYTES = 2 * 1024 * 1024`) y `catalog-storage-keys.ts` (claves de `sessionStorage`).
  **RFs:** RF-11, RF-12, RF-23, RF-24, RF-25
  **Done when:** los tipos compilan en estricto, modelan producto local vs servidor con etapa y posesión, y no contienen hosts ni URLs.

- [x] **T2.** Registrar en `app.routes.ts` las rutas `catalog` → `CatalogListView`, `catalog/new` y `catalog/:id/edit` → `CatalogFormView` con `loadComponent()` y `title` en español; añadir el enlace «Catálogo» al aside persistente de `app.html` con `routerLink`/`routerLinkActive`, operable por teclado y visible desde 320 px.
  **RFs:** RF-1, RF-2, RF-3, RF-4
  **Done when:** se navega a las tres rutas dentro del shell, el enlace «Catálogo» aparece en el sidebar en móvil y escritorio, y el sidebar no se duplica dentro de las vistas.

## Persistencia y frontera HTTP

- [x] **T3.** Crear `core/services/catalog/local-catalog.ts` (`providedIn: 'root'`) con CRUD de productos locales sobre `sessionStorage` bajo `catalog-storage-keys.ts`; sin red y sin tocar `localStorage`.
  **RFs:** RF-20, RF-34
  **Done when:** guardar, leer y eliminar un producto local persiste solo en `sessionStorage` y sobrevive a la recarga de la pestaña.

- [x] **T4.** Crear `core/services/catalog/panel-catalog.ts` con `HttpClient` y `withCredentials: true`, un método por operación: `GET/POST /panel/catalog/products`, `PUT/DELETE /panel/catalog/products/{id}`, `POST .../{id}/publish`, `POST .../{id}/unpublish`, `POST /panel/catalog/publish`; para crear/actualizar, enviar el payload del producto con sus imágenes (`multipart/form-data`, parte `images`).
  **RFs:** RF-43, RF-44, RF-45, RF-46, RF-47, RF-48, RF-49, RF-50, RF-51, RF-52
  **Done when:** el cliente solo construye URLs bajo `{apiBaseUrl}/panel/catalog/*`, usa credenciales, devuelve Observables y no referencia `fes-catalog-api`, MinIO ni secretos.

- [x] **T5.** Crear `core/services/catalog/catalog-recovery.ts`: `remember(operation)` persiste la intención en `sessionStorage`, `resumeIfPending()` la reintenta una sola vez si hay sesión y la limpia (descartándola si vuelve a fallar con 401), y `clear()` la elimina.
  **RFs:** RF-53
  **Done when:** una intención guardada sobrevive a la recarga y se reintenta una única vez al volver autenticado, sin bucles.

## Estado del catálogo

- [x] **T6.** Crear `core/services/catalog/catalog.ts` (signals, `providedIn: 'root'`) como fuente de verdad: listado visible con grupos (sin sesión solo locales; con sesión «Locales sin dueño» y «De tu cuenta» con `draft` + `published`), orden por `createdAt` descendente y filtro por nombre con `computed()`.
  **RFs:** RF-5, RF-6, RF-7, RF-8, RF-9, RF-22
  **Done when:** alternar sesión cambia los grupos, los locales sin dueño nunca se fusionan con los del servidor, y el orden/filtro se derivan sin mutar la fuente.

- [x] **T7.** En `catalog.ts`, implementar guardar/editar: sin sesión persiste con `LocalCatalog`; con sesión crea (`POST`) o actualiza (`PUT`) el draft de la cuenta y refresca el listado de `.next(error)`.
  **RFs:** RF-19, RF-20, RF-21, RF-45, RF-46
  **Done when:** un guardado sin sesión no toca la red y uno con sesión llama al path correcto con credenciales y refleja el draft resultante.

## Componentes de presentación

- [x] **T8.** Crear `core/components/product-status/product-status.ts` presentacional con badges de etapa (`draft`/`published`) y de posesión («Sin dueño»/«De tu cuenta»).
  **RFs:** RF-23, RF-24
  **Done when:** los badges reflejan los `input()` y son legibles con contraste adecuado y sin depender solo del color.

- [x] **T9.** Crear `core/components/confirm-dialog/confirm-dialog.ts` reutilizable con `role="dialog"` + `aria-modal`, foco inicial en el diálogo, cierre con Escape y botón «Cancelar», y retorno de foco al abridor.
  **RFs:** RF-39, RF-40, RF-41, RF-42
  **Done when:** abrir y cancelar no ejecuta ninguna acción, el foco queda atrapado mientras está abierto y vuelve al botón de origen al cerrar.

- [x] **T10.** Crear `core/components/product-images/product-images.ts`: alta de archivos con `input type="file"` multiple; con sesión hasta 10 de 2 MB, sin sesión hasta 1 con aviso de que más requiere iniciar sesión; rechazar excedente y archivos grandes con mensaje; carousel accesible con teclado cuando hay imágenes y placeholder cuando no.
  **RFs:** RF-12, RF-13, RF-14, RF-15, RF-16, RF-17, RF-18
  **Done when:** con sesión se aceptan 10×2 MB, sin sesión la segunda imagen se rechaza con aviso, un archivo grande se rechaza, y el carousel/placeholder aparecen según haya o no imágenes.

## Vistas

- [x] **T11.** Crear `views/catalog-form/catalog-form.ts` (standalone, reactive forms) para `/catalog/new` y `/catalog/:id/edit`: campos `name`, `price`, `currency` (`ARS` por defecto, `USD`) y `stock` opcional; cargar el producto por `id`; guardar según sesión; integrar `product-images`; mensajes de error junto al campo y estado de guardado.
  **RFs:** RF-3, RF-4, RF-10, RF-11, RF-19, RF-21
  **Done when:** alta y edición comparten vista, `currency` arranca en `ARS`, `stock` puede quedar vacío y el error de campo se muestra junto al control.

- [x] **T12.** Crear `views/catalog-list/catalog-list.ts`: render del listado con búsqueda por nombre, separador «Locales sin dueño» y grupo «De tu cuenta» con badges de etapa/posesión, estados de carga, vacío y error, y navegación a alta/edición.
  **RFs:** RF-2, RF-5, RF-6, RF-7, RF-8, RF-9
  **Done when:** sin sesión solo se ven locales; con sesión se ven ambos grupos ordenados por creación reciente y el filtro por nombre reduce el resultado sin recargar.

## Acciones y recuperación 401

- [x] **T13.** Implementar «Publicar» un producto en `catalog.ts` + `catalog-list`: visible en `draft`, habilitado con sesión y deshabilitado sin sesión con tooltip accesible; al confirmar, publica y, si es local sin dueño, lo crea en la cuenta y lo publica.
  **RFs:** RF-26, RF-27, RF-28, RF-29, RF-47
  **Done when:** sin sesión el botón está deshabilitado con tooltip; con sesión un local sin dueño queda publicado y con dueño, y un draft del servidor pasa a `published`.

- [x] **T14.** Implementar «Despublicar»: visible en `published`; al confirmar llama `POST .../{id}/unpublish` y el producto pasa a `draft`.
  **RFs:** RF-30, RF-31, RF-48
  **Done when:** el producto con dueño pasa a `draft` tras confirmar y la petición usa el path y las credenciales correctas.

- [x] **T15.** Implementar «Eliminar»: visible en cada producto; al confirmar, con dueño borra en el servidor (`DELETE .../{id}`) y local sin dueño lo quita de `sessionStorage`.
  **RFs:** RF-32, RF-33, RF-34, RF-49
  **Done when:** eliminar un producto con dueño no afecta a otros y eliminar un local sin dueño no emite ninguna petición de red.

- [x] **T16.** Implementar «Publicar catálogo» en `catalog.ts` + `catalog-list`: habilitado cuando hay cambios sin publicar y deshabilitado sin sesión con indicación; al confirmar, crea los locales sin dueño y llama `POST /panel/catalog/publish` publicando y tomando posesión de los draft visibles.
  **RFs:** RF-35, RF-36, RF-37, RF-38, RF-50
  **Done when:** con sesión el botón publica los draft visibles (locales sin dueño + draft de la cuenta) y sin sesión queda deshabilitado con indicación.

- [x] **T17.** Cablear la recuperación 401 en todas las operaciones con sesión: ante `status === 401`, `Catalog` llama `CatalogRecovery.remember(...)`, luego `Session.enterWithGoogle()`, y al volver autenticado reintenta la operación pendiente.
  **RFs:** RF-53
  **Done when:** un mock 401 en guardar, publicar, despublicar, eliminar y publicar catálogo navega al login y, al volver con sesión, reintenta la operación una sola vez.

## Pruebas y verificación final

- [x] **T18.** Tests unitarios: `Catalog` (grupos, orden, filtro, guardar local/servidor, publicar, despublicar, eliminar, publicar catálogo), `PanelCatalog` (paths, credenciales y 401), `LocalCatalog` (`sessionStorage`), `CatalogRecovery` (recordar/reintentar/descartar) y vistas con `TestBed`.
  **RFs:** RF-5, RF-6, RF-7, RF-8, RF-9, RF-19, RF-20, RF-21, RF-29, RF-31, RF-33, RF-34, RF-37, RF-44, RF-53
  **Done when:** los tests cubren los flujos anteriores y pasan con el runner del proyecto.

- [x] **T19.** Barrido de frontera + `npm test` (unit + lint + build) + demo manual móvil/escritorio de: alta sin sesión, edición, alta con sesión, listado, publicar, despublicar, eliminar y publicar catálogo con sus modales.
  **RFs:** RF-1 … RF-53
  **Done when:** `npm test` pasa; no hay referencias a `fes-catalog-api`, MinIO ni secretos en el bundle; la demo verifica el checklist de la spec/plan.

## Iteraciones posteriores (as-built)

- [x] **T20.** Incorporar dependencias `@angular/forms` (formularios reactivos) y `lucide-angular` (iconos); reemplazar `provideHttpClient()`/módulos según haga falta sin añadir NgRx.
  **RFs:** RF-54, RF-55, RF-69, RF-74, RF-78, RF-79
  **Done when:** `package.json` fija `@angular/forms` y `lucide-angular`, el build resuelve los iconos usados y no se introduce otra librería de estado.

- [x] **T21.** Resolver el filtro por nombre en el backend: `PanelCatalog.list(name?)` con `HttpParams` (`GET /panel/catalog/products?name=...`), `Catalog.applyFilter`/`clearFilters` con `filter` como señal, `applyLocalFilter` para los locales sin dueño y UI en el header con input + «Aplicar filtros» (`Funnel`) + «Eliminar filtros» (`FunnelX`); sin filtrado en vivo (borrador `filterDraft`, aplica con botón o Enter).
  **RFs:** RF-9, RF-65, RF-66, RF-67, RF-68, RF-69
  **Done when:** con sesión el filtro dispara `?name=`; sin sesión solo filtra locales en cliente; escribir no filtra; «Aplicar»/Enter aplican y «Eliminar» limpia y recarga.

- [x] **T22.** Ajustar el listado: quitar títulos de grupo visibles (separación solo por `aria-label`), marcar las tarjetas sin dueño con `inset-ring-1 inset-ring-destructive/60` y mostrar un aviso `role="status"` cuando hay productos locales que se pueden perder.
  **RFs:** RF-24, RF-70, RF-71, RF-72
  **Done when:** no se ve ningún encabezado de grupo; las tarjetas sin dueño tienen borde rojo; el aviso aparece solo si hay locales.

- [x] **T23.** Ajustar la tarjeta: `ProductStatus` solo con etapa (sin pill de posesión); acciones solo-icono con `aria-label`/`title` (Publicar `Eye`, Despublicar `EyeOff`, Editar `Pencil`, Eliminar `Trash2`); galería de solo lectura `ProductGallery` a la derecha solo si hay imágenes.
  **RFs:** RF-15, RF-73, RF-74, RF-75, RF-76
  **Done when:** la tarjeta no muestra posesión; cada acción tiene icono + etiqueta accesible; la galería aparece solo con imágenes y no permite editar.

- [x] **T24.** Rehacer el header de `/catalog`: título a la izquierda y acciones a la derecha con `items-end`, filtro dentro del header; en `sm+` botones inline «Publicar catálogo» (`Eye`) y «Nuevo producto» (`Plus`) con icono+texto; en pantallas chicas un único botón `EllipsisVertical` con menú de esas dos opciones que se cierra al elegir.
  **RFs:** RF-77, RF-78, RF-79, RF-80
  **Done when:** en escritorio se ven los dos botones inline; en móvil hay un solo botón con menú; el menú cierra al elegir y las opciones respetan el estado de sesión.

- [x] **T25.** Rediseñar el shell: navegación con iconos (`House`/`Boxes`) y sesión (`LogIn`/`LogOut`); colapso del menú lateral en escritorio (solo iconos, `PanelLeftClose`/`PanelLeftOpen`); barra superior fija en móvil (logo + «Panel» + menú + sesión) con navegación lateral oculta que se abre al tocar y se cierra al elegir.
  **RFs:** RF-54, RF-55, RF-56, RF-57, RF-58, RF-59
  **Done when:** el aside colapsa/expande en escritorio sin perder accesibilidad; en móvil la barra abre/cierra el menú y cada opción lo cierra.

- [x] **T26.** Fijar el layout: `h-dvh` en el shell, `html,body{height:100%}` + `body{overflow:hidden}`, header fijo y scroll solo dentro del contenido, con el padding inferior en el contenedor scrollable.
  **RFs:** RF-60, RF-61
  **Done when:** el cuerpo no scrollea; el catálogo scrollea internamente sin tapar el header ni recortar el final del listado.

- [x] **T27.** Endurecer la sesión: `provideAppInitializer` que espera `Session.whenHydrated` antes de renderizar; `Session.enterWithGoogle()` envía `return_to` con la ruta actual; `Session.logout()` recarga la página en la ruta actual (`ExternalNavigation.reload()`), sin navegar a home.
  **RFs:** RF-62, RF-63, RF-64
  **Done when:** al arrancar con sesión el catálogo carga sin carrera; el login vuelve a la ruta de origen; el logout recarga la ruta actual.

- [x] **T28.** Tests de las iteraciones as-built: filtro backend (`?name=`) y local, header responsive, shell colapsable/móvil, sesión (`whenHydrated`, `return_to`, `reload`), galería y aviso de locales; `npm test` (unit + lint + build) y demo móvil/escritorio.
  **RFs:** RF-9, RF-54–RF-80
  **Done when:** los tests nuevos pasan con el runner del proyecto y `npm test` queda en verde.

## Matriz RF → tareas

| RF | Tareas |
|----|--------|
| RF-1 | T2, T19 |
| RF-2 | T2, T12, T19 |
| RF-3 | T2, T11, T19 |
| RF-4 | T2, T11, T19 |
| RF-5 | T6, T12, T18, T19 |
| RF-6 | T6, T12, T18, T19 |
| RF-7 | T6, T12, T18, T19 |
| RF-8 | T6, T12, T18, T19 |
| RF-9 | T6, T12, T18, T19 |
| RF-10 | T11, T19 |
| RF-11 | T1, T11, T19 |
| RF-12 | T1, T10, T19 |
| RF-13 | T10, T19 |
| RF-14 | T10, T19 |
| RF-15 | T10, T19 |
| RF-16 | T10, T19 |
| RF-17 | T10, T19 |
| RF-18 | T10, T19 |
| RF-19 | T7, T11, T18, T19 |
| RF-20 | T3, T7, T18, T19 |
| RF-21 | T7, T11, T18, T19 |
| RF-22 | T6, T19 |
| RF-23 | T1, T8, T19 |
| RF-24 | T1, T8, T19 |
| RF-25 | T1, T8, T19 |
| RF-26 | T13, T19 |
| RF-27 | T13, T19 |
| RF-28 | T13, T19 |
| RF-29 | T13, T18, T19 |
| RF-30 | T14, T19 |
| RF-31 | T14, T18, T19 |
| RF-32 | T15, T19 |
| RF-33 | T15, T18, T19 |
| RF-34 | T3, T15, T18, T19 |
| RF-35 | T16, T19 |
| RF-36 | T16, T19 |
| RF-37 | T16, T18, T19 |
| RF-38 | T16, T19 |
| RF-39 | T9, T19 |
| RF-40 | T9, T19 |
| RF-41 | T9, T19 |
| RF-42 | T9, T19 |
| RF-43 | T4, T19 |
| RF-44 | T4, T18, T19 |
| RF-45 | T4, T7, T19 |
| RF-46 | T4, T7, T19 |
| RF-47 | T4, T13, T19 |
| RF-48 | T4, T14, T19 |
| RF-49 | T4, T15, T19 |
| RF-50 | T4, T16, T19 |
| RF-51 | T4, T19 |
| RF-52 | T4, T19 |
| RF-53 | T5, T17, T18, T19 |
| RF-54 | T20, T25, T28 |
| RF-55 | T20, T25, T28 |
| RF-56 | T25, T28 |
| RF-57 | T25, T28 |
| RF-58 | T25, T28 |
| RF-59 | T25, T28 |
| RF-60 | T26, T28 |
| RF-61 | T26, T28 |
| RF-62 | T27, T28 |
| RF-63 | T27, T28 |
| RF-64 | T27, T28 |
| RF-65 | T21, T28 |
| RF-66 | T21, T28 |
| RF-67 | T21, T28 |
| RF-68 | T21, T28 |
| RF-69 | T20, T21, T28 |
| RF-70 | T22, T28 |
| RF-71 | T22, T28 |
| RF-72 | T22, T28 |
| RF-73 | T23, T28 |
| RF-74 | T20, T23, T28 |
| RF-75 | T23, T28 |
| RF-76 | T23, T28 |
| RF-77 | T24, T28 |
| RF-78 | T20, T24, T28 |
| RF-79 | T20, T24, T28 |
| RF-80 | T24, T28 |

**Cobertura:** RF-1 … RF-80 (todos).
