"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  CalendarDays,
  Sparkles,
  PlaneTakeoff,
  Filter,
  BadgeInfo,
  MousePointerClick,
} from "lucide-react";
import { holidays2026 } from "@/data/holidays-2026";
import {
  calculateSelectedPlan,
  generateSuggestions,
  getAnnualLeaveAllowance,
  getCandidateLeaveDays,
} from "@/lib/planner";
import { daysUntil, formatDateTR, formatShortTR } from "@/lib/date";
import { PlannerInput } from "@/types/holiday";

const YearMiniCalendar = dynamic(
  () => import("@/components/planner/YearMiniCalendar"),
  {
    ssr: false,
    loading: () => (
      <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
    ),
  }
);

const STORAGE_KEY = "memur-tatil-planlayici-state";

const defaultInput: PlannerInput = {
  year: 2026,
  serviceYears: 5,
  remainingLeaveDays: 14,
  maxLeaveDaysToUse: 3,
};

const demoScenarios: Array<{
  id: string;
  title: string;
  description: string;
  input: PlannerInput;
}> = [
  {
    id: "demo-1",
    title: "Yeni memur",
    description: "5 yıl hizmet, 14 gün kalan izin, en fazla 2 gün izin kullanacak",
    input: {
      year: 2026,
      serviceYears: 5,
      remainingLeaveDays: 14,
      maxLeaveDaysToUse: 2,
    },
  },
  {
    id: "demo-2",
    title: "Orta seviye plan",
    description: "8 yıl hizmet, 10 gün kalan izin, en fazla 3 gün izin kullanacak",
    input: {
      year: 2026,
      serviceYears: 8,
      remainingLeaveDays: 10,
      maxLeaveDaysToUse: 3,
    },
  },
  {
    id: "demo-3",
    title: "Uzun tatil arayan",
    description: "12 yıl hizmet, 20 gün kalan izin, en fazla 4 gün izin kullanacak",
    input: {
      year: 2026,
      serviceYears: 12,
      remainingLeaveDays: 20,
      maxLeaveDaysToUse: 4,
    },
  },
];

type HolidayFilter = "all" | "milli" | "dini" | "half";

function getTypeLabel(type: "milli" | "dini") {
  return type === "milli" ? "Millî" : "Dinî";
}

function getCountdownText(date: string) {
  const diff = daysUntil(date);

  if (diff > 0) return `${diff} gün kaldı`;
  if (diff === 0) return "Bugün";
  return `${Math.abs(diff)} gün önce geçti`;
}

function getScoreLabel(totalRestDays: number, totalLeaveDays: number) {
  const ratio = totalRestDays / totalLeaveDays;

  if (ratio >= 4) return "Çok avantajlı";
  if (ratio >= 2.5) return "Avantajlı";
  return "Orta";
}

function isValidHolidayFilter(value: unknown): value is HolidayFilter {
  return value === "all" || value === "milli" || value === "dini" || value === "half";
}

function normalizeInput(input?: Partial<PlannerInput>): PlannerInput {
  return {
    year: 2026,
    serviceYears: Number(input?.serviceYears) || defaultInput.serviceYears,
    remainingLeaveDays:
      Number(input?.remainingLeaveDays) || defaultInput.remainingLeaveDays,
    maxLeaveDaysToUse:
      Number(input?.maxLeaveDaysToUse) || defaultInput.maxLeaveDaysToUse,
  };
}

