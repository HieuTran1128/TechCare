import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Upload, Download, Plus, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { inventoryService, ticketService } from '../services';
import { InventoryRequestList } from '../components/inventory';
import type { Part, ImportRecord, UsageRecord, StockAlert, Supplier, InventoryStats, InventoryKPI, InventoryRequest } from '../types';

type TabType = 'parts' | 'import' | 'usage' | 'alerts' | 'suppliers' | 'requests' | 'kpi';
type SortOption = 'name-asc' | 'price-desc' | 'price-asc' | 'stock-desc' | 'stock-asc';

const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const BOM = '\uFEFF';
  const csv = BOM + [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

export const Inventory: React.FC = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';
  const isStorekeeper = user?.role === 'storekeeper';

  const [parts, setParts] = useState<Part[]>([]);
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [usageHistory, setUsageHistory] = useState<UsageRecord[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [requests, setRequests] = useState<InventoryRequest[]>([]);
  const [stats, setStats] = useState<InventoryStats>({ totalParts: 0, totalQuantity: 0, lowStock: 0, outOfStock: 0 });
  const [kpi, setKpi] = useState<InventoryKPI | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<TabType>('parts');
  const [feedback, setFeedback] = useState('');
  const [search, setSearch] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('name-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // KPI filters
  const todayStr = new Date().toISOString().slice(0, 10);
  const firstDayStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const [kpiFrom, setKpiFrom] = useState(firstDayStr);
  const [kpiTo, setKpiTo] = useState(todayStr);
  const [kpiPeriod, setKpiPeriod] = useState<'month' | 'quarter' | 'year' | 'custom'>('month');
  const [kpiLoading, setKpiLoading] = useState(false);
  const [kpiDetailPage, setKpiDetailPage] = useState(1);
  const [kpiDetailSearch, setKpiDetailSearch] = useState('');
  const [kpiDetailSort, setKpiDetailSort] = useState<'name' | 'stock' | 'value' | 'turnover' | 'profit'>('value');

  // History pagination
  const historyPageSize = 15;
  const [importPage, setImportPage] = useState(1);
  const [usagePage, setUsagePage] = useState(1);
  const [importSearch, setImportSearch] = useState('');
  const [usageSearch, setUsageSearch] = useState('');

  // Part form
  const [form, setForm] = useState({ partName: '', brand: '', imageUrl: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState('');
  const [importModalPart, setImportModalPart] = useState<Part | null>(null);
  const [importQty, setImportQty] = useState<Record<string, string>>({});
  const [importPrice, setImportPrice] = useState<Record<string, string>>({});
  const [importSupplier, setImportSupplier] = useState<Record<string, string>>({});
  const [importNote, setImportNote] = useState<Record<string, string>>({});
  const [alertMsg, setAlertMsg] = useState<Record<string, string>>({});

  // Supplier form
  const [supplierForm, setSupplierForm] = useState({ name: '', phone: '', email: '', address: '', note: '' });
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Bulk import
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkSupplierId, setBulkSupplierId] = useState('');
  const [bulkNote, setBulkNote] = useState('');
  const [bulkItems, setBulkItems] = useState<{ partId: string; quantity: string; importPrice: string }[]>([{ partId: '', quantity: '', importPrice: '' }]);

  const showFeedback = (msg: string) => { setFeedback(msg); setTimeout(() => setFeedback(''), 3000); };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [partsData, statsData, alertsData] = await Promise.all([
        inventoryService.getAllParts(search),
        inventoryService.getStats(),
        inventoryService.getAlerts(),
      ]);
      setParts(partsData || []);
      setStats(statsData);
      setAlerts(alertsData || []);
      if (isManager) {
        const [importsData, suppliersData, kpiData] = await Promise.all([
          inventoryService.getImportHistory(),
          inventoryService.getAllSuppliers(),
          inventoryService.getKPI(kpiFrom, kpiTo),
        ]);
        setImports(importsData || []);
        setSuppliers(suppliersData || []);
        setKpi(kpiData);
      }
      if (isStorekeeper) {
        const [usageData, reqRes] = await Promise.all([
          inventoryService.getUsageHistory(),
          ticketService.getAll({ limit: 100, sort: '-createdAt', includeAll: true }),
        ]);
        setUsageHistory(usageData || []);
        const filtered = ((reqRes.data || []) as InventoryRequest[]).filter((t) => ['PENDING', 'APPROVED', 'REJECTED'].includes(t.inventoryRequest?.status || ''));
        setRequests(filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, [search]);
  useEffect(() => { setCurrentPage(1); }, [search]);

  const lowStockParts = useMemo(() => parts.filter((p) => p.stock > 0 && p.stock < p.minStock), [parts]);
  const outOfStockParts = useMemo(() => parts.filter((p) => p.stock <= 0), [parts]);

  const sortedParts = useMemo(() => {
    const s = [...parts];
    switch (sortOption) {
      case 'price-asc': s.sort((a, b) => a.price - b.price); break;
      case 'price-desc': s.sort((a, b) => b.price - a.price); break;
      case 'stock-asc': s.sort((a, b) => a.stock - b.stock); break;
      case 'stock-desc': s.sort((a, b) => b.stock - a.stock); break;
      default: s.sort((a, b) => a.partName.localeCompare(b.partName, 'vi', { sensitivity: 'base' }));
    }
    return s;
  }, [parts, sortOption]);

  const totalPages = Math.max(1, Math.ceil(sortedParts.length / pageSize));
  const pagedParts = useMemo(() => sortedParts.slice((currentPage - 1) * pageSize, currentPage * pageSize), [sortedParts, currentPage]);

  const filteredImports = useMemo(() => {
    if (!importSearch.trim()) return imports;
    const q = importSearch.toLowerCase();
    return imports.filter((i) => i.product?.partName?.toLowerCase().includes(q) || i.supplier?.name?.toLowerCase().includes(q) || i.batchCode?.toLowerCase().includes(q) || i.createdBy?.fullName?.toLowerCase().includes(q));
  }, [imports, importSearch]);
  const importTotalPages = Math.max(1, Math.ceil(filteredImports.length / historyPageSize));
  const pagedImports = useMemo(() => filteredImports.slice((importPage - 1) * historyPageSize, importPage * historyPageSize), [filteredImports, importPage]);

  const filteredUsage = useMemo(() => {
    if (!usageSearch.trim()) return usageHistory;
    const q = usageSearch.toLowerCase();
    return usageHistory.filter((i) => i.part?.partName?.toLowerCase().includes(q) || i.ticket?.ticketCode?.toLowerCase().includes(q) || i.createdBy?.fullName?.toLowerCase().includes(q));
  }, [usageHistory, usageSearch]);
  const usageTotalPages = Math.max(1, Math.ceil(filteredUsage.length / historyPageSize));
  const pagedUsage = useMemo(() => filteredUsage.slice((usagePage - 1) * historyPageSize, usagePage * historyPageSize), [filteredUsage, usagePage]);

  const filteredKpiDetail = useMemo(() => {
    if (!kpi) return [];
    let rows = [...kpi.partDetails];
    if (kpiDetailSearch.trim()) { const q = kpiDetailSearch.toLowerCase(); rows = rows.filter((r) => r.partName.toLowerCase().includes(q) || r.brand.toLowerCase().includes(q)); }
    switch (kpiDetailSort) {
      case 'stock': rows.sort((a, b) => b.stock - a.stock); break;
      case 'value': rows.sort((a, b) => b.inventoryValue - a.inventoryValue); break;
      case 'turnover': rows.sort((a, b) => parseFloat(b.turnoverRate) - parseFloat(a.turnoverRate)); break;
      case 'profit': rows.sort((a, b) => parseFloat(b.profitMargin) - parseFloat(a.profitMargin)); break;
      default: rows.sort((a, b) => a.partName.localeCompare(b.partName, 'vi'));
    }
    return rows;
  }, [kpi, kpiDetailSearch, kpiDetailSort]);
  const kpiDetailPageSize = 10;
  const kpiDetailTotalPages = Math.max(1, Math.ceil(filteredKpiDetail.length / kpiDetailPageSize));
  const pagedKpiDetail = useMemo(() => filteredKpiDetail.slice((kpiDetailPage - 1) * kpiDetailPageSize, kpiDetailPage * kpiDetailPageSize), [filteredKpiDetail, kpiDetailPage]);

  const getImportStats = (partId: string) => {
    const history = imports.filter((i) => i.product?._id === partId);
    if (!history.length) return { latestPrice: 0, avgPrice: 0 };
    const sorted = [...history].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return { latestPrice: sorted[0]?.importPrice || 0, avgPrice: history.reduce((s, i) => s + i.importPrice, 0) / history.length };
  };

  const createPart = async () => {
    if (!form.partName.trim()) { showFeedback('Vui lòng nhập tên linh kiện.'); return; }
    if (!imageFile) { showFeedback('Vui lòng tải ảnh linh kiện.'); return; }
    try {
      await inventoryService.createPart(form);
      setForm({ partName: '', brand: '', imageUrl: '' }); setImageFile(null); setImagePreview('');
      showFeedback('Đã thêm linh kiện thành công.');
      await Promise.all([inventoryService.getAllParts(search).then(setParts), inventoryService.getStats().then(setStats)]);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      showFeedback(err.response?.status === 413 ? 'Ảnh quá lớn, vui lòng chọn ảnh nhỏ hơn 2MB.' : msg || 'Không thể thêm linh kiện.');
    }
  };

  const updatePart = async () => {
    if (!selectedPart) return;
    if (!selectedPart.partName?.trim()) { showFeedback('Vui lòng nhập tên linh kiện.'); return; }
    if (!editPrice.trim() || Number.isNaN(Number(editPrice))) { showFeedback('Giá không hợp lệ.'); return; }
    try {
      setLoading(true);
      await inventoryService.updatePart(selectedPart._id, { ...selectedPart, price: Number(editPrice.trim()) });
      setSelectedPart(null); setEditImageFile(null); setEditImagePreview(''); setEditPrice('');
      showFeedback('Cập nhật linh kiện thành công.');
      inventoryService.getAllParts(search).then(setParts);
    } catch (err: any) { showFeedback(err.response?.data?.message || 'Không thể cập nhật linh kiện.'); }
    finally { setLoading(false); }
  };

  const deletePart = async (id: string) => {
    if (!window.confirm('Xóa linh kiện này?')) return;
    await inventoryService.deletePart(id);
    inventoryService.getAllParts(search).then(setParts);
    inventoryService.getStats().then(setStats);
  };

  const importStock = async (id: string) => {
    const qty = Number(importQty[id] ?? '');
    const price = Number(importPrice[id] ?? '');
    const supplierId = importSupplier[id];
    if (!supplierId) { showFeedback('Vui lòng chọn nhà cung cấp.'); return; }
    if (!qty || qty <= 0) { showFeedback('Số lượng nhập phải lớn hơn 0.'); return; }
    try {
      setLoading(true);
      await inventoryService.importStock(id, { quantity: qty, importPrice: price, supplierId, note: importNote[id] });
      setImportQty((p) => { const n = { ...p }; delete n[id]; return n; });
      setImportPrice((p) => { const n = { ...p }; delete n[id]; return n; });
      setImportSupplier((p) => { const n = { ...p }; delete n[id]; return n; });
      setImportNote((p) => { const n = { ...p }; delete n[id]; return n; });
      setImportModalPart(null);
      showFeedback('Đã nhập kho thành công.');
      await Promise.all([inventoryService.getAllParts(search).then(setParts), inventoryService.getImportHistory().then(setImports), inventoryService.getStats().then(setStats)]);
    } catch (err: any) { showFeedback(err.response?.data?.message || 'Không thể nhập kho.'); }
    finally { setLoading(false); }
  };

  const bulkImport = async () => {
    if (!bulkSupplierId) { showFeedback('Vui lòng chọn nhà cung cấp.'); return; }
    const validItems = bulkItems.filter((i) => i.partId && Number(i.quantity) > 0);
    if (!validItems.length) { showFeedback('Vui lòng thêm ít nhất 1 linh kiện hợp lệ.'); return; }
    try {
      setLoading(true);
      await inventoryService.bulkImport({ supplierId: bulkSupplierId, note: bulkNote, items: validItems.map((i) => ({ partId: i.partId, quantity: Number(i.quantity), importPrice: Number(i.importPrice) || 0 })) });
      setBulkModalOpen(false); setBulkSupplierId(''); setBulkNote(''); setBulkItems([{ partId: '', quantity: '', importPrice: '' }]);
      showFeedback('Nhập hàng loạt thành công.');
      await Promise.all([inventoryService.getAllParts(search).then(setParts), inventoryService.getImportHistory().then(setImports), inventoryService.getStats().then(setStats), inventoryService.getKPI(kpiFrom, kpiTo).then(setKpi)]);
    } catch (err: any) { showFeedback(err.response?.data?.message || 'Không thể nhập hàng loạt.'); }
    finally { setLoading(false); }
  };

  const createAlert = async (id: string) => {
    const message = alertMsg[id] || '';
    if (!message.trim()) return;
    await inventoryService.createAlert(id, message);
    setAlertMsg((p) => ({ ...p, [id]: '' }));
    inventoryService.getAlerts().then(setAlerts);
  };

  const respondRequest = async (ticketId: string, available: boolean) => {
    await ticketService.respondInventoryRequest(ticketId, { available, noteFromStorekeeper: available ? 'Kho đã duyệt yêu cầu.' : 'Kho không đủ linh kiện.' });
    const reqRes = await ticketService.getAll({ limit: 100, sort: '-createdAt', includeAll: true });
    const filtered = ((reqRes.data || []) as InventoryRequest[]).filter((t) => ['PENDING', 'APPROVED', 'REJECTED'].includes(t.inventoryRequest?.status || ''));
    setRequests(filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
    inventoryService.getAlerts().then(setAlerts);
  };

  const createSupplier = async () => {
    if (!supplierForm.name.trim()) { showFeedback('Vui lòng nhập tên nhà cung cấp.'); return; }
    try {
      await inventoryService.createSupplier(supplierForm as any);
      setSupplierForm({ name: '', phone: '', email: '', address: '', note: '' });
      showFeedback('Đã thêm nhà cung cấp.');
      inventoryService.getAllSuppliers().then(setSuppliers);
    } catch (err: any) { showFeedback(err.response?.data?.message || 'Không thể tạo nhà cung cấp.'); }
  };

  const updateSupplier = async () => {
    if (!editingSupplier) return;
    try {
      await inventoryService.updateSupplier(editingSupplier._id, supplierForm);
      setEditingSupplier(null); setSupplierForm({ name: '', phone: '', email: '', address: '', note: '' });
      showFeedback('Đã cập nhật nhà cung cấp.');
      inventoryService.getAllSuppliers().then(setSuppliers);
    } catch (err: any) { showFeedback(err.response?.data?.message || 'Không thể cập nhật nhà cung cấp.'); }
  };

  const deleteSupplier = async (id: string) => {
    if (!window.confirm('Xóa nhà cung cấp này?')) return;
    try {
      await inventoryService.deleteSupplier(id);
      showFeedback('Đã xóa nhà cung cấp.');
      inventoryService.getAllSuppliers().then(setSuppliers);
    } catch (err: any) { showFeedback(err.response?.data?.message || 'Không thể xóa nhà cung cấp.'); }
  };

  const applyKpiFilter = async () => {
    setKpiLoading(true);
    try { await inventoryService.getKPI(kpiFrom, kpiTo).then(setKpi); } finally { setKpiLoading(false); }
  };

  const setPeriodPreset = (period: 'month' | 'quarter' | 'year' | 'custom') => {
    setKpiPeriod(period);
    const now = new Date();
    if (period === 'month') { setKpiFrom(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)); setKpiTo(now.toISOString().slice(0, 10)); }
    else if (period === 'quarter') { const q = Math.floor(now.getMonth() / 3); setKpiFrom(new Date(now.getFullYear(), q * 3, 1).toISOString().slice(0, 10)); setKpiTo(now.toISOString().slice(0, 10)); }
    else if (period === 'year') { setKpiFrom(new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10)); setKpiTo(now.toISOString().slice(0, 10)); }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) { showFeedback('Chỉ chấp nhận ảnh JPG hoặc PNG.'); return; }
    if (file.size > 2 * 1024 * 1024) { showFeedback('Kích thước ảnh tối đa 2MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (isEdit) { setEditImageFile(file); setEditImagePreview(result); if (selectedPart) setSelectedPart({ ...selectedPart, imageUrl: result }); }
      else { setImageFile(file); setImagePreview(result); setForm({ ...form, imageUrl: result }); }
    };
    reader.readAsDataURL(file);
  };

  const PaginationLocal = ({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) => (
    <div className="flex items-center justify-between mt-3">
      <p className="text-xs text-slate-500">Trang {page} / {total}</p>
      <div className="flex gap-1.5">
        <button onClick={() => onChange(1)} disabled={page === 1} className="px-2 py-1 rounded border text-xs disabled:opacity-40">«</button>
        <button onClick={() => onChange(page - 1)} disabled={page === 1} className="px-2 py-1 rounded border text-xs disabled:opacity-40">‹</button>
        <button onClick={() => onChange(page + 1)} disabled={page === total} className="px-2 py-1 rounded border text-xs disabled:opacity-40">›</button>
        <button onClick={() => onChange(total)} disabled={page === total} className="px-2 py-1 rounded border text-xs disabled:opacity-40">»</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setTab('parts')} className={`px-4 py-2 rounded-lg text-sm ${tab === 'parts' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Linh kiện</button>
        {isManager && <button onClick={() => setBulkModalOpen(true)} className="px-4 py-2 rounded-lg text-sm bg-emerald-600 text-white flex items-center gap-1.5 font-semibold"><Plus size={15} /> Nhập hàng loạt</button>}
        {isManager && <button onClick={() => setTab('import')} className={`px-4 py-2 rounded-lg text-sm ${tab === 'import' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Lịch sử nhập</button>}
        {(isManager || isStorekeeper) && <button onClick={() => setTab('usage')} className={`px-4 py-2 rounded-lg text-sm ${tab === 'usage' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Lịch sử xuất</button>}
        {isManager && <button onClick={() => setTab('suppliers')} className={`px-4 py-2 rounded-lg text-sm ${tab === 'suppliers' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Nhà cung cấp</button>}
        {isStorekeeper && <button onClick={() => setTab('requests')} className={`px-4 py-2 rounded-lg text-sm ${tab === 'requests' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Duyệt yêu cầu</button>}
        <button onClick={() => setTab('alerts')} className={`px-4 py-2 rounded-lg text-sm ${tab === 'alerts' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Cảnh báo</button>
        {isManager && <button onClick={() => setTab('kpi')} className={`px-4 py-2 rounded-lg text-sm ${tab === 'kpi' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>KPI Kho</button>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Tổng linh kiện', value: stats.totalParts },
          { label: 'Tổng tồn kho', value: stats.totalQuantity },
          { label: 'Sắp hết', value: lowStockParts.length },
          { label: 'Hết hàng', value: outOfStockParts.length },
        ].map((item) => (
          <div key={item.label} className="bg-white border rounded-xl p-3">
            <p className="text-xs text-slate-500">{item.label}</p>
            <p className="text-xl font-semibold">{item.value}</p>
          </div>
        ))}
      </div>

      {feedback && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg text-sm">{feedback}</div>}

      {/* Parts Tab */}
      {tab === 'parts' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="border rounded-xl px-3 py-2 bg-white" placeholder="Tìm linh kiện..." />
            <select value={sortOption} onChange={(e) => setSortOption(e.target.value as SortOption)} className="border rounded-xl px-3 py-2 bg-white">
              <option value="name-asc">Tên A → Z</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
              <option value="stock-asc">Số lượng tăng dần</option>
              <option value="stock-desc">Số lượng giảm dần</option>
            </select>
          </div>

          {isManager && (
            <div className="bg-white border rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3 shadow-sm">
              <input className="border rounded-xl px-3 py-2" placeholder="Tên linh kiện (bắt buộc)" value={form.partName} onChange={(e) => setForm({ ...form, partName: e.target.value })} />
              <input className="border rounded-xl px-3 py-2" placeholder="Hãng (tùy chọn)" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
              <div className="flex flex-col gap-2">
                <input type="file" accept="image/png,image/jpeg,image/jpg" className="hidden" onChange={(e) => handleImageChange(e)} id="part-image-upload" />
                <label htmlFor="part-image-upload" className="border border-blue-600 text-blue-600 px-4 py-2 rounded-xl text-center cursor-pointer hover:bg-blue-50 flex items-center justify-center gap-2">
                  <Upload size={16} />{imageFile ? 'Thay đổi ảnh' : 'Tải ảnh linh kiện'}
                </label>
                {imagePreview && <img src={imagePreview} alt="Preview" className="w-20 h-20 rounded-lg object-cover border" />}
              </div>
              <button onClick={createPart} className="col-span-full bg-blue-600 text-white py-2 rounded-xl">Thêm linh kiện</button>
            </div>
          )}

          <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-slate-500">
                    <th className="px-4 py-3">Sản phẩm</th>
                    <th className="px-4 py-3">Giá bán</th>
                    <th className="px-4 py-3">Tồn kho</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Giá nhập gần nhất</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedParts.map((part) => {
                    const isLow = part.stock > 0 && part.stock < part.minStock;
                    const isOut = part.stock <= 0;
                    const statusText = isOut ? 'Hết hàng' : isLow ? 'Sắp hết' : 'Ổn định';
                    const statusClass = isOut ? 'bg-rose-100 text-rose-700' : isLow ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';
                    return (
                      <tr key={part._id} className="border-t border-slate-100">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img src={part.imageUrl} alt={part.partName} className="w-11 h-11 rounded-lg object-cover border" onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/80?text=No+Image'; }} />
                            <div><p className="font-semibold text-slate-800">{part.partName}</p><p className="text-xs text-slate-500">{part.brand || 'N/A'}</p></div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold">{part.price.toLocaleString('vi-VN')} ₫</td>
                        <td className="px-4 py-3">{part.stock}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusClass}`}>{statusText}</span></td>
                        <td className="px-4 py-3">{getImportStats(part._id).latestPrice.toLocaleString('vi-VN')} ₫</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end flex-wrap gap-2">
                            {isStorekeeper && (
                              <>
                                <input className="border rounded px-2 py-1 text-xs" value={alertMsg[part._id] || ''} onChange={(e) => setAlertMsg((p) => ({ ...p, [part._id]: e.target.value }))} placeholder="Ghi chú" />
                                <button onClick={() => createAlert(part._id)} className="px-2 py-1 rounded bg-amber-600 text-white text-xs">Báo thiếu</button>
                              </>
                            )}
                            {isManager && (
                              <>
                                <button onClick={() => { setSelectedPart(part); setEditImageFile(null); setEditImagePreview(''); setEditPrice(String(part.price ?? '')); }} className="px-3 py-1 rounded bg-blue-600 text-white text-xs">Cập nhật</button>
                                <button onClick={() => deletePart(part._id)} className="px-3 py-1 rounded border text-red-600 text-xs">Xóa</button>
                                <button onClick={() => setImportModalPart(part)} className="px-3 py-1 rounded bg-emerald-600 text-white text-xs">Nhập kho</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Trang {currentPage} / {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 rounded border disabled:opacity-50">Trước</button>
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 rounded border disabled:opacity-50">Sau</button>
            </div>
          </div>
        </div>
      )}

      {/* Import History Tab */}
      {tab === 'import' && isManager && (
        <div className="bg-white border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">Lịch sử nhập kho</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold">{filteredImports.length} bản ghi</span>
              <button onClick={() => downloadCSV('lich-su-nhap-kho.csv', ['Linh kiện','Hãng','Nhà cung cấp','Batch','Số lượng','Giá nhập','Thành tiền','Thời gian','Người tạo','Ghi chú'], imports.map((i) => [i.product?.partName||'',i.product?.brand||'',i.supplier?.name||'',i.batchCode||'',i.quantity,i.importPrice,i.total,new Date(i.createdAt).toLocaleString('vi-VN'),i.createdBy?.fullName||'',i.note||'']))} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"><Download size={13} /> Xuất CSV</button>
            </div>
          </div>
          <input value={importSearch} onChange={(e) => { setImportSearch(e.target.value); setImportPage(1); }} className="border rounded-xl px-3 py-2 text-sm w-full md:w-72 mb-3" placeholder="Tìm theo linh kiện, nhà cung cấp, batch..." />
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500"><tr><th className="px-3 py-2 text-left">Linh kiện</th><th className="px-3 py-2 text-left">Nhà cung cấp</th><th className="px-3 py-2 text-left">Batch</th><th className="px-3 py-2 text-left">Số lượng</th><th className="px-3 py-2 text-left">Giá nhập</th><th className="px-3 py-2 text-left">Thành tiền</th><th className="px-3 py-2 text-left">Thời gian</th><th className="px-3 py-2 text-left">Người tạo</th></tr></thead>
              <tbody>
                {pagedImports.map((item) => (
                  <tr key={item._id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-3 py-2 font-medium">{item.product?.partName || 'N/A'}{item.product?.brand ? ` (${item.product.brand})` : ''}</td>
                    <td className="px-3 py-2">{item.supplier?.name || 'N/A'}</td>
                    <td className="px-3 py-2 font-mono text-xs">{item.batchCode || 'N/A'}</td>
                    <td className="px-3 py-2">{item.quantity}</td>
                    <td className="px-3 py-2">{item.importPrice.toLocaleString('vi-VN')} ₫</td>
                    <td className="px-3 py-2 font-semibold">{item.total.toLocaleString('vi-VN')} ₫</td>
                    <td className="px-3 py-2 text-slate-500">{new Date(item.createdAt).toLocaleString('vi-VN')}</td>
                    <td className="px-3 py-2">{item.createdBy?.fullName || 'N/A'}</td>
                  </tr>
                ))}
                {pagedImports.length === 0 && <tr><td colSpan={8} className="px-3 py-6 text-center text-slate-400 text-sm">Không có dữ liệu.</td></tr>}
              </tbody>
            </table>
          </div>
          <PaginationLocal page={importPage} total={importTotalPages} onChange={setImportPage} />
        </div>
      )}

      {/* Usage History Tab */}
      {tab === 'usage' && (isManager || isStorekeeper) && (
        <div className="bg-white border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">Lịch sử xuất kho sửa chữa</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">{filteredUsage.length} bản ghi</span>
              <button onClick={() => downloadCSV('lich-su-xuat-kho.csv', ['Linh kiện','Hãng','Mã phiếu','Số lượng','Đơn giá','Thành tiền','Thời gian','Người thao tác'], usageHistory.map((i) => [i.part?.partName||'',i.part?.brand||'',i.ticket?.ticketCode||'',i.quantity,i.unitPrice,i.total,new Date(i.createdAt).toLocaleString('vi-VN'),i.createdBy?.fullName||'']))} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"><Download size={13} /> Xuất CSV</button>
            </div>
          </div>
          <input value={usageSearch} onChange={(e) => { setUsageSearch(e.target.value); setUsagePage(1); }} className="border rounded-xl px-3 py-2 text-sm w-full md:w-72 mb-3" placeholder="Tìm theo linh kiện, mã phiếu..." />
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600"><tr><th className="text-left px-3 py-2.5">Linh kiện</th><th className="text-left px-3 py-2.5">Mã phiếu</th><th className="text-left px-3 py-2.5">Số lượng</th><th className="text-left px-3 py-2.5">Đơn giá</th><th className="text-left px-3 py-2.5">Thành tiền</th><th className="text-left px-3 py-2.5">Thời gian</th><th className="text-left px-3 py-2.5">Người thao tác</th></tr></thead>
              <tbody>
                {pagedUsage.map((item) => (
                  <tr key={item._id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-3 py-2.5 font-medium">{item.part?.partName || 'N/A'}{item.part?.brand ? ` (${item.part.brand})` : ''}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{item.ticket?.ticketCode || 'N/A'}</td>
                    <td className="px-3 py-2.5">{item.quantity}</td>
                    <td className="px-3 py-2.5">{Number(item.unitPrice || 0).toLocaleString('vi-VN')} ₫</td>
                    <td className="px-3 py-2.5 font-semibold">{(Number(item.unitPrice || 0) * Number(item.quantity || 0)).toLocaleString('vi-VN')} ₫</td>
                    <td className="px-3 py-2.5 text-slate-500">{new Date(item.createdAt).toLocaleString('vi-VN')}</td>
                    <td className="px-3 py-2.5">{item.createdBy?.fullName || 'N/A'}</td>
                  </tr>
                ))}
                {pagedUsage.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-slate-400 text-sm">Không có dữ liệu.</td></tr>}
              </tbody>
            </table>
          </div>
          <PaginationLocal page={usagePage} total={usageTotalPages} onChange={setUsagePage} />
        </div>
      )}

      {/* Suppliers Tab */}
      {tab === 'suppliers' && isManager && (
        <div className="space-y-4">
          <div className="bg-white border rounded-2xl p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-4">{editingSupplier ? 'Cập nhật nhà cung cấp' : 'Thêm nhà cung cấp'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="border rounded-xl px-3 py-2.5" placeholder="Tên nhà cung cấp" value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} />
              <input className="border rounded-xl px-3 py-2.5" placeholder="Số điện thoại" value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} />
              <input className="border rounded-xl px-3 py-2.5" placeholder="Email" value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} />
              <input className="border rounded-xl px-3 py-2.5" placeholder="Địa chỉ" value={supplierForm.address} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })} />
              <textarea className="border rounded-xl px-3 py-2.5 md:col-span-2" placeholder="Ghi chú" value={supplierForm.note} onChange={(e) => setSupplierForm({ ...supplierForm, note: e.target.value })} />
            </div>
            <div className="flex gap-2 mt-4">
              {editingSupplier ? (
                <>
                  <button onClick={updateSupplier} className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold">Lưu thay đổi</button>
                  <button onClick={() => { setEditingSupplier(null); setSupplierForm({ name: '', phone: '', email: '', address: '', note: '' }); }} className="px-4 py-2 rounded-xl border">Hủy</button>
                </>
              ) : (
                <button onClick={createSupplier} className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold">Thêm nhà cung cấp</button>
              )}
            </div>
          </div>
          <div className="bg-white border rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-900">Danh sách nhà cung cấp</h2>
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">{suppliers.length} nhà cung cấp</span>
            </div>
            {suppliers.length === 0 ? <p className="text-slate-500 text-sm">Chưa có nhà cung cấp.</p> : (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600"><tr><th className="text-left px-3 py-2.5">Tên</th><th className="text-left px-3 py-2.5">SĐT</th><th className="text-left px-3 py-2.5">Email</th><th className="text-left px-3 py-2.5">Địa chỉ</th><th className="text-left px-3 py-2.5">Ghi chú</th><th className="text-right px-3 py-2.5">Thao tác</th></tr></thead>
                  <tbody>
                    {suppliers.map((s) => (
                      <tr key={s._id} className="border-t border-slate-100 hover:bg-slate-50/60">
                        <td className="px-3 py-2.5 font-semibold">{s.name}</td>
                        <td className="px-3 py-2.5">{s.phone || '—'}</td>
                        <td className="px-3 py-2.5">{s.email || '—'}</td>
                        <td className="px-3 py-2.5">{s.address || '—'}</td>
                        <td className="px-3 py-2.5 text-slate-600">{s.note || '—'}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => { setEditingSupplier(s); setSupplierForm({ name: s.name || '', phone: s.phone || '', email: s.email || '', address: s.address || '', note: s.note || '' }); }} className="px-3 py-1 rounded-lg border">Sửa</button>
                            <button onClick={() => deleteSupplier(s._id)} className="px-3 py-1 rounded-lg border border-rose-200 text-rose-600">Xóa</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Requests Tab */}
      {tab === 'requests' && isStorekeeper && (
        <div className="bg-white border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">Yêu cầu linh kiện từ kỹ thuật</h2>
            <span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold">{requests.length} yêu cầu</span>
          </div>
          <InventoryRequestList requests={requests} onRespond={respondRequest} />
        </div>
      )}

      {/* Alerts Tab */}
      {tab === 'alerts' && (
        <div className="bg-white border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">Cảnh báo linh kiện</h2>
            <span className="text-xs px-2 py-1 rounded-full bg-rose-50 text-rose-700 font-semibold">{alerts.length} cảnh báo</span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600"><tr><th className="text-left px-3 py-2.5">Linh kiện</th><th className="text-left px-3 py-2.5">Cảnh báo</th><th className="text-left px-3 py-2.5">Tồn kho</th><th className="text-left px-3 py-2.5">Thời gian</th><th className="text-left px-3 py-2.5">Người tạo</th></tr></thead>
              <tbody>
                {alerts.map((a) => {
                  const stock = a.part?.stock ?? 0;
                  const minStock = a.part?.minStock ?? 0;
                  const isCritical = stock <= 0;
                  return (
                    <tr key={a._id} className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          {a.part?.imageUrl ? <img src={a.part.imageUrl} alt={a.part.partName} className="w-10 h-10 rounded-lg object-cover border" /> : <div className="w-10 h-10 rounded-lg border bg-slate-100" />}
                          <span className="font-medium text-slate-800">{a.part?.partName || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5"><span className={`text-xs px-2 py-1 rounded-full font-semibold ${isCritical ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{a.message}</span></td>
                      <td className="px-3 py-2.5">{stock} / {minStock}</td>
                      <td className="px-3 py-2.5">{new Date(a.createdAt).toLocaleString('vi-VN')}</td>
                      <td className="px-3 py-2.5">{a.createdBy?.fullName || 'N/A'}</td>
                    </tr>
                  );
                })}
                {alerts.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-400 text-sm">Không có cảnh báo.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KPI Tab */}
      {tab === 'kpi' && isManager && (
        <div className="space-y-4">
          <div className="bg-white border rounded-2xl px-4 py-3 flex flex-wrap items-end gap-3 shadow-sm">
            <div className="flex flex-col gap-1"><label className="text-xs text-slate-500">Từ ngày</label><input type="date" value={kpiFrom} onChange={(e) => { setKpiFrom(e.target.value); setKpiPeriod('custom'); }} className="border rounded-lg px-3 py-1.5 text-sm" /></div>
            <div className="flex flex-col gap-1"><label className="text-xs text-slate-500">Đến ngày</label><input type="date" value={kpiTo} onChange={(e) => { setKpiTo(e.target.value); setKpiPeriod('custom'); }} className="border rounded-lg px-3 py-1.5 text-sm" /></div>
            <div className="flex flex-col gap-1"><label className="text-xs text-slate-500">Nhanh</label><select value={kpiPeriod} onChange={(e) => setPeriodPreset(e.target.value as any)} className="border rounded-lg px-3 py-1.5 text-sm"><option value="month">Tháng này</option><option value="quarter">Quý này</option><option value="year">Năm này</option><option value="custom">Tùy chỉnh</option></select></div>
            <button onClick={applyKpiFilter} disabled={kpiLoading} className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-60">{kpiLoading ? 'Đang tải...' : 'Áp dụng'}</button>
            <button onClick={() => downloadCSV('kpi-kho.csv', ['Linh kiện','Hãng','Tồn kho','Giá bán','Giá nhập TB','Giá trị tồn','Đã nhập','Đã xuất','Tỷ lệ xuất','Biên LN','Trạng thái','NCC gần nhất'], (kpi?.partDetails||[]).map((r) => [r.partName,r.brand,r.stock,r.sellPrice,r.avgImportPrice.toFixed(0),r.inventoryValue,r.totalImported,r.totalUsed,r.turnoverRate+'%',r.profitMargin+'%',r.stockStatus,r.supplierName]))} className="px-4 py-1.5 rounded-lg border text-sm flex items-center gap-1.5"><Download size={13} /> Export CSV</button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Giá trị tồn kho', value: kpi ? kpi.totalInventoryValue.toLocaleString('vi-VN') + ' ₫' : '—', color: 'text-blue-600', bg: 'bg-blue-50', icon: '📦' },
              { label: 'Chi phí nhập kỳ này', value: kpi ? kpi.totalImportCost.toLocaleString('vi-VN') + ' ₫' : '—', color: 'text-orange-500', bg: 'bg-orange-50', icon: '🛒' },
              { label: 'Doanh thu linh kiện', value: kpi ? kpi.totalUsageValue.toLocaleString('vi-VN') + ' ₫' : '—', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '💰' },
              { label: 'Margin linh kiện', value: kpi ? kpi.grossMargin + '%' : '—', color: kpi && parseFloat(kpi.grossMargin) >= 0 ? 'text-emerald-600' : 'text-rose-600', bg: 'bg-slate-50', icon: '📊' },
              { label: 'Tổng SL nhập', value: kpi ? kpi.totalImportQty.toLocaleString('vi-VN') + ' cái' : '—', color: 'text-violet-600', bg: 'bg-violet-50', icon: '⬇️' },
              { label: 'Tổng SL xuất', value: kpi ? kpi.totalUsageQty.toLocaleString('vi-VN') + ' cái' : '—', color: 'text-amber-600', bg: 'bg-amber-50', icon: '⬆️' },
            ].map((item) => (
              <div key={item.label} className={`${item.bg} border rounded-xl p-3 flex items-start justify-between`}>
                <div><p className="text-xs text-slate-500 mb-1">{item.label}</p><p className={`text-sm font-bold ${item.color}`}>{item.value}</p></div>
                <span className="text-lg">{item.icon}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border rounded-2xl p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-800 mb-3">Chi phí nhập vs Doanh thu xuất (tháng)</p>
              {kpi && (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={kpi.monthlyImport.map((m, i) => ({ label: m.label, 'Chi phí nhập': m.cost, 'Doanh thu xuất': kpi.monthlyUsage[i]?.value ?? 0 }))} margin={{ left: 5, right: 5 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}M` : `${(v/1000).toFixed(0)}K`} />
                    <Tooltip formatter={(v: number | string | undefined) => (v != null ? (typeof v === 'number' ? v.toLocaleString('vi-VN') + ' ₫' : v) : '')} /><Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Chi phí nhập" fill="#f59e0b" radius={[4,4,0,0]} /><Bar dataKey="Doanh thu xuất" fill="#10b981" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="bg-white border rounded-2xl p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-800 mb-3">Margin linh kiện theo tháng</p>
              {kpi && (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={kpi.monthlyMargin} margin={{ left: 5, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="label" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(v: number | string | undefined) => (v != null ? `${v}%` : '')} /><Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="margin" name="Margin (%)" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white border rounded-2xl p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <p className="font-semibold text-slate-800 text-sm">Bảng chi tiết từng linh kiện</p>
              <div className="flex flex-wrap gap-2">
                <input value={kpiDetailSearch} onChange={(e) => { setKpiDetailSearch(e.target.value); setKpiDetailPage(1); }} className="border rounded-lg px-3 py-1.5 text-xs w-44" placeholder="Tìm linh kiện..." />
                <select value={kpiDetailSort} onChange={(e) => { setKpiDetailSort(e.target.value as typeof kpiDetailSort); setKpiDetailPage(1); }} className="border rounded-lg px-2 py-1.5 text-xs">
                  <option value="name">Tên A→Z</option><option value="value">Giá trị tồn ↓</option><option value="stock">Tồn kho ↓</option><option value="turnover">Tỷ lệ xuất ↓</option><option value="profit">Biên LN ↓</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-500"><tr><th className="px-3 py-2.5 text-left">Linh kiện</th><th className="px-3 py-2.5 text-center">Tồn</th><th className="px-3 py-2.5 text-center">Min</th><th className="px-3 py-2.5 text-right">Giá bán</th><th className="px-3 py-2.5 text-right">Giá nhập TB</th><th className="px-3 py-2.5 text-right">Giá trị tồn</th><th className="px-3 py-2.5 text-center">Đã nhập</th><th className="px-3 py-2.5 text-center">Đã xuất</th><th className="px-3 py-2.5 text-center">Tỷ lệ xuất</th><th className="px-3 py-2.5 text-center">Biên LN</th><th className="px-3 py-2.5 text-center">Trạng thái</th><th className="px-3 py-2.5 text-left">NCC gần nhất</th></tr></thead>
                <tbody>
                  {pagedKpiDetail.map((row) => {
                    const sm = { healthy: { label: 'Ổn định', cls: 'bg-emerald-100 text-emerald-700' }, low: { label: 'Sắp hết', cls: 'bg-amber-100 text-amber-700' }, out: { label: 'Hết hàng', cls: 'bg-rose-100 text-rose-700' } };
                    const s = sm[row.stockStatus];
                    const profitNum = parseFloat(row.profitMargin);
                    const turnoverNum = parseFloat(row.turnoverRate);
                    return (
                      <tr key={row._id} className="border-t border-slate-100 hover:bg-slate-50/50">
                        <td className="px-3 py-2.5"><p className="font-medium text-slate-800">{row.partName}</p>{row.brand && <p className="text-slate-400">{row.brand}</p>}</td>
                        <td className="px-3 py-2.5 text-center font-semibold">{row.stock}</td>
                        <td className="px-3 py-2.5 text-center text-slate-400">{row.minStock}</td>
                        <td className="px-3 py-2.5 text-right">{row.sellPrice.toLocaleString('vi-VN')} ₫</td>
                        <td className="px-3 py-2.5 text-right text-slate-500">{row.avgImportPrice > 0 ? row.avgImportPrice.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' ₫' : '—'}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-blue-700">{row.inventoryValue.toLocaleString('vi-VN')} ₫</td>
                        <td className="px-3 py-2.5 text-center">{row.totalImported}</td>
                        <td className="px-3 py-2.5 text-center">{row.totalUsed}</td>
                        <td className="px-3 py-2.5 text-center"><span className={`font-semibold ${turnoverNum >= 70 ? 'text-emerald-600' : turnoverNum >= 30 ? 'text-amber-600' : 'text-slate-400'}`}>{row.turnoverRate}%</span></td>
                        <td className="px-3 py-2.5 text-center"><span className={`font-semibold ${profitNum >= 20 ? 'text-emerald-600' : profitNum >= 0 ? 'text-amber-600' : 'text-rose-600'}`}>{row.profitMargin}%</span></td>
                        <td className="px-3 py-2.5 text-center"><span className={`px-2 py-0.5 rounded-full font-semibold ${s.cls}`}>{s.label}</span></td>
                        <td className="px-3 py-2.5 text-slate-600">{row.supplierName || '—'}{row.lastImportDate && <p className="text-slate-400">{new Date(row.lastImportDate).toLocaleDateString('vi-VN')}</p>}</td>
                      </tr>
                    );
                  })}
                  {pagedKpiDetail.length === 0 && <tr><td colSpan={12} className="px-3 py-6 text-center text-slate-400">Không có dữ liệu.</td></tr>}
                </tbody>
              </table>
            </div>
            <PaginationLocal page={kpiDetailPage} total={kpiDetailTotalPages} onChange={setKpiDetailPage} />
          </div>
        </div>
      )}

      {/* Edit Part Modal */}
      {selectedPart && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-4 w-full max-w-md space-y-3">
            <h3 className="font-semibold">Cập nhật linh kiện</h3>
            <input className="border rounded px-3 py-2 w-full" placeholder="Tên linh kiện" value={selectedPart.partName} onChange={(e) => setSelectedPart({ ...selectedPart, partName: e.target.value })} />
            <input className="border rounded px-3 py-2 w-full" placeholder="Hãng" value={selectedPart.brand || ''} onChange={(e) => setSelectedPart({ ...selectedPart, brand: e.target.value })} />
            <div className="flex flex-col gap-2">
              <input type="file" accept="image/png,image/jpeg,image/jpg" className="hidden" onChange={(e) => handleImageChange(e, true)} id="part-image-edit-upload" />
              <label htmlFor="part-image-edit-upload" className="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg text-center cursor-pointer hover:bg-blue-50 flex items-center justify-center gap-2"><Upload size={16} />{editImageFile ? 'Thay đổi ảnh' : 'Tải ảnh mới'}</label>
              {(editImagePreview || selectedPart.imageUrl) && <img src={editImagePreview || selectedPart.imageUrl} alt="Preview" className="w-24 h-24 rounded-lg object-cover border" />}
            </div>
            <input type="text" inputMode="numeric" className="border rounded px-3 py-2 w-full" placeholder="Giá (VNĐ)" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={updatePart} className="flex-1 bg-blue-600 text-white py-2 rounded" disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu'}</button>
              <button onClick={() => { setSelectedPart(null); setEditImageFile(null); setEditImagePreview(''); setEditPrice(''); }} className="flex-1 border py-2 rounded" disabled={loading}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Stock Modal */}
      {importModalPart && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-4 w-full max-w-md space-y-4">
            <h3 className="font-semibold">Nhập kho: {importModalPart.partName}</h3>
            <select className="border rounded px-3 py-2 w-full" value={importSupplier[importModalPart._id] || ''} onChange={(e) => setImportSupplier((p) => ({ ...p, [importModalPart._id]: e.target.value }))}>
              <option value="">Chọn nhà cung cấp</option>
              {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
            <input type="text" inputMode="numeric" className="border rounded px-3 py-2 w-full" placeholder="Số lượng nhập" value={importQty[importModalPart._id] ?? ''} onChange={(e) => setImportQty((p) => ({ ...p, [importModalPart._id]: e.target.value }))} />
            <input type="text" inputMode="numeric" className="border rounded px-3 py-2 w-full" placeholder="Giá nhập" value={importPrice[importModalPart._id] ?? ''} onChange={(e) => setImportPrice((p) => ({ ...p, [importModalPart._id]: e.target.value }))} />
            <textarea className="border rounded px-3 py-2 w-full" placeholder="Ghi chú" value={importNote[importModalPart._id] ?? ''} onChange={(e) => setImportNote((p) => ({ ...p, [importModalPart._id]: e.target.value }))} />
            <div className="flex gap-2">
              <button onClick={() => importStock(importModalPart._id)} className="flex-1 bg-emerald-600 text-white py-2 rounded" disabled={loading}>{loading ? 'Đang xử lý...' : 'Xác nhận nhập'}</button>
              <button onClick={() => setImportModalPart(null)} className="flex-1 border py-2 rounded">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-5 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 text-base">Nhập hàng loạt</h3>
              <button onClick={() => setBulkModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500 font-medium">Nhà cung cấp *</label>
                <select value={bulkSupplierId} onChange={(e) => setBulkSupplierId(e.target.value)} className="border rounded-xl px-3 py-2 text-sm">
                  <option value="">Chọn nhà cung cấp</option>
                  {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500 font-medium">Ghi chú đơn hàng</label>
                <input value={bulkNote} onChange={(e) => setBulkNote(e.target.value)} className="border rounded-xl px-3 py-2 text-sm" placeholder="Ghi chú (tùy chọn)" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-500 font-medium">Danh sách linh kiện</label>
                <button onClick={() => setBulkItems((p) => [...p, { partId: '', quantity: '', importPrice: '' }])} className="flex items-center gap-1 text-xs text-blue-600 font-semibold"><Plus size={13} /> Thêm dòng</button>
              </div>
              <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs"><tr><th className="px-3 py-2 text-left">Linh kiện *</th><th className="px-3 py-2 text-left w-28">Số lượng *</th><th className="px-3 py-2 text-left w-36">Giá nhập (₫)</th><th className="px-3 py-2 w-10"></th></tr></thead>
                  <tbody>
                    {bulkItems.map((item, idx) => (
                      <tr key={idx} className="border-t border-slate-100">
                        <td className="px-3 py-2">
                          <select value={item.partId} onChange={(e) => setBulkItems((p) => p.map((r, i) => i === idx ? { ...r, partId: e.target.value } : r))} className="border rounded-lg px-2 py-1.5 text-xs w-full">
                            <option value="">Chọn linh kiện</option>
                            {parts.map((p) => <option key={p._id} value={p._id}>{p.partName}{p.brand ? ` (${p.brand})` : ''}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2"><input type="number" min="1" value={item.quantity} onChange={(e) => setBulkItems((p) => p.map((r, i) => i === idx ? { ...r, quantity: e.target.value } : r))} className="border rounded-lg px-2 py-1.5 text-xs w-full" placeholder="0" /></td>
                        <td className="px-3 py-2"><input type="number" min="0" value={item.importPrice} onChange={(e) => setBulkItems((p) => p.map((r, i) => i === idx ? { ...r, importPrice: e.target.value } : r))} className="border rounded-lg px-2 py-1.5 text-xs w-full" placeholder="0" /></td>
                        <td className="px-3 py-2 text-center">{bulkItems.length > 1 && <button onClick={() => setBulkItems((p) => p.filter((_, i) => i !== idx))} className="text-rose-400 hover:text-rose-600"><Trash2 size={14} /></button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setBulkModalOpen(false)} className="px-4 py-2 rounded-xl border text-sm">Hủy</button>
              <button onClick={bulkImport} disabled={loading} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60">{loading ? 'Đang nhập...' : 'Xác nhận nhập hàng loạt'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
