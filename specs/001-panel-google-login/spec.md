# Spec 001 — Panel con entrada Google opcional

## Contexto y objetivo
El panel de administración de Friendly E-Shop debe presentarse como una Admin UI elegante y práctica para vendedores, usable por completo sin autenticación. En este corte se añade una entrada opcional con Google y el cierre de sesión, ambos solo a través de panel-api, para compartir la misma sesión con la tienda sin acoplar el panel a Google ni a otros servicios de dominio.

## Usuarios / actores
- Vendedor o operador que usa el panel de administración (con o sin sesión).
- Visitante que explora el panel sin autenticarse.

## Historias de usuario
- H1: Como visitante quiero usar el panel completo sin iniciar sesión para operar sin fricción obligatoria.
- H2: Como visitante quiero entrar con Google para asociar mi identidad a la sesión compartida cuando lo necesite.
- H3: Como usuario autenticado quiero salir del panel para cerrar la sesión compartida también en la tienda.

## Requisitos funcionales (criterios de aceptación en EARS)
- RF-1: EL SISTEMA presentará la página como panel de administración (Admin UI) orientado a vendedores, con aspecto elegante, profesional y práctico.
- RF-2: EL SISTEMA permitirá usar la página entera sin exigir inicio de sesión.
- RF-3: MIENTRAS no haya sesión, EL SISTEMA mostrará «Entrar con Google» y no mostrará «Salir».
- RF-4: MIENTRAS haya sesión, EL SISTEMA mostrará «Salir» y no mostrará «Entrar con Google».
- RF-5: CUANDO el usuario elige «Entrar con Google», EL SISTEMA navegará a `GET {API}/panel/identity/login/google`, donde `{API}` es el anfitrión de API configurado para el entorno.
- RF-6: CUANDO se carga la página, EL SISTEMA consultará `GET {API}/panel/identity/session` incluyendo las credenciales de sesión.
- RF-7: CUANDO el usuario elige «Salir», EL SISTEMA solicitará `DELETE {API}/panel/identity/session` incluyendo las credenciales de sesión.
- RF-8: CUANDO el cierre de sesión se completa con éxito, EL SISTEMA dejará la sesión compartida cerrada también para la tienda.
- RF-9: EL SISTEMA hablará únicamente con el anfitrión de API configurado para el entorno (por ejemplo Minikube u otro dominio futuro).
- RF-10: EL SISTEMA no incluirá el identificador de cliente de Google en el código entregado al navegador.
- RF-11: EL SISTEMA no invocará account-api, las APIs Java de dominio ni Google desde el panel.
- RF-12: MIENTRAS haya sesión, EL SISTEMA mostrará el nombre y el correo de la persona.
- RF-13: CUANDO el usuario vuelve del flujo de Google con sesión, EL SISTEMA mostrará el panel con «Salir».
- RF-14: SI el usuario vuelve del flujo de Google sin sesión y la URL trae el indicador de que no se pudo entrar, ENTONCES EL SISTEMA mostrará «Entrar con Google» y un aviso de que no se pudo entrar.
- RF-15: SI la consulta de sesión falla, ENTONCES EL SISTEMA mantendrá el panel usable, mostrará «Entrar con Google» y un aviso.
- RF-16: SI el cierre de sesión falla, ENTONCES EL SISTEMA mantendrá «Salir» y mostrará un aviso de que no se pudo salir.

## Requisitos no funcionales
- Textos de interfaz en español.
- Interfaz usable desde 320 px de ancho y operable con teclado.
- La entrada con Google es opcional: no bloquea el uso del panel.
- El anfitrión de API no se fija en la presentación; cambia con la configuración del entorno.

## Casos límite
- Carga de la página sin sesión activa: el panel sigue usable y muestra «Entrar con Google» (RF-3).
- Retorno de Google con sesión: el panel muestra «Salir» (RF-13).
- Retorno de Google sin sesión, con el indicador en la URL: se muestra «Entrar con Google» y un aviso de que no se pudo entrar (RF-14).
- Fallo al consultar la sesión: el panel sigue usable, muestra «Entrar con Google» y un aviso (RF-15).
- Fallo al cerrar la sesión: se mantiene «Salir» y un aviso de que no se pudo salir (RF-16).

## Fuera de alcance
- Llamadas desde el panel a account-api, a las APIs Java de dominio o a Google.
- Publicar catálogos.
- Dar de alta una tienda.
- Exigir membresía de vendedor u otros controles de autorización de negocio.
- Incluir el identificador de cliente de Google en el código entregado al navegador.

## Criterios de finalización
- Todos los RF decididos verificables en demo manual del flujo principal (uso sin login, entrar con Google vía panel-api, consultar sesión al cargar, salir con `DELETE /panel/identity/session` y comprobar efecto en la sesión compartida).
- Los marcadores `[NECESITA ACLARACIÓN]` resueltos o aceptados explícitamente como diferidos.
- Textos de interfaz en español y comprobación visual del panel como Admin UI en móvil y escritorio.

## Dudas abiertas
Ninguna.
