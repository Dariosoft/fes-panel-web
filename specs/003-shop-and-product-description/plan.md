# Plan 003 — Mi tienda y descripción de producto

## Objetivo técnico

Incorporar en `panel-web` (Angular 21, SPA standalone, TypeScript estricto) una pantalla **Mi tienda** para que el vendedor autenticado consulte y guarde el nombre y la descripción públicos de su tienda, y agregar una **descripción opcional de hasta 1000 caracteres** al formulario de producto que se conserve al guardar y se precargue al editar.

La tienda se consume a través de la frontera de `panel-api` con un único recurso `GET/PUT {apiBaseUrl}/panel/shop` con `withCredentials: true`; el `GET` responde `404` cuando la cuenta todavía no tiene tienda (se muestra estado vacío con el mismo formulario) y el `PUT` es **create-or-replace**: crea la tienda si no existe o reemplaza nombre y descripción si ya existe. No se crea modelo ni persistencia de tienda en el panel: `panel-api`/`account-api` siguen siendo la fuente de verdad.

El trabajo cubre RF-1 … RF-30 de la spec 003 y respeta: `AGENTS.md`, `/admin-ui-arquitecture` (shell, `views/`, `core/` por categoría, `PageLayout`, guard cerca de la vista hasta que se reutilice), `/angular-developer` (signals, `HttpClient` como Observables, formularios reactivos de la v21, rutas lazy, `CanDeactivateFn`, accesibilidad y Vitest) y `/ui-ux-pro-max` (foco visible, objetivos táctiles ≥ 44 px, mensajes no dependientes solo del color, responsive desde 320 px).

**Dependencias:** no se agregan librerías. Se reutilizan `@angular/forms`, `@angular/router`, `lucide-angular`, `PageLayout`, `ConfirmDialog` y la sesión existente. No se añade autenticación ni NgRx.

## Historias cubiertas

- H1 → ver los datos públicos de la tienda (RF-1, RF-2, RF-3, RF-4).
- H2 → editar nombre y descripción con una única acción «Guardar» que crea o reemplaza (RF-8, RF-9, RF-10, RF-11, RF-17, RF-18).
- H3 → descripción opcional de producto, precarga y conservación al guardar (RF-20–RF-26, RF-29).
- H4 → estados de carga, error, reintento, confirmación y salida segura (RF-11–RF-16, RF-19, RF-27, RF-28, RF-30).
- Acceso y sesión → pantalla y opción de navegación solo con sesión (RF-1, RF-2, RF-5, RF-6).
- Sin tienda todavía → estado vacío que explica la ausencia y ofrece crearla (RF-7).

## Estado actual del proyecto (as-built relevante)

- **Shell y navegación:** `src/app/app.ts` + `app.html` mantienen el chrome Admin UI (`h-dvh`, header móvil, aside colapsable, `session-bar`). La navegación de secciones está duplicada a propósito en el menú móvil (`<nav id="mobile-menu">`) y en el aside (`<nav>`), con `routerLink`/`routerLinkActive` e iconos Lucide (`House`, `Boxes`). `App` ya inyecta `Session` y conoce `authenticated()`.
- **Rutas:** `src/app/app.routes.ts` declara `''`, `catalog`, `catalog/new` y `catalog/:id/edit`, todas lazy con `title` en español y `'**'` de fallback.
- **Layout de página:** `core/layouts/page-layout` (`PageLayout`, `app-page-layout`, `[footer]`, slots `pageTitle`, `pageActions`, `appPageHeaderContent`, `appPageHeaderFooter`, default y `pageFooter`) es el marco reutilizable: header fijo, cuerpo scrolleable y footer content-sized para acciones móviles.
- **Sesión:** `Session` expone `authenticated`, `profile`, `enterWithGoogle()` y `logout()`. `app.config.ts` espera `Session.whenHydrated` antes de renderizar, por lo que las vistas arrancan con la sesión resuelta.
- **Producto:** `core/models/catalog-product.ts` define `CatalogProduct`, `EditableProduct` y `ServerProduct` sin descripción. `PanelCatalog` (`core/services/catalog/panel-catalog.ts`) construye `{apiBaseUrl}/panel/catalog/*`, mapea servidor→vista y arma `FormData`; `Catalog` (`core/services/catalog/catalog.ts`) es la fuente de verdad de estado, guarda local o servidor y convierte a `EditableProduct`; `CatalogFormView` (`views/catalog-form`) tiene formulario reactivo y estados `saving`/`saveError`.
- **Persistencia local:** `LocalCatalog` guarda `CatalogProduct` en `sessionStorage`; un campo nuevo debe tolerar entradas antiguas sin descripción.
- **Estilos:** Tailwind v4, tema Admin UI oscuro, tokens `accent`, `border`, `muted`, `destructive`, `foreground`; CSS legible (una declaración por línea, media queries en líneas propias).
- **Pruebas:** Vitest con `TestBed`, `provideHttpClientTesting`/`HttpTestingController`, `vi.fn` y `provideRouter`. `npm run coverage` + `scripts/check-coverage.mjs` (umbral por defecto 80; este corte apunta a ≥ 90 %).

