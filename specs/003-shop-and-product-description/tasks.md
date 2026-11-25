# Tasks 003 — Mi tienda y descripción de producto

Tareas de 20–30 minutos, ordenadas por dependencia. Cada una indica los RF que cubre y una condición verificable. No implementar nada fuera de este listado.

## Modelo, constantes y frontera HTTP

- [x] **T1.** Crear `core/models/shop.ts` con `Shop { name: string; description: string | null }`; crear `core/constants/shop-limits.ts` (`SHOP_NAME_MIN_LENGTH = 1`, `SHOP_NAME_MAX_LENGTH = 80`, `SHOP_DESCRIPTION_MAX_LENGTH = 1000`) y agregar `MAX_DESCRIPTION_LENGTH = 1000` a `core/constants/product-limits.ts`; agregar `description: string | null` a `CatalogProduct`, `EditableProduct` y `ServerProduct` en `core/models/catalog-product.ts`.
  **Cubre:** RF-17, RF-20, RF-21, RF-22, RF-26
  **Done when:** el proyecto compila en TypeScript estricto, `Shop` y los tres contratos de producto exponen `description` tipada, las constantes se importan desde un solo lugar y no hay hosts ni URLs en modelos/constantes.

- [x] **T2.** Crear `core/services/shop/panel-shop.ts` (`PanelShop`, `providedIn: 'root'`) con `get(): Observable<Shop | null>` (`GET {apiBaseUrl}/panel/shop`) y `save(shop: Shop): Observable<Shop>` (`PUT {apiBaseUrl}/panel/shop`, cuerpo JSON), ambos con `withCredentials: true`; traducir únicamente el `404` del `GET` a `null` y reenviar el resto de errores con `catchError`/`throwError`.
  **Cubre:** RF-1, RF-4, RF-7, RF-8, RF-10, RF-12
  **Done when:** el servicio solo construye URLs bajo `${environment.apiBaseUrl}/panel/shop`, usa credenciales, devuelve Observables, un `404` del `GET` emite `null`, un `404` del `PUT` se propaga como error y no hay secretos ni hosts alternativos.

- [x] **T3.** Crear `core/services/shop/shop-store.ts` (`ShopStore`, `providedIn: 'root'`) con signals `shop`, `loading`, `loadError`, `notFound`, `saving`, `saveError` y `saved`; implementar `load()`, `retry()` y `save(shop): Observable<Shop>` delegando en `PanelShop`, con mensajes en español («No pudimos cargar tu tienda. Intentá de nuevo.» y «No pudimos guardar tu tienda. Intentá de nuevo.») y sin borrar `shop` ante error de guardado.
  **Cubre:** RF-4, RF-7, RF-11, RF-12, RF-13, RF-14, RF-15, RF-16
  **Done when:** `load()` alterna `loading` y resuelve en `shop` (`200`), `notFound` (`404`) o `loadError` (otro error); `retry()` vuelve a cargar; `save()` mantiene `saving` durante la petición y deja `saved` o `saveError`; un error de guardado no resetea `shop`.

## Pantalla Mi tienda

- [x] **T4.** Crear `views/shop/shop.ts` + `shop.html` (standalone) con host `flex min-h-0 flex-1 flex-col` y `<app-page-layout>`: título «Mi tienda». Si `Session.authenticated()` es falso, mostrar «Iniciá sesión para gestionar tu tienda.» y un botón que llama `Session.enterWithGoogle()`; en ese caso no renderizar el formulario ni pedir datos.
  **Cubre:** RF-1, RF-5, RF-6
  **Done when:** sin sesión se ve el mensaje y el botón de login y no se ejecuta ningún `GET`; con sesión se ve el contenedor del formulario dentro del `PageLayout`; la vista no duplica sidebar ni shell.

