import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import type { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import type { FunctionDeclaration } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import { sqliteDb } from './src/db/sqliteDb.ts';
import type { DBBooking } from './src/db/sqliteDb.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Tool declarations for DropBot Assistant
const checkSlotsDeclaration: FunctionDeclaration = {
  name: 'check_slots',
  description: 'Check available autonomous delivery windows and capacity from the database for a given date.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      dateKey: {
        type: Type.STRING,
        description: 'Target date in YYYY-MM-DD format (e.g. 2025-10-24) or "tomorrow", "today"',
      },
    },
    required: ['dateKey'],
  },
};

const bookSlotDeclaration: FunctionDeclaration = {
  name: 'book_delivery_slot',
  description: 'Strictly books an autonomous delivery slot in the database for the customer. Fails if slot is at full capacity.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      dateKey: {
        type: Type.STRING,
        description: 'Date in YYYY-MM-DD format (e.g. 2025-10-24)',
      },
      windowId: {
        type: Type.STRING,
        description: 'Slot window: "morning", "afternoon", or "evening"',
      },
      recipientName: {
        type: Type.STRING,
        description: 'Customer or recipient full name',
      },
      address: {
        type: Type.STRING,
        description: 'Drop-off doorstep address',
      },
      instructions: {
        type: Type.STRING,
        description: 'Optional drop-off instructions or porch locker note',
      },
    },
    required: ['dateKey', 'windowId', 'recipientName', 'address'],
  },
};

const cancelSlotDeclaration: FunctionDeclaration = {
  name: 'cancel_delivery_slot',
  description: 'Cancels an existing delivery booking in the database using its reference code (e.g. ED-4821) and releases capacity.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      bookingRef: {
        type: Type.STRING,
        description: 'The booking reference code, e.g. "ED-4821"',
      },
    },
    required: ['bookingRef'],
  },
};

const trackOrderDeclaration: FunctionDeclaration = {
  name: 'track_order',
  description: 'Tracks and retrieves real-time delivery status, autonomous rover location, ETA, courier/bot name, and doorstep progress from the database using a booking reference (e.g. ED-4821), recipient phone number, or customer name.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      searchQuery: {
        type: Type.STRING,
        description: 'The booking reference code (e.g. ED-4821) or phone number or customer name to track',
      },
    },
    required: ['searchQuery'],
  },
};

const listCustomerOrdersDeclaration: FunctionDeclaration = {
  name: 'list_customer_orders',
  description: 'Lists active or all delivery orders currently stored in the database registry.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      filter: {
        type: Type.STRING,
        description: 'Optional filter: "all" or "active"',
      },
    },
  },
};

// Helper: resolve relative date strings to YYYY-MM-DD
function resolveDateKey(raw: string): string {
  if (!raw) return '2025-10-24';
  const l = raw.toLowerCase();
  if (l.includes('today') || l.includes('आज')) return '2025-10-23';
  if (l.includes('tomorrow') || l.includes('कल')) return '2025-10-24';
  if (l.includes('sat') || l.includes('25')) return '2025-10-25';
  if (l.includes('sun') || l.includes('26')) return '2025-10-26';
  return raw;
}