## Decisiones de arquitectura

### 1. Frontera HTTP aislada en `PanelShop`

- **Decisión:** crear `core/services/shop/panel-shop.ts` (`PanelShop`, `providedIn: 'root'`) como único punto que conoce `${environment.apiBaseUrl}/panel/shop`. Expone `get(): Observable<Shop | null>` y `save(shop: Shop): Observable<Shop>`, ambos con `withCredentials: true`.
- **Motivo:** `AGENTS.md` y `/admin-ui-arquitecture` exigen concentrar la construcción de URLs y `HttpClient` en servicios; los componentes no deben conocer hosts ni rutas de `panel-api`.
- **443/404:** `get()` traduce **`404` a `null`** (no es error: significa «todavía no hay tienda») y propaga el resto de errores. El `PUT` envía JSON `{ name, description }` y devuelve la tienda resultante.
- **Cubre:** RF-1, RF-4, RF-7, RF-8, RF-9, RF-10, RF-12.

### 2. Estado de tienda en `ShopStore` (signals) separado de la vista

- **Decisión:** crear `core/services/shop/shop-store.ts` (`ShopStore`, `providedIn: 'root'`) con signals `shop`, `loading`, `loadError`, `notFound`, `saving`, `saveError` y `saved`, y acciones `load()`, `retry()` y `save(shop): Observable<Shop>` que delegan en `PanelShop`.
- **Motivo:** `AGENTS.md` pide separar presentación, acceso HTTP y estado. La vista no debe ser fuente de verdad de la tienda persistida; solo proyecta formulario y estados.
- **Mensajes:** el store fija los textos en español y conserva `shop`/`saveError` hasta el siguiente intento. `save()` mantiene `saving` durante la petición y reemite para que la vista sincronice su snapshot.
- **Cubre:** RF-4, RF-7, RF-11–RF-16.

### 3. Ruta lazy `shop` y navegación «Mi tienda» solo con sesión

- **Decisión:** registrar en `app.routes.ts` la ruta lazy `shop` → `ShopView` con `title: 'Mi tienda | Friendly E-Shop'` y `canDeactivate: [shopUnsavedChangesGuard]`. Agregar el ítem «Mi tienda» (icono Lucide `Store`) en **ambas** navegaciones de `app.html`, envuelto en `@if (session.authenticated())`.
- **Motivo:** `/admin-ui-arquitecture` indica que la navegación es chrome global del `App` y no se duplica dentro de las vistas; la ruta lazy evita engordar el bundle inicial. La spec exige que la opción sea visible con sesión (RF-2) y que sin sesión no se muestre la pantalla (RF-5).
- **Cubre:** RF-1, RF-2, RF-5.

### 4. Control de sesión dentro de la pantalla (sin guard de acceso)

- **Decisión:** la ruta existe siempre, pero `ShopView` evalúa `Session.authenticated()`: si es falso, renderiza un `PageLayout` con el mensaje «Iniciá sesión para gestionar tu tienda.» y un botón que llama `Session.enterWithGoogle()`; **no** llama al `GET` ni muestra el formulario. Si es verdadero, carga y muestra el formulario.
- **Motivo:** un `CanActivate`/`CanMatch` que redirija impediría cumplir RF-6 (indicar que se requiere iniciar sesión en esa pantalla). El gate en la vista es el punto mínimo que satisface RF-5 y RF-6 reutilizando la sesión existente, sin autenticación nueva.
- **Cubre:** RF-1, RF-5, RF-6.

