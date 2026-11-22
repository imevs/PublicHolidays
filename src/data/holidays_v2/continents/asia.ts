import { holidays_CN } from "../CN";
import { holidays_ID } from "../ID";
import { holidays_JP } from "../JP";
import { holidays_KR } from "../KR";

export const holidays = {
    CN: holidays_CN,
    ID: holidays_ID,
    JP: holidays_JP,
    KR: holidays_KR,
} as const;
