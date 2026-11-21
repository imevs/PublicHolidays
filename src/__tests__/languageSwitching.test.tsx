import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

let mockSearchParams = new URLSearchParams();
jest.mock("react-router", () => ({
    useNavigate: () => jest.fn(),
    useSearchParams: () => [mockSearchParams],
}));
jest.mock("../components/CalendarGrid/UsePrevious.tsx", () => ({
    usePrevious: () => null,
}));

import { Holidays } from "../Holidays.tsx";
import { AnyEvents } from "../AnyEvents.tsx";
import { LanguageProvider } from "../i18n/LanguageContext.tsx";
import { setStoredLanguage } from "../i18n/languageStore.ts";
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, TRANSLATIONS, getIntlLocale } from "../i18n/locales/index.ts";
import type { LanguageCode } from "../i18n/types.ts";
import { STORAGE_KEY } from "../consts.ts";
import { formatDateToReadable } from "../utils/dateUtils.ts";
import { UTCDate } from "../utils/UTCDate.ts";

const TARGET_LANGUAGES: readonly LanguageCode[] = ["ru", "fr", "es", "lv", "de"];

describe("UI language selection and multi-language switching", () => {
    const origScrollIntoView = HTMLElement.prototype.scrollIntoView;
    const origResizeObserver = globalThis.ResizeObserver;

    beforeAll(() => {
        HTMLElement.prototype.scrollIntoView = jest.fn();
        globalThis.ResizeObserver = class {
            observe = jest.fn();
            unobserve = jest.fn();
            disconnect = jest.fn();
        };
    });

    afterAll(() => {
        HTMLElement.prototype.scrollIntoView = origScrollIntoView;
        globalThis.ResizeObserver = origResizeObserver;
    });

    afterEach(() => {
        jest.restoreAllMocks();
        setStoredLanguage(DEFAULT_LANGUAGE);
        localStorage.removeItem(LANGUAGE_STORAGE_KEY);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem("theme");
        window.location.hash = "";
        document.documentElement.lang = "en";
        mockSearchParams = new URLSearchParams();
    });

    it.each(TARGET_LANGUAGES)(
        "switches all UI labels, controls, filters, calendar headers, modals, and dates on Holidays to %s",
        async (lang) => {
            window.location.hash = "date=2025-05-01&countries=LV&mode=month";
            const dict = TRANSLATIONS[lang];

            const { container } = render(<Holidays />);

            // Starts in English by default
            expect(document.documentElement.lang).toBe("en");
            expect(screen.getAllByRole("heading", { level: 1 })[0]).toHaveTextContent("Public Holidays Calendar");

            const langSelect = screen.getByLabelText(TRANSLATIONS.en.languageSelector.ariaLabel) as HTMLSelectElement;
            fireEvent.change(langSelect, { target: { value: lang } });

            await waitFor(() => {
                expect(document.documentElement.lang).toBe(lang);
            });

            // Document title & header & primary navigation
            expect(document.title).toBe(dict.app.holidaysDocumentTitle.replace("{year}", "2025"));
            expect(screen.getAllByRole("heading", { level: 1 })[0]).toHaveTextContent(dict.app.holidaysTitle);
            expect(screen.getByText(dict.app.holidaysSubtitle)).toBeInTheDocument();
            expect(screen.getByRole("navigation", { name: dict.app.navAriaLabel })).toBeInTheDocument();
            expect(screen.getByRole("link", { name: new RegExp(dict.app.navPublicHolidays) })).toBeInTheDocument();
            expect(screen.getByRole("link", { name: new RegExp(dict.app.navCustomEvents) })).toBeInTheDocument();

            // LanguageSelector & ThemeSelector
            expect(screen.getByLabelText(dict.languageSelector.ariaLabel)).toHaveValue(lang);
            expect(screen.getByLabelText(dict.themeSelector.ariaLabel)).toBeInTheDocument();
            expect(screen.getByRole("option", { name: new RegExp(dict.themeSelector.themes.dark) })).toBeInTheDocument();

            // Controls (Year/Month labels, buttons, 12 month options)
            expect(screen.getByLabelText(dict.controls.selectYear)).toBeInTheDocument();
            expect(screen.getByLabelText(dict.controls.selectMonth)).toBeInTheDocument();
            expect(screen.getByRole("button", { name: dict.controls.previousYearAria })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: dict.controls.nextYearAria })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: dict.controls.previousMonthAria })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: dict.controls.nextMonthAria })).toBeInTheDocument();
            dict.dates.months.forEach((monthLabel) => {
                expect(screen.getByRole("option", { name: monthLabel })).toBeInTheDocument();
            });

            // CountryFilter labels: initially collapsed (showAllCountries = false because countries=LV)
            expect(screen.getByText(dict.countryFilter.selectCountries)).toBeInTheDocument();
            expect(screen.getByLabelText(dict.countryFilter.showExtraHolidaysOnly)).toBeInTheDocument();
            expect(screen.getByLabelText(dict.countryFilter.showLocalTime)).toBeInTheDocument();
            const showAllBtn = screen.getByRole("button", { name: dict.countryFilter.showAll });
            expect(showAllBtn).toBeInTheDocument();

            const lvChip = await screen.findByRole("button", { name: new RegExp(dict.countries.LV) });
            expect(lvChip).toHaveAttribute("title", expect.stringContaining(dict.countryFilter.currentTimePrefix));

            // Expand CountryFilter to verify showTimezones, hideInactive, and continent tags
            fireEvent.click(showAllBtn);
            expect(screen.getByLabelText(dict.countryFilter.showTimezones)).toBeInTheDocument();
            expect(screen.getByRole("button", { name: dict.countryFilter.hideInactive })).toBeInTheDocument();
            expect(screen.getByText(new RegExp(dict.continents.asia))).toBeInTheDocument();
            expect(await screen.findByRole("button", { name: new RegExp(dict.countries.DE) })).toBeInTheDocument();

            // MonthNavigation & CalendarGrid weekdays (and index-based weekend styling!)
            expect(screen.getByRole("button", { name: `${dict.dates.months[4]} 2025` })).toHaveAttribute(
                "title",
                dict.monthNavigation.clickToSeeWholeYear
            );
            dict.dates.weekdaysShort.forEach((dayShort) => {
                expect(screen.getByText(dayShort)).toBeInTheDocument();
            });
            const satHeader = screen.getByText(dict.dates.weekdaysShort[5]);
            const sunHeader = screen.getByText(dict.dates.weekdaysShort[6]);
            const monHeader = screen.getByText(dict.dates.weekdaysShort[0]);
            // Weekend headers receive the extra weekend class token compared to weekday headers
            expect(satHeader.className.trim().split(/\s+/)).toHaveLength(2);
            expect(sunHeader.className.trim().split(/\s+/)).toHaveLength(2);
            expect(monHeader.className.trim().split(/\s+/)).toHaveLength(1);

            // Holiday event name stays untranslated while country prefix & readable date are localized
            await waitFor(() => {
                expect(screen.getAllByText(/Labour Day\/May Day/).length).toBeGreaterThan(0);
            });
            expect(screen.getAllByText(new RegExp(dict.countries.LV)).length).toBeGreaterThan(0);
            expect(
                screen.getByText(formatDateToReadable(new UTCDate("2025-05-01"), getIntlLocale(lang)))
            ).toBeInTheDocument();

            // ActionButtons toolbar & Subscribe modal
            expect(screen.getByRole("toolbar", { name: dict.actionButtons.calendarActionsAria })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: dict.actionButtons.yearView })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: dict.actionButtons.monthView })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: dict.actionButtons.saveAsImage })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: dict.actionButtons.createCustomCalendar })).toBeInTheDocument();

            fireEvent.click(screen.getByRole("button", { name: dict.actionButtons.subscribeAdd }));
            expect(screen.getByRole("heading", { name: dict.actionButtons.subscribeModalTitle })).toBeInTheDocument();
            expect(screen.getByText(dict.actionButtons.sectionDownloadTitle)).toBeInTheDocument();
            expect(screen.getByLabelText(dict.actionButtons.includeReminderLabel)).toBeInTheDocument();
            expect(screen.getByRole("button", { name: dict.actionButtons.downloadIcsButton })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: dict.actionButtons.copyShareableLink })).toBeInTheDocument();

            // Close modal and switch to Year view to verify year-view month headers & day popup
            fireEvent.click(screen.getByRole("button", { name: dict.actionButtons.closeDialogAria }));
            fireEvent.click(screen.getByRole("button", { name: dict.actionButtons.yearView }));

            const mayHeader = screen.getByRole("button", { name: dict.dates.months[4] });
            expect(mayHeader).toHaveAttribute("title", dict.calendarGrid.clickToSwitchMonthView);

            // Ensure no stray English UI headings/controls remain
            expect(container).not.toHaveTextContent("Public Holidays Calendar");
            expect(container).not.toHaveTextContent("Select Countries");
            expect(container).not.toHaveTextContent("Hide inactive");
        }
    );

    it.each(TARGET_LANGUAGES)(
        "switches all UI labels, validation tooltips, import modal, and EventPopup on AnyEvents to %s",
        async (lang) => {
            localStorage.setItem(
                STORAGE_KEY,
                "2025-09-10 🎂 Birthday of Joe\ninvalid-date 🎂 Broken"
            );
            window.location.hash = "date=2025-09-01&mode=year";
            const dict = TRANSLATIONS[lang];

            const { container } = render(<AnyEvents />);

            const langSelect = screen.getByLabelText(TRANSLATIONS.en.languageSelector.ariaLabel) as HTMLSelectElement;
            fireEvent.change(langSelect, { target: { value: lang } });

            await waitFor(() => {
                expect(document.documentElement.lang).toBe(lang);
            });

            expect(document.title).toBe(dict.app.eventsDocumentTitle.replace("{year}", "2025"));
            expect(screen.getAllByRole("heading", { level: 1 })[0]).toHaveTextContent(dict.app.eventsTitle);
            expect(screen.getByText(dict.app.eventsSubtitle)).toBeInTheDocument();

            // EventListInput label and validation tooltip
            expect(screen.getByText(dict.eventListInput.formatSingleExample)).toBeInTheDocument();
            expect(screen.getByText(dict.eventListInput.formatRangeExample)).toBeInTheDocument();
            const invalidRow = container.querySelector(`[data-tooltip="${dict.eventListInput.errors.invalidDate}"]`);
            expect(invalidRow).toBeInTheDocument();

            // EventListInputButtons dropdown and URL modal
            fireEvent.click(screen.getByRole("button", { name: new RegExp(dict.eventListInputButtons.importButton) }));
            expect(screen.getByRole("menu", { name: dict.eventListInputButtons.importOptionsAria })).toBeInTheDocument();
            expect(screen.getByRole("menuitem", { name: dict.eventListInputButtons.importIcsFile })).toBeInTheDocument();
            fireEvent.click(screen.getByRole("menuitem", { name: dict.eventListInputButtons.loadIcsFromLink }));

            expect(screen.getByRole("heading", { name: dict.eventListInputButtons.urlModalTitle })).toBeInTheDocument();
            expect(screen.getByLabelText(dict.eventListInputButtons.calendarIcsUrlLabel)).toBeInTheDocument();
            expect(screen.getByPlaceholderText(dict.eventListInputButtons.urlPlaceholder)).toBeInTheDocument();
            expect(screen.getByRole("button", { name: dict.eventListInputButtons.loadIcsButton })).toBeInTheDocument();
            fireEvent.click(screen.getByRole("button", { name: dict.eventListInputButtons.cancelButton }));

            // Day popup & EventPopup
            const sept10Cell = screen.getAllByText("🎂")[0].closest("[data-month=\"9\"]")!;
            fireEvent.click(sept10Cell);

            expect(screen.getByText(dict.calendarGrid.eventsOnDate.replace("{date}", "2025-09-10"))).toBeInTheDocument();
            fireEvent.click(screen.getByRole("button", { name: dict.calendarGrid.addEvent }));

            expect(
                screen.getByText(dict.eventPopup.addEventForDate.replace("{date}", "2025-09-10"))
            ).toBeInTheDocument();
            expect(screen.getByLabelText(dict.eventPopup.nameLabel)).toBeInTheDocument();
            expect(screen.getByLabelText(dict.eventPopup.oneTimeLabel)).toBeInTheDocument();
            const rangeCheckbox = screen.getByLabelText(dict.eventPopup.dateRangeLabel);
            fireEvent.click(rangeCheckbox);

            expect(screen.getByLabelText(dict.eventPopup.endDateLabel)).toBeInTheDocument();
            expect(screen.getByText(dict.eventPopup.highlightColorLabel)).toBeInTheDocument();
            expect(screen.getByRole("button", { name: dict.eventPopup.colors.teal })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: dict.eventPopup.colors.red })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: dict.eventPopup.saveButton })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: dict.eventPopup.cancelButton })).toBeInTheDocument();

            // Sample/user event content stays untranslated
            const eventsTextarea = container.querySelector("#events-data") as HTMLTextAreaElement;
            expect(eventsTextarea.value).toContain("Birthday of Joe");
        }
    );

    it("persists selected language in localStorage across remounts and supports switching back to English", async () => {
        const { unmount } = render(
            <LanguageProvider>
                <Holidays />
            </LanguageProvider>
        );

        const select = screen.getByLabelText(TRANSLATIONS.en.languageSelector.ariaLabel);
        fireEvent.change(select, { target: { value: "lv" } });

        await waitFor(() => {
            expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("lv");
        });
        expect(screen.getAllByRole("heading", { level: 1 })[0]).toHaveTextContent(TRANSLATIONS.lv.app.holidaysTitle);

        // Wait for async mount data to settle before unmount
        await screen.findByRole("button", { name: new RegExp(TRANSLATIONS.lv.countries.LV) });
        unmount();

        // Remount fresh instance: must restore "lv" from localStorage
        render(
            <LanguageProvider>
                <Holidays />
            </LanguageProvider>
        );

        expect(document.documentElement.lang).toBe("lv");
        expect(screen.getByLabelText(TRANSLATIONS.lv.languageSelector.ariaLabel)).toHaveValue("lv");
        expect(screen.getAllByRole("heading", { level: 1 })[0]).toHaveTextContent(TRANSLATIONS.lv.app.holidaysTitle);

        // Switch back to English
        fireEvent.change(screen.getByLabelText(TRANSLATIONS.lv.languageSelector.ariaLabel), {
            target: { value: "en" },
        });
        await waitFor(() => {
            expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("en");
        });
        expect(document.documentElement.lang).toBe("en");
        expect(screen.getAllByRole("heading", { level: 1 })[0]).toHaveTextContent(TRANSLATIONS.en.app.holidaysTitle);
        await screen.findByRole("button", { name: new RegExp(TRANSLATIONS.en.countries.LV) });
    });

    it("falls back safely to English when localStorage contains an unsupported language code", async () => {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, "xx-INVALID");
        render(<Holidays />);
        expect(document.documentElement.lang).toBe("en");
        expect(screen.getByLabelText(TRANSLATIONS.en.languageSelector.ariaLabel)).toHaveValue("en");
        expect(screen.getAllByRole("heading", { level: 1 })[0]).toHaveTextContent(TRANSLATIONS.en.app.holidaysTitle);
        await screen.findByRole("button", { name: new RegExp(TRANSLATIONS.en.countries.LV) });
    });

    it.each<string | null>([null, "en"])(
        "preserves selected language in memory when localStorage.setItem throws QuotaExceededError and getItem returns %s",
        async (storedValue) => {
            if (storedValue !== null) {
                localStorage.setItem(LANGUAGE_STORAGE_KEY, storedValue);
            }
            expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe(storedValue);

            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
            const setItemSpy = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
                throw new DOMException("QuotaExceededError");
            });

            render(
                <LanguageProvider>
                    <Holidays />
                </LanguageProvider>
            );

            expect(document.documentElement.lang).toBe("en");
            expect(screen.getAllByRole("heading", { level: 1 })[0]).toHaveTextContent(TRANSLATIONS.en.app.holidaysTitle);

            const langSelect = screen.getByLabelText(TRANSLATIONS.en.languageSelector.ariaLabel) as HTMLSelectElement;
            fireEvent.change(langSelect, { target: { value: "de" } });

            await waitFor(() => {
                expect(document.documentElement.lang).toBe("de");
            });
            expect(screen.getAllByRole("heading", { level: 1 })[0]).toHaveTextContent(TRANSLATIONS.de.app.holidaysTitle);
            expect(screen.getByLabelText(TRANSLATIONS.de.languageSelector.ariaLabel)).toHaveValue("de");
            expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe(storedValue);

            // Ensure async holiday data settles without reverting language back to English
            await screen.findByRole("button", { name: new RegExp(TRANSLATIONS.de.countries.LV) });
            expect(document.documentElement.lang).toBe("de");
            expect(screen.getAllByRole("heading", { level: 1 })[0]).toHaveTextContent(TRANSLATIONS.de.app.holidaysTitle);

            // Verify recovery once storage writes succeed again
            setItemSpy.mockRestore();
            consoleErrorSpy.mockRestore();
            fireEvent.change(screen.getByLabelText(TRANSLATIONS.de.languageSelector.ariaLabel), {
                target: { value: "fr" },
            });
            await waitFor(() => {
                expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("fr");
            });
            expect(document.documentElement.lang).toBe("fr");
            expect(screen.getAllByRole("heading", { level: 1 })[0]).toHaveTextContent(TRANSLATIONS.fr.app.holidaysTitle);
        }
    );
});
