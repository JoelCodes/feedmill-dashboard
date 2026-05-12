import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Design system token validation tests.
 *
 * Verifies that CSS custom properties are defined in globals.css with correct values.
 * These tests ensure the token system foundation is in place for component development.
 */

describe("Design System Tokens", () => {
  let globalsCss: string;

  beforeAll(() => {
    const cssPath = resolve(__dirname, "../../app/globals.css");
    globalsCss = readFileSync(cssPath, "utf-8");
  });

  describe("Primary color tokens", () => {
    it("defines --primary token with teal value", () => {
      expect(globalsCss).toMatch(/--primary:\s*#4fd1c5/);
    });

    it("defines --primary-dark token", () => {
      expect(globalsCss).toMatch(/--primary-dark:\s*#38b2ac/);
    });

    it("defines --primary-hover interactive state", () => {
      expect(globalsCss).toMatch(/--primary-hover:\s*#45b8ad/);
    });

    it("defines --primary-active interactive state", () => {
      expect(globalsCss).toMatch(/--primary-active:\s*#3a9d94/);
    });

    it("defines --primary-disabled interactive state", () => {
      expect(globalsCss).toMatch(/--primary-disabled:\s*#a8d5d0/);
    });
  });

  describe("Spacing scale tokens", () => {
    it("defines --space-1 (4px)", () => {
      expect(globalsCss).toMatch(/--space-1:\s*0\.25rem/);
    });

    it("defines --space-2 (8px)", () => {
      expect(globalsCss).toMatch(/--space-2:\s*0\.5rem/);
    });

    it("defines --space-4 (16px)", () => {
      expect(globalsCss).toMatch(/--space-4:\s*1rem/);
    });

    it("defines --space-6 (32px)", () => {
      expect(globalsCss).toMatch(/--space-6:\s*2rem/);
    });

    it("defines --space-12 (96px)", () => {
      expect(globalsCss).toMatch(/--space-12:\s*6rem/);
    });
  });

  describe("Shadow tokens", () => {
    it("defines --shadow-sm token", () => {
      expect(globalsCss).toMatch(/--shadow-sm:\s*0\s+3\.5px\s+5px\s+rgba\(0,\s*0,\s*0,\s*0\.02\)/);
    });

    it("defines --shadow-card token", () => {
      expect(globalsCss).toMatch(/--shadow-card:\s*0\s+3\.5px\s+5px\s+rgba\(0,\s*0,\s*0,\s*0\.03\)/);
    });
  });

  describe("Border radius tokens", () => {
    it("defines --radius-sm (6px)", () => {
      expect(globalsCss).toMatch(/--radius-sm:\s*6px/);
    });

    it("defines --radius-md (8px)", () => {
      expect(globalsCss).toMatch(/--radius-md:\s*8px/);
    });

    it("defines --radius-lg (12px)", () => {
      expect(globalsCss).toMatch(/--radius-lg:\s*12px/);
    });

    it("defines --radius-xl (15px)", () => {
      expect(globalsCss).toMatch(/--radius-xl:\s*15px/);
    });
  });

  describe("Dark mode overrides", () => {
    it("defines dark mode class with primary color override", () => {
      const darkBlock = globalsCss.match(/\.dark\s*\{[\s\S]+?\}/);
      expect(darkBlock).toBeTruthy();
      expect(darkBlock![0]).toMatch(/--primary:\s*#63b3ed/);
    });

    it("defines dark mode background overrides", () => {
      const darkBlock = globalsCss.match(/\.dark\s*\{[\s\S]+?\}/);
      expect(darkBlock![0]).toMatch(/--bg-page:\s*#1a202c/);
      expect(darkBlock![0]).toMatch(/--bg-card:\s*#2d3748/);
    });

    it("defines dark mode text color overrides", () => {
      const darkBlock = globalsCss.match(/\.dark\s*\{[\s\S]+?\}/);
      expect(darkBlock![0]).toMatch(/--text-primary:\s*#e2e8f0/);
      expect(darkBlock![0]).toMatch(/--text-secondary:\s*#a0aec0/);
    });
  });
});
