import { holidays_CA } from "../CA";
import { holidays_US } from "../US";

export const holidays = {
    CA: holidays_CA,
    US: holidays_US,
} as const;
