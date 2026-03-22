import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Upload } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

interface Part {
  _id: string;
  partName: string;
  brand?: string;
  imageUrl: string;
  price: number;
  stock: number;
  minStock: number;
}

interface ImportRecord {
  _id: string;
  quantity: number;
  importPrice: number;
  total: number;
  createdAt: string;
  product?: { _id?: string; partName?: string; brand?: string };
  supplier?: { name?: string };
  createdBy?: { fullName?: string; role?: string };
  note?: string;
  batchCode?: string;
}

interface AlertRecord {
  _id: string;
  message: string;
  createdAt: string;
  part?: { partName?: string; brand?: string; stock?: number; minStock?: number; imageUrl?: string };
  createdBy?: { fullName?: string; role?: string };
}

interface UsageRecord {
  _id: string;
  quantity: number;
  unitPrice: number;
  total: number;
  createdAt: string;
  part?: { partName?: string; brand?: string };
  ticket?: { ticketCode?: string };
  createdBy?: { fullName?: string; role?: string };
}

interface InventoryStats {
  totalParts: number;
  totalQuantity: number;
  lowStock: number;
  outOfStock: number;
}

interface InventoryRequestItem {
  part?: {
    _id?: string;
    partName?: string;
    brand?: string;
    price?: number;
  };
  quantity?: number;
  unitPrice?: number;
}

interface InventoryRequest {
  _id: string;
  ticketCode?: string;
  createdAt?: string;
  status?: string;
  statusHistory?: Array<{
    status?: string;
    changedBy?: { _id?: string; fullName?: string; role?: string };
  }>;
  inventoryRequest?: {
    status?: string;
    noteFromTechnician?: string;
    noteFromStorekeeper?: string;
    requiredParts?: InventoryRequestItem[];
    requestedBy?: { _id?: string; fullName?: string };
  };
  technician?: { _id?: string; fullName?: string };
  device?: { brand?: string; model?: string; customer?: { fullName?: string } };
}

interface SupplierOption {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  note?: string;
}

