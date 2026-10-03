# UML 002 — Catálogo: ABM local, estados y publicación

Diagramas alineados con la implementación as-built de esta spec en `panel-web` (Angular 21, SPA standalone).

Los diagramas priorizan relaciones arquitectónicas y de flujo; no intentan listar cada import, tipo local o dependencia transitiva ya explicada por el estado, el cliente HTTP o el servicio dueño.

**Configuración:** `apiBaseUrl` = `environment.apiBaseUrl` (sin barra final), el mismo host configurado para todo el panel.

**Frontera HTTP (solo `{apiBaseUrl}/panel/catalog/*`, cookie `fes_session`):** `GET /panel/catalog/products` (con `?name=...` opcional), `POST /panel/catalog/products`, `PUT/DELETE /panel/catalog/products/{id}`, `POST /panel/catalog/products/{id}/publish`, `POST /panel/catalog/products/{id}/unpublish`, `POST /panel/catalog/publish`.

**Claves de `sessionStorage`:** `fes.catalog.products.local` (productos locales sin dueño), `fes.catalog.pending-operation` (intención para reintentar tras 401).

**Producto unificado (`CatalogProduct`):** `{ id, name, price, currency, stock?, stage: 'draft'|'published', owned: boolean, origin: 'local'|'server', images: ProductImage[], createdAt }`.

## Capas de componentes

```mermaid
flowchart TB
  subgraph bootstrap["Bootstrap"]
    main["main.ts<br/>bootstrapApplication(App, appConfig)"]
    config["app.config.ts<br/>provideRouter · provideHttpClient<br/>provideAppInitializer → Session.hydrate() + whenHydrated"]
    routes["app.routes.ts<br/>catalog · catalog/new · catalog/:id/edit"]
    env["environments/*<br/>apiBaseUrl"]
  end

  subgraph presentation["Presentación"]
    app["App<br/>shell h-dvh · nav House/Boxes<br/>colapso · menú móvil"]
    bar["SessionBar<br/>LogIn / LogOut · perfil"]
    list["CatalogListView<br/>views/catalog-list/<br/>header + filtro + tarjetas"]
    form["CatalogFormView<br/>views/catalog-form/"]
    dialog["ConfirmDialog<br/>core/components/confirm-dialog/"]
    images["ProductImages<br/>core/components/product-images/"]
    gallery["ProductGallery<br/>core/components/product-gallery/"]
    status["ProductStatus<br/>core/components/product-status/ etapa"]
  end

  subgraph state["Estado"]
    catalog["Catalog<br/>core/services/catalog/catalog.ts<br/>signals · grupos · orden · filtro backend/local · acciones"]
    recovery["CatalogRecovery<br/>core/services/catalog/catalog-recovery.ts<br/>remember · resumeIfPending"]
    session["Session<br/>core/services/session/session.ts<br/>whenHydrated · authenticated · return_to · logout+reload"]
  end

  subgraph http["HTTP"]
    panel["PanelCatalog<br/>core/services/catalog/panel-catalog.ts<br/>/panel/catalog/* · ?name= · FormData"]
  end

  subgraph storage["Almacenamiento local"]
    local["LocalCatalog<br/>core/services/catalog/local-catalog.ts<br/>sessionStorage"]
  end

  subgraph nav["Navegación externa"]
    external["ExternalNavigation<br/>navigateTo (login) · reload (logout)"]
  end

  subgraph types["Tipos y constantes"]
    model["core/models/catalog-product.ts"]
    pending["core/models/pending-catalog-operation.ts"]
    constants["core/constants/<br/>product-stage · product-origin · product-limits · catalog-storage-keys"]
  end

  main --> config
  config --> app
  config --> routes
  env --> panel
  routes --> list
  routes --> form
  app --> list
  app --> form
  app --> bar
  app --> session
  bar --> session
  list --> catalog
  list --> dialog
  list --> gallery
  list --> status
  form --> catalog
  form --> images
  catalog --> panel
  catalog --> local
  catalog --> recovery
  catalog --> session
  catalog --> model
  catalog --> constants
  local --> constants
  recovery --> pending
  recovery --> session
  session --> external
  session --> panel
  panel --> model
  panel --> env
```

## Estructura de carpetas (as-built)

