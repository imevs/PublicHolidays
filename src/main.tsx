import ReactDOM from "react-dom/client";
import "./index.css";

import { createBrowserRouter, Outlet, useNavigate, useSearchParams } from "react-router";
import { RouterProvider } from "react-router/dom";
import { APP_BASE_NAME } from "./consts";
import React, { useEffect } from "react";

export const Index: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const path = searchParams?.get("path");
        if (path?.includes(APP_BASE_NAME)) {
            navigate(path + location.hash);
        } else {
            navigate("Holidays");
        }
    }, []);
    return null;
};

const router = createBrowserRouter([
    {
        path: "/" + APP_BASE_NAME,
        Component: Outlet,
        children: [
            {
                index: true,
                Component: Index,
            },
            {
                path: "Holidays",
                async lazy() {
                    return { Component: (await import("./Holidays.tsx")).Holidays };
                },
            },
            {
                path: "EditEvents",
                async lazy() {
                    return { Component: (await import("./AnyEvents.tsx")).AnyEvents };
                },
            },
        ],
    },
]);

const root = document.getElementById("root")!;

ReactDOM.createRoot(root).render(
    <RouterProvider router={router} />,
);
