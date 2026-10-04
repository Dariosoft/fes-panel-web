# Spec 002 — Catálogo: ABM local, estados y publicación

## Contexto y objetivo
El panel necesita una sección «Catálogo» donde un vendedor pueda dar de alta y editar productos aun sin iniciar sesión, guardándolos en la sesión local del navegador. Al iniciar sesión, esos productos locales **no** se asocian automáticamente: quedan aislados en un grupo propio y solo pasan a la cuenta cuando se publican, individualmente («Publicar») o en conjunto («Publicar catálogo»). Cada producto tiene una etapa (`draft`/`published`) y una posesión (con o sin dueño); publicar, despublicar y eliminar pasan por un modal de confirmación y, según la posesión, operan en el servidor vía `fes-panel-api` o solo en la sesión local. El listado se busca por nombre con una acción explícita resuelta por el backend (`GET /panel/catalog/products?name=...`), sin filtrado en vivo, y los locales sin dueño se filtran en el cliente. El shell del panel es responsive: menú lateral colapsable en escritorio, barra superior con menú desplegable en móvil y layout de alto fijo con scroll solo del contenido. El panel no define el esquema definitivo de productos ni sube imágenes a MinIO.

## Usuarios / actores
- Vendedor u operador que usa el panel de administración, con o sin sesión.
- Vendedor que inicia sesión para asociar y publicar los productos que ya cargó.

## Historias de usuario
- H1: Como vendedor quiero dar de alta y editar productos sin iniciar sesión para preparar mi catálogo sin fricción.
- H2: Como vendedor con sesión quiero que al guardar mis productos queden como drafts de mi cuenta para no perderlos.
- H3: Como vendedor quiero ver la etapa de cada producto y distinguir los que no tienen dueño para saber qué está publicado y qué me pertenece.
- H4: Como vendedor quiero publicar, despublicar y eliminar con una confirmación previa para evitar acciones accidentales.
- H5: Como vendedor quiero publicar todo mi catálogo de una vez para tomar posesión y dejar mis productos publicados.
- H6: Como vendedor quiero distinguir mis productos locales sin dueño de los ya asociados a mi cuenta para saber qué se asociará al publicar.
- H7: Como vendedor quiero una navegación compacta y clara en escritorio y móvil para operar desde cualquier tamaño de pantalla.
- H8: Como vendedor quiero un aviso cuando tengo productos guardados solo en el navegador para no perderlos al cerrar la página.

## Requisitos funcionales (criterios de aceptación en EARS)

### Navegación y vistas
- RF-1: EL SISTEMA mostrará la sección «Catálogo» en el menú lateral del panel.
- RF-2: CUANDO el usuario navega a `/catalog`, EL SISTEMA mostrará el listado de productos.
- RF-3: CUANDO el usuario navega a `/catalog/new`, EL SISTEMA mostrará la vista de alta compartida.
- RF-4: CUANDO el usuario navega a `/catalog/:id/edit`, EL SISTEMA mostrará la vista de edición compartida con los datos del producto.

### Listado, orden y filtro
- RF-5: MIENTRAS no haya sesión, EL SISTEMA mostrará en `/catalog` únicamente los productos locales.
- RF-6: MIENTRAS haya sesión, EL SISTEMA mostrará en `/catalog`, en un grupo separado, los productos locales sin dueño.
- RF-7: MIENTRAS haya sesión, EL SISTEMA mostrará en `/catalog` los productos del servidor de la cuenta de la sesión, tanto en etapa `draft` como `published`.
- RF-8: EL SISTEMA ordenará el listado por fecha de creación, del más reciente al más antiguo.
- RF-9: EL SISTEMA permitirá filtrar el listado por nombre mediante una acción explícita, con los productos del servidor resueltos por el backend.

### Datos del producto
- RF-10: EL SISTEMA permitirá capturar `name`, `price`, `currency` y `stock` opcional en el alta y la edición.
- RF-11: EL SISTEMA ofrecerá `ARS` como moneda por defecto y `USD` como alternativa.

### Imágenes
- RF-12: DONDE haya sesión, EL SISTEMA guardará las imágenes en el servidor en cada guardado, admitiendo hasta 10 imágenes de hasta 2 MB cada una.
- RF-13: MIENTRAS no haya sesión o el producto editado todavía sea local sin dueño, EL SISTEMA permitirá adjuntar hasta 1 imagen por producto.
- RF-14: MIENTRAS no haya sesión, EL SISTEMA avisará de que para adjuntar más de 1 imagen se requiere iniciar sesión.
- RF-15: CUANDO el producto tiene imágenes, EL SISTEMA las mostrará en una galería de solo lectura (carousel).
- RF-16: MIENTRAS el formulario del producto no tenga imágenes, EL SISTEMA mostrará un placeholder.
- RF-17: SI el usuario intenta adjuntar más de 10 imágenes, ENTONCES EL SISTEMA rechazará el excedente e informará del límite.
- RF-18: SI una imagen supera 2 MB, ENTONCES EL SISTEMA la rechazará e informará del límite.
- RF-81: MIENTRAS el producto editado todavía sea local sin dueño y haya sesión, EL SISTEMA limitará a 1 imagen y avisará de que debe publicarse para adjuntar más.

