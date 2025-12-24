"use strict";
(() => {
  // src/consts.ts
  var dateLocale = "en-CA";

  // src/notifications/types.ts
  var startNotificationsCommand = "START_NOTIFICATIONS";
  var stopNotificationsCommand = "STOP_NOTIFICATIONS";
  var getNotificationsStatusCommand = "CHECK_NOTIFICATIONS";
  var notificationsWereSet = "NOTIFICATIONS_SET";

  // src/utils/countryFlags.ts
  var getFlagEmoji = (countryCode) => {
    return countryCode.toUpperCase().replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
  };

  // src/assets/SW.ts
  self.addEventListener("install", () => {
    self.skipWaiting();
  });
  self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
  });
  function getCountriesNames(selectedYearDays) {
    return Array.from(new Set(selectedYearDays.map((ev) => ev.country)));
  }
  self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(
      self.clients.matchAll({ type: "window" }).then((clientList) => {
        const eventData = event.notification.data;
        for (let client of clientList) {
          if ("focus" in client) {
            eventData.forEach((notification) => {
              events.filter((e) => notification.date === e.date && notification.name === e.name).forEach((e) => {
                e.shown = true;
              });
            });
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          eventData.forEach((notification) => {
            events.filter((e) => notification.date === e.date && notification.name === e.name).forEach((e) => {
              e.shown = true;
            });
          });
          return self.clients.openWindow(`/PublicHolidays/Holidays#countries=${getCountriesNames(eventData)}&mode=month&date=${event.notification.data}`);
        }
      })
    );
  });
  var events = [];
  var interval = 0;
  self.addEventListener("message", (event) => {
    console.log("SW received message", event.data.type);
    if (event.data.type === startNotificationsCommand) {
      event.waitUntil((async () => {
        events = event.data.events;
        console.log("registered events", events.length);
        clearInterval(interval);
        const hour = 1e3 * 60 * 60;
        const periodic = self.registration.periodicSync;
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
          interval = self.setInterval(() => {
            checkEvents();
          }, hour);
        }
      })());
    }
    if (event.data.type === stopNotificationsCommand) {
      event.waitUntil((async () => {
        try {
          const periodic = self.registration.periodicSync;
          if (periodic && typeof periodic.unregister === "function") {
            await periodic.unregister("holiday-check");
            console.log("unregistered periodic sync: holiday-check");
          }
        } catch (err) {
          console.warn("periodic sync unregister failed", err);
        }
        clearInterval(interval);
        interval = 0;
      })());
    }
    if (event.data.type === getNotificationsStatusCommand) {
      self.clients.matchAll({ type: "window" }).then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({
            type: notificationsWereSet,
            status: interval > 0
          });
        });
      });
    }
  });
  self.addEventListener("periodicsync", (event) => {
    if (event.tag === "holiday-check") {
      event.waitUntil(checkEvents());
    }
  });
  async function checkEvents() {
    const tomorrow = /* @__PURE__ */ new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toLocaleDateString(dateLocale, {
      year: "numeric",
      month: "numeric",
      day: "numeric"
    });
    const upcoming = events.filter((event) => event.date === tomorrowString && !event.shown);
    if (upcoming.length) {
      await sendNotification(upcoming);
    }
    console.log(events.length + " events checked");
  }
  async function sendNotification(data) {
    const tomorrow = /* @__PURE__ */ new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await self.registration.showNotification(`It's a holiday tomorrow ${tomorrow}! \u{1F64C}`, {
      data,
      body: data.map((e) => getFlagEmoji(e.countryCode) + " " + e.country + ": " + e.name).join("\n"),
      icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="40" fill="%233b82f6"/%3E%3Ctext x="50" y="65" font-size="50" text-anchor="middle" fill="white"%3E\u23F0%3C/text%3E%3C/svg%3E',
      badge: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Ccircle cx="12" cy="12" r="10" fill="%233b82f6"/%3E%3C/svg%3E',
      tag: "holiday-notified",
      requireInteraction: true
    });
  }
})();