export const Inventory: React.FC = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';
  const isStorekeeper = user?.role === 'storekeeper';

  const [parts, setParts] = useState<Part[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [usageHistory, setUsageHistory] = useState<UsageRecord[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [requests, setRequests] = useState<InventoryRequest[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    totalParts: 0,
    totalQuantity: 0,
    lowStock: 0,
    outOfStock: 0,
  });
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'parts' | 'import' | 'usage' | 'alerts' | 'suppliers' | 'requests'>('parts');

  const [form, setForm] = useState({
    partName: '',
    brand: '',
    imageUrl: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [importQty, setImportQty] = useState<Record<string, string>>({});
  const [importPrice, setImportPrice] = useState<Record<string, string>>({});
  const [importSupplier, setImportSupplier] = useState<Record<string, string>>({});
  const [importNote, setImportNote] = useState<Record<string, string>>({});
  const [importModalPart, setImportModalPart] = useState<Part | null>(null);
  const [alertMsg, setAlertMsg] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [sortOption, setSortOption] = useState<'name-asc' | 'price-desc' | 'price-asc' | 'stock-desc' | 'stock-asc'>('name-asc');
  const [feedback, setFeedback] = useState('');
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    note: '',
  });
  const [editingSupplier, setEditingSupplier] = useState<SupplierOption | null>(null);
  const [priceDraft, setPriceDraft] = useState<Record<string, number>>({});
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState('');

  const loadParts = async () => {
    const res = await axios.get(`${API_BASE}/parts`, { withCredentials: true, params: { search } });
    setParts(res.data || []);
  };

  const loadImports = async () => {
    if (!isManager) return;
    const res = await axios.get(`${API_BASE}/parts/import-history`, { withCredentials: true });
    setImports(res.data || []);
  };

  const loadUsageHistory = async () => {
    if (!isManager && !isStorekeeper) return;
    const res = await axios.get(`${API_BASE}/parts/usage-history`, { withCredentials: true });
    setUsageHistory(res.data || []);
  };

  const loadAlerts = async () => {
    const res = await axios.get(`${API_BASE}/parts/alerts`, { withCredentials: true });
    setAlerts(res.data || []);
  };

  const loadStats = async () => {
    const res = await axios.get(`${API_BASE}/parts/stats/summary`, { withCredentials: true });
    setStats(res.data);
  };

  const loadRequests = async () => {
    if (!isStorekeeper) return;
    const res = await axios.get(`${API_BASE}/ticket`, {
      withCredentials: true,
      params: { limit: 100, sort: '-createdAt', includeAll: true },
    });

    const data = (res.data.data || []) as InventoryRequest[];
    const filtered = data.filter((ticket) =>
      ['PENDING', 'APPROVED', 'REJECTED'].includes(ticket.inventoryRequest?.status || ''),
    );

    const sorted = filtered.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
    );

    setRequests(sorted);
  };

  const loadSuppliers = async () => {
    if (!isManager) return;
    const res = await axios.get(`${API_BASE}/suppliers`, { withCredentials: true });
    setSuppliers(res.data || []);
  };

  const createSupplier = async () => {
    if (!supplierForm.name.trim()) {
      setFeedback('Vui lòng nhập tên nhà cung cấp.');
      return;
    }

    try {
      await axios.post(`${API_BASE}/suppliers`, supplierForm, { withCredentials: true });
      setSupplierForm({ name: '', phone: '', email: '', address: '', note: '' });
      setFeedback('Đã thêm nhà cung cấp.');
      loadSuppliers();
    } catch (err: any) {
      setFeedback(err.response?.data?.message || 'Không thể tạo nhà cung cấp.');
    }
  };

  const updateSupplier = async () => {
    if (!editingSupplier) return;
    try {
      await axios.patch(`${API_BASE}/suppliers/${editingSupplier._id}`, supplierForm, { withCredentials: true });
      setEditingSupplier(null);
      setSupplierForm({ name: '', phone: '', email: '', address: '', note: '' });
      setFeedback('Đã cập nhật nhà cung cấp.');
      loadSuppliers();
    } catch (err: any) {
      setFeedback(err.response?.data?.message || 'Không thể cập nhật nhà cung cấp.');
    }
  };

  const deleteSupplier = async (id: string) => {
    if (!window.confirm('Xóa nhà cung cấp này?')) return;
    try {
      await axios.delete(`${API_BASE}/suppliers/${id}`, { withCredentials: true });
      setFeedback('Đã xóa nhà cung cấp.');
      loadSuppliers();
    } catch (err: any) {
      setFeedback(err.response?.data?.message || 'Không thể xóa nhà cung cấp.');
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadParts(), loadImports(), loadUsageHistory(), loadAlerts(), loadStats(), loadSuppliers(), loadRequests()])
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, parts.length]);

  const lowStockThreshold = 10;
  const lowStockParts = useMemo(
    () => parts.filter((p) => p.stock > 0 && p.stock < lowStockThreshold),
    [parts],
  );
  const outOfStockParts = useMemo(() => parts.filter((p) => p.stock <= 0), [parts]);

  const sortedParts = useMemo(() => {
    const sorted = [...parts];
    switch (sortOption) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'stock-asc':
        sorted.sort((a, b) => a.stock - b.stock);
        break;
      case 'stock-desc':
        sorted.sort((a, b) => b.stock - a.stock);
        break;
      case 'name-asc':
      default:
        sorted.sort((a, b) => a.partName.localeCompare(b.partName, 'vi', { sensitivity: 'base' }));
        break;
    }
    return sorted;
  }, [parts, sortOption]);

  const totalPages = Math.max(1, Math.ceil(sortedParts.length / pageSize));
  const pagedParts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedParts.slice(start, start + pageSize);
  }, [sortedParts, currentPage]);

  const createPart = async () => {
    if (!form.partName.trim()) {
      setFeedback('Vui lòng nhập tên linh kiện.');
      return;
    }

    if (!imageFile) {
      setFeedback('Vui lòng tải ảnh linh kiện.');
      return;
    }

    try {
      await axios.post(`${API_BASE}/parts`, form, { withCredentials: true });
      setForm({ partName: '', brand: '', imageUrl: '' });
      setImageFile(null);
      setImagePreview('');
      setFeedback('Đã thêm linh kiện thành công.');
      await Promise.all([loadParts(), loadStats()]);
    } catch (err: any) {
      const message = err.response?.data?.message;
      if (err.response?.status === 413) {
        setFeedback('Ảnh quá lớn, vui lòng chọn ảnh nhỏ hơn 2MB.');
      } else if (message) {
        setFeedback(message);
      } else {
        setFeedback('Không thể thêm linh kiện.');
      }
    }
  };

  const updatePart = async () => {
    if (!selectedPart) return;

    if (!selectedPart.partName?.trim()) {
      setFeedback('Vui lòng nhập tên linh kiện.');
      return;
    }

    if (!selectedPart.imageUrl) {
      setFeedback('Vui lòng tải ảnh linh kiện.');
      return;
    }

    if (!editPrice.trim()) {
      setFeedback('Vui lòng nhập giá bán.');
      return;
    }

    if (Number.isNaN(Number(editPrice))) {
      setFeedback('Giá không hợp lệ.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...selectedPart,
        price: Number(editPrice.trim()),
      };
      await axios.patch(`${API_BASE}/parts/${selectedPart._id}`, payload, { withCredentials: true });
      setSelectedPart(null);
      setEditImageFile(null);
      setEditImagePreview('');
      setFeedback('Cập nhật linh kiện thành công.');
      await loadParts();
      setTimeout(() => setFeedback(''), 2500);
    } catch (err: any) {
      setFeedback(err.response?.data?.message || 'Không thể cập nhật linh kiện.');
    } finally {
      setLoading(false);
    }
  };

  const deletePart = async (id: string) => {
    if (!window.confirm('Xóa linh kiện này?')) return;
    await axios.delete(`${API_BASE}/parts/${id}`, { withCredentials: true });
    loadParts();
    loadStats();
  };

  const importStock = async (id: string) => {
    const qtyValue = String(importQty[id] ?? '').trim();
    const priceValue = String(importPrice[id] ?? '').trim();
    const qty = Number(qtyValue);
    const price = Number(priceValue);
    const supplierId = importSupplier[id];

    if (!supplierId) {
      setFeedback('Vui lòng chọn nhà cung cấp.');
      return;
    }

    if (!qtyValue || !Number.isFinite(qty) || qty <= 0) {
      setFeedback('Số lượng nhập phải lớn hơn 0.');
      return;
    }

    if (priceValue === '' || !Number.isFinite(price) || price < 0) {
      setFeedback('Giá nhập không hợp lệ.');
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${API_BASE}/parts/${id}/import`,
        { quantity: qty, importPrice: price, supplierId, note: importNote[id] },
        { withCredentials: true },
      );
      setFeedback('Đã nhập kho thành công.');
      setImportQty((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setImportPrice((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setImportSupplier((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setImportNote((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setImportModalPart(null);
      await Promise.all([loadParts(), loadImports(), loadStats()]);
      setTimeout(() => setFeedback(''), 2500);
    } catch (err: any) {
      setFeedback(err.response?.data?.message || 'Không thể nhập kho.');
    } finally {
      setLoading(false);
    }
  };

  const getImportStats = (partId: string) => {
    const history = imports.filter((item) => item.product?._id === partId);
    if (history.length === 0) {
      return { latestPrice: 0, avgPrice: 0 };
    }

    const sorted = [...history].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const latestPrice = sorted[0]?.importPrice || 0;
    const avgPrice = history.reduce((sum, item) => sum + item.importPrice, 0) / history.length;

    return { latestPrice, avgPrice };
  };

  const updatePartInline = async (partId: string) => {
    const price = priceDraft[partId];

    if (price !== undefined && Number(price) < 0) {
      setFeedback('Giá không hợp lệ.');
      return;
    }

    await axios.patch(
      `${API_BASE}/parts/${partId}`,
      {
        ...(price !== undefined ? { price: Number(price) } : {}),
      },
      { withCredentials: true },
    );

    setEditingPriceId(null);
    setFeedback('Cập nhật thành công.');
    loadParts();
  };

  const handleEditImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setFeedback('Chỉ chấp nhận ảnh JPG hoặc PNG.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFeedback('Kích thước ảnh tối đa 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setEditImageFile(file);
      setEditImagePreview(result);
      if (selectedPart) {
        setSelectedPart({ ...selectedPart, imageUrl: result });
      }
      setFeedback('');
    };
    reader.readAsDataURL(file);
  };

  const createAlert = async (id: string) => {
    const message = alertMsg[id] || '';
    if (!message.trim()) return;
    await axios.post(`${API_BASE}/parts/${id}/alert`, { message }, { withCredentials: true });
    setAlertMsg((prev) => ({ ...prev, [id]: '' }));
    loadAlerts();
  };

  const respondRequest = async (ticketId: string, available: boolean) => {
    await axios.patch(
      `${API_BASE}/ticket/${ticketId}/inventory-response`,
      {
        available,
        noteFromStorekeeper: available ? 'Kho đã duyệt yêu cầu.' : 'Kho không đủ linh kiện.',
      },
      { withCredentials: true },
    );

    await loadRequests();
    await loadAlerts();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setTab('parts')} className={`px-4 py-2 rounded-lg ${tab === 'parts' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
            Linh kiện
          </button>
          {isManager && (
            <button onClick={() => setTab('import')} className={`px-4 py-2 rounded-lg ${tab === 'import' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
              Lịch sử nhập
            </button>
          )}
          {(isManager || isStorekeeper) && (
            <button onClick={() => setTab('usage')} className={`px-4 py-2 rounded-lg ${tab === 'usage' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
              Lịch sử xuất
            </button>
          )}
          {isManager && (
            <button onClick={() => setTab('suppliers')} className={`px-4 py-2 rounded-lg ${tab === 'suppliers' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
              Nhà cung cấp
            </button>
          )}
          {isStorekeeper && (
            <button onClick={() => setTab('requests')} className={`px-4 py-2 rounded-lg ${tab === 'requests' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
              Duyệt yêu cầu
            </button>
          )}
          <button onClick={() => setTab('alerts')} className={`px-4 py-2 rounded-lg ${tab === 'alerts' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
            Cảnh báo
          </button>
        </div>
      </div>

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

      {feedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg text-sm">
          {feedback}
        </div>
      )}

      {tab === 'parts' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded-xl px-3 py-2 bg-white"
              placeholder="Tìm linh kiện..."
            />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as typeof sortOption)}
              className="border rounded-xl px-3 py-2 bg-white"
            >
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
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
                      setFeedback('Chỉ chấp nhận ảnh JPG hoặc PNG.');
                      return;
                    }
                    if (file.size > 2 * 1024 * 1024) {
                      setFeedback('Kích thước ảnh tối đa 2MB.');
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      const result = typeof reader.result === 'string' ? reader.result : '';
                      setImageFile(file);
                      setImagePreview(result);
                      setForm({ ...form, imageUrl: result });
                      setFeedback('');
                    };
                    reader.readAsDataURL(file);
                  }}
                  id="part-image-upload"
                />
                <label
                  htmlFor="part-image-upload"
                  className="border border-blue-600 text-blue-600 px-4 py-2 rounded-xl text-center cursor-pointer hover:bg-blue-50 flex items-center justify-center gap-2"
                >
                  <Upload size={16} />
                  {imageFile ? 'Thay đổi ảnh' : 'Tải ảnh linh kiện'}
                </label>
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="w-20 h-20 rounded-lg object-cover border" />
                )}
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
                    const isLowStock = part.stock > 0 && part.stock < lowStockThreshold;
                    const isOutOfStock = part.stock <= 0;
                    const statusText = isOutOfStock ? 'Hết hàng' : isLowStock ? 'Sắp hết' : 'Ổn định';
                    const statusClass = isOutOfStock
                      ? 'bg-rose-100 text-rose-700'
                      : isLowStock
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700';

                    return (
                      <tr key={part._id} className="border-t border-slate-100">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={part.imageUrl}
                              alt={part.partName}
                              className="w-11 h-11 rounded-lg object-cover border"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.onerror = null;
                                target.src = 'https://via.placeholder.com/80?text=No+Image';
                              }}
                            />
                            <div>
                              <p className="font-semibold text-slate-800">{part.partName}</p>
                              <p className="text-xs text-slate-500">{part.brand || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold">{part.price.toLocaleString('vi-VN')} ₫</td>
                        <td className="px-4 py-3">{part.stock}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusClass}`}>{statusText}</span>
                        </td>
                        <td className="px-4 py-3">{getImportStats(part._id).latestPrice.toLocaleString('vi-VN')} ₫</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end flex-wrap gap-2">
                            {isStorekeeper && (
                              <>
                                <input
                                  className="border rounded px-2 py-1 text-xs"
                                  value={alertMsg[part._id] || ''}
                                  onChange={(e) => setAlertMsg((prev) => ({ ...prev, [part._id]: e.target.value }))}
                                  placeholder="Ghi chú"
                                />
                                <button onClick={() => createAlert(part._id)} className="px-2 py-1 rounded bg-amber-600 text-white text-xs">Báo thiếu</button>
                              </>
                            )}
                            {isManager && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedPart(part);
                                    setEditImageFile(null);
                                    setEditImagePreview('');
                                    setEditPrice(String(part.price ?? ''));
                                  }}
                                  className="px-3 py-1 rounded bg-blue-600 text-white text-xs"
                                >
                                  Cập nhật
                                </button>
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
              <button onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-3 py-1 rounded border disabled:opacity-50">Trước</button>
              <button onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="px-3 py-1 rounded border disabled:opacity-50">Sau</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'import' && isManager && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">Lịch sử nhập kho</h2>
            <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold">
              {imports.length} bản ghi
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Linh kiện</th>
                  <th className="px-3 py-2 text-left">Nhà cung cấp</th>
                  <th className="px-3 py-2 text-left">Batch</th>
                  <th className="px-3 py-2 text-left">Số lượng</th>
                  <th className="px-3 py-2 text-left">Giá nhập</th>
                  <th className="px-3 py-2 text-left">Thời gian</th>
                  <th className="px-3 py-2 text-left">Người tạo</th>
                </tr>
              </thead>
              <tbody>
                {imports.map((item) => (
                  <tr key={item._id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                    <td className="px-3 py-2 font-medium text-slate-800">{item.product?.partName || 'N/A'}</td>
                    <td className="px-3 py-2">{item.supplier?.name || 'N/A'}</td>
                    <td className="px-3 py-2">{item.batchCode || 'N/A'}</td>
                    <td className="px-3 py-2">{item.quantity}</td>
                    <td className="px-3 py-2 font-semibold">{item.importPrice.toLocaleString('vi-VN')} ₫</td>
                    <td className="px-3 py-2">{new Date(item.createdAt).toLocaleString('vi-VN')}</td>
                    <td className="px-3 py-2">{item.createdBy?.fullName || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'usage' && (isManager || isStorekeeper) && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">Lịch sử xuất kho sửa chữa</h2>
            <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
              {usageHistory.length} bản ghi
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-3 py-2.5">Linh kiện</th>
                  <th className="text-left px-3 py-2.5">Mã phiếu</th>
                  <th className="text-left px-3 py-2.5">Số lượng</th>
                  <th className="text-left px-3 py-2.5">Đơn giá</th>
                  <th className="text-left px-3 py-2.5">Thành tiền</th>
                  <th className="text-left px-3 py-2.5">Thời gian</th>
                  <th className="text-left px-3 py-2.5">Người thao tác</th>
                </tr>
              </thead>
              <tbody>
                {usageHistory.map((item) => {
                  const unitPrice = Number(item.unitPrice || 0);
                  const totalPrice = unitPrice * Number(item.quantity || 0);

                  return (
                    <tr key={item._id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                      <td className="px-3 py-2.5 font-medium text-slate-800">{item.part?.partName || 'N/A'}</td>
                      <td className="px-3 py-2.5">{item.ticket?.ticketCode || 'N/A'}</td>
                      <td className="px-3 py-2.5">{item.quantity}</td>
                      <td className="px-3 py-2.5">{unitPrice.toLocaleString('vi-VN')} ₫</td>
                      <td className="px-3 py-2.5 font-semibold text-slate-800">{totalPrice.toLocaleString('vi-VN')} ₫</td>
                      <td className="px-3 py-2.5">{new Date(item.createdAt).toLocaleString('vi-VN')}</td>
                      <td className="px-3 py-2.5">{item.createdBy?.fullName || 'N/A'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'suppliers' && isManager && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">{editingSupplier ? 'Cập nhật nhà cung cấp' : 'Thêm nhà cung cấp'}</h2>
              <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold">Supplier Form</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                className="border border-slate-200 rounded-xl px-3 py-2.5"
                placeholder="Tên nhà cung cấp"
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              />
              <input
                className="border border-slate-200 rounded-xl px-3 py-2.5"
                placeholder="Số điện thoại"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
              />
              <input
                className="border border-slate-200 rounded-xl px-3 py-2.5"
                placeholder="Email"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
              />
              <input
                className="border border-slate-200 rounded-xl px-3 py-2.5"
                placeholder="Địa chỉ"
                value={supplierForm.address}
                onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
              />
              <textarea
                className="border border-slate-200 rounded-xl px-3 py-2.5 md:col-span-2"
                placeholder="Ghi chú"
                value={supplierForm.note}
                onChange={(e) => setSupplierForm({ ...supplierForm, note: e.target.value })}
              />
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {editingSupplier ? (
                <>
                  <button onClick={updateSupplier} className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold">Lưu thay đổi</button>
                  <button
                    onClick={() => {
                      setEditingSupplier(null);
                      setSupplierForm({ name: '', phone: '', email: '', address: '', note: '' });
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200"
                  >
                    Hủy
                  </button>
                </>
              ) : (
                <button onClick={createSupplier} className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold">Thêm nhà cung cấp</button>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-900">Danh sách nhà cung cấp</h2>
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">{suppliers.length} nhà cung cấp</span>
            </div>

            {suppliers.length === 0 ? (
              <p className="text-slate-500 text-sm">Chưa có nhà cung cấp.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="text-left px-3 py-2.5">Tên nhà cung cấp</th>
                      <th className="text-left px-3 py-2.5">Số điện thoại</th>
                      <th className="text-left px-3 py-2.5">Email</th>
                      <th className="text-left px-3 py-2.5">Địa chỉ</th>
                      <th className="text-left px-3 py-2.5">Ghi chú</th>
                      <th className="text-right px-3 py-2.5">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((supplier) => (
                      <tr key={supplier._id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                        <td className="px-3 py-2.5 font-semibold text-slate-800">{supplier.name}</td>
                        <td className="px-3 py-2.5">{supplier.phone || 'Chưa có SĐT'}</td>
                        <td className="px-3 py-2.5">{supplier.email || 'Chưa có email'}</td>
                        <td className="px-3 py-2.5">{supplier.address || 'Chưa có địa chỉ'}</td>
                        <td className="px-3 py-2.5 text-slate-600">{supplier.note || '-'}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingSupplier(supplier);
                                setSupplierForm({
                                  name: supplier.name || '',
                                  phone: supplier.phone || '',
                                  email: supplier.email || '',
                                  address: supplier.address || '',
                                  note: supplier.note || '',
                                });
                              }}
                              className="px-3 py-1 rounded-lg border border-slate-200"
                            >
                              Sửa
                            </button>
                            <button onClick={() => deleteSupplier(supplier._id)} className="px-3 py-1 rounded-lg border border-rose-200 text-rose-600">
                              Xóa
                            </button>
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

      {tab === 'requests' && isStorekeeper && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">Yêu cầu linh kiện từ kỹ thuật</h2>
            <span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold">
              {requests.length} yêu cầu
            </span>
          </div>

          {requests.length === 0 ? (
            <p className="text-slate-500 text-sm">Chưa có yêu cầu nào.</p>
          ) : (
            <div className="space-y-3 text-sm">
              {requests.map((ticket) => {
                const techFromHistory = [...(ticket.statusHistory || [])]
                  .reverse()
                  .find((h) => h.changedBy?.role === 'technician' && h.changedBy?.fullName)?.changedBy;

                const technicianName =
                  ticket.inventoryRequest?.requestedBy?.fullName ||
                  ticket.technician?.fullName ||
                  techFromHistory?.fullName ||
                  'N/A';

                const requiredParts = ticket.inventoryRequest?.requiredParts || [];
                const totalPartsCost = requiredParts.reduce((sum, item) => {
                  const unitPrice = Number(item.part?.price ?? item.unitPrice ?? 0);
                  const quantity = Number(item.quantity || 0);
                  return sum + unitPrice * quantity;
                }, 0);

                return (
                  <div key={ticket._id} className="rounded-2xl border border-slate-200 p-4 hover:shadow-sm transition-shadow">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div>
                        <p className="font-semibold text-slate-900">{ticket.ticketCode || ticket._id}</p>
                        <p className="text-xs text-slate-500">{ticket.device?.brand} {ticket.device?.model} • {ticket.device?.customer?.fullName || 'N/A'}</p>
                        <p className="text-xs text-slate-500">Kỹ thuật: {technicianName}</p>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          ticket.inventoryRequest?.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : ticket.inventoryRequest?.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {ticket.inventoryRequest?.status === 'APPROVED'
                          ? 'Đã duyệt'
                          : ticket.inventoryRequest?.status === 'REJECTED'
                          ? 'Đã từ chối'
                          : 'Chờ duyệt'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 mb-3 bg-slate-50 rounded-lg px-3 py-2">
                      {ticket.inventoryRequest?.noteFromTechnician || 'Không có ghi chú'}
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            <th className="text-left px-3 py-2">Linh kiện</th>
                            <th className="text-left px-3 py-2">Số lượng</th>
                            <th className="text-left px-3 py-2">Đơn giá</th>
                            <th className="text-left px-3 py-2">Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          {requiredParts.map((item, index) => {
                            const unitPrice = Number(item.part?.price ?? item.unitPrice ?? 0);
                            const quantity = Number(item.quantity || 0);
                            const lineTotal = unitPrice * quantity;

                            return (
                              <tr key={`${ticket._id}-${index}`} className="border-t border-slate-100">
                                <td className="px-3 py-2">{item.part?.partName || 'Linh kiện'} {item.part?.brand ? `(${item.part.brand})` : ''}</td>
                                <td className="px-3 py-2">{quantity}</td>
                                <td className="px-3 py-2">{unitPrice.toLocaleString('vi-VN')} ₫</td>
                                <td className="px-3 py-2 font-semibold text-slate-800">{lineTotal.toLocaleString('vi-VN')} ₫</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-semibold text-slate-700">
                        Tổng tiền linh kiện: {totalPartsCost.toLocaleString('vi-VN')} ₫
                      </div>

                      {ticket.inventoryRequest?.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button onClick={() => respondRequest(ticket._id, true)} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold">Duyệt</button>
                          <button onClick={() => respondRequest(ticket._id, false)} className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold">Từ chối</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'alerts' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">Cảnh báo linh kiện</h2>
            <span className="text-xs px-2 py-1 rounded-full bg-rose-50 text-rose-700 font-semibold">
              {alerts.length} cảnh báo
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-3 py-2.5">Linh kiện</th>
                  <th className="text-left px-3 py-2.5">Cảnh báo</th>
                  <th className="text-left px-3 py-2.5">Tồn kho</th>
                  <th className="text-left px-3 py-2.5">Thời gian</th>
                  <th className="text-left px-3 py-2.5">Người tạo</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => {
                  const stock = a.part?.stock ?? 0;
                  const minStock = a.part?.minStock ?? 0;
                  const isCritical = stock <= 0;

                  return (
                    <tr key={a._id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          {a.part?.imageUrl ? (
                            <img src={a.part.imageUrl} alt={a.part.partName} className="w-10 h-10 rounded-lg object-cover border" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg border bg-slate-100" />
                          )}
                          <span className="font-medium text-slate-800">{a.part?.partName || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${isCritical ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                          {a.message}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">{stock} / {minStock}</td>
                      <td className="px-3 py-2.5">{new Date(a.createdAt).toLocaleString('vi-VN')}</td>
                      <td className="px-3 py-2.5">{a.createdBy?.fullName || 'N/A'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedPart && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-4 w-full max-w-md space-y-3">
            <h3 className="font-semibold">Cập nhật linh kiện</h3>
            <input
              className="border rounded px-3 py-2 w-full"
              placeholder="Tên linh kiện"
              value={selectedPart.partName}
              onChange={(e) => setSelectedPart({ ...selectedPart, partName: e.target.value })}
            />
            <input
              className="border rounded px-3 py-2 w-full"
              placeholder="Hãng"
              value={selectedPart.brand || ''}
              onChange={(e) => setSelectedPart({ ...selectedPart, brand: e.target.value })}
            />
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={handleEditImageChange}
                id="part-image-edit-upload"
              />
              <label
                htmlFor="part-image-edit-upload"
                className="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg text-center cursor-pointer hover:bg-blue-50 flex items-center justify-center gap-2"
              >
                <Upload size={16} />
                {editImageFile ? 'Thay đổi ảnh' : 'Tải ảnh mới'}
              </label>
              {(editImagePreview || selectedPart.imageUrl) && (
                <img
                  src={editImagePreview || selectedPart.imageUrl}
                  alt="Preview"
                  className="w-24 h-24 rounded-lg object-cover border"
                />
              )}
            </div>
            <input
              type="text"
              inputMode="numeric"
              className="border rounded px-3 py-2 w-full"
              placeholder="Giá (VNĐ)"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={updatePart} className="flex-1 bg-blue-600 text-white py-2 rounded" disabled={loading}>
                {loading ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button
                onClick={() => {
                  setSelectedPart(null);
                  setEditImageFile(null);
                  setEditImagePreview('');
                  setEditPrice('');
                }}
                className="flex-1 border py-2 rounded"
                disabled={loading}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {importModalPart && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-4 w-full max-w-md space-y-4">
            <h3 className="font-semibold">Nhập kho: {importModalPart.partName}</h3>
            <select
              className="border rounded px-3 py-2 w-full"
              value={importSupplier[importModalPart._id] || ''}
              onChange={(e) => setImportSupplier((prev) => ({ ...prev, [importModalPart._id]: e.target.value }))}
            >
              <option value="">Chọn nhà cung cấp</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
            <input
              type="text"
              inputMode="numeric"
              className="border rounded px-3 py-2 w-full"
              placeholder="Số lượng nhập"
              value={importQty[importModalPart._id] ?? ''}
              onChange={(e) => setImportQty((prev) => ({ ...prev, [importModalPart._id]: e.target.value }))}
            />
            <input
              type="text"
              inputMode="numeric"
              className="border rounded px-3 py-2 w-full"
              placeholder="Giá nhập"
              value={importPrice[importModalPart._id] ?? ''}
              onChange={(e) => setImportPrice((prev) => ({ ...prev, [importModalPart._id]: e.target.value }))}
            />
            <textarea
              className="border rounded px-3 py-2 w-full"
              placeholder="Ghi chú"
              value={importNote[importModalPart._id] ?? ''}
              onChange={(e) => setImportNote((prev) => ({ ...prev, [importModalPart._id]: e.target.value }))}
            />
            <div className="flex gap-2">
              <button
                onClick={() => importStock(importModalPart._id)}
                className="flex-1 bg-emerald-600 text-white py-2 rounded"
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận nhập'}
              </button>
              <button
                onClick={() => setImportModalPart(null)}
                className="flex-1 border py-2 rounded"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && <p>Đang tải dữ liệu...</p>}
    </div>
  );
};
