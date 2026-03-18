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
  };
  quantity?: number;
}

interface InventoryRequest {
  _id: string;
  ticketCode?: string;
  status?: string;
  inventoryRequest?: {
    status?: string;
    noteFromTechnician?: string;
    noteFromStorekeeper?: string;
    requiredParts?: InventoryRequestItem[];
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
  const [importQty, setImportQty] = useState<Record<string, number>>({});
  const [importPrice, setImportPrice] = useState<Record<string, number>>({});
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
    const data = res.data.data || [];
    const filtered = data.filter((ticket: InventoryRequest) =>
      ['PENDING', 'APPROVED', 'REJECTED'].includes(ticket.inventoryRequest?.status || ''),
    );
    setRequests(filtered);
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
    await axios.patch(`${API_BASE}/parts/${selectedPart._id}`, selectedPart, { withCredentials: true });
    setSelectedPart(null);
    loadParts();
  };

  const deletePart = async (id: string) => {
    if (!window.confirm('Xóa linh kiện này?')) return;
    await axios.delete(`${API_BASE}/parts/${id}`, { withCredentials: true });
    loadParts();
    loadStats();
  };

  const importStock = async (id: string) => {
    const qty = importQty[id] || 0;
    const price = importPrice[id] || 0;
    const supplierId = importSupplier[id];

    if (!supplierId) {
      setFeedback('Vui lòng chọn nhà cung cấp.');
      return;
    }

    if (qty <= 0) {
      setFeedback('Số lượng nhập phải lớn hơn 0.');
      return;
    }

    await axios.post(
      `${API_BASE}/parts/${id}/import`,
      { quantity: qty, importPrice: price, supplierId, note: importNote[id] },
      { withCredentials: true },
    );
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

    setFeedback('Cập nhật thành công.');
    loadParts();
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
          <h1 className="text-2xl font-bold">Quản lý kho linh kiện</h1>
          <p className="text-sm text-slate-500">Quyền: {user?.role}</p>
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

      {tab === 'parts' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded-lg px-3 py-2"
              placeholder="Tìm linh kiện..."
            />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as typeof sortOption)}
              className="border rounded-lg px-3 py-2 bg-white"
            >
              <option value="name-asc">Tên A → Z</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
              <option value="stock-asc">Số lượng tăng dần</option>
              <option value="stock-desc">Số lượng giảm dần</option>
            </select>
          </div>

