"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from '@/components/Layout/Sidebar';
import Header from '@/components/Layout/Header';
import Modal from '@/components/UI/Modal';
import ProductImage from '@/components/UI/ProductImage';
import { getProducts, addProduct, updateProduct, deleteProduct } from '@/lib/data';
import { uploadProductImage, isImageUrl } from '@/lib/storage';
import { Product } from '@/types/database';
import {
    Coffee,
    Search,
    Plus,
    Edit3,
    Trash2,
    CheckCircle,
    XCircle,
    ToggleLeft,
    ToggleRight,
    Tag,
    Grid3X3,
    List,
    Upload,
    ImageIcon,
    Loader2,
    X,
} from 'lucide-react';
import { clsx } from 'clsx';

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'unavailable'>('all');
    const [showAdd, setShowAdd] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [mounted, setMounted] = useState(false);

    // Form state
    const [formName, setFormName] = useState('');
    const [formPrice, setFormPrice] = useState('');
    const [formCategory, setFormCategory] = useState('');
    const [formImage, setFormImage] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formAvailable, setFormAvailable] = useState(true);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const refreshProducts = async () => {
        const data = await getProducts();
        setProducts(data);
    };

    useEffect(() => {
        refreshProducts().then(() => setMounted(true));
    }, []);

    // Derive unique categories from products
    const categories = useMemo(() => {
        const cats = new Set(products.map(p => p.category));
        return ['All', ...Array.from(cats).sort()];
    }, [products]);

    // Filtered products
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.category.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus =
                filterStatus === 'all' ||
                (filterStatus === 'available' && p.is_available) ||
                (filterStatus === 'unavailable' && !p.is_available);
            return matchesCategory && matchesSearch && matchesStatus;
        });
    }, [products, filterCategory, searchQuery, filterStatus]);

    // Stats
    const totalProducts = products.length;
    const availableCount = products.filter(p => p.is_available).length;
    const unavailableCount = products.filter(p => !p.is_available).length;

    const resetForm = () => {
        setFormName('');
        setFormPrice('');
        setFormCategory('');
        setFormImage('');
        setFormDescription('');
        setFormAvailable(true);
        setImagePreview(null);
        setImageFile(null);
        setUploadError('');
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setUploadError('Please select a valid image file (JPG, PNG, WebP)');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setUploadError('Image must be smaller than 5MB');
            return;
        }

        setUploadError('');
        setImageFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setFormImage('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleAddProduct = async () => {
        if (!formName || !formPrice || !formCategory) return;

        setUploading(true);
        try {
            let imageUrl = formImage;

            // Upload image if a new file is selected
            if (imageFile) {
                imageUrl = await uploadProductImage(imageFile);
            }

            await addProduct({
                name: formName,
                price: parseFloat(formPrice) || 0,
                category: formCategory,
                image: imageUrl || '☕',
                description: formDescription || undefined,
                is_available: formAvailable,
            });
            resetForm();
            setShowAdd(false);
            await refreshProducts();
        } catch (err) {
            setUploadError('Failed to upload image. Please try again.');
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const handleEditProduct = async () => {
        if (!editingProduct || !formName || !formPrice || !formCategory) return;

        setUploading(true);
        try {
            let imageUrl = formImage;

            // Upload new image if a new file was selected
            if (imageFile) {
                imageUrl = await uploadProductImage(imageFile);
            }

            await updateProduct(editingProduct.id, {
                name: formName,
                price: parseFloat(formPrice) || 0,
                category: formCategory,
                image: imageUrl || editingProduct.image,
                description: formDescription || undefined,
                is_available: formAvailable,
            });
            resetForm();
            setEditingProduct(null);
            await refreshProducts();
        } catch (err) {
            setUploadError('Failed to upload image. Please try again.');
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            await deleteProduct(id);
            await refreshProducts();
        }
    };

    const handleToggleAvailability = async (product: Product) => {
        await updateProduct(product.id, { is_available: !product.is_available });
        await refreshProducts();
    };

    const openEdit = (product: Product) => {
        setFormName(product.name);
        setFormPrice(String(product.price));
        setFormCategory(product.category);
        setFormImage(product.image);
        setFormDescription(product.description || '');
        setFormAvailable(product.is_available);
        // If product already has an image URL, show it as preview
        if (isImageUrl(product.image)) {
            setImagePreview(product.image);
        } else {
            setImagePreview(null);
        }
        setImageFile(null);
        setEditingProduct(product);
    };

    // ─── Product Form (shared between Add/Edit) ───
    const renderProductForm = (isEdit: boolean) => (
        <div className="space-y-4">
            {/* Image Upload */}
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Product Image</label>
                <div className="flex items-start gap-4">
                    {/* Image Preview / Upload Area */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={clsx(
                            "relative size-28 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden group shrink-0",
                            imagePreview
                                ? "border-primary/40"
                                : "border-slate-300 hover:border-primary/40 hover:bg-slate-50"
                        )}
                    >
                        {imagePreview ? (
                            <>
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                                {/* Overlay on hover */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Upload size={20} className="text-white" />
                                </div>
                            </>
                        ) : (
                            <div className="text-center">
                                <ImageIcon size={24} className="mx-auto mb-1.5 text-slate-400" />
                                <p className="text-[9px] font-bold text-slate-400 uppercase">Upload</p>
                            </div>
                        )}
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <div className="flex-1 space-y-2">
                        <p className="text-xs text-slate-500">
                            Upload a photo of your product. Recommended size: <span className="font-bold">500×500px</span>
                        </p>
                        <p className="text-[10px] text-slate-400">
                            Supports JPG, PNG, WebP • Max 5MB
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                            >
                                <Upload size={12} />
                                {imagePreview ? 'Change' : 'Browse'}
                            </button>
                            {imagePreview && (
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-xs font-bold text-rose-500 hover:bg-rose-50 transition-colors"
                                >
                                    <X size={12} />
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                {uploadError && (
                    <p className="text-xs text-rose-500 font-bold mt-2 animate-fade-in">{uploadError}</p>
                )}
            </div>

            {/* Product Name */}
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Product Name</label>
                <input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Caramel Latte"
                    className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white transition-all"
                />
            </div>

            {/* Price + Category */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Price (₱)</label>
                    <input
                        type="number"
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                        placeholder="0"
                        className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white transition-all"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Category</label>
                    <input
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        placeholder="e.g. Espresso, Frappe"
                        className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white transition-all"
                    />
                </div>
            </div>

            {/* Description */}
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Description (optional)</label>
                <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Short description of the product..."
                    rows={2}
                    className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white transition-all resize-none"
                />
            </div>

            {/* Availability Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
                <div>
                    <p className="text-sm font-bold">Available on Menu</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Product will be visible in the POS menu when enabled</p>
                </div>
                <button
                    type="button"
                    onClick={() => setFormAvailable(!formAvailable)}
                    className={clsx(
                        "transition-colors",
                        formAvailable ? "text-emerald-500" : "text-slate-300"
                    )}
                >
                    {formAvailable ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                </button>
            </div>

            {/* Submit button */}
            <button
                onClick={isEdit ? handleEditProduct : handleAddProduct}
                disabled={!formName || !formPrice || !formCategory || uploading}
                className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {uploading ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        Uploading...
                    </>
                ) : (
                    isEdit ? 'Update Product' : 'Add Product'
                )}
            </button>
        </div>
    );

    return (
        <div className="flex bg-bg-app min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 md:p-6">

                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 animate-fade-in">
                        <div>
                            <h1 className="text-2xl font-black tracking-tight font-display">Products</h1>
                            <p className="text-slate-500 text-sm mt-1">
                                {totalProducts} products • <span className="text-emerald-500 font-bold">{availableCount} available</span>
                                {unavailableCount > 0 && <span className="text-rose-500 font-bold"> • {unavailableCount} unavailable</span>}
                            </p>
                        </div>
                        <button
                            onClick={() => { resetForm(); setShowAdd(true); }}
                            className="flex items-center justify-center gap-2 rounded-xl h-11 px-6 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all"
                        >
                            <Plus size={18} />
                            Add Product
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6 animate-fade-in" style={{ animationDelay: '50ms' }}>
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Coffee size={18} className="text-primary" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black">{totalProducts}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                    <CheckCircle size={18} className="text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-emerald-600">{availableCount}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Available</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-rose-50 flex items-center justify-center">
                                    <XCircle size={18} className="text-rose-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-rose-600">{unavailableCount}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Unavailable</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search + Filters */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setFilterCategory(cat)}
                                    className={clsx(
                                        "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                                        filterCategory === cat
                                            ? "bg-primary text-white shadow-md shadow-primary/25"
                                            : "bg-white border border-slate-200 text-slate-500 hover:border-primary/40"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                        {/* Status Filter */}
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
                            {(['all', 'available', 'unavailable'] as const).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={clsx(
                                        "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                                        filterStatus === status
                                            ? "bg-primary/10 text-primary"
                                            : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                        {/* View Toggle */}
                        <div className="hidden md:flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
                            <button
                                onClick={() => setViewMode('table')}
                                className={clsx(
                                    "size-8 flex items-center justify-center rounded-lg transition-all",
                                    viewMode === 'table' ? "bg-primary/10 text-primary" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <List size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={clsx(
                                    "size-8 flex items-center justify-center rounded-lg transition-all",
                                    viewMode === 'grid' ? "bg-primary/10 text-primary" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <Grid3X3 size={16} />
                            </button>
                        </div>
                    </div>

                    {/* ─── Table View ─── */}
                    {viewMode === 'table' && (
                        <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm animate-slide-up">
                            <table className="w-full text-left text-sm min-w-[650px]">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 md:px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Product</th>
                                        <th className="px-4 md:px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider hidden sm:table-cell">Category</th>
                                        <th className="px-4 md:px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Price</th>
                                        <th className="px-4 md:px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Status</th>
                                        <th className="px-4 md:px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {mounted && filteredProducts.map((product) => (
                                        <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-4 md:px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <ProductImage
                                                        image={product.image}
                                                        name={product.name}
                                                        size="sm"
                                                        className="size-11 bg-slate-50 rounded-xl border border-slate-200 shrink-0"
                                                    />
                                                    <div>
                                                        <span className="font-bold block">{product.name}</span>
                                                        <span className="sm:hidden text-[10px] text-slate-400 font-bold uppercase">{product.category}</span>
                                                        {product.description && (
                                                            <span className="hidden md:block text-[10px] text-slate-400 truncate max-w-[200px]">{product.description}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 md:px-6 py-4 hidden sm:table-cell">
                                                <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                                    <Tag size={10} />
                                                    {product.category}
                                                </span>
                                            </td>
                                            <td className="px-4 md:px-6 py-4">
                                                <span className="font-black text-primary">₱{product.price.toFixed(0)}</span>
                                            </td>
                                            <td className="px-4 md:px-6 py-4">
                                                <button
                                                    onClick={() => handleToggleAvailability(product)}
                                                    className={clsx(
                                                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer",
                                                        product.is_available
                                                            ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                                            : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                                                    )}
                                                >
                                                    {product.is_available ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                    <span className="hidden sm:inline">{product.is_available ? 'Available' : 'Unavailable'}</span>
                                                </button>
                                            </td>
                                            <td className="px-4 md:px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openEdit(product)}
                                                        title="Edit product"
                                                        className="size-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                                                    >
                                                        <Edit3 size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(product.id)}
                                                        title="Delete product"
                                                        className="size-8 flex items-center justify-center rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {mounted && filteredProducts.length === 0 && (
                                <div className="py-16 text-center text-slate-400 text-sm">
                                    <Coffee size={36} className="mx-auto mb-3 opacity-50" />
                                    <p className="font-bold">No products found</p>
                                    <p className="text-xs mt-1">Try adjusting your search or filters</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── Grid View ─── */}
                    {viewMode === 'grid' && (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4 animate-slide-up">
                            {mounted && filteredProducts.map((product, idx) => (
                                <div
                                    key={product.id}
                                    className={clsx(
                                        "bg-white border rounded-2xl shadow-sm group card-hover animate-fade-in relative overflow-hidden",
                                        product.is_available
                                            ? "border-slate-200"
                                            : "border-rose-200 opacity-60"
                                    )}
                                    style={{ animationDelay: `${(idx % 10) * 40}ms` }}
                                >
                                    {/* Status badge */}
                                    <div className="absolute top-3 right-3 z-10">
                                        <button
                                            onClick={() => handleToggleAvailability(product)}
                                            className={clsx(
                                                "size-7 rounded-full flex items-center justify-center transition-all shadow-sm",
                                                product.is_available
                                                    ? "bg-emerald-100 text-emerald-500 hover:bg-emerald-200"
                                                    : "bg-rose-100 text-rose-500 hover:bg-rose-200"
                                            )}
                                        >
                                            {product.is_available ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                        </button>
                                    </div>

                                    {/* Image */}
                                    <ProductImage
                                        image={product.image}
                                        name={product.name}
                                        size="lg"
                                        className="aspect-square bg-slate-50 group-hover:scale-105 transition-transform"
                                    />

                                    {/* Info */}
                                    <div className="p-4">
                                        <h3 className="font-bold text-sm mb-1 truncate">{product.name}</h3>
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-primary font-black text-lg">₱{product.price.toFixed(0)}</p>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">
                                                {product.category}
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100">
                                            <button
                                                onClick={() => openEdit(product)}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                            >
                                                <Edit3 size={13} />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                            >
                                                <Trash2 size={13} />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {mounted && filteredProducts.length === 0 && (
                                <div className="col-span-full py-20 text-center text-slate-400">
                                    <Coffee size={40} className="mx-auto mb-3 opacity-50" />
                                    <p className="text-sm font-bold">No products found</p>
                                    <p className="text-xs mt-1">Try adjusting your search or filters</p>
                                </div>
                            )}
                        </div>
                    )}

                </main>
            </div>

            {/* Add Product Modal */}
            <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); resetForm(); }} title="Add New Product">
                {renderProductForm(false)}
            </Modal>

            {/* Edit Product Modal */}
            <Modal isOpen={!!editingProduct} onClose={() => { setEditingProduct(null); resetForm(); }} title="Edit Product">
                {renderProductForm(true)}
            </Modal>
        </div>
    );
}