### 5. Formulario reactivo con validación por longitud recortada

- **Decisión:** usar `ReactiveFormsModule` con `name` y `description`. El nombre se valida como **obligatorio de 1 a 80 caracteres después de recortar extremos** mediante un validador propio (`trimmedRequired`/`trimmedMaxLength`, colocado en `views/shop/shop-form.validators.ts` o funciones privadas del componente); la descripción usa `Validators.maxLength(1000)` y `<textarea maxlength="1000">`. Antes de guardar se normaliza: `name.trim()` y `description.trim() || null`.
- **Motivo:** `Validators.required` considera válido un texto de solo espacios; la spec (RF-17) exige medir **después** de recortar. La v21 no tiene Signal Forms estables, por lo que se mantiene el patrón reactivo ya usado en `CatalogFormView`.
- **Mensajes en español junto al campo:** nombre inválido → «Ingresá el nombre de tu tienda (entre 1 y 80 caracteres).»; descripción larga → «La descripción no puede superar los 1000 caracteres.». El guardado se bloquea con `form.invalid` (RF-18).
- **Cubre:** RF-8, RF-9, RF-17, RF-18.

### 6. `404` como estado vacío, no como error

- **Decisión:** cuando `PanelShop.get()` emite `null`, `ShopStore.notFound()` queda en `true`; `ShopView` muestra un estado vacío que explica «Todavía no tenés una tienda configurada» **y el mismo formulario** para crearla. Al guardar, el `PUT` crea la tienda (RF-7, RF-10).
- **Motivo:** el contrato cross-repo define el `404` como ausencia de tienda; tratarlo como error confundiría al vendedor y rompería RF-7.
- **Cubre:** RF-7, RF-10, RF-14, RF-15.

### 7. Guardado único «Guardar» (create-or-replace)

- **Decisión:** un único botón «Guardar» llama `ShopStore.save(normalizedShop)` → `PUT /panel/shop`. No hay botones separados de alta y edición; tras el éxito se actualiza `shop`, se muestra una confirmación accesible (`role="status"`) y se refresca el snapshot del formulario (deja de estar sucio).
- **Motivo:** RF-10 prohíbe acciones separadas de alta y edición; el `PUT` idempotente de `panel-api` resuelve ambos casos.
- **Cubre:** RF-10, RF-11.

### 8. Error de guardado conserva los datos

- **Decisión:** ante error del `PUT`, `ShopStore.saveError` fija «No pudimos guardar tu tienda. Intentá de nuevo.» y **no** se resetea el formulario ni el snapshot previo; el formulario sigue con lo ingresado. Ante error de carga, `loadError` fija «No pudimos cargar tu tienda. Intentá de nuevo.» y se ofrece «Reintentar».
- **Motivo:** RF-13 y RF-16 exigen conservar los datos y permitir reintentar; los textos coinciden con los definidos en `panel-api` (spec 003 de ese repo).
- **Cubre:** RF-12, RF-13, RF-15, RF-16.

### 9. Salida con cambios sin guardar: `CanDeactivateFn` + `ConfirmDialog`

- **Decisión:** `ShopView` calcula `hasUnsavedChanges` comparando de forma normalizada el valor actual del formulario (`name` recortado y `description` recortada o `null`) contra un `savedSnapshot` (la tienda cargada/guardada, o `null` si todavía no existe). Expone `confirmDiscard(): boolean | Promise<boolean>`: sin cambios devuelve `true`; con cambios abre el `ConfirmDialog` existente y resuelve la promesa con la decisión. Un guard funcional `shopUnsavedChangesGuard` (`CanDeactivateFn<ShopView>`, colocado en `views/shop/`) delega en ese método.
- **Motivo:** Angular 21 admite guards funcionales; el `ConfirmDialog` ya aporta `role="dialog"`, foco atrapado, Escape y retorno de foco. Colocarlo en `views/shop/` sigue la regla de mantener guards específicos de vista cerca de la vista hasta que se reutilicen.
- **Cubre:** RF-19.

### 10. Descripción del producto en modelo, servicio y `FormData`