          {isManager && (
            <div className="bg-white border rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <input className="border rounded-lg px-3 py-2" placeholder="Tên linh kiện (bắt buộc)" value={form.partName} onChange={(e) => setForm({ ...form, partName: e.target.value })} />
              <input className="border rounded-lg px-3 py-2" placeholder="Hãng (tùy chọn)" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
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
                  className="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg text-center cursor-pointer hover:bg-blue-50 flex items-center justify-center gap-2"
                >
                  <Upload size={16} />
                  {imageFile ? 'Thay đổi ảnh' : 'Tải ảnh linh kiện'}
                </label>
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-20 h-20 rounded-lg object-cover border"
                  />
                )}
              </div>
              <button onClick={createPart} className="col-span-full bg-blue-600 text-white py-2 rounded-lg">Thêm linh kiện</button>
              {feedback && <p className="col-span-full text-sm text-amber-600">{feedback}</p>}
            </div>
          )}

          <div className="grid gap-3">
            {pagedParts.map((part) => {
              const priceValue = priceDraft[part._id] ?? part.price;
              const stockValue = part.stock;
              const isLowStock = part.stock > 0 && part.stock < lowStockThreshold;
              const isOutOfStock = part.stock <= 0;

              return (
                <div key={part._id} className="bg-white border rounded-xl p-4 flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={part.imageUrl}
                        alt={part.partName}
                        className="w-16 h-16 rounded-lg object-cover border"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.onerror = null;
                          target.src = 'https://via.placeholder.com/80?text=No+Image';
                        }}
                      />
                      <div>
                        <p className="font-semibold text-base">{part.partName}</p>
                        <p className="text-sm text-slate-500">Hãng: {part.brand || 'N/A'}</p>
                        {isOutOfStock && <p className="text-xs text-red-600 font-semibold">Hết hàng</p>}
                        {isLowStock && <p className="text-xs text-amber-600 font-semibold">Sắp hết hàng</p>}
                      </div>
                    </div>

                    {isStorekeeper && (
                      <div className="flex items-center gap-2">
                        <input
                          className="border rounded px-2 py-1 text-sm"
                          value={alertMsg[part._id] || ''}
                          onChange={(e) => setAlertMsg((prev) => ({ ...prev, [part._id]: e.target.value }))}
                          placeholder="Ghi chú cảnh báo"
                        />
                        <button onClick={() => createAlert(part._id)} className="px-3 py-1 rounded bg-amber-600 text-white text-sm">Báo thiếu</button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs uppercase text-slate-500 font-semibold">Giá bán</label>
                      <input
                        type="number"
                        className="w-full border rounded-lg px-3 py-2"
                        value={priceValue}
                        onChange={(e) => setPriceDraft((prev) => ({ ...prev, [part._id]: Number(e.target.value) }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') updatePartInline(part._id);
                        }}
                        disabled={!isManager}
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase text-slate-500 font-semibold">Tồn kho</label>
                      <input
                        type="number"
                        min={0}
                        className="w-full border rounded-lg px-3 py-2"
                        value={stockValue}
                        disabled
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs uppercase text-slate-500 font-semibold">Giá nhập gần nhất</label>
                      <div className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50">
                        {getImportStats(part._id).latestPrice.toLocaleString('vi-VN')} ₫
                      </div>
                    </div>
                    <div>
                      <label className="text-xs uppercase text-slate-500 font-semibold">Giá nhập trung bình</label>
                      <div className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50">
                        {Math.round(getImportStats(part._id).avgPrice).toLocaleString('vi-VN')} ₫
                      </div>
                    </div>
                  </div>

                  {isManager && (
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => updatePartInline(part._id)} className="px-3 py-1 rounded bg-blue-600 text-white">Cập nhật</button>
                      <button onClick={() => setSelectedPart(part)} className="px-3 py-1 rounded border">Sửa</button>
                      <button onClick={() => deletePart(part._id)} className="px-3 py-1 rounded border text-red-600">Xóa</button>
                      <button onClick={() => setImportModalPart(part)} className="px-3 py-1 rounded bg-emerald-600 text-white">Nhập kho</button>
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Trang {currentPage} / {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border disabled:opacity-50"
              >
                Trước
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'import' && isManager && (
        <div className="bg-white border rounded-xl p-4">
          <h2 className="font-semibold mb-3">Lịch sử nhập kho</h2>
          <div className="space-y-2 text-sm">
            {imports.map((item) => (
              <div key={item._id} className="flex flex-col md:flex-row md:justify-between border-b py-2 gap-2">
                <span>{item.product?.partName || 'N/A'} • {item.quantity} linh kiện • {item.importPrice.toLocaleString('vi-VN')} ₫</span>
                <span>{item.supplier?.name || 'N/A'} • {item.batchCode || 'N/A'} • {new Date(item.createdAt).toLocaleString('vi-VN')} • {item.createdBy?.fullName || 'N/A'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'usage' && (isManager || isStorekeeper) && (
        <div className="bg-white border rounded-xl p-4">
          <h2 className="font-semibold mb-3">Lịch sử xuất kho sửa chữa</h2>
          <div className="space-y-2 text-sm">
            {usageHistory.map((item) => (
              <div key={item._id} className="flex flex-col md:flex-row md:justify-between border-b py-2 gap-2">
                <span>{item.part?.partName || 'N/A'} • {item.quantity} linh kiện • {Number(item.unitPrice || 0).toLocaleString('vi-VN')} ₫</span>
                <span>{item.ticket?.ticketCode || 'N/A'} • {new Date(item.createdAt).toLocaleString('vi-VN')} • {item.createdBy?.fullName || 'N/A'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'suppliers' && isManager && (
        <div className="space-y-4">
          <div className="bg-white border rounded-xl p-4">
            <h2 className="font-semibold mb-3">{editingSupplier ? 'Cập nhật nhà cung cấp' : 'Thêm nhà cung cấp'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                className="border rounded-lg px-3 py-2"
                placeholder="Tên nhà cung cấp"
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              />
              <input
                className="border rounded-lg px-3 py-2"
                placeholder="Số điện thoại"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
              />
              <input
                className="border rounded-lg px-3 py-2"
                placeholder="Email"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
              />
              <input
                className="border rounded-lg px-3 py-2"
                placeholder="Địa chỉ"
                value={supplierForm.address}
                onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
              />
              <textarea
                className="border rounded-lg px-3 py-2 md:col-span-2"
                placeholder="Ghi chú"
                value={supplierForm.note}
                onChange={(e) => setSupplierForm({ ...supplierForm, note: e.target.value })}
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {editingSupplier ? (
                <>
                  <button onClick={updateSupplier} className="px-4 py-2 rounded-lg bg-blue-600 text-white">Lưu thay đổi</button>
                  <button
                    onClick={() => {
                      setEditingSupplier(null);
                      setSupplierForm({ name: '', phone: '', email: '', address: '', note: '' });
                    }}
                    className="px-4 py-2 rounded-lg border"
                  >
                    Hủy
                  </button>
                </>
              ) : (
                <button onClick={createSupplier} className="px-4 py-2 rounded-lg bg-emerald-600 text-white">Thêm nhà cung cấp</button>
              )}
            </div>
          </div>

          <div className="bg-white border rounded-xl p-4">
            <h2 className="font-semibold mb-3">Danh sách nhà cung cấp</h2>
            <div className="space-y-3 text-sm">
              {suppliers.length === 0 && <p className="text-slate-500">Chưa có nhà cung cấp.</p>}
              {suppliers.map((supplier) => (
                <div key={supplier._id} className="border rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="font-semibold">{supplier.name}</p>
                    <p className="text-xs text-slate-500">{supplier.phone || 'Chưa có SĐT'} • {supplier.email || 'Chưa có email'}</p>
                    <p className="text-xs text-slate-500">{supplier.address || 'Chưa có địa chỉ'}</p>
                    {supplier.note && <p className="text-xs text-slate-500">Ghi chú: {supplier.note}</p>}
                  </div>
                  <div className="flex gap-2">
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
                      className="px-3 py-1 rounded border"
                    >
                      Sửa
                    </button>
                    <button onClick={() => deleteSupplier(supplier._id)} className="px-3 py-1 rounded border text-red-600">
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'requests' && isStorekeeper && (
        <div className="bg-white border rounded-xl p-4">
          <h2 className="font-semibold mb-3">Yêu cầu linh kiện từ kỹ thuật</h2>
          <div className="space-y-3 text-sm">
            {requests.length === 0 && <p className="text-slate-500">Chưa có yêu cầu nào.</p>}
            {requests.map((ticket) => (
              <div key={ticket._id} className="border rounded-lg p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{ticket.ticketCode || ticket._id}</p>
                    <p className="text-xs text-slate-500">{ticket.device?.brand} {ticket.device?.model} • {ticket.device?.customer?.fullName || 'N/A'}</p>
                    <p className="text-xs text-slate-500">Kỹ thuật: {ticket.technician?.fullName || 'N/A'}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      ticket.inventoryRequest?.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : ticket.inventoryRequest?.status === 'REJECTED'
                        ? 'bg-red-100 text-red-700'
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

                <div className="text-xs text-slate-500">
                  {ticket.inventoryRequest?.noteFromTechnician || 'Không có ghi chú'}
                </div>

                <div className="space-y-1">
                  {(ticket.inventoryRequest?.requiredParts || []).map((item, index) => (
                    <div key={`${ticket._id}-${index}`} className="flex justify-between text-xs">
                      <span>{item.part?.partName || 'Linh kiện'} {item.part?.brand ? `(${item.part.brand})` : ''}</span>
                      <span>x{item.quantity || 0}</span>
                    </div>
                  ))}
                </div>

                {ticket.inventoryRequest?.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button onClick={() => respondRequest(ticket._id, true)} className="px-3 py-1 rounded bg-emerald-600 text-white">Duyệt</button>
                    <button onClick={() => respondRequest(ticket._id, false)} className="px-3 py-1 rounded bg-red-600 text-white">Từ chối</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'alerts' && (
        <div className="bg-white border rounded-xl p-4">
          <h2 className="font-semibold mb-3">Cảnh báo linh kiện</h2>
          <div className="space-y-3 text-sm">
            {alerts.map((a) => (
              <div key={a._id} className="border-b py-2 flex items-center gap-3">
                {a.part?.imageUrl && (
                  <img src={a.part.imageUrl} alt={a.part.partName} className="w-10 h-10 rounded object-cover border" />
                )}
                <div>
                  <p className="font-semibold">{a.part?.partName} • {a.message}</p>
                  <p className="text-xs text-slate-500">Tồn: {a.part?.stock ?? 0} • Min: {a.part?.minStock ?? 0}</p>
                  <p className="text-xs text-slate-500">{new Date(a.createdAt).toLocaleString('vi-VN')} • {a.createdBy?.fullName || 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedPart && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-4 w-full max-w-md space-y-3">
            <h3 className="font-semibold">Cập nhật linh kiện</h3>
            <input className="border rounded px-3 py-2 w-full" placeholder="Tên linh kiện" value={selectedPart.partName} onChange={(e) => setSelectedPart({ ...selectedPart, partName: e.target.value })} />
            <input className="border rounded px-3 py-2 w-full" placeholder="Hãng" value={selectedPart.brand || ''} onChange={(e) => setSelectedPart({ ...selectedPart, brand: e.target.value })} />
            <input className="border rounded px-3 py-2 w-full" placeholder="Ảnh (URL)" value={selectedPart.imageUrl} onChange={(e) => setSelectedPart({ ...selectedPart, imageUrl: e.target.value })} />
            <input type="number" className="border rounded px-3 py-2 w-full" placeholder="Giá (VNĐ)" value={selectedPart.price} onChange={(e) => setSelectedPart({ ...selectedPart, price: Number(e.target.value) })} />
            <input type="number" className="border rounded px-3 py-2 w-full" placeholder="Tồn tối thiểu" value={selectedPart.minStock} onChange={(e) => setSelectedPart({ ...selectedPart, minStock: Number(e.target.value) })} />
            <div className="flex gap-2">
              <button onClick={updatePart} className="flex-1 bg-blue-600 text-white py-2 rounded">Lưu</button>
              <button onClick={() => setSelectedPart(null)} className="flex-1 border py-2 rounded">Hủy</button>
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
              type="number"
              min={0}
              className="border rounded px-3 py-2 w-full"
              placeholder="Số lượng nhập"
              value={importQty[importModalPart._id] ?? ''}
              onChange={(e) => setImportQty((prev) => ({ ...prev, [importModalPart._id]: Number(e.target.value) }))}
            />
            <input
              type="number"
              min={0}
              className="border rounded px-3 py-2 w-full"
              placeholder="Giá nhập"
              value={importPrice[importModalPart._id] ?? ''}
              onChange={(e) => setImportPrice((prev) => ({ ...prev, [importModalPart._id]: Number(e.target.value) }))}
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
              >
                Xác nhận nhập
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
