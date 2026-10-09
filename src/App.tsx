import React, { useState, useEffect } from 'react';
import {
  DEMO_CUSTOMER,
  INITIAL_7_DAYS,
  INITIAL_BOOKINGS,
  SEED_DEMAND_FORECAST,
  INITIAL_AI_CAPACITY_SUGGESTIONS,
  INITIAL_BLOCKED_DAYS,
} from './data/mockData';
import { Booking, DaySlotInfo, AddressCleanResult, SlotWindowId } from './types';
import {
  normalizeAddress,
  updateSlotCapacityOnServer,
  fetchBookingsFromServer,
  saveBookingToServer,
  cancelBookingOnServer,
} from './services/aiService';
import { Header } from './components/Header';
import { BottomNavigation } from './components/BottomNavigation';
import { BookDeliveryView } from './components/BookDeliveryView';
import { DeliveriesView } from './components/DeliveriesView';
import { AdminPortalView } from './components/AdminPortalView';
import { DropBotChatModal } from './components/DropBotChatModal';
import { AddressCleanupModal } from './components/AddressCleanupModal';
import { SlotConfirmationModal } from './components/SlotConfirmationModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'book' | 'tracking' | 'admin'>('book');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  // Core application state
  const [days, setDays] = useState<DaySlotInfo[]>(INITIAL_7_DAYS);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [customer, setCustomer] = useState(DEMO_CUSTOMER);
  const [suggestions, setSuggestions] = useState(INITIAL_AI_CAPACITY_SUGGESTIONS);
  const [blockedDays, setBlockedDays] = useState(INITIAL_BLOCKED_DAYS);

  // Modals state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressCleanResult, setAddressCleanResult] = useState<AddressCleanResult | null>(null);

  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [lastConfirmedBooking, setLastConfirmedBooking] = useState<Booking | null>(INITIAL_BOOKINGS[0]);

  // Load live bookings from SQLite database on mount
  useEffect(() => {
    async function loadLiveBookings() {
      const serverBookings = await fetchBookingsFromServer();
      if (serverBookings && serverBookings.length > 0) {
        setBookings(serverBookings);
        setLastConfirmedBooking(serverBookings[0]);
      }
    }
    loadLiveBookings();
  }, []);

  // Handler: Confirm new booking (strict rule-based capacity deduction)
  const handleConfirmBooking = (newBooking: Booking) => {
    // Deduct capacity on target day
    setDays(prevDays =>
      prevDays.map(d => {
        if (d.dateString === newBooking.dateKey) {
          const win = newBooking.windowId;
          return {
            ...d,
            slots: {
              ...d.slots,
              [win]: {
                ...d.slots[win],
                bookedCount: Math.min(d.slots[win].maxCapacity, d.slots[win].bookedCount + 1),
              },
            },
          };
        }
        return d;
      })
    );

    // Save to local state
    setBookings(prev => [newBooking, ...prev]);
    setLastConfirmedBooking(newBooking);
    setIsConfirmationOpen(true);

    // Persist to actual SQLite database
    saveBookingToServer(newBooking);
  };

  // Handler: Cancel booking (strict capacity release)
  const handleCancelBooking = (bookingId: string) => {
    setBookings(prev =>
      prev.map(b => {
        if (b.id === bookingId) {
          // Release capacity
          setDays(prevDays =>
            prevDays.map(d => {
              if (d.dateString === b.dateKey) {
                const win = b.windowId;
                return {
                  ...d,
                  slots: {
                    ...d.slots,
                    [win]: {
                      ...d.slots[win],
                      bookedCount: Math.max(0, d.slots[win].bookedCount - 1),
                    },
                  },
                };
              }
              return d;
            })
          );
          return { ...b, status: 'Cancelled' as const };
        }
        return b;
      })
    );

    // Cancel in actual SQLite database
    cancelBookingOnServer(bookingId);
  };

  // Handler: Mark booking delivered
  const handleMarkDelivered = (bookingId: string) => {
    setBookings(prev =>
      prev.map(b => (b.id === bookingId ? { ...b, status: 'Completed' as const } : b))
    );
  };

  // Handler: Update slot capacity by dispatcher
  const handleUpdateSlotCapacity = (
    dateKey: string,
    windowId: SlotWindowId,
    newCap: number,
    active: boolean
  ) => {
    setDays(prev =>
      prev.map(d => {
        if (d.dateString === dateKey) {
          return {
            ...d,
            slots: {
              ...d.slots,
              [windowId]: {
                ...d.slots[windowId],
                maxCapacity: newCap,
                active,
              },
            },
          };
        }
        return d;
      })
    );

    // Async sync to server
    updateSlotCapacityOnServer(dateKey, windowId, newCap, active);
  };

  // Handler: AI Capacity Suggestion Approval (Requirement 5: Admin approves any capacity change)
  const handleApproveSuggestion = (sugId: string) => {
    const sug = suggestions.find(s => s.id === sugId);
    if (!sug) return;

    // Apply capacity change to live slot schedule
    handleUpdateSlotCapacity(sug.dateKey, sug.windowId, sug.suggestedCapacity, true);

    // Mark suggestion approved
    setSuggestions(prev =>
      prev.map(s => (s.id === sugId ? { ...s, status: 'approved' as const } : s))
    );
  };

  const handleDismissSuggestion = (sugId: string) => {
    setSuggestions(prev =>
      prev.map(s => (s.id === sugId ? { ...s, status: 'dismissed' as const } : s))
    );
  };

  // Handler: Address Normalization with Gemini LLM
  const handleOpenAddressCleanup = async (rawAddress: string) => {
    setIsAddressModalOpen(true);
    setAddressLoading(true);
    try {
      const res = await normalizeAddress(rawAddress);
      setAddressCleanResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setAddressLoading(false);
    }
  };

  const handleConfirmCleanedAddress = (cleaned: string) => {
    setCustomer(prev => ({ ...prev, address: cleaned }));
    setIsAddressModalOpen(false);
  };

  // Blackout days
  const handleAddBlockedDay = (date: string, reason: string) => {
    setBlockedDays(prev => [
      ...prev,
      {
        date,
        title: `Blackout: ${date}`,
        badge: 'Paused',
        reason,
      },
    ]);
  };

  const handleRemoveBlockedDay = (date: string) => {
    setBlockedDays(prev => prev.filter(b => b.date !== date));
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] flex flex-col font-body selection:bg-emerald-100 selection:text-emerald-900">
      {/* Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={tab => setCurrentTab(tab)}
        onOpenChat={() => setIsChatOpen(true)}
        language={language}
        onToggleLanguage={() => setLanguage(prev => (prev === 'en' ? 'hi' : 'en'))}
        pendingSuggestionsCount={suggestions.filter(s => s.status === 'pending').length}
      />

      {/* Main Views */}
      <main className="flex-1 w-full">
        {currentTab === 'book' && (
          <BookDeliveryView
            customer={customer}
            days={days}
            onOpenAddressCleanup={handleOpenAddressCleanup}
            onConfirmBooking={handleConfirmBooking}
            onOpenAdmin={() => setCurrentTab('admin')}
            onOpenDropBotChat={() => setIsChatOpen(true)}
          />
        )}

        {currentTab === 'tracking' && (
          <DeliveriesView
            bookings={bookings}
            days={days}
            onCancelBooking={handleCancelBooking}
            onRescheduleBooking={b => {
              setCurrentTab('book');
            }}
          />
        )}

        {currentTab === 'admin' && (
          <AdminPortalView
            days={days}
            bookings={bookings}
            forecast={SEED_DEMAND_FORECAST}
            suggestions={suggestions}
            onApproveSuggestion={handleApproveSuggestion}
            onDismissSuggestion={handleDismissSuggestion}
            onUpdateSlotCapacity={handleUpdateSlotCapacity}
            onMarkDelivered={handleMarkDelivered}
            onCancelBooking={handleCancelBooking}
            onAddBlockedDay={handleAddBlockedDay}
            onRemoveBlockedDay={handleRemoveBlockedDay}
            blockedDays={blockedDays}
          />
        )}
      </main>

      {/* Floating DropBot Quick Launcher Button (Right Bottom) */}
      <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40">
        <button
          onClick={() => setIsChatOpen(true)}
          className="relative px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-2xl border border-slate-700/80 flex items-center gap-2.5 transition-all duration-300 active:scale-95 group"
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">smart_toy</span>
          </div>

          <div className="text-left hidden sm:block">
            <div className="flex items-center gap-1.5 leading-none">
              <span>DropBot AI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">Autonomous Dispatch</span>
          </div>

          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold">
            {language === 'en' ? 'EN / हिन्दी' : 'हिन्दी'}
          </span>
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation
        currentTab={currentTab}
        onSelectTab={tab => setCurrentTab(tab)}
        onOpenChat={() => setIsChatOpen(true)}
      />

      {/* DropBot Bilingual Chat Modal */}
      <DropBotChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        language={language}
        onToggleLanguage={() => setLanguage(prev => (prev === 'en' ? 'hi' : 'en'))}
        onRefreshData={async () => {
          const fresh = await fetchBookingsFromServer();
          if (fresh && fresh.length > 0) {
            setBookings(fresh);
          }
        }}
        onNavigateToTracking={bookingId => {
          setCurrentTab('tracking');
          setIsChatOpen(false);
        }}
      />

      {/* Address Cleanup Modal (Requirement 4) */}
      <AddressCleanupModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        result={addressCleanResult}
        isLoading={addressLoading}
        onConfirmCleaned={handleConfirmCleanedAddress}
        onKeepOriginal={() => setIsAddressModalOpen(false)}
      />

      {/* Slot Confirmation Modal */}
      <SlotConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        booking={lastConfirmedBooking}
        onReschedule={() => {
          setIsConfirmationOpen(false);
          setCurrentTab('book');
        }}
        onCancel={id => {
          handleCancelBooking(id);
          setIsConfirmationOpen(false);
        }}
      />
    </div>
  );
}