### Alta y edición con y sin sesión
- RF-19: MIENTRAS no haya sesión, EL SISTEMA permitirá dar de alta y editar productos sin exigir inicio de sesión.
- RF-20: CUANDO el usuario guarda sin sesión, EL SISTEMA persistirá el producto únicamente en la sesión local del navegador.
- RF-21: CUANDO el usuario guarda con sesión, EL SISTEMA creará o actualizará en el servidor un draft asociado a su cuenta.
- RF-22: CUANDO el usuario inicia sesión con productos locales sin dueño, EL SISTEMA no los asociará automáticamente a la cuenta.

### Etapa y posesión
- RF-23: EL SISTEMA mostrará en cada producto su etapa (`draft` o `published`).
- RF-24: EL SISTEMA diferenciará los productos sin dueño de los que pertenecen a la cuenta de la sesión.
- RF-25: EL SISTEMA tratará el estado `published` sin dueño como no alcanzable en el flujo normal.

### Publicar y despublicar un producto
- RF-26: MIENTRAS el producto esté en etapa `draft`, EL SISTEMA mostrará el botón «Publicar».
- RF-27: MIENTRAS haya sesión, EL SISTEMA habilitará el botón «Publicar».
- RF-28: MIENTRAS no haya sesión, EL SISTEMA deshabilitará el botón «Publicar» y mostrará un aviso accesible que indique que se requiere sesión.
- RF-29: CUANDO el usuario confirma «Publicar» un producto, EL SISTEMA lo publicará y, si el producto era local sin dueño, tomará posesión de él para la cuenta de la sesión.
- RF-30: MIENTRAS el producto esté en etapa `published`, EL SISTEMA mostrará el botón «Despublicar».
- RF-31: CUANDO el usuario confirma «Despublicar» un producto con dueño, EL SISTEMA lo pasará a etapa `draft` en el servidor.

### Eliminar
- RF-32: EL SISTEMA mostrará el botón «Eliminar» en cada producto.
- RF-33: CUANDO el usuario confirma «Eliminar» un producto con dueño, EL SISTEMA lo eliminará en el servidor vía `fes-panel-api`.
- RF-34: CUANDO el usuario confirma «Eliminar» un producto local sin dueño, EL SISTEMA lo eliminará únicamente de la sesión local.

### Publicar catálogo
- RF-35: MIENTRAS existan cambios sin publicar, EL SISTEMA habilitará el botón «Publicar catálogo».
- RF-36: MIENTRAS no haya sesión, EL SISTEMA deshabilitará el botón «Publicar catálogo» e indicará que se requiere sesión.
- RF-37: CUANDO el usuario confirma «Publicar catálogo», EL SISTEMA publicará y tomará posesión de todos los draft visibles.
- RF-38: EL SISTEMA considerará draft visibles los productos locales sin dueño y los draft con dueño de la cuenta de la sesión.

### Modales de confirmación
- RF-39: CUANDO el usuario elige «Publicar», EL SISTEMA mostrará un modal de confirmación antes de ejecutar la acción.
- RF-40: CUANDO el usuario elige «Despublicar», EL SISTEMA mostrará un modal de confirmación antes de ejecutar la acción.
- RF-41: CUANDO el usuario elige «Eliminar», EL SISTEMA mostrará un modal de confirmación antes de ejecutar la acción.
- RF-42: CUANDO el usuario elige «Publicar catálogo», EL SISTEMA mostrará un modal de confirmación antes de ejecutar la acción.

