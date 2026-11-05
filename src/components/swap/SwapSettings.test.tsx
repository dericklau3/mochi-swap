import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SwapSettings } from "./SwapSettings";

afterEach(cleanup);

function renderSettings(slippage = "0.5") {
  const setSlippage = vi.fn();
  const onClose = vi.fn();
  render(<SwapSettings slippage={slippage} setSlippage={setSlippage} deadline="20" setDeadline={vi.fn()} onClose={onClose} />);
  return { setSlippage, onClose };
}

function typeCustom(value: string) {
  const input = screen.getByPlaceholderText("Custom") as HTMLInputElement;
  for (const character of value) {
    fireEvent.change(input, { target: { value: input.value + character } });
  }
  return input;
}

describe("SwapSettings custom slippage", () => {
  it.each(["10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "1.5", "0.15", "0.55"])("keeps %s when typed one character at a time", (value) => {
    const { setSlippage, onClose } = renderSettings();

    expect(typeCustom(value)).toHaveValue(value);
    expect(screen.getByRole("button", { name: "1.0%" })).not.toHaveClass("is-active");
    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));

    expect(setSlippage).toHaveBeenCalledWith(value);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("keeps a custom 1 editable until a preset is explicitly selected", () => {
    const { setSlippage } = renderSettings();
    const input = typeCustom("1");
    expect(input).toHaveValue("1");
    expect(screen.getByRole("button", { name: "1.0%" })).not.toHaveClass("is-active");

    fireEvent.click(screen.getByRole("button", { name: "0.1%" }));
    expect(input).toHaveValue("");
    expect(screen.getByRole("button", { name: "0.1%" })).toHaveClass("is-active");
    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));
    expect(setSlippage).toHaveBeenCalledWith("0.1");
  });

  it("rejects excessive slippage beyond 20%", () => {
    renderSettings();
    fireEvent.change(screen.getByPlaceholderText("Custom"), { target: { value: "99" } });
    expect(screen.getByRole("button", { name: "Save settings" })).toBeDisabled();
  });

  it("rejects missing or invalid transaction deadlines", () => {
    renderSettings();
    const deadline = screen.getByDisplayValue("20");
    for (const value of ["0", "-1", "1.5", "61"]) {
      fireEvent.change(deadline, { target: { value } });
      expect(screen.getByRole("button", { name: "Save settings" })).toBeDisabled();
    }
  });

  it("does not save an empty custom value", () => {
    renderSettings("12");
    fireEvent.change(screen.getByPlaceholderText("Custom"), { target: { value: "" } });
    expect(screen.getByRole("button", { name: "Save settings" })).toBeDisabled();
  });
});
