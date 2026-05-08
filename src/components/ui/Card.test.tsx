import { render, screen, fireEvent } from "@testing-library/react";
import Card from "./Card";

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Test content</Card>);
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("renders Card.Header with bottom border", () => {
    render(
      <Card>
        <Card.Header>Header Title</Card.Header>
      </Card>
    );
    const header = screen.getByText("Header Title").closest("div");
    expect(header).toHaveClass("border-b");
    expect(header).toHaveClass("border-[var(--divider)]");
  });

  it("renders Card.Content with flex-1 class", () => {
    render(
      <Card>
        <Card.Content>Content area</Card.Content>
      </Card>
    );
    const content = screen.getByText("Content area");
    expect(content).toHaveClass("flex-1");
  });

  it("renders Card.Footer with top border and justify-end", () => {
    render(
      <Card>
        <Card.Footer>Footer content</Card.Footer>
      </Card>
    );
    const footer = screen.getByText("Footer content").closest("div");
    expect(footer).toHaveClass("border-t");
    expect(footer).toHaveClass("border-[var(--divider)]");
    expect(footer).toHaveClass("justify-end");
  });

  it("has default variant with border", () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("border");
    expect(card).toHaveClass("border-[var(--divider)]");
  });

  it("has elevated variant with shadow", () => {
    const { container } = render(<Card variant="elevated">Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("shadow-[0_4px_12px_rgba(0,0,0,0.08)]");
  });

  it("is clickable when onClick provided", () => {
    const handleClick = jest.fn();
    const { container } = render(<Card onClick={handleClick}>Clickable card</Card>);
    const card = container.firstChild as HTMLElement;

    expect(card).toHaveClass("cursor-pointer");
    expect(card).toHaveClass("hover:opacity-95");

    fireEvent.click(card);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("clickable Card has role='button' and tabIndex={0}", () => {
    const handleClick = jest.fn();
    const { container } = render(<Card onClick={handleClick}>Clickable card</Card>);
    const card = container.firstChild as HTMLElement;

    expect(card).toHaveAttribute("role", "button");
    expect(card).toHaveAttribute("tabIndex", "0");
  });

  it("renders Card.Header with h3 text-lg font-semibold", () => {
    render(
      <Card>
        <Card.Header>Title Text</Card.Header>
      </Card>
    );
    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass("text-lg");
    expect(heading).toHaveClass("font-semibold");
  });

  it("compound pattern works (Card.Header, Card.Content, Card.Footer accessible)", () => {
    render(
      <Card>
        <Card.Header>Header</Card.Header>
        <Card.Content>Content</Card.Content>
        <Card.Footer>Footer</Card.Footer>
      </Card>
    );

    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });
});
