# Pasaportes Digitales de Educación Financiera

Plataforma educativa web para acompañar a niñas, niños y jóvenes en el aprendizaje de conceptos y hábitos financieros mediante actividades organizadas por edad, seguimiento de avances y elementos de gamificación. El nombre que aparece en la configuración de la aplicación es **Finanzas Alianzito**.

## 1. Descripción del proyecto

La plataforma ofrece experiencias y contenidos financieros diferenciados para edades de **5 a 17 años**. Cada participante puede avanzar por actividades y retos, consultar su progreso y reunir reconocimientos en su pasaporte digital.

Entre las funciones implementadas se encuentran:

- Inicio de sesión y activación de cuenta mediante número de socio.
- Panel de usuario, pasaporte digital y actividades según el rango de edad.
- Seguimiento de progreso, metas, ahorros y retos.
- Elementos de gamificación, como monedas, sellos, diplomas y reconocimientos.
- Recuperación de contraseña con una pregunta de seguridad.
- Panel administrativo para gestionar usuarios, ahorros, ciclos, configuración, actividades y retos.
- Configuración de aplicación web progresiva (PWA) mediante Vite.

## 2. Tecnologías utilizadas

Las tecnologías y dependencias declaradas en package.json incluyen:

- JavaScript (ES modules): lenguaje y formato de módulos del proyecto.
- React 19 y React DOM: construcción y renderizado de la interfaz.
- Vite 8 y @vitejs/plugin-react: servidor de desarrollo, compilación y soporte de React.
- React Router DOM 7: navegación y definición de rutas protegidas.
- Supabase JS 2: comunicación con Supabase, incluidas consultas RPC para el acceso y otras funciones de la plataforma.
- Tailwind CSS 4 y @tailwindcss/vite: estilos utilitarios, integrados mediante el plugin de Vite y src/index.css.
- vite-plugin-pwa: generación y actualización de los recursos de la PWA.
- Framer Motion y Lucide React: animaciones e iconografía de la interfaz.
- Recharts: visualización de datos.
- PapaParse: procesamiento de archivos CSV.
- html2canvas: generación de imágenes a partir de contenido de la interfaz.
- react-canvas-draw, react-sketch-canvas y react-draggable: dibujo e interacción con elementos arrastrables en actividades.
- ESLint: análisis estático del código JavaScript y JSX.
- Vitest, jsdom y React Testing Library: ejecución de pruebas y renderizado de componentes en un entorno DOM simulado.

firebase también figura como dependencia en package.json, pero no se encontró una importación de Firebase en el código de src/; la integración visible con el servidor es Supabase.

## 3. Requisitos previos

- **Node.js:** 20.19 o posterior de la serie 20, o 22.12 o posterior. Son las versiones indicadas por el requisito de Vite 8 instalado en el proyecto.
- **npm:** incluido con Node.js. El repositorio no establece una versión mínima propia.
- **Git:** para clonar el repositorio.
- **Visual Studio Code:** recomendado para abrir y editar el proyecto; no es necesario para ejecutar los comandos.
- **Conexión con Supabase:** necesaria para las operaciones de inicio de sesión, activación, recuperación de contraseña y otras funciones respaldadas por el servicio.

Comprueba las herramientas instaladas ejecutando node --version, npm --version y git --version.

## 4. Instalación del proyecto

1. Clona el repositorio ejecutando git clone https://github.com/paolamontserrat/Proyecto.git y entra en la carpeta del proyecto con cd Proyecto.
2. Abre la carpeta actual en Visual Studio Code con code .. Si el comando code no está disponible, abre Visual Studio Code y selecciona **Archivo > Abrir carpeta**.
3. Instala las dependencias declaradas en el proyecto con npm install.

## 5. Configuración de variables de entorno

El archivo .env del proyecto declara las variables VITE_SUPABASE_URL y VITE_SUPABASE_KEY. Un archivo de entorno para una configuración basada en variables de Vite tendría estas dos líneas:

- VITE_SUPABASE_URL=https://<id-del-proyecto>.supabase.co
- VITE_SUPABASE_KEY=<clave-publicable-de-supabase>

Usa los valores correspondientes a tu proyecto de Supabase y no publiques credenciales privadas. Las variables con prefijo VITE_ quedan disponibles en el código del navegador; no coloques claves service_role ni otros secretos en ellas.

**Importante:** en la versión actual, src/supabaseClient.js crea el cliente con valores escritos directamente en ese archivo y no lee import.meta.env. Por tanto, crear o modificar .env con las variables anteriores **no cambia la conexión que utiliza la aplicación**. No se incluyen aquí los valores configurados. Para que .env sea la fuente efectiva, habría que actualizar la inicialización del cliente en el código, lo cual no forma parte de esta guía.

