# UML 001 — Panel con entrada Google opcional

Diagramas alineados con el código real en la rama `001/feat-panel-google-login`.

Los diagramas priorizan relaciones arquitectónicas y de flujo; no intentan listar cada import, tipo local o dependencia transitiva ya explicada por el servicio de estado, el cliente HTTP o el componente dueño.

**Configuración:** `apiBaseUrl` = `https://api.friendly-e-shop.duckdns.org` (mismo valor en `environment.ts` y `environment.development.ts`).

**JSON de sesión (plano):** `{ authenticated, id?, email?, name? }` — si `authenticated: true`, incluye `id`, `email` y `name`.

## Capas de componentes

```mermaid
flowchart TB
  subgraph bootstrap["Bootstrap"]
    main["main.ts<br/>bootstrapApplication(App, appConfig)"]
    config["app.config.ts<br/>provideRouter · provideHttpClient<br/>provideAppInitializer → Session.hydrate()"]
    routes["app.routes.ts<br/>'' → HomeView"]
    env["environments/*<br/>apiBaseUrl"]
  end

  subgraph presentation["Presentación"]
    app["App<br/>Admin shell + RouterOutlet"]
    home["HomeView<br/>views/home/"]
    bar["SessionBar<br/>core/components/session-bar/"]
  end

  subgraph state["Estado"]
    session["Session<br/>core/services/session/session.ts<br/>signals · hydrate · enterWithGoogle · logout"]
  end

  subgraph http["HTTP"]
    panel["PanelSession<br/>core/services/session/panel-session.ts<br/>GET/DELETE …/panel/identity/*"]
    external["ExternalNavigation<br/>core/services/navigation/"]
  end

  subgraph types["Tipos"]
    profile["core/models/session-profile.ts<br/>SessionProfile flat JSON"]
    status["core/constants/session-status.ts<br/>anonymous/authenticated"]
  end

  main --> config
  config --> app
  config --> routes
  config --> session
  env --> panel
  env --> session
  routes --> home
  app --> bar
  app --> session
  app --> home
  session --> panel
  session --> status
  panel --> profile
  panel --> external
  session --> profile
```

## Estructura de carpetas (real)

```
src/
  main.ts
  styles.css                         # Tailwind v4 + Fira Sans / Fira Code
  environments/
    environment.ts                   # apiBaseUrl duckdns
    environment.development.ts       # mismo apiBaseUrl hoy
  app/
    app.config.ts                    # provideAppInitializer → hydrate
    app.routes.ts                    # '' → HomeView
    app.ts / app.html                # shell Admin UI persistente + RouterOutlet
    core/
      components/session-bar/
        session-bar.ts / session-bar.html
      constants/session-status.ts
      models/session-profile.ts      # tipos JSON plano
      services/
        navigation/external-navigation.ts
        session/
          session.ts                 # estado (signals)
          panel-session.ts           # cliente HTTP
    views/home/
      home.ts / home.html
```

## Secuencia: hidratar al arranque

```mermaid
sequenceDiagram
  participant Boot as bootstrap / appConfig
  participant S as Session
  participant PS as PanelSession
  participant API as apiBaseUrl/panel/identity
  participant UI as App / SessionBar

  Boot->>S: provideAppInitializer → hydrate()
  S->>PS: getSession()
  PS->>API: GET /panel/identity/session<br/>(withCredentials)
  alt authenticated + name + email
    API-->>PS: {authenticated:true, id, email, name}
    PS-->>S: SessionProfile
    S->>S: setAuthenticated(profile)
    S->>UI: status=authenticated, perfil, sin aviso
  else authenticated: false (200)
    API-->>PS: {authenticated:false}
    PS-->>S: SessionProfile
    S->>S: setAnonymous()
    S->>UI: «Entrar con Google»
  else error de red / 5xx
    API-->>PS: error
    PS-->>S: throw
    S->>S: setAnonymous(aviso sesión)
    S->>UI: «Entrar con Google» + aviso
  end
  S->>S: applyLoginErrorFromUrl()<br/>(Router.parseUrl ?login_error → aviso + router.navigate replaceUrl)
```

## Secuencia: Entrar con Google

```mermaid
sequenceDiagram
  participant User as Usuario
  participant Bar as SessionBar
  participant App as App
  participant S as Session
  participant PS as PanelSession
  participant Ext as ExternalNavigation
  participant API as apiBaseUrl/panel/identity

  User->>Bar: clic «Entrar con Google»
  Bar->>App: enterWithGoogle.emit()
  App->>S: session.enterWithGoogle()
  S->>PS: enterWithGoogle()
  PS->>Ext: navigateTo(apiBaseUrl + '/panel/identity/login/google')
  Ext->>API: GET /panel/identity/login/google<br/>(navegación completa, no XHR)
  Note over Ext,API: OAuth y cookie fes_session<br/>los resuelve el backend
  Ext-->>Ext: return_to → panel
  Note over S: Al recargar, hydrate()<br/>pinta «Salir» o aviso login_error
```

## Secuencia: Salir

```mermaid
sequenceDiagram
  participant User as Usuario
  participant Bar as SessionBar
  participant App as App
  participant S as Session
  participant PS as PanelSession
  participant API as apiBaseUrl/panel/identity

  User->>Bar: clic «Salir»
  Bar->>App: logout.emit()
  App->>S: session.logout()
  S->>PS: logout()
  PS->>API: DELETE /panel/identity/session<br/>(withCredentials)
  alt 2xx
    API-->>PS: OK
    PS-->>S: éxito
    S->>S: setAnonymous()
    S->>Bar: «Entrar con Google», sin perfil
  else error
    API-->>PS: error
    PS-->>S: throw
    S->>S: notice = «No se pudo salir.»
    S->>Bar: sigue «Salir» + perfil + aviso
  end
```

## Contrato HTTP (solo `{apiBaseUrl}/panel/identity/*`)

| Operación | Método | Path relativo |
|-----------|--------|---------------|
| Iniciar Google | GET (navegación) | `/panel/identity/login/google` |
| Consultar sesión | GET | `/panel/identity/session` |
| Cerrar sesión | DELETE | `/panel/identity/session` |

`{apiBaseUrl}` = `https://api.friendly-e-shop.duckdns.org`
