import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Auth from "./Auth";

describe("Página de autenticación", () => {
  it("renderiza el branding y ambas pestañas", () => {
    render(<Auth />);
    expect(screen.getByText("FacturaPro")).toBeInTheDocument();
    expect(screen.getByText("Accede a tu cuenta")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Iniciar Sesión/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Registrarse/i })).toBeInTheDocument();
  });

  it("muestra el formulario de inicio de sesión por defecto", () => {
    render(<Auth />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Iniciar Sesión/i })).toBeInTheDocument();
  });
});