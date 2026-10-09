import { CustomerProfile, DaySlotInfo, DemandForecastPoint, AICapacitySuggestion, Booking, SmartSlotRecommendation, SlotWindowId, Coordinates } from '../types';

export const ROBOTICS_HUB_COORDINATES: Coordinates = {
  lat: 45.5205,
  lng: -122.6780,
};

// Deterministic coordinate generator for addresses or fallback locations
export function getCoordinatesForAddress(address: string): Coordinates {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = (hash << 5) - hash + address.charCodeAt(i);
    hash |= 0;
  }
  // Generate bounded offset around robotics grid: lat ~45.508 to 45.535, lng ~ -122.695 to -122.655
  const latOffset = (((Math.abs(hash) % 1000) / 1000) - 0.5) * 0.026;
  const lngOffset = ((((Math.abs(hash >> 3)) % 1000) / 1000) - 0.5) * 0.038;
  return {
    lat: Number((ROBOTICS_HUB_COORDINATES.lat + latOffset).toFixed(4)),
    lng: Number((ROBOTICS_HUB_COORDINATES.lng + lngOffset).toFixed(4)),
  };
}

export const DEMO_CUSTOMER: CustomerProfile = {
  id: 'cust-sarah-104',
  name: 'Sarah Jenkins',
  phone: '+1 (555) 382-9012',
  address: '742 Evergreen Terrace, Apt 4B',
  notes: 'Ring smart doorbell twice. If not answering, leave securely behind front porch planter.',
  pastBookingsCount: 14,
  preferredWindow: 'afternoon',
  noShowHistoryRate: 0.0,
};

