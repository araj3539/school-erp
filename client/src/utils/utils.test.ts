import { describe, it, expect } from "vitest";
import { cn, formatCurrency, formatDate, formatDateTime, truncate } from "./index";

describe("Client Utilities", () => {
  describe("cn", () => {
    it("should merge class names", () => {
      expect(cn("base", "extra")).toBe("base extra");
    });

    it("should handle conditional classes", () => {
      expect(cn("base", true && "conditional")).toBe("base conditional");
      expect(cn("base", false && "conditional")).toBe("base");
    });

    it("should handle tailwind conflicts", () => {
      expect(cn("p-2 p-4")).toBe("p-4");
    });
  });

  describe("formatCurrency", () => {
    it("should format INR by default", () => {
      expect(formatCurrency(1000)).toBe("₹1,000.00");
      expect(formatCurrency(1000.5)).toBe("₹1,000.50");
    });

    it("should format with zero decimals for whole numbers", () => {
      expect(formatCurrency(1000)).toBe("₹1,000.00");
    });

    it("should handle zero", () => {
      expect(formatCurrency(0)).toBe("₹0.00");
    });

    it("should handle large numbers", () => {
      expect(formatCurrency(100000)).toBe("₹1,00,000.00");
    });
  });

  describe("formatDate", () => {
    it("should format date string", () => {
      expect(formatDate("2024-01-15")).toBe("15 Jan 2024");
      expect(formatDate("2024-12-25")).toBe("25 Dec 2024");
    });

    it("should format Date object", () => {
      expect(formatDate(new Date("2024-01-15"))).toBe("15 Jan 2024");
    });

    it("should accept custom options", () => {
      expect(formatDate("2024-01-15", { year: "2-digit" })).toBe("15 Jan 24");
    });
  });

  describe("formatDateTime", () => {
    it("should format date and time", () => {
      const result = formatDateTime("2024-01-15T14:30:00");
      expect(result).toContain("15 Jan 2024");
      expect(result).toContain("14:30");
    });
  });

  describe("truncate", () => {
    it("should truncate long strings", () => {
      expect(truncate("Hello World", 8)).toBe("Hello...");
    });

    it("should not truncate short strings", () => {
      expect(truncate("Hi", 10)).toBe("Hi");
    });

    it("should handle exact length", () => {
      expect(truncate("Hello", 5)).toBe("Hello");
    });
  });
});