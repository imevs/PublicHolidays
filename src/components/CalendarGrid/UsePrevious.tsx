import React from "react";

export function usePrevious<T extends object>(value: T): T | null {
    const [current, setCurrent] = React.useState(value);
    const [previous, setPrevious] = React.useState<T | null>(null);

    if (value !== current) {
        setPrevious(current);
        setCurrent(value);
    }

    return previous;
}