```
src/app/
  app.ts / app.html                    # shell h-dvh + nav House/Boxes + colapso + header móvil + RouterOutlet
  app.routes.ts                        # lazy: catalog, catalog/new, catalog/:id/edit
  app.config.ts                        # provideRouter, provideHttpClient, provideAppInitializer(whenHydrated)
  core/
    components/
      confirm-dialog/                  # modal reutilizable
      product-gallery/                 # galería de solo lectura de la tarjeta
      product-images/                  # alta/límites de imágenes + carousel del formulario
      product-status/                  # badge de etapa (draft | published)
      session-bar/                     # control de sesión (entrar/salir)
    constants/
      product-stage.ts                 # 'draft' | 'published'
      product-origin.ts                # 'local' | 'server'
      product-limits.ts                # MAX_IMAGES = 10 · MAX_IMAGES_WITHOUT_SESSION = 1 · MAX_IMAGE_BYTES = 2 MB
      catalog-storage-keys.ts          # claves de sessionStorage
      session-status.ts                # 'anonymous' | 'authenticated'
    models/
      catalog-product.ts               # CatalogProduct · ProductImage · Currency · EditableProduct
      pending-catalog-operation.ts     # intención tras 401
    services/
      navigation/
        external-navigation.ts         # navigateTo + reload
      session/
        session.ts                     # signals, whenHydrated, return_to, logout+reload
        panel-session.ts               # HTTP /panel/identity/*
      catalog/
        catalog.ts                     # estado (signals) y acciones
        panel-catalog.ts               # cliente HTTP de la frontera
        local-catalog.ts               # persistencia sessionStorage
        catalog-recovery.ts            # reintento tras 401
  views/
    catalog-list/                      # /catalog
    catalog-form/                      # /catalog/new · /catalog/:id/edit
```

## Secuencia: guardar según sesión

```mermaid
sequenceDiagram
  participant User as Usuario
  participant Form as CatalogFormView
  participant Cat as Catalog
  participant Local as LocalCatalog
  participant Panel as PanelCatalog
  participant API as apiBaseUrl/panel/catalog
  participant SS as sessionStorage

  User->>Form: completar y guardar producto
  Form->>Cat: save(editableProduct)
  alt sin sesión (o producto local existente)
    Cat->>Local: upsert(producto local, draft, owned:false)
    Local->>SS: set 'fes.catalog.products.local'
    Cat-->>Form: listado actualizado (solo locales)
  else con sesión
    alt producto nuevo
      Cat->>Panel: create(producto + imágenes FormData)
      Panel->>API: POST /panel/catalog/products<br/>(withCredentials, cookie fes_session)
    else producto existente
      Cat->>Panel: update(id, producto + imágenes)
      Panel->>API: PUT /panel/catalog/products/{id}<br/>(withCredentials)
    end
    alt 2xx
      API-->>Panel: producto draft con dueño
      Panel-->>Cat: CatalogProduct(origin:'server', stage:'draft')
      Cat->>Cat: applyServerProduct(saved)
      Cat-->>Form: listado/grupos actualizados
    else 401
      API-->>Panel: 401
      Panel-->>Cat: error 401
      Cat->>Cat: fail(operación) → CatalogRecovery + login
    end
  end
```

## Secuencia: publicar un producto

```mermaid
sequenceDiagram
  participant User as Usuario
  participant List as CatalogListView
  participant Dialog as ConfirmDialog
  participant Cat as Catalog
  participant Local as LocalCatalog
  participant Panel as PanelCatalog
  participant API as apiBaseUrl/panel/catalog

  User->>List: «Publicar» (icono Eye) en un draft
  List->>Dialog: abrir confirmación
  alt cancela
    Dialog-->>List: cierre sin acción
  else confirma
    List->>Cat: publish(product)
    alt product.origin === local (sin dueño)
      Cat->>Panel: create(toEditable(product))
      Panel->>API: POST /panel/catalog/products
      API-->>Panel: producto creado (id servidor)
      Cat->>Panel: publish(created.id)
      Panel->>API: POST /panel/catalog/products/{id}/publish
      API-->>Panel: producto published con dueño
      Cat->>Local: remove(product.id)
      Cat->>Cat: applyServerProduct(published)
    else product.origin === server
      Cat->>Panel: publish(product.id)
      Panel->>API: POST /panel/catalog/products/{id}/publish
      API-->>Panel: producto published
      Cat->>Cat: applyServerProduct(published)
    end
    alt 2xx
      Cat-->>List: la tarjeta pasa a etapa Published (dueño)
    else 401
      Cat->>Cat: fail(operación) → CatalogRecovery + login
    end
  end
```

