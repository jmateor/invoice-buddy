import { describe, it, expect } from "vitest";
import { traducirError } from "./errorTranslator";

describe("traducirError", () => {
  it("traduce mensajes conocidos exactos al español", () => {
    expect(traducirError("Invalid login credentials")).toBe(
      "Credenciales de inicio de sesión inválidas"
    );
    expect(traducirError("Failed to fetch")).toBe(
      "Error de conexión. Verifique su internet"
    );
  });

  it("hace match parcial dentro de mensajes largos", () => {
    expect(
      traducirError("ERROR: duplicate key value violates unique constraint 'users_pkey'")
    ).toBe("Ya existe un registro con esos datos (valor duplicado)");
  });

  it("envuelve mensajes en inglés desconocidos con prefijo", () => {
    expect(traducirError("Something went wrong")).toBe("Error: Something went wrong");
  });

  it("devuelve el mensaje original si no es inglés puro", () => {
    expect(traducirError("Código 500 — fallo")).toBe("Código 500 — fallo");
  });

  it("maneja mensajes vacíos", () => {
    expect(traducirError("")).toBe("Error desconocido");
  });
});