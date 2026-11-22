import { holidays_AU } from "../AU";
import { holidays_NZ } from "../NZ";

export const holidays = {
    AU: holidays_AU,
    NZ: holidays_NZ,
} as const;
