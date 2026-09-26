# AGENTS.md - panel-web

## Proyecto
Panel de administración para vendedores de Friendly E-Shop, construido como SPA con Angular LTS y TypeScript estricto. Gestiona la experiencia de tiendas y operaciones consumiendo `panel-api`, que coordina con los servicios de dominio.
Es una aplicacion muy amigable con el usuario que permite principalmente gestionar los productos publicados, el look and feel debe transmitir elegancia y profesionalismo, pero a la vez practicidad. Debe verse como una Admin UI / Admin Panel
Se compila como contenido estático y nginx lo sirve en el puerto 8080 con fallback de SPA.

## Comandos
- Instalar: `npm ci`
- Ejecutar: `npm start`
- Tests: `npm test`
- Compilar: `npm run build`
- Lint: `npm run lint`; valida TypeScript, componentes y templates Angular.

## Estilo y convenciones
- Usa Angular 21, componentes standalone, TypeScript estricto y templates estrictos.
- Nombres y código en inglés; textos de interfaz en español.
- Respeta `eslint.config.js`; corrige errores y warnings sin desactivar reglas como atajo.
- Separa presentación, acceso HTTP y estado; no conviertas componentes en fuentes de verdad del negocio.
- Mantén la interfaz responsive desde 320 px y accesible con HTML semántico y navegación por teclado.

## Reglas
- Lee la skill `/angular-developer` y la spec activa, si existe, antes de tocar código.
- Usa `/angular-architecture` al crear o mover features, componentes, servicios o recursos compartidos.
- Para tareas visuales consulta también `/ui-ux-pro-max` y conserva el lenguaje visual establecido.
- Usa `panel-api` como frontera del panel; no accedas a bases ni dependas de detalles internos de las APIs Java.
- Mantén hosts y configuración de API fuera de los componentes y evita credenciales en el bundle.
- Keycloak y la identidad externa están diferidos; no añadas autenticación sin una spec.
- Mantén versiones fijadas y consulta antes de añadir dependencias o cambiar contratos compartidos.
- No añadas comentarios `eslint-disable` sin una causa documentada y localizada.
- Preserva el fallback SPA y `/healthz` si modificas Docker o nginx; los manifiestos viven en `infra`.

## Al terminar cualquier tarea
- Tras cambios no triviales de código de producción, aplica `/clean-code-guard` antes de finalizar.
- Ejecuta `npm test`; incluye lint de TypeScript/templates y build de producción.
- Prueba manualmente la vista afectada en tamaños móvil y escritorio.
- Verifica estados de carga, vacío, error y permisos cuando cambies consumo de APIs.
