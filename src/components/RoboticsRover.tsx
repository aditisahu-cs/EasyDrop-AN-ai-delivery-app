import React, { useState } from 'react';

interface RoboticsRoverProps {
  statusText?: string;
  batteryLevel?: number;
  compact?: boolean;
}

export const RoboticsRover: React.FC<RoboticsRoverProps> = ({
  statusText = 'Autonomous Rover Alpha-4 • Active Patrol',
  batteryLevel = 94,
  compact = false,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [hatchOpen, setHatchOpen] = useState(false);

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 2000);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 text-white border border-emerald-500/40 shadow-sm text-xs">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-semibold text-emerald-400 tracking-wide uppercase text-[10px]">Rover Bot Online</span>
        <span className="text-slate-400">•</span>
        <span className="text-slate-300 font-mono">{batteryLevel}% EV</span>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-4 sm:p-5 text-white shadow-xl border border-slate-700/60 overflow-hidden">
      {/* Background Tech Grid Lines */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}></div>

      {/* Glow highlight */}
      <div className="absolute -top-12 -right-12 w-44 h-44 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Rover SVG Model */}
        <div className="relative flex-shrink-0 cursor-pointer group" onClick={handleScan} title="Click to trigger LIDAR sensor scan">
          <div className="w-36 h-28 relative flex items-center justify-center">
            {/* Sensor Sweep Ring when scanning */}
            {isScanning && (
              <div className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-60 pointer-events-none"></div>
            )}

            <svg viewBox="0 0 160 120" className="w-full h-full drop-shadow-lg" fill="none">
              {/* Ground Shadow */}
              <ellipse cx="80" cy="112" rx="60" ry="6" fill="#000000" opacity="0.4" />

              {/* Six All-Terrain Robotics Wheels */}
              {/* Rear Wheels */}
              <rect x="22" y="85" width="22" height="26" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="2" />
              <line x1="24" y1="92" x2="42" y2="92" stroke="#64748b" strokeWidth="1.5" />
              <line x1="24" y1="102" x2="42" y2="102" stroke="#64748b" strokeWidth="1.5" />

              <rect x="70" y="85" width="20" height="26" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="2" />
              <line x1="72" y1="92" x2="88" y2="92" stroke="#64748b" strokeWidth="1.5" />
              <line x1="72" y1="102" x2="88" y2="102" stroke="#64748b" strokeWidth="1.5" />

              <rect x="116" y="85" width="22" height="26" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="2" />
              <line x1="118" y1="92" x2="136" y2="92" stroke="#64748b" strokeWidth="1.5" />
              <line x1="118" y1="102" x2="136" y2="102" stroke="#64748b" strokeWidth="1.5" />

              {/* Heavy Chassis Frame */}
              <rect x="28" y="52" width="104" height="42" rx="10" fill="#0f172a" stroke="#334155" strokeWidth="2" />

              {/* Composite Cargo Vault Body */}
              <path d="M 32 52 L 44 26 L 116 26 L 128 52 Z" fill="#1e293b" stroke="#475569" strokeWidth="2" />

              {/* Cargo Door Hatch (interactive) */}
              <rect
                x="48"
                y="30"
                width="64"
                height="22"
                rx="4"
                fill={hatchOpen ? '#047857' : '#0f172a'}
                stroke="#10b981"
                strokeWidth="1.5"
                className="transition-colors duration-300"
              />
              <text x="80" y="44" textAnchor="middle" fill="#6ee7b7" fontSize="8" fontWeight="bold" letterSpacing="0.05em">
                {hatchOpen ? 'DOOR OPEN' : 'VAULT SECURE'}
              </text>

              {/* EasyDrop Robotics Branding on Side */}
              <text x="80" y="74" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="800" letterSpacing="0.1em">
                EASYDROP BOT
              </text>

              {/* LED Status Strip */}
              <rect x="36" y="80" width="88" height="4" rx="2" fill="#10b981" className="animate-pulse" />

              {/* 360° LIDAR Mast and Rotating Dome */}
              <rect x="76" y="16" width="8" height="10" fill="#475569" />
              <ellipse cx="80" cy="14" rx="14" ry="6" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
              <circle cx="80" cy="14" r="3" fill="#ffffff" className="animate-ping" />

              {/* Stereo Optical Camera Rig Front */}
              <rect x="122" y="58" width="6" height="14" rx="2" fill="#38bdf8" />
              <circle cx="125" cy="62" r="1.5" fill="#ffffff" />
              <circle cx="125" cy="68" r="1.5" fill="#ffffff" />

              {/* Taillights Rear */}
              <rect x="30" y="58" width="4" height="10" rx="1.5" fill="#ef4444" />
            </svg>
          </div>

          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap bg-emerald-950/80 border border-emerald-500/40 text-[9px] font-mono text-emerald-300 px-2 py-0.5 rounded-full">
            {isScanning ? '⚡ LIDAR Scanning...' : 'Tap for Sensor Ping'}
          </div>
        </div>

        {/* Telemetry and Controls */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
              Autonomous Fleet
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px] border border-blue-500/30">
              LIDAR GPS Sync
            </span>
          </div>

          <h3 className="font-headline text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>Rover Alpha-4 (ED-V-882)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </h3>

          <p className="text-slate-300 text-xs mt-1 leading-relaxed">
            {statusText}. Whisper-quiet electric sidewalk transit with millimetric doorstep dock precision.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              <span className="material-symbols-outlined text-[14px] text-emerald-400">battery_charging_full</span>
              <span className="font-mono text-emerald-400 font-bold">{batteryLevel}%</span>
              <span className="text-[10px] text-slate-400">EV Power</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              <span className="material-symbols-outlined text-[14px] text-blue-400">speed</span>
              <span className="font-mono text-slate-200">3.8 mph</span>
              <span className="text-[10px] text-slate-400">Sidewalk Cruise</span>
            </div>

            <button
              onClick={() => setHatchOpen(!hatchOpen)}
              className="ml-auto px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition-all active:scale-95 shadow-sm flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[13px]">lock</span>
              <span>{hatchOpen ? 'Lock Vault' : 'Test Locker Hatch'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
