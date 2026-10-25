// FONDOS DE LOS DIPLOMAS Y RECONOCIMIENTOS
// Aquí se cambia el fondo de cada uno. Cada fondo es una imagen de la carpeta public/images/.
//
// Para cambiarlo:
//  1) Guarda la imagen nueva en public/images/ (por ejemplo FondoDiploma.png).
//  2) Cambia su ruta abajo: imagen: "/images/FondoDiploma.png".
//
// Recomendaciones para la imagen:
//  - Proporción parecida a 1200 x 850 (o 16:9 y se recorta). Formato PNG o JPG.
//  - Que sea clara en el centro: el texto va encima.
//  - Tiene que estar dentro del proyecto (public/images). Las imágenes de otras páginas web
//    no se pueden descargar en el diploma (el navegador las bloquea).
//  - Evita colocar personajes o dibujos grandes en el centro, para que no tapen el texto.
//  - posicion: qué parte de la imagen se ve si se recorta ("center", "right center", "left top"...).
const FONDO_ADMIN = "/images/FondoAdmin.png";

export const FONDOS_DIPLOMAS = {
  diploma: { imagen: FONDO_ADMIN, posicion: "right center" },                // Diploma de ahorro (3 sellos)
  reconocimientoAhorro: { imagen: FONDO_ADMIN, posicion: "right center" },   // Reconocimiento de reto de ahorro
  reconocimientoHabito: { imagen: FONDO_ADMIN, posicion: "right center" },   // Reconocimiento de reto de hábito
};

// Estilo CSS del fondo que usan las plantillas.
export const estiloFondo = (clave) => {
  const { imagen, posicion } = FONDOS_DIPLOMAS[clave];
  return {
    backgroundColor: "#eef2ff", // color de respaldo mientras carga la imagen
    backgroundImage: `url('${imagen}')`,
    backgroundSize: "cover",
    backgroundPosition: posicion,
  };
};