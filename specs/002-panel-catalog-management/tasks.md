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

- [ ] **T19.** Barrido de frontera + `npm test` (unit + lint + build) + demo manual móvil/escritorio de: alta sin sesión, edición, alta con sesión, listado con grupos, publicar, despublicar, eliminar y publicar catálogo con sus modales.
  **RFs:** RF-1 … RF-53
  **Done when:** `npm test` pasa; no hay referencias a `fes-catalog-api`, MinIO ni secretos en el bundle; el código no usa `globalThis`, `window.location`, `history`, `firstValueFrom`, `lastValueFrom` ni `.toPromise()` para esta funcionalidad; la demo verifica el checklist de la spec/plan.

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

**Cobertura:** RF-1 … RF-53 (todos).
