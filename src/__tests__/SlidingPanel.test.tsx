import { render, screen, fireEvent } from "@testing-library/react";
import { SlidingPanel } from "../components/SlidingPanel/SlidingPanel";

describe("SlidingPanel", () => {
    it("renders toggle button with correct aria attributes", () => {
        render(
            <SlidingPanel
                isOpen={false}
                onToggle={() => {}}
                toggleLabel="Test Actions"
                id="test-panel"
            >
                <div>Panel content</div>
            </SlidingPanel>
        );

        const toggleButton = screen.getByRole("button");
        expect(toggleButton).toHaveAttribute("aria-expanded", "false");
        expect(toggleButton).toHaveAttribute("aria-label", "Test Actions");
    });

    it("updates aria-expanded when isOpen changes", () => {
        const { rerender } = render(
            <SlidingPanel
                isOpen={false}
                onToggle={() => {}}
                toggleLabel="Test Actions"
                id="test-panel"
            >
                <div>Panel content</div>
            </SlidingPanel>
        );

        const toggleButton = screen.getByRole("button");
        expect(toggleButton).toHaveAttribute("aria-expanded", "false");

        rerender(
            <SlidingPanel
                isOpen={true}
                onToggle={() => {}}
                toggleLabel="Test Actions"
                id="test-panel"
            >
                <div>Panel content</div>
            </SlidingPanel>
        );

        expect(toggleButton).toHaveAttribute("aria-expanded", "true");
    });

    it("changes icon when panel opens and closes", () => {
        const { rerender } = render(
            <SlidingPanel
                isOpen={false}
                onToggle={() => {}}
                toggleLabel="Test Actions"
                id="test-panel"
            >
                <div>Panel content</div>
            </SlidingPanel>
        );

        const iconSpan = screen.getByRole("button").querySelector("span");
        expect(iconSpan?.textContent).toBe("⚙️");

        rerender(
            <SlidingPanel
                isOpen={true}
                onToggle={() => {}}
                toggleLabel="Test Actions"
                id="test-panel"
            >
                <div>Panel content</div>
            </SlidingPanel>
        );

        expect(iconSpan?.textContent).toBe("✕");
    });

    it("calls onToggle callback when button is clicked", () => {
        const handleToggle = jest.fn();
        render(
            <SlidingPanel
                isOpen={false}
                onToggle={handleToggle}
                toggleLabel="Test Actions"
                id="test-panel"
            >
                <div>Panel content</div>
            </SlidingPanel>
        );

        const toggleButton = screen.getByRole("button");
        fireEvent.click(toggleButton);

        expect(handleToggle).toHaveBeenCalledTimes(1);
    });

    it("renders children inside the panel content", () => {
        render(
            <SlidingPanel
                isOpen={true}
                onToggle={() => {}}
                toggleLabel="Test Actions"
                id="test-panel"
            >
                <div>Test content inside panel</div>
            </SlidingPanel>
        );

        expect(screen.getByText("Test content inside panel")).toBeInTheDocument();
    });

    it("renders panel with correct id", () => {
        const { container } = render(
            <SlidingPanel
                isOpen={true}
                onToggle={() => {}}
                toggleLabel="Test Actions"
                id="test-panel"
            >
                <div>Panel content</div>
            </SlidingPanel>
        );

        const panel = container.querySelector("#test-panel");
        expect(panel).toBeInTheDocument();
    });

    it("renders panel with role region and aria-label", () => {
        const { container } = render(
            <SlidingPanel
                isOpen={false}
                onToggle={() => {}}
                toggleLabel="Test Actions"
                id="test-panel"
            >
                <div>Panel content</div>
            </SlidingPanel>
        );

        const panel = container.querySelector("#test-panel");
        expect(panel).toHaveAttribute("role", "region");
        expect(panel).toHaveAttribute("aria-label", "Actions panel");
    });

    it("toggle button has correct title attribute", () => {
        render(
            <SlidingPanel
                isOpen={false}
                onToggle={() => {}}
                toggleLabel="Custom Label"
                id="test-panel"
            >
                <div>Panel content</div>
            </SlidingPanel>
        );

        const toggleButton = screen.getByRole("button");
        expect(toggleButton).toHaveAttribute("title", "Custom Label");
    });

    it("panel is part of the region (toggle button inside panel)", () => {
        const { container } = render(
            <SlidingPanel
                isOpen={true}
                onToggle={() => {}}
                toggleLabel="Test Actions"
                id="test-panel"
            >
                <div>Panel content</div>
            </SlidingPanel>
        );

        const panel = container.querySelector("#test-panel");
        const toggleButton = panel?.querySelector("button");
        expect(toggleButton).toBeInTheDocument();
    });
});
