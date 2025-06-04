# **App Name**: S.A.R.A "Sistema de Administración Responsable de Arriendos"

## Core Features:

- Autenticación de Usuario: Autenticación de usuarios mediante correo electrónico y contraseña utilizando Firebase Authentication con roles de 'Arrendador' e 'Inquilino'.
- Panel de Control Basado en Roles: Vista del panel de control basada en el rol del usuario (Arrendador o Inquilino) después del inicio de sesión.
- Administración de Propiedades: Interfaz de administración de propiedades para que los Arrendadores creen, administren y vean listados de propiedades (dirección, estado, descripción).
- Administración de Contratos: Interfaz de administración de contratos para crear nuevos contratos (Arrendadores) y revisar/aprobar contratos (Inquilinos).
- Ruta de Inicio de Sesión: Ruta: /login para inicio de sesión y registro de usuarios.
- Ruta del Panel de Control: Ruta: /dashboard para mostrar el panel de control después de la autenticación del usuario.
- Ruta de Propiedades: Ruta: /propiedades para que el arrendador administre las propiedades.
- Ruta de Contratos: Ruta: /contratos para listar contratos con opciones para crear o aprobar según el rol del usuario.

## Style Guidelines:

- Color primario: Azul suave (#64B5F6) para evocar confianza y seguridad.
- Color de fondo: Gris claro (#F0F4F7) para proporcionar un telón de fondo limpio y neutral.
- Color de acento: Verde sutil (#81C784) para indicar estados de aprobación o éxito.
- Fuente del cuerpo y del encabezado: 'Inter', un sans-serif de estilo grotesco, que proporciona una apariencia limpia y moderna tanto para los encabezados como para el texto del cuerpo.
- Utilice iconos limpios y minimalistas para representar propiedades, contratos y roles de usuario.
- Mantenga un diseño limpio y organizado con secciones claras para listados de propiedades, administración de contratos y perfiles de usuario.
- Transiciones y animaciones sutiles para proporcionar retroalimentación sobre las interacciones del usuario, como la aprobación de contratos o la creación de propiedades.