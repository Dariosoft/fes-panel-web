# UML 002 — Catálogo: ABM local, estados y publicación

Diagramas alineados con el plan de esta spec en `panel-web` (Angular 21, SPA standalone).

Los diagramas priorizan relaciones arquitectónicas y de flujo; no intentan listar cada import, tipo local o dependencia transitiva ya explicada por el estado, el cliente HTTP o el servicio dueño.

**Configuración:** `apiBaseUrl` = `environment.apiBaseUrl` (sin barra final), el mismo host configurado para todo el panel.

**Frontera HTTP (solo `{apiBaseUrl}/panel/catalog/*`, cookie `fes_session`):** `GET/POST /panel/catalog/products`, `PUT/DELETE /panel/catalog/products/{id}`, `POST /panel/catalog/products/{id}/publish`, `POST /panel/catalog/products/{id}/unpublish`, `POST /panel/catalog/publish`.

**Claves de `sessionStorage`:** `fes.catalog.products.local` (productos locales sin dueño), `fes.catalog.pending-operation` (intención para reintentar tras 401).

**Producto unificado (`CatalogProduct`):** `{ id, name, price, currency, stock?, stage: 'draft'|'published', owned: boolean, origin: 'local'|'server', images: ProductImage[], createdAt }`.

## Capas de componentes

```mermaid
flowchart TB
  subgraph bootstrap["Bootstrap"]
    main["main.ts<br/>bootstrapApplication(App, appConfig)"]
    config["app.config.ts<br/>provideRouter · provideHttpClient<br/>provideAppInitializer → Session.hydrate()"]
    routes["app.routes.ts<br/>catalog · catalog/new · catalog/:id/edit"]
    env["environments/*<br/>apiBaseUrl"]
  end

  subgraph presentation["Presentación"]
    app["App<br/>shell + aside + nav Catálogo"]
    list["CatalogListView<br/>views/catalog-list/"]
    form["CatalogFormView<br/>views/catalog-form/"]
    dialog["ConfirmDialog<br/>core/components/confirm-dialog/"]
    images["ProductImages<br/>core/components/product-images/"]
    status["ProductStatus<br/>core/components/product-status/"]
  end

  subgraph state["Estado"]
    catalog["Catalog<br/>core/services/catalog/catalog.ts<br/>signals · grupos · orden · filtro · acciones"]
    recovery["CatalogRecovery<br/>core/services/catalog/catalog-recovery.ts<br/>remember · resumeIfPending"]
    session["Session<br/>core/services/session/session.ts<br/>authenticated · enterWithGoogle"]
  end

  subgraph http["HTTP"]
    panel["PanelCatalog<br/>core/services/catalog/panel-catalog.ts<br/>/panel/catalog/*"]
  end

  subgraph storage["Almacenamiento local"]
    local["LocalCatalog<br/>core/services/catalog/local-catalog.ts<br/>sessionStorage"]
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
  app --> catalog
  app --> session
  list --> catalog
  list --> dialog
  list --> images
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
  panel --> model
  panel --> env
```

## Estructura de carpetas (planificada)

