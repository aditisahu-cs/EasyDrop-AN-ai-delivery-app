import React, { useState, useMemo, useRef } from 'react';
import { Booking, DaySlotInfo, Coordinates, SlotWindowId } from '../types';
import { ROBOTICS_HUB_COORDINATES, getCoordinatesForAddress } from '../data/mockData';

interface DeliveryMapViewProps {
  bookings: Booking[];
  days: DaySlotInfo[];
  selectedBookingId: string;
  onSelectBooking: (booking: Booking) => void;
  selectedDateKey?: string;
  onSelectDateKey?: (dateKey: string) => void;
}

export const DeliveryMapView: React.FC<DeliveryMapViewProps> = ({
  bookings,
  days,
  selectedBookingId,
  onSelectBooking,
  selectedDateKey: controlledDateKey,
  onSelectDateKey,
}) => {
  // Determine selected day
  const defaultDateKey = days[1]?.dateString || days[0]?.dateString || '2025-10-24';
  const [internalDateKey, setInternalDateKey] = useState<string>(defaultDateKey);
  const activeDateKey = controlledDateKey ?? internalDateKey;

  const handleDateChange = (dateKey: string) => {
    if (onSelectDateKey) {
      onSelectDateKey(dateKey);
    } else {
      setInternalDateKey(dateKey);
    }
  };

  // Map settings state
  const [windowFilter, setWindowFilter] = useState<'all' | SlotWindowId>('all');
  const [mapTheme, setMapTheme] = useState<'grid' | 'night' | 'light'>('grid');
  const [showRoute, setShowRoute] = useState<boolean>(true);
  const [showGridLines, setShowGridLines] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hoveredBookingId, setHoveredBookingId] = useState<string | null>(null);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Filter bookings for the selected day
  const dayBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchDay = b.dateKey === activeDateKey;
      const matchWindow = windowFilter === 'all' || b.windowId === windowFilter;
      return matchDay && matchWindow && b.status !== 'Cancelled';
    });
  }, [bookings, activeDateKey, windowFilter]);

  // Ensure all bookings have coordinates
  const dayStops = useMemo(() => {
    return dayBookings.map((b, index) => {
      const coords = b.coordinates || getCoordinatesForAddress(b.address);
      return {
        ...b,
        coordinates: coords,
        stopIndex: index + 1,
      };
    });
  }, [dayBookings]);

  // Compute bounding box for projection
  const bounds = useMemo(() => {
    const allPoints: Coordinates[] = [
      ROBOTICS_HUB_COORDINATES,
      ...dayStops.map(s => s.coordinates),
    ];

    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    for (const p of allPoints) {
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
    }

    // Add padding margin around bounding box
    const latSpan = Math.max(maxLat - minLat, 0.025);
    const lngSpan = Math.max(maxLng - minLng, 0.035);

    return {
      minLat: minLat - latSpan * 0.2,
      maxLat: maxLat + latSpan * 0.2,
      minLng: minLng - lngSpan * 0.2,
      maxLng: maxLng + lngSpan * 0.2,
    };
  }, [dayStops]);

  // Coordinate projection to SVG space (viewBox 0 0 800 480)
  const SVG_WIDTH = 800;
  const SVG_HEIGHT = 480;

  const projectToSvg = (coords: Coordinates) => {
    const lngNorm = (coords.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng);
    // Invert lat for standard y-down graphics
    const latNorm = (bounds.maxLat - coords.lat) / (bounds.maxLat - bounds.minLat);

    const x = lngNorm * (SVG_WIDTH - 120) + 60;
    const y = latNorm * (SVG_HEIGHT - 100) + 50;

    return { x, y };
  };

  const hubPos = projectToSvg(ROBOTICS_HUB_COORDINATES);

  // Projected stops
  const projectedStops = useMemo(() => {
    return dayStops.map(s => ({
      ...s,
      pos: projectToSvg(s.coordinates),
    }));
  }, [dayStops, bounds]);

  // Build SVG path string for multi-stop route connecting hub -> stop1 -> stop2 ... -> hub
  const routePathString = useMemo(() => {
    if (projectedStops.length === 0) return '';
    const points = [hubPos, ...projectedStops.map(s => s.pos), hubPos];

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      // Gentle curve between stops
      const cx1 = (prev.x + curr.x) / 2;
      const cy1 = prev.y;
      const cx2 = (prev.x + curr.x) / 2;
      const cy2 = curr.y;
      d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr.x} ${curr.y}`;
    }
    return d;
  }, [hubPos, projectedStops]);

  // Estimated total route distance in km
  const estimatedRouteDistance = useMemo(() => {
    if (dayStops.length === 0) return '0.0';
    // Approximation: 1 deg lat ~ 111 km, 1 deg lng ~ 78 km
    let dist = 0;
    let prev = ROBOTICS_HUB_COORDINATES;
    for (const s of dayStops) {
      const dLat = (s.coordinates.lat - prev.lat) * 111;
      const dLng = (s.coordinates.lng - prev.lng) * 78;
      dist += Math.sqrt(dLat * dLat + dLng * dLng);
      prev = s.coordinates;
    }
    const dLat = (ROBOTICS_HUB_COORDINATES.lat - prev.lat) * 111;
    const dLng = (ROBOTICS_HUB_COORDINATES.lng - prev.lng) * 78;
    dist += Math.sqrt(dLat * dLat + dLng * dLng);
    return dist.toFixed(1);
  }, [dayStops]);

  // Selected booking info
  const activeBooking = bookings.find(b => b.id === selectedBookingId);

  // Mouse pan handling
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetMap = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Theme styling configurations
  const themeStyles = {
    grid: {
      bg: '#0F172A',
      gridLines: 'rgba(51, 65, 85, 0.4)',
      roads: 'rgba(30, 41, 59, 0.9)',
      river: '#0369A1',
      riverOpacity: 0.25,
      park: '#064E3B',
      parkOpacity: 0.3,
      textColor: '#94A3B8',
    },
    night: {
      bg: '#020617',
      gridLines: 'rgba(30, 41, 59, 0.5)',
      roads: 'rgba(15, 23, 42, 0.95)',
      river: '#1E3A8A',
      riverOpacity: 0.35,
      park: '#064E3B',
      parkOpacity: 0.2,
      textColor: '#64748B',
    },
    light: {
      bg: '#F1F5F9',
      gridLines: 'rgba(203, 213, 225, 0.6)',
      roads: 'rgba(255, 255, 255, 0.95)',
      river: '#BAE6FD',
      riverOpacity: 0.8,
      park: '#D1FAE5',
      parkOpacity: 0.7,
      textColor: '#64748B',
    },
  }[mapTheme];

  return (
    <div className="rounded-3xl bg-white shadow-sm border border-slate-200 overflow-hidden space-y-0">
      {/* Top Header Bar: Title + Date Selector */}
      <div className="p-4 sm:p-5 border-b border-slate-200/90 bg-slate-50/70">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[22px]">map</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline text-base font-bold text-slate-900">
                  Fleet Dispatch Map
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Live Coordinates
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Visualizing scheduled autonomous delivery coordinates for the selected day.
              </p>
            </div>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-2 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-600">
                <strong className="text-slate-900 font-bold">{dayStops.length}</strong> upcoming {dayStops.length === 1 ? 'stop' : 'stops'}
              </span>
            </div>

            {dayStops.length > 0 && (
              <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-1.5 text-slate-600">
                <span className="material-symbols-outlined text-[16px] text-blue-600">route</span>
                <span>
                  Loop: <strong className="text-slate-900 font-bold">{estimatedRouteDistance} km</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Selected Day Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          {days.map(day => {
            const isSelected = day.dateString === activeDateKey;
            const stopCount = bookings.filter(
              b => b.dateKey === day.dateString && b.status !== 'Cancelled'
            ).length;

            return (
              <button
                key={day.dateString}
                onClick={() => handleDateChange(day.dateString)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm scale-[1.02]'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span>{day.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950'
                      : stopCount > 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {stopCount} {stopCount === 1 ? 'stop' : 'stops'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Map Control Bar */}
      <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Window Filter Pills */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-bold text-slate-500 mr-1 hidden sm:inline">
            Window:
          </span>
          {(['all', 'morning', 'afternoon', 'evening'] as const).map(w => (
            <button
              key={w}
              onClick={() => setWindowFilter(w)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all ${
                windowFilter === w
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
              }`}
            >
              {w === 'all' ? 'All Windows' : w}
            </button>
          ))}
        </div>

        {/* View Options */}
        <div className="flex items-center gap-2">
          {/* Theme switch */}
          <div className="flex items-center bg-white rounded-lg p-0.5 border border-slate-200 text-[11px]">
            <button
              onClick={() => setMapTheme('grid')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                mapTheme === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Robotics Grid Theme"
            >
              Grid
            </button>
            <button
              onClick={() => setMapTheme('night')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                mapTheme === 'night' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Night Telemetry Theme"
            >
              Night
            </button>
            <button
              onClick={() => setMapTheme('light')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                mapTheme === 'light' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Light Street Map"
            >
              Light
            </button>
          </div>

          {/* Toggle Route Path */}
          <button
            onClick={() => setShowRoute(!showRoute)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 border transition-all ${
              showRoute
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-white text-slate-500 border-slate-200'
            }`}
            title="Toggle autonomous route line"
          >
            <span className="material-symbols-outlined text-[14px]">timeline</span>
            <span className="hidden sm:inline">Route</span>
          </button>

          {/* Toggle Lat/Lng Grid */}
          <button
            onClick={() => setShowGridLines(!showGridLines)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 border transition-all ${
              showGridLines
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : 'bg-white text-slate-500 border-slate-200'
            }`}
            title="Toggle coordinate grid lines"
          >
            <span className="material-symbols-outlined text-[14px]">grid_4x4</span>
            <span className="hidden sm:inline">Grid</span>
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center bg-white rounded-lg border border-slate-200 overflow-hidden">
            <button
              onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 2.5))}
              className="p-1 text-slate-600 hover:bg-slate-100"
              title="Zoom In"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
            </button>
            <span className="px-1 text-[10px] font-mono font-bold text-slate-500">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.75))}
              className="p-1 text-slate-600 hover:bg-slate-100"
              title="Zoom Out"
            >
              <span className="material-symbols-outlined text-[15px]">remove</span>
            </button>
            <button
              onClick={resetMap}
              className="px-1.5 py-1 text-slate-500 hover:bg-slate-100 border-l border-slate-200 text-[10px]"
              title="Reset View"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* The Interactive Map Canvas */}
      <div
        className="relative w-full h-80 sm:h-96 overflow-hidden select-none cursor-grab active:cursor-grabbing"
        style={{ backgroundColor: themeStyles.bg }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          className="w-full h-full"
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Zoom and Pan transform group */}
          <g
            transform={`translate(${panOffset.x + (SVG_WIDTH / 2) * (1 - zoomLevel)}, ${
              panOffset.y + (SVG_HEIGHT / 2) * (1 - zoomLevel)
            }) scale(${zoomLevel})`}
          >
            {/* Background River / Waterway Vector */}
            <path
              d="M 280 -20 Q 320 140 370 240 T 360 520"
              fill="none"
              stroke={themeStyles.river}
              strokeOpacity={themeStyles.riverOpacity}
              strokeWidth="56"
              strokeLinecap="round"
            />
            {/* Secondary canal */}
            <path
              d="M 370 240 Q 520 280 620 380"
              fill="none"
              stroke={themeStyles.river}
              strokeOpacity={themeStyles.riverOpacity * 0.7}
              strokeWidth="24"
              strokeLinecap="round"
            />

            {/* Park / Greenery zones */}
            <path
              d="M 60 40 C 130 50, 160 120, 140 180 C 110 220, 40 200, 30 140 Z"
              fill={themeStyles.park}
              fillOpacity={themeStyles.parkOpacity}
            />
            <path
              d="M 640 60 C 720 70, 780 150, 750 220 C 700 240, 620 200, 610 120 Z"
              fill={themeStyles.park}
              fillOpacity={themeStyles.parkOpacity}
            />
            <path
              d="M 120 340 C 200 320, 240 420, 180 470 C 120 480, 80 420, 90 370 Z"
              fill={themeStyles.park}
              fillOpacity={themeStyles.parkOpacity}
            />

            {/* City Blocks & Arterial Road Network */}
            <g stroke={themeStyles.roads} strokeLinecap="round">
              {/* Major East-West Avenues */}
              <line x1="-20" y1="90" x2="820" y2="70" strokeWidth="8" />
              <line x1="-20" y1="170" x2="820" y2="160" strokeWidth="12" />
              <line x1="-20" y1="260" x2="820" y2="250" strokeWidth="10" />
              <line x1="-20" y1="360" x2="820" y2="370" strokeWidth="10" />
              <line x1="-20" y1="440" x2="820" y2="430" strokeWidth="7" />

              {/* Major North-South Boulevards */}
              <line x1="90" y1="-20" x2="110" y2="500" strokeWidth="7" />
              <line x1="210" y1="-20" x2="230" y2="500" strokeWidth="11" />
              <line x1="450" y1="-20" x2="440" y2="500" strokeWidth="12" />
              <line x1="570" y1="-20" x2="580" y2="500" strokeWidth="9" />
              <line x1="690" y1="-20" x2="710" y2="500" strokeWidth="8" />

              {/* Diagonal Connector Avenue */}
              <line x1="40" y1="460" x2="480" y2="40" strokeWidth="8" strokeOpacity="0.8" />
              <line x1="420" y1="470" x2="780" y2="120" strokeWidth="7" strokeOpacity="0.8" />

              {/* Bridges over river */}
              <rect x="330" y="152" width="45" height="16" rx="3" fill="#64748B" opacity="0.8" />
              <rect x="348" y="242" width="45" height="16" rx="3" fill="#64748B" opacity="0.8" />
            </g>

            {/* Coordinate Grid Lines & Lat/Lng Markers */}
            {showGridLines && (
              <g stroke={themeStyles.gridLines} strokeDasharray="3 4">
                <line x1="0" y1="120" x2="800" y2="120" strokeWidth="1" />
                <line x1="0" y1="240" x2="800" y2="240" strokeWidth="1" />
                <line x1="0" y1="360" x2="800" y2="360" strokeWidth="1" />
                <line x1="200" y1="0" x2="200" y2="480" strokeWidth="1" />
                <line x1="400" y1="0" x2="400" y2="480" strokeWidth="1" />
                <line x1="600" y1="0" x2="600" y2="480" strokeWidth="1" />

                {/* Coordinate Labels */}
                <text x="10" y="115" fill={themeStyles.textColor} fontSize="9" fontFamily="monospace">
                  45.530° N
                </text>
                <text x="10" y="235" fill={themeStyles.textColor} fontSize="9" fontFamily="monospace">
                  45.520° N
                </text>
                <text x="10" y="355" fill={themeStyles.textColor} fontSize="9" fontFamily="monospace">
                  45.510° N
                </text>
                <text x="205" y="470" fill={themeStyles.textColor} fontSize="9" fontFamily="monospace">
                  -122.690° W
                </text>
                <text x="405" y="470" fill={themeStyles.textColor} fontSize="9" fontFamily="monospace">
                  -122.678° W
                </text>
                <text x="605" y="470" fill={themeStyles.textColor} fontSize="9" fontFamily="monospace">
                  -122.660° W
                </text>
              </g>
            )}

            {/* Autonomous Delivery Path Route (if enabled and stops exist) */}
            {showRoute && routePathString && (
              <g>
                {/* Route Glow Shadow */}
                <path
                  d={routePathString}
                  fill="none"
                  stroke="#10B981"
                  strokeOpacity="0.25"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                {/* Active Animated Dashed Route */}
                <path
                  d={routePathString}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3.5"
                  strokeDasharray="8 6"
                  strokeLinecap="round"
                  className="animate-pulse"
                />
              </g>
            )}

            {/* Central Robotics Hub / Depot Pin */}
            <g transform={`translate(${hubPos.x}, ${hubPos.y})`} className="cursor-pointer">
              {/* Radar beacon pulse */}
              <circle r="22" fill="#10B981" opacity="0.15" className="animate-ping" />
              <circle r="14" fill="#0F172A" stroke="#10B981" strokeWidth="2.5" />
              <circle r="6" fill="#10B981" />
              {/* Label */}
              <g transform="translate(0, 24)">
                <rect
                  x="-65"
                  y="-12"
                  width="130"
                  height="18"
                  rx="9"
                  fill="rgba(15, 23, 42, 0.85)"
                  stroke="#10B981"
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="1"
                  fill="#6EE7B7"
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  ⚡ Robotics Central Hub
                </text>
              </g>
            </g>

            {/* Upcoming Delivery Stop Pins for Selected Day */}
            {projectedStops.map((stop, idx) => {
              const isSelected = stop.id === selectedBookingId;
              const isHovered = stop.id === hoveredBookingId;

              // Color determination
              let pinBg = '#10B981'; // emerald
              let pinBorder = '#34D399';
              if (stop.status === 'Completed') {
                pinBg = '#64748B'; // slate
                pinBorder = '#94A3B8';
              } else if (stop.status === 'Driver Assigned') {
                pinBg = '#3B82F6'; // blue
                pinBorder = '#60A5FA';
              } else if (stop.status === 'Queued') {
                pinBg = '#0EA5E9'; // sky
                pinBorder = '#38BDF8';
              }

              return (
                <g
                  key={stop.id}
                  transform={`translate(${stop.pos.x}, ${stop.pos.y})`}
                  className="cursor-pointer transition-transform"
                  onClick={e => {
                    e.stopPropagation();
                    onSelectBooking(stop);
                  }}
                  onMouseEnter={() => setHoveredBookingId(stop.id)}
                  onMouseLeave={() => setHoveredBookingId(null)}
                >
                  {/* Selection / Active halo */}
                  {isSelected && (
                    <circle
                      r="26"
                      fill={pinBg}
                      opacity="0.25"
                      className="animate-ping"
                    />
                  )}

                  {/* Pin outer marker shadow */}
                  <circle
                    r={isSelected || isHovered ? 18 : 14}
                    fill={isSelected ? '#FFFFFF' : pinBg}
                    stroke={isSelected ? pinBg : '#FFFFFF'}
                    strokeWidth={isSelected ? 3 : 2}
                    className="shadow-md"
                  />

                  {/* Inner text (stop number or icon) */}
                  <text
                    x="0"
                    y="4"
                    fill={isSelected ? pinBg : '#FFFFFF'}
                    fontSize={isSelected || isHovered ? '11' : '10'}
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="sans-serif"
                  >
                    {stop.stopIndex}
                  </text>

                  {/* Callout Badge (Always for selected, or on hover) */}
                  {(isSelected || isHovered) && (
                    <g transform="translate(0, -28)" className="pointer-events-none">
                      <rect
                        x="-75"
                        y="-16"
                        width="150"
                        height="26"
                        rx="13"
                        fill="rgba(15, 23, 42, 0.95)"
                        stroke={isSelected ? '#10B981' : '#CBD5E1'}
                        strokeWidth="1.5"
                        filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))"
                      />
                      <text
                        x="0"
                        y="-3"
                        fill="#FFFFFF"
                        fontSize="9.5"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="sans-serif"
                      >
                        #{stop.id} • {stop.customerName}
                      </text>
                      <text
                        x="0"
                        y="7"
                        fill="#94A3B8"
                        fontSize="8"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {stop.coordinates.lat.toFixed(4)}°, {stop.coordinates.lng.toFixed(4)}°
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Floating Sector Overlay Badge */}
        <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md text-white border border-slate-700/80 px-3 py-1.5 rounded-xl text-[11px] font-medium shadow-md flex items-center gap-2 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Willamette Metro Robotics Dispatch Grid</span>
          <span className="text-slate-400 font-mono text-[10px]">
            [{ROBOTICS_HUB_COORDINATES.lat}°, {ROBOTICS_HUB_COORDINATES.lng}°]
          </span>
        </div>

        {/* Legend Overlay at Bottom Right */}
        <div className="absolute bottom-3 right-3 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 px-3 py-2 rounded-xl text-[10px] text-white shadow-md flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>In Transit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
            <span>Queued</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span>Assigned</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
            <span>Completed</span>
          </div>
        </div>
      </div>

      {/* Selected Day Delivery Stops Manifest (Scrollable List) */}
      <div className="p-4 sm:p-5 bg-white border-t border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-700 text-[18px]">
              format_list_bulleted
            </span>
            <span className="font-headline text-sm font-bold text-slate-900">
              Upcoming Delivery Locations for {days.find(d => d.dateString === activeDateKey)?.label || activeDateKey}
            </span>
          </div>
          <span className="text-xs text-slate-500">
            {dayStops.length} {dayStops.length === 1 ? 'location' : 'locations'} plotted
          </span>
        </div>

        {dayStops.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <span className="material-symbols-outlined text-[32px] text-slate-400 mb-1">
              location_off
            </span>
            <p className="text-xs font-semibold text-slate-700">
              No delivery locations scheduled for this day
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Select another day from the date selector above or book a delivery slot.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {dayStops.map(stop => {
              const isSelected = stop.id === selectedBookingId;

              return (
                <div
                  key={stop.id}
                  onClick={() => onSelectBooking(stop)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 relative text-xs flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div>
                    {/* Top row: Stop index + status badge */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-900 text-white'
                          }`}
                        >
                          #{stop.stopIndex}
                        </span>
                        <span className="font-headline font-bold text-slate-900">
                          {stop.id}
                        </span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          stop.status === 'In Transit'
                            ? 'bg-emerald-100 text-emerald-800'
                            : stop.status === 'Completed'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {stop.status}
                      </span>
                    </div>

                    {/* Customer & Address */}
                    <p className="font-bold text-slate-900 text-xs truncate">
                      {stop.customerName}
                    </p>
                    <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px] text-slate-400">
                        pin_drop
                      </span>
                      <span>{stop.address}</span>
                    </p>
                  </div>

                  {/* Coordinates & ETA footer */}
                  <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1 text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      <span className="material-symbols-outlined text-[12px] text-blue-600">
                        navigation
                      </span>
                      <span>
                        {stop.coordinates.lat.toFixed(4)}, {stop.coordinates.lng.toFixed(4)}
                      </span>
                    </span>

                    <span className="font-sans font-semibold text-slate-700">
                      ETA {stop.eta}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