export const INITIAL_7_DAYS: DaySlotInfo[] = [
  {
    dateString: '2025-10-23',
    label: 'Today, Oct 23',
    dayName: 'TODAY',
    dayNumber: '23',
    status: 'few_left',
    statusLabel: 'Cut-off near',
    weather: { temp: '68°F', condition: 'Sunny', description: 'Optimal conditions. Clear skies along robotics route.' },
    slots: {
      morning: { id: 'morning', name: 'Morning Window', timeSpan: '08:00 AM – 12:00 PM', description: 'Robotics Express • Hub Rover Alpha', maxCapacity: 15, bookedCount: 15, fee: 3.5, active: true },
      afternoon: { id: 'afternoon', name: 'Afternoon Window', timeSpan: '12:00 PM – 04:00 PM', description: 'Autonomous Eco-Rover • Zero Idle', maxCapacity: 12, bookedCount: 11, fee: 0, ecoFriendly: true, active: true },
      evening: { id: 'evening', name: 'Evening Window', timeSpan: '04:00 PM – 08:00 PM', description: 'Night Transit • Sensor Navigation', maxCapacity: 10, bookedCount: 10, fee: 4.0, active: false },
    },
  },
  {
    dateString: '2025-10-24',
    label: 'Tomorrow, Oct 24',
    dayName: 'Tomorrow',
    dayNumber: '24',
    status: 'open',
    statusLabel: 'High availability',
    weather: { temp: '65°F', condition: 'Partly Cloudy', description: 'Mild breeze. Clean radar reflectivity for rovers.' },
    slots: {
      morning: { id: 'morning', name: 'Morning Window', timeSpan: '08:00 AM – 12:00 PM', description: 'Autonomous Porch Drop • Rover Beta-2', maxCapacity: 15, bookedCount: 11, fee: 3.5, active: true },
      afternoon: { id: 'afternoon', name: 'Afternoon Window', timeSpan: '12:00 PM – 04:00 PM', description: 'Autonomous Eco-Rover • Zero Idle', maxCapacity: 12, bookedCount: 9, fee: 0, ecoFriendly: true, active: true },
      evening: { id: 'evening', name: 'Evening Window', timeSpan: '04:00 PM – 08:00 PM', description: 'Twilight Porch Drop • Smart Lock Box', maxCapacity: 10, bookedCount: 8, fee: 2.0, active: true },
    },
  },
  {
    dateString: '2025-10-25',
    label: 'Saturday, Oct 25',
    dayName: 'SAT',
    dayNumber: '25',
    status: 'eco_free',
    statusLabel: 'Weekend Eco',
    weather: { temp: '70°F', condition: 'Sunny', description: 'Clear weekend roads. Ideal ground rover efficiency.' },
    slots: {
      morning: { id: 'morning', name: 'Morning Window', timeSpan: '08:00 AM – 12:00 PM', description: 'Weekend Morning Rover Run', maxCapacity: 15, bookedCount: 6, fee: 3.0, active: true },
      afternoon: { id: 'afternoon', name: 'Afternoon Window', timeSpan: '12:00 PM – 04:00 PM', description: 'Weekend High-Density Batch Run', maxCapacity: 16, bookedCount: 14, fee: 0, ecoFriendly: true, active: true },
      evening: { id: 'evening', name: 'Evening Window', timeSpan: '04:00 PM – 08:00 PM', description: 'Evening Autonomous Porch Delivery', maxCapacity: 10, bookedCount: 4, fee: 2.5, active: true },
    },
  },
  {
    dateString: '2025-10-26',
    label: 'Sunday, Oct 26',
    dayName: 'SUN',
    dayNumber: '26',
    status: 'eco_free',
    statusLabel: 'Eco Free',
    weather: { temp: '66°F', condition: 'Clear', description: 'Quiet neighborhood traffic. Fast sidewalk transit.' },
    slots: {
      morning: { id: 'morning', name: 'Morning Window', timeSpan: '08:00 AM – 12:00 PM', description: 'Quiet Sunday Morning Robotics Run', maxCapacity: 15, bookedCount: 5, fee: 2.5, active: true },
      afternoon: { id: 'afternoon', name: 'Afternoon Window', timeSpan: '12:00 PM – 04:00 PM', description: 'Consolidated Eco-Van & Rover Drop', maxCapacity: 12, bookedCount: 7, fee: 0, ecoFriendly: true, active: true },
      evening: { id: 'evening', name: 'Evening Window', timeSpan: '04:00 PM – 08:00 PM', description: 'Sunday Dusk Autonomous Delivery', maxCapacity: 10, bookedCount: 3, fee: 2.0, active: true },
    },
  },
  {
    dateString: '2025-10-27',
    label: 'Monday, Oct 27',
    dayName: 'MON',
    dayNumber: '27',
    status: 'open',
    statusLabel: 'Open',
    weather: { temp: '62°F', condition: 'Cloudy', description: 'Light overcast. All rover ultrasonic sensors calibrated.' },
    slots: {
      morning: { id: 'morning', name: 'Morning Window', timeSpan: '08:00 AM – 12:00 PM', description: 'Weekday Priority Robotics Dispatch', maxCapacity: 12, bookedCount: 4, fee: 3.5, active: true },
      afternoon: { id: 'afternoon', name: 'Afternoon Window', timeSpan: '12:00 PM – 04:00 PM', description: 'Standard Afternoon Doorstep Run', maxCapacity: 12, bookedCount: 5, fee: 0, ecoFriendly: true, active: true },
      evening: { id: 'evening', name: 'Evening Window', timeSpan: '04:00 PM – 08:00 PM', description: 'Commuter Evening Arrival Window', maxCapacity: 10, bookedCount: 6, fee: 2.5, active: true },
    },
  },
  {
    dateString: '2025-10-28',
    label: 'Tuesday, Oct 28',
    dayName: 'TUE',
    dayNumber: '28',
    status: 'open',
    statusLabel: 'Open',
    weather: { temp: '64°F', condition: 'Sunny', description: 'Sunny & dry. 100% solar charging on dock stations.' },
    slots: {
      morning: { id: 'morning', name: 'Morning Window', timeSpan: '08:00 AM – 12:00 PM', description: 'Solar-Charged Morning Robotics Window', maxCapacity: 15, bookedCount: 3, fee: 3.5, active: true },
      afternoon: { id: 'afternoon', name: 'Afternoon Window', timeSpan: '12:00 PM – 04:00 PM', description: 'Autonomous High-Efficiency Run', maxCapacity: 12, bookedCount: 4, fee: 0, ecoFriendly: true, active: true },
      evening: { id: 'evening', name: 'Evening Window', timeSpan: '04:00 PM – 08:00 PM', description: 'Late Doorstep Secure Locker Window', maxCapacity: 10, bookedCount: 2, fee: 2.0, active: true },
    },
  },
  {
    dateString: '2025-10-29',
    label: 'Wednesday, Oct 29',
    dayName: 'WED',
    dayNumber: '29',
    status: 'open',
    statusLabel: 'Open',
    weather: { temp: '61°F', condition: 'Showers', description: 'Light mist. Waterproof rover chassis IP67 active.' },
    slots: {
      morning: { id: 'morning', name: 'Morning Window', timeSpan: '08:00 AM – 12:00 PM', description: 'Weather-Shielded Morning Dispatch', maxCapacity: 15, bookedCount: 2, fee: 3.5, active: true },
      afternoon: { id: 'afternoon', name: 'Afternoon Window', timeSpan: '12:00 PM – 04:00 PM', description: 'Midday Autonomous Rover Delivery', maxCapacity: 12, bookedCount: 3, fee: 0, ecoFriendly: true, active: true },
      evening: { id: 'evening', name: 'Evening Window', timeSpan: '04:00 PM – 08:00 PM', description: 'Evening Safe Drop Run', maxCapacity: 10, bookedCount: 1, fee: 2.0, active: true },
    },
  },
];