## Secuencia: filtrar por nombre (backend + locales)

```mermaid
sequenceDiagram
  participant User as Usuario
  participant List as CatalogListView
  participant Cat as Catalog
  participant Local as LocalCatalog
  participant Panel as PanelCatalog
  participant API as apiBaseUrl/panel/catalog

  User->>List: escribe en el input (borrador filterDraft)
  Note over List: no hay filtrado en vivo
  User->>List: «Aplicar filtros» (Funnel) o Enter
  List->>Cat: applyFilter(filterDraft())
  Cat->>Cat: filterSignal.set(name.trim())
  alt con sesión
    Cat->>Panel: list(name)
    Panel->>API: GET /panel/catalog/products?name=...<br/>(withCredentials, cookie fes_session)
    API-->>Panel: productos de la cuenta que coinciden
    Panel-->>Cat: serverProductsSignal.set(...)
  else sin sesión
    Note over Cat: no se consulta el servidor
  end
  Note over Cat: localGroup filtra en cliente (applyLocalFilter) los locales sin dueño
  Cat-->>List: grupos recalculados (orden por createdAt desc)

  User->>List: «Eliminar filtros» (FunnelX)
  List->>Cat: clearFilters()
  Cat->>Cat: filterSignal.set('')
  Cat->>Panel: list() (solo con sesión)
  Panel->>API: GET /panel/catalog/products
  API-->>Panel: listado completo
  Panel-->>Cat: serverProductsSignal.set(...)
```

## Secuencia: publicar catálogo (toma de posesión masiva)

```mermaid
sequenceDiagram
  participant User as Usuario
  participant List as CatalogListView
  participant Cat as Catalog
  participant Panel as PanelCatalog
  participant API as apiBaseUrl/panel/catalog

  User->>List: «Publicar catálogo» (modal de confirmación)
  List->>Cat: publishCatalog()
  Note over Cat: draft visibles = locales sin dueño + draft con dueño de la cuenta

  loop cada local sin dueño
    Cat->>Panel: create(toEditable(local))
    Panel->>API: POST /panel/catalog/products
  end
  Cat->>Panel: publishCatalog()
  Panel->>API: POST /panel/catalog/publish<br/>(withCredentials, cookie fes_session)
  alt 2xx
    API-->>Panel: drafts publicados
    Panel-->>Cat: éxito
    Cat->>Cat: quitar locales asociados; recargar productos del servidor
    Cat-->>List: todos los draft visibles quedan published con dueño
  else 401
    API-->>Panel: 401
    Cat->>Cat: fail(publishCatalog) → CatalogRecovery + login
  else error
    API-->>Panel: 5xx / red
    Cat-->>List: aviso en español, sin perder datos locales
  end
```

## Secuencia: recuperación ante 401

```mermaid
sequenceDiagram
  participant Cat as Catalog
  participant Rec as CatalogRecovery
  participant SS as sessionStorage
  participant Session as Session
  participant PS as PanelSession
  participant API as apiBaseUrl/panel/identity

  Cat->>Rec: remember({ kind, productId?, productOrigin?, payload? })
  Rec->>SS: set 'fes.catalog.pending-operation'
  Cat->>Session: enterWithGoogle()
  Session->>PS: enterWithGoogle(router.url)
  PS->>API: GET /panel/identity/login/google?return_to=<ruta> (navegación completa)
  Note over Rec,SS: La intención sobrevive a la recarga del login

  Note over Cat: Al volver, whenHydrated resuelve y authenticated() = true
  Cat->>Rec: resumeIfPending(replay)
  Rec->>SS: get 'fes.catalog.pending-operation'
  alt hay operación pendiente
    Rec->>Cat: replay(operación) → load()
    alt 2xx
      Cat->>Rec: clear()
      Rec->>SS: remove 'fes.catalog.pending-operation'
    else 401 de nuevo
      Cat->>Rec: clear()
      Note over Rec: sin bucles: se descarta la intención
    end
  else sin operación pendiente
    Rec-->>Cat: nada que reintentar
  end
```

## Secuencia: eliminar según posesión

