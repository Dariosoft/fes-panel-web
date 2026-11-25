# Spec 003 — Tienda del vendedor y descripción de producto

## Contexto y objetivo
El detalle público de cada publicación necesita mostrar la tienda del vendedor y la descripción del producto. En este corte el panel incorpora una pantalla, accesible desde la opción «Mi tienda» de la navegación, para que el vendedor autenticado vea y edite los datos públicos de su tienda (nombre y descripción) y un campo de descripción opcional en el formulario de producto, de hasta 1000 caracteres, que se conserva al guardar. La tienda pertenece 1:1 a la cuenta y solo se gestiona con sesión. Esta iteración se limita al panel: no hay compra, carrito, cantidad ni checkout.

## Usuarios / actores
- Vendedor autenticado que gestiona los datos públicos de su tienda.
- Vendedor, con o sin sesión, que carga o edita productos.

## Historias de usuario
- H1: Como vendedor autenticado quiero ver los datos públicos de mi tienda para saber qué información se muestra a los compradores.
- H2: Como vendedor autenticado quiero editar el nombre y la descripción de mi tienda para mantener esa información al día.
- H3: Como vendedor quiero agregar una descripción opcional a mis productos para ampliar la información de la publicación.
- H4: Como vendedor quiero ver estados de carga, error y confirmación para saber qué ocurrió con mis cambios.

## Requisitos funcionales (criterios de aceptación en EARS)

### Acceso a la tienda
- RF-1: MIENTRAS haya sesión, EL SISTEMA mostrará una pantalla para ver y editar los datos públicos de la tienda del vendedor.
- RF-2: EL SISTEMA incluirá en la navegación del panel una opción visible llamada «Mi tienda» que abre la pantalla de la tienda del vendedor.
- RF-3: EL SISTEMA mostrará en la pantalla de la tienda el nombre y la descripción de la tienda.
- RF-4: CUANDO el vendedor abre la pantalla de su tienda, EL SISTEMA cargará los datos públicos actuales de su tienda.
- RF-5: SI no hay sesión, ENTONCES EL SISTEMA no mostrará la pantalla de la tienda.
- RF-6: SI no hay sesión, ENTONCES EL SISTEMA indicará que se requiere iniciar sesión para gestionar la tienda.
- RF-7: SI el vendedor todavía no tiene una tienda configurada, ENTONCES EL SISTEMA mostrará un estado vacío que explica que aún no hay tienda y ofrecerá el formulario para crearla con nombre y descripción.

### Edición de la tienda
- RF-8: EL SISTEMA permitirá editar el nombre de la tienda.
- RF-9: EL SISTEMA permitirá editar la descripción de la tienda.
- RF-10: CUANDO el vendedor confirma el guardado con la única acción «Guardar», EL SISTEMA creará la tienda si no existe o reemplazará sus datos si ya existe, sin botones separados de alta y edición.
- RF-11: CUANDO el guardado de la tienda se completa, EL SISTEMA mostrará una confirmación.
- RF-12: SI el guardado de la tienda falla, ENTONCES EL SISTEMA mostrará un error.
- RF-13: SI el guardado de la tienda falla, ENTONCES EL SISTEMA conservará los datos ingresados por el vendedor.
- RF-14: MIENTRAS los datos de la tienda se cargan, EL SISTEMA mostrará un estado de carga.
- RF-15: SI la carga de los datos de la tienda falla, ENTONCES EL SISTEMA mostrará un error.
- RF-16: CUANDO el vendedor elige reintentar después de un error de carga, EL SISTEMA volverá a cargar los datos de su tienda.
- RF-17: EL SISTEMA exigirá un nombre de tienda obligatorio de 1 a 80 caracteres tras recortar espacios y aceptará una descripción de tienda opcional de hasta 1000 caracteres.
- RF-18: SI el nombre o la descripción de la tienda no cumplen las reglas de validación, ENTONCES EL SISTEMA impedirá el guardado y mostrará un mensaje de validación en español.
- RF-19: SI el vendedor intenta salir de la pantalla con cambios sin guardar, ENTONCES EL SISTEMA le pedirá confirmación para descartarlos; si confirma, descartará los cambios y saldrá, y si cancela, permanecerá en la pantalla.

### Descripción del producto
- RF-20: EL SISTEMA incluirá en el formulario de producto un campo de descripción opcional.
- RF-21: EL SISTEMA limitará la descripción del producto a 1000 caracteres.
- RF-22: CUANDO el vendedor guarda un producto con descripción, EL SISTEMA conservará la descripción junto con el resto de los datos del producto.
- RF-23: CUANDO el vendedor edita un producto que ya tiene descripción, EL SISTEMA mostrará la descripción actual en el formulario.
- RF-24: SI la descripción del producto supera los 1000 caracteres, ENTONCES EL SISTEMA impedirá el guardado.
- RF-25: SI la descripción del producto supera los 1000 caracteres, ENTONCES EL SISTEMA informará el límite de 1000 caracteres.
- RF-26: CUANDO el producto no tiene descripción, EL SISTEMA permitirá guardarlo igualmente.

