import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Wifi, MapPin } from "lucide-react";

const DAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS_PT  = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

const MODALITY = {
  Online:     { bg: "bg-blue-100 dark:bg-blue-900/40",       text: "text-blue-700 dark:text-blue-300",       dot: "bg-blue-500",    Icon: Wifi   },
  Presencial: { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500", Icon: MapPin },
};

const STATUS_FADE = { Cancelado: "opacity-40 line-through", Aguardando: "opacity-75" };

function toYMD(date) {
  return date.toISOString().split("T")[0];
}

function startOfWeek(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

/* ─── Tooltip ────────────────────────────────────────────────────── */
function DayTooltip({ appts }) {
  if (!appts.length) return null;
  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 pointer-events-none
                    w-max max-w-[210px] rounded-xl border border-slate-200 dark:border-slate-600
                    bg-white dark:bg-slate-800 shadow-xl p-2.5 space-y-1.5
                    opacity-0 group-hover:opacity-100 transition-opacity duration-150">
      {/* Arrow pointing up */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0
                      border-l-[6px] border-l-transparent
                      border-r-[6px] border-r-transparent
                      border-b-[6px] border-b-white dark:border-b-slate-800" />
      {appts.map((a) => {
        const mod  = MODALITY[a.care_modality] ?? MODALITY.Presencial;
        const fade = STATUS_FADE[a.status] ?? "";
        const time = a.time?.slice(0, 5) ?? "";
        return (
          <div key={a.id} className={`flex items-center gap-1.5 ${fade}`}>
            <span className={`shrink-0 w-2 h-2 rounded-full ${mod.dot}`} />
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
              {time} · {a.patient_name ?? "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Chip (week view) ───────────────────────────────────────────── */
function AppointmentChip({ appt }) {
  const mod  = MODALITY[appt.care_modality] ?? MODALITY.Presencial;
  const { Icon } = mod;
  const fade = STATUS_FADE[appt.status] ?? "";
  const time = appt.time?.slice(0, 5) ?? "";

  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${mod.bg} ${mod.text} ${fade}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold truncate">{time} · {appt.patient_name ?? "—"}</p>
        <p className="text-xs opacity-75 truncate">{appt.care_modality ?? "Presencial"} · {appt.status}</p>
      </div>
    </div>
  );
}

/* ─── Month view ─────────────────────────────────────────────────── */
function MonthView({ current, appointments }) {
  const year  = current.getFullYear();
  const month = current.getMonth();
  const today = toYMD(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const cells = useMemo(() => {
    const firstDay   = new Date(year, month, 1).getDay();
    const daysInMon  = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    const arr = [];

    for (let i = firstDay - 1; i >= 0; i--)
      arr.push({ date: new Date(year, month - 1, daysInPrev - i), outside: true });
    for (let d = 1; d <= daysInMon; d++)
      arr.push({ date: new Date(year, month, d), outside: false });

    const rem = arr.length % 7;
    if (rem !== 0)
      for (let d = 1; d <= 7 - rem; d++)
        arr.push({ date: new Date(year, month + 1, d), outside: true });

    return arr;
  }, [year, month]);

  const byDate = useMemo(() => {
    const map = {};
    appointments.forEach((a) => {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    });
    return map;
  }, [appointments]);

  const selectedAppts = selectedDay ? (byDate[selectedDay] ?? []) : [];

  return (
    <div>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_SHORT.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-slate-400 dark:text-slate-500 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 border-l border-t border-slate-200 dark:border-slate-700">
        {cells.map(({ date, outside }, idx) => {
          const ymd      = toYMD(date);
          const isToday  = ymd === today;
          const isSelected = ymd === selectedDay;
          const appts    = byDate[ymd] ?? [];
          const hasAppts = appts.length > 0;

          return (
            <div
              key={idx}
              onClick={() => !outside && setSelectedDay(isSelected ? null : ymd)}
              className={`relative group border-r border-b border-slate-200 dark:border-slate-700 p-1
                ${outside ? "bg-slate-50/50 dark:bg-slate-800/30" : "bg-white dark:bg-slate-800"}
                ${!outside ? "cursor-pointer" : ""}
                ${isSelected ? "ring-2 ring-inset ring-emerald-400 dark:ring-emerald-600" : ""}`}
            >
              {/* Tooltip on hover — desktop only */}
              {hasAppts && <div className="hidden sm:block"><DayTooltip appts={appts} /></div>}

              <p className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full
                ${isToday
                  ? "bg-emerald-600 text-white"
                  : outside
                  ? "text-slate-300 dark:text-slate-600"
                  : "text-slate-500 dark:text-slate-400"
                }`}>
                {date.getDate()}
              </p>

              {/* Desktop: chips with text */}
              <div className="hidden sm:block space-y-0.5">
                {appts.slice(0, 3).map((a) => {
                  const mod  = MODALITY[a.care_modality] ?? MODALITY.Presencial;
                  const fade = STATUS_FADE[a.status] ?? "";
                  const time = a.time?.slice(0, 5) ?? "";
                  return (
                    <div key={a.id} className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-tight truncate ${mod.bg} ${mod.text} ${fade}`}>
                      <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${mod.dot}`} />
                      <span className="truncate">{time} {a.patient_name?.split(" ")[0]}</span>
                    </div>
                  );
                })}
                {appts.length > 3 && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 pl-1">+{appts.length - 3} mais</p>
                )}
              </div>

              {/* Mobile: dots only */}
              {hasAppts && !outside && (
                <div className="flex sm:hidden flex-wrap gap-0.5 mt-0.5">
                  {appts.slice(0, 4).map((a) => {
                    const mod = MODALITY[a.care_modality] ?? MODALITY.Presencial;
                    return <span key={a.id} className={`w-1.5 h-1.5 rounded-full ${mod.dot}`} />;
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: selected day detail panel */}
      {selectedDay && (
        <div className="sm:hidden mt-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {new Date(selectedDay + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          {selectedAppts.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">Nenhuma consulta neste dia.</p>
          ) : (
            selectedAppts.sort((a, b) => a.time?.localeCompare(b.time)).map((a) => {
              const mod  = MODALITY[a.care_modality] ?? MODALITY.Presencial;
              const { Icon } = mod;
              const fade = STATUS_FADE[a.status] ?? "";
              return (
                <div key={a.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${mod.bg} ${mod.text} ${fade}`}>
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{a.time?.slice(0, 5)} · {a.patient_name ?? "—"}</p>
                    <p className="text-xs opacity-75 truncate">{a.professional_name ?? ""} · {a.status}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Week view ──────────────────────────────────────────────────── */
function WeekView({ current, appointments }) {
  const today = toYMD(new Date());

  const days = useMemo(() => {
    const start = startOfWeek(current);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [current]);

  const byDate = useMemo(() => {
    const map = {};
    appointments.forEach((a) => {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    });
    return map;
  }, [appointments]);

  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((date) => {
        const ymd     = toYMD(date);
        const isToday = ymd === today;
        const appts   = (byDate[ymd] ?? []).sort((a, b) => a.time?.localeCompare(b.time));

        return (
          <div key={ymd} className={`relative group rounded-xl border p-2 min-h-[120px] flex flex-col gap-1
            ${isToday
              ? "border-emerald-400 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/10"
              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            }`}>
            {/* Tooltip */}
            {appts.length > 0 && <DayTooltip appts={appts} />}

            <div className="flex flex-col items-center mb-1">
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
                {DAYS_SHORT[date.getDay()]}
              </p>
              <p className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full
                ${isToday ? "bg-emerald-600 text-white" : "text-slate-700 dark:text-slate-300"}`}>
                {date.getDate()}
              </p>
            </div>

            {appts.length === 0 ? (
              <p className="text-[10px] text-slate-300 dark:text-slate-600 text-center mt-2">—</p>
            ) : (
              appts.map((a) => <AppointmentChip key={a.id} appt={a} />)
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Legend ─────────────────────────────────────────────────────── */
function Legend() {
  return (
    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
      {Object.entries(MODALITY).map(([label, { dot }]) => (
        <span key={label} className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${dot}`} />
          {label}
        </span>
      ))}
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────── */
export default function AppointmentCalendar({ appointments = [] }) {
  const [view, setView]       = useState("month");
  const [current, setCurrent] = useState(new Date());

  const title = useMemo(() => {
    if (view === "month")
      return `${MONTHS_PT[current.getMonth()]} ${current.getFullYear()}`;
    const start = startOfWeek(current);
    const end   = new Date(start);
    end.setDate(end.getDate() + 6);
    const fmt = (d) => `${d.getDate()} ${MONTHS_PT[d.getMonth()].slice(0, 3)}`;
    return `${fmt(start)} – ${fmt(end)} ${end.getFullYear()}`;
  }, [view, current]);

  const navigate = (dir) => {
    setCurrent((prev) => {
      const d = new Date(prev);
      if (view === "month") d.setMonth(d.getMonth() + dir);
      else d.setDate(d.getDate() + dir * 7);
      return d;
    });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800
                       flex items-center justify-center text-slate-500 dark:text-slate-400
                       hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(1)}
            className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800
                       flex items-center justify-center text-slate-500 dark:text-slate-400
                       hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 min-w-[180px]">
            {title}
          </span>
          <button
            onClick={() => setCurrent(new Date())}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700
                       bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300
                       hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
          >
            Hoje
          </button>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-700/60 rounded-lg">
          {["month", "week"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                view === v
                  ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              {v === "month" ? "Mês" : "Semana"}
            </button>
          ))}
        </div>
      </div>

      <Legend />

      {view === "month"
        ? <MonthView current={current} appointments={appointments} />
        : <WeekView current={current} appointments={appointments} />
      }
    </div>
  );
}