```
src/app/
  app.ts / app.html                    # shell Admin UI + nav «Catálogo» + RouterOutlet
  app.routes.ts                        # lazy: catalog, catalog/new, catalog/:id/edit
  app.config.ts                        # provideRouter, provideHttpClient, provideAppInitializer
  core/
    components/
      confirm-dialog/                  # modal reutilizable
      product-images/                  # carousel + placeholder + límites de imágenes
      product-status/                  # badges de etapa y posesión
    constants/
      product-stage.ts                 # 'draft' | 'published'
      product-origin.ts                # 'local' | 'server'
      product-limits.ts                # MAX_IMAGES = 10 · MAX_IMAGE_BYTES = 2 MB
      catalog-storage-keys.ts          # claves de sessionStorage
    models/
      catalog-product.ts               # CatalogProduct · ProductImage · Currency
      pending-catalog-operation.ts     # intención tras 401
    services/
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
  alt sin sesión
    Cat->>Local: upsert(producto local, draft, owned:false)
    Local->>SS: set 'fes.catalog.products.local'
    Cat-->>Form: listado actualizado (solo locales)
  else con sesión
    alt producto nuevo
      Cat->>Panel: create(producto + imágenes multipart)
      Panel->>API: POST /panel/catalog/products<br/>(withCredentials, cookie fes_session)
    else producto existente
      Cat->>Panel: update(id, producto + imágenes)
      Panel->>API: PUT /panel/catalog/products/{id}<br/>(withCredentials)
    end
    alt 2xx
      API-->>Panel: producto draft con dueño
      Panel-->>Cat: CatalogProduct(origin:'server', stage:'draft')
      Cat-->>Form: listado/grupos actualizados
    else 401
      API-->>Panel: 401
      Panel-->>Cat: error 401
      Cat->>Cat: handleUnauthorized(operación)
    end
  end
```

## Secuencia: publicar catálogo (toma de posesión masiva)

```mermaid
sequenceDiagram
  participant User as Usuario
  participant List as CatalogListView
  participant Cat as Catalog
  participant Panel as PanelCatalog
  participant API as apiBaseUrl/panel/catalog
  participant Session as Session

  User->>List: «Publicar catálogo» (modal de confirmación)
  List->>Cat: publishCatalog()
  Note over Cat: draft visibles = locales sin dueño + draft con dueño de la cuenta

  loop cada local sin dueño
    Cat->>Panel: create(local + imágenes)
    Panel->>API: POST /panel/catalog/products
  end
  Cat->>Panel: publishCatalog()
  Panel->>API: POST /panel/catalog/publish<br/>(withCredentials, cookie fes_session)
  alt 2xx
    API-->>Panel: drafts publicados
    Panel-->>Cat: éxito
    Cat->>Cat: recargar productos del servidor; vaciar locales ya asociados
    Cat-->>List: todos los draft visibles quedan published con dueño
  else 401
    API-->>Panel: 401
    Cat->>Cat: handleUnauthorized(publishCatalog)
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

  Cat->>Rec: remember({ kind, productId?, payload? })
  Rec->>SS: set 'fes.catalog.pending-operation'
  Cat->>Session: enterWithGoogle()
  Session->>PS: enterWithGoogle()
  PS->>API: GET /panel/identity/login/google (navegación completa)
  Note over Rec,SS: La intención sobrevive a la recarga del login

  Note over Cat: Al volver, Session.hydrate() marca autenticado
  Cat->>Rec: resumeIfPending()
  Rec->>SS: get 'fes.catalog.pending-operation'
  alt hay operación pendiente
    Rec->>Cat: replay(operación)
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

  User->>List: «Eliminar»
  List->>Dialog: abrir confirmación
  alt cancela
    Dialog-->>List: cierre sin acción
  else confirma
    List->>Cat: delete(product)
    alt producto con dueño (origin server)
      Cat->>Panel: delete(id)
      Panel->>API: DELETE /panel/catalog/products/{id}<br/>(withCredentials)
    else local sin dueño
      Cat->>Local: remove(id)
      Note over Local: solo sessionStorage, sin red
    end
    Cat-->>List: listado actualizado
  end
```

## Relaciones de estado

```mermaid
classDiagram
  class Catalog {
    +signal listado
    +computed localWithoutOwner
    +computed ownedFromServer
    +setFilter(name)
    +save(product)
    +publish(product)
    +unpublish(product)
    +remove(product)
    +publishCatalog()
  }
  class PanelCatalog {
    +list()
    +create(product)
    +update(id, product)
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
    +resumeIfPending()
    +clear()
  }
  class Session {
    +authenticated
    +enterWithGoogle()
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
  note right of PublishedConDueno
    published sin dueño no es alcanzable
    en el flujo normal (RF-25)
  end note
```
