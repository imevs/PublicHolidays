import { dateLocale } from "../consts";
import {
    startNotificationsCommand,
    type HolidayDTO,
    stopNotificationsCommand,
    getNotificationsStatusCommand, notificationsWereSet
} from "../notifications/types";
import { getFlagEmoji } from "../utils/countryFlags";

declare const self: ServiceWorkerGlobalScope;

self.addEventListener("install", () => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});

function getCountriesNames(selectedYearDays: HolidayDTO[]) {
    return Array.from(new Set(selectedYearDays.map(ev => ev.country)));
}

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: "window" }).then((clientList) => {
            const eventData = event.notification.data as HolidayDTO[];
            for (let client of clientList) {
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
                return self.clients.openWindow(`/PublicHolidays/Holidays#countries=${getCountriesNames(eventData)}&mode=month&date=${event.notification.data}`);
            }
        })
    );
});

let events: HolidayDTO[] = [];
let interval = 0;
self.addEventListener("message", (event) => {
    console.log("SW received message", event.data.type);
    if (event.data.type === startNotificationsCommand) {
        events = event.data.events;
        console.log("registered events", events.length);
        clearInterval(interval);
        const minute = 1000 * 60;
        interval = self.setInterval(() => {
            checkEvents();
        }, minute * 0.5);
    }
    if (event.data.type === stopNotificationsCommand) {
        clearInterval(interval);
        interval = 0;
    }
    if (event.data.type === getNotificationsStatusCommand) {
        self.clients.matchAll({ type: "window" }).then((clientList) => {
            clientList.forEach(client => {
                client.postMessage({
                    type: notificationsWereSet,
                    status: interval > 0,
                })
            });
        });
    }
});

function checkEvents() {
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
        sendNotification(upcoming);
    }

    console.log(events.length + " events checked");
}

async function sendNotification(data: HolidayDTO[]) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await self.registration.showNotification(`It's a holiday tomorrow ${tomorrow}! 🙌`, {
        data: data,
        body: data.map(e => getFlagEmoji(e.countryCode) + " " + e.country + ": " + e.name).join("\n"),
        icon: "data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"%3E%3Ccircle cx=\"50\" cy=\"50\" r=\"40\" fill=\"%233b82f6\"/%3E%3Ctext x=\"50\" y=\"65\" font-size=\"50\" text-anchor=\"middle\" fill=\"white\"%3E⏰%3C/text%3E%3C/svg%3E",
        badge: "data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"%3E%3Ccircle cx=\"12\" cy=\"12\" r=\"10\" fill=\"%233b82f6\"/%3E%3C/svg%3E",
        tag: "holiday-notified",
        requireInteraction: true,
    });
}
