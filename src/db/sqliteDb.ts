import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store database file in the project workspace
const DB_PATH = path.resolve(__dirname, '../../easydrop.sqlite');

export interface DBBooking {
  id: string;
  customerName: string;
  phone: string;
  rawPhone: string;
  address: string;
  cleanedAddress?: string;
  addressNormalized?: boolean;
  instructions: string;
  date: string;
  dateKey: string;
  windowId: 'morning' | 'afternoon' | 'evening';
  windowLabel: string;
  status: 'In Transit' | 'Queued' | 'Driver Assigned' | 'Completed' | 'Cancelled';
  eta: string;
  courierName?: string;
  courierVehicle?: string;
  courierRating?: number;
  packageDescription?: string;
  weightKg?: number;
  createdAt: string;
  noShowRisk: 'Low' | 'Medium' | 'High';
  noShowProbability: number;
  riskFactors: string[];
  isDemoData: boolean;
  smsNotification?: boolean;
  lat?: number;
  lng?: number;
}

export interface DBSlot {
  dateKey: string;
  windowId: 'morning' | 'afternoon' | 'evening';
  name: string;
  timeSpan: string;
  maxCapacity: number;
  bookedCount: number;
  active: boolean;
}

class SQLiteDatabase {
  private db: DatabaseSync;

  constructor() {
    this.db = new DatabaseSync(DB_PATH);
    this.initTables();
    this.seedInitialData();
  }