- [x] **T5.** Implementar el formulario reactivo de `ShopView` con `name` y `description`; validar nombre obligatorio de 1 a 80 caracteres **tras recortar** (validador propio en `views/shop/shop-form.validators.ts` o funciones privadas) y descripción `<= 1000` (`Validators.maxLength` + `<textarea maxlength="1000">`); mostrar mensajes en español junto al campo y normalizar a `name.trim()` y `description.trim() || null` antes de guardar.
  **Cubre:** RF-8, RF-9, RF-17, RF-18
  **Done when:** un nombre vacío, de solo espacios o de 81 caracteres bloquea el guardado con mensaje; 80 caracteres se aceptan; una descripción de 1000 se acepta y de 1001 se bloquea con «La descripción no puede superar los 1000 caracteres.»; la etiqueta y la ayuda son visibles y asociadas al control.

- [x] **T6.** Cablear la carga en `ShopView`: al iniciar con sesión llamar `ShopStore.load()`; mostrar «Cargando tu tienda…» (`role="status"`, `aria-busy`), estado vacío con formulario cuando `notFound` (`404`), formulario precargado con nombre y descripción cuando hay `shop` (`200`), y error con botón «Reintentar» cuando hay `loadError`.
  **Cubre:** RF-3, RF-4, RF-7, RF-14, RF-15, RF-16
  **Done when:** el `404` no se muestra como error sino como «Todavía no tenés una tienda configurada» con formulario; el `200` precarga ambos campos; el error de carga muestra el mensaje y «Reintentar» recarga; los cuatro estados son perceptibles por texto y no solo por color.

- [x] **T7.** Cablear el guardado en `ShopView`: una única acción «Guardar» que llama `ShopStore.save(...)` (create-or-replace vía `PUT`); deshabilitar y mostrar «Guardando…» durante `saving`; al éxito mostrar confirmación `role="status"`; ante error mostrar «No pudimos guardar tu tienda. Intentá de nuevo.» sin resetear el formulario; «Guardar» en `[pageActions]` en `sm+` y en `[pageFooter]` a ancho completo en móvil con `form="shop-form"`.
  **Cubre:** RF-10, RF-11, RF-12, RF-13, RF-18
  **Done when:** crear (estado vacío) y reemplazar (estado con tienda) usan el mismo botón y `PUT`; durante el guardado no se puede reenviar; el éxito muestra confirmación accesible; el error conserva nombre y descripción ingresados; en 320 px el botón está en el footer.

## Guard de cambios sin guardar

- [x] **T8.** Implementar en `ShopView` la detección de cambios y `confirmDiscard()`: convertir `form.valueChanges` a signal (`toSignal`) o suscribirse para recalcular `hasUnsavedChanges` comparando el formulario normalizado contra `savedSnapshot` (tienda cargada/guardada o `null`); sin cambios devolver `true`; con cambios abrir `ConfirmDialog` y devolver `Promise<boolean>` resuelta por `confirmed`/`cancelled` (incluido Escape), reutilizando la promesa si ya hay un diálogo pendiente.
  **Cubre:** RF-19
  **Done when:** escribir y volver al valor original no dispara el diálogo; con cambios, confirmar resuelve `true` y cancelar/Escape resuelve `false`; el diálogo mantiene foco atrapado y no se abre dos veces.

- [x] **T9.** Crear `views/shop/shop-unsaved-changes.guard.ts` con `shopUnsavedChangesGuard: CanDeactivateFn<ShopView>` que delegue en `component.confirmDiscard()`; no mover el guard a `core/guards/` hasta que se reutilice en otra vista.
  **Cubre:** RF-19
  **Done when:** el guard compila como guard funcional de Angular 21, devuelve `boolean` o `Promise<boolean>` y su spec cubre sin cambios, confirmar y cancelar.

## Ruta y navegación

- [x] **T10.** Registrar en `app.routes.ts` la ruta lazy `shop` → `ShopView` con `title: 'Mi tienda | Friendly E-Shop'` y `canDeactivate: [shopUnsavedChangesGuard]`; conservar el `'**'` de fallback.
  **Cubre:** RF-1, RF-4, RF-5, RF-19
  **Done when:** `/shop` carga `ShopView` de forma diferida, el título del documento es exactamente «Mi tienda | Friendly E-Shop», el guard está enganchado y las rutas existentes no cambian.