export const INITIAL_BOOKINGS: Booking[] = [
  // --- Today, Oct 23 ---
  {
    id: 'ED-4801',
    customerName: 'Marcus Brody',
    phone: '+1 (555) ***-3190',
    rawPhone: '+15553190412',
    address: '320 NW 12th Avenue',
    instructions: 'Autonomous delivery ramp accessible near building entrance.',
    date: 'Today, Oct 23',
    dateKey: '2025-10-23',
    windowId: 'morning',
    windowLabel: 'Morning (08:00 AM – 12:00 PM)',
    status: 'In Transit',
    eta: '11:15 AM',
    courierName: 'Autonomous Rover Bot Alpha-4',
    courierVehicle: 'Robotics Rover ED-V-882 (LIDAR)',
    courierRating: 4.98,
    packageDescription: 'Roaster Single-Origin Coffee Beans',
    weightKg: 1.1,
    createdAt: '2025-10-23 07:15',
    noShowRisk: 'Low',
    noShowProbability: 0.06,
    riskFactors: ['Active customer', 'Ramp clearance verified'],
    isDemoData: true,
    smsNotification: true,
    coordinates: { lat: 45.5255, lng: -122.6835 },
  },
  {
    id: 'ED-4802',
    customerName: 'Amara Okafor',
    phone: '+1 (555) ***-6731',
    rawPhone: '+15556731102',
    address: '512 Beacon Hill Crest',
    instructions: 'Leave at front entryway mat. Beware of indoor cat if door opens.',
    date: 'Today, Oct 23',
    dateKey: '2025-10-23',
    windowId: 'afternoon',
    windowLabel: 'Afternoon (12:00 PM – 4:00 PM)',
    status: 'Completed',
    eta: '03:10 PM',
    courierName: 'Autonomous Rover Bot Alpha-4',
    courierVehicle: 'Robotics Rover ED-V-882',
    courierRating: 4.98,
    packageDescription: 'Organic Linen Throw Blanket',
    weightKg: 0.9,
    createdAt: '2025-10-22 18:20',
    noShowRisk: 'Low',
    noShowProbability: 0.11,
    riskFactors: ['Repeat customer', 'Standard porch entry'],
    isDemoData: true,
    smsNotification: true,
    coordinates: { lat: 45.5120, lng: -122.6910 },
  },
  {
    id: 'ED-4805',
    customerName: 'Chloe Sterling',
    phone: '+1 (555) ***-7734',
    rawPhone: '+15557734190',
    address: '640 SE Belmont Street',
    instructions: 'Leave parcel inside vestibule lock box #3.',
    date: 'Today, Oct 23',
    dateKey: '2025-10-23',
    windowId: 'evening',
    windowLabel: 'Evening (04:00 PM – 08:00 PM)',
    status: 'Driver Assigned',
    eta: '06:15 PM',
    courierName: 'Autonomous Rover Bot Delta-9',
    courierVehicle: 'Robotics Rover ED-V-819',
    courierRating: 4.95,
    packageDescription: 'Artisan Glass Tableware',
    weightKg: 2.2,
    createdAt: '2025-10-23 08:45',
    noShowRisk: 'Low',
    noShowProbability: 0.14,
    riskFactors: ['Secure lockbox specified'],
    isDemoData: true,
    smsNotification: true,
    coordinates: { lat: 45.5160, lng: -122.6590 },
  },

  // --- Tomorrow, Oct 24 ---
  {
    id: 'ED-4809',
    customerName: 'Tatsuya Mori',
    phone: '+1 (555) ***-4421',
    rawPhone: '+15554421990',
    address: '890 Cherry Blossom Lane',
    instructions: 'Place inside insulated porch locker ED-Lock #99.',
    date: 'Tomorrow, Oct 24',
    dateKey: '2025-10-24',
    windowId: 'morning',
    windowLabel: 'Morning (08:00 AM – 12:00 PM)',
    status: 'In Transit',
    eta: '09:45 AM',
    courierName: 'Autonomous Rover Bot K-7',
    courierVehicle: 'Robotics Rover ED-V-704',
    courierRating: 4.99,
    packageDescription: 'Cold-Pressed Botanical Oils',
    weightKg: 1.2,
    createdAt: '2025-10-23 15:10',
    noShowRisk: 'Low',
    noShowProbability: 0.05,
    riskFactors: ['Automated smart porch locker connected', 'Verified resident'],
    isDemoData: true,
    smsNotification: true,
    coordinates: { lat: 45.5310, lng: -122.6730 },
  },
  {
    id: 'ED-4819',
    customerName: 'David Rodrigues',
    phone: '+1 (555) ***-8172',
    rawPhone: '+15553928172',
    address: '1104 Pine Valley Boulevard',
    instructions: 'Signature required on parcel arrival. Autonomous lockbox release.',
    date: 'Tomorrow, Oct 24',
    dateKey: '2025-10-24',
    windowId: 'afternoon',
    windowLabel: 'Afternoon (12:00 PM – 4:00 PM)',
    status: 'Queued',
    eta: '01:40 PM',
    courierName: 'Autonomous Rover Bot Delta-9',
    courierVehicle: 'Robotics Rover ED-V-819',
    courierRating: 4.95,
    packageDescription: 'Precision Robotic Sensors Kit',
    weightKg: 2.4,
    createdAt: '2025-10-23 11:15',
    noShowRisk: 'Medium',
    noShowProbability: 0.38,
    riskFactors: ['Signature required at doorstep', 'No gate access code provided', 'Past 1 delayed retrieval'],
    isDemoData: true,
    smsNotification: true,
    coordinates: { lat: 45.5242, lng: -122.6685 },
  },
  {
    id: 'ED-4821',
    customerName: 'Sarah Jenkins',
    phone: '+1 (555) ***-9012',
    rawPhone: '+15553829012',
    address: '742 Evergreen Terrace, Apt 4B',
    instructions: 'Ring smart doorbell twice. If not answering, leave securely behind front porch planter.',
    date: 'Tomorrow, Oct 24',
    dateKey: '2025-10-24',
    windowId: 'afternoon',
    windowLabel: 'Afternoon (12:00 PM – 4:00 PM)',
    status: 'In Transit',
    eta: '02:15 PM',
    courierName: 'Autonomous Rover Bot Alpha-4',
    courierVehicle: 'Robotics Rover ED-V-882 (LIDAR)',
    courierRating: 4.98,
    packageDescription: 'Artisan Ceramic Teapot & Mug Set',
    weightKg: 1.8,
    createdAt: '2025-10-23 09:30',
    noShowRisk: 'Low',
    noShowProbability: 0.08,
    riskFactors: ['Frequent receiver (14 previous drops)', 'Explicit doorstep instructions provided', 'Verified phone'],
    isDemoData: true,
    smsNotification: true,
    coordinates: { lat: 45.5185, lng: -122.6792 },
  },
  {
    id: 'ED-4815',
    customerName: 'Elena Rostova',
    phone: '+1 (555) ***-8910',
    rawPhone: '+15557788910',
    address: '29 Harbor Heights Way, Suite 300',
    instructions: 'Commercial building, drop at autonomous robotics docking bay.',
    date: 'Tomorrow, Oct 24',
    dateKey: '2025-10-24',
    windowId: 'evening',
    windowLabel: 'Evening (04:00 PM – 08:00 PM)',
    status: 'Driver Assigned',
    eta: '05:20 PM',
    courierName: 'Autonomous Rover Bot Omega-2',
    courierVehicle: 'Robotics Rover ED-V-901',
    courierRating: 4.92,
    packageDescription: 'Commercial Hardware Prototype',
    weightKg: 3.1,
    createdAt: '2025-10-23 13:40',
    noShowRisk: 'High',
    noShowProbability: 0.74,
    riskFactors: ['Commercial building after 5:00 PM security lock', 'High historical cancellation rate (35%)', 'No reception contact pin'],
    isDemoData: true,
    smsNotification: false,
    coordinates: { lat: 45.5098, lng: -122.6854 },
  },

  // --- Saturday, Oct 25 ---
  {
    id: 'ED-4830',
    customerName: 'Liam Vance',
    phone: '+1 (555) ***-6029',
    rawPhone: '+15556029182',
    address: '1420 SW Broadway, Penthouse 6',
    instructions: 'Concierge intercom #1420. Rover can access residential elevator bay.',
    date: 'Saturday, Oct 25',
    dateKey: '2025-10-25',
    windowId: 'morning',
    windowLabel: 'Morning (08:00 AM – 12:00 PM)',
    status: 'Queued',
    eta: '10:30 AM',
    courierName: 'Autonomous Rover Bot K-7',
    courierVehicle: 'Robotics Rover ED-V-704',
    courierRating: 4.99,
    packageDescription: 'Organic Cold Brew Starter Pack',
    weightKg: 1.4,
    createdAt: '2025-10-23 16:20',
    noShowRisk: 'Low',
    noShowProbability: 0.09,
    riskFactors: ['Concierge intercom provided', 'Repeat user'],
    isDemoData: true,
    smsNotification: true,
    coordinates: { lat: 45.5145, lng: -122.6820 },
  },
  {
    id: 'ED-4834',
    customerName: 'Sophia Chen',
    phone: '+1 (555) ***-4891',
    rawPhone: '+15554891209',
    address: '908 NE Alberta Street',
    instructions: 'Leave behind green porch screen on driveway side.',
    date: 'Saturday, Oct 25',
    dateKey: '2025-10-25',
    windowId: 'afternoon',
    windowLabel: 'Afternoon (12:00 PM – 4:00 PM)',
    status: 'Queued',
    eta: '01:15 PM',
    courierName: 'Autonomous Rover Bot Alpha-4',
    courierVehicle: 'Robotics Rover ED-V-882',
    courierRating: 4.98,
    packageDescription: 'Ergonomic Mechanical Keyboard',
    weightKg: 1.9,
    createdAt: '2025-10-23 17:05',
    noShowRisk: 'Low',
    noShowProbability: 0.07,
    riskFactors: ['Clear porch screen description', 'Eco afternoon window'],
    isDemoData: true,
    smsNotification: true,
    coordinates: { lat: 45.5589, lng: -122.6560 },
  },
  {
    id: 'ED-4838',
    customerName: 'Jordan Miller',
    phone: '+1 (555) ***-2384',
    rawPhone: '+15552384911',
    address: '2150 NW Kearney Street',
    instructions: 'Door code *8912# to enter courtyard. Safe drop at Unit 12.',
    date: 'Saturday, Oct 25',
    dateKey: '2025-10-25',
    windowId: 'evening',
    windowLabel: 'Evening (04:00 PM – 08:00 PM)',
    status: 'Queued',
    eta: '05:45 PM',
    courierName: 'Autonomous Rover Bot Delta-9',
    courierVehicle: 'Robotics Rover ED-V-819',
    courierRating: 4.95,
    packageDescription: 'Smart Home Air Sensor',
    weightKg: 0.8,
    createdAt: '2025-10-23 18:30',
    noShowRisk: 'Medium',
    noShowProbability: 0.22,
    riskFactors: ['Courtyard gate code required'],
    isDemoData: true,
    smsNotification: true,
    coordinates: { lat: 45.5298, lng: -122.6970 },
  },

  // --- Sunday, Oct 26 ---
  {
    id: 'ED-4842',
    customerName: 'Aria Patel',
    phone: '+1 (555) ***-5120',
    rawPhone: '+15555120844',
    address: '1845 SE Hawthorne Boulevard',
    instructions: 'Drop in automated parcel chute beside porch steps.',
    date: 'Sunday, Oct 26',
    dateKey: '2025-10-26',
    windowId: 'afternoon',
    windowLabel: 'Afternoon (12:00 PM – 4:00 PM)',
    status: 'Queued',
    eta: '02:00 PM',
    courierName: 'Autonomous Rover Bot Alpha-4',
    courierVehicle: 'Robotics Rover ED-V-882',
    courierRating: 4.98,
    packageDescription: 'Artisan Sourdough & Pantry Box',
    weightKg: 2.5,
    createdAt: '2025-10-23 19:10',
    noShowRisk: 'Low',
    noShowProbability: 0.04,
    riskFactors: ['Automated parcel chute on-site'],
    isDemoData: true,
    smsNotification: true,
    coordinates: { lat: 45.5122, lng: -122.6465 },
  },
  {
    id: 'ED-4846',
    customerName: 'Leo Washington',
    phone: '+1 (555) ***-9932',
    rawPhone: '+15559932147',
    address: '412 NW 23rd Avenue, Apt 2',
    instructions: 'Ring buzzer #2. Porch drop if no answer.',
    date: 'Sunday, Oct 26',
    dateKey: '2025-10-26',
    windowId: 'morning',
    windowLabel: 'Morning (08:00 AM – 12:00 PM)',
    status: 'Queued',
    eta: '09:30 AM',
    courierName: 'Autonomous Rover Bot K-7',
    courierVehicle: 'Robotics Rover ED-V-704',
    courierRating: 4.99,
    packageDescription: 'Acoustic Soundproofing Foam',
    weightKg: 1.3,
    createdAt: '2025-10-23 19:40',
    noShowRisk: 'Low',
    noShowProbability: 0.12,
    riskFactors: ['Direct sidewalk access'],
    isDemoData: true,
    smsNotification: true,
    coordinates: { lat: 45.5255, lng: -122.6990 },
  },
];

