import ReactDOM from "react-dom/client";
import Holidays from "./Holidays.tsx";
import AnyEvents from "./AnyEvents.tsx";
import "./index.css";

import { createBrowserRouter, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";
import { APP_BASE_NAME } from "./consts";

const router = createBrowserRouter([
    {
        path: "/" + APP_BASE_NAME,
        Component: Outlet,
        children: [
            {
                index: true,
                Component: Holidays,
            },
            {
                path: "EditEvents",
                Component: AnyEvents,
            },
        ],
    },
]);

const root = document.getElementById("root")!;

ReactDOM.createRoot(root).render(
    <RouterProvider router={router} />,
);
