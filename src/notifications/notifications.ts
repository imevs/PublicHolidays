import {
    getNotificationsStatusCommand,
    type HolidayDTO, notificationsWereSet,
    startNotificationsCommand,
    stopNotificationsCommand
} from "./types";

export async function requestNotificationPermission(checkOnly: boolean) {
    if (!("Notification" in window)) {
        return false;
    }

    if (Notification.permission === "default" && !checkOnly) {
        const permission = await Notification.requestPermission();
        return permission === "granted";
    }
    return Notification.permission === "granted";
}

export const hasServiceWorker = "serviceWorker" in navigator;
export async function initServiceWorker(notificationsEnabled: (s: boolean) => void) {
    if (!hasServiceWorker) {
        console.error("❌ Service Worker not supported");
        return null;
    }

    if (sw) {
        return sw;
    }

    try {
        await navigator.serviceWorker.register("./SW.js");
        await navigator.serviceWorker.ready;

        console.log("✅ Service Worker active");

        navigator.serviceWorker.addEventListener("message", (event) => {
            if (event.data.type === notificationsWereSet) {
                notificationsEnabled(event.data.status);
            }
        });
        return navigator.serviceWorker.controller;
    } catch (error) {
        console.error("Service Worker registration failed:", error);
        return null;
    }
}

let sw: ServiceWorker | null;

export async function registerNotifications(
    data: HolidayDTO[],
    registerSilently: boolean,
    notificationsEnabled: (s: boolean) => void,
): Promise<void> {
    const result = await requestNotificationPermission(registerSilently);
    if (result) {
        sw = await initServiceWorker(notificationsEnabled);
        const prevData = localStorage.getItem("sw_data");
        if (registerSilently) {
            if (prevData) {
                sw?.postMessage({
                    type: startNotificationsCommand,
                    events: JSON.parse(prevData),
                });
            }
        } else {
            sw?.postMessage({
                type: startNotificationsCommand,
                events: data,
            });
            localStorage.setItem("sw_data", JSON.stringify(data));
        }
        checkServiceWorker();
    }
}

export function checkServiceWorker() {
    sw?.postMessage({
        type: getNotificationsStatusCommand,
    });
}

export function stopNotifications() {
    sw?.postMessage({
        type: stopNotificationsCommand,
    });
    localStorage.removeItem("sw_data");
    checkServiceWorker();
}