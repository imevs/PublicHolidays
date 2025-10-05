import ReactDOM from "react-dom/client";
import Holidays from "./Holidays.tsx";
import AnyEvents from "./AnyEvents.tsx";
import "./index.css";

import { createBrowserRouter, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";

const router = createBrowserRouter([
    {
        path: "/PublicHolidays",
        Component: Outlet,
        children: [
            {
                index: true,
                path: "Holidays",
                Component: Holidays,
            },
            {
                path: "Events",
                Component: AnyEvents,
            },
        ],
    },
]);

const root = document.getElementById("root")!;

ReactDOM.createRoot(root).render(
    <RouterProvider router={router} />,
);
