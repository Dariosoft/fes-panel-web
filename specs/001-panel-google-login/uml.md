# UML 001 — Panel con entrada Google opcional

Diagramas alineados con el código real en la rama `001/feat-panel-google-login`.

**Configuración:** `apiBaseUrl` = `https://api.friendly-e-shop.duckdns.org` (mismo valor en `environment.ts` y `environment.development.ts`).

**JSON de sesión (plano):** `{ authenticated, id?, email?, name? }` — si `authenticated: true`, incluye `id`, `email` y `name`.

## Capas de componentes

```mermaid
flowchart TB
  subgraph bootstrap["Bootstrap"]
    main["main.ts<br/>bootstrapApplication(App, appConfig)"]
    config["app.config.ts<br/>provideRouter · provideHttpClient<br/>provideAppInitializer → Session.hydrate()"]
    routes["app.routes.ts<br/>'' → Shell"]
    env["environments/*<br/>apiBaseUrl"]
  end

  subgraph presentation["Presentación"]
    app["App<br/>RouterOutlet"]
    shell["Shell<br/>features/shell/"]
    bar["SessionBar<br/>components/session-bar/"]
  end

  subgraph state["Estado"]
    session["Session<br/>core/session/session.ts<br/>signals · hydrate · enterWithGoogle · logout"]
  end

  subgraph http["HTTP"]
    panel["PanelSession<br/>core/session/panel-session.ts<br/>GET/POST …/panel/*"]
  end

  subgraph types["Tipos"]
    profile["session-profile.ts<br/>SessionProfile flat JSON"]
  end

  main --> config
  config --> routes
  config --> session
  env --> panel
  env --> session
  routes --> app
  app --> shell
  shell --> bar
  shell --> session
  session --> panel
  panel --> profile
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
    app.routes.ts                    # '' → Shell
    app.ts / app.html                # raíz + RouterOutlet
    core/session/
      session.ts                     # estado (signals)
      panel-session.ts               # cliente HTTP
      session-profile.ts             # tipos JSON plano
    features/shell/
      shell.ts / shell.html
      components/session-bar/
        session-bar.ts / session-bar.html
```

## Secuencia: hidratar al arranque

```mermaid
sequenceDiagram
  participant Boot as bootstrap / appConfig
  participant S as Session
  participant PS as PanelSession
  participant API as apiBaseUrl/panel
  participant UI as Shell / SessionBar

  Boot->>S: provideAppInitializer → hydrate()
  S->>PS: getSession()
  PS->>API: GET /panel/session<br/>(withCredentials)
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
  S->>S: applyLoginErrorFromUrl()<br/>(?login_error → aviso + replaceState)
```

## Secuencia: Entrar con Google

```mermaid
sequenceDiagram
  participant User as Usuario
  participant Bar as SessionBar
  participant Shell as Shell
  participant S as Session
  participant Nav as Navegador
  participant API as apiBaseUrl/panel

  User->>Bar: clic «Entrar con Google»
  Bar->>Shell: enterWithGoogle.emit()
  Shell->>S: session.enterWithGoogle()
  S->>Nav: location.assign(apiBaseUrl + '/panel/login/google')
  Nav->>API: GET /panel/login/google<br/>(navegación completa, no XHR)
  Note over Nav,API: OAuth y cookie fes_session<br/>los resuelve el backend
  Nav-->>Nav: return_to → panel
  Note over S: Al recargar, hydrate()<br/>pinta «Salir» o aviso login_error
```

## Secuencia: Salir

```mermaid
sequenceDiagram
  participant User as Usuario
  participant Bar as SessionBar
  participant Shell as Shell
  participant S as Session
  participant PS as PanelSession
  participant API as apiBaseUrl/panel

  User->>Bar: clic «Salir»
  Bar->>Shell: logout.emit()
  Shell->>S: session.logout()
  S->>PS: logout()
  PS->>API: POST /panel/logout<br/>(withCredentials, cuerpo null)
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

## Contrato HTTP (solo `{apiBaseUrl}/panel/*`)

| Operación | Método | Path relativo |
|-----------|--------|---------------|
| Iniciar Google | GET (navegación) | `/panel/login/google` |
| Consultar sesión | GET | `/panel/session` |
| Cerrar sesión | POST | `/panel/logout` |

`{apiBaseUrl}` = `https://api.friendly-e-shop.duckdns.org`