// Seeded 7-Day Demand Forecast Dataset (using Moving Average + Gradient Boosted Simulation)
export const SEED_DEMAND_FORECAST: DemandForecastPoint[] = [
  {
    date: '2025-10-23',
    dayLabel: 'Today (Thu)',
    morningPredicted: 14,
    morningCapacity: 15,
    afternoonPredicted: 12,
    afternoonCapacity: 12,
    eveningPredicted: 9,
    eveningCapacity: 10,
    totalPredicted: 35,
    historicalBaseline: 31,
    weatherFactor: 'Clear (+3%)',
  },
  {
    date: '2025-10-24',
    dayLabel: 'Fri, Oct 24',
    morningPredicted: 13,
    morningCapacity: 15,
    afternoonPredicted: 12,
    afternoonCapacity: 12,
    eveningPredicted: 10,
    eveningCapacity: 10,
    totalPredicted: 35,
    historicalBaseline: 32,
    weatherFactor: 'Optimal (+5%)',
    surgeAlert: true,
  },
  {
    date: '2025-10-25',
    dayLabel: 'Sat, Oct 25',
    morningPredicted: 9,
    morningCapacity: 15,
    afternoonPredicted: 17, // Surging!
    afternoonCapacity: 16,
    eveningPredicted: 8,
    eveningCapacity: 10,
    totalPredicted: 34,
    historicalBaseline: 29,
    weatherFactor: 'Sunny Weekend (+18% Afternoon Surge)',
    surgeAlert: true,
  },
  {
    date: '2025-10-26',
    dayLabel: 'Sun, Oct 26',
    morningPredicted: 7,
    morningCapacity: 15,
    afternoonPredicted: 11,
    afternoonCapacity: 12,
    eveningPredicted: 6,
    eveningCapacity: 10,
    totalPredicted: 24,
    historicalBaseline: 25,
    weatherFactor: 'Quiet Sunday (-8%)',
  },
  {
    date: '2025-10-27',
    dayLabel: 'Mon, Oct 27',
    morningPredicted: 8,
    morningCapacity: 12,
    afternoonPredicted: 9,
    afternoonCapacity: 12,
    eveningPredicted: 9,
    eveningCapacity: 10,
    totalPredicted: 26,
    historicalBaseline: 28,
    weatherFactor: 'Cloudy (-5%)',
  },
  {
    date: '2025-10-28',
    dayLabel: 'Tue, Oct 28',
    morningPredicted: 10,
    morningCapacity: 15,
    afternoonPredicted: 11,
    afternoonCapacity: 12,
    eveningPredicted: 7,
    eveningCapacity: 10,
    totalPredicted: 28,
    historicalBaseline: 27,
    weatherFactor: 'Clear (+2%)',
  },
  {
    date: '2025-10-29',
    dayLabel: 'Wed, Oct 29',
    morningPredicted: 11,
    morningCapacity: 15,
    afternoonPredicted: 10,
    afternoonCapacity: 12,
    eveningPredicted: 8,
    eveningCapacity: 10,
    totalPredicted: 29,
    historicalBaseline: 28,
    weatherFactor: 'Light Rain (-2%)',
  },
];

