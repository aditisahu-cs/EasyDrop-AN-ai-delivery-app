import React, { useState } from 'react';
import { CustomerProfile, DaySlotInfo, SlotWindowId, Booking } from '../types';
import { calculateSmartSlotRecommendation, getCoordinatesForAddress } from '../data/mockData';
import { RoboticsRover } from './RoboticsRover';

interface BookDeliveryViewProps {
  customer: CustomerProfile;
  days: DaySlotInfo[];
  onOpenAddressCleanup: (currentAddress: string) => void;
  onConfirmBooking: (newBooking: Booking) => void;
  onOpenAdmin: () => void;
  onOpenDropBotChat: () => void;
}

export const BookDeliveryView: React.FC<BookDeliveryViewProps> = ({
  customer,
  days,
  onOpenAddressCleanup,
  onConfirmBooking,
  onOpenAdmin,
  onOpenDropBotChat,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [recipientName, setRecipientName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [address, setAddress] = useState(customer.address);
  const [instructions, setInstructions] = useState(customer.notes);
  const [selectedDayIndex, setSelectedDayIndex] = useState(1); // Default: Tomorrow (Oct 24)
  const [selectedWindowId, setSelectedWindowId] = useState<SlotWindowId>('afternoon');
  const [notifyViaSms, setNotifyViaSms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedDay = days[selectedDayIndex] || days[0];
  const selectedSlot = selectedDay.slots[selectedWindowId];

  // Calculate Smart Slot Suggestion based on fullness & past customer booking patterns
  const recommendation = calculateSmartSlotRecommendation(customer, selectedDay);

  const isPhoneValid = phone.replace(/\D/g, '').length >= 10;

  const handleConfirm = () => {
    // Strict rule-based capacity verification
    if (selectedSlot.bookedCount >= selectedSlot.maxCapacity) {
      alert(`Cannot book: Slot ${selectedSlot.name} on ${selectedDay.label} is completely FULL (${selectedSlot.bookedCount}/${selectedSlot.maxCapacity}). Please select an alternate window.`);
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const newBookingId = `ED-${Math.floor(1000 + Math.random() * 9000)}`;
      const newBooking: Booking = {
        id: newBookingId,
        customerName: recipientName.trim() || 'Valued Customer',
        phone: phone.replace(/(\+\d{1,2}\s?\(?\d{3}\)?\s?)\d{3}/, '$1***'),
        rawPhone: phone,
        address: address.trim() || '742 Evergreen Terrace, Apt 4B',
        instructions: instructions.trim(),
        date: selectedDay.label,
        dateKey: selectedDay.dateString,
        windowId: selectedWindowId,
        windowLabel: `${selectedSlot.name} (${selectedSlot.timeSpan.replace(' – ', '-')})`,
        status: 'Queued',
        eta: selectedWindowId === 'morning' ? '10:15 AM' : selectedWindowId === 'afternoon' ? '02:15 PM' : '05:30 PM',
        courierName: 'Autonomous Rover Alpha-4',
        courierVehicle: 'Robotics Rover ED-V-882 (LIDAR)',
        courierRating: 4.98,
        packageDescription: 'Express Autonomous Doorstep Drop',
        weightKg: 1.5,
        createdAt: new Date().toISOString(),
        noShowRisk: 'Low',
        noShowProbability: 0.08,
        riskFactors: ['Verified mobile number', 'Precise porch instructions provided'],
        isDemoData: true,
        smsNotification: notifyViaSms,
        coordinates: getCoordinatesForAddress(address.trim() || '742 Evergreen Terrace, Apt 4B'),
      };

      setIsSubmitting(false);
      onConfirmBooking(newBooking);
    }, 700);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-20">
      {/* Top Overline Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/85 backdrop-blur-md shadow-xs border border-slate-200 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="font-bold text-emerald-800 uppercase tracking-widest text-[10px]">
            Doorstep Robotics Sync 4.2
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-600 font-medium">Autonomous Rover Fleet Live</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold items-center gap-1 shadow-xs">
            <span className="material-symbols-outlined text-[14px] text-amber-700">lock_reset</span>
            <span>Strict Rule-Based Capacity Engine</span>
          </div>

          <button
            onClick={onOpenDropBotChat}
            className="px-3.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[14px] text-emerald-400">smart_toy</span>
            <span>Ask DropBot AI</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Stage (Robotics Rover & Diagnostics) + Right Stage (3-Step Booking Engine) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Autonomous Robotics Fleet Showcase */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Autonomous Rover Card */}
          <RoboticsRover
            statusText="Rover Bot Alpha-4 standing by on grid. Consolidated eco-route ready"
            batteryLevel={96}
          />

          {/* Porch Architectural Diagnostics */}
          <div className="p-6 rounded-3xl bg-white shadow-sm border border-slate-200/80 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[22px]">radar</span>
                <h3 className="font-headline text-base font-bold text-slate-900">Doorstep Docking Grid</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold uppercase">
                Active LIDAR
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col">
                <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-emerald-600">near_me</span>
                  Rover Radius
                </span>
                <span className="font-headline text-lg font-bold text-slate-900 mt-1">
                  1.8 <span className="text-xs text-slate-500 font-normal">miles</span>
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col">
                <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-blue-600">schedule</span>
                  Precision
                </span>
                <span className="font-headline text-lg font-bold text-slate-900 mt-1">
                  15 <span className="text-xs text-slate-500 font-normal">min</span>
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col">
                <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-emerald-600">eco</span>
                  Footprint
                </span>
                <span className="font-headline text-lg font-bold text-emerald-700 mt-1">
                  Zero <span className="text-xs text-slate-500 font-normal">EV</span>
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">bolt</span>
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">Fleet Dispatch Status</span>
                  <span className="text-[11px] text-slate-500">9 autonomous rovers actively navigating sector.</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                100% On-Time
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: 3-Step Interactive Booking Engine */}
        <div className="lg:col-span-6">
          <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200/90 relative">
            {/* Header */}
            <div className="mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold uppercase tracking-wider">
                  Live Dispatch Slot Engine
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-semibold">
                  Guaranteed Doorstep Drop
                </span>
              </div>
              <h1 className="font-headline text-2xl sm:text-3xl font-bold text-slate-900">
                Select your doorstep window.
              </h1>
              <p className="text-slate-600 text-xs sm:text-sm mt-1">
                Book ahead with autonomous rovers. Strict capacity limits prevent overbooking.
              </p>
            </div>

            {/* Stepper Tabs */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <button
                onClick={() => setCurrentStep(1)}
                className={`flex flex-col gap-1 p-1 text-left transition-all ${
                  currentStep === 1 ? 'opacity-100' : 'opacity-60 hover:opacity-100'
                }`}
              >
                <div
                  className={`h-1.5 w-full rounded-full transition-all ${
                    currentStep >= 1 ? 'bg-emerald-600' : 'bg-slate-200'
                  }`}
                ></div>
                <span
                  className={`text-[11px] font-bold ${
                    currentStep === 1 ? 'text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  1. Doorstep Info
                </span>
              </button>

              <button
                onClick={() => setCurrentStep(2)}
                className={`flex flex-col gap-1 p-1 text-left transition-all ${
                  currentStep === 2 ? 'opacity-100' : 'opacity-60 hover:opacity-100'
                }`}
              >
                <div
                  className={`h-1.5 w-full rounded-full transition-all ${
                    currentStep >= 2 ? 'bg-emerald-600' : 'bg-slate-200'
                  }`}
                ></div>
                <span
                  className={`text-[11px] font-bold ${
                    currentStep === 2 ? 'text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  2. Select Day
                </span>
              </button>

              <button
                onClick={() => setCurrentStep(3)}
                className={`flex flex-col gap-1 p-1 text-left transition-all ${
                  currentStep === 3 ? 'opacity-100' : 'opacity-60 hover:opacity-100'
                }`}
              >
                <div
                  className={`h-1.5 w-full rounded-full transition-all ${
                    currentStep >= 3 ? 'bg-emerald-600' : 'bg-slate-200'
                  }`}
                ></div>
                <span
                  className={`text-[11px] font-bold ${
                    currentStep === 3 ? 'text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  3. Precise Slot
                </span>
              </button>
            </div>

            {/* STEP 1: RECIPIENT INFORMATION */}
            {currentStep === 1 && (
              <div className="flex flex-col gap-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="font-headline text-sm font-bold text-slate-800">Delivery Recipient</span>
                  <span className="text-xs text-slate-400 font-semibold">Step 1 of 3</span>
                </div>

                {/* Name */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700">Full Name</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[18px]">
                      person
                    </span>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={e => setRecipientName(e.target.value)}
                      placeholder="Recipient Name"
                      className="w-full bg-slate-50 text-slate-900 text-xs sm:text-sm rounded-xl py-3 pl-11 pr-4 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-700">Mobile Number</label>
                    <span
                      className={`text-[11px] font-semibold flex items-center gap-1 ${
                        isPhoneValid ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {isPhoneValid ? 'check_circle' : 'error'}
                      </span>
                      <span>{isPhoneValid ? 'Verified mobile' : 'Enter 10+ digits'}</span>
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[18px]">
                      phone_iphone
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-slate-50 text-slate-900 text-xs sm:text-sm rounded-xl py-3 pl-11 pr-4 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 pl-1">Rover sends PIN unlock code upon arrival. 📦</p>
                </div>

                {/* Doorstep Address with Normalize Button */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Doorstep Address</label>
                    <button
                      type="button"
                      onClick={() => onOpenAddressCleanup(address)}
                      className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 py-0.5 px-2 rounded-md bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                      title="Normalize address format with Gemini LLM"
                    >
                      <span className="material-symbols-outlined text-[13px]">auto_fix_high</span>
                      <span>Clean with AI ✨</span>
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[18px]">
                      home_pin
                    </span>
                    <input
                      type="text"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="Street, Apartment or Suite"
                      className="w-full bg-slate-50 text-slate-900 text-xs sm:text-sm rounded-xl py-3 pl-11 pr-4 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Drop-off Instructions */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">Doorstep Instruction</label>
                  <div className="flex flex-wrap gap-2">
                    {['Leave at door', 'Ring bell & wait', 'Porch box locker', 'Autonomous Dock Bay'].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setInstructions(opt)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          instructions.includes(opt)
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="mt-2 w-full py-3.5 px-6 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-headline text-sm font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>Continue to Date</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            )}

            {/* STEP 2: 7-DAY DATE PICKER */}
            {currentStep === 2 && (
              <div className="flex flex-col gap-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-headline text-sm font-bold text-slate-800">Select Schedule Day</span>
                    <p className="text-[11px] text-slate-500">Autonomous rovers operate 7 days a week.</p>
                  </div>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                    <span>Back</span>
                  </button>
                </div>

                {/* 7 Horizontal Date Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
                  {days.map((d, idx) => {
                    const isSelected = selectedDayIndex === idx;
                    const isTodayPast = idx === 0 && d.slots.evening.bookedCount >= d.slots.evening.maxCapacity;

                    return (
                      <button
                        key={d.dateString}
                        type="button"
                        disabled={isTodayPast}
                        onClick={() => setSelectedDayIndex(idx)}
                        className={`flex-shrink-0 w-24 p-2.5 rounded-2xl flex flex-col items-center justify-center transition-all duration-150 active:scale-95 text-center ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400'
                            : isTodayPast
                            ? 'bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed border border-slate-200'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider ${
                            isSelected ? 'text-emerald-100' : 'text-slate-500'
                          }`}
                        >
                          {d.dayName}
                        </span>
                        <span className="font-headline text-lg font-bold my-0.5">{d.dayNumber}</span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold mt-0.5 ${
                            isSelected
                              ? 'bg-white text-emerald-800'
                              : d.status === 'eco_free'
                              ? 'bg-amber-100 text-amber-900'
                              : d.status === 'few_left'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {d.statusLabel || (d.status === 'eco_free' ? 'Eco-Slot' : 'Open')}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Weather Forecast Card for the selected day */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[28px] text-amber-500">
                      {selectedDay.weather.condition === 'Showers' ? 'rainy' : 'sunny'}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        {selectedDay.label} • {selectedDay.weather.condition}
                      </span>
                      <span className="text-[11px] text-slate-500">{selectedDay.weather.description}</span>
                    </div>
                  </div>
                  <span className="font-headline text-base font-bold text-slate-900">{selectedDay.weather.temp}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="mt-2 w-full py-3.5 px-6 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-headline text-sm font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>Choose Time Slot</span>
                  <span className="material-symbols-outlined text-[18px]">schedule</span>
                </button>
              </div>
            )}

            {/* STEP 3: TIME SLOT WITH SMART RECOMMENDATION */}
            {currentStep === 3 && (
              <div className="flex flex-col gap-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-headline text-sm font-bold text-slate-800">Pick Delivery Window</span>
                    <p className="text-[11px] text-slate-500">
                      Strict capacity enforcement. High-confidence robotics dispatch.
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                    <span>Back</span>
                  </button>
                </div>

                {/* Slot Cards List */}
                <div className="flex flex-col gap-3">
                  {(['morning', 'afternoon', 'evening'] as SlotWindowId[]).map(winId => {
                    const slot = selectedDay.slots[winId];
                    const isSelected = selectedWindowId === winId;
                    const isFull = slot.bookedCount >= slot.maxCapacity;
                    const isRecommended = recommendation.recommendedWindowId === winId && !isFull;
                    const spotsRemaining = Math.max(0, slot.maxCapacity - slot.bookedCount);

                    return (
                      <div
                        key={winId}
                        onClick={() => !isFull && setSelectedWindowId(winId)}
                        className={`relative p-4 rounded-2xl transition-all cursor-pointer border ${
                          isFull
                            ? 'bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed'
                            : isSelected
                            ? 'bg-emerald-50/90 border-2 border-emerald-500 shadow-md ring-2 ring-emerald-400/40'
                            : 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                isFull
                                  ? 'bg-slate-200 text-slate-400'
                                  : isSelected
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                {winId === 'morning'
                                  ? 'wb_twilight'
                                  : winId === 'afternoon'
                                  ? 'wb_sunny'
                                  : 'nights_stay'}
                              </span>
                            </div>

                            <div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-headline text-sm font-bold text-slate-900">
                                  {slot.name}
                                </span>

                                {/* Recommended Badge (Requirement 2) */}
                                {isRecommended && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs">
                                    <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
                                    <span>Recommended</span>
                                  </span>
                                )}

                                {/* Status Tag */}
                                {isFull ? (
                                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold">
                                    Full / Cut-off
                                  </span>
                                ) : (
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      spotsRemaining <= 2
                                        ? 'bg-amber-100 text-amber-900'
                                        : 'bg-emerald-100 text-emerald-900'
                                    }`}
                                  >
                                    {spotsRemaining} spot{spotsRemaining === 1 ? '' : 's'} left
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-slate-500 mt-0.5">{slot.timeSpan}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">{slot.description}</p>

                              {/* Explainable AI rationale */}
                              {isRecommended && (
                                <p className="text-[11px] text-emerald-800 bg-emerald-100/70 px-2 py-1 rounded-md mt-2 leading-relaxed">
                                  💡 {recommendation.reasoning}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`text-sm font-bold block ${
                                slot.fee === 0 ? 'text-emerald-700' : 'text-slate-900'
                              }`}
                            >
                              {slot.fee === 0 ? 'Free' : `$${slot.fee.toFixed(2)}`}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {slot.fee === 0 ? 'Included' : 'Rover Fee'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* REAL-TIME SELECTION SUMMARY CARD */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]">local_shipping</span>
                  <span>Autonomous Booking Summary</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Standard Doorstep
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Scheduled Timing:</span>
                  <span className="font-bold text-emerald-800">
                    {selectedDay.label} • {selectedSlot.name}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Recipient:</span>
                  <span className="font-semibold text-slate-900">{recipientName}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Drop-off Zone:</span>
                  <span className="font-semibold text-slate-900 truncate max-w-[200px]">{address}</span>
                </div>
              </div>

              {/* Notify via SMS Toggle Switch */}
              <div className="mt-3 p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      notifyViaSms ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">sms</span>
                  </div>
                  <div>
                    <span className="font-headline text-xs font-bold text-slate-900 block">
                      Notify via SMS
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {notifyViaSms
                        ? `Live 15-min arrival alerts & PIN sent to ${phone || 'mobile'}`
                        : 'SMS alerts muted (view updates in app only)'}
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyViaSms}
                    onChange={e => setNotifyViaSms(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Confirm Button */}
              <button
                type="button"
                disabled={isSubmitting || selectedSlot.bookedCount >= selectedSlot.maxCapacity}
                onClick={handleConfirm}
                className="w-full mt-4 py-3.5 px-6 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-headline text-sm font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                    <span>Securing Rover Spot...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Delivery Slot 🚀</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1 mt-2 text-[11px] text-slate-500 text-center">
                <span className="material-symbols-outlined text-[14px] text-emerald-600">event_repeat</span>
                <span>Free rescheduling up to 2 hours before slot start time.</span>
              </div>

              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                >
                  <span>Access Dispatcher Portal (Demo)</span>
                  <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
