export type HolidayType = "milli" | "dini";

export interface Holiday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  type: HolidayType;
  isHalfDay: boolean;
}

export type DayKind =
  | "workday"
  | "weekend"
  | "holiday"
  | "halfHoliday"
  | "leave";

export interface PlannerInput {
  year: number;
  serviceYears: number;
  remainingLeaveDays: number;
  maxLeaveDaysToUse: number;
}

export interface DayCell {
  date: string;
  kind: DayKind;
  value: number; // tam gün = 1, yarım gün = 0.5
}

export interface RestBlock {
  startDate: string;
  endDate: string;
  totalRestDays: number;
  dates: string[];
}

export interface Suggestion {
  leaveDates: string[];
  totalLeaveDays: number;
  bestBlock: RestBlock;
  score: number;
  explanation: string;
}