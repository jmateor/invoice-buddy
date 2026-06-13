import { describe, it, expect } from "vitest";
import { validateRNC, formatRNC, cleanRNC } from "./validators";

describe("validateRNC", () => {
  it("acepta vacío/nulo como válido", () => {
    expect(validateRNC("")).toBe(true);
    expect(validateRNC(null)).toBe(true);
    expect(validateRNC(undefined)).toBe(true);
  });

  it("acepta RNC de 9 dígitos", () => {
    expect(validateRNC("123456789")).toBe(true);
    expect(validateRNC("123-45678-9")).toBe(true);
  });

  it("acepta cédula de 11 dígitos", () => {
    expect(validateRNC("00112345678")).toBe(true);
    expect(validateRNC("001-1234567-8")).toBe(true);
  });

  it("rechaza longitudes inválidas", () => {
    expect(validateRNC("12345")).toBe(false);
    expect(validateRNC("1234567890")).toBe(false);
  });
});

describe("formatRNC", () => {
  it("formatea RNC de 9 dígitos con guiones", () => {
    expect(formatRNC("123456789")).toBe("123-45678-9");
  });

  it("formatea cédula de 11 dígitos con guiones", () => {
    expect(formatRNC("00112345678")).toBe("001-1234567-8");
  });

  it("devuelve cadena vacía si es nulo", () => {
    expect(formatRNC(null)).toBe("");
    expect(formatRNC(undefined)).toBe("");
  });
});

describe("cleanRNC", () => {
  it("elimina cualquier caracter no numérico", () => {
    expect(cleanRNC("123-45678-9")).toBe("123456789");
    expect(cleanRNC("abc 001.123.4567/8")).toBe("00112345678");
  });
});