## 6. Ejecución en entorno de desarrollo

Inicia el servidor de desarrollo con npm run dev.

Vite muestra en la terminal la dirección local. Normalmente estará disponible en http://localhost:5173. Si ese puerto está ocupado, Vite indicará otro puerto disponible; abre la dirección que muestre la terminal.

## 7. Acceso a la plataforma

La ruta / presenta el acceso por número de socio. La aplicación consulta Supabase para comprobar la cuenta y determina si debe solicitar la creación de contraseña en el primer ingreso o permitir el inicio de sesión habitual. La activación también solicita una pregunta y una respuesta de seguridad. La recuperación está disponible en /recuperar-password.

Las operaciones de acceso y recuperación llaman funciones RPC de Supabase, entre ellas verificar_numero_socio, activar_cuenta, login_usuario, obtener_pregunta_seguridad y recuperar_password. Para utilizarlas, el proyecto de Supabase debe estar disponible y contar con las funciones y datos necesarios. Esta documentación no proporciona cuentas ni credenciales de prueba.

Tras una respuesta correcta, la aplicación guarda en localStorage los datos de sesión del usuario, incluido su rol. Las rutas de usuario (/dashboard/:rango, /pasaporte/:rango y /actividades/:rango) requieren que exista ese registro. El panel administrativo está bajo /admin y su envoltura de ruta comprueba que el rol guardado sea admin; incluye secciones para usuarios, ahorros, ciclos, configuración, actividades y retos.

La protección de rutas descrita es una comprobación del lado del cliente. No sustituye las políticas de seguridad y autorización que deben configurarse en Supabase para proteger datos y operaciones.

## 8. Ejecución de pruebas automatizadas

Las pruebas se ejecutan con Vitest en el entorno jsdom, con utilidades de React Testing Library. Ejecútalas con npm test.

Para mantener Vitest ejecutándose en modo interactivo, ejecuta npm run test:watch.

Las pruebas actuales comprueban los JSON de actividades por edad y algunos flujos de selección, texto y sincronización del progreso. En estos casos se simulan las llamadas a Supabase. No cubren todavía todas las actividades ni todos los flujos de la aplicación. Vitest informa en la terminal cuáles pruebas pasaron o fallaron y finaliza con un código de salida distinto de cero si hay fallos.

## 9. Compilación para producción

Genera la compilación de producción en dist/ con npm run build.

Para servir localmente esa compilación y revisarla en el navegador, ejecuta npm run preview.

El comando de previsualización imprime en la terminal la dirección local que debes abrir. Para revisar el estilo del código, ejecuta npm run lint.

## 10. Solución de problemas frecuentes

- **Error al instalar dependencias:** confirma que Node.js cumple el requisito de Vite indicado arriba y que estás ejecutando npm desde la raíz del repositorio. Si npm informa de un conflicto de dependencias entre pares, el README de pruebas del proyecto documenta como alternativa npm install --legacy-peer-deps; úsala solo ante ese error.
- **Cambiar .env no cambia la conexión:** la inicialización actual de src/supabaseClient.js no lee VITE_SUPABASE_URL ni VITE_SUPABASE_KEY. Consulta la sección de variables de entorno; se necesita adaptar el código para que esas variables tengan efecto.
- **Fallan el acceso, la activación o la recuperación:** comprueba la conexión de red y la disponibilidad del proyecto Supabase. Revisa también que las funciones RPC invocadas por la aplicación y los datos de usuario necesarios estén configurados en ese proyecto.
- **El servidor de desarrollo no usa el puerto esperado:** si el puerto predeterminado está ocupado, Vite selecciona otro y lo indica en la terminal. Usa esa dirección o libera el puerto ocupado antes de iniciar de nuevo.
- **Una ruta protegida devuelve al inicio:** las rutas de usuario y administración requieren una sesión guardada en localStorage; el panel /admin además requiere que el rol guardado sea admin. Inicia sesión de nuevo con una cuenta autorizada.
- **npm run build falla:** lee el primer error reportado por Vite, confirma que las dependencias se instalaron y que los recursos referenciados por la aplicación están presentes. Ejecuta npm run lint si necesitas detectar errores de código adicionales.

## Scripts disponibles

Los comandos npm documentados corresponden a los scripts definidos en package.json:

- npm run dev: inicia el servidor de desarrollo de Vite.
- npm run build: compila la aplicación para producción.
- npm run preview: previsualiza localmente la compilación.
- npm run lint: ejecuta ESLint.
- npm test: ejecuta Vitest una vez.
- npm run test:watch: ejecuta Vitest en modo interactivo.