### Estados del guardado de producto
- RF-27: MIENTRAS el producto se guarda, EL SISTEMA mostrará un estado de carga.
- RF-28: SI el guardado del producto falla, ENTONCES EL SISTEMA mostrará un error.
- RF-29: SI el guardado del producto falla, ENTONCES EL SISTEMA conservará la descripción ingresada.
- RF-30: CUANDO el guardado del producto se completa, EL SISTEMA mostrará una confirmación.

## Requisitos no funcionales
- Textos de interfaz en español.
- Interfaz usable desde 320 px de ancho y operable con teclado.
- Se conserva el lenguaje visual existente del panel (Admin UI).
- Los estados de carga, error y confirmación son perceptibles sin depender solo del color.
- La tienda pertenece 1:1 a la cuenta de la sesión; no se gestionan varias tiendas por cuenta.
- La gestión de la tienda requiere sesión; el formulario de producto mantiene el comportamiento con y sin sesión ya establecido.
- La validación de la tienda informa los límites en español y se aplica antes de guardar.

## Casos límite
- Sin sesión en la pantalla de la tienda: no se muestra y se indica que se requiere iniciar sesión; la opción «Mi tienda» no conduce al formulario (RF-5, RF-6).
- Vendedor todavía sin tienda configurada: se muestra un estado vacío con el formulario de creación por nombre y descripción; al guardar se crea la tienda (RF-7, RF-10).
- Punto de entrada: la opción «Mi tienda» de la navegación abre la pantalla de la tienda (RF-2).
- Nombre de tienda vacío o mayor a 80 caracteres tras recortar espacios: no se guarda y se muestra el mensaje de validación en español (RF-17, RF-18).
- Descripción de tienda mayor a 1000 caracteres: no se guarda y se muestra el mensaje de validación en español (RF-17, RF-18).
- Carga de la tienda en curso: se muestra un estado de carga (RF-14).
- Fallo de carga de la tienda: se muestra un error y se puede reintentar (RF-15, RF-16).
- Fallo al guardar la tienda: se muestra un error y se conservan los datos ingresados (RF-12, RF-13).
- Salida con cambios sin guardar: se pide confirmación para descartarlos; si se confirma, se descartan y se sale; si se cancela, se permanece en la pantalla (RF-19).
- Descripción de producto en el límite de 1000 caracteres: se permite guardar (RF-21, RF-24).
- Descripción de producto por encima de 1000 caracteres: no se guarda y se informa el límite (RF-24, RF-25).
- Producto sin descripción: se guarda igualmente (RF-26).
- Producto con descripción existente al editar: se precarga en el formulario (RF-23).
- Fallo al guardar el producto: se muestra un error y se conserva la descripción ingresada (RF-28, RF-29).

## Fuera de alcance
- Imágenes o logo de la tienda.
- Puntos de venta, horarios y envíos.
- Más de una tienda por cuenta.
- Botones separados de alta y edición de la tienda; el guardado se resuelve con una única acción «Guardar».
- Compras, carrito, cantidad y checkout.
- La página pública de detalle del storefront, que pertenece a otra aplicación.
- Obligatoriedad de la descripción del producto: permanece opcional.
- Rediseño general del panel o cambios del lenguaje visual existente.
- Autenticación nueva: se reutiliza la sesión existente.
- Definir o cambiar el esquema y la persistencia de productos ya acordados en la spec 002.

## Criterios de finalización
- Todos los RF verificables en demo manual con y sin sesión: acceso a la tienda, carga, edición, guardado, confirmación, error y reintento.
- Existe la opción de navegación «Mi tienda» que abre la pantalla de la tienda.
- El vendedor sin tienda ve un estado vacío y puede crearla con nombre y descripción.
- La validación exige nombre de 1 a 80 caracteres tras recortar espacios, acepta descripción opcional de hasta 1000 caracteres e informa en español.
- La salida con cambios sin guardar pide confirmación y respeta la decisión del vendedor.
- La descripción del producto es opcional, se limita a 1000 caracteres, se conserva al guardar y se precarga al editar.
- Textos de interfaz en español, uso desde 320 px y con teclado, y lenguaje visual del panel conservado.
- No quedan preguntas abiertas: las decisiones están reflejadas en los requisitos y los casos límite.

## Decisiones resueltas
- ~~¿Qué debe mostrar la pantalla cuando el vendedor todavía no tiene una tienda configurada?~~ Se muestra un estado vacío que explica que aún no hay tienda y ofrece el formulario para crearla con nombre y descripción.
- ~~¿Desde qué opción o ubicación del panel se llega a la pantalla «Mi tienda»?~~ Se agrega una opción visible de navegación llamada «Mi tienda» en el panel.
- ~~¿Qué reglas de validación aplican al nombre y la descripción de la tienda (obligatoriedad y longitud máxima)?~~ Nombre obligatorio de 1 a 80 caracteres tras recortar espacios; descripción opcional de hasta 1000 caracteres; mensajes de validación en español.
- ~~¿Qué debe ocurrir si el vendedor intenta salir de la pantalla con cambios sin guardar?~~ Se pide confirmación para descartarlos; si confirma, se descartan y sale; si cancela, permanece en la pantalla.
- Guardado de la tienda: una única acción «Guardar» que crea o reemplaza la tienda; no hay botones separados de alta y edición.
- Descripción de producto: sigue siendo opcional hasta 1000 caracteres; el formulario la precarga al editar y la conserva ante error de guardado.
