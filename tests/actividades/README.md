# Pruebas automatizadas de actividades

# Requisitos

- Node.js compatible con Vite 8 y npm.
- Instalar las dependencias del proyecto con `npm install` (si npm informa de un conflicto de peer dependencies ya presente en el proyecto, use `npm install --legacy-peer-deps`).

# Comandos

- `npm test`: ejecuta las pruebas una vez.
- `npm run test:watch`: inicia Vitest en modo interactivo.

# Cobertura

- `datosPorEdad.test.js` comprueba la existencia, parseo, rango, páginas y pasos identificables de todos los JSON publicados de `0-5` a `17`.
- `actividad-seleccion-y-texto.test.jsx` valida el contenido y los requisitos de la actividad 5 de edad 7: opciones correctas/incorrectas, respuestas obligatorias, guardado local y en Supabase, recuperación y error de consulta.
- `contenedor-progreso.test.jsx` comprueba que el contenedor sincroniza el paso con Supabase/localStorage, guarda el avance al completar y conserva el avance local ante un fallo de consulta.
- Las llamadas a Supabase se sustituyen por un cliente simulado. El estado de localStorage se limpia después de cada prueba.

Las demás actividades se mantienen pendientes de pruebas de interacción específicas; el test de datos por edad no sustituye su cobertura funcional.
