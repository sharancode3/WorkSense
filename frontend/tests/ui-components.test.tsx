import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Card, CardTitle, CardContent } from "@/components/ui/card";

describe("Reusable UI Components", () => {
  describe("Button Component", () => {
    it("renders children and handles click events", () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Action Button</Button>);

      const btn = screen.getByRole("button", { name: /action button/i });
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("disables interaction when isLoading is true", () => {
      const handleClick = vi.fn();
      render(
        <Button isLoading onClick={handleClick}>
          Submit
        </Button>
      );

      const btn = screen.getByRole("button");
      expect(btn).toBeDisabled();
      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe("StatusBadge Component", () => {
    it("renders label and icon for strict vocabulary statuses", () => {
      render(<StatusBadge status="VERIFIED" />);
      expect(screen.getByText("Verified")).toBeInTheDocument();

      render(<StatusBadge status="NOT_CONFIGURED" />);
      expect(screen.getByText("Not Configured")).toBeInTheDocument();
    });
  });

  describe("Input Component", () => {
    it("associates label and error message with input id", () => {
      render(<Input label="Employee Email" error="Email is required" />);

      const input = screen.getByLabelText("Employee Email");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByText("Email is required")).toBeInTheDocument();
    });
  });

  describe("Card Component", () => {
    it("renders structured card containers with title and content", () => {
      render(
        <Card>
          <CardTitle>Decision Card</CardTitle>
          <CardContent>Longitudinal Evidence</CardContent>
        </Card>
      );

      expect(screen.getByText("Decision Card")).toBeInTheDocument();
      expect(screen.getByText("Longitudinal Evidence")).toBeInTheDocument();
    });
  });
});