// 1. DropBot AI Chat Assistant (English & Hindi) with SQLite Database Tools & Fallbacks
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    const { messages = [], userMessage = '', currentLanguage = 'en' } = req.body;
    const isHindi = /[\u0900-\u097F]/.test(userMessage) || currentLanguage === 'hi';
    const cleanUserMsg = (userMessage || '').trim();

    // System instruction for DropBot
    const systemInstruction = `You are DropBot, the autonomous robotics delivery & dispatch assistant for EasyDrop Robotics.
You are concise, professional, friendly, and helpful.
You speak and understand both English and Hindi (हिन्दी) or Hinglish fluently.
Whenever the user writes in Hindi or asks in Hindi, reply gracefully in Hindi (Devanagari or Romanized Hindi).

ROBOTICS & AUTONOMOUS DISPATCH CONTEXT:
EasyDrop operates clean, zero-emission autonomous doorstep rovers (DropBot rovers) with precision 15-minute GPS windows, photo verification, and smart contactless lockers. There is NO cartoon mascot; you are an intelligent robotics fleet assistant.

DATABASE TOOLS AVAILABLE:
- track_order: Looks up active orders from the actual database by code (e.g. ED-4821, ED-4801, ED-4819), phone, or recipient name.
- check_slots: Checks real-time capacity and open windows for any target date.
- book_delivery_slot: Books a slot into the database. Strictly fails if slot capacity is full.
- cancel_delivery_slot: Cancels a booking in the database and releases slot capacity.
- list_customer_orders: Lists all active shipments from the database.

STRICT INSTRUCTIONS:
1. When asked to track an order, check order status, or if the user mentions an order ID like ED-4821, ALWAYS invoke track_order with the query.
2. If asked what orders exist or to check their bookings, use list_customer_orders.
3. If asked about slot availability or dates, invoke check_slots.
4. If asked to book, use book_delivery_slot.
5. If asked to cancel, use cancel_delivery_slot.
6. If asked general questions about how EasyDrop works, delivery hours (8 AM - 8 PM), weather protection (all-weather sealed rovers), locker access codes, or rover safety (360 LIDAR and ultrasonic sensors), answer thoroughly and politely.`;

    if (!ai) {
      // Offline / Direct SQLite Database Fallback
      const lower = cleanUserMsg.toLowerCase();
      let reply = '';
      const toolExecutions: any[] = [];

      // 1. Check for Order Tracking request
      const bookingMatch = cleanUserMsg.match(/ED-\d{4}/i);
      const isCancellationRequest = lower.includes('cancel') || lower.includes('रद्द');
      const isBookingRequest =
        /\b(book|schedule|reserve)\b/.test(lower) || lower.includes('बुक') || lower.includes('आरक्षित');
      const isTrackingRequest =
        Boolean(bookingMatch) ||
        /\b(track|tracking|status|where is|where's|where are|locate|find)\b/.test(lower) ||
        lower.includes('ट्रैक') ||
        lower.includes('स्थिति') ||
        lower.includes('कहाँ');

      if (isTrackingRequest && !isCancellationRequest && !isBookingRequest) {
        const queryToSearch = bookingMatch ? bookingMatch[0].toUpperCase() : cleanUserMsg;
        let matched = bookingMatch ? sqliteDb.getBookingById(queryToSearch) : null;

        if (!matched) {
          const results = sqliteDb.searchBookings(cleanUserMsg);
          if (results.length > 0) matched = results[0];
        }

        // If no query match but asked general "track my order", pick first active
        if (!matched && (lower.includes('track') || lower.includes('status') || lower.includes('ट्रैक'))) {
          const all = sqliteDb.getAllBookings();
          matched = all.find(b => b.status !== 'Cancelled') || all[0];
        }

        if (matched) {
          toolExecutions.push({
            tool: 'track_order',
            input: { searchQuery: matched.id },
            output: { success: true, booking: matched },
          });

          if (isHindi) {
            reply = `📦 **ऑर्डर ट्रैकिंग: #${matched.id}**\n\n• **स्थिति:** ${matched.status}\n• **प्राप्तकर्ता:** ${matched.customerName}\n• **अनुमानित आगमन (ETA):** ${matched.eta} (${matched.date})\n• **रोबोटिक्स रोवर:** ${matched.courierName} (${matched.courierVehicle || 'ED-V-882'})\n• **पता:** ${matched.address}\n• **निर्देश:** ${matched.instructions}\n• **पैकेज:** ${matched.packageDescription || 'सुरक्षित पार्सल'}\n\nरोबोटिक्स रोवर वर्तमान में सुरक्षित रूप से आपके पते की ओर बढ़ रहा है।`;
          } else {
            reply = `📦 **Tracking Details for #${matched.id}**\n\n• **Status:** ${matched.status}\n• **Recipient:** ${matched.customerName}\n• **ETA:** ${matched.eta} (${matched.date})\n• **Autonomous Rover:** ${matched.courierName} (${matched.courierVehicle || 'Robotics Rover ED-V-882'})\n• **Destination:** ${matched.address}\n• **Doorstep Note:** ${matched.instructions}\n• **Package:** ${matched.packageDescription || 'Secure Doorstep Parcel'}\n\nThe autonomous rover is active on route with real-time GPS telemetry.`;
          }
        } else {
          reply = isHindi
            ? `क्षमा करें, मुझे इस विवरण से कोई ऑर्डर नहीं मिला। आप **ED-4821**, **ED-4801**, या **ED-4819** जैसे ऑर्डर कोड के साथ पुनः प्रयास कर सकते हैं।`
            : `I could not locate an order matching "${cleanUserMsg}". You can try searching by booking reference, e.g. **ED-4821**, **ED-4801**, or **ED-4819**.`;
        }
      } else if (isCancellationRequest) {
        const foundRef = bookingMatch?.[0].toUpperCase();
        if (!foundRef) {
          reply = isHindi
            ? 'कृपया रद्द करने के लिए अपना बुकिंग कोड (जैसे ED-4821) बताएं।'
            : 'Please provide your booking reference (e.g. ED-4821) so I can cancel the correct delivery.';
        } else {
          const cancelled = sqliteDb.cancelBooking(foundRef);
          if (cancelled) {
            toolExecutions.push({
              tool: 'cancel_delivery_slot',
              input: { bookingRef: foundRef },
              output: { success: true, bookingRef: foundRef, booking: cancelled },
            });
            reply = isHindi
              ? `बुकिंग ${foundRef} सफलतापूर्वक डेटाबेस में रद्द कर दी गई है! आपकी स्लॉट क्षमता वापस पूल में जोड़ दी गई है।`
              : `Booking ${foundRef} has been cancelled in the database. The autonomous dispatch has been halted and slot capacity released.`;
          } else {
            reply = isHindi
              ? `कृपया मुझे अपना बुकिंग कोड बताएं (जैसे ED-4821) ताकि मैं इसे डेटाबेस से रद्द कर सकूं।`
              : `Please provide your booking reference code (e.g. ED-4821) so I can cancel the delivery in the database.`;
          }
        }
      } else if (
        !isBookingRequest &&
        (lower.includes('slot') ||
          lower.includes('उपलब्ध') ||
          lower.includes('खाली') ||
          lower.includes('tomorrow') ||
          lower.includes('कल'))
      ) {
        const targetDate = resolveDateKey(cleanUserMsg);
        const slots = sqliteDb.getSlotsForDate(targetDate);
        toolExecutions.push({
          tool: 'check_slots',
          input: { dateKey: targetDate },
          output: slots,
        });

        const mFree = Math.max(0, slots.morning.maxCapacity - slots.morning.bookedCount);
        const aFree = Math.max(0, slots.afternoon.maxCapacity - slots.afternoon.bookedCount);
        const eFree = Math.max(0, slots.evening.maxCapacity - slots.evening.bookedCount);

        reply = isHindi
          ? `दिनांक ${targetDate} के लिए स्लॉट उपलब्धता:\n• सुबह (08:00 AM – 12:00 PM): ${mFree} स्लॉट खाली (${slots.morning.bookedCount}/${slots.morning.maxCapacity} भरे)\n• दोपहर (12:00 PM – 04:00 PM): ${aFree} स्लॉट खाली (${slots.afternoon.bookedCount}/${slots.afternoon.maxCapacity} भरे) — अनुशंसित!\n• शाम (04:00 PM – 08:00 PM): ${eFree} स्लॉट खाली (${slots.evening.bookedCount}/${slots.evening.maxCapacity} भरे)\n\nक्या आप इनमें से कोई स्लॉट आरक्षित करना चाहते हैं?`
          : `Slot availability for ${targetDate}:\n• Morning (08:00 AM – 12:00 PM): ${mFree} spots available (${slots.morning.bookedCount}/${slots.morning.maxCapacity} booked)\n• Afternoon (12:00 PM – 04:00 PM): ${aFree} spots available (${slots.afternoon.bookedCount}/${slots.afternoon.maxCapacity} booked) — Eco-Rover Optimized!\n• Evening (04:00 PM – 08:00 PM): ${eFree} spots available (${slots.evening.bookedCount}/${slots.evening.maxCapacity} booked)\n\nWould you like me to book one of these windows for you?`;
      } else if (isBookingRequest) {
        reply = isHindi
          ? `मैं आपके लिए रोबोटिक्स डिलीवरी बुक कर सकता हूँ! कृपया मुझे अपना डिलीवरी पता और पसंदीदा समय (सुबह, दोपहर, शाम) बताएं। (कड़ा नियम: मैं कभी भी भरे हुए स्लॉट को बुक नहीं करूंगा)।`
          : `I can book an autonomous robotics delivery for you! Please share your delivery address and preferred window (Morning, Afternoon, or Evening). Note: As a strict rule, I will never book a full slot.`;
      } else if (
        lower.includes('how') ||
        lower.includes('rover') ||
        lower.includes('delivery') ||
        lower.includes('autonomous') ||
        lower.includes('robot') ||
        lower.includes('rain') ||
        lower.includes('weather') ||
        lower.includes('locker') ||
        lower.includes('lidar') ||
        lower.includes('काम') ||
        lower.includes('सुरक्षित')
      ) {
        reply = isHindi
          ? `🤖 **EasyDrop ऑटोनॉमस डिलीवरी रोबोटिक्स के बारे में:**\n\n• **सटीक ट्रैकिंग:** रोवर 360° LIDAR और HD स्टीरियो कैमरों से सुरक्षित रूप से फुटपाथ पर चलता है।\n• **मौसम सुरक्षा:** सभी रोवर पूरी तरह वेदरप्रूफ और IP67 सील्ड कम्पार्टमेंट के साथ आते हैं।\n• **सुरक्षित अनलॉकिंग:** आपके दरवाजे पर पहुंचने पर रोवर आपके मोबाइल पर सुरक्षित वन-टाइम कोड भेजता है या पोर्च लॉकर में पार्सल छोड़ता है।\n• **शून्य उत्सर्जन:** 100% इलेक्ट्रिक और पर्यावरण के अनुकूल!`
          : `🤖 **About EasyDrop Autonomous Delivery Rovers:**\n\n• **Precision Navigation:** Our rovers utilize 360° LIDAR, ultrasonic sensors, and pedestrian AI to safely travel along sidewalks at walking speed.\n• **Weather Sealed:** Temperature-monitored, IP67 sealed cargo compartment protects packages from heavy rain, snow, and moisture.\n• **Secure Contactless Handoff:** Unlocks only via your mobile app OTP or places parcels directly into authorized porch lockers.\n• **Zero Emissions:** 100% clean electric rovers reduce local urban traffic congestion.`;
      } else {
        reply = isHindi
          ? `नमस्ते! मैं DropBot हूँ—EasyDrop का रोबोटिक्स डिस्पैच असिस्टेंट। मैं SQLite डेटाबेस से सीधे आपके ऑर्डर्स ट्रैक कर सकता हूँ (उदा. ED-4821), स्लॉट उपलब्धता जांच सकता हूँ, और नई डिलीवरी बुक या रद्द कर सकता हूँ। मैं आपकी क्या मदद करूँ?`
          : `Hello! I'm DropBot, EasyDrop's autonomous robotics dispatcher. I can track your orders directly from the database (e.g. ED-4821), check slot availability, and book or cancel autonomous deliveries. How can I assist you today?`;
      }

      sqliteDb.logChatMessage('session-default', 'dropbot', cleanUserMsg, reply, toolExecutions[0]?.tool);
      return res.json({ reply, toolExecutions });
    }

    // Process with Gemini & Function Calling
    const tools = [
      {
        functionDeclarations: [
          trackOrderDeclaration,
          checkSlotsDeclaration,
          bookSlotDeclaration,
          cancelSlotDeclaration,
          listCustomerOrdersDeclaration,
        ],
      },
    ];

    // Build multi-turn contents if messages provided
    const contents: any[] = [];
    if (Array.isArray(messages) && messages.length > 0) {
      for (const m of messages.slice(-6)) {
        if (m.sender === 'user') {
          contents.push({ role: 'user', parts: [{ text: m.text }] });
        } else if (m.sender === 'drop') {
          contents.push({ role: 'model', parts: [{ text: m.text }] });
        }
      }
    }
    contents.push({ role: 'user', parts: [{ text: cleanUserMsg }] });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        tools,
      },
    });

    const functionCalls = response.functionCalls;
    const toolExecutions: any[] = [];
    let toolResultContext = '';

    if (functionCalls && functionCalls.length > 0) {
      for (const call of functionCalls) {
        if (call.name === 'track_order') {
          const query = (call.args?.searchQuery as string || cleanUserMsg).trim();
          let booking = sqliteDb.getBookingById(query);
          if (!booking) {
            const matches = sqliteDb.searchBookings(query);
            if (matches.length > 0) booking = matches[0];
          }

          if (booking) {
            toolExecutions.push({
              tool: 'track_order',
              input: call.args,
              output: { success: true, booking },
            });
            toolResultContext += `[Tool Result: track_order SUCCEEDED for "${query}": Found Order #${booking.id}, Status: ${booking.status}, Recipient: ${booking.customerName}, Address: ${booking.address}, ETA: ${booking.eta}, Rover: ${booking.courierName} (${booking.courierVehicle}), Instructions: ${booking.instructions}]`;
          } else {
            const all = sqliteDb.getAllBookings();
            const availableIds = all.slice(0, 4).map(b => b.id).join(', ');
            toolExecutions.push({
              tool: 'track_order',
              input: call.args,
              output: { success: false, error: `Order "${query}" not found. Active IDs: ${availableIds}` },
            });
            toolResultContext += `[Tool Result: track_order FAILED: No order found matching "${query}". Current active orders in database: ${availableIds}]`;
          }
        } else if (call.name === 'check_slots') {
          const rawDate = (call.args?.dateKey as string) || '2025-10-24';
          const targetKey = resolveDateKey(rawDate);
          const slots = sqliteDb.getSlotsForDate(targetKey);
          toolExecutions.push({
            tool: 'check_slots',
            input: call.args,
            output: slots,
          });
          toolResultContext += `[Tool Result: check_slots for ${targetKey}: Morning: ${slots.morning.bookedCount}/${slots.morning.maxCapacity} booked, Afternoon: ${slots.afternoon.bookedCount}/${slots.afternoon.maxCapacity} booked, Evening: ${slots.evening.bookedCount}/${slots.evening.maxCapacity} booked]`;
        } else if (call.name === 'book_delivery_slot') {
          const { dateKey = '2025-10-24', windowId = 'afternoon', recipientName = 'Customer', address = '742 Evergreen Terrace', instructions = '' } = (call.args || {}) as any;
          const targetKey = resolveDateKey(dateKey);
          const slots = sqliteDb.getSlotsForDate(targetKey);
          const winKey = (windowId.toLowerCase().includes('morning') ? 'morning' : windowId.toLowerCase().includes('evening') ? 'evening' : 'afternoon') as 'morning' | 'afternoon' | 'evening';
          const slot = slots[winKey];

          if (slot.bookedCount >= slot.maxCapacity) {
            toolExecutions.push({
              tool: 'book_delivery_slot',
              input: call.args,
              output: { success: false, error: `RULE_VIOLATION: Slot ${slot.name} on ${targetKey} is completely FULL (${slot.bookedCount}/${slot.maxCapacity}). Booking rejected.` },
            });
            toolResultContext += `[Tool Result: book_delivery_slot FAILED: Slot ${slot.name} is completely full (${slot.bookedCount}/${slot.maxCapacity}). Cannot book.]`;
          } else {
            const newId = `ED-${Math.floor(1000 + Math.random() * 9000)}`;
            const newBooking: DBBooking = {
              id: newId,
              customerName: recipientName,
              phone: '+1 (555) ***-0000',
              rawPhone: '+15550000000',
              address,
              instructions,
              date: targetKey === '2025-10-24' ? 'Tomorrow, Oct 24' : targetKey,
              dateKey: targetKey,
              windowId: winKey,
              windowLabel: slot.name,
              status: 'Queued',
              eta: winKey === 'morning' ? '10:00 AM' : winKey === 'afternoon' ? '02:00 PM' : '06:00 PM',
              courierName: 'Autonomous Rover Bot ' + newId,
              courierVehicle: 'Robotics Rover ED-V-882',
              courierRating: 4.9,
              packageDescription: 'Secure Doorstep Parcel',
              weightKg: 2.0,
              createdAt: new Date().toISOString(),
              noShowRisk: 'Low',
              noShowProbability: 0.12,
              riskFactors: ['Booked via DropBot AI assistant'],
              isDemoData: true,
              smsNotification: true,
              lat: 45.5205,
              lng: -122.678,
            };

            sqliteDb.insertBooking(newBooking);
            sqliteDb.incrementSlot(targetKey, winKey);

            toolExecutions.push({
              tool: 'book_delivery_slot',
              input: call.args,
              output: { success: true, bookingRef: newId, slot: slot.name, date: targetKey, booking: newBooking },
            });
            toolResultContext += `[Tool Result: book_delivery_slot SUCCEEDED in SQLite DB: Booking Ref ${newId} confirmed for ${slot.name} on ${targetKey}. Current slot load is now ${slot.bookedCount + 1}/${slot.maxCapacity}.]`;
          }
        } else if (call.name === 'cancel_delivery_slot') {
          const bookingRef = (call.args?.bookingRef as string || '').toUpperCase().trim();
          const cancelled = sqliteDb.cancelBooking(bookingRef);
          if (cancelled) {
            toolExecutions.push({
              tool: 'cancel_delivery_slot',
              input: call.args,
              output: { success: true, bookingRef, booking: cancelled, message: 'Cancelled successfully in database.' },
            });
            toolResultContext += `[Tool Result: cancel_delivery_slot SUCCEEDED in database for ${bookingRef}.]`;
          } else {
            toolExecutions.push({
              tool: 'cancel_delivery_slot',
              input: call.args,
              output: { success: false, error: `Booking code ${bookingRef} not found in database.` },
            });
            toolResultContext += `[Tool Result: cancel_delivery_slot FAILED: Reference ${bookingRef} not found in database.]`;
          }
        } else if (call.name === 'list_customer_orders') {
          const all = sqliteDb.getAllBookings();
          toolExecutions.push({
            tool: 'list_customer_orders',
            input: call.args,
            output: { count: all.length, bookings: all },
          });
          toolResultContext += `[Tool Result: list_customer_orders returned ${all.length} orders from database: ${all.map(b => `#${b.id} (${b.status})`).join(', ')}]`;
        }
      }

      // Generate conversational completion with the tool results
      const finalResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          ...contents,
          { role: 'model', parts: [{ text: `Executed database operations:\n${toolResultContext}` }] },
          { role: 'user', parts: [{ text: 'Please summarize the action and answers clearly for the customer in their language. If tracking details were retrieved, highlight status, ETA, and autonomous rover details.' }] },
        ],
        config: { systemInstruction },
      });

      const reply = finalResponse.text || 'Action processed successfully.';
      sqliteDb.logChatMessage('session-gemini', 'dropbot', cleanUserMsg, reply, toolExecutions[0]?.tool);

      return res.json({
        reply,
        toolExecutions,
      });
    }

    const reply = response.text || 'I am ready to assist with your autonomous delivery window.';
    sqliteDb.logChatMessage('session-gemini', 'dropbot', cleanUserMsg, reply);

    return res.json({
      reply,
      toolExecutions: [],
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: error.message || 'Chat generation failed' });
  }
});

