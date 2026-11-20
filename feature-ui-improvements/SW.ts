import {
    startNotificationsCommand,
    type HolidayDTO,
    stopNotificationsCommand,
    getNotificationsStatusCommand,
    notificationsWereSet,
} from "../notifications/types.ts";
import { getFlagEmoji } from "../utils/countryFlags.ts";
import { APP_BASE_NAME, dateLocale } from "../consts.ts";

declare const self: ServiceWorkerGlobalScope;

// Periodic Background Sync types (some TS DOM libs don't include these yet)
declare global {
    interface PeriodicSyncOptions { minInterval?: number }
    interface PeriodicSyncManager {
        register(tag: string, options?: PeriodicSyncOptions): Promise<void>;
        unregister(tag: string): Promise<void>;
        getTags?(): Promise<string[]>;
    }
    interface PeriodicSyncEvent extends Event {
        readonly tag: string;
        waitUntil(promise: Promise<unknown>): void;
    }
    interface ServiceWorkerRegistration {
        periodicSync?: PeriodicSyncManager;
    }
    interface ServiceWorkerGlobalScopeEventMap {
        periodicsync: PeriodicSyncEvent;
    }
}

self.addEventListener("install", () => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});

function getCountriesNames(selectedYearDays: HolidayDTO[]) {
    return Array.from(new Set(selectedYearDays.map(ev => ev.countryCode).filter(Boolean)));
}

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: "window" }).then((clientList) => {
            const eventData = (event.notification.data as HolidayDTO[]) ?? [];
            for (const client of clientList) {
                if ("focus" in client) {
                    eventData.forEach(notification => {
                        events.filter(e => notification.date === e.date && notification.name === e.name)
                            .forEach(e => { e.shown = true; });
                    });

                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                eventData.forEach(notification => {
                    events.filter(e => notification.date === e.date && notification.name === e.name)
                        .forEach(e => { e.shown = true; });
                });
                const dateParam = eventData[0]?.date ?? "";
                return self.clients.openWindow(
                    "/" + APP_BASE_NAME + `/Holidays#countries=${getCountriesNames(eventData).join(",")}&mode=month&date=${dateParam}`);
            }
        })
    );
});

let events: HolidayDTO[] = [];
let interval = 0;
let isRegistered = false;
self.addEventListener("message", (event) => {
    console.log("SW received message", event.data.type);
    if (event.data.type === startNotificationsCommand) {
        events = event.data.events;
        isRegistered = true;
        // Keep worker alive while we attempt registration
        event.waitUntil((async () => {
            console.log("registered events", events.length);
            clearInterval(interval);
            interval = 0;

            // Try Periodic Background Sync registration (1 hour)
            const hour = 1000 * 60 * 60;
            const periodic: PeriodicSyncManager | undefined = (self.registration as ServiceWorkerRegistration).periodicSync;
            if (periodic) {
                try {
                    await periodic.register("holiday-check", { minInterval: hour });
                    console.log("registered periodic sync: holiday-check");
                } catch (err) {
                    console.warn("periodic sync registration failed, falling back to setInterval", err);
                    interval = self.setInterval(() => {
                        checkEvents();
                    }, hour);
                }
            } else {
                // Fallback for browsers without Periodic Sync support
                interval = self.setInterval(() => {
                    checkEvents();
                }, hour);
            }
        })());
    }
    if (event.data.type === stopNotificationsCommand) {
        isRegistered = false;
        events = [];
        clearInterval(interval);
        interval = 0;
        event.waitUntil((async () => {
            // Try unregistering periodic sync if available
            try {
                const periodic: PeriodicSyncManager | undefined = (self.registration as ServiceWorkerRegistration).periodicSync;
                if (periodic && typeof periodic.unregister === "function") {
                    await periodic.unregister("holiday-check");
                    console.log("unregistered periodic sync: holiday-check");
                }
            } catch (err) {
                console.warn("periodic sync unregister failed", err);
            }
        })());
    }
    if (event.data.type === getNotificationsStatusCommand) {
        self.clients.matchAll({ type: "window" }).then((clientList) => {
            clientList.forEach(client => {
                client.postMessage({
                    type: notificationsWereSet,
                    status: isRegistered || interval > 0,
                });
            });
        });
    }
});

// Periodic Background Sync event listener
self.addEventListener("periodicsync", (event: PeriodicSyncEvent) => {
    if (event.tag === "holiday-check") {
        event.waitUntil(checkEvents());
    }
});

async function checkEvents() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tomorrowString = tomorrow.toLocaleDateString(dateLocale, {
        year: "numeric",
        month: "numeric",
        day: "numeric",
    }); // YYYY-MM-DD

    const upcoming = events
        .filter(event => event.date === tomorrowString && !event.shown);
    if (upcoming.length) {
        await sendNotification(upcoming);
    }

    console.log(events.length + " events checked");
}

async function sendNotification(data: HolidayDTO[]) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowFormatted = data[0]?.date ?? tomorrow.toLocaleDateString(dateLocale);
    await self.registration.showNotification(`It's a holiday tomorrow ${tomorrowFormatted}! 🙌`, {
        data: data,
        body: data.map(e => getFlagEmoji(e.countryCode) + " " + e.country + ": " + e.name).join("\n"),
        icon: "data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"%3E%3Ccircle cx=\"50\" cy=\"50\" r=\"40\" fill=\"%233b82f6\"/%3E%3Ctext x=\"50\" y=\"65\" font-size=\"50\" text-anchor=\"middle\" fill=\"white\"%3E⏰%3C/text%3E%3C/svg%3E",
        badge: "data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"%3E%3Ccircle cx=\"12\" cy=\"12\" r=\"10\" fill=\"%233b82f6\"/%3E%3C/svg%3E",
        tag: "holiday-notified",
        requireInteraction: true,
    });
}
