import React, { useState } from 'react';
import { Booking, DaySlotInfo, DemandForecastPoint, AICapacitySuggestion, SlotWindowId } from '../types';

interface AdminPortalViewProps {
  days: DaySlotInfo[];
  bookings: Booking[];
  forecast: DemandForecastPoint[];
  suggestions: AICapacitySuggestion[];
  onApproveSuggestion: (sugId: string) => void;
  onDismissSuggestion: (sugId: string) => void;
  onUpdateSlotCapacity: (dateKey: string, windowId: SlotWindowId, newCap: number, active: boolean) => void;
  onMarkDelivered: (bookingId: string) => void;
  onCancelBooking: (bookingId: string) => void;
  onAddBlockedDay: (date: string, reason: string) => void;
  onRemoveBlockedDay: (date: string) => void;
  blockedDays: Array<{ date: string; title: string; badge: string; reason: string }>;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  days,
  bookings,
  forecast,
  suggestions,
  onApproveSuggestion,
  onDismissSuggestion,
  onUpdateSlotCapacity,
  onMarkDelivered,
  onCancelBooking,
  onAddBlockedDay,
  onRemoveBlockedDay,
  blockedDays,
}) => {
  const [activeSlotFilter, setActiveSlotFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected date for slot capacity management
  const [selectedConfigDateKey, setSelectedConfigDateKey] = useState<string>('2025-10-24');
  const activeDaySlotConfig = days.find(d => d.dateString === selectedConfigDateKey) || days[1] || days[0];

  // Blocked date form state
  const [newBlockDate, setNewBlockDate] = useState('2025-11-27');
  const [newBlockReason, setNewBlockReason] = useState('Annual Fleet Overhaul');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch =
      !searchQuery ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.address.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeSlotFilter === 'all') return b.status !== 'Cancelled';
    if (activeSlotFilter === 'morning') return b.windowId === 'morning' && b.status !== 'Cancelled';
    if (activeSlotFilter === 'afternoon') return b.windowId === 'afternoon' && b.status !== 'Cancelled';
    if (activeSlotFilter === 'evening') return b.windowId === 'evening' && b.status !== 'Cancelled';
    if (activeSlotFilter === 'high_risk') return b.noShowRisk === 'High' && b.status !== 'Cancelled';
    if (activeSlotFilter === 'cancelled') return b.status === 'Cancelled';
    return true;
  });

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-20 space-y-5">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-2xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner: Dispatcher Desk */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
            </span>
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              Live Robotics System Active
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
              Demo Data
            </span>
          </div>

          <h2 className="font-headline text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Autonomous Dispatcher Desk
          </h2>
          <p className="text-xs text-slate-500">
            Logged in as <strong className="text-slate-800">Marcus Vance (Ops Level 2)</strong> • Sector 4 Central Dispatch
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-mono text-xs font-bold border border-slate-200 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-emerald-600">dns</span>
            <span>9 Rovers Synchronized</span>
          </div>
        </div>
      </div>

      {/* Quick Ops Pulse Stat Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Today</span>
            <span className="material-symbols-outlined text-emerald-600 text-[18px]">local_shipping</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-headline text-2xl font-bold text-slate-900">28</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              +14% vs avg
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Fleet Capacity</span>
            <span className="material-symbols-outlined text-blue-600 text-[18px]">pie_chart</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-headline text-2xl font-bold text-slate-900">64%</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Optimal
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Active Windows</span>
            <span className="material-symbols-outlined text-emerald-600 text-[18px]">timelapse</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-headline text-2xl font-bold text-slate-900">3/3</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              All Live
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Blackout Dates</span>
            <span className="material-symbols-outlined text-amber-600 text-[18px]">event_busy</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-headline text-2xl font-bold text-slate-900">{blockedDays.length}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
              Thanksgiving
            </span>
          </div>
        </div>
      </div>

      {/* Operational Broadcast Alert Banner */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3">
        <span className="material-symbols-outlined text-amber-700 text-[20px] mt-0.5">campaign</span>
        <div className="text-xs">
          <h3 className="font-bold text-amber-900">Automated Robotics Broadcast Notice</h3>
          <p className="text-amber-800 mt-0.5 leading-relaxed">
            Adjusting time windows triggers instant automated sync alerts to all active autonomous rovers in transit. All suggested capacity changes strictly require dispatcher approval before applying.
          </p>
        </div>
      </div>

      {/* SECTION 1: CAPACITY SUGGESTIONS WITH ADMIN APPROVAL (Requirement 5) */}
      {pendingSuggestions.length > 0 && (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 text-[22px]">tune</span>
              <div>
                <h3 className="font-headline text-base font-bold text-slate-900">
                  Capacity Optimization Proposals
                </h3>
                <p className="text-xs text-slate-500">
                  Suggested capacity adjustments based on demand modeling. Dispatcher approval required.
                </p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
              {pendingSuggestions.length} Pending Approval
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {pendingSuggestions.map(sug => (
              <div
                key={sug.id}
                className="rounded-2xl p-4 bg-slate-50 border border-slate-200 shadow-xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-headline text-xs sm:text-sm font-bold text-slate-900">
                    {sug.dateLabel} • {sug.windowName}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                    PENDING APPROVAL
                  </span>
                </div>

                {/* Capacity Diff */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                  <div className="flex-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Cap</span>
                    <span className="font-headline text-sm font-bold text-slate-700">
                      {sug.currentCapacity} slots
                    </span>
                  </div>

                  <span className="material-symbols-outlined text-slate-400 text-[18px]">arrow_forward</span>

                  <div className="flex-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                      Proposed Cap
                    </span>
                    <span className="font-headline text-sm font-bold text-emerald-700">
                      {sug.suggestedCapacity} slots ({sug.suggestedCapacity > sug.currentCapacity ? '+' : ''}
                      {sug.suggestedCapacity - sug.currentCapacity})
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Rationale: </strong>
                  {sug.rationale}
                </p>

                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-900 text-[11px]">
                  <strong>Projected Fleet Impact: </strong>
                  {sug.expectedLoadImprovement}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                  <button
                    onClick={() => {
                      onApproveSuggestion(sug.id);
                      showToast(`Approved capacity change for ${sug.dateLabel}! Caps updated to ${sug.suggestedCapacity}.`);
                    }}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    <span>Approve & Apply Live</span>
                  </button>

                  <button
                    onClick={() => {
                      onDismissSuggestion(sug.id);
                      showToast('Capacity proposal dismissed.');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: 7-DAY DEMAND FORECAST (Requirement 3) */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-[22px]">ssid_chart</span>
              <h3 className="font-headline text-base font-bold text-slate-900">
                7-Day Slot Demand Forecast
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Moving average and seasonal demand projections per slot window. Seeded with realistic dispatch telemetry.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-slate-600">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span>
              <span>Predicted Orders</span>
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-slate-400">
              <span className="w-2.5 h-2.5 rounded bg-slate-200 inline-block"></span>
              <span>Capacity Cap</span>
            </span>
          </div>
        </div>

        {/* Forecast Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 pt-1">
          {forecast.map(point => {
            const isSurge = point.surgeAlert;
            const morningUtil = Math.round((point.morningPredicted / point.morningCapacity) * 100);
            const afternoonUtil = Math.round((point.afternoonPredicted / point.afternoonCapacity) * 100);
            const eveningUtil = Math.round((point.eveningPredicted / point.eveningCapacity) * 100);

            return (
              <div
                key={point.date}
                className={`rounded-2xl p-3 border transition-all ${
                  isSurge
                    ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/30'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-headline text-xs font-bold text-slate-900">{point.dayLabel}</span>
                  {isSurge && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[9px] font-bold">
                      SURGE
                    </span>
                  )}
                </div>

                <div className="mt-2.5 space-y-2 text-xs">
                  {/* Morning */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-500">Morning:</span>
                      <span className="font-bold text-slate-800">
                        {point.morningPredicted} / {point.morningCapacity}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          morningUtil >= 100 ? 'bg-red-500' : morningUtil > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, morningUtil)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Afternoon */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-500">Afternoon:</span>
                      <span className="font-bold text-slate-800">
                        {point.afternoonPredicted} / {point.afternoonCapacity}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          afternoonUtil >= 100 ? 'bg-red-500' : afternoonUtil > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, afternoonUtil)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Evening */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-500">Evening:</span>
                      <span className="font-bold text-slate-800">
                        {point.eveningPredicted} / {point.eveningCapacity}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          eveningUtil >= 100 ? 'bg-red-500' : eveningUtil > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, eveningUtil)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] text-slate-500">
                  <span>Weather: {point.weatherFactor}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: SLOT CAPACITIES CONFIGURATION */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-[20px]">tune</span>
              <h3 className="font-headline text-base font-bold text-slate-900">Slot Capacities & Limits</h3>
            </div>
            <p className="text-xs text-slate-500">
              Direct edits reflect live on customer booking widget (Strict rule-based enforcement)
            </p>
          </div>

          {/* Date Selector for Config */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full">
            {days.slice(0, 5).map(d => (
              <button
                key={d.dateString}
                onClick={() => setSelectedConfigDateKey(d.dateString)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedConfigDateKey === d.dateString
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {d.dayName} {d.dayNumber}
              </button>
            ))}
          </div>
        </div>

        {/* 3 Slot Window Cards for Selected Date */}
        <div className="space-y-3">
          {(['morning', 'afternoon', 'evening'] as SlotWindowId[]).map(winId => {
            const slot = activeDaySlotConfig.slots[winId];
            return (
              <div key={winId} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-emerald-700 text-[20px]">
                      {winId === 'morning'
                        ? 'wb_sunny'
                        : winId === 'afternoon'
                        ? 'light_mode'
                        : 'nights_stay'}
                    </span>
                    <span className="font-headline text-sm font-bold text-slate-900">{slot.name}</span>
                  </div>

                  {/* Active toggle */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={slot.active}
                      onChange={e =>
                        onUpdateSlotCapacity(activeDaySlotConfig.dateString, winId, slot.maxCapacity, e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-500 font-semibold block mb-1">Time Span</label>
                    <input
                      type="text"
                      readOnly
                      value={slot.timeSpan}
                      className="w-full bg-white px-3 py-2 rounded-xl text-slate-900 border border-slate-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-500 font-semibold block mb-1">Max Bookings (Caps)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={slot.maxCapacity}
                        onChange={e => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val > 0) {
                            onUpdateSlotCapacity(activeDaySlotConfig.dateString, winId, val, slot.active);
                          }
                        }}
                        className="w-full bg-white px-3 py-2 rounded-xl text-slate-900 border border-slate-200 font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                      <span className="text-slate-400 font-bold text-[11px]">caps</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        slot.bookedCount >= slot.maxCapacity
                          ? 'bg-red-500'
                          : slot.bookedCount / slot.maxCapacity >= 0.7
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    ></span>
                    <span className="text-slate-600">
                      Current Load: <strong className="text-slate-900">{slot.bookedCount}</strong> /{' '}
                      {slot.maxCapacity} slots booked (
                      {Math.round((slot.bookedCount / slot.maxCapacity) * 100)}%)
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      showToast(`Slot capacity updated for ${activeDaySlotConfig.label} (${slot.name})`)
                    }
                    className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all active:scale-95 shadow-xs"
                  >
                    Save Cap
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: BLOCKED CALENDAR DAYS */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-600 text-[22px]">calendar_today</span>
          <div>
            <h3 className="font-headline text-base font-bold text-slate-900">Blocked Calendar Days</h3>
            <p className="text-xs text-slate-500">Blackout specific dates for fleet overhaul or holidays</p>
          </div>
        </div>

        {/* Add Blocked Date Bar */}
        <div className="bg-slate-50 rounded-2xl p-3.5 flex flex-col sm:flex-row gap-2 border border-slate-200">
          <input
            type="date"
            value={newBlockDate}
            onChange={e => setNewBlockDate(e.target.value)}
            className="bg-white px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 border border-slate-200 outline-none"
          />
          <input
            type="text"
            placeholder="Reason (e.g. System Maintenance)"
            value={newBlockReason}
            onChange={e => setNewBlockReason(e.target.value)}
            className="flex-1 bg-white px-3 py-2 rounded-xl text-xs text-slate-800 border border-slate-200 outline-none"
          />
          <button
            onClick={() => {
              if (newBlockDate && newBlockReason) {
                onAddBlockedDay(newBlockDate, newBlockReason);
                showToast(`Blackout scheduled for ${newBlockDate}`);
              }
            }}
            className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95 shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>Block Date</span>
          </button>
        </div>

        {/* Active Blocked List */}
        <div className="space-y-2 pt-1">
          {blockedDays.map(item => (
            <div
              key={item.date}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-amber-100 text-amber-900 flex flex-col items-center justify-center font-bold text-[10px]">
                  <span>{item.date.split('-')[1]}</span>
                  <span className="text-xs font-extrabold">{item.date.split('-')[2]}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{item.title}</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-red-100 text-red-800 text-[10px] font-bold">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{item.reason}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  onRemoveBlockedDay(item.date);
                  showToast(`${item.title} blackout unblocked`);
                }}
                className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                title="Remove Blackout"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 5: LIVE DELIVERIES WITH NO-SHOW RISK MONITORS (Requirement 3) */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-headline text-base font-bold text-slate-900">
              Live Deliveries & No-Show Risk Monitor
            </h3>
            <p className="text-xs text-slate-500">Friday, Oct 24, 2025 • Active Dispatches</p>
          </div>

          <button
            onClick={() => showToast('Generated CSV manifest for fleet dispatch.')}
            className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            <span>Export Manifest</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search booking code (ED-4821) or customer name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'all', label: `All (${bookings.filter(b => b.status !== 'Cancelled').length})` },
            { id: 'morning', label: 'Morning' },
            { id: 'afternoon', label: 'Afternoon' },
            { id: 'evening', label: 'Evening' },
            { id: 'high_risk', label: '⚠️ High No-Show Risk' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSlotFilter(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeSlotFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Cards Feed */}
        <div className="space-y-3">
          {filteredBookings.map(b => (
            <div
              key={b.id}
              className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 transition-all hover:border-slate-300"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900">
                    {b.id}
                  </span>
                  <span className="text-xs text-slate-500">{b.eta} ETA</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-semibold text-slate-700">{b.windowLabel}</span>
                  {b.smsNotification && (
                    <span
                      className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-bold flex items-center gap-0.5"
                      title="SMS Updates Active"
                    >
                      <span className="material-symbols-outlined text-[11px]">sms</span>
                      <span>SMS</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* NO-SHOW RISK FLAG (Requirement 3) */}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                      b.noShowRisk === 'High'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : b.noShowRisk === 'Medium'
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                    title={`No-show probability: ${Math.round(b.noShowProbability * 100)}%`}
                  >
                    <span className="material-symbols-outlined text-[12px]">
                      {b.noShowRisk === 'High' ? 'warning' : 'verified'}
                    </span>
                    <span>
                      {b.noShowRisk} Risk ({Math.round(b.noShowProbability * 100)}%)
                    </span>
                  </span>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      b.status === 'Completed'
                        ? 'bg-emerald-200 text-emerald-900'
                        : b.status === 'Cancelled'
                        ? 'bg-slate-200 text-slate-600'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="font-headline text-sm font-bold text-slate-900">{b.customerName}</span>
                  <span className="text-xs font-mono text-slate-500">{b.phone}</span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-slate-400">home_pin</span>
                  <span>{b.address}</span>
                </p>
                {b.instructions && (
                  <p className="text-[11px] text-slate-500 italic mt-1 pl-5">"{b.instructions}"</p>
                )}
              </div>

              {/* Explainable Risk Factors */}
              {b.riskFactors && b.riskFactors.length > 0 && (
                <div className="bg-white/80 p-2 rounded-xl border border-slate-200/60 text-[11px] text-slate-600 flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-slate-400 mt-0.5">analytics</span>
                  <div>
                    <strong className="text-slate-700">Risk Assessment: </strong>
                    <span>{b.riskFactors.join(' • ')}</span>
                  </div>
                </div>
              )}

              {/* Dispatcher Actions */}
              {b.status !== 'Completed' && b.status !== 'Cancelled' && (
                <div className="pt-2 flex items-center gap-2 border-t border-slate-200/60">
                  <button
                    onClick={() => {
                      onMarkDelivered(b.id);
                      showToast(`Delivery #${b.id} marked as Delivered by Autonomous Rover`);
                    }}
                    className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[15px]">check_circle</span>
                    <span>Delivered</span>
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`Cancel delivery #${b.id}? Slot capacity will be released.`)) {
                        onCancelBooking(b.id);
                        showToast(`Delivery #${b.id} cancelled`);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-red-50 hover:text-red-700 text-slate-600 font-semibold text-xs transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}

          {filteredBookings.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-500">
              No bookings match the active filter criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