### Frontera del catálogo
- RF-43: EL SISTEMA usará las rutas `/panel/catalog/...` de `fes-panel-api` como frontera del catálogo.
- RF-44: CUANDO el usuario con sesión carga `/catalog`, EL SISTEMA solicitará `GET {apiBaseUrl}/panel/catalog/products` incluyendo la cookie `fes_session`.
- RF-45: CUANDO guarda con sesión un producto nuevo, EL SISTEMA solicitará `POST {apiBaseUrl}/panel/catalog/products` incluyendo la cookie `fes_session`.
- RF-46: CUANDO guarda con sesión un producto existente, EL SISTEMA solicitará `PUT {apiBaseUrl}/panel/catalog/products/{id}` incluyendo la cookie `fes_session`.
- RF-47: CUANDO publica un producto con sesión, EL SISTEMA solicitará `POST {apiBaseUrl}/panel/catalog/products/{id}/publish` incluyendo la cookie `fes_session`.
- RF-48: CUANDO despublica un producto con sesión, EL SISTEMA solicitará `POST {apiBaseUrl}/panel/catalog/products/{id}/unpublish` incluyendo la cookie `fes_session`.
- RF-49: CUANDO elimina un producto con dueño, EL SISTEMA solicitará `DELETE {apiBaseUrl}/panel/catalog/products/{id}` incluyendo la cookie `fes_session`.
- RF-50: CUANDO publica el catálogo, EL SISTEMA solicitará `POST {apiBaseUrl}/panel/catalog/publish` incluyendo la cookie `fes_session`.
- RF-51: EL SISTEMA no llamará directamente a `fes-catalog-api`.
- RF-52: EL SISTEMA no subirá imágenes a MinIO.
- RF-53: SI una operación con sesión (guardar, publicar, despublicar, eliminar o publicar catálogo) responde 401, ENTONCES EL SISTEMA iniciará el inicio de sesión y reintentará la operación cuando la sesión esté disponible.

### Shell, navegación y layout
- RF-54: EL SISTEMA mostrará la navegación del panel con los iconos `House` para «Inicio» y `Boxes` para «Catálogo».
- RF-55: EL SISTEMA mostrará en el control de sesión los iconos `LogIn` para entrar y `LogOut` para salir según el estado de la sesión.
- RF-56: EL SISTEMA permitirá colapsar y expandir el menú lateral en escritorio, mostrando solo los iconos y alternando los iconos `PanelLeftClose` y `PanelLeftOpen`.
- RF-57: MIENTRAS la pantalla sea de tamaño móvil, EL SISTEMA mostrará una barra superior fija con el logo, el texto «Panel», el botón de menú y el control de sesión, y ocultará la navegación lateral.
- RF-58: CUANDO el usuario toca la barra superior en móvil, EL SISTEMA abrirá el menú de navegación.
- RF-59: CUANDO el usuario elige una opción del menú de navegación móvil, EL SISTEMA cerrará el menú.
- RF-60: EL SISTEMA usará una altura fija de viewport, sin scroll del cuerpo, manteniendo el header fijo y permitiendo scroll solo dentro del contenido.
- RF-61: EL SISTEMA aplicará el padding inferior al contenedor con scroll del contenido.

### Sesión y arranque
- RF-62: CUANDO la aplicación arranca, EL SISTEMA esperará la hidratación de la sesión antes de renderizar las vistas.
- RF-63: CUANDO el usuario cierra sesión, EL SISTEMA recargará la página en la ruta actual.
- RF-64: CUANDO el usuario inicia sesión con Google, EL SISTEMA enviará la ruta actual como `return_to`.

### Filtro por nombre resuelto por el backend
- RF-65: EL SISTEMA mostrará en el header de `/catalog` un campo de búsqueda por nombre y los botones «Aplicar filtros» (icono `Funnel`) y «Eliminar filtros» (icono `FunnelX`).
- RF-66: CUANDO el usuario pulsa «Aplicar filtros», EL SISTEMA solicitará `GET {apiBaseUrl}/panel/catalog/products?name=...` con el nombre ingresado.
- RF-67: EL SISTEMA filtrará por nombre, en el cliente, los productos locales sin dueño, con o sin sesión.
- RF-68: CUANDO el usuario pulsa «Eliminar filtros», EL SISTEMA limpiará el filtro y recargará el listado del servidor sin el parámetro `name`.
- RF-69: EL SISTEMA no filtrará el listado mientras el usuario escribe; aplicará el filtro al pulsar «Aplicar filtros» o Enter.

### Listado y tarjetas
- RF-70: EL SISTEMA mostrará el listado sin títulos de grupo visibles, exponiendo la separación solo como etiqueta accesible.
- RF-71: DONDE el producto no tenga dueño, EL SISTEMA mostrará su tarjeta con un borde/inset-ring rojo.
- RF-72: MIENTRAS existan productos locales guardados, EL SISTEMA mostrará un aviso (`role="status"`) de que se pueden perder al cerrar la página.
- RF-73: EL SISTEMA mostrará en cada tarjeta únicamente el estado de etapa, sin pill de posesión.
- RF-74: EL SISTEMA mostrará las acciones de la tarjeta como botones solo-icono con `aria-label` y `title`: Publicar (`Eye`), Despublicar (`EyeOff`), Editar (`Pencil`) y Eliminar (`Trash2`).
- RF-75: CUANDO el producto tenga imágenes, EL SISTEMA mostrará a la derecha de la tarjeta una galería de solo lectura.
- RF-76: MIENTRAS el producto no tenga imágenes, EL SISTEMA no mostrará galería en la tarjeta.

