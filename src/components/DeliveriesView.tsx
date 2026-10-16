import React, { useState } from 'react';
import { Booking, DaySlotInfo } from '../types';
import { INITIAL_7_DAYS } from '../data/mockData';
import { DeliveryMapView } from './DeliveryMapView';
import { trackOrderOnServer } from '../services/aiService';

interface DeliveriesViewProps {
  bookings: Booking[];
  days?: DaySlotInfo[];
  selectedBookingIdProp?: string;
  onSelectBooking?: (b: Booking) => void;
  onCancelBooking: (id: string) => void;
  onRescheduleBooking: (b: Booking) => void;
}

export const DeliveriesView: React.FC<DeliveriesViewProps> = ({
  bookings,
  days = INITIAL_7_DAYS,
  selectedBookingIdProp,
  onSelectBooking,
  onCancelBooking,
  onRescheduleBooking,
}) => {
  const [selectedBookingId, setSelectedBookingId] = useState<string>(
    selectedBookingIdProp || bookings[0]?.id || 'ED-4821'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [doorstepNote, setDoorstepNote] = useState(
    'Ring smart doorbell twice. If not answering, leave securely behind front porch planter.'
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeBooking = bookings.find(b => b.id === selectedBookingId) || bookings[0];

  const [selectedDateKey, setSelectedDateKey] = useState<string>(
    activeBooking?.dateKey || days[1]?.dateString || '2025-10-24'
  );

  React.useEffect(() => {
    if (selectedBookingIdProp) {
      setSelectedBookingId(selectedBookingIdProp);
      const match = bookings.find(b => b.id.toUpperCase() === selectedBookingIdProp.toUpperCase());
      if (match) {
        setSelectedDateKey(match.dateKey);
      }
    }
  }, [selectedBookingIdProp, bookings]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSelectBooking = (b: Booking) => {
    setSelectedBookingId(b.id);
    setSelectedDateKey(b.dateKey);
    if (onSelectBooking) onSelectBooking(b);
    showToast(`Focused on stop #${b.id} (${b.customerName})`);
  };

  const handleSelectDateKey = (dateKey: string) => {
    setSelectedDateKey(dateKey);
    // Find the first booking on that day to focus on
    const match = bookings.find(b => b.dateKey === dateKey && b.status !== 'Cancelled');
    if (match) {
      setSelectedBookingId(match.id);
    }
  };

  const handleSearchOrder = async (overrideQuery?: string) => {
    const q = (overrideQuery || searchQuery).trim();
    if (!q) return;
    setSearchError(null);
    setIsSearching(true);

    // 1. Check existing in-memory/list bookings
    const localMatch = bookings.find(
      b =>
        b.id.toUpperCase() === q.toUpperCase() ||
        b.id.toUpperCase().includes(q.toUpperCase()) ||
        b.customerName.toLowerCase().includes(q.toLowerCase()) ||
        b.rawPhone.includes(q) ||
        b.phone.includes(q)
    );

    if (localMatch) {
      setSelectedBookingId(localMatch.id);
      setSelectedDateKey(localMatch.dateKey);
      if (onSelectBooking) onSelectBooking(localMatch);
      showToast(`Located order #${localMatch.id}`);
      setIsSearching(false);
      return;
    }

    // 2. Query SQLite database
    try {
      const res = await trackOrderOnServer(q);
      if (res.found && res.booking) {
        setSelectedBookingId(res.booking.id);
        setSelectedDateKey(res.booking.dateKey);
        if (onSelectBooking) onSelectBooking(res.booking);
        showToast(`Located order #${res.booking.id} in live database!`);
      } else {
        setSearchError(res.error || `No active delivery found matching "${q}". Try ED-4821 or ED-4801.`);
      }
    } catch {
      setSearchError('Error querying database. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  if (!activeBooking) {
    return (
      <div className="max-w-4xl mx-auto px-4 pt-28 pb-16 text-center">
        <p className="text-slate-500 text-sm">No active autonomous deliveries found.</p>
      </div>
    );
  }

  // Count scheduled deliveries for currently selected day
  const dayDeliveriesCount = bookings.filter(
    b => b.dateKey === selectedDateKey && b.status !== 'Cancelled'
  ).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-20 space-y-5">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-xl border border-slate-700 flex items-center gap-1.5 animate-bounce">
          <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Order Tracking & Database Search Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm">
              <span className="material-symbols-outlined text-[18px]">travel_explore</span>
            </div>
            <div>
              <h2 className="font-headline text-sm font-bold text-slate-900">Track Any Order</h2>
              <p className="text-[11px] text-slate-500">Live lookup connected to SQLite database</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>SQLite Database Active</span>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                if (searchError) setSearchError(null);
              }}
              onKeyDown={e => e.key === 'Enter' && handleSearchOrder()}
              placeholder="Enter Booking ID (e.g. ED-4821), recipient name, or phone number..."
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchError(null);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          <button
            onClick={() => handleSearchOrder()}
            disabled={!searchQuery.trim() || isSearching}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
          >
            {isSearching ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                <span>Searching...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">radar</span>
                <span>Track Order</span>
              </>
            )}
          </button>
        </div>

        {searchError && (
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-amber-600">info</span>
            <span>{searchError}</span>
          </div>
        )}

        {/* Quick-Track Suggestions from Live Database */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100 text-[11px]">
          <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Quick Track:</span>
          {bookings.slice(0, 5).map(b => (
            <button
              key={b.id}
              onClick={() => {
                setSearchQuery(b.id);
                handleSearchOrder(b.id);
              }}
              className={`px-2 py-0.5 rounded-lg border text-[11px] font-mono transition-all ${
                selectedBookingId === b.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'
              }`}
            >
              #{b.id} <span className="opacity-70 text-[9px]">({b.status})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Top Banner & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-headline text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Track #{activeBooking.id}
            </span>
            <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">
              Autonomous Rover
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Recipient: <strong className="text-slate-800">{activeBooking.customerName}</strong> • {activeBooking.date}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeBooking.coordinates && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 font-mono text-[11px] border border-slate-200">
              <span className="material-symbols-outlined text-[14px] text-blue-600">location_on</span>
              <span>
                {activeBooking.coordinates.lat.toFixed(4)}°, {activeBooking.coordinates.lng.toFixed(4)}°
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span>{activeBooking.status}</span>
          </div>
        </div>
      </div>

      {/* Robotics Status Telemetry Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 p-4 text-white shadow-md border border-slate-700">
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
            <span className="material-symbols-outlined text-[26px]">precision_manufacturing</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="font-headline text-sm font-bold text-white leading-tight">
                Robotics Telemetry:
              </span>
              <span className="text-xs text-emerald-400 font-mono">100% On-Route</span>
              <span className="text-slate-400 text-xs hidden sm:inline">•</span>
              <span className="text-slate-300 text-xs hidden sm:inline">
                {activeBooking.courierName || 'Autonomous Rover Alpha-4'}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-snug">
              Estimated doorstep delivery window: <strong className="text-emerald-400">{activeBooking.eta}</strong>. Sidewalk stereo LIDAR active.
            </p>
          </div>

          <div className="hidden sm:block text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Scheduled Stops
            </span>
            <span className="font-mono text-sm font-bold text-emerald-400">
              {dayDeliveriesCount} on date
            </span>
          </div>
        </div>
      </div>

      {/* Lightweight Map Visualization to show upcoming delivery locations for the selected day */}
      <DeliveryMapView
        bookings={bookings}
        days={days}
        selectedBookingId={selectedBookingId}
        onSelectBooking={handleSelectBooking}
        selectedDateKey={selectedDateKey}
        onSelectDateKey={handleSelectDateKey}
      />

      {/* Active Booking Detailed Operations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Delivery Journey Timeline */}
        <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-[18px]">
                timeline
              </span>
              <span className="font-headline text-sm font-bold text-slate-900">
                Delivery Journey
              </span>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 uppercase">
              {activeBooking.status === 'Completed'
                ? 'Delivered'
                : activeBooking.status === 'In Transit'
                ? 'Step 3 of 4'
                : 'Step 2 of 4'}
            </span>
          </div>

          <div className="relative pl-6 space-y-4 text-xs">
            {/* Step 1 */}
            <div className="relative">
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[13px] font-bold">check</span>
              </div>
              <div className="absolute -left-[15px] top-6 w-0.5 h-6 bg-emerald-600"></div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-slate-800">Order Confirmed</p>
                  <p className="text-slate-500 text-[11px]">Autonomous dispatch queued</p>
                </div>
                <span className="text-slate-400">10:15 AM</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[13px] font-bold">check</span>
              </div>
              <div className="absolute -left-[15px] top-6 w-0.5 h-6 bg-emerald-600"></div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-slate-800">Loaded into Rover</p>
                  <p className="text-slate-500 text-[11px]">Willamette Central Robotics Hub</p>
                </div>
                <span className="text-slate-400">12:45 PM</span>
              </div>
            </div>

            {/* Step 3 (Active) */}
            <div className="relative">
              <div
                className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white ${
                  activeBooking.status === 'Completed'
                    ? 'bg-emerald-600'
                    : 'bg-emerald-500 ring-4 ring-emerald-100 animate-pulse'
                }`}
              >
                <span className="material-symbols-outlined text-[13px]">
                  {activeBooking.status === 'Completed' ? 'check' : 'precision_manufacturing'}
                </span>
              </div>
              <div className="absolute -left-[15px] top-6 w-0.5 h-6 bg-slate-200"></div>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-emerald-800">Out for Delivery</p>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                      {activeBooking.status}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    In transit with {activeBooking.courierName || 'Rover Bot Alpha-4'}
                  </p>
                </div>
                <span className="font-bold text-emerald-700">{activeBooking.eta}</span>
              </div>
            </div>

            {/* Step 4 (Upcoming) */}
            <div className="relative">
              <div
                className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                  activeBooking.status === 'Completed'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                <span className="material-symbols-outlined text-[13px]">
                  {activeBooking.status === 'Completed' ? 'check' : 'home'}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-slate-500">Doorstep Dock & Release</p>
                  <p className="text-slate-400 text-[11px] truncate max-w-[220px]">
                    {activeBooking.address}
                  </p>
                </div>
                <span className="text-slate-400">Est. {activeBooking.eta}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Robotics Vehicle & Actions */}
        <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Assigned Robotics Vehicle
              </span>
              <span className="flex items-center gap-1 text-amber-600 font-bold text-xs">
                <span
                  className="material-symbols-outlined text-[15px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
                <span>{activeBooking.courierRating || 4.98}</span>
                <span className="text-slate-400 text-[10px] font-normal">(1,420 drops)</span>
              </span>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30 shadow-xs">
                <span className="material-symbols-outlined text-[24px]">precision_manufacturing</span>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-headline text-sm font-bold text-slate-900 truncate">
                  {activeBooking.courierName || 'Autonomous Rover Alpha-4'}
                </h4>
                <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                  <span className="material-symbols-outlined text-[14px] text-emerald-600">
                    electric_car
                  </span>
                  <span>{activeBooking.courierVehicle || 'Model ED-V-882 • Dual Stereo LIDAR'}</span>
                </p>
              </div>
            </div>

            {/* Quick Ping / Telemetry Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Battery & Charge
                </span>
                <span className="font-bold text-slate-900 text-xs">96% • 34 km range</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Sensor Health
                </span>
                <span className="font-bold text-emerald-700 text-xs">100% Calibrated</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() =>
                showToast(`Pinged ${activeBooking.courierName || 'Rover Alpha-4'}: Status 100% nominal!`)
              }
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px] text-blue-600">sensors</span>
              <span>Ping Rover</span>
            </button>

            <button
              onClick={() => setIsNoteModalOpen(true)}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              <span>Update Note</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delivery Details & Doorstep Instructions */}
      <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm border border-slate-200 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="font-headline text-sm font-bold text-slate-900">
            Delivery Details & Drop-off Zone
          </span>
          <div className="flex items-center gap-1.5">
            {activeBooking.smsNotification !== false && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">sms</span>
                <span>SMS Active</span>
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              {activeBooking.date}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="material-symbols-outlined text-emerald-600 text-[18px]">schedule</span>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Reserved Window
              </span>
              <p className="font-bold text-slate-900">{activeBooking.windowLabel}</p>
              <p className="text-[11px] text-emerald-700">Zero-noise quiet doorstep delivery</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="material-symbols-outlined text-blue-600 text-[18px]">pin_drop</span>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Destination Coordinates
              </span>
              <p className="font-semibold text-slate-900">{activeBooking.address}</p>
              {activeBooking.coordinates && (
                <p className="text-[11px] text-slate-500 font-mono">
                  {activeBooking.coordinates.lat.toFixed(4)}° N, {activeBooking.coordinates.lng.toFixed(4)}° W
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-amber-600">doorbell</span>
              Doorstep Instructions
            </span>
            <button
              onClick={() => setIsNoteModalOpen(true)}
              className="text-[11px] font-bold text-emerald-700 hover:underline"
            >
              Edit Note
            </button>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed italic bg-white p-2.5 rounded-lg border border-slate-200">
            "{doorstepNote}"
          </p>
        </div>
      </div>

      {/* Package Contents */}
      <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="font-headline text-sm font-bold text-slate-900">Package Contents</span>
          <span className="text-xs text-slate-500">
            1 Parcel • {activeBooking.weightKg || 1.8} kg
          </span>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
            📦
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 truncate">
              {activeBooking.packageDescription || 'Precision Autonomous Parcel'}
            </p>
            <p className="text-slate-500 text-[11px]">Merchant: Oregon Craft Goods</p>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
            Secured
          </span>
        </div>
      </div>

      {/* Need to Adjust? Actions */}
      <div className="rounded-2xl bg-slate-100 p-4 sm:p-5 border border-slate-200 space-y-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-slate-700">sync_alt</span>
          <span className="font-headline text-xs font-bold text-slate-800">
            Need to adjust your delivery?
          </span>
        </div>
        <p className="text-xs text-slate-600">
          Running late or stepped out? You can reschedule to another autonomous window or request contactless porch locker drop.
        </p>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onRescheduleBooking(activeBooking)}
            className="flex-1 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-xs border border-slate-200 transition-all active:scale-95"
          >
            Reschedule Slot
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Are you sure you want to cancel booking ${activeBooking.id}?`)) {
                onCancelBooking(activeBooking.id);
                showToast(`Booking ${activeBooking.id} cancelled`);
              }
            }}
            className="flex-1 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs border border-red-200 transition-all active:scale-95"
          >
            Cancel Delivery
          </button>
        </div>
      </div>

      {/* Note Update Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-headline text-sm font-bold text-slate-900">Rover Delivery Note</h3>
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <textarea
              rows={3}
              value={doorstepNote}
              onChange={e => setDoorstepNote(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Enter special gate code, porch locker, or drop instructions..."
            />

            <button
              onClick={() => {
                setIsNoteModalOpen(false);
                showToast('Instruction updated on Rover Alpha-4 navigation queue!');
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              Save & Transmit to Rover
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
