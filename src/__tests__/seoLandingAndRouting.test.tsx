import * as fs from "fs";
import * as path from "path";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockNavigate = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock("react-router", () => ({
    createBrowserRouter: jest.fn(() => ({})),
    Outlet: () => null,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams],
}));

jest.mock("react-router/dom", () => ({
    RouterProvider: () => null,
}));

jest.mock("../components/CalendarGrid/UsePrevious.tsx", () => ({
    usePrevious: () => null,
}));

import { SeoLandingSection } from "../components/SeoLandingSection/SeoLandingSection.tsx";
import { Holidays } from "../Holidays.tsx";
import { Index } from "../main.tsx";
import { TRANSLATIONS } from "../i18n/locales/index.ts";

describe("SeoLandingSection and root Index routing", () => {
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

    beforeEach(() => {
        mockNavigate.mockReset();
        mockSearchParams = new URLSearchParams();
        window.location.hash = "";
    });

    it("renders features, all 7 presets, and 4 FAQs and updates hash on Holidays preset click", () => {
        render(<SeoLandingSection activeRoute="Holidays" />);

        const seo = TRANSLATIONS.en.seoLanding;
        expect(screen.getByRole("heading", { level: 2, name: seo.featuresHeading })).toBeInTheDocument();
        expect(screen.getByRole("heading", { level: 3, name: seo.features.multiCountryTitle })).toBeInTheDocument();
        expect(screen.getByRole("heading", { level: 3, name: seo.features.longWeekendsTitle })).toBeInTheDocument();
        expect(screen.getByRole("heading", { level: 3, name: seo.features.printableExportTitle })).toBeInTheDocument();
        expect(screen.getByRole("heading", { level: 3, name: seo.features.customBuilderTitle })).toBeInTheDocument();

        const expectedPresets = [
            { label: seo.presets.baltic, codes: "LV,EE,LT" },
            { label: seo.presets.dach, codes: "DE,AT,CH" },
            { label: seo.presets.ukUsCa, codes: "GB,US,CA" },
            { label: seo.presets.nordic, codes: "SE,NO,FI,DK,IS" },
            { label: seo.presets.westernEurope, codes: "FR,DE,NL,BE,LU" },
            { label: seo.presets.southernEurope, codes: "ES,IT,PT,GR" },
            { label: seo.presets.asiaPacific, codes: "JP,KR,AU,NZ,IN" },
        ];

        for (const preset of expectedPresets) {
            const link = screen.getByRole("link", { name: new RegExp(preset.label) });
            expect(link).toHaveAttribute("href", `/PublicHolidays/Holidays#countries=${preset.codes}`);
        }

        expect(screen.getByText(seo.faqs.compareQuestion)).toBeInTheDocument();
        expect(screen.getByText(seo.faqs.longWeekendsQuestion)).toBeInTheDocument();
        expect(screen.getByText(seo.faqs.exportPrintQuestion)).toBeInTheDocument();
        expect(screen.getByText(seo.faqs.customCalendarQuestion)).toBeInTheDocument();

        window.location.hash = "date=2026-05-01";
        fireEvent.click(screen.getByRole("link", { name: new RegExp(seo.presets.dach) }));
        expect(window.location.hash).toBe("#date=2026-05-01&countries=DE,AT,CH");
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("navigates to Holidays with preset hash when clicked from EditEvents", () => {
        render(<SeoLandingSection activeRoute="EditEvents" />);
        fireEvent.click(screen.getByRole("link", { name: new RegExp(TRANSLATIONS.en.seoLanding.presets.baltic) }));
        expect(mockNavigate).toHaveBeenCalledWith("/PublicHolidays/Holidays#countries=LV,EE,LT");
    });

    it("Index renders Holidays directly when ?path= is absent and redirects when ?path= includes APP_BASE_NAME", async () => {
        render(<Index />);
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(screen.getAllByRole("heading", { level: 1 })[0]).toHaveTextContent(TRANSLATIONS.en.app.holidaysTitle);
        await screen.findByRole("button", { name: new RegExp(TRANSLATIONS.en.countries.LV) });

        mockSearchParams = new URLSearchParams("path=/PublicHolidays/EditEvents");
        window.location.hash = "#date=2026-01-01";
        render(<Index />);
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("EditEvents#date=2026-01-01", { replace: true });
        });
    });

    it("hides languageSelector, topUtilityBar, and seoSection in @media print stylesheets", () => {
        const indexCss = fs.readFileSync(path.join(process.cwd(), "src/index.css"), "utf-8");
        const langCss = fs.readFileSync(
            path.join(process.cwd(), "src/components/LanguageSelector/LanguageSelector.module.css"),
            "utf-8",
        );
        const holidaysCss = fs.readFileSync(path.join(process.cwd(), "src/Holidays.module.css"), "utf-8");
        const seoCss = fs.readFileSync(
            path.join(process.cwd(), "src/components/SeoLandingSection/SeoLandingSection.module.css"),
            "utf-8",
        );

        const indexPrint = indexCss.slice(indexCss.indexOf("@media print"));
        expect(indexPrint).toContain("[class*=\"languageSelector\"]");
        expect(indexPrint).toContain("[class*=\"topUtilityBar\"]");
        expect(langCss).toMatch(/@media print\s*\{[\s\S]*\.languageSelector\s*\{[\s\S]*display:\s*none\s*!important;/);
        expect(holidaysCss).toMatch(/@media print\s*\{[\s\S]*\.topUtilityBar\s*\{[\s\S]*display:\s*none\s*!important;/);
        expect(seoCss).toMatch(/@media print\s*\{[\s\S]*\.seoSection\s*\{[\s\S]*display:\s*none\s*!important;/);
    });

    it("enables the Highlight long holidays checkbox when clicking the Long Weekend Finder action button in Holidays", async () => {
        render(<Holidays />);

        const checkbox = screen.getByLabelText(TRANSLATIONS.en.countryFilter.highlightLongHolidays) as HTMLInputElement;
        expect(checkbox.checked).toBe(false);

        const actionBtn = screen.getByRole("button", { name: TRANSLATIONS.en.countryFilter.highlightLongHolidays });
        fireEvent.click(actionBtn);

        expect(checkbox.checked).toBe(true);
        await screen.findByRole("button", { name: new RegExp(TRANSLATIONS.en.countries.LV) });
    });

    it("sets sessionStorage and navigates to Holidays when clicking the Long Weekend Finder action button from EditEvents, and initializes Holidays with highlightLongHolidays enabled", async () => {
        window.location.hash = "#date=2026-06-01";
        const { unmount } = render(<SeoLandingSection activeRoute="EditEvents" />);

        const actionBtn = screen.getByRole("button", { name: TRANSLATIONS.en.countryFilter.highlightLongHolidays });
        fireEvent.click(actionBtn);

        expect(sessionStorage.getItem("enableLongHolidays")).toBe("1");
        expect(mockNavigate).toHaveBeenCalledWith("/PublicHolidays/Holidays#date=2026-06-01");
        unmount();

        render(<Holidays />);
        const checkbox = screen.getByLabelText(TRANSLATIONS.en.countryFilter.highlightLongHolidays) as HTMLInputElement;
        expect(checkbox.checked).toBe(true);
        expect(sessionStorage.getItem("enableLongHolidays")).toBeNull();
        await screen.findByRole("button", { name: new RegExp(TRANSLATIONS.en.countries.LV) });
    });
});
