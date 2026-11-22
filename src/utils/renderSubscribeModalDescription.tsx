import React, { Fragment } from "react";

export function renderSubscribeModalDescription(template: string): React.ReactNode {
    const parts = template.split(/(\{google\}|\{apple\}|\{outlook\})/g);
    return parts.map((part, index) => {
        if (part === "{google}") {
            return <strong key={index}>Google Calendar</strong>;
        }
        if (part === "{apple}") {
            return <strong key={index}>Apple Calendar</strong>;
        }
        if (part === "{outlook}") {
            return <strong key={index}>Outlook</strong>;
        }
        return <Fragment key={index}>{part}</Fragment>;
    });
}