- **Decisión:** agregar `description: string | null` a `CatalogProduct`, `EditableProduct` y `ServerProduct`; mapearla en `PanelCatalog.toCatalogProduct` y `Catalog.toEditable`/`saveLocally`; incluirla en `PanelCatalog.toFormData` como `formData.append('description', product.description ?? '')` para permitir también borrarla; en `CatalogFormView` agregar el control `description` con `Validators.maxLength(1000)`, `<textarea maxlength="1000">`, texto de ayuda, precarga al editar y normalización a `null` cuando queda vacía.
- **Motivo:** RF-20–RF-26 y RF-29 exigen campo opcional, límite, precarga y conservación. Enviar cadena vacía permite que `catalog-api` trate la descripción como ausente al reemplazar; el modelo tipado evita `any` y mantiene TypeScript estricto.
- **Persistencia local:** los productos locales (`sessionStorage`) conservan `description`; al mapear entradas antiguas sin campo se usa `?? null` para no romper la compatibilidad.
- **Cubre:** RF-20–RF-26, RF-29.

### 11. Confirmación del guardado de producto

- **Decisión:** los estados `saving` («Guardando…») y `saveError` ya existen en `CatalogFormView` (RF-27, RF-28, RF-29). Para RF-30, tras un guardado exitoso se navega a `/catalog` con una señal de éxito (por ejemplo `queryParams: { guardado: 'producto' }`); `CatalogListView` muestra un aviso `role="status"` «Producto guardado.» y limpia el parámetro con `replaceUrl` para que no se repita al recargar.
- **Motivo:** hoy la vista navega al listado sin confirmación explícita; un aviso en el listado hace perceptible el éxito sin depender del color y sin cambiar el flujo de alta/edición.
- **Cubre:** RF-27, RF-28, RF-29, RF-30.

### 12. Acciones responsivas y Admin UI

- **Decisión:** `ShopView` usa `PageLayout`: título «Mi tienda» y subtítulo de sección; «Guardar» en `[pageActions]` en `sm+` y en `[pageFooter]` a ancho completo en móvil (`sm:hidden`), con `form="shop-form"` para disparar `ngSubmit`. El formulario usa etiquetas visibles, textarea con `min-h`, ayuda de límite y mensajes junto al campo.
- **Motivo:** `/admin-ui-arquitecture` exige colocar acciones primarias en el footer en pantallas chicas y conservar el lenguaje visual; RF no funcionales piden uso desde 320 px y teclado.
- **Cubre:** RF-1, RF-8, RF-9, RF-18 y los NFR de accesibilidad/responsive.

## Estructura objetivo

```
src/app/
  app.routes.ts                              # + shop (lazy, title, canDeactivate)
  app.ts / app.html                          # + nav «Mi tienda» (Store) con sesión (móvil y aside)
  core/
    constants/
      shop-limits.ts                         # SHOP_NAME_MIN_LENGTH=1, SHOP_NAME_MAX_LENGTH=80,
                                             # SHOP_DESCRIPTION_MAX_LENGTH=1000
      product-limits.ts                      # + MAX_DESCRIPTION_LENGTH=1000
    models/
      shop.ts                                # Shop { name: string; description: string | null }
      catalog-product.ts                     # + description en CatalogProduct, EditableProduct, ServerProduct
    services/
      shop/
        panel-shop.ts                        # PanelShop · GET/PUT {apiBaseUrl}/panel/shop
        shop-store.ts                        # ShopStore · signals + load/retry/save
  views/
    shop/
      shop.ts                                # ShopView (formulario, estados, confirmDiscard)
      shop.html                              # PageLayout + estados + formulario
      shop.spec.ts                           # pruebas de la vista
      shop-form.validators.ts                # validadores trimmed (nombre 1–80, descripción ≤1000)
      shop-unsaved-changes.guard.ts          # CanDeactivateFn<ShopView>
      shop-unsaved-changes.guard.spec.ts
    catalog-form/
      catalog-form.ts / .html                # + control description, precarga, normalización, aviso de éxito
    catalog-list/
      catalog-list.ts / .html                # + banner «Producto guardado.» desde query param
    catalog-form/catalog-form.spec.ts        # + casos de descripción
  core/services/catalog/
    panel-catalog.ts / .spec.ts              # + description en mapeo y FormData
    catalog.ts / .spec.ts                    # + description en toEditable/saveLocally y fixtures
```

