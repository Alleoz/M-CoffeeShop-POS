"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Layout/Sidebar';
import Header from '@/components/Layout/Header';
import {
    Users,
    Plus,
    Edit2,
    UserX,
    UserCheck,
    Shield,
    ShoppingCart,
    ChefHat,
    Crown,
    KeyRound,
    X,
    AlertCircle,
    CheckCircle,
    Loader2,
} from 'lucide-react';

interface StaffMember {
    id: string;
    name: string;
    role: 'admin' | 'manager' | 'cashier' | 'barista';
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

const ROLE_CONFIG = {
    admin: { label: 'Admin', icon: Crown, color: 'bg-amber-100 text-amber-700 border-amber-200', desc: 'Full access to all features' },
    manager: { label: 'Manager', icon: Shield, color: 'bg-blue-100 text-blue-700 border-blue-200', desc: 'POS, inventory, reports' },
    cashier: { label: 'Cashier', icon: ShoppingCart, color: 'bg-emerald-100 text-emerald-700 border-emerald-200', desc: 'POS & orders only' },
    barista: { label: 'Barista', icon: ChefHat, color: 'bg-purple-100 text-purple-700 border-purple-200', desc: 'Kitchen display only' },
};

export default function StaffPage() {
    const { staff: currentStaff } = useAuthStore();
    const router = useRouter();
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
    const [formData, setFormData] = useState({ name: '', role: 'cashier', pin: '' });
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Redirect non-admins
    useEffect(() => {
        if (currentStaff && currentStaff.role !== 'admin') {
            router.replace('/dashboard');
        }
    }, [currentStaff, router]);

    const fetchStaff = useCallback(async () => {
        try {
            const res = await fetch('/api/staff');
            const data = await res.json();
            setStaffList(Array.isArray(data) ? data : []);
        } catch {
            console.error('Failed to fetch staff');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStaff(); }, [fetchStaff]);

    const openAddModal = () => {
        setEditingStaff(null);
        setFormData({ name: '', role: 'cashier', pin: '' });
        setFormError('');
        setFormSuccess('');
        setShowModal(true);
    };

    const openEditModal = (member: StaffMember) => {
        setEditingStaff(member);
        setFormData({ name: member.name, role: member.role, pin: '' });
        setFormError('');
        setFormSuccess('');
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setFormSuccess('');
        setSubmitting(true);

        try {
            if (editingStaff) {
                // Update
                const body: Record<string, string> = { id: editingStaff.id, name: formData.name, role: formData.role };
                if (formData.pin) body.pin = formData.pin;

                const res = await fetch('/api/staff', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                setFormSuccess('Staff updated successfully!');
            } else {
                // Create
                if (!formData.pin) {
                    setFormError('PIN is required for new staff.');
                    setSubmitting(false);
                    return;
                }
                const res = await fetch('/api/staff', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                setFormSuccess('Staff created successfully!');
            }

            await fetchStaff();
            setTimeout(() => setShowModal(false), 800);
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Something went wrong.');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleActive = async (member: StaffMember) => {
        if (member.id === currentStaff?.id) return; // Can't deactivate yourself

        try {
            const res = await fetch('/api/staff', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: member.id, is_active: !member.is_active }),
            });
            if (res.ok) await fetchStaff();
        } catch {
            console.error('Failed to toggle staff status');
        }
    };

    if (currentStaff?.role !== 'admin') return null;

    const activeStaff = staffList.filter(s => s.is_active);
    const inactiveStaff = staffList.filter(s => !s.is_active);

    return (
        <div className="flex h-screen bg-bg-app overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Header title="Staff Management" />
                <main className="flex-1 overflow-y-auto p-6">
                    {/* Header bar */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-extrabold text-text-primary">Team Members</h2>
                            <p className="text-sm text-text-tertiary mt-0.5">
                                {activeStaff.length} active · {inactiveStaff.length} inactive
                            </p>
                        </div>
                        <button
                            onClick={openAddModal}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-text-on-primary rounded-full font-bold text-sm shadow-button hover:opacity-90 active:scale-95 transition-all"
                        >
                            <Plus size={16} strokeWidth={2.5} />
                            Add Staff
                        </button>
                    </div>

                    {/* Role legend */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                        {(Object.keys(ROLE_CONFIG) as Array<keyof typeof ROLE_CONFIG>).map((role) => {
                            const config = ROLE_CONFIG[role];
                            const count = activeStaff.filter(s => s.role === role).length;
                            return (
                                <div key={role} className="bg-white border border-border-light rounded-2xl p-4 flex items-center gap-3">
                                    <div className={`p-2 rounded-xl border ${config.color}`}>
                                        <config.icon size={16} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-text-primary">{config.label} <span className="text-text-tertiary font-normal">({count})</span></p>
                                        <p className="text-[10px] text-text-tertiary">{config.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Staff list */}
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 size={24} className="animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="bg-white border border-border-light rounded-2xl overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border-light bg-bg-muted/50">
                                        <th className="text-left px-6 py-3 text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary">Name</th>
                                        <th className="text-left px-6 py-3 text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary">Role</th>
                                        <th className="text-left px-6 py-3 text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary">Status</th>
                                        <th className="text-left px-6 py-3 text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary">Joined</th>
                                        <th className="text-right px-6 py-3 text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light">
                                    {staffList.map((member) => {
                                        const config = ROLE_CONFIG[member.role];
                                        const isSelf = member.id === currentStaff?.id;
                                        return (
                                            <tr key={member.id} className={!member.is_active ? 'opacity-50' : ''}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                            {member.name.slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-text-primary">
                                                                {member.name} {isSelf && <span className="text-primary text-[10px]">(You)</span>}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${config.color}`}>
                                                        <config.icon size={12} />
                                                        {config.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${member.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                        <div className={`size-1.5 rounded-full ${member.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                        {member.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-text-tertiary">
                                                    {new Date(member.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center gap-1 justify-end">
                                                        <button
                                                            onClick={() => openEditModal(member)}
                                                            className="p-2 rounded-lg hover:bg-bg-muted text-text-tertiary hover:text-text-primary transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        {!isSelf && (
                                                            <button
                                                                onClick={() => toggleActive(member)}
                                                                className={`p-2 rounded-lg transition-colors ${member.is_active ? 'hover:bg-rose-50 text-text-tertiary hover:text-rose-500' : 'hover:bg-emerald-50 text-text-tertiary hover:text-emerald-500'}`}
                                                                title={member.is_active ? 'Deactivate' : 'Reactivate'}
                                                            >
                                                                {member.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </main>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between p-6 pb-0">
                            <h3 className="text-lg font-extrabold text-text-primary">
                                {editingStaff ? 'Edit Staff' : 'Add New Staff'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-bg-muted text-text-tertiary">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg-muted text-sm font-medium text-text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                                    placeholder="e.g. Juan Dela Cruz"
                                    required
                                />
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-1.5">Role</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(Object.keys(ROLE_CONFIG) as Array<keyof typeof ROLE_CONFIG>).map((role) => {
                                        const config = ROLE_CONFIG[role];
                                        const selected = formData.role === role;
                                        return (
                                            <button
                                                key={role}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, role }))}
                                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${selected
                                                        ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
                                                        : 'border-border-light hover:bg-bg-muted text-text-secondary'
                                                    }`}
                                            >
                                                <config.icon size={14} />
                                                {config.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* PIN */}
                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <KeyRound size={12} />
                                        {editingStaff ? 'New PIN (leave empty to keep current)' : 'Login PIN'}
                                    </div>
                                </label>
                                <input
                                    type="password"
                                    value={formData.pin}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setFormData(prev => ({ ...prev, pin: val }));
                                    }}
                                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg-muted text-sm font-medium text-text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition tracking-[0.3em]"
                                    placeholder="4-6 digit PIN"
                                    minLength={editingStaff ? 0 : 4}
                                    maxLength={6}
                                    required={!editingStaff}
                                />
                            </div>

                            {/* Error/Success */}
                            {formError && (
                                <div className="flex items-center gap-2 text-rose-500 text-xs font-bold bg-rose-50 rounded-xl px-4 py-3">
                                    <AlertCircle size={14} />
                                    {formError}
                                </div>
                            )}
                            {formSuccess && (
                                <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold bg-emerald-50 rounded-xl px-4 py-3">
                                    <CheckCircle size={14} />
                                    {formSuccess}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 rounded-xl bg-primary text-text-on-primary font-bold text-sm shadow-button hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <>
                                        {editingStaff ? <Edit2 size={14} /> : <Plus size={14} />}
                                        {editingStaff ? 'Update Staff' : 'Create Staff'}
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
