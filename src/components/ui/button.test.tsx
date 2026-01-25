import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
	it("renders with default props", () => {
		render(<Button>Click me</Button>);
		const button = screen.getByRole("button", { name: /click me/i });
		expect(button).toBeInTheDocument();
		expect(button).toHaveAttribute("data-variant", "default");
		expect(button).toHaveAttribute("data-size", "default");
	});

	it("renders with different variants", () => {
		const { rerender } = render(<Button variant="destructive">Delete</Button>);
		expect(screen.getByRole("button")).toHaveAttribute(
			"data-variant",
			"destructive",
		);

		rerender(<Button variant="outline">Outline</Button>);
		expect(screen.getByRole("button")).toHaveAttribute(
			"data-variant",
			"outline",
		);

		rerender(<Button variant="ghost">Ghost</Button>);
		expect(screen.getByRole("button")).toHaveAttribute("data-variant", "ghost");
	});

	it("renders with different sizes", () => {
		const { rerender } = render(<Button size="sm">Small</Button>);
		expect(screen.getByRole("button")).toHaveAttribute("data-size", "sm");

		rerender(<Button size="lg">Large</Button>);
		expect(screen.getByRole("button")).toHaveAttribute("data-size", "lg");

		rerender(<Button size="icon">Icon</Button>);
		expect(screen.getByRole("button")).toHaveAttribute("data-size", "icon");
	});

	it("handles click events", () => {
		const handleClick = vi.fn();
		render(<Button onClick={handleClick}>Click me</Button>);

		fireEvent.click(screen.getByRole("button"));
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it("can be disabled", () => {
		const handleClick = vi.fn();
		render(
			<Button disabled onClick={handleClick}>
				Disabled
			</Button>,
		);

		const button = screen.getByRole("button");
		expect(button).toBeDisabled();

		fireEvent.click(button);
		expect(handleClick).not.toHaveBeenCalled();
	});

	it("accepts custom className", () => {
		render(<Button className="custom-class">Custom</Button>);
		expect(screen.getByRole("button")).toHaveClass("custom-class");
	});

	it("renders as child component with asChild", () => {
		render(
			<Button asChild>
				<a href="/test">Link Button</a>
			</Button>,
		);
		const link = screen.getByRole("link", { name: /link button/i });
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute("href", "/test");
	});
});