## Contrato con `panel-api`

| Operación | Método y path | Cuerpo | Respuesta esperada | RF |
|-----------|---------------|--------|--------------------|----|
| Consultar mi tienda | `GET {apiBaseUrl}/panel/shop` | — | `200` → `Shop`; `404` → sin tienda (se traduce a `null`) | RF-1, RF-4, RF-7 |
| Guardar mi tienda (crear o reemplazar) | `PUT {apiBaseUrl}/panel/shop` | `Shop` JSON | `200` → `Shop` resultante | RF-8, RF-9, RF-10, RF-11 |

- **Modelo `Shop`:** `{ "name": "string", "description": "string | null" }`.
- **Credenciales:** todas las llamadas usan `withCredentials: true`; la sesión viaja por la cookie `fes_session` que ya gestiona `panel-api`. El panel no lee ni escribe cookies manualmente.
- **Formato:** JSON (`application/json`), no `FormData`; la tienda no tiene imágenes ni archivos en este corte.
- **Validación:** el panel valida antes de enviar (RF-17, RF-18) y no replica la persistencia ni las reglas de negocio del servicio dueño. Un rechazo del servicio se informa en español con el mensaje de guardado.
- **Prohibido:** llamar a `account-api` directamente, definir rutas `/shops/{id}` o gestionar más de una tienda por cuenta. La frontera es exclusivamente `${environment.apiBaseUrl}/panel/shop`.

## Manejo de `404` y errores

| Situación | Estado del store | UI | RF |
|-----------|------------------|----|----|
| `GET` en curso | `loading = true` | «Cargando tu tienda…» (`role="status"`, `aria-busy`) | RF-14 |
| `GET` `404` | `notFound = true`, `shop = null` | Estado vacío «Todavía no tenés una tienda configurada» + formulario para crearla | RF-7 |
| `GET` `200` | `shop`, `savedSnapshot` | Formulario precargado con nombre y descripción | RF-3, RF-4 |
| `GET` otro error | `loadError` | «No pudimos cargar tu tienda. Intentá de nuevo.» + «Reintentar» | RF-15, RF-16 |
| `PUT` en curso | `saving = true` | Botón «Guardando…» deshabilitado | NFR de feedback |
| `PUT` `200` | `shop` actualizado, `saved = true` | Confirmación accesible «Guardaste los datos de tu tienda.» | RF-11 |
| `PUT` error | `saveError` | «No pudimos guardar tu tienda. Intentá de nuevo.» sin resetear el formulario | RF-12, RF-13 |
| `401`/`403` | se trata como error de carga/guardado | Mensaje en español; no se agrega recuperación ni login automático en este corte | RF-6, RF-12 |

- El `404` **solo** se interpreta como ausencia de tienda en el `GET`. Un `404` en el `PUT` se trata como error de guardado.
- La sesión requerida se resuelve antes de cargar; si la sesión expira durante una operación, el mensaje de error y el reintento permiten recuperarse sin agregar autenticación nueva.
- Los mensajes de éxito, error y carga son perceptibles sin depender solo del color (`role="status"`, `role="alert"`, texto explícito).

## Cambios en el formulario de producto

1. **Modelo** (`core/models/catalog-product.ts`):
   - `CatalogProduct.description: string | null`.
   - `EditableProduct.description: string | null`.
   - `ServerProduct.description: string | null`.
2. **HTTP** (`core/services/catalog/panel-catalog.ts`):
   - `toCatalogProduct` mapea `description: product.description ?? null`.
   - `toFormData` agrega `formData.append('description', product.description ?? '')`.
3. **Estado** (`core/services/catalog/catalog.ts`):
   - `toEditable` copia `description`.
   - `saveLocally` persiste `description: product.description` dentro del `CatalogProduct` local.
   - Al leer productos locales antiguos, el valor ausente se normaliza a `null`.
4. **Vista** (`views/catalog-form`):
   - Control reactivo `description: ['', Validators.maxLength(MAX_DESCRIPTION_LENGTH)]`.
   - `<textarea maxlength="1000">` con `<label>` visible, `aria-describedby` a la ayuda/error y contador o texto «Máximo 1000 caracteres.».
   - Al editar, `patchValue({ description: product.description ?? '' })` (RF-23).
   - Al guardar, se envía `description: value.description?.trim() ? value.description.trim() : null` (RF-22, RF-26).
   - Si el límite se excede, se muestra «La descripción no puede superar los 1000 caracteres.» y `submit()` no llama al servicio (RF-24, RF-25).
   - Un error de guardado mantiene el valor ingresado porque no se resetea el formulario (RF-29).
