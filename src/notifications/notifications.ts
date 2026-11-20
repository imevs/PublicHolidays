import {
    getNotificationsStatusCommand,
    type HolidayDTO, notificationsWereSet,
    startNotificationsCommand,
    stopNotificationsCommand
} from "./types.ts";

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

let sw: ServiceWorker | null = null;
let onStatusChange: ((s: boolean) => void) | null = null;
let messageListenerAdded = false;

function handleSWMessage(event: MessageEvent) {
    if (event.data?.type === notificationsWereSet) {
        onStatusChange?.(event.data.status);
    }
}

export async function initServiceWorker(notificationsEnabled: (s: boolean) => void) {
    if (!hasServiceWorker) {
        console.error("❌ Service Worker not supported");
        return null;
    }

    onStatusChange = notificationsEnabled;

    if (sw) {
        return sw;
    }

    try {
        await navigator.serviceWorker.register("./SW.js");
        const registration = await navigator.serviceWorker.ready;

        console.log("✅ Service Worker active");

        if (!messageListenerAdded) {
            navigator.serviceWorker.addEventListener("message", handleSWMessage);
            messageListenerAdded = true;
        }
        return navigator.serviceWorker.controller ?? registration.active;
    } catch (error) {
        console.error("Service Worker registration failed:", error);
        return null;
    }
}

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