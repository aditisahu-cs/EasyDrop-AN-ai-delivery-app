import React, { useState } from 'react';
import { Booking } from '../types';

interface SlotConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onReschedule: () => void;
  onCancel: (bookingId: string) => void;
}

export const SlotConfirmationModal: React.FC<SlotConfirmationModalProps> = ({
  isOpen,
  onClose,
  booking,
  onReschedule,
  onCancel,
}) => {
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen || !booking) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const copyRef = () => {
    navigator.clipboard?.writeText(booking.id);
    setCopied(true);
    showToast(`Booking ref ${booking.id} copied!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `EasyDrop Robotics #${booking.id}`,
        text: `My EasyDrop Autonomous Delivery is booked for ${booking.date} (${booking.windowLabel})!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      showToast('Booking details link copied for sharing!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-xl border border-slate-700 flex items-center gap-1.5 animate-bounce">
          <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="relative w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Glow ambient background */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Top Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        {/* Celebratory Icon & Heading */}
        <div className="text-center flex flex-col items-center pt-2 pb-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3 shadow-inner ring-4 ring-emerald-50">
            <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              task_alt
            </span>
          </div>

          <h2 className="font-headline text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Hooray! Your slot is locked in!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-[280px]">
            We've reserved your doorstep autonomous delivery window. Sit back and let robotics handle the rest.
          </p>

          {/* Booking Ref Pill */}
          <div className="mt-3 inline-flex items-center gap-2 bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Booking Ref:</span>
            <span className="font-mono text-sm font-bold text-emerald-700">{booking.id}</span>
            <button
              onClick={copyRef}
              className="p-1 text-slate-500 hover:text-slate-800 transition-colors"
              title="Copy Booking Reference"
            >
              <span className="material-symbols-outlined text-[16px]">{copied ? 'check' : 'content_copy'}</span>
            </button>
          </div>
        </div>

        {/* Order Details Bento Card */}
        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="font-headline text-xs font-bold text-slate-800">Order Specifications</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
              Confirmed & Scheduled
            </span>
          </div>

          {/* Scheduled Timing */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">event</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Scheduled Window</span>
              <p className="font-bold text-xs sm:text-sm text-slate-900">{booking.date}</p>
              <p className="text-xs text-emerald-700 font-semibold">{booking.windowLabel}</p>
            </div>
          </div>

          {/* Destination */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">location_on</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Destination</span>
              <p className="font-semibold text-xs sm:text-sm text-slate-900">{booking.address}</p>
              {booking.instructions && (
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">"{booking.instructions}"</p>
              )}
            </div>
          </div>

          {/* Recipient */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100/70 text-amber-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Recipient</span>
              <p className="font-semibold text-xs sm:text-sm text-slate-900">{booking.customerName}</p>
              <p className="text-[11px] text-slate-500">{booking.phone}</p>
            </div>
          </div>

          {/* SMS Notification Status */}
          <div className="flex items-center justify-between px-1 text-xs pt-1 border-t border-slate-200/60">
            <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-emerald-600">sms</span>
              <span>SMS Arrival Alerts:</span>
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                booking.smsNotification !== false
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {booking.smsNotification !== false ? 'Enabled (Active)' : 'Muted'}
            </span>
          </div>

          {/* Reschedule Guarantee Pill */}
          <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-amber-900 text-[11px] flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-amber-700 shrink-0">info</span>
            <span>Free rescheduling or cancellation up to 2 hours before slot start time.</span>
          </div>
        </div>

        {/* Share & Calendar Tools */}
        <div className="grid grid-cols-2 gap-2.5 my-3">
          <button
            onClick={() => showToast('Calendar appointment (.ics) generated!')}
            className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px] text-blue-600">event</span>
            <span>Add to Calendar</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px] text-emerald-600">share</span>
            <span>Share Details</span>
          </button>
        </div>

        {/* Autonomous Rover Guarantee Card */}
        <div className="p-3 rounded-xl bg-slate-900 text-white text-xs flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400 text-[20px]">precision_manufacturing</span>
            <div>
              <p className="font-bold text-white text-[11px]">Autonomous Rover Guarantee</p>
              <p className="text-slate-400 text-[10px]">LIDAR GPS sync alerts you 15 minutes before porch arrival.</p>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
        </div>

        {/* Changes & Cancel Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <button
            onClick={onReschedule}
            className="text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
            <span>Reschedule Slot</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm(`Are you sure you want to cancel booking ${booking.id}?`)) {
                onCancel(booking.id);
                onClose();
              }
            }}
            className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">cancel</span>
            <span>Cancel Delivery</span>
          </button>
        </div>

        {/* Return Button */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-headline text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
        >
          <span>Done / Back to Bookings</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};