  private initTables() {
    // 1. Bookings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        raw_phone TEXT,
        address TEXT NOT NULL,
        cleaned_address TEXT,
        address_normalized INTEGER DEFAULT 0,
        instructions TEXT,
        date_label TEXT NOT NULL,
        date_key TEXT NOT NULL,
        window_id TEXT NOT NULL,
        window_label TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Queued',
        eta TEXT NOT NULL,
        courier_name TEXT,
        courier_vehicle TEXT,
        courier_rating REAL DEFAULT 4.9,
        package_description TEXT,
        weight_kg REAL DEFAULT 2.0,
        no_show_risk TEXT DEFAULT 'Low',
        no_show_probability REAL DEFAULT 0.1,
        risk_factors TEXT DEFAULT '[]',
        is_demo_data INTEGER DEFAULT 1,
        sms_notification INTEGER DEFAULT 1,
        lat REAL,
        lng REAL,
        created_at TEXT NOT NULL
      );
    `);

    // 2. Slot Capacities table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS slots (
        date_key TEXT NOT NULL,
        window_id TEXT NOT NULL,
        name TEXT NOT NULL,
        time_span TEXT NOT NULL,
        max_capacity INTEGER NOT NULL,
        booked_count INTEGER NOT NULL DEFAULT 0,
        active INTEGER NOT NULL DEFAULT 1,
        PRIMARY KEY (date_key, window_id)
      );
    `);

    // 3. Chat Messages log table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chat_logs (
        id TEXT PRIMARY KEY,
        session_id TEXT,
        sender TEXT NOT NULL,
        user_message TEXT NOT NULL,
        assistant_reply TEXT,
        tool_called TEXT,
        timestamp TEXT NOT NULL
      );
    `);
  }

  private seedInitialData() {
    // Check if bookings already populated
    const countStmt = this.db.prepare('SELECT COUNT(*) as count FROM bookings');
    const result = countStmt.get() as { count: number };

    if (result && result.count > 0) {
      return; // Already seeded
    }

    // Seed Slots for initial week
    const dateKeys = [
      '2025-10-23',
      '2025-10-24',
      '2025-10-25',
      '2025-10-26',
      '2025-10-27',
      '2025-10-28',
      '2025-10-29',
    ];

    const insertSlotStmt = this.db.prepare(`
      INSERT OR REPLACE INTO slots (date_key, window_id, name, time_span, max_capacity, booked_count, active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const dKey of dateKeys) {
      insertSlotStmt.run(dKey, 'morning', 'Morning Window', '08:00 AM – 12:00 PM', 15, 11, 1);
      insertSlotStmt.run(dKey, 'afternoon', 'Afternoon Window', '12:00 PM – 04:00 PM', 12, 9, 1);
      insertSlotStmt.run(dKey, 'evening', 'Evening Window', '04:00 PM – 08:00 PM', 10, 8, 1);
    }

    // Seed Initial Bookings
    const initialBookings: DBBooking[] = [
      {
        id: 'ED-4801',
        customerName: 'Marcus Brody',
        phone: '+1 (555) ***-3190',
        rawPhone: '+15553190412',
        address: '320 NW 12th Avenue',
        cleanedAddress: '320 NW 12th Avenue, Springfield, OR 97477',
        instructions: 'Autonomous locker porch release code #9941.',
        date: 'Today, Oct 23',
        dateKey: '2025-10-23',
        windowId: 'morning',
        windowLabel: 'Morning (08:00 AM – 12:00 PM)',
        status: 'In Transit',
        eta: '10:45 AM',
        courierName: 'Autonomous Rover Bot Prime-1',
        courierVehicle: 'Robotics Rover ED-V-701',
        courierRating: 4.96,
        packageDescription: 'Precision Laboratory Glassware',
        weightKg: 2.1,
        createdAt: '2025-10-23T08:15:00Z',
        noShowRisk: 'Low',
        noShowProbability: 0.05,
        riskFactors: ['Verified commercial locker docking bay'],
        isDemoData: true,
        smsNotification: true,
        lat: 45.5245,
        lng: -122.684,
      },
      {
        id: 'ED-4803',
        customerName: 'Amina Al-Mansoor',
        phone: '+1 (555) ***-7811',
        rawPhone: '+15557811099',
        address: '1540 SW Jefferson St, Unit 5B',
        cleanedAddress: '1540 SW Jefferson Street, Unit 5B, Springfield, OR 97477',
        instructions: 'Elevator access authorized, leave in courtyard robotics station.',
        date: 'Today, Oct 23',
        dateKey: '2025-10-23',
        windowId: 'afternoon',
        windowLabel: 'Afternoon (12:00 PM – 04:00 PM)',
        status: 'Driver Assigned',
        eta: '01:15 PM',
        courierName: 'Autonomous Rover Bot Delta-4',
        courierVehicle: 'Robotics Rover ED-V-814',
        courierRating: 4.92,
        packageDescription: 'Smart Home Climate Hubs',
        weightKg: 3.5,
        createdAt: '2025-10-23T09:30:00Z',
        noShowRisk: 'Low',
        noShowProbability: 0.09,
        riskFactors: ['Security gate pre-cleared by resident app'],
        isDemoData: true,
        smsNotification: true,
        lat: 45.518,
        lng: -122.689,
      },
      {
        id: 'ED-4821',
        customerName: 'Sarah Jenkins',
        phone: '+1 (555) ***-2834',
        rawPhone: '+15550192834',
        address: '742 Evergreen Terrace, Apt 4B',
        cleanedAddress: '742 Evergreen Terrace, Apt 4B, Springfield, OR 97477',
        instructions: 'Ring smart doorbell twice. If not answering, leave securely behind front porch planter.',
        date: 'Tomorrow, Oct 24',
        dateKey: '2025-10-24',
        windowId: 'afternoon',
        windowLabel: 'Afternoon (12:00 PM – 4:00 PM)',
        status: 'In Transit',
        eta: '02:15 PM',
        courierName: 'Autonomous Rover Bot Alpha-4',
        courierVehicle: 'Robotics Rover ED-V-882',
        courierRating: 4.98,
        packageDescription: 'Artisan Ceramic Teapot & Mug Set',
        weightKg: 1.8,
        createdAt: '2025-10-23T14:32:00Z',
        noShowRisk: 'Low',
        noShowProbability: 0.08,
        riskFactors: ['Verified mobile number', 'Precise porch instructions provided'],
        isDemoData: true,
        smsNotification: true,
        lat: 45.526,
        lng: -122.671,
      },
      {
        id: 'ED-4819',
        customerName: 'David Rodrigues',
        phone: '+1 (555) ***-8172',
        rawPhone: '+15553928172',
        address: '1104 Pine Valley Boulevard',
        cleanedAddress: '1104 Pine Valley Boulevard, Springfield, OR 97477',
        instructions: 'Signature required on parcel arrival. Autonomous lockbox release.',
        date: 'Tomorrow, Oct 24',
        dateKey: '2025-10-24',
        windowId: 'afternoon',
        windowLabel: 'Afternoon (12:00 PM – 4:00 PM)',
        status: 'Queued',
        eta: '01:40 PM',
        courierName: 'Autonomous Rover Bot Delta-9',
        courierVehicle: 'Robotics Rover ED-V-819',
        courierRating: 4.88,
        packageDescription: 'Precision Robotic Sensors Kit',
        weightKg: 2.4,
        createdAt: '2025-10-23T11:05:00Z',
        noShowRisk: 'Medium',
        noShowProbability: 0.38,
        riskFactors: ['Signature required on arrival', 'No gate access code given'],
        isDemoData: true,
        smsNotification: true,
        lat: 45.513,
        lng: -122.674,
      },
      {
        id: 'ED-4815',
        customerName: 'Elena Rostova',
        phone: '+1 (555) ***-8910',
        rawPhone: '+15557788910',
        address: '29 Harbor Heights Way, Suite 300',
        cleanedAddress: '29 Harbor Heights Way, Suite 300, Springfield, OR 97477',
        instructions: 'Commercial building, drop at autonomous robotics docking bay.',
        date: 'Tomorrow, Oct 24',
        dateKey: '2025-10-24',
        windowId: 'evening',
        windowLabel: 'Evening (04:00 PM – 08:00 PM)',
        status: 'Driver Assigned',
        eta: '05:20 PM',
        courierName: 'Autonomous Rover Bot Omega-2',
        courierVehicle: 'Robotics Rover ED-V-901',
        courierRating: 4.79,
        packageDescription: 'Office Tech Essentials',
        weightKg: 3.1,
        createdAt: '2025-10-23T08:44:00Z',
        noShowRisk: 'High',
        noShowProbability: 0.72,
        riskFactors: ['Commercial building after 5:00 PM', 'High past cancellation rate'],
        isDemoData: true,
        smsNotification: true,
        lat: 45.531,
        lng: -122.682,
      },
      {
        id: 'ED-4825',
        customerName: 'Liam Chen',
        phone: '+1 (555) ***-4421',
        rawPhone: '+15554421100',
        address: '880 SE Hawthorne Boulevard',
        cleanedAddress: '880 SE Hawthorne Boulevard, Springfield, OR 97477',
        instructions: 'Ring doorbell, leave on covered stoop if away.',
        date: 'Tomorrow, Oct 24',
        dateKey: '2025-10-24',
        windowId: 'morning',
        windowLabel: 'Morning (08:00 AM – 12:00 PM)',
        status: 'Queued',
        eta: '11:10 AM',
        courierName: 'Autonomous Rover Bot Theta-3',
        courierVehicle: 'Robotics Rover ED-V-740',
        courierRating: 4.95,
        packageDescription: 'Organic Matcha Tea Set',
        weightKg: 1.1,
        createdAt: '2025-10-23T16:10:00Z',
        noShowRisk: 'Low',
        noShowProbability: 0.12,
        riskFactors: ['Repeat customer (4 flawless deliveries)'],
        isDemoData: true,
        smsNotification: false,
        lat: 45.5125,
        lng: -122.656,
      },
    ];

    for (const b of initialBookings) {
      this.insertBooking(b);
    }
  }

  // --- CRUD Operations ---

  public getAllBookings(): DBBooking[] {
    const stmt = this.db.prepare('SELECT * FROM bookings ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    return rows.map(r => this.mapRowToBooking(r));
  }

  public getBookingById(id: string): DBBooking | null {
    const stmt = this.db.prepare('SELECT * FROM bookings WHERE UPPER(id) = UPPER(?)');
    const row = stmt.get(id.trim()) as any;
    if (!row) return null;
    return this.mapRowToBooking(row);
  }

  public searchBookings(query: string): DBBooking[] {
    const q = `%${query.trim()}%`;
    const stmt = this.db.prepare(`
      SELECT * FROM bookings 
      WHERE UPPER(id) LIKE UPPER(?) 
         OR UPPER(customer_name) LIKE UPPER(?)
         OR raw_phone LIKE ?
         OR phone LIKE ?
         OR UPPER(address) LIKE UPPER(?)
      ORDER BY created_at DESC
      LIMIT 10
    `);
    const rows = stmt.all(q, q, q, q, q) as any[];
    return rows.map(r => this.mapRowToBooking(r));
  }

  public insertBooking(b: DBBooking): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO bookings (
        id, customer_name, phone, raw_phone, address, cleaned_address,
        address_normalized, instructions, date_label, date_key, window_id,
        window_label, status, eta, courier_name, courier_vehicle, courier_rating,
        package_description, weight_kg, no_show_risk, no_show_probability,
        risk_factors, is_demo_data, sms_notification, lat, lng, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
      )
    `);

    stmt.run(
      b.id,
      b.customerName,
      b.phone,
      b.rawPhone || '',
      b.address,
      b.cleanedAddress || b.address,
      b.addressNormalized ? 1 : 0,
      b.instructions || '',
      b.date,
      b.dateKey,
      b.windowId,
      b.windowLabel,
      b.status,
      b.eta,
      b.courierName || 'Autonomous Rover Bot Alpha-1',
      b.courierVehicle || 'Robotics Rover ED-V-882',
      b.courierRating || 4.9,
      b.packageDescription || 'Secure Doorstep Parcel',
      b.weightKg || 2.0,
      b.noShowRisk || 'Low',
      b.noShowProbability || 0.1,
      JSON.stringify(b.riskFactors || []),
      b.isDemoData ? 1 : 0,
      b.smsNotification ? 1 : 0,
      b.lat || 45.5205,
      b.lng || -122.678,
      b.createdAt || new Date().toISOString()
    );
  }

  public cancelBooking(id: string): DBBooking | null {
    const b = this.getBookingById(id);
    if (!b) return null;

    const stmt = this.db.prepare(`UPDATE bookings SET status = 'Cancelled' WHERE UPPER(id) = UPPER(?)`);
    stmt.run(id);

    // Decrement slot booked count
    this.decrementSlot(b.dateKey, b.windowId);

    return this.getBookingById(id);
  }

  public updateBookingStatus(id: string, status: DBBooking['status']): DBBooking | null {
    const stmt = this.db.prepare(`UPDATE bookings SET status = ? WHERE UPPER(id) = UPPER(?)`);
    stmt.run(status, id);
    return this.getBookingById(id);
  }

  // --- Slots Operations ---

  public getSlotsForDate(dateKey: string): Record<'morning' | 'afternoon' | 'evening', DBSlot> {
    const stmt = this.db.prepare('SELECT * FROM slots WHERE date_key = ?');
    const rows = stmt.all(dateKey) as any[];

    if (rows.length === 0) {
      // Initialize slots for this date
      const insertStmt = this.db.prepare(`
        INSERT OR REPLACE INTO slots (date_key, window_id, name, time_span, max_capacity, booked_count, active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      insertStmt.run(dateKey, 'morning', 'Morning Window', '08:00 AM – 12:00 PM', 15, 0, 1);
      insertStmt.run(dateKey, 'afternoon', 'Afternoon Window', '12:00 PM – 04:00 PM', 12, 0, 1);
      insertStmt.run(dateKey, 'evening', 'Evening Window', '04:00 PM – 08:00 PM', 10, 0, 1);
      return this.getSlotsForDate(dateKey);
    }

    const result: any = {};
    for (const r of rows) {
      result[r.window_id] = {
        dateKey: r.date_key,
        windowId: r.window_id,
        name: r.name,
        timeSpan: r.time_span,
        maxCapacity: r.max_capacity,
        bookedCount: r.booked_count,
        active: Boolean(r.active),
      };
    }
    return result;
  }

  public incrementSlot(dateKey: string, windowId: string): void {
    const stmt = this.db.prepare(`
      UPDATE slots 
      SET booked_count = booked_count + 1 
      WHERE date_key = ? AND window_id = ?
    `);
    stmt.run(dateKey, windowId);
  }

  public decrementSlot(dateKey: string, windowId: string): void {
    const stmt = this.db.prepare(`
      UPDATE slots 
      SET booked_count = MAX(0, booked_count - 1) 
      WHERE date_key = ? AND window_id = ?
    `);
    stmt.run(dateKey, windowId);
  }

  public updateSlotCapacity(dateKey: string, windowId: string, maxCapacity?: number, active?: boolean): void {
    if (typeof maxCapacity === 'number') {
      const stmt = this.db.prepare(`UPDATE slots SET max_capacity = ? WHERE date_key = ? AND window_id = ?`);
      stmt.run(maxCapacity, dateKey, windowId);
    }
    if (typeof active === 'boolean') {
      const stmt = this.db.prepare(`UPDATE slots SET active = ? WHERE date_key = ? AND window_id = ?`);
      stmt.run(active ? 1 : 0, dateKey, windowId);
    }
  }

  public logChatMessage(sessionId: string, sender: string, userMessage: string, assistantReply: string, toolCalled?: string): void {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO chat_logs (id, session_id, sender, user_message, assistant_reply, tool_called, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        sessionId,
        sender,
        userMessage,
        assistantReply,
        toolCalled || null,
        new Date().toISOString()
      );
    } catch (e) {
      // Non-fatal logging
    }
  }

  private mapRowToBooking(row: any): DBBooking {
    let riskFactors: string[] = [];
    try {
      riskFactors = JSON.parse(row.risk_factors || '[]');
    } catch {
      riskFactors = [];
    }

    return {
      id: row.id,
      customerName: row.customer_name,
      phone: row.phone,
      rawPhone: row.raw_phone || '',
      address: row.address,
      cleanedAddress: row.cleaned_address,
      addressNormalized: Boolean(row.address_normalized),
      instructions: row.instructions || '',
      date: row.date_label,
      dateKey: row.date_key,
      windowId: row.window_id,
      windowLabel: row.window_label,
      status: row.status,
      eta: row.eta,
      courierName: row.courier_name,
      courierVehicle: row.courier_vehicle,
      courierRating: row.courier_rating,
      packageDescription: row.package_description,
      weightKg: row.weight_kg,
      createdAt: row.created_at,
      noShowRisk: row.no_show_risk,
      noShowProbability: row.no_show_probability,
      riskFactors,
      isDemoData: Boolean(row.is_demo_data),
      smsNotification: Boolean(row.sms_notification),
      lat: row.lat,
      lng: row.lng,
    };
  }
}

// Singleton database instance
export const sqliteDb = new SQLiteDatabase();
