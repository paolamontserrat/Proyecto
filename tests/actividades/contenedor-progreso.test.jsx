import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import datosEdad6 from "../../public/data/6.json";
import ContenedorActividades from "../../src/components/actividades/ContenedorActividades.jsx";
import { configureSupabase, supabase } from "./fixtures/supabaseMock.js";

vi.mock("../../src/supabaseClient.js", async () => import("./fixtures/supabaseMock.js"));
vi.mock("../../src/components/gamificacion/Gamificacion.jsx", () => ({
  useGamificacion: () => ({
    celebracion: null,
    registrarActividad: vi.fn().mockResolvedValue({ nuevo: false }),
    cerrarCelebracion: vi.fn(),
  }),
}));
vi.mock("../../src/components/Footer.jsx", () => ({ default: () => null }));
vi.mock("../../src/components/gamificacion/ModalActividadCompletada.jsx", () => ({
  default: () => null,
}));
vi.mock("../../src/components/gamificacion/MapaActividades.jsx", () => ({
  default: () => null,
}));

vi.mock("../../src/features/0-5/actividades/actividades.jsx", () => import("./fixtures/mockActivities.jsx"));
vi.mock("../../src/features/6/actividades/actividades.jsx", () => import("./fixtures/mockActivities.jsx"));
vi.mock("../../src/features/7/actividades/actividades.jsx", () => import("./fixtures/mockActivities.jsx"));
vi.mock("../../src/features/8/actividades/actividades.jsx", () => import("./fixtures/mockActivities.jsx"));
vi.mock("../../src/features/9/actividades/actividades.jsx", () => import("./fixtures/mockActivities.jsx"));
vi.mock("../../src/features/10/actividades/actividades.jsx", () => import("./fixtures/mockActivities.jsx"));
vi.mock("../../src/features/11/actividades/actividades.jsx", () => import("./fixtures/mockActivities.jsx"));
vi.mock("../../src/features/12/actividades/actividades.jsx", () => import("./fixtures/mockActivities.jsx"));
vi.mock("../../src/features/13/actividades/actividades.jsx", () => import("./fixtures/mockActivities.jsx"));
vi.mock("../../src/features/14/actividades/actividades.jsx", () => import("./fixtures/mockActivities.jsx"));
vi.mock("../../src/features/15/actividades/actividades.jsx", () => import("./fixtures/mockActivities.jsx"));
vi.mock("../../src/features/16/actividades/actividades.jsx", () => import("./fixtures/mockActivities.jsx"));
vi.mock("../../src/features/17/actividades/actividades.jsx", () => import("./fixtures/mockActivities.jsx"));

function renderContenedor() {
  return render(
    <MemoryRouter initialEntries={["/actividades/6"]}>
      <Routes>
        <Route path="/actividades/:rango" element={<ContenedorActividades />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("contenedor y progreso de actividades", () => {
  beforeEach(() => {
    localStorage.setItem("usuario", JSON.stringify({ id: "estudiante-6" }));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ json: () => Promise.resolve(datosEdad6) }),
    );
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  it("sincroniza el avance de Supabase con localStorage y guarda el siguiente paso al completar", async () => {
    const query = configureSupabase({ queryData: [{ actividad_id: 1 }] });
    const user = userEvent.setup();
    renderContenedor();

    expect(await screen.findByRole("heading", { name: datosEdad6.pasos[1].titulo })).toBeInTheDocument();
    expect(localStorage.getItem("progreso-estudiante-6-6")).toBe("2");

    await user.click(screen.getByRole("button", { name: "Completar actividad" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: datosEdad6.pasos[2].titulo })).toBeInTheDocument();
      expect(localStorage.getItem("progreso-estudiante-6-6")).toBe("3");
    });
    expect(query.upsert).toHaveBeenCalledWith(
      {
        usuario_id: "estudiante-6",
        actividad_id: 2,
        completada: true,
      },
      { onConflict: "usuario_id,actividad_id" },
    );
    expect(supabase.from).toHaveBeenCalledWith("progreso_actividades");
  });

  it("conserva el paso local si no puede consultar Supabase", async () => {
    const advertencia = vi.spyOn(console, "warn").mockImplementation(() => {});
    configureSupabase({ queryError: new Error("sin conexión") });
    localStorage.setItem("progreso-estudiante-6-6", "3");
    renderContenedor();

    expect(await screen.findByRole("heading", { name: datosEdad6.pasos[2].titulo })).toBeInTheDocument();
    await waitFor(() => expect(advertencia).toHaveBeenCalledWith("Sync error:", expect.any(Error)));
    expect(localStorage.getItem("progreso-estudiante-6-6")).toBe("3");
  });
});