export default function Home() {
  const [draftInput, setDraftInput] = useState<PlannerInput>(defaultInput);
  const [appliedInput, setAppliedInput] = useState<PlannerInput>(defaultInput);
  const [selectedLeaveDates, setSelectedLeaveDates] = useState<string[]>([]);
  const [holidayFilter, setHolidayFilter] = useState<HolidayFilter>("all");
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);

  const sortedHolidays = useMemo(() => {
    return [...holidays2026].sort((a, b) => a.date.localeCompare(b.date));
  }, []);

  const filteredHolidays = useMemo(() => {
    if (holidayFilter === "all") return sortedHolidays;
    if (holidayFilter === "half") {
      return sortedHolidays.filter((holiday) => holiday.isHalfDay);
    }
    return sortedHolidays.filter((holiday) => holiday.type === holidayFilter);
  }, [holidayFilter, sortedHolidays]);

  const suggestions = useMemo(() => {
    return generateSuggestions(appliedInput, holidays2026);
  }, [appliedInput]);

  const selectedPlan = useMemo(() => {
    if (selectedLeaveDates.length === 0) return null;
    return calculateSelectedPlan(appliedInput.year, holidays2026, selectedLeaveDates);
  }, [appliedInput.year, selectedLeaveDates]);

  const allowedManualLeaveCount = useMemo(() => {
    return Math.min(
      appliedInput.remainingLeaveDays,
      appliedInput.maxLeaveDaysToUse,
      getAnnualLeaveAllowance(appliedInput.serviceYears)
    );
  }, [appliedInput]);

  const candidateLeaveDays = useMemo(() => {
    return getCandidateLeaveDays(appliedInput.year, holidays2026);
  }, [appliedInput.year]);

  const hasPendingChanges = useMemo(() => {
    return JSON.stringify(draftInput) !== JSON.stringify(appliedInput);
  }, [draftInput, appliedInput]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        setHasLoadedStorage(true);
        return;
      }

      const parsed = JSON.parse(raw);

      const storedDraft = normalizeInput(parsed?.draftInput ?? parsed?.input);
      const storedApplied = normalizeInput(parsed?.appliedInput ?? parsed?.input);

      setDraftInput(storedDraft);
      setAppliedInput(storedApplied);

      if (Array.isArray(parsed?.selectedLeaveDates)) {
        setSelectedLeaveDates(
          parsed.selectedLeaveDates.filter((item: unknown) => typeof item === "string")
        );
      }

      if (isValidHolidayFilter(parsed?.holidayFilter)) {
        setHolidayFilter(parsed.holidayFilter);
      }
    } catch (error) {
      console.error("Kayıtlı durum okunamadı:", error);
    } finally {
      setHasLoadedStorage(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage) return;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        draftInput,
        appliedInput,
        selectedLeaveDates,
        holidayFilter,
      })
    );
  }, [
    draftInput,
    appliedInput,
    selectedLeaveDates,
    holidayFilter,
    hasLoadedStorage,
  ]);

  function handleNumberChange(
    key: keyof PlannerInput,
    value: string,
    min = 0,
    max = 99
  ) {
    const numericValue = Number(value);

    setDraftInput((prev) => ({
      ...prev,
      [key]: Number.isNaN(numericValue)
        ? min
        : Math.max(min, Math.min(max, numericValue)),
    }));
  }

  function applyCalculation() {
    const nextApplied = normalizeInput(draftInput);

    setAppliedInput(nextApplied);

    const nextAllowed = Math.min(
      nextApplied.remainingLeaveDays,
      nextApplied.maxLeaveDaysToUse,
      getAnnualLeaveAllowance(nextApplied.serviceYears)
    );

    setSelectedLeaveDates((prev) => prev.slice(0, nextAllowed));
  }

  function applyDemoScenario(demoInput: PlannerInput) {
    setDraftInput(demoInput);
    setAppliedInput(demoInput);
    setSelectedLeaveDates([]);
  }

  function toggleManualLeaveDate(date: string) {
    setSelectedLeaveDates((prev) => {
      const exists = prev.includes(date);

      if (exists) {
        return prev.filter((item) => item !== date);
      }

      if (prev.length >= allowedManualLeaveCount) {
        return prev;
      }

      return [...prev, date].sort();
    });
  }

  function clearManualSelection() {
    setSelectedLeaveDates([]);
  }

  function clearSavedState() {
    localStorage.removeItem(STORAGE_KEY);
    setDraftInput(defaultInput);
    setAppliedInput(defaultInput);
    setSelectedLeaveDates([]);
    setHolidayFilter("all");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-6 py-10 text-white shadow-xl sm:px-10">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-sm">
              Memur Tatil Planlayıcı MVP
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
              Resmî tatilleri gör, yıllık izinle en avantajlı planı seç
            </h1>
            <p className="mt-4 text-base text-slate-200 sm:text-lg">
              Türkiye'deki 2026 resmî tatillerini incele, hangi tatile kaç gün
              kaldığını gör ve yıllık izinle toplam dinlenme süreni artır.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-4">
                <CalendarDays className="mb-3 h-6 w-6" />
                <p className="text-sm text-slate-300">Toplam tatil kaydı</p>
                <p className="text-2xl font-semibold">{holidays2026.length}</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <Sparkles className="mb-3 h-6 w-6" />
                <p className="text-sm text-slate-300">Akıllı öneri sayısı</p>
                <p className="text-2xl font-semibold">{suggestions.length}</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <PlaneTakeoff className="mb-3 h-6 w-6" />
                <p className="text-sm text-slate-300">Seçili plan</p>
                <p className="text-2xl font-semibold">
                  {selectedPlan ? `${selectedPlan.totalRestDays} gün` : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-2">
            <BadgeInfo className="h-5 w-5 text-slate-700" />
            <h2 className="text-lg font-semibold">Demo senaryoları</h2>
          </div>

          <p className="mt-2 text-sm text-slate-600">
            Tek tıkla farklı kullanıcı profillerini deneyebilirsin.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {demoScenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => applyDemoScenario(scenario.input)}
                className="rounded-2xl border border-slate-200 p-5 text-left transition hover:border-slate-400 hover:bg-slate-50"
              >
                <p className="text-base font-semibold">{scenario.title}</p>
                <p className="mt-2 text-sm text-slate-600">
                  {scenario.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-12 sm:px-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:px-8">
        <aside className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-semibold">Hesaplama Ayarları</h2>
          <p className="mt-2 text-sm text-slate-600">
            Hesaplama artık sadece butona basınca çalışır.
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">Yıl</label>
              <input
                type="number"
                value={draftInput.year}
                onChange={(e) =>
                  handleNumberChange("year", e.target.value, 2026, 2026)
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Hizmet yılı
              </label>
              <input
                type="number"
                value={draftInput.serviceYears}
                onChange={(e) =>
                  handleNumberChange("serviceYears", e.target.value, 1, 40)
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Kalan yıllık izin günü
              </label>
              <input
                type="number"
                value={draftInput.remainingLeaveDays}
                onChange={(e) =>
                  handleNumberChange("remainingLeaveDays", e.target.value, 0, 30)
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                En fazla kaç gün izin kullanacaksın?
              </label>
              <input
                type="number"
                value={draftInput.maxLeaveDaysToUse}
                onChange={(e) =>
                  handleNumberChange("maxLeaveDaysToUse", e.target.value, 1, 4)
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={applyCalculation}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800"
            >
              Hesapla
            </button>

            {hasPendingChanges && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Formda uygulanmamış değişiklikler var.
              </div>
            )}
          </div>

          <div className="mt-8 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
            <p className="font-semibold">Uygulanan ayarlar</p>
            <p className="mt-2">Hizmet yılı: {appliedInput.serviceYears}</p>
            <p className="mt-1">Kalan izin: {appliedInput.remainingLeaveDays}</p>
            <p className="mt-1">
              Maksimum kullanılacak izin: {appliedInput.maxLeaveDaysToUse}
            </p>
            <p className="mt-2">
              Bu ayarlarla elle seçebileceğin en fazla izin günü:{" "}
              {allowedManualLeaveCount}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Seçimlerin tarayıcıda otomatik kaydedilir.
            </p>
          </div>
        </aside>

        <div className="space-y-8">
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">En avantajlı öneriler</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Aşağıdaki kartlardan birini seçince toplam kesintisiz dinlenme
                  süresi hesaplanır.
                </p>
              </div>
            </div>

            {suggestions.length === 0 ? (
              <div className="rounded-2xl bg-slate-100 p-5 text-sm text-slate-600">
                Bu ayarlarla öneri bulunamadı.
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {suggestions.map((suggestion, index) => (
                  <article
                    key={`${suggestion.leaveDates.join("-")}-${index}`}
                    className="rounded-2xl border border-slate-200 p-5 transition hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
                        {suggestion.totalLeaveDays} gün izin
                      </span>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                        {suggestion.bestBlock.totalRestDays} gün dinlenme
                      </span>
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                        {getScoreLabel(
                          suggestion.bestBlock.totalRestDays,
                          suggestion.totalLeaveDays
                        )}
                      </span>
                    </div>

                    <h3 className="mt-4 text-lg font-semibold">
                      {suggestion.leaveDates.map(formatShortTR).join(" + ")}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {suggestion.explanation}
                    </p>

                    <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                      <p>
                        <span className="font-semibold">Kesintisiz blok:</span>{" "}
                        {formatShortTR(suggestion.bestBlock.startDate)} -{" "}
                        {formatShortTR(suggestion.bestBlock.endDate)}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedLeaveDates(suggestion.leaveDates)}
                      className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800"
                    >
                      Bu planı seç
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-2">
              <MousePointerClick className="h-5 w-5 text-slate-700" />
              <h2 className="text-xl font-semibold">Manuel izin seçimi</h2>
            </div>

            <p className="mt-2 text-sm text-slate-600">
              Önerilere bağlı kalmadan uygun aday günlerden kendi izin planını seç.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
                Seçilen izin günü: {selectedLeaveDates.length} / {allowedManualLeaveCount}
              </span>

              <button
                onClick={clearManualSelection}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Seçimi temizle
              </button>

              <button
                onClick={clearSavedState}
                className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                Kayıtlı durumu sıfırla
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {candidateLeaveDays.map((date) => {
                const active = selectedLeaveDates.includes(date);
                const disabled =
                  !active && selectedLeaveDates.length >= allowedManualLeaveCount;

                return (
                  <button
                    key={date}
                    onClick={() => toggleManualLeaveDate(date)}
                    disabled={disabled}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-blue-600 text-white"
                        : disabled
                        ? "cursor-not-allowed bg-slate-100 text-slate-400"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {formatShortTR(date)}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-semibold">Seçili tatil kombinasyonu</h2>

            {!selectedPlan ? (
              <div className="mt-4 rounded-2xl bg-slate-100 p-5 text-sm text-slate-600">
                Henüz plan seçmedin. Yukarıdan bir öneri kartı seç veya manuel
                izin günü belirle.
              </div>
            ) : (
              <>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-slate-900 p-5 text-white">
                    <p className="text-sm text-slate-300">Toplam dinlenme</p>
                    <p className="mt-2 text-3xl font-bold">
                      {selectedPlan.totalRestDays} gün
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-100 p-5">
                    <p className="text-sm text-slate-500">Başlangıç</p>
                    <p className="mt-2 text-lg font-semibold">
                      {formatDateTR(selectedPlan.startDate)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-100 p-5">
                    <p className="text-sm text-slate-500">Bitiş</p>
                    <p className="mt-2 text-lg font-semibold">
                      {formatDateTR(selectedPlan.endDate)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-800">
                    Seçilen izin günleri
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedLeaveDates.map((date) => (
                      <span
                        key={date}
                        className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
                      >
                        {formatDateTR(date)}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Plan takvimi</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Seçilen planı yıl boyunca renkli olarak inceleyebilirsin.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <YearMiniCalendar
                year={appliedInput.year}
                holidays={holidays2026}
                selectedLeaveDates={selectedLeaveDates}
                selectedPlanDates={selectedPlan?.dates ?? []}
                candidateLeaveDates={candidateLeaveDays}
                onDayClick={toggleManualLeaveDate}
                manualSelectionLimitReached={
                  selectedLeaveDates.length >= allowedManualLeaveCount
                }
              />
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">2026 resmî tatiller</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Tatilleri türe göre filtreleyebilirsin.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700">
                  <Filter className="h-4 w-4" />
                  Filtre
                </div>

                {[
                  { key: "all", label: "Hepsi" },
                  { key: "milli", label: "Millî" },
                  { key: "dini", label: "Dinî" },
                  { key: "half", label: "Yarım gün" },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setHolidayFilter(item.key as HolidayFilter)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      holidayFilter === item.key
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredHolidays.map((holiday) => (
                <article
                  key={holiday.id}
                  className="rounded-2xl border border-slate-200 p-5 transition hover:shadow-md"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {getTypeLabel(holiday.type)}
                    </span>
                    {holiday.isHalfDay && (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                        Yarım gün
                      </span>
                    )}
                  </div>

                  <h3 className="mt-4 text-lg font-semibold">{holiday.name}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {formatDateTR(holiday.date)}
                  </p>
                  <p className="mt-3 text-sm font-medium text-slate-900">
                    {getCountdownText(holiday.date)}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
