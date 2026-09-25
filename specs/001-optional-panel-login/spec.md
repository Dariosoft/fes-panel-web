# Spec 001 — Entrada opcional al panel

## Contexto y objetivo
El panel de administración debe poder usarse sin obligar a identificarse. Quien entra lo hace con la misma cuenta de la tienda, solo a través de panel-api, para entrar, salir y ver quién es; quien no entra sigue usando el panel con normalidad. Este repositorio no guarda la cuenta ni habla con el servicio de cuentas.

## Usuarios / actores
- Persona que usa el panel sin haberse identificado.
- Persona que usa el panel identificada con la cuenta de la tienda.

## Historias de usuario
- H1: Como persona que usa el panel quiero acceder y usarlo sin cuenta para no quedar bloqueado si no me identifico.
- H2: Como persona con cuenta de la tienda quiero entrar en el panel para que sepa quién soy.
- H3: Como persona identificada quiero ver quién soy para confirmar que estoy entrado con la cuenta correcta.
- H4: Como persona identificada quiero salir para dejar de estar identificada y seguir usando el panel sin cuenta.

## Requisitos funcionales (criterios de aceptación en EARS)
- RF-1: EL SISTEMA permitirá usar el panel sin haber entrado con una cuenta.
- RF-2: MIENTRAS el usuario no esté identificado, EL SISTEMA ofrecerá la opción de entrar.
- RF-3: CUANDO el usuario solicita entrar, EL SISTEMA iniciará el acceso con Google, sin pedirle que escriba datos, y pedirá la entrada solo a panel-api.
- RF-4: CUANDO panel-api confirma la entrada, EL SISTEMA considerará al usuario identificado.
- RF-5: MIENTRAS el usuario esté identificado, EL SISTEMA mostrará quién es con su nombre y su correo de Google.
- RF-6: MIENTRAS el usuario esté identificado, EL SISTEMA ofrecerá la opción de salir.
- RF-7: CUANDO el usuario identificado solicita salir, EL SISTEMA pedirá el cierre de la sesión compartida solo a panel-api y dejará de considerarlo identificado.
- RF-8: CUANDO el usuario deja de estar identificado, EL SISTEMA permitirá seguir usando el panel sin cuenta.
- RF-9: EL SISTEMA realizará entrar, salir y consultar quién es el usuario únicamente hablando con panel-api.
- RF-10: EL SISTEMA no llamará al servicio de cuentas para entrar, salir ni mostrar quién es el usuario.
- RF-11: EL SISTEMA no guardará la cuenta en este front.
- RF-12: SI la entrada no se confirma, ENTONCES EL SISTEMA no considerará al usuario identificado e informará de que no pudo entrar.
- RF-13: SI salir no se confirma, ENTONCES EL SISTEMA mantendrá al usuario como identificado e informará de que no pudo salir.
- RF-14: CUANDO el usuario abre o recarga el panel, EL SISTEMA consultará la sesión solo a panel-api y mostrará al usuario identificado si la sesión compartida sigue activa, o sin identificar si no existe o se cerró en el panel o en la tienda.
- RF-15: SI, al recargar o al enviar una solicitud, panel-api ya no reconoce al usuario, ENTONCES EL SISTEMA lo dejará sin identificar, mostrará un aviso y le permitirá seguir usando el panel.

## Requisitos no funcionales
- Los textos de la interfaz de esta funcionalidad estarán en español.
- Entrar, salir y ver quién soy no bloquearán el uso del resto del panel para quien no se identifica.

## Casos límite
- Entrada rechazada o fallida: el usuario permanece sin identificar y recibe aviso de que no pudo entrar.
- Salida fallida: el usuario sigue identificado y recibe aviso de que no pudo salir.
- Si, al recargar o al enviar una solicitud, panel-api ya no reconoce al usuario: queda sin identificar, ve un aviso y puede seguir usando el panel (RF-15).
- No aplica en este corte publicar el catálogo ni el botón Publicar.

## Fuera de alcance
- La puerta de acceso del panel (responsabilidad de panel-api).
- Crear, guardar o administrar la cuenta (responsabilidad del servicio de cuentas).
- La experiencia de la tienda (responsabilidad del front de la tienda).
- Dejar el servicio de cuentas disponible en el entorno (responsabilidad de infraestructura).
- Publicar el catálogo y el botón Publicar.
- Cualquier llamada desde este front al servicio de cuentas.
- Guardar la cuenta en este front.

## Criterios de finalización
- Todos los RF verificables con prueba automatizada o demostración manual en verde.
- Demostración manual: usar el panel sin entrar; entrar; ver quién soy; salir; y seguir usando el panel sin cuenta.
- Comprobar que este front no llama al servicio de cuentas en esos flujos.

## Dudas abiertas
No quedan dudas abiertas.
