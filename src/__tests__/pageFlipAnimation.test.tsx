import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

jest.mock("../components/CalendarGrid/CalendarGrid.module.css", () => ({
    __esModule: true,
    default: new Proxy({}, { get: (_target, prop) => String(prop) }),
}));

import CalendarGrid from "../components/CalendarGrid/CalendarGrid.tsx";
import { MonthView } from "../components/CalendarGrid/MonthView.tsx";
import { YearView } from "../components/CalendarGrid/YearView.tsx";
import ThemeSelector from "../components/ThemeSelector/ThemeSelector.tsx";
import { LanguageProvider } from "../i18n/LanguageContext.tsx";
import { TRANSLATIONS } from "../i18n/locales/index.ts";
import { setStoredLanguage } from "../i18n/languageStore.ts";
import type { LanguageCode } from "../i18n/types.ts";
import type { CalendarDay } from "../types/index.ts";
import { type DateString, UTCDate } from "../utils/UTCDate.ts";

function makeMonthDays(year: number, monthIndex: number, dayNumber = 1, eventName?: string): CalendarDay[] {
    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}` as DateString;
    const first = new UTCDate(dateStr);
    return [
        {
            date: first,
            dayNumber,
            isSideMonth: false,
            isCurrentMonth: true,
            isCurrentYear: true,
            isToday: false,
            isWeekend: false,
            events: eventName
                ? [{ kind: "other", name: eventName, localName: eventName, icon: "🎉", date: dateStr }]
                : [],
        },
    ];
}

describe("3D page-flip animation", () => {
    beforeEach(() => {
        document.documentElement.setAttribute("data-theme", "book");
    });

    afterEach(() => {
        cleanup();
        document.documentElement.removeAttribute("data-theme");
        localStorage.removeItem("theme");
    });

    it("MonthView applies forward and backward 3D split-leaf page-flip classes and faces on month changes", () => {
        const jan = new UTCDate("2025-01-01");
        const feb = new UTCDate("2025-02-01");
        const janDays = makeMonthDays(2025, 0, 1, "JanEvent");
        const febDays = makeMonthDays(2025, 1, 2, "FebEvent");

        const { container, rerender } = render(
            <MonthView
                shouldAnimate={true}
                selectedDays={janDays}
                onModeChange={jest.fn()}
                currentDate={jan}
                dateForPopup={null}
                setDateForPopup={jest.fn()}
                isEditable={true}
                countryData={{}}
            />
        );

        expect(container.querySelector(".flipStage")).toBeInTheDocument();
        expect(container.querySelector(".animateHidingForward")).not.toBeInTheDocument();
        expect(container.querySelector(".animateShowingForward")).not.toBeInTheDocument();

        // Advance forward to February
        rerender(
            <MonthView
                shouldAnimate={true}
                selectedDays={febDays}
                onModeChange={jest.fn()}
                currentDate={feb}
                dateForPopup={null}
                setDateForPopup={jest.fn()}
                isEditable={true}
                countryData={{}}
            />
        );

        const hidingForward = container.querySelector(".animateHidingForward");
        const showingForward = container.querySelector(".animateShowingForward");
        expect(hidingForward).toBeInTheDocument();
        expect(hidingForward).toHaveAttribute("aria-hidden", "true");
        expect(hidingForward).toHaveClass("flipOverlay");
        expect(hidingForward?.querySelector(".flipStationaryHalf")).toBeInTheDocument();
        expect(hidingForward?.querySelector(".flipCastShadow")).toBeInTheDocument();
        expect(hidingForward?.querySelector(".flipLeaf")).toBeInTheDocument();
        const frontForward = hidingForward?.querySelector(".flipLeafFront");
        const backForward = hidingForward?.querySelector(".flipLeafBack");
        expect(frontForward).toBeInTheDocument();
        expect(backForward).toBeInTheDocument();
        expect(frontForward).toHaveTextContent("JanEvent");
        expect(backForward).toHaveTextContent("FebEvent");
        expect(showingForward).toBeInTheDocument();
        expect(showingForward).not.toHaveAttribute("aria-hidden", "true");

        // Move backward to January
        rerender(
            <MonthView
                shouldAnimate={true}
                selectedDays={janDays}
                onModeChange={jest.fn()}
                currentDate={jan}
                dateForPopup={null}
                setDateForPopup={jest.fn()}
                isEditable={true}
                countryData={{}}
            />
        );

        const hidingBackward = container.querySelector(".animateHidingBackward");
        const showingBackward = container.querySelector(".animateShowingBackward");
        expect(hidingBackward).toBeInTheDocument();
        expect(hidingBackward).toHaveAttribute("aria-hidden", "true");
        expect(hidingBackward).toHaveClass("flipOverlay");
        expect(hidingBackward?.querySelector(".flipStationaryHalf")).toBeInTheDocument();
        expect(hidingBackward?.querySelector(".flipCastShadow")).toBeInTheDocument();
        expect(hidingBackward?.querySelector(".flipLeaf")).toBeInTheDocument();
        const frontBackward = hidingBackward?.querySelector(".flipLeafFront");
        const backBackward = hidingBackward?.querySelector(".flipLeafBack");
        expect(frontBackward).toHaveTextContent("FebEvent");
        expect(backBackward).toHaveTextContent("JanEvent");
        expect(showingBackward).toBeInTheDocument();
        expect(showingBackward).not.toHaveAttribute("aria-hidden", "true");
    });

    it("YearView applies forward and backward 3D split-leaf page-flip classes and faces on year changes", () => {
        const y2025 = new UTCDate("2025-01-01");
        const y2026 = new UTCDate("2026-01-01");
        const days2025 = makeMonthDays(2025, 0, 1, "Event2025");
        const days2026 = makeMonthDays(2026, 0, 1, "Event2026");

        const { container, rerender } = render(
            <YearView
                shouldAnimate={true}
                selectedDays={days2025}
                onModeChange={jest.fn()}
                currentDate={y2025}
                dateForPopup={null}
                setDateForPopup={jest.fn()}
                isEditable={true}
                setSelectedDay={jest.fn()}
                countryData={{}}
            />
        );

        expect(container.querySelector(".flipStage")).toBeInTheDocument();
        expect(container.querySelector(".animateHidingForward")).not.toBeInTheDocument();
        expect(container.querySelector(".animateShowingForward")).not.toBeInTheDocument();

        // Advance forward to 2026
        rerender(
            <YearView
                shouldAnimate={true}
                selectedDays={days2026}
                onModeChange={jest.fn()}
                currentDate={y2026}
                dateForPopup={null}
                setDateForPopup={jest.fn()}
                isEditable={true}
                setSelectedDay={jest.fn()}
                countryData={{}}
            />
        );

        const hidingForward = container.querySelector(".animateHidingForward");
        const showingForward = container.querySelector(".animateShowingForward");
        expect(hidingForward).toBeInTheDocument();
        expect(hidingForward).toHaveAttribute("aria-hidden", "true");
        expect(hidingForward).toHaveClass("flipOverlay");
        expect(hidingForward?.querySelector(".flipStationaryHalf")).toBeInTheDocument();
        expect(hidingForward?.querySelector(".flipCastShadow")).toBeInTheDocument();
        expect(hidingForward?.querySelector(".flipLeaf")).toBeInTheDocument();
        const frontForward = hidingForward?.querySelector(".flipLeafFront");
        const backForward = hidingForward?.querySelector(".flipLeafBack");
        expect(frontForward).toBeInTheDocument();
        expect(backForward).toBeInTheDocument();
        expect(frontForward?.querySelector(".holidayIndicator")).toBeInTheDocument();
        expect(backForward?.querySelector(".holidayIndicator")).toBeInTheDocument();
        expect(hidingForward?.querySelector("[data-month]")).not.toBeInTheDocument();
        expect(hidingForward?.querySelector("[role=\"button\"]")).not.toBeInTheDocument();
        expect(showingForward).toBeInTheDocument();
        expect(showingForward?.querySelector("[data-month=\"5\"]")).toBeInTheDocument();

        // Move backward to 2025
        rerender(
            <YearView
                shouldAnimate={true}
                selectedDays={days2025}
                onModeChange={jest.fn()}
                currentDate={y2025}
                dateForPopup={null}
                setDateForPopup={jest.fn()}
                isEditable={true}
                setSelectedDay={jest.fn()}
                countryData={{}}
            />
        );

        const hidingBackward = container.querySelector(".animateHidingBackward");
        const showingBackward = container.querySelector(".animateShowingBackward");
        expect(hidingBackward).toBeInTheDocument();
        expect(hidingBackward).toHaveAttribute("aria-hidden", "true");
        expect(hidingBackward?.querySelector(".flipStationaryHalf")).toBeInTheDocument();
        expect(hidingBackward?.querySelector(".flipCastShadow")).toBeInTheDocument();
        expect(hidingBackward?.querySelector(".flipLeaf")).toBeInTheDocument();
        expect(hidingBackward?.querySelector(".flipLeafFront")).toBeInTheDocument();
        expect(hidingBackward?.querySelector(".flipLeafBack")).toBeInTheDocument();
        expect(hidingBackward?.querySelector("[data-month]")).not.toBeInTheDocument();
        expect(hidingBackward?.querySelector("[role=\"button\"]")).not.toBeInTheDocument();
        expect(showingBackward).toBeInTheDocument();
    });

    it("CalendarGrid skips page-flip animation on mode switch and resumes it on subsequent navigation", () => {
        const jan2025 = new UTCDate("2025-01-01");
        const feb2025 = new UTCDate("2025-02-01");
        const jan2026 = new UTCDate("2026-01-01");
        const janMonthDays = makeMonthDays(2025, 0);
        const febMonthDays = makeMonthDays(2025, 1);
        const year2025Days = makeMonthDays(2025, 0);
        const year2026Days = makeMonthDays(2026, 0);
        const onModeChange = jest.fn();

        const { container, rerender } = render(
            <CalendarGrid
                selectedMonthDays={janMonthDays}
                selectedYearDays={year2025Days}
                currentDate={jan2025}
                mode="month"
                countryData={{}}
                onModeChange={onModeChange}
            />
        );

        // Initial render has no animation
        expect(container.querySelector(".animateHidingForward")).not.toBeInTheDocument();
        expect(container.querySelector(".animateShowingForward")).not.toBeInTheDocument();

        // Switch from month to year mode -> no page-flip animation
        rerender(
            <CalendarGrid
                selectedMonthDays={janMonthDays}
                selectedYearDays={year2025Days}
                currentDate={jan2025}
                mode="year"
                countryData={{}}
                onModeChange={onModeChange}
            />
        );
        expect(container.querySelector(".animateHidingForward")).not.toBeInTheDocument();
        expect(container.querySelector(".animateShowingForward")).not.toBeInTheDocument();

        // Navigate to next year in year mode -> animates
        rerender(
            <CalendarGrid
                selectedMonthDays={janMonthDays}
                selectedYearDays={year2026Days}
                currentDate={jan2026}
                mode="year"
                countryData={{}}
                onModeChange={onModeChange}
            />
        );
        expect(container.querySelector(".animateHidingForward")).toBeInTheDocument();
        expect(container.querySelector(".animateShowingForward")).toBeInTheDocument();

        // Switch back from year to month mode (e.g. selecting a month) -> no page-flip animation
        rerender(
            <CalendarGrid
                selectedMonthDays={janMonthDays}
                selectedYearDays={year2025Days}
                currentDate={jan2025}
                mode="month"
                countryData={{}}
                onModeChange={onModeChange}
            />
        );
        expect(container.querySelector(".animateHidingForward")).not.toBeInTheDocument();
        expect(container.querySelector(".animateShowingForward")).not.toBeInTheDocument();
        expect(container.querySelector(".animateHidingBackward")).not.toBeInTheDocument();
        expect(container.querySelector(".animateShowingBackward")).not.toBeInTheDocument();

        // Navigate to next month in month mode after switching back -> animates again
        rerender(
            <CalendarGrid
                selectedMonthDays={febMonthDays}
                selectedYearDays={year2025Days}
                currentDate={feb2025}
                mode="month"
                countryData={{}}
                onModeChange={onModeChange}
            />
        );
        expect(container.querySelector(".animateHidingForward")).toBeInTheDocument();
        expect(container.querySelector(".animateShowingForward")).toBeInTheDocument();
    });
});

describe("Book theme integration", () => {
    afterEach(() => {
        cleanup();
        localStorage.removeItem("theme");
        setStoredLanguage("en");
        document.documentElement.removeAttribute("data-theme");
    });

    it.each<LanguageCode>(["en", "de", "es", "fr", "lv", "ru"])(
        "renders the Book theme option in %s and updates data-theme='book' when selected",
        (lang) => {
            setStoredLanguage(lang);
            const dict = TRANSLATIONS[lang];

            render(
                <LanguageProvider>
                    <ThemeSelector />
                </LanguageProvider>
            );

            const select = screen.getByLabelText(dict.themeSelector.ariaLabel) as HTMLSelectElement;
            const bookOption = screen.getByRole("option", {
                name: `📖 ${dict.themeSelector.themes.book}`,
            }) as HTMLOptionElement;
            expect(bookOption).toBeInTheDocument();
            expect(bookOption.value).toBe("book");

            fireEvent.change(select, { target: { value: "book" } });

            expect(select.value).toBe("book");
            expect(document.documentElement.getAttribute("data-theme")).toBe("book");
            expect(localStorage.getItem("theme")).toBe("book");
        }
    );

    it("activates 3D split-leaf page-flip animation in MonthView and YearView when data-theme='book' is active", () => {
        document.documentElement.setAttribute("data-theme", "book");
        const jan = new UTCDate("2025-01-01");
        const feb = new UTCDate("2025-02-01");
        const y2026 = new UTCDate("2026-01-01");
        const janDays = makeMonthDays(2025, 0, 1, "BookJan");
        const febDays = makeMonthDays(2025, 1, 2, "BookFeb");
        const y2026Days = makeMonthDays(2026, 0, 1, "Book2026");

        const { container: monthContainer, rerender: rerenderMonth } = render(
            <MonthView
                shouldAnimate={true}
                selectedDays={janDays}
                onModeChange={jest.fn()}
                currentDate={jan}
                dateForPopup={null}
                setDateForPopup={jest.fn()}
                isEditable={false}
                countryData={{}}
            />
        );

        rerenderMonth(
            <MonthView
                shouldAnimate={true}
                selectedDays={febDays}
                onModeChange={jest.fn()}
                currentDate={feb}
                dateForPopup={null}
                setDateForPopup={jest.fn()}
                isEditable={false}
                countryData={{}}
            />
        );

        expect(document.documentElement.getAttribute("data-theme")).toBe("book");
        expect(monthContainer.querySelector(".flipStage")).toBeInTheDocument();
        expect(monthContainer.querySelector(".animateHidingForward")).toBeInTheDocument();
        expect(monthContainer.querySelector(".flipStationaryHalf")).toBeInTheDocument();
        expect(monthContainer.querySelector(".flipLeafFront")).toHaveTextContent("BookJan");
        expect(monthContainer.querySelector(".flipLeafBack")).toHaveTextContent("BookFeb");

        const { container: yearContainer, rerender: rerenderYear } = render(
            <YearView
                shouldAnimate={true}
                selectedDays={janDays}
                onModeChange={jest.fn()}
                currentDate={jan}
                dateForPopup={null}
                setDateForPopup={jest.fn()}
                isEditable={false}
                setSelectedDay={jest.fn()}
                countryData={{}}
            />
        );

        rerenderYear(
            <YearView
                shouldAnimate={true}
                selectedDays={y2026Days}
                onModeChange={jest.fn()}
                currentDate={y2026}
                dateForPopup={null}
                setDateForPopup={jest.fn()}
                isEditable={false}
                setSelectedDay={jest.fn()}
                countryData={{}}
            />
        );

        expect(yearContainer.querySelector(".flipStage")).toBeInTheDocument();
        expect(yearContainer.querySelector(".animateHidingForward")).toBeInTheDocument();
        expect(yearContainer.querySelector(".flipStationaryHalf")).toBeInTheDocument();
        expect(yearContainer.querySelector(".flipLeafFront")).toBeInTheDocument();
        expect(yearContainer.querySelector(".flipLeafBack")).toBeInTheDocument();
    });

    it.each(["neutral", "dark"])(
        "does NOT render 3D page-flip overlay or animation classes in MonthView or YearView when data-theme='%s'",
        (theme) => {
            document.documentElement.setAttribute("data-theme", theme);
            const jan = new UTCDate("2025-01-01");
            const feb = new UTCDate("2025-02-01");
            const y2026 = new UTCDate("2026-01-01");
            const janDays = makeMonthDays(2025, 0, 1, "JanEvent");
            const febDays = makeMonthDays(2025, 1, 2, "FebEvent");
            const y2026Days = makeMonthDays(2026, 0, 1, "Event2026");

            const { container: monthContainer, rerender: rerenderMonth } = render(
                <MonthView
                    shouldAnimate={true}
                    selectedDays={janDays}
                    onModeChange={jest.fn()}
                    currentDate={jan}
                    dateForPopup={null}
                    setDateForPopup={jest.fn()}
                    isEditable={true}
                    countryData={{}}
                />
            );

            rerenderMonth(
                <MonthView
                    shouldAnimate={true}
                    selectedDays={febDays}
                    onModeChange={jest.fn()}
                    currentDate={feb}
                    dateForPopup={null}
                    setDateForPopup={jest.fn()}
                    isEditable={true}
                    countryData={{}}
                />
            );

            for (const selector of [
                ".flipStage",
                ".flipOverlay",
                ".flipLeaf",
                ".flipStationaryHalf",
                ".flipCastShadow",
                ".animateHidingForward",
                ".animateHidingBackward",
                ".animateShowingForward",
                ".animateShowingBackward",
            ]) {
                expect(monthContainer.querySelector(selector)).not.toBeInTheDocument();
            }

            const { container: yearContainer, rerender: rerenderYear } = render(
                <YearView
                    shouldAnimate={true}
                    selectedDays={janDays}
                    onModeChange={jest.fn()}
                    currentDate={jan}
                    dateForPopup={null}
                    setDateForPopup={jest.fn()}
                    isEditable={true}
                    setSelectedDay={jest.fn()}
                    countryData={{}}
                />
            );

            rerenderYear(
                <YearView
                    shouldAnimate={true}
                    selectedDays={y2026Days}
                    onModeChange={jest.fn()}
                    currentDate={y2026}
                    dateForPopup={null}
                    setDateForPopup={jest.fn()}
                    isEditable={true}
                    setSelectedDay={jest.fn()}
                    countryData={{}}
                />
            );

            for (const selector of [
                ".flipStage",
                ".flipOverlay",
                ".flipLeaf",
                ".flipStationaryHalf",
                ".flipCastShadow",
                ".animateHidingForward",
                ".animateHidingBackward",
                ".animateShowingForward",
                ".animateShowingBackward",
            ]) {
                expect(yearContainer.querySelector(selector)).not.toBeInTheDocument();
            }
        }
    );

    it("reactively enables and disables 3D page-flip when data-theme changes between non-book and book", async () => {
        document.documentElement.setAttribute("data-theme", "neutral");
        const jan = new UTCDate("2025-01-01");
        const feb = new UTCDate("2025-02-01");
        const mar = new UTCDate("2025-03-01");
        const janDays = makeMonthDays(2025, 0, 1, "JanEvent");
        const febDays = makeMonthDays(2025, 1, 2, "FebEvent");
        const marDays = makeMonthDays(2025, 2, 3, "MarEvent");

        const { container, rerender } = render(
            <MonthView
                shouldAnimate={true}
                selectedDays={janDays}
                onModeChange={jest.fn()}
                currentDate={jan}
                dateForPopup={null}
                setDateForPopup={jest.fn()}
                isEditable={true}
                countryData={{}}
            />
        );

        expect(container.querySelector(".flipStage")).not.toBeInTheDocument();

        await act(async () => {
            document.documentElement.setAttribute("data-theme", "book");
            await Promise.resolve();
        });

        rerender(
            <MonthView
                shouldAnimate={true}
                selectedDays={febDays}
                onModeChange={jest.fn()}
                currentDate={feb}
                dateForPopup={null}
                setDateForPopup={jest.fn()}
                isEditable={true}
                countryData={{}}
            />
        );

        expect(container.querySelector(".flipStage")).toBeInTheDocument();
        expect(container.querySelector(".animateHidingForward")).toBeInTheDocument();

        await act(async () => {
            document.documentElement.setAttribute("data-theme", "dark");
            await Promise.resolve();
        });

        rerender(
            <MonthView
                shouldAnimate={true}
                selectedDays={marDays}
                onModeChange={jest.fn()}
                currentDate={mar}
                dateForPopup={null}
                setDateForPopup={jest.fn()}
                isEditable={true}
                countryData={{}}
            />
        );

        expect(container.querySelector(".flipStage")).not.toBeInTheDocument();
        expect(container.querySelector(".flipOverlay")).not.toBeInTheDocument();
        expect(container.querySelector(".animateHidingForward")).not.toBeInTheDocument();
    });
});