5. **Confirmación de producto** (RF-30): al completar el guardado, navegar a `/catalog` con `queryParams: { guardado: 'producto' }`; el listado muestra un aviso `role="status"` y limpia el parámetro con `replaceUrl`.

## Guard de cambios sin guardar

- **Ubicación:** `views/shop/shop-unsaved-changes.guard.ts` (específico de la vista; si más adelante se reutiliza, se mueve a `core/guards/`).
- **Firma:** `export const shopUnsavedChangesGuard: CanDeactivateFn<ShopView> = (component) => component.confirmDiscard();`.
- **Registro:** `canDeactivate: [shopUnsavedChangesGuard]` en la ruta `shop`.
- **`ShopView.confirmDiscard()`**:
  - Si no hay sesión o el formulario no se renderizó, devuelve `true`.
  - Si `!hasUnsavedChanges()`, devuelve `true` sin abrir diálogo.
  - Si hay cambios, abre el `ConfirmDialog` («Descartar cambios», mensaje «Tenés cambios sin guardar. ¿Querés salir sin guardarlos?», acciones «Seguir editando»/«Descartar y salir») y devuelve `Promise<boolean>` resuelta por `confirmed` (`true`) o `cancelled`/Escape (`false`).
  - Si ya hay un diálogo pendiente, reutiliza la misma promesa para evitar dobles navegaciones.
- **Detección de cambios:** `form.valueChanges` se convierte a signal con `toSignal` (o suscripción explícita); `hasUnsavedChanges = computed(() => !sameShop(normalize(formValue()), savedSnapshot()))`, donde `normalize` recorta nombre y descripción y `savedSnapshot` se actualiza tras cargar y tras guardar. Así, escribir y volver al valor original no dispara el diálogo.
- **Cobertura:** RF-19.

## Pantalla «Mi tienda» (estados y UI)

- **Sin sesión:** encabezado «Mi tienda» + mensaje «Iniciá sesión para gestionar tu tienda.» + botón «Entrar con Google» (`Session.enterWithGoogle()`); sin formulario y sin peticiones (RF-5, RF-6).
- **Cargando:** texto «Cargando tu tienda…» con `role="status"` y `aria-busy="true"` (RF-14).
- **Vacío (`404`):** explicación «Todavía no tenés una tienda configurada. Creá tu tienda con un nombre y una descripción para mostrarla en tus publicaciones.» + formulario vacío con la misma acción «Guardar» (RF-7, RF-10).
- **Edición (`200`):** formulario precargado con nombre y descripción; el nombre y la descripción se muestran tal como los devuelve `panel-api` (RF-3, RF-4, RF-8, RF-9).
- **Error de carga:** mensaje «No pudimos cargar tu tienda. Intentá de nuevo.» + botón «Reintentar» que llama `ShopStore.retry()` (RF-15, RF-16).
- **Error de guardado:** mensaje «No pudimos guardar tu tienda. Intentá de nuevo.» junto al formulario, sin perder lo ingresado (RF-12, RF-13).
- **Éxito:** «Guardaste los datos de tu tienda.» como `role="status"`, perceptible sin color (RF-11).
- **Responsive y teclado:** una columna desde 320 px, etiquetas visibles, textarea accesible, botón «Guardar» en header (`sm+`) y footer móvil, foco visible con anillos internos y `prefers-reduced-motion` respetado (NFR).
- **Título de documento:** `Mi tienda | Friendly E-Shop`.

## Pruebas (Vitest según el repo)

`npm run unit` ejecuta `ng test --watch=false` (Vitest); las pruebas usan `TestBed`, `provideHttpClient()` + `provideHttpClientTesting()`, `HttpTestingController`, `provideRouter` y `vi.fn`.

