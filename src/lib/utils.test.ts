import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn utility", () => {
	it("merges class names correctly", () => {
		const result = cn("foo", "bar");
		expect(result).toBe("foo bar");
	});

	it("handles conditional classes", () => {
		const result = cn("base", false && "hidden", true && "visible");
		expect(result).toBe("base visible");
	});

	it("merges tailwind classes correctly", () => {
		const result = cn("px-2 py-1", "px-4");
		expect(result).toBe("py-1 px-4");
	});

	it("handles undefined and null values", () => {
		const result = cn("foo", undefined, null, "bar");
		expect(result).toBe("foo bar");
	});

	it("handles empty input", () => {
		const result = cn();
		expect(result).toBe("");
	});
});
