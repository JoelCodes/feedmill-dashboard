import { cn } from "./utils";

describe("cn utility", () => {
  it("returns empty string for no arguments", () => {
    expect(cn()).toBe("");
  });

  it("merges multiple class strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    const isActive = false;
    expect(cn("base", isActive && "active")).toBe("base");
  });

  it("includes truthy conditional classes", () => {
    const isActive = true;
    expect(cn("base", isActive && "active")).toBe("base active");
  });

  it("resolves Tailwind padding conflicts (later wins)", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("resolves Tailwind margin conflicts", () => {
    expect(cn("m-4", "m-8")).toBe("m-8");
  });

  it("resolves Tailwind text color conflicts", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("resolves conflicting hover modifiers", () => {
    expect(cn("hover:bg-red-500", "hover:bg-blue-500")).toBe("hover:bg-blue-500");
  });

  it("preserves non-conflicting classes", () => {
    expect(cn("p-4", "m-2", "text-white")).toBe("p-4 m-2 text-white");
  });

  it("handles array of classes", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("handles undefined and null values", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
  });
});