```mermaid
sequenceDiagram
  participant User as Usuario
  participant List as CatalogListView
  participant Dialog as ConfirmDialog
  participant Cat as Catalog
  participant Panel as PanelCatalog
  participant Local as LocalCatalog
  participant API as apiBaseUrl/panel/catalog

  User->>List: «Eliminar» (icono Trash2)
  List->>Dialog: abrir confirmación
  alt cancela
    Dialog-->>List: cierre sin acción
  else confirma
    List->>Cat: remove(product)
    alt producto con dueño (origin server)
      Cat->>Panel: delete(id)
      Panel->>API: DELETE /panel/catalog/products/{id}<br/>(withCredentials)
      Cat->>Cat: serverProductsSignal sin el producto
    else local sin dueño
      Cat->>Local: remove(id)
      Note over Local: solo sessionStorage, sin red
    end
    Cat-->>List: listado actualizado
  end
```

## Secuencia: arranque, login y logout de sesión

```mermaid
sequenceDiagram
  participant Boot as Bootstrap
  participant Session as Session
  participant PS as PanelSession
  participant API as apiBaseUrl/panel/identity
  participant Ext as ExternalNavigation
  participant Router as Router

  Boot->>Session: hydrate()
  Session->>PS: getSession()
  PS->>API: GET /panel/identity/session
  alt 2xx / error (timeout 5000)
    API-->>PS: perfil o error
    PS-->>Session: resuelto
    Session->>Session: whenHydrated.resolve()
  end
  Note over Boot: provideAppInitializer espera whenHydrated antes de renderizar

  alt el usuario entra
    Session->>Router: url = currentPath()
    Session->>PS: enterWithGoogle(return_to = url)
    PS->>Ext: navigateTo(/panel/identity/login/google?return_to=...)
  else el usuario sale
    Session->>PS: logout()
    PS->>API: DELETE /panel/identity/session
    API-->>PS: ok
    Session->>Ext: reload() (misma ruta)
  end
```

## Relaciones de estado

```mermaid
classDiagram
  class Catalog {
    +signal localProducts
    +signal serverProducts
    +signal filter
    +signal loading
    +signal error
    +computed localGroup
    +computed accountGroup
    +computed canPublishCatalog
    +applyFilter(name)
    +clearFilters()
    +resumePending()
    +getProduct(id)
    +load()
    +save(product)
    +publish(product)
    +unpublish(product)
    +remove(product)
    +publishCatalog()
  }
  class PanelCatalog {
    +list(name?)
    +create(product)
    +update(product)
    +delete(id)
    +publish(id)
    +unpublish(id)
    +publishCatalog()
  }
  class LocalCatalog {
    +list()
    +upsert(product)
    +remove(id)
  }
  class CatalogRecovery {
    +remember(operation)
    +resumeIfPending(replay)
    +clear()
  }
  class Session {
    +whenHydrated
    +authenticated
    +hydrate()
    +enterWithGoogle()
    +logout()
  }
  class ProductStatus {
    +input stage
  }
  class ProductGallery {
    +input images
    +next()
    +previous()
  }
  class ProductImages {
    +input images
    +input authenticated
    +output imagesChange
  }
  class CatalogProduct {
    +id
    +name
    +price
    +currency
    +stage
    +owned
    +origin
    +images
    +createdAt
  }
  Catalog --> PanelCatalog : operaciones con sesión
  Catalog --> LocalCatalog : productos sin dueño
  Catalog --> CatalogRecovery : 401
  Catalog --> Session : estado de sesión
  PanelCatalog ..> CatalogProduct : respuesta
  LocalCatalog ..> CatalogProduct : persistido
  CatalogRecovery ..> CatalogProduct : payload a reintentar
  ProductStatus ..> CatalogProduct : etapa
  ProductGallery ..> CatalogProduct : imágenes
  ProductImages ..> CatalogProduct : imágenes
```

## Estados de un producto

```mermaid
stateDiagram-v2
  [*] --> LocalSinDueno: guardar sin sesión
  LocalSinDueno --> DraftConDueno: guardar con sesión (POST)
  LocalSinDueno --> PublishedConDueno: Publicar (crear + publish)
  DraftConDueno --> PublishedConDueno: Publicar / Publicar catálogo
  PublishedConDueno --> DraftConDueno: Despublicar
  LocalSinDueno --> [*]: Eliminar (solo sesión local)
  DraftConDueno --> [*]: Eliminar (servidor)
  PublishedConDueno --> [*]: Eliminar (servidor)
  note right of LocalSinDueno
    se muestra con borde rojo (inset-ring) y aviso
    de posible pérdida; publicado sin dueño no es
    alcanzable en el flujo normal (RF-25)
  end note
```
