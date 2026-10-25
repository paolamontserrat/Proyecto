import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import datosEdad7 from "../../public/data/7.json";
import Act05 from "../../src/features/7/actividades/Act05.jsx";
import { configureSupabase } from "./fixtures/supabaseMock.js";

vi.mock("../../src/supabaseClient.js", async () => import("./fixtures/supabaseMock.js"));

const actividad = datosEdad7.pasos.find((paso) => paso.preguntaSeleccion);

function renderActividad(onComplete = vi.fn()) {
  return {
    onComplete,
    ...render(
      <MemoryRouter>
        <Act05 data={actividad} rango="7" onComplete={onComplete} onBack={vi.fn()} />
      </MemoryRouter>,
    ),
  };
}

describe("actividad de selección y respuesta escrita (edad 7)", () => {
  beforeEach(() => {
    localStorage.setItem("usuario", JSON.stringify({ id: "estudiante-7" }));
  });

  it("presenta el contenido configurado y no permite continuar sin progreso previo ni respuestas", async () => {
    const query = configureSupabase();
    renderActividad();

    expect(await screen.findByRole("heading", { name: actividad.titulo })).toBeInTheDocument();
    expect(screen.getByText(actividad.preguntaSeleccion.instruccion)).toBeInTheDocument();
    for (const caso of actividad.preguntaSeleccion.casos) {
      expect(screen.getByText(caso.categoria)).toBeInTheDocument();
    }
    expect(screen.getByText(actividad.seccionFrases.titulo)).toBeInTheDocument();

    const continuar = screen.getByRole("button", { name: "Continuar" });
    expect(continuar).toBeDisabled();
    expect(query.maybeSingle).toHaveBeenCalled();
  });

  it("rechaza una opción incorrecta y campos vacíos; guarda al completar todas las respuestas correctas", async () => {
    const user = userEvent.setup();
    const query = configureSupabase();
    const onComplete = vi.fn();
    renderActividad(onComplete);

    await screen.findByRole("heading", { name: actividad.titulo });
    const opciones = screen.getAllByAltText("Opción");
    await user.click(opciones[0]);
    await user.click(opciones[3]);
    await user.click(opciones[5]);
    await user.click(opciones[6]);

    const continuar = screen.getByRole("button", { name: "Continuar" });
    expect(continuar).toBeDisabled();

    await user.click(opciones[2]);
    const respuestasTexto = screen.getAllByPlaceholderText("Escribe tu respuesta aquí...");
    await user.type(respuestasTexto[0], "   ");
    await user.type(respuestasTexto[1], "Cuidar el agua");
    expect(continuar).toBeDisabled();

    await user.clear(respuestasTexto[0]);
    await user.type(respuestasTexto[0], "Comprar mis útiles");
    expect(continuar).toBeEnabled();

    await user.click(continuar);

    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce());
    expect(localStorage.getItem("act5-7-estudiante-7")).toBeTruthy();
    const progresoLocal = JSON.parse(localStorage.getItem("act5-7-estudiante-7"));
    expect(progresoLocal.textosFrases).toEqual({
      ahorrar_para: "Comprar mis útiles",
      cerrar_llave: "Cuidar el agua",
    });
    expect(query.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        usuario_id: "estudiante-7",
        actividad_id: actividad.id,
        completada: true,
        datos_actividad: expect.objectContaining({
          textosFrases: progresoLocal.textosFrases,
        }),
      }),
      { onConflict: "usuario_id,actividad_id" },
    );
  });

  it("recupera las selecciones y los textos guardados en Supabase", async () => {
    const respuestasSeleccion = Object.fromEntries(
      actividad.preguntaSeleccion.casos.map((caso) => [
        caso.id,
        caso.opciones.find((opcion) => opcion.esCorrecta),
      ]),
    );
    configureSupabase({
      singleData: {
        datos_actividad: {
          respuestasSeleccion,
          textosFrases: {
            ahorrar_para: "Un libro",
            cerrar_llave: "No desperdiciar agua",
          },
        },
      },
    });
    renderActividad();

    expect(await screen.findByRole("heading", { name: actividad.titulo })).toBeInTheDocument();
    const respuestasTexto = screen.getAllByPlaceholderText("Escribe tu respuesta aquí...");
    await waitFor(() => {
      expect(respuestasTexto[0]).toHaveValue("Un libro");
      expect(respuestasTexto[1]).toHaveValue("No desperdiciar agua");
      expect(screen.getByRole("button", { name: "Continuar" })).toBeEnabled();
    });

    const botonCaso = within(screen.getByText("Útiles escolares").parentElement);
    expect(botonCaso.getAllByRole("button")).toHaveLength(2);
  });

  it("permanece bloqueada y registra el error si falla la consulta de progreso", async () => {
    const advertencia = vi.spyOn(console, "warn").mockImplementation(() => {});
    configureSupabase({ singleError: new Error("falló la consulta") });
    renderActividad();

    expect(await screen.findByRole("heading", { name: actividad.titulo })).toBeInTheDocument();
    await waitFor(() => expect(advertencia).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
  });
});