- [x] **T11.** Agregar el ítem «Mi tienda» (icono Lucide `Store`) en las dos navegaciones de `app.html` (menú móvil y aside de escritorio) con `routerLink="/shop"`, `routerLinkActive`, `aria-label`/`title` cuando el aside está colapsado y visible solo dentro de `@if (session.authenticated())`.
  **Cubre:** RF-2, RF-5
  **Done when:** con sesión el ítem aparece en móvil y escritorio, navega a `/shop`, se marca activo y se opera con teclado; sin sesión no aparece; las vistas no duplican la navegación.

## Descripción de producto

- [x] **T12.** En `core/services/catalog/panel-catalog.ts`, mapear `description: product.description ?? null` en `toCatalogProduct` e incluir `formData.append('description', product.description ?? '')` en `toFormData` para permitir guardar y borrar la descripción.
  **Cubre:** RF-22, RF-23, RF-26
  **Done when:** la respuesta del servidor se expone como `description` (`null` si falta) y el `FormData` de crear/actualizar contiene la parte `description`, incluida la cadena vacía cuando se quiere borrar.

- [x] **T13.** En `core/services/catalog/catalog.ts`, copiar `description` en `toEditable` y persistirla en `saveLocally`; al leer productos locales antiguos sin el campo, normalizar a `null` sin romper `LocalCatalog`.
  **Cubre:** RF-22, RF-23, RF-26
  **Done when:** un producto local guarda y devuelve su descripción; publicar un local (`create(toEditable)`) la conserva; una entrada de `sessionStorage` sin descripción se lee como `null`.

- [x] **T14.** En `views/catalog-form`, agregar el control `description` (`Validators.maxLength(MAX_DESCRIPTION_LENGTH)`), `<textarea formControlName="description" maxlength="1000">` con etiqueta, ayuda «Máximo 1000 caracteres.» y mensaje de error; precargar `product.description ?? ''` al editar; enviar `description` recortada o `null`; no resetear el formulario ante error de guardado.
  **Cubre:** RF-20, RF-21, RF-22, RF-23, RF-24, RF-25, RF-26, RF-29
  **Done when:** la descripción es opcional; 1000 caracteres se guardan y 1001 bloquean el envío con el mensaje del límite; al editar se precarga el valor actual; un producto sin descripción se guarda; el error de guardado conserva lo escrito.

- [x] **T15.** Cubrir la confirmación del guardado de producto: mantener `saving` («Guardando…») y `saveError` existentes; tras un guardado exitoso navegar a `/catalog` con `queryParams: { guardado: 'producto' }`; en `CatalogListView` mostrar un aviso `role="status"` «Producto guardado.» y limpiar el parámetro con `replaceUrl`.
  **Cubre:** RF-27, RF-28, RF-29, RF-30
  **Done when:** el guardado exitoso deja una confirmación visible en el listado y el parámetro no se repite al recargar; el fallo muestra error y conserva la descripción; el estado de carga sigue visible durante el guardado.

## Pruebas y verificación

- [x] **T16.** Escribir `core/services/shop/panel-shop.spec.ts`: `GET`/`PUT` contra `${environment.apiBaseUrl}/panel/shop`, `withCredentials`, cuerpo JSON en el `PUT`, `404` del `GET` → `null`, propagación de otros errores y `404` del `PUT` como error.
  **Cubre:** RF-1, RF-4, RF-7, RF-8, RF-12
  **Done when:** los casos pasan con Vitest y `HttpTestingController`, sin peticiones inesperadas (`verify()`).

- [x] **T17.** Escribir `core/services/shop/shop-store.spec.ts`: carga `200`, `404` → `notFound`, error de carga, `retry()`, guardado exitoso (`saved`) y error de guardado (conserva `shop`, fija `saveError`).
  **Cubre:** RF-4, RF-7, RF-11, RF-12, RF-13, RF-14, RF-15, RF-16
  **Done when:** cada transición de signals se verifica y el store no deja estados inconsistentes tras éxito o error.

