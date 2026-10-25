import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const directorioDatos = join("public", "data");
const rangosEsperados = ["0-5", ...Array.from({ length: 12 }, (_, index) => String(index + 6))];

describe("datos JSON de actividades por edad", () => {
  it("incluye archivos para todos los rangos publicados", () => {
    const archivos = readdirSync(directorioDatos)
      .filter((archivo) => archivo.endsWith(".json"))
      .map((archivo) => archivo.replace(/\.json$/, ""))
      .sort((a, b) => rangosEsperados.indexOf(a) - rangosEsperados.indexOf(b));

    expect(archivos).toEqual(rangosEsperados);
  });

  it.each(rangosEsperados)("carga la estructura del rango %s", (rango) => {
    const contenido = readFileSync(join(directorioDatos, `${rango}.json`), "utf8");
    const datos = JSON.parse(contenido);

    expect(datos.rangoEdad).toBe(rango);
    expect(datos.paginas).toEqual(expect.any(Array));
    expect(datos.pasos.length).toBeGreaterThan(0);

    const ids = datos.pasos.map((paso) => paso.id);
    expect(ids.every((id) => id !== undefined && id !== null)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
    expect(datos.pasos.every((paso) => paso && typeof paso === "object")).toBe(true);
  });
});
