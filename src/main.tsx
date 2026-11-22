import ReactDOM from "react-dom/client";
import "./index.css";

import { createBrowserRouter, Outlet, useNavigate, useSearchParams } from "react-router";
import { RouterProvider } from "react-router/dom";
import { APP_BASE_NAME } from "./consts";
import React, { useEffect } from "react";
import { LanguageProvider } from "./i18n/LanguageContext.tsx";
import { Holidays } from "./Holidays.tsx";

export const Index: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const path = searchParams?.get("path");
    const shouldRedirect = Boolean(path?.includes(APP_BASE_NAME));

    useEffect(() => {
        if (shouldRedirect && path) {
            navigate(path.replace("/" + APP_BASE_NAME + "/", "") + location.hash, { replace: true });
        }
    }, [shouldRedirect, path, navigate]);

    if (shouldRedirect) {
        return null;
    }

    return <Holidays />;
};

const App = () => {
    return <Outlet />;
}

const router = createBrowserRouter([
    {
        path: "/" + APP_BASE_NAME,
        Component: App,
        children: [
            {
                index: true,
                Component: Index,
            },
            {
                path: "Holidays",
                Component: Holidays,
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

const root = document.getElementById("root");

if (root) {
    ReactDOM.createRoot(root).render(
        <LanguageProvider>
            <RouterProvider router={router} />
        </LanguageProvider>,
    );
}