export const INITIAL_AI_CAPACITY_SUGGESTIONS: AICapacitySuggestion[] = [
  {
    id: 'sug-1',
    dateKey: '2025-10-25',
    dateLabel: 'Saturday, Oct 25',
    windowId: 'afternoon',
    windowName: 'Afternoon Window (12:00 PM – 4:00 PM)',
    currentCapacity: 12,
    suggestedCapacity: 16,
    rationale: 'Weekend demand forecasting model predicts 17 package requests. Expanding by +4 caps accommodates surging residential deliveries with 0 extra courier trucks (routes to 2 standby autonomous ground rovers).',
    expectedLoadImprovement: 'Accommodates +33% surge with 99.4% on-time guarantee',
    status: 'pending',
  },
  {
    id: 'sug-2',
    dateKey: '2025-10-27',
    dateLabel: 'Monday, Oct 27',
    windowId: 'morning',
    windowName: 'Morning Window (8:00 AM – 12:00 PM)',
    currentCapacity: 15,
    suggestedCapacity: 11,
    rationale: 'Low historical morning volume on Mondays (8 forecasted vs 15 slots). Dialing cap down prevents robot rovers from idling in transit hubs and conserves green battery grid charge.',
    expectedLoadImprovement: 'Conserves 4 rover battery cycles, boosts fleet utilization to 88%',
    status: 'pending',
  },
];