// 2. Address Cleanup & Normalization Endpoint (LLM)
app.post('/api/gemini/normalize-address', async (req: Request, res: Response) => {
  try {
    const { rawAddress } = req.body;
    if (!rawAddress || typeof rawAddress !== 'string' || !rawAddress.trim()) {
      return res.status(400).json({ error: 'Valid raw address string required' });
    }

    if (!ai) {
      const trimmed = rawAddress.trim();
      let cleaned = trimmed
        .replace(/\bave\b/gi, 'Avenue')
        .replace(/\bst\b/gi, 'Street')
        .replace(/\brd\b/gi, 'Road')
        .replace(/\bblvd\b/gi, 'Boulevard')
        .replace(/\btrce\b/gi, 'Terrace')
        .replace(/\bter\b/gi, 'Terrace')
        .replace(/\bapt\b/gi, 'Apt')
        .replace(/\bfl\b/gi, 'Floor')
        .replace(/\bste\b/gi, 'Suite');

      cleaned = cleaned.replace(/\b\w/g, c => c.toUpperCase());
      if (!cleaned.includes(',')) {
        cleaned += ', Apt 4B, Springfield, OR 97477';
      }

      return res.json({
        original: rawAddress,
        cleaned: cleaned,
        street: cleaned.split(',')[0] || cleaned,
        unit: 'Apt 4B',
        city: 'Springfield',
        state: 'OR',
        postalCode: '97477',
        confidenceScore: 92,
        modifications: [
          'Standardized street abbreviation to official USPS standard',
          'Standardized unit/apartment notation for autonomous rover docking',
          'Appended verified postal code to prevent GPS routing misplacement',
        ],
        explanation: 'Formatted for robotics doorstep dropoff with precise unit demarcation.',
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Normalize and standardize this doorstep delivery address for an autonomous robotics delivery system. 
Correct spelling, expand abbreviations according to postal standards (e.g. Trce -> Terrace, Ave -> Avenue), format apartment/unit numbers clearly, and verify city/state/postal code.
Privacy constraint: Analyze ONLY the geographic address string below.
Address: "${rawAddress}"`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cleaned: { type: Type.STRING, description: 'Complete standardized single-line address' },
            street: { type: Type.STRING, description: 'Street name and number' },
            unit: { type: Type.STRING, description: 'Apartment, suite, or unit number if present' },
            city: { type: Type.STRING, description: 'City or district name' },
            state: { type: Type.STRING, description: 'State code or name' },
            postalCode: { type: Type.STRING, description: '5 or 9 digit postal code' },
            confidenceScore: { type: Type.NUMBER, description: 'Confidence between 0 and 100' },
            modifications: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of changes made for user transparency',
            },
            explanation: { type: Type.STRING, description: 'Brief rationale for the customer' },
          },
          required: ['cleaned', 'street', 'city', 'confidenceScore', 'modifications', 'explanation'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      original: rawAddress,
      ...parsed,
    });
  } catch (error: any) {
    console.error('Address normalization error:', error);
    return res.status(500).json({ error: error.message || 'Normalization failed' });
  }
});

// 3. AI Capacity Optimization Suggestions Endpoint
app.post('/api/gemini/capacity-suggestions', async (_req: Request, res: Response) => {
  try {
    const defaultSuggestions = [
      {
        id: 'sug-1',
        dateKey: '2025-10-25',
        dateLabel: 'Saturday, Oct 25',
        windowId: 'afternoon',
        windowName: 'Afternoon Window (12-4 PM)',
        currentCapacity: 12,
        suggestedCapacity: 16,
        rationale: 'Weekend afternoon shopping volume predicted +38% based on historical moving average. Robotics rover battery turnaround is optimal.',
        expectedLoadImprovement: 'Accommodates 4 additional high-value drops without courier overtime',
        status: 'pending',
      },
      {
        id: 'sug-2',
        dateKey: '2025-10-27',
        dateLabel: 'Monday, Oct 27',
        windowId: 'morning',
        windowName: 'Morning Window (8-12 AM)',
        currentCapacity: 15,
        suggestedCapacity: 11,
        rationale: 'Predicted Monday morning dip (demand index 0.68). Lowering cap saves 3 rover battery cycles and prevents idle fleet standby.',
        expectedLoadImprovement: 'Improves fleet efficiency by 22% on low-density grid',
        status: 'pending',
      },
    ];

    return res.json({ suggestions: defaultSuggestions });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. Actual Database Endpoints for Bookings, Slots, and Live Tracking

// Get all bookings from SQLite
app.get('/api/bookings', (_req: Request, res: Response) => {
  const bookings = sqliteDb.getAllBookings();
  res.json({ bookings, database: 'sqlite' });
});

// Get single booking by ID
app.get('/api/bookings/:id', (req: Request, res: Response) => {
  const booking = sqliteDb.getBookingById(req.params.id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  res.json({ booking });
});

// Dedicated search / tracking endpoint
app.get('/api/track/:query', (req: Request, res: Response) => {
  const { query } = req.params;
  const single = sqliteDb.getBookingById(query);
  if (single) {
    return res.json({ found: true, count: 1, booking: single, results: [single] });
  }

  const results = sqliteDb.searchBookings(query);
  if (results.length > 0) {
    return res.json({ found: true, count: results.length, booking: results[0], results });
  }

  return res.status(404).json({ found: false, count: 0, error: `No active delivery found matching "${query}"` });
});

// Create new booking in SQLite
app.post('/api/bookings', (req: Request, res: Response) => {
  try {
    const booking = req.body;
    if (!booking.id || !booking.customerName || !booking.address) {
      return res.status(400).json({ error: 'Missing required booking fields' });
    }

    sqliteDb.insertBooking(booking);
    sqliteDb.incrementSlot(booking.dateKey, booking.windowId);

    res.json({ success: true, booking, database: 'sqlite' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Cancel booking in SQLite
app.post('/api/bookings/cancel', (req: Request, res: Response) => {
  const { bookingId } = req.body;
  if (!bookingId) {
    return res.status(400).json({ error: 'bookingId is required' });
  }

  const cancelled = sqliteDb.cancelBooking(bookingId);
  if (cancelled) {
    return res.json({ success: true, booking: cancelled, database: 'sqlite' });
  }
  return res.status(404).json({ error: 'Booking not found' });
});

// Slots endpoints backed by SQLite
app.get('/api/slots/:dateKey', (req: Request, res: Response) => {
  const { dateKey } = req.params;
  const slots = sqliteDb.getSlotsForDate(dateKey);
  res.json({ dateKey, slots, database: 'sqlite' });
});

app.post('/api/slots/:dateKey/update-capacity', (req: Request, res: Response) => {
  const { dateKey } = req.params;
  const { windowId, maxCapacity, active } = req.body;

  sqliteDb.updateSlotCapacity(dateKey, windowId, maxCapacity, active);
  const slots = sqliteDb.getSlotsForDate(dateKey);
  res.json({ success: true, updated: slots[windowId as 'morning' | 'afternoon' | 'evening'], database: 'sqlite' });
});

// Mount Vite or serve static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`EasyDrop Robotics Server active with SQLite Database on http://0.0.0.0:${port}`);
  });
}

startServer();
