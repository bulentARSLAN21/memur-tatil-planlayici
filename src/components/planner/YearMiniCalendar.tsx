"use client";

import { useMemo } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getISODay,
  startOfMonth,
} from "date-fns";
import { tr } from "date-fns/locale";
import { Holiday } from "@/types/holiday";
import { buildHolidayMap, isWeekend, toIso } from "@/lib/date";

type YearMiniCalendarProps = {
  year: number;
  holidays: Holiday[];
  selectedLeaveDates: string[];
  selectedPlanDates: string[];
  candidateLeaveDates?: string[];
  onDayClick?: (date: string) => void;
  manualSelectionLimitReached?: boolean;
};

const weekDays = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pa"];

export default function YearMiniCalendar({
  year,
  holidays,
  selectedLeaveDates,
  selectedPlanDates,
  candidateLeaveDates = [],
  onDayClick,
  manualSelectionLimitReached = false,
}: YearMiniCalendarProps) {
  const holidayMap = useMemo(() => buildHolidayMap(holidays), [holidays]);
  const leaveSet = useMemo(() => new Set(selectedLeaveDates), [selectedLeaveDates]);
  const planSet = useMemo(() => new Set(selectedPlanDates), [selectedPlanDates]);
  const candidateSet = useMemo(
    () => new Set(candidateLeaveDates),
    [candidateLeaveDates]
  );

  const months = Array.from({ length: 12 }, (_, monthIndex) => {
    const monthStart = startOfMonth(new Date(year, monthIndex, 1));
    const monthEnd = endOfMonth(monthStart);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const leadingEmptyCells = getISODay(monthStart) - 1;

    return {
      key: monthIndex,
      label: format(monthStart, "MMMM", { locale: tr }),
      days,
      leadingEmptyCells,
    };
  });

  function getDayClasses(date: Date) {
    const iso = toIso(date);
    const holiday = holidayMap.get(iso);
    const isLeave = leaveSet.has(iso);
    const isInPlan = planSet.has(iso);
    const weekend = isWeekend(date);
    const isCandidate = candidateSet.has(iso);
    const isDisabledCandidate =
      isCandidate && !isLeave && manualSelectionLimitReached;

    let classes =
      "relative flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-medium transition";

    if (isLeave) {
      classes += " border-blue-600 bg-blue-600 text-white";
    } else if (holiday && holiday.isHalfDay) {
      classes += " border-amber-200 bg-amber-100 text-amber-800";
    } else if (holiday) {
      classes += " border-rose-200 bg-rose-100 text-rose-800";
    } else if (weekend) {
      classes += " border-slate-200 bg-slate-100 text-slate-500";
    } else if (isCandidate) {
      classes += " border-sky-300 bg-sky-50 text-sky-700";
    } else {
      classes += " border-slate-200 bg-white text-slate-700";
    }

    if (isInPlan) {
      classes += " ring-2 ring-emerald-500 ring-offset-1";
    }

    if (isCandidate && onDayClick && !isDisabledCandidate) {
      classes += " cursor-pointer hover:scale-105 hover:shadow-sm";
    }

    if (isDisabledCandidate) {
      classes += " cursor-not-allowed opacity-45";
    }

    return classes;
  }

  function getTitle(date: Date) {
    const iso = toIso(date);
    const holiday = holidayMap.get(iso);
    const labels: string[] = [format(date, "d MMMM yyyy, EEEE", { locale: tr })];

    if (leaveSet.has(iso)) labels.push("Yıllık izin");
    if (candidateSet.has(iso)) labels.push("Manuel seçim için uygun gün");
    if (holiday?.isHalfDay) labels.push(`Yarım gün tatil: ${holiday.name}`);
    else if (holiday) labels.push(`Resmî tatil: ${holiday.name}`);
    else if (isWeekend(date)) labels.push("Hafta sonu");
    if (planSet.has(iso)) labels.push("Seçili tatil bloğu içinde");

    return labels.join(" • ");
  }

  function handleClick(iso: string) {
    if (!onDayClick) return;

    const isCandidate = candidateSet.has(iso);
    const isLeave = leaveSet.has(iso);
    const isDisabledCandidate =
      isCandidate && !isLeave && manualSelectionLimitReached;

    if (!isCandidate || isDisabledCandidate) return;
    onDayClick(iso);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-700">
          İzin günü
        </span>
        <span className="rounded-full bg-rose-100 px-3 py-1 font-medium text-rose-700">
          Resmî tatil
        </span>
        <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700">
          Yarım gün
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
          Hafta sonu
        </span>
        <span className="rounded-full bg-sky-100 px-3 py-1 font-medium text-sky-700">
          Seçilebilir gün
        </span>
        <span className="rounded-full border border-emerald-500 bg-white px-3 py-1 font-medium text-emerald-700">
          Seçili blok
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {months.map((month) => (
          <div
            key={month.key}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <h3 className="mb-3 text-base font-semibold capitalize text-slate-900">
              {month.label}
            </h3>

            <div className="mb-2 grid grid-cols-7 gap-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="flex h-8 items-center justify-center text-xs font-semibold text-slate-500"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: month.leadingEmptyCells }).map((_, index) => (
                <div key={`empty-${month.key}-${index}`} className="h-9 w-9" />
              ))}

              {month.days.map((date) => {
                const iso = toIso(date);

                return (
                  <button
                    key={iso}
                    type="button"
                    title={getTitle(date)}
                    onClick={() => handleClick(iso)}
                    className={getDayClasses(date)}
                  >
                    {format(date, "d")}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
