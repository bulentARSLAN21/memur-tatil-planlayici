import {
  addDays,
  compareAsc,
  eachDayOfInterval,
  endOfYear,
  format,
  startOfYear,
} from "date-fns";
import { tr } from "date-fns/locale";
import { Holiday, PlannerInput, RestBlock, Suggestion } from "@/types/holiday";
import { buildHolidayMap, isWeekend, toDate, toIso } from "./date";

export function getAnnualLeaveAllowance(serviceYears: number) {
  if (serviceYears < 1) return 0;
  return serviceYears <= 10 ? 20 : 30;
}

function getDayValue(
  date: Date,
  holidayMap: Map<string, Holiday>,
  leaveSet: Set<string>
) {
  const iso = toIso(date);
  const holiday = holidayMap.get(iso);

  if (leaveSet.has(iso)) {
    return { kind: "leave" as const, value: 1 };
  }

  if (holiday) {
    if (holiday.isHalfDay) {
      return { kind: "halfHoliday" as const, value: 0.5 };
    }
    return { kind: "holiday" as const, value: 1 };
  }

  if (isWeekend(date)) {
    return { kind: "weekend" as const, value: 1 };
  }

  return { kind: "workday" as const, value: 0 };
}

function getBestRestBlock(
  year: number,
  holidays: Holiday[],
  leaveDates: string[]
): RestBlock {
  const holidayMap = buildHolidayMap(holidays);
  const leaveSet = new Set(leaveDates);

  const days = eachDayOfInterval({
    start: startOfYear(new Date(year, 0, 1)),
    end: endOfYear(new Date(year, 0, 1)),
  });

  let best: RestBlock = {
    startDate: "",
    endDate: "",
    totalRestDays: 0,
    dates: [],
  };

  let currentDates: string[] = [];
  let currentValue = 0;

  for (const day of days) {
    const info = getDayValue(day, holidayMap, leaveSet);
    const iso = toIso(day);

    if (info.value > 0) {
      currentDates.push(iso);
      currentValue += info.value;
    } else {
      if (currentValue > best.totalRestDays && currentDates.length > 0) {
        best = {
          startDate: currentDates[0],
          endDate: currentDates[currentDates.length - 1],
          totalRestDays: currentValue,
          dates: [...currentDates],
        };
      }

      currentDates = [];
      currentValue = 0;
    }
  }

  if (currentValue > best.totalRestDays && currentDates.length > 0) {
    best = {
      startDate: currentDates[0],
      endDate: currentDates[currentDates.length - 1],
      totalRestDays: currentValue,
      dates: [...currentDates],
    };
  }

  return best;
}

function isWorkday(date: Date, holidays: Holiday[]) {
  const holidayMap = buildHolidayMap(holidays);
  const info = getDayValue(date, holidayMap, new Set());
  return info.kind === "workday";
}

export function getCandidateLeaveDays(year: number, holidays: Holiday[]) {
  const holidayDates = holidays
    .map((h) => toDate(h.date))
    .sort((a, b) => compareAsc(a, b));

  const candidateSet = new Set<string>();

  for (const holidayDate of holidayDates) {
    for (let i = -4; i <= 4; i++) {
      const current = addDays(holidayDate, i);
      if (current.getFullYear() !== year) continue;

      if (isWorkday(current, holidays)) {
        candidateSet.add(toIso(current));
      }
    }
  }

  return Array.from(candidateSet).sort();
}

function combinations<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];

  function helper(start: number, combo: T[]) {
    if (combo.length === size) {
      result.push([...combo]);
      return;
    }

    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      helper(i + 1, combo);
      combo.pop();
    }
  }

  helper(0, []);
  return result;
}

function buildExplanation(leaveDates: string[], block: RestBlock) {
  const leaveText = leaveDates
    .map((d) => format(toDate(d), "d MMMM EEEE", { locale: tr }))
    .join(", ");

  return `${leaveText} tarihinde izin alırsan ${format(
    toDate(block.startDate),
    "d MMMM",
    { locale: tr }
  )} - ${format(toDate(block.endDate), "d MMMM", { locale: tr })} arasında toplam ${
    block.totalRestDays
  } gün kesintisiz dinlenme elde edebilirsin.`;
}

export function generateSuggestions(
  input: PlannerInput,
  holidays: Holiday[]
): Suggestion[] {
  const legalAllowance = getAnnualLeaveAllowance(input.serviceYears);
  const usableLeaveDays = Math.min(
    input.remainingLeaveDays,
    input.maxLeaveDaysToUse,
    legalAllowance
  );

  if (usableLeaveDays <= 0) return [];

  const candidates = getCandidateLeaveDays(input.year, holidays);

  const allSuggestions: Suggestion[] = [];
  const effectiveMaxLeaveDays = Math.min(usableLeaveDays, 4);

  for (let leaveCount = 1; leaveCount <= effectiveMaxLeaveDays; leaveCount++) {
    const combos = combinations(candidates, leaveCount);

    for (const leaveDates of combos) {
      const bestBlock = getBestRestBlock(input.year, holidays, leaveDates);

      if (bestBlock.totalRestDays <= leaveCount) continue;

      const score =
        bestBlock.totalRestDays / leaveCount + bestBlock.dates.length * 0.01;

      allSuggestions.push({
        leaveDates,
        totalLeaveDays: leaveCount,
        bestBlock,
        score,
        explanation: buildExplanation(leaveDates, bestBlock),
      });
    }
  }

  const uniqueMap = new Map<string, Suggestion>();

  for (const item of allSuggestions.sort((a, b) => b.score - a.score)) {
    const key = item.leaveDates.join("|");
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item);
    }
  }

  return Array.from(uniqueMap.values())
    .sort((a, b) => {
      if (b.bestBlock.totalRestDays !== a.bestBlock.totalRestDays) {
        return b.bestBlock.totalRestDays - a.bestBlock.totalRestDays;
      }
      return a.totalLeaveDays - b.totalLeaveDays;
    })
    .slice(0, 12);
}

export function calculateSelectedPlan(
  year: number,
  holidays: Holiday[],
  leaveDates: string[]
) {
  return getBestRestBlock(year, holidays, leaveDates);
}