### Header de la página de catálogo
- RF-77: EL SISTEMA mostrará en el header de `/catalog` el título a la izquierda y las acciones a la derecha alineadas al pie, con la barra de filtros dentro del header.
- RF-78: MIENTRAS la pantalla sea `sm` o mayor, EL SISTEMA mostrará inline los botones «Publicar catálogo» (icono `Eye`) y «Nuevo producto» (icono `Plus`) con icono y texto.
- RF-79: MIENTRAS la pantalla sea menor que `sm`, EL SISTEMA mostrará un único botón `EllipsisVertical` que abre un menú con «Publicar catálogo» y «Nuevo producto» (icono y texto).
- RF-80: CUANDO el usuario elige una opción del menú de acciones, EL SISTEMA cerrará el menú.

## Requisitos no funcionales
- Textos de interfaz en español.
- Interfaz usable desde 320 px de ancho y operable con teclado.
- Los modales de confirmación deben poder cancelarse sin ejecutar la acción.
- El anfitrión de API no se fija en la presentación; cambia con la configuración del entorno.
- El panel no decide el esquema ni persiste de forma definitiva los productos.
- El listado y el formulario muestran estados de carga, vacío y error.
- La navegación es accesible en escritorio y móvil: los controles solo-icono exponen `aria-label` y `title`.
- El shell mantiene una altura fija de viewport y evita el scroll del cuerpo; solo el contenido scrollea.

## Casos límite
- Alta sin sesión: el producto queda solo en la sesión local y no se publica (RF-20).
- Alta con sesión: el producto queda en el servidor como draft con dueño (RF-21).
- Inicio de sesión con productos locales sin dueño: no se asocian y se ven en un grupo separado (RF-6, RF-22).
- Publicar un producto local sin dueño: se publica y se toma posesión para la cuenta (RF-29).
- Publicar catálogo: publica y toma posesión de los locales sin dueño y de los draft con dueño (RF-37, RF-38).
- Eliminar un producto con dueño: se borra en el servidor (RF-33); local sin dueño: solo en la sesión (RF-34).
- 401 en cualquier operación con sesión: se inicia login y se reintenta la operación (RF-53).
- Sin sesión: 1 imagen por producto y aviso de que más requiere sesión (RF-13, RF-14); con sesión: hasta 10 de 2 MB (RF-12).
- Producto local sin dueño editado con sesión: se mantiene el límite de 1 imagen con aviso de publicarlo (RF-81).
- Exceso de imágenes o imagen demasiado grande: se rechaza y se avisa (RF-17, RF-18).
- Sin imágenes: no hay galería en la tarjeta (RF-76) y el formulario muestra placeholder (RF-16).
- Producto `published` sin dueño: no alcanzable en el flujo normal (RF-25).
- Cancelar un modal: no se ejecuta la acción.
- Filtro sin resultados: el listado muestra el estado vacío correspondiente (RF-65, RF-68).
- Productos locales guardados: aviso de posible pérdida al cerrar la página (RF-72).
- Menú móvil abierto: se cierra al elegir una opción (RF-59); menú de acciones móvil: se cierra al elegir (RF-80).
- Sesión no resuelta al arrancar: las vistas esperan la hidratación (RF-62).

## Fuera de alcance
- Definir el esquema de productos y persistir de forma definitiva (vive en `fes-catalog-api`).
- Subir imágenes a MinIO.
- Implementar autenticación (se reutiliza el login Google existente).
- Llamar a `fes-catalog-api` directamente desde el panel.
- Mostrar el catálogo en la tienda (`fes-client-web`).
- Alcanzar el estado `published` sin dueño en el flujo normal.
- Validar reglas de negocio de precio, moneda o stock más allá de capturarlos.
- Filtrado en vivo mientras se escribe (el filtro se aplica con una acción explícita).
- Persistir los productos locales más allá de la pestaña del navegador (`sessionStorage`).
- Buscar por campos distintos del nombre.

## Criterios de finalización
- Todos los RF verificables en demo manual: alta sin sesión, alta con sesión, edición, listado, orden y filtro por backend, publicar, despublicar, eliminar y publicar catálogo con sus modales.
- El flujo con sesión incluye la cookie `fes_session` en cada operación de `/panel/catalog/...` y el reintento tras 401.
- El shell es responsive: menú colapsable en escritorio y barra superior con menú en móvil; el layout no genera scroll de cuerpo.
- La hidratación de la sesión precede al renderizado; el login conserva la ruta y el logout recarga la ruta actual.
- Textos de interfaz en español y comprobación visual del catálogo en móvil y escritorio.

## Dudas abiertas
Ninguna.
