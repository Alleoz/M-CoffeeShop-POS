"use client";

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Layout/Sidebar';
import Header from '@/components/Layout/Header';
import Modal from '@/components/UI/Modal';
import { getInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } from '@/lib/data';
import { InventoryItem } from '@/types/database';
import {
    Package,
    Search,
    Plus,
    AlertCircle,
    Edit3,
    Trash2,
    PackagePlus,
    CheckCircle,
} from 'lucide-react';
import { clsx } from 'clsx';

export default function InventoryPage() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [editItem, setEditItem] = useState<InventoryItem | null>(null);
    const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
    const [restockAmount, setRestockAmount] = useState('');
    const [mounted, setMounted] = useState(false);

    // Form state
    const [formName, setFormName] = useState('');
    const [formStock, setFormStock] = useState('');
    const [formUnit, setFormUnit] = useState('');
    const [formMinStock, setFormMinStock] = useState('');
    const [formCost, setFormCost] = useState('');
    const [formCategory, setFormCategory] = useState('');

    const refreshInventory = async () => {
        const data = await getInventory();
        setInventory(data);
    };

    useEffect(() => {
        refreshInventory().then(() => setMounted(true));
    }, []);

    const filteredInventory = inventory.filter(i =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const resetForm = () => {
        setFormName(''); setFormStock(''); setFormUnit(''); setFormMinStock(''); setFormCost(''); setFormCategory('');
    };

    const handleAddItem = async () => {
        if (!formName || !formUnit) return;
        await addInventoryItem({
            name: formName,
            stock: parseFloat(formStock) || 0,
            unit: formUnit,
            min_stock: parseFloat(formMinStock) || 0,
            cost_per_unit: parseFloat(formCost) || 0,
            category: formCategory || 'General',
        });
        resetForm();
        setShowAdd(false);
        await refreshInventory();
    };

    const handleEditItem = async () => {
        if (!editItem) return;
        await updateInventoryItem(editItem.id, {
            name: formName,
            stock: parseFloat(formStock) || 0,
            unit: formUnit,
            min_stock: parseFloat(formMinStock) || 0,
            cost_per_unit: parseFloat(formCost) || 0,
            category: formCategory || 'General',
        });
        resetForm();
        setEditItem(null);
        await refreshInventory();
    };

    const handleRestock = async () => {
        if (!restockItem || !restockAmount) return;
        await updateInventoryItem(restockItem.id, { stock: restockItem.stock + parseFloat(restockAmount) });
        setRestockItem(null);
        setRestockAmount('');
        await refreshInventory();
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this inventory item?')) {
            await deleteInventoryItem(id);
            await refreshInventory();
        }
    };

    const openEdit = (item: InventoryItem) => {
        setFormName(item.name);
        setFormStock(String(item.stock));
        setFormUnit(item.unit);
        setFormMinStock(String(item.min_stock));
        setFormCost(String(item.cost_per_unit));
        setFormCategory(item.category);
        setEditItem(item);
    };

    const getStatus = (item: InventoryItem) => {
        if (item.stock <= 0) return { label: 'Out of Stock', color: 'bg-red-50 text-red-600' };
        if (item.stock <= item.min_stock) return { label: 'Low Stock', color: 'bg-rose-50 text-rose-600' };
        return { label: 'Healthy', color: 'bg-emerald-50 text-emerald-600' };
    };

    const lowStockCount = inventory.filter(i => i.stock <= i.min_stock).length;

    return (
        <div className="flex bg-bg-app min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 md:p-6">

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 animate-fade-in">
                        <div>
                            <h1 className="text-2xl font-black tracking-tight font-display">Inventory</h1>
                            <p className="text-slate-500 text-sm mt-1">
                                {inventory.length} items tracked{lowStockCount > 0 && <span className="text-rose-500 font-bold"> • {lowStockCount} low stock</span>}
                            </p>
                        </div>
                        <button
                            onClick={() => { resetForm(); setShowAdd(true); }}
                            className="flex items-center justify-center gap-2 rounded-xl h-11 px-6 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all"
                        >
                            <Plus size={18} />
                            Add Supply
                        </button>
                    </div>

                    {/* Search */}
                    <div className="flex items-center gap-4 mb-6 animate-fade-in" style={{ animationDelay: '80ms' }}>
                        <div className="relative max-w-sm flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search inventory..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Inventory Table */}
                    <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm animate-slide-up">
                        <table className="w-full text-left text-sm min-w-[600px]">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 md:px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Item</th>
                                    <th className="px-4 md:px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider hidden sm:table-cell">Category</th>
                                    <th className="px-4 md:px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Stock</th>
                                    <th className="px-4 md:px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider hidden md:table-cell">Cost/Unit</th>
                                    <th className="px-4 md:px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Status</th>
                                    <th className="px-4 md:px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {mounted && filteredInventory.map((item) => {
                                    const status = getStatus(item);
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-4 md:px-6 py-4 font-bold">
                                                <div className="flex items-center gap-3">
                                                    <div className={clsx(
                                                        "size-9 rounded-lg flex items-center justify-center shrink-0",
                                                        item.stock <= item.min_stock ? "bg-rose-50 text-rose-500" : "bg-slate-100 text-slate-400"
                                                    )}>
                                                        <Package size={16} />
                                                    </div>
                                                    <div>
                                                        <span className="block">{item.name}</span>
                                                        <span className="sm:hidden text-[10px] text-slate-400 font-bold uppercase">{item.category}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 md:px-6 py-4 hidden sm:table-cell">
                                                <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className="px-4 md:px-6 py-4 text-slate-600 font-bold">
                                                {item.stock} {item.unit}
                                            </td>
                                            <td className="px-4 md:px-6 py-4 text-slate-600 font-medium hidden md:table-cell">
                                                ₱{item.cost_per_unit.toFixed(2)}
                                            </td>
                                            <td className="px-4 md:px-6 py-4">
                                                <span className={clsx("inline-flex items-center gap-1.5 px-2 md:px-3 py-1 rounded-full text-[10px] font-bold", status.color)}>
                                                    {status.label === 'Healthy' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                                                    <span className="hidden sm:inline">{status.label}</span>
                                                </span>
                                            </td>
                                            <td className="px-4 md:px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setRestockItem(item)} title="Restock" className="size-8 flex items-center justify-center rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors">
                                                        <PackagePlus size={15} />
                                                    </button>
                                                    <button onClick={() => openEdit(item)} title="Edit" className="size-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                                                        <Edit3 size={15} />
                                                    </button>
                                                    <button onClick={() => handleDelete(item.id)} title="Delete" className="size-8 flex items-center justify-center rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors">
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {mounted && filteredInventory.length === 0 && (
                            <div className="py-16 text-center text-slate-400 text-sm">
                                <Package size={36} className="mx-auto mb-3 opacity-50" />
                                <p className="font-bold">No inventory items found</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Add Modal */}
            <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add New Supply">
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Item Name</label>
                        <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Arabica Beans" className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white transition-all font-display" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Current Stock</label>
                            <input type="number" value={formStock} onChange={(e) => setFormStock(e.target.value)} placeholder="0" className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 bg-white transition-all" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Unit</label>
                            <input value={formUnit} onChange={(e) => setFormUnit(e.target.value)} placeholder="kg, L, pcs" className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 bg-white transition-all" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Min Stock Level</label>
                            <input type="number" value={formMinStock} onChange={(e) => setFormMinStock(e.target.value)} placeholder="0" className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 bg-white transition-all" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Cost per Unit (₱)</label>
                            <input type="number" value={formCost} onChange={(e) => setFormCost(e.target.value)} placeholder="0" className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 bg-white transition-all" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Category</label>
                        <input value={formCategory} onChange={(e) => setFormCategory(e.target.value)} placeholder="e.g. Coffee, Dairy, Packaging" className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white transition-all" />
                    </div>
                    <button onClick={handleAddItem} className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all text-sm">
                        Add to Inventory
                    </button>
                </div>
            </Modal>

            {/* Edit Modal */}
            <Modal isOpen={!!editItem} onClose={() => { setEditItem(null); resetForm(); }} title="Edit Supply">
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Item Name</label>
                        <input value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white transition-all font-display" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Current Stock</label>
                            <input type="number" value={formStock} onChange={(e) => setFormStock(e.target.value)} className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 bg-white transition-all" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Unit</label>
                            <input value={formUnit} onChange={(e) => setFormUnit(e.target.value)} className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 bg-white transition-all" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Min Stock Level</label>
                            <input type="number" value={formMinStock} onChange={(e) => setFormMinStock(e.target.value)} className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 bg-white transition-all" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Cost per Unit (₱)</label>
                            <input type="number" value={formCost} onChange={(e) => setFormCost(e.target.value)} className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 bg-white transition-all" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Category</label>
                        <input value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white transition-all" />
                    </div>
                    <button onClick={handleEditItem} className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all text-sm">
                        Update Item
                    </button>
                </div>
            </Modal>

            {/* Restock Modal */}
            <Modal isOpen={!!restockItem} onClose={() => { setRestockItem(null); setRestockAmount(''); }} title={`Restock: ${restockItem?.name}`}>
                <div className="space-y-4">
                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                        <p className="text-xs text-slate-400 font-bold mb-1">Current Stock</p>
                        <p className="text-2xl font-black">{restockItem?.stock} <span className="text-sm text-slate-400">{restockItem?.unit}</span></p>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Add Quantity</label>
                        <input
                            type="number"
                            value={restockAmount}
                            onChange={(e) => setRestockAmount(e.target.value)}
                            placeholder="Enter amount to add..."
                            className="w-full border border-slate-200 rounded-xl py-3 px-4 text-lg font-bold text-center outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white transition-all font-display"
                        />
                    </div>
                    {restockAmount && (
                        <div className="bg-emerald-50 rounded-xl p-4 text-center animate-fade-in">
                            <p className="text-xs text-emerald-600 font-bold mb-1">New Stock Level</p>
                            <p className="text-2xl font-black text-emerald-600">{((restockItem?.stock || 0) + parseFloat(restockAmount || '0')).toFixed(1)} {restockItem?.unit}</p>
                        </div>
                    )}
                    <button onClick={handleRestock} disabled={!restockAmount || parseFloat(restockAmount) <= 0} className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed">
                        Confirm Restock
                    </button>
                </div>
            </Modal>
        </div>
    );
}