export const INITIAL_BLOCKED_DAYS = [
  {
    date: '2025-11-27',
    title: 'Thanksgiving Day',
    badge: 'Fleet Off',
    reason: 'Annual statutory holiday dispatch pause and warehouse overhaul.',
  },
  {
    date: '2025-12-25',
    title: 'Christmas Day',
    badge: 'Closed',
    reason: 'Holiday closure, autonomous charging dock maintenance.',
  },
];

/**
 * Smart Slot Suggestion Model
 * Based on slot fullness and customer's past bookings (Requirement 2)
 */
export function calculateSmartSlotRecommendation(
  customer: CustomerProfile,
  dayInfo: DaySlotInfo
): SmartSlotRecommendation {
  const windows: SlotWindowId[] = ['morning', 'afternoon', 'evening'];
  let bestWindow: SlotWindowId = 'afternoon';
  let highestScore = -1;
  let rationale = '';

  for (const winId of windows) {
    const slot = dayInfo.slots[winId];
    if (!slot.active || slot.bookedCount >= slot.maxCapacity) {
      continue; // Skip full or inactive
    }

    // 1. Fullness factor (prefer optimal 40% - 75% load; avoid empty or 95% congested)
    const utilization = slot.bookedCount / slot.maxCapacity;
    let fullnessScore = 0;
    if (utilization >= 0.4 && utilization <= 0.8) {
      fullnessScore = 40; // Sweet spot for routing efficiency
    } else if (utilization < 0.4) {
      fullnessScore = 30;
    } else {
      fullnessScore = 20; // High contention
    }

    // 2. Customer historical preference factor
    let preferenceScore = 0;
    const matchesPreference = customer.preferredWindow === winId;
    if (matchesPreference) {
      preferenceScore = 45;
    } else {
      preferenceScore = 15;
    }

    // 3. Eco-friendly autonomous bonus
    const ecoBonus = slot.ecoFriendly ? 15 : 5;

    const totalScore = fullnessScore + preferenceScore + ecoBonus;

    if (totalScore > highestScore) {
      highestScore = totalScore;
      bestWindow = winId;
      rationale = matchesPreference
        ? `Top recommendation: Matches your preferred ${slot.name} (${customer.pastBookingsCount} past deliveries) & scheduled on clean autonomous zero-emission rover route.`
        : `Balanced recommendation: Optimal fleet capacity (${slot.maxCapacity - slot.bookedCount} spots open) with fastest doorstep turnaround.`;
    }
  }

  return {
    recommendedWindowId: bestWindow,
    recommendedDateString: dayInfo.dateString,
    confidenceScore: Math.min(98, Math.max(78, highestScore)),
    reasoning: rationale,
    balancingScore: highestScore,
    preferenceMatch: customer.preferredWindow === bestWindow,
  };
}
