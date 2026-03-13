"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import Sidebar from '@/components/Layout/Sidebar';
import Header from '@/components/Layout/Header';
import {
    Clock,
    LogIn,
    LogOut,
    Calendar,
    Timer,
    Users,
    ChevronLeft,
    ChevronRight,
    Coffee,
    Loader2,
    CheckCircle,
    AlertCircle,
    Filter,
} from 'lucide-react';

interface AttendanceRecord {
    id: string;
    staff_id: string;
    clock_in: string;
    clock_out: string | null;
    work_date: string;
    total_minutes: number | null;
    notes: string | null;
    staff?: { name: string; role: string };
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDuration(mins: number | null): string {
    if (mins === null || mins === undefined) return '—';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function formatDateLabel(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getWeekRange(offset: number = 0): { from: string; to: string; label: string } {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay() + (offset * 7)); // Sunday
    const end = new Date(start);
    end.setDate(start.getDate() + 6); // Saturday

    return {
        from: start.toISOString().split('T')[0],
        to: end.toISOString().split('T')[0],
        label: `${start.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    };
}

export default function AttendancePage() {
    const { staff } = useAuthStore();
    const isAdmin = staff?.role === 'admin';

    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [clockedIn, setClockedIn] = useState(false);
    const [currentSession, setCurrentSession] = useState<AttendanceRecord | null>(null);
    const [elapsedMinutes, setElapsedMinutes] = useState(0);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [weekOffset, setWeekOffset] = useState(0);
    const [viewMode, setViewMode] = useState<'my' | 'all'>(isAdmin ? 'all' : 'my');

    // Date mode - week or custom
    const [dateMode, setDateMode] = useState<'week' | 'custom'>('week');
    const [customDateFrom, setCustomDateFrom] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    });
    const [customDateTo, setCustomDateTo] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });

    const week = getWeekRange(weekOffset);

    // Determine active date range based on mode
    const activeDateRange = dateMode === 'week'
        ? { from: week.from, to: week.to }
        : { from: customDateFrom, to: customDateTo };

    // Fetch attendance records
    const fetchRecords = useCallback(async () => {
        if (!staff) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ from: activeDateRange.from, to: activeDateRange.to });
            if (viewMode === 'all' && isAdmin) {
                params.set('all', 'true');
            } else {
                params.set('staff_id', staff.id);
            }

            const res = await fetch(`/api/attendance?${params.toString()}`);
            const data = await res.json();
            setRecords(Array.isArray(data) ? data : []);
        } catch {
            console.error('Failed to fetch attendance');
        } finally {
            setLoading(false);
        }
    }, [staff, activeDateRange.from, activeDateRange.to, viewMode, isAdmin]);

    // Check current clock-in status
    const checkStatus = useCallback(async () => {
        if (!staff || isAdmin) return;
        try {
            const params = new URLSearchParams({ staff_id: staff.id, today: 'true' });
            const res = await fetch(`/api/attendance?${params.toString()}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                const open = data.find((r: AttendanceRecord) => !r.clock_out);
                if (open) {
                    setClockedIn(true);
                    setCurrentSession(open);
                } else {
                    setClockedIn(false);
                    setCurrentSession(null);
                }
            }
        } catch {
            console.error('Failed to check status');
        }
    }, [staff, isAdmin]);

    useEffect(() => { fetchRecords(); }, [fetchRecords]);
    useEffect(() => { checkStatus(); }, [checkStatus]);

    // Live elapsed timer
    useEffect(() => {
        if (!clockedIn || !currentSession) return;
        const update = () => {
            const mins = Math.floor((Date.now() - new Date(currentSession.clock_in).getTime()) / 60000);
            setElapsedMinutes(mins);
        };
        update();
        const interval = setInterval(update, 30000); // update every 30s
        return () => clearInterval(interval);
    }, [clockedIn, currentSession]);

    // Handle clock in/out
    const handleClock = async (action: 'clock_in' | 'clock_out') => {
        if (!staff) return;
        setActionLoading(true);
        try {
            const res = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staff_id: staff.id, action }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setToast({ type: 'success', message: data.message });
            await checkStatus();
            await fetchRecords();
        } catch (err) {
            setToast({ type: 'error', message: err instanceof Error ? err.message : 'Something went wrong.' });
        } finally {
            setActionLoading(false);
            setTimeout(() => setToast(null), 3000);
        }
    };

    // Group records by date
    const groupedRecords = records.reduce<Record<string, AttendanceRecord[]>>((acc, record) => {
        const date = record.work_date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(record);
        return acc;
    }, {});

    // Weekly totals
    const weeklyTotalMinutes = records
        .filter(r => viewMode === 'my' ? r.staff_id === staff?.id : true)
        .reduce((sum, r) => sum + (r.total_minutes || 0), 0);

    const todayRecords = records.filter(r => {
        const today = new Date().toISOString().split('T')[0];
        return r.work_date === today && (viewMode === 'my' ? r.staff_id === staff?.id : true);
    });
    const todayTotalMinutes = todayRecords.reduce((sum, r) => sum + (r.total_minutes || 0), 0);

    return (
        <div className="flex h-screen bg-bg-app overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Header title="Attendance" />
                <main className="flex-1 overflow-y-auto p-6">
                    {/* Toast */}
                    {toast && (
                        <div className={`fixed top-20 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold shadow-lg animate-fade-in ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                            }`}>
                            {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                            {toast.message}
                        </div>
                    )}

                    {/* Clock In/Out Card — only for non-admin */}
                    {!isAdmin && (
                        <div className={`border rounded-3xl p-6 mb-6 shadow-sm transition-all ${clockedIn ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-border-light'}`}>
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                {/* Status indicator */}
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="relative">
                                        <div className={`size-14 rounded-2xl flex items-center justify-center ${clockedIn ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                            }`}>
                                            {clockedIn ? <Timer size={28} /> : <Coffee size={28} />}
                                        </div>
                                        {clockedIn && (
                                            <span className="absolute -top-1 -right-1 size-4 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-lg font-extrabold text-text-primary">
                                            {clockedIn ? '🟢 Currently On Shift' : 'Not Clocked In'}
                                        </p>
                                        {clockedIn && currentSession && (
                                            <p className="text-sm text-text-tertiary">
                                                Started at {formatTime(currentSession.clock_in)} · <span className="font-bold text-primary">{formatDuration(elapsedMinutes)}</span> elapsed
                                            </p>
                                        )}
                                        {!clockedIn && (
                                            <p className="text-sm text-text-tertiary">Tap the button below to start your shift</p>
                                        )}
                                    </div>
                                </div>

                                {/* Clock button */}
                                <button
                                    onClick={() => handleClock(clockedIn ? 'clock_out' : 'clock_in')}
                                    disabled={actionLoading}
                                    className={`flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-sm shadow-button transition-all active:scale-95 disabled:opacity-50 ${clockedIn
                                        ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25'
                                        : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25'
                                        }`}
                                >
                                    {actionLoading ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : clockedIn ? (
                                        <><LogOut size={18} /> Clock Out — End Shift</>
                                    ) : (
                                        <><LogIn size={18} /> Clock In — Start Shift</>
                                    )}
                                </button>
                            </div>
                            {clockedIn && (
                                <p className="text-xs text-emerald-600/70 font-semibold mt-4 text-center sm:text-left">
                                    ⏰ Remember to clock out here when your shift ends!
                                </p>
                            )}
                        </div>
                    )}

                    {/* Summary cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                        <div className="bg-white border border-border-light rounded-2xl p-4">
                            <div className="flex items-center gap-2 text-text-tertiary text-xs font-bold mb-1">
                                <Clock size={14} />
                                Today
                            </div>
                            <p className="text-xl font-extrabold text-text-primary">{formatDuration(todayTotalMinutes + (clockedIn ? elapsedMinutes : 0))}</p>
                        </div>
                        <div className="bg-white border border-border-light rounded-2xl p-4">
                            <div className="flex items-center gap-2 text-text-tertiary text-xs font-bold mb-1">
                                <Calendar size={14} />
                                This Week
                            </div>
                            <p className="text-xl font-extrabold text-text-primary">{formatDuration(weeklyTotalMinutes)}</p>
                        </div>
                        <div className="bg-white border border-border-light rounded-2xl p-4">
                            <div className="flex items-center gap-2 text-text-tertiary text-xs font-bold mb-1">
                                <LogIn size={14} />
                                Days Present
                            </div>
                            <p className="text-xl font-extrabold text-text-primary">
                                {viewMode === 'my'
                                    ? Object.keys(groupedRecords).length
                                    : new Set(records.map(r => r.work_date)).size
                                }
                            </p>
                        </div>
                        <div className="bg-white border border-border-light rounded-2xl p-4">
                            <div className="flex items-center gap-2 text-text-tertiary text-xs font-bold mb-1">
                                <Timer size={14} />
                                Avg / Day
                            </div>
                            <p className="text-xl font-extrabold text-text-primary">
                                {Object.keys(groupedRecords).length > 0
                                    ? formatDuration(Math.round(weeklyTotalMinutes / Object.keys(groupedRecords).length))
                                    : '—'
                                }
                            </p>
                        </div>
                    </div>

                    {/* Controls: Date mode + navigation + View toggle */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Date Mode Toggle */}
                            <div className="flex items-center bg-white border border-border-light rounded-xl p-1">
                                <button
                                    onClick={() => setDateMode('week')}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${dateMode === 'week' ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'text-text-secondary hover:bg-bg-muted'}`}
                                >
                                    Weekly
                                </button>
                                <button
                                    onClick={() => setDateMode('custom')}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${dateMode === 'custom' ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'text-text-secondary hover:bg-bg-muted'}`}
                                >
                                    Custom
                                </button>
                            </div>

                            {/* Week navigation - only when dateMode is 'week' */}
                            {dateMode === 'week' && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setWeekOffset(w => w - 1)}
                                        className="size-9 flex items-center justify-center rounded-xl border border-border-light bg-white hover:bg-bg-muted text-text-secondary transition"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <div className="px-4 py-2 rounded-xl bg-white border border-border-light text-sm font-bold text-text-primary min-w-[200px] text-center">
                                        <Calendar size={14} className="inline mr-2 text-primary" />
                                        {week.label}
                                    </div>
                                    <button
                                        onClick={() => setWeekOffset(w => Math.min(w + 1, 0))}
                                        disabled={weekOffset >= 0}
                                        className="size-9 flex items-center justify-center rounded-xl border border-border-light bg-white hover:bg-bg-muted text-text-secondary transition disabled:opacity-30"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                    {weekOffset !== 0 && (
                                        <button
                                            onClick={() => setWeekOffset(0)}
                                            className="text-xs font-bold text-primary hover:underline ml-1"
                                        >
                                            This Week
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Custom date range - only when dateMode is 'custom' */}
                            {dateMode === 'custom' && (
                                <div className="flex items-center gap-2 bg-white border border-border-light rounded-xl px-3 py-1.5 animate-fade-in">
                                    <Calendar size={14} className="text-primary shrink-0" />
                                    <input
                                        type="date"
                                        value={customDateFrom}
                                        onChange={(e) => setCustomDateFrom(e.target.value)}
                                        className="border border-border-light rounded-lg py-1.5 px-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white transition-all"
                                    />
                                    <span className="text-xs text-text-tertiary font-bold">→</span>
                                    <input
                                        type="date"
                                        value={customDateTo}
                                        onChange={(e) => setCustomDateTo(e.target.value)}
                                        className="border border-border-light rounded-lg py-1.5 px-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white transition-all"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Admin: My / All toggle */}
                        {isAdmin && (
                            <div className="flex items-center bg-white border border-border-light rounded-xl p-1">
                                <button
                                    onClick={() => setViewMode('all')}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'all' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-bg-muted'
                                        }`}
                                >
                                    <Users size={14} />
                                    All Staff
                                </button>
                                <button
                                    onClick={() => setViewMode('my')}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'my' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-bg-muted'
                                        }`}
                                >
                                    <Filter size={14} />
                                    Me
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Attendance records by date */}
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 size={24} className="animate-spin text-primary" />
                        </div>
                    ) : Object.keys(groupedRecords).length === 0 ? (
                        <div className="bg-white border border-border-light rounded-2xl p-12 text-center">
                            <Calendar size={40} className="mx-auto text-text-tertiary/40 mb-3" />
                            <p className="text-sm font-bold text-text-tertiary">No attendance records this week</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(groupedRecords)
                                .sort(([a], [b]) => b.localeCompare(a))
                                .map(([date, dayRecords]) => {
                                    const dayTotal = dayRecords.reduce((s, r) => s + (r.total_minutes || 0), 0);
                                    return (
                                        <div key={date} className="bg-white border border-border-light rounded-2xl overflow-hidden">
                                            {/* Day header */}
                                            <div className="flex items-center justify-between px-5 py-3 bg-bg-muted/50 border-b border-border-light">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-primary" />
                                                    <span className="text-sm font-extrabold text-text-primary">{formatDateLabel(date)}</span>
                                                    <span className="text-[10px] text-text-tertiary">{date}</span>
                                                </div>
                                                <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                                                    {formatDuration(dayTotal)}
                                                </span>
                                            </div>

                                            {/* Records */}
                                            <div className="divide-y divide-border-light">
                                                {dayRecords.map((record) => (
                                                    <div key={record.id} className="flex items-center gap-4 px-5 py-3">
                                                        {/* Staff name (admin view) */}
                                                        {viewMode === 'all' && isAdmin && record.staff && (
                                                            <div className="flex items-center gap-2 min-w-[140px]">
                                                                <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
                                                                    {record.staff.name.slice(0, 2).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-text-primary">{record.staff.name}</p>
                                                                    <p className="text-[10px] text-text-tertiary capitalize">{record.staff.role}</p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Clock in */}
                                                        <div className="flex items-center gap-1.5 min-w-[100px]">
                                                            <LogIn size={12} className="text-emerald-500" />
                                                            <span className="text-sm font-bold text-text-primary">{formatTime(record.clock_in)}</span>
                                                        </div>

                                                        {/* Arrow */}
                                                        <span className="text-text-tertiary text-xs">→</span>

                                                        {/* Clock out */}
                                                        <div className="flex items-center gap-1.5 min-w-[100px]">
                                                            <LogOut size={12} className={record.clock_out ? 'text-rose-500' : 'text-amber-400'} />
                                                            <span className={`text-sm font-bold ${record.clock_out ? 'text-text-primary' : 'text-amber-500'}`}>
                                                                {record.clock_out ? formatTime(record.clock_out) : 'Active'}
                                                            </span>
                                                        </div>

                                                        {/* Duration */}
                                                        <div className="flex-1 text-right">
                                                            <span className="text-xs font-bold text-text-tertiary bg-bg-muted px-3 py-1 rounded-full">
                                                                {record.total_minutes !== null
                                                                    ? formatDuration(record.total_minutes)
                                                                    : '⏱ In progress'
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
