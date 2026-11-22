import type { CountryCode } from "../data/countryNames.ts";

export type LanguageCode = "en" | "ru" | "fr" | "es" | "lv" | "de";

export interface LanguageOption {
    code: LanguageCode;
    intlLocale: string;
    nativeName: string;
    flag: string;
}

export type ContinentId = "europe" | "asia" | "northAmerica" | "southAmerica" | "oceania";

export type ThemeId =
    | "neutral"
    | "dark"
    | "ocean"
    | "sunset"
    | "ios"
    | "material"
    | "creme"
    | "pencil"
    | "seasonal"
    | "lightblue"
    | "brightblue"
    | "book";

export type ColorKey = "teal" | "blue" | "purple" | "amber" | "rose" | "green" | "red";

export type ValidationErrorKey =
    | "emptyLine"
    | "expectDateAndName"
    | "expectDateColorAndName"
    | "invalidDateRangeFormat"
    | "invalidDateInRange"
    | "dateRangeFormatMismatch"
    | "startAfterEnd"
    | "invalidDate"
    | "invalid";

export interface TranslationDictionary {
    app: {
        holidaysDocumentTitle: string;
        eventsDocumentTitle: string;
        holidaysMetaDescription: string;
        holidaysMetaKeywords: string;
        eventsMetaDescription: string;
        eventsMetaKeywords: string;
        holidaysTitle: string;
        holidaysSubtitle: string;
        eventsTitle: string;
        eventsSubtitle: string;
        navAriaLabel: string;
        navPublicHolidays: string;
        navCustomEvents: string;
    };
    languageSelector: {
        label: string;
        ariaLabel: string;
    };
    themeSelector: {
        label: string;
        ariaLabel: string;
        themes: Record<ThemeId, string>;
    };
    controls: {
        selectYear: string;
        selectMonth: string;
        previousYearAria: string;
        nextYearAria: string;
        previousMonthAria: string;
        nextMonthAria: string;
        previous: string;
        next: string;
    };
    countryFilter: {
        selectCountries: string;
        highlightLongHolidays: string;
        showTimezones: string;
        showLocalTime: string;
        currentTimePrefix: string;
        hideInactive: string;
        showAll: string;
    };
    continents: Record<ContinentId, string>;
    countries: Record<CountryCode, string>;
    dates: {
        months: [
            string, string, string, string, string, string,
            string, string, string, string, string, string
        ];
        weekdaysShort: [string, string, string, string, string, string, string];
    };
    monthNavigation: {
        clickToSeeWholeYear: string;
    };
    calendarGrid: {
        clickToSwitchMonthView: string;
        eventsOnDate: string;
        close: string;
        edit: string;
        delete: string;
        editEventAria: string;
        deleteEventAria: string;
        addEvent: string;
        longHolidayTooltip: string;
        longHolidayTooltipCustom: string;
    };
    actionButtons: {
        combinedIcsDownloaded: string;
        separateIcsDownloaded: string;
        calendarImageSaved: string;
        saveImageFailedAlert: string;
        linkCopied: string;
        copyFailed: string;
        calendarActionsAria: string;
        viewModeAria: string;
        yearShort: string;
        yearView: string;
        monthShort: string;
        monthView: string;
        exportAndSubscribeAria: string;
        subscribeShort: string;
        subscribeAdd: string;
        saveShort: string;
        saveAsImage: string;
        createCustomCalendar: string;
        customizeShort: string;
        customizeCalendar: string;
        subscribeModalTitle: string;
        closeDialogAria: string;
        subscribeModalDesc: string;
        sectionDownloadTitle: string;
        includeReminderLabel: string;
        downloadIcsButton: string;
        downloadSeparateIcsButton: string;
        sectionGoogleTitle: string;
        addToGoogleCalendar: string;
        sectionShareTitle: string;
        copyShareableLink: string;
        close: string;
    };
    eventPopup: {
        editEventForDate: string;
        addEventForDate: string;
        closeAria: string;
        nameLabel: string;
        oneTimeLabel: string;
        dateRangeLabel: string;
        endDateLabel: string;
        highlightColorLabel: string;
        colors: Record<ColorKey, string>;
        saveButton: string;
        deleteButton: string;
        cancelButton: string;
    };
    eventListInput: {
        formatPrefix: string;
        formatSingleExample: string;
        formatOr: string;
        formatRangeExample: string;
        errors: Record<ValidationErrorKey, string>;
    };
    eventListInputButtons: {
        importButton: string;
        importOptionsAria: string;
        importIcsFile: string;
        loadIcsFromLink: string;
        urlModalTitle: string;
        closeAria: string;
        calendarIcsUrlLabel: string;
        urlPlaceholder: string;
        loadIcsButton: string;
        cancelButton: string;
    };
    slidingPanel: {
        actionsPanelAria: string;
    };
    seoLanding: {
        sectionAriaLabel: string;
        featuresHeading: string;
        features: {
            multiCountryTitle: string;
            multiCountryDesc: string;
            longWeekendsTitle: string;
            longWeekendsDesc: string;
            printableExportTitle: string;
            printableExportDesc: string;
            customBuilderTitle: string;
            customBuilderDesc: string;
        };
        presetsHeading: string;
        presetsDesc: string;
        presets: {
            baltic: string;
            dach: string;
            ukUsCa: string;
            nordic: string;
            westernEurope: string;
            southernEurope: string;
            asiaPacific: string;
        };
        faqHeading: string;
        faqs: {
            compareQuestion: string;
            compareAnswer: string;
            longWeekendsQuestion: string;
            longWeekendsAnswer: string;
            exportPrintQuestion: string;
            exportPrintAnswer: string;
            customCalendarQuestion: string;
            customCalendarAnswer: string;
        };
    };
}
