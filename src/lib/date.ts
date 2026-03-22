import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfYear,
  format,
  isSaturday,
  isSunday,
  parseISO,
  startOfYear,
} from "date-fns";
import { tr } from "date-fns/locale";
import { Holiday } from "@/types/holiday";

export function toDate(dateStr: string) {
  return parseISO(dateStr);
}

export function toIso(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function formatDateTR(dateStr: string) {
  return format(toDate(dateStr), "d MMMM yyyy, EEEE", { locale: tr });
}

export function formatShortTR(dateStr: string) {
  return format(toDate(dateStr), "d MMMM", { locale: tr });
}

export function isWeekend(date: Date) {
  return isSaturday(date) || isSunday(date);
}

export function daysUntil(dateStr: string) {
  return differenceInCalendarDays(toDate(dateStr), new Date());
}

export function getYearDates(year: number) {
  return eachDayOfInterval({
    start: startOfYear(new Date(year, 0, 1)),
    end: endOfYear(new Date(year, 0, 1)),
  });
}

export function buildHolidayMap(holidays: Holiday[]) {
  const map = new Map<string, Holiday>();

  for (const holiday of holidays) {
    map.set(holiday.date, holiday);
  }

  return map;
}

export function addDaysIso(dateStr: string, amount: number) {
  return toIso(addDays(toDate(dateStr), amount));
}