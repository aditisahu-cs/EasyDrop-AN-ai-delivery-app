export type SlotWindowId = 'morning' | 'afternoon' | 'evening';

export interface SlotWindow {
  id: SlotWindowId;
  name: string;
  timeSpan: string;
  description: string;
  maxCapacity: number;
  bookedCount: number;
  fee: number; // 0 for free
  ecoFriendly?: boolean;
  active: boolean;
}

export interface DaySlotInfo {
  dateString: string; // e.g. "2025-10-23"
  label: string; // e.g. "Today, Oct 23"
  dayName: string; // e.g. "Today" or "FRI"
  dayNumber: string; // e.g. "23"
  status: 'open' | 'few_left' | 'eco_free' | 'fast' | 'full' | 'past' | 'blackout';
  statusLabel?: string;
  isBlackout?: boolean;
  blackoutReason?: string;
  weather: {
    temp: string;
    condition: string;
    description: string;
  };
  slots: Record<SlotWindowId, SlotWindow>;
}

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes: string;
  pastBookingsCount: number;
  preferredWindow: SlotWindowId;
  noShowHistoryRate: number; // e.g. 0.05
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Booking {
  id: string; // e.g. "ED-4821"
  customerName: string;
  phone: string; // Masked for display: +1 (555) ***-8901
  rawPhone: string;
  address: string;
  cleanedAddress?: string;
  addressNormalized?: boolean;
  instructions: string;
  date: string; // e.g. "Tomorrow, Oct 24"
  dateKey: string; // e.g. "2025-10-24"
  windowId: SlotWindowId;
  windowLabel: string; // e.g. "Afternoon (12:00 PM – 4:00 PM)"
  status: 'In Transit' | 'Queued' | 'Driver Assigned' | 'Completed' | 'Cancelled';
  eta: string;
  courierName?: string;
  courierVehicle?: string;
  courierRating?: number;
  packageDescription?: string;
  weightKg?: number;
  createdAt: string;
  // ML / AI features:
  noShowRisk: 'Low' | 'Medium' | 'High';
  noShowProbability: number; // 0.0 to 1.0
  riskFactors: string[];
  isDemoData: boolean;
  smsNotification?: boolean;
  coordinates?: Coordinates;
}

export interface SmartSlotRecommendation {
  recommendedWindowId: SlotWindowId;
  recommendedDateString: string;
  confidenceScore: number; // 0 - 100
  reasoning: string;
  balancingScore: number;
  preferenceMatch: boolean;
}

export interface DemandForecastPoint {
  date: string;
  dayLabel: string;
  morningPredicted: number;
  morningCapacity: number;
  afternoonPredicted: number;
  afternoonCapacity: number;
  eveningPredicted: number;
  eveningCapacity: number;
  totalPredicted: number;
  historicalBaseline: number;
  weatherFactor: string;
  surgeAlert?: boolean;
}

export interface AICapacitySuggestion {
  id: string;
  dateKey: string;
  dateLabel: string;
  windowId: SlotWindowId;
  windowName: string;
  currentCapacity: number;
  suggestedCapacity: number;
  rationale: string;
  expectedLoadImprovement: string;
  status: 'pending' | 'approved' | 'dismissed';
}

export interface AddressCleanResult {
  original: string;
  cleaned: string;
  street: string;
  unit: string;
  city: string;
  state: string;
  postalCode: string;
  confidenceScore: number;
  modifications: string[];
  explanation: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'drop' | 'system';
  text: string;
  timestamp: string;
  language?: 'en' | 'hi';
  actionTaken?: {
    type: 'book' | 'cancel' | 'check' | 'recommend';
    details?: string;
    bookingRef?: string;
    success?: boolean;
  };
}