| Archivo | Casos mínimos | RF |
|---------|---------------|----|
| `core/services/shop/panel-shop.spec.ts` | `GET`/`PUT` a `{apiBaseUrl}/panel/shop`, `withCredentials`, JSON en el `PUT`, `404`→`null`, otros errores se propagan | RF-1, RF-4, RF-7, RF-8, RF-12 |
| `core/services/shop/shop-store.spec.ts` | carga exitosa, `404`→`notFound`, error de carga, `retry`, guardado exitoso (`saved`), error de guardado conserva `shop` y `saveError` | RF-4, RF-7, RF-11–RF-16 |
| `views/shop/shop.spec.ts` | gate sin sesión (sin `GET`), validación de nombre recortado 1–80, descripción > 1000, estado vacío, precarga, guardado, error conserva datos, reintento, `confirmDiscard` | RF-3–RF-19 |
| `views/shop/shop-unsaved-changes.guard.spec.ts` | sin cambios permite salir; con cambios y confirmar permite; con cambios y cancelar bloquea | RF-19 |
| `app.spec.ts` | ítem «Mi tienda» visible con sesión y ausente sin sesión; ruta/título | RF-1, RF-2, RF-5 |
| `core/services/catalog/panel-catalog.spec.ts` | `description` en mapeo y en `FormData` (incluida la cadena vacía para borrar) | RF-22, RF-26 |
| `core/services/catalog/catalog.spec.ts` | `description` en `toEditable`/guardado local y fixtures actualizados | RF-22, RF-23, RF-26 |
| `views/catalog-form/catalog-form.spec.ts` | precarga de descripción, envío recortado/`null`, 1000 permitido, 1001 bloqueado, error conserva el valor, aviso de éxito | RF-20–RF-30 |

- Meta de cobertura: **≥ 90 % de líneas** para el código nuevo y sin bajar el total. Ejecutar `COVERAGE_MIN=90 npm run verify` (lint + cobertura + build) o el umbral acordado; corregir ramas sin cubrir antes de cerrar.
- Demo manual: móvil (320–375 px) y escritorio; navegación por teclado (Tab, Shift+Tab, Enter, Escape); estados sin sesión, sin tienda, carga, error de carga con reintento, guardado, error de guardado y salida con cambios.
- No se agregan frameworks de test ni dependencias.

## Riesgos

1. **Contrato cross-repo aún no desplegado:** la rama de `panel-api` puede no exponer todavía `/panel/shop` o diferir en el `404`. Mitigación: mocks con el contrato acordado (`GET`/`PUT`, `Shop` JSON, `404` = sin tienda) y prueba manual contra la API antes de cerrar; si el servicio devuelve otro shape, se ajusta solo `PanelShop`.
2. **`404` ambiguo:** si la ruta no existe en el entorno, el panel mostraría el estado vacío en lugar de un error de integración. Mitigación: verificar el endpoint en el entorno de demo y documentar el estado esperado en la prueba manual.
3. **Borrado de descripción de producto:** enviar `description=''` funciona solo si `catalog-api` la trata como ausente. Mitigación: confirmar el contrato y cubrirlo con una prueba de `FormData`.
4. **Cambio de tipos obligatorio:** agregar `description` a `EditableProduct`, `ServerProduct` y `CatalogProduct` rompe fixtures existentes. Mitigación: actualizar todos los specs y usar `?? null` al leer datos antiguos.
5. **`CanDeactivate` asíncrono:** el diálogo debe permanecer montado mientras el router espera la promesa; si se resuelve tarde o dos veces puede quedar una navegación colgada. Mitigación: resolver una sola vez, reutilizar la promesa pendiente y probar confirmar/cancelar/Escape.
6. **Detección de cambios con espacios:** comparar valores crudos generaría falsos positivos. Mitigación: normalizar (trim y `null`) y comparar contra el snapshot cargado/guardado.
7. **Sesión expirada:** un `401`/`403` en `GET`/`PUT` no debe confundirse con ausencia de tienda. Mitigación: solo el `404` del `GET` es estado vacío; el resto es error con reintento.
8. **Cobertura ≥ 90 %:** ramas de error y del guard suelen quedar sin cubrir. Mitigación: pruebas explícitas de `404`, error, reintento, confirmación, cancelación y sesión ausente.

## Trazabilidad de requisitos funcionales

