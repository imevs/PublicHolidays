import { holidays as allEurope } from "./europe";
import { filterHolidaysMapByYear } from "./filterByYear";

export const holidays = filterHolidaysMapByYear(allEurope, 2024);
