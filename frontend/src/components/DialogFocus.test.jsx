import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import useDialogFocus from "./useDialogFocus";

function PhotoDialog() {
  const [open, setOpen] = useState(false);
  const ref = useDialogFocus(open, () => setOpen(false));
  return (
    <>
      <button onClick={() => setOpen(true)}>View photo</button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo"
          ref={ref}
          tabIndex={-1}
        >
          <button onClick={() => setOpen(false)}>Close photo</button>
          <button>Next photo</button>
        </div>
      )}
      <button>Outside action</button>
    </>
  );
}

describe("Marketplace dialog keyboard interaction", () => {
  it("keeps Tab and Shift+Tab inside the photo dialog", async () => {
    const user = userEvent.setup();
    render(<PhotoDialog />);
    await user.click(screen.getByRole("button", { name: "View photo" }));
    expect(screen.getByRole("button", { name: "Close photo" })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Next photo" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Close photo" })).toHaveFocus();
  });

  it("closes with Escape and restores focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<PhotoDialog />);
    await user.click(screen.getByRole("button", { name: "View photo" }));
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "View photo" })).toHaveFocus();
  });
});