| RF | Sección del plan | Tareas asociadas |
|----|------------------|------------------|
| RF-1 | §1, §3, §4, §12 | T2, T4, T10, T16, T19, T21 |
| RF-2 | §3 | T11, T19, T21 |
| RF-3 | §6, §7, Pantalla | T6, T18, T21 |
| RF-4 | §1, §2, §6, Contrato | T2, T3, T6, T10, T16, T17, T18, T21 |
| RF-5 | §3, §4 | T4, T10, T11, T18, T19, T21 |
| RF-6 | §4 | T4, T18, T21 |
| RF-7 | §1, §2, §6, Contrato | T2, T3, T6, T16, T17, T18, T21 |
| RF-8 | §1, §5, §7 | T2, T5, T7, T16, T18, T21 |
| RF-9 | §1, §5, §7 | T5, T7, T18, T21 |
| RF-10 | §1, §6, §7, Contrato | T2, T7, T18, T21 |
| RF-11 | §2, §7, §8, Pantalla | T3, T7, T17, T18, T21 |
| RF-12 | §1, §2, §8, Contrato | T2, T3, T7, T16, T17, T18, T21 |
| RF-13 | §2, §8 | T3, T7, T17, T18, T21 |
| RF-14 | §6, §7, Pantalla | T3, T6, T17, T18, T21 |
| RF-15 | §6, §8, Pantalla | T3, T6, T17, T18, T21 |
| RF-16 | §2, §8, Pantalla | T3, T6, T17, T18, T21 |
| RF-17 | §5 | T1, T5, T18, T21 |
| RF-18 | §5, §7, §12 | T5, T7, T18, T21 |
| RF-19 | §9 | T8, T9, T18, T19, T21 |
| RF-20 | §10 | T1, T12, T13, T14, T20, T21 |
| RF-21 | §10 | T1, T14, T20, T21 |
| RF-22 | §10, Cambios de producto | T1, T12, T13, T14, T20, T21 |
| RF-23 | §10, Cambios de producto | T1, T12, T13, T14, T20, T21 |
| RF-24 | §10 | T1, T14, T20, T21 |
| RF-25 | §10 | T1, T14, T20, T21 |
| RF-26 | §10 | T1, T12, T13, T14, T20, T21 |
| RF-27 | §11 | T15, T20, T21 |
| RF-28 | §11 | T15, T20, T21 |
| RF-29 | §10, §11 | T14, T15, T20, T21 |
| RF-30 | §11 | T15, T20, T21 |

**Cobertura:** RF-1 … RF-30 (todos).

## Fuera de alcance

- Implementar o modificar `panel-api`, `account-api`, `catalog-api` o infraestructura.
- Tener modelo, tabla o persistencia propia de tienda en `panel-web`.
- Imágenes/logo, puntos de venta, horarios, envíos o múltiples tiendas por cuenta.
- Autenticación nueva: se reutiliza la sesión y el login Google existentes.
- Compra, carrito, cantidad o checkout; página pública de detalle (otra aplicación).
- Cambiar el esquema de productos de la spec 002 más allá de agregar la descripción.
- Rediseñar el lenguaje visual del panel.
- Validación duplicada como fuente de verdad: el panel valida para dar feedback inmediato, pero el servicio dueño sigue siendo la autoridad.

## Orden de implementación sugerido

1. Modelo `Shop`, constantes de límites y `description` en los tres tipos de producto — RF-17, RF-20, RF-21, RF-22, RF-26.
2. `PanelShop` (GET/PUT, `404`→`null`) y `ShopStore` (signals, carga, reintento, guardado) — RF-1, RF-4, RF-7, RF-11–RF-16.
3. Pantalla `ShopView`: gate de sesión, formulario, validación, estados de carga/vacío/edición/error/confirmación y acciones responsivas — RF-3–RF-18.
4. Guard de cambios sin guardar con `ConfirmDialog` — RF-19.
5. Ruta lazy `shop` (con `canDeactivate`) + navegación «Mi tienda» visible con sesión — RF-1, RF-2, RF-5, RF-19.
6. Descripción en `PanelCatalog`/`Catalog`/`CatalogFormView` (modelo, FormData, precarga, límite, conservación) y confirmación de guardado de producto — RF-20–RF-30.
7. Pruebas Vitest de servicios, store, vista, guard, navegación y producto; `COVERAGE_MIN=90 npm run verify` y demo manual móvil/escritorio — RF-1 … RF-30.
