import React, { useState, useRef, useEffect } from 'react';
import { sendDropBotMessage } from '../services/aiService';
import { ChatMessage, Booking } from '../types';

interface DropBotChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'hi';
  onToggleLanguage: () => void;
  onRefreshData?: () => void;
  onNavigateToTracking?: (bookingId: string) => void;
}

export const DropBotChatModal: React.FC<DropBotChatModalProps> = ({
  isOpen,
  onClose,
  language,
  onToggleLanguage,
  onRefreshData,
  onNavigateToTracking,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'drop',
      text:
        language === 'hi'
          ? 'नमस्ते! मैं DropBot हूँ—EasyDrop का ऑटोनॉमस रोबोटिक्स डिस्पैच असिस्टेंट। मैं आपके ऑर्डर ट्रैक कर सकता हूँ (उदा. ED-4821), स्लॉट उपलब्धता की जांच कर सकता हूँ, या रोबोट डिलीवरी बुक व रद्द कर सकता हूँ। मैं आपकी क्या मदद करूँ?'
          : "Hello! I am DropBot, your EasyDrop Autonomous Robotics Dispatcher. I can track your orders in real-time (e.g. ED-4821), answer delivery questions, check fleet capacity, and book or cancel autonomous deliveries. How can I assist you?",
      timestamp: 'Just now',
      language,
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);

    try {
      const historyToSend = messages.slice(-6).map(m => ({ sender: m.sender, text: m.text }));
      const response = await sendDropBotMessage(text, language, historyToSend);

      let actionTaken: any = undefined;
      let trackedBooking: Booking | undefined = undefined;

      if (response.toolExecutions && response.toolExecutions.length > 0) {
        const lastTool = response.toolExecutions[response.toolExecutions.length - 1];
        const toolName = lastTool.tool;

        if (toolName === 'track_order' && lastTool.output?.booking) {
          trackedBooking = lastTool.output.booking;
          actionTaken = {
            type: 'track',
            details: JSON.stringify(lastTool.output),
            bookingRef: trackedBooking?.id,
            success: true,
          };
        } else if (toolName === 'book_delivery_slot') {
          actionTaken = {
            type: 'book',
            details: JSON.stringify(lastTool.output),
            bookingRef: lastTool.output?.bookingRef,
            success: lastTool.output?.success !== false,
          };
        } else if (toolName === 'cancel_delivery_slot') {
          actionTaken = {
            type: 'cancel',
            details: JSON.stringify(lastTool.output),
            bookingRef: lastTool.output?.bookingRef,
            success: lastTool.output?.success !== false,
          };
        } else {
          actionTaken = {
            type: 'check',
            details: JSON.stringify(lastTool.output),
            success: true,
          };
        }

        if (onRefreshData) {
          onRefreshData();
        }
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'drop',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionTaken,
      };

      // Attach tracked order if available
      if (trackedBooking) {
        (botMsg as any).trackedBooking = trackedBooking;
      }

      setMessages(prev => [...prev, botMsg]);
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'drop',
          text:
            language === 'hi'
              ? 'क्षमा करें, DropBot सेवा से संपर्क नहीं हो सका। सर्वर चालू है या नहीं जांचें और फिर से प्रयास करें।'
              : 'Sorry, DropBot could not reach its chat service. Check that the app server is running and try again.',
          timestamp: 'Now',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts =
    language === 'hi'
      ? [
          'ऑर्डर ED-4821 ट्रैक करो',
          'कल कौन से स्लॉट उपलब्ध हैं?',
          'रोबोटिक्स कैसे काम करता है?',
          'बारिश में डिलीवरी कैसे होती है?',
          'दोपहर का स्लॉट बुक करो',
        ]
      : [
          'Track order ED-4821',
          'Check tomorrow slots',
          'How does autonomous rover delivery work?',
          'What if it rains during delivery?',
          'Book afternoon slot for tomorrow',
        ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[680px] max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <span className="material-symbols-outlined text-[24px]">smart_toy</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline text-base font-bold text-white leading-none">DropBot Robotics AI</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Autonomous Dispatch & Order Tracking Agent</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleLanguage}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-700"
              title="Toggle language"
            >
              <span className="material-symbols-outlined text-[14px]">translate</span>
              <span>{language === 'en' ? 'EN' : 'हिन्दी'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Database & Privacy Info Bar */}
        <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2 flex items-center justify-between text-[11px] text-emerald-900">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="material-symbols-outlined text-[15px] text-emerald-700">database</span>
            <span>Live SQLite Database & Real-Time Autonomous Rover Tracking</span>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-emerald-200/70 text-emerald-800 font-bold uppercase text-[9px] tracking-wider">
            Connected
          </span>
        </div>

        {/* Message Feed */}
        <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
          {messages.map(msg => {
            const tracked = (msg as any).trackedBooking as Booking | undefined;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-start gap-2 max-w-[88%]">
                  {msg.sender === 'drop' && (
                    <div className="w-7 h-7 rounded-lg bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm text-xs">
                      <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                    </div>
                  )}

                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                      msg.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>

                    {/* Interactive Order Tracking Card */}
                    {tracked && (
                      <div className="mt-3 p-3 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-emerald-400 text-[18px]">
                              location_on
                            </span>
                            <span className="font-bold text-sm tracking-wide text-white">#{tracked.id}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              tracked.status === 'In Transit'
                                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                : tracked.status === 'Completed'
                                ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                                : 'bg-blue-400/20 text-blue-300 border border-blue-400/30'
                            }`}
                          >
                            {tracked.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                          <div>
                            <span className="text-slate-400 block text-[10px]">ETA</span>
                            <strong className="text-white">{tracked.eta}</strong> ({tracked.date})
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Rover Assigned</span>
                            <span className="text-emerald-300 font-medium truncate block">
                              {tracked.courierName || 'Rover Bot Alpha'}
                            </span>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-300">
                          <span className="text-slate-400 block text-[10px]">Destination</span>
                          <span className="text-slate-200 line-clamp-1">{tracked.address}</span>
                        </div>

                        {onNavigateToTracking && (
                          <button
                            onClick={() => {
                              onNavigateToTracking(tracked.id);
                              onClose();
                            }}
                            className="w-full mt-2 py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[15px]">map</span>
                            <span>Track on Live Vector Map</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Tool execution badge if an automated action was performed */}
                    {msg.actionTaken && !tracked && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px]">
                        <span className="material-symbols-outlined text-[14px] text-emerald-600">
                          {msg.actionTaken.success ? 'check_circle' : 'error'}
                        </span>
                        <span className="font-semibold text-slate-700">
                          {msg.actionTaken.type === 'book'
                            ? `Autonomous Dispatch Scheduled: #${msg.actionTaken.bookingRef || 'ED-Confirmed'}`
                            : msg.actionTaken.type === 'cancel'
                            ? 'Booking Released & Cancelled in Database'
                            : 'Live Slot Registry Verified'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
              </div>
              <div className="p-3 bg-white rounded-2xl rounded-bl-none border border-slate-200 shadow-xs flex items-center gap-2 text-xs text-slate-500">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>DropBot is querying the database & autonomous telemetry...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2.5 bg-slate-100 border-t border-slate-200 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-700 border border-slate-200 text-[11px] whitespace-nowrap transition-colors active:scale-95 disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={
              language === 'hi'
                ? 'ऑर्डर नंबर (उदा. ED-4821) लिखें या कोई प्रश्न पूछें...'
                : 'Enter order ID (e.g. ED-4821), track parcel, or ask a question...'
            }
            className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputVal.trim() || isLoading}
            className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white flex items-center justify-center transition-all active:scale-95 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
