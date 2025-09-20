import ReactDOM from "react-dom/client";
import Holidays from "./Holidays.tsx";
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
                Component: Holidays,
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
