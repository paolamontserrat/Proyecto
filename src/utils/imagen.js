// Reduce y comprime una imagen en el navegador antes de subirla.
// Devuelve un Blob (webp o jpeg) de máximo `maxLado` px por lado.
export async function comprimirImagen(file, maxLado = 900, calidad = 0.82) {
  const bmp = await createImageBitmap(file);
  const escala = Math.min(1, maxLado / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * escala);
  const h = Math.round(bmp.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(bmp, 0, 0, w, h);
  bmp.close?.();

  const aBlob = (tipo) =>
    new Promise((resolve) => canvas.toBlob(resolve, tipo, calidad));

  // Algunos navegadores no soportan webp y devuelven png sin avisar:
  // en ese caso se reintenta con jpeg, que pesa mucho menos.
  let blob = await aBlob("image/webp");
  if (!blob || blob.type !== "image/webp") blob = await aBlob("image/jpeg");
  if (!blob) throw new Error("No se pudo procesar la imagen.");
  return blob;
}