- [x] **T18.** Escribir `views/shop/shop.spec.ts`: sin sesión no pide datos, validación de nombre recortado (1/80/81) y descripción (1000/1001), estado vacío con formulario, precarga, guardado, error que conserva datos, reintento y `confirmDiscard` (sin cambios/confirmar/cancelar).
  **Cubre:** RF-3, RF-4, RF-5, RF-6, RF-7, RF-8, RF-9, RF-10, RF-11, RF-12, RF-13, RF-14, RF-15, RF-16, RF-17, RF-18, RF-19
  **Done when:** los casos pasan con `TestBed` y los mocks cubren los estados de carga, vacío, error y confirmación.

- [x] **T19.** Escribir `views/shop/shop-unsaved-changes.guard.spec.ts` y ampliar `app.spec.ts`: el guard permite/niega la salida según `confirmDiscard`, el ítem «Mi tienda» aparece con sesión y no sin sesión, y la ruta tiene el título esperado.
  **Cubre:** RF-1, RF-2, RF-5, RF-19
  **Done when:** guard y navegación quedan cubiertos y `npm run unit` pasa sin peticiones reales.

- [x] **T20.** Actualizar pruebas de producto: `panel-catalog.spec.ts` (descripción en mapeo y `FormData`, incluida cadena vacía), `catalog.spec.ts` (`toEditable`/guardado local y fixtures con `description`), `catalog-form.spec.ts` (precarga, envío recortado/`null`, 1000/1001, error conserva, aviso de éxito) y `catalog-list.spec.ts` (banner «Producto guardado.»).
  **Cubre:** RF-20, RF-21, RF-22, RF-23, RF-24, RF-25, RF-26, RF-27, RF-28, RF-29, RF-30
  **Done when:** todos los specs compilan con los tipos actualizados y los casos de descripción y confirmación pasan.

- [x] **T21.** Ejecutar `COVERAGE_MIN=90 npm run verify` (lint + cobertura + `coverage:check` + build) y corregir ramas sin cubrir; probar manualmente en móvil (320–375 px) y escritorio con teclado: sin sesión, sin tienda, carga, error con reintento, guardado, error de guardado y salida con cambios; verificar que no hay hosts fuera de `apiBaseUrl` ni secretos.
  **Cubre:** RF-1 … RF-30
  **Done when:** `npm run verify` queda verde con cobertura de líneas ≥ 90 %, la demo manual cubre todos los estados y no aparecen credenciales ni URLs ajenas al entorno configurado.

## Matriz RF → tareas

| RF | Tareas |
|----|--------|
| RF-1 | T2, T4, T10, T16, T19, T21 |
| RF-2 | T11, T19, T21 |
| RF-3 | T6, T18, T21 |
| RF-4 | T2, T3, T6, T10, T16, T17, T18, T21 |
| RF-5 | T4, T10, T11, T18, T19, T21 |
| RF-6 | T4, T18, T21 |
| RF-7 | T2, T3, T6, T16, T17, T18, T21 |
| RF-8 | T2, T5, T7, T16, T18, T21 |
| RF-9 | T5, T7, T18, T21 |
| RF-10 | T2, T7, T18, T21 |
| RF-11 | T3, T7, T17, T18, T21 |
| RF-12 | T2, T3, T7, T16, T17, T18, T21 |
| RF-13 | T3, T7, T17, T18, T21 |
| RF-14 | T3, T6, T17, T18, T21 |
| RF-15 | T3, T6, T17, T18, T21 |
| RF-16 | T3, T6, T17, T18, T21 |
| RF-17 | T1, T5, T18, T21 |
| RF-18 | T5, T7, T18, T21 |
| RF-19 | T8, T9, T18, T19, T21 |
| RF-20 | T1, T12, T13, T14, T20, T21 |
| RF-21 | T1, T14, T20, T21 |
| RF-22 | T1, T12, T13, T14, T20, T21 |
| RF-23 | T1, T12, T13, T14, T20, T21 |
| RF-24 | T1, T14, T20, T21 |
| RF-25 | T1, T14, T20, T21 |
| RF-26 | T1, T12, T13, T14, T20, T21 |
| RF-27 | T15, T20, T21 |
| RF-28 | T15, T20, T21 |
| RF-29 | T14, T15, T20, T21 |
| RF-30 | T15, T20, T21 |

**Cobertura:** RF-1 … RF-30 (todos).
