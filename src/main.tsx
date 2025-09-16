import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import FamilyEvents from "./FamilyEvents.tsx";
import "./index.css";

import { createBrowserRouter, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";

function Root() {
    return <Outlet />;
}

const router = createBrowserRouter([
    {
        path: "/PublicHolidays",
        Component: Root,
        children: [
            {
                index: true,
                path: "Holidays",
                Component: App,
            },
            {
                path: "FamilyEvents",
                Component: FamilyEvents,
            },
        ],
    },
]);

const root = document.getElementById("root")!;

ReactDOM.createRoot(root).render(
    <RouterProvider router={router} />,
);
