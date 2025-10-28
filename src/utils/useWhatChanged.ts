import React from "react";

export function useWhatChanged(props: { [prop: string]: unknown }) {
    const prev = React.useRef(props);

    React.useEffect(() => {
        const changed = Object.entries(props).reduce((a, [key, prop]: [string, unknown]) => {
            if (prev.current[key] === prop) return a;
            return {
                ...a,
                [key]: {
                    prev: prev.current[key],
                    next: prop,
                },
            };
        }, {} as { [k: string]: unknown });

        if (Object.keys(changed).length > 0) {
            console.group("Changed Props");
            console.log(changed);
            console.groupEnd();
        }

        prev.current = props;
    }, [props]);
}
