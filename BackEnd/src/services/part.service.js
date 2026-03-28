const Part = require('../models/part.model');
const InventoryTransaction = require('../models/inventoryTransaction.model');
const StockAlert = require('../models/stockAlert.model');
const ImportOrder = require('../models/importOrder.model');
const ImportItem = require('../models/importItem.model');
const Supplier = require('../models/supplier.model');

function generateBatchCode() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `LO-${stamp}-${rand}`;
}

async function listParts({ lowStock, outOfStock, search }) {
  const query = {};

  if (search) {
    query.$or = [
      { partName: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
    ];
  }

  if (outOfStock) {
    query.stock = { $lte: 0 };
  } else if (lowStock) {
    query.$expr = { $lte: ['$stock', '$minStock'] };
  }

  return Part.find(query).sort({ createdAt: -1 });
}

async function createPart(data) {
  if (!data.partName || !data.imageUrl) {
    throw new Error('PART_REQUIRED_FIELDS_MISSING');
  }

  return Part.create({
    partName: data.partName,
    brand: data.brand,
    imageUrl: data.imageUrl,
    price: data.price ?? 0,
    warrantyMonths: data.warrantyMonths ?? 0,
    stock: data.stock ?? 0,
    minStock: data.minStock ?? 0,
  });
}

async function updatePart(id, data) {
  const updateData = { ...data };
  delete updateData.stock;

  const part = await Part.findByIdAndUpdate(id, updateData, { new: true });
  if (!part) throw new Error('PART_NOT_FOUND');
  return part;
}

async function deletePart(id) {
  const part = await Part.findByIdAndDelete(id);
  if (!part) throw new Error('PART_NOT_FOUND');
  return part;
}

async function importStock(partId, data, userId) {
  const quantity = Number(data.quantity || 0);
  const importPrice = Number(data.importPrice || 0);
  const supplierId = data.supplierId;

  if (!supplierId) throw new Error('SUPPLIER_REQUIRED');
  if (quantity <= 0) throw new Error('INVALID_QUANTITY');
  if (importPrice < 0) throw new Error('INVALID_IMPORT_PRICE');

  const [part, supplier] = await Promise.all([
    Part.findById(partId),
    Supplier.findById(supplierId),
  ]);

  if (!part) throw new Error('PART_NOT_FOUND');
  if (!supplier) throw new Error('SUPPLIER_NOT_FOUND');

  part.stock += quantity;
  await part.save();

  const order = await ImportOrder.create({
    supplier: supplier._id,
    createdBy: userId,
    note: data.note,
    batchCode: generateBatchCode(),
    importedAt: new Date(),
  });

  await ImportItem.create({
    order: order._id,
    product: part._id,
    quantity,
    importPrice,
  });

  await InventoryTransaction.create({
    part: part._id,
    quantity,
    type: 'IN',
    createdBy: userId,
  });

  if (part.stock <= part.minStock) {
    await StockAlert.create({
      part: part._id,
      createdBy: userId,
      message: `Tồn kho thấp sau nhập: ${part.stock}/${part.minStock}`,
    });
  }

  return part;
}

async function importStockOrder(data, userId) {
  const supplierId = data.supplierId;
  const items = Array.isArray(data.items) ? data.items : [];

  if (!supplierId) throw new Error('SUPPLIER_REQUIRED');
  if (items.length === 0) throw new Error('ITEMS_REQUIRED');

  const supplier = await Supplier.findById(supplierId);
  if (!supplier) throw new Error('SUPPLIER_NOT_FOUND');

  const order = await ImportOrder.create({
    supplier: supplier._id,
    createdBy: userId,
    note: data.note,
    batchCode: generateBatchCode(),
    importedAt: new Date(),
  });

  const updatedParts = [];

  for (const item of items) {
    const partId = item.partId || item.productId;
    const quantity = Number(item.quantity || 0);
    const importPrice = Number(item.importPrice || 0);

    if (!partId) throw new Error('PART_REQUIRED');
    if (quantity <= 0) throw new Error('INVALID_QUANTITY');
    if (importPrice < 0) throw new Error('INVALID_IMPORT_PRICE');

    const part = await Part.findById(partId);
    if (!part) throw new Error('PART_NOT_FOUND');

    part.stock += quantity;
    await part.save();

    await ImportItem.create({
      order: order._id,
      product: part._id,
      quantity,
      importPrice,
    });

    await InventoryTransaction.create({
      part: part._id,
      quantity,
      type: 'IN',
      createdBy: userId,
    });

    if (part.stock <= part.minStock) {
      await StockAlert.create({
        part: part._id,
        createdBy: userId,
        message: `Tồn kho thấp sau nhập: ${part.stock}/${part.minStock}`,
      });
    }

    updatedParts.push(part);
  }

  return {
    orderId: order._id,
    items: updatedParts,
  };
}

async function listImportHistory() {
  const items = await ImportItem.find()
    .populate({
      path: 'order',
      populate: [
        { path: 'supplier', select: 'name' },
        { path: 'createdBy', select: 'fullName role' },
      ],
    })
    .populate('product', 'partName brand')
    .sort({ createdAt: -1 });

  return items.map((item) => ({
    _id: item._id,
    quantity: item.quantity,
    importPrice: item.importPrice,
    total: item.quantity * item.importPrice,
    product: item.product,
    createdAt: item.createdAt,
    supplier: item.order?.supplier,
    createdBy: item.order?.createdBy,
    note: item.order?.note,
    batchCode: item.order?.batchCode,
  }));
}

async function listUsageHistory() {
  const transactions = await InventoryTransaction.find({ type: 'OUT' })
    .populate('part', 'partName brand price')
    .populate('ticket', 'ticketCode')
    .populate('createdBy', 'fullName role')
    .sort({ createdAt: -1 });

  return transactions.map((transaction) => ({
    _id: transaction._id,
    part: transaction.part,
    ticket: transaction.ticket,
    quantity: transaction.quantity,
    unitPrice: transaction.unitPrice || transaction.part?.price || 0,
    total: (transaction.unitPrice || transaction.part?.price || 0) * transaction.quantity,
    createdAt: transaction.createdAt,
    createdBy: transaction.createdBy,
  }));
}

async function createStockAlert(partId, message, userId) {
  if (!message) throw new Error('MESSAGE_REQUIRED');

  const part = await Part.findById(partId);
  if (!part) throw new Error('PART_NOT_FOUND');

  return StockAlert.create({
    part: part._id,
    createdBy: userId,
    message,
  });
}

async function listStockAlerts() {
  return StockAlert.find()
    .populate('part', 'partName brand stock minStock imageUrl')
    .populate('createdBy', 'fullName role')
    .sort({ createdAt: -1 });
}

async function getInventoryStats() {
  const [totalParts, totalQuantity, lowStockCount, outOfStockCount] = await Promise.all([
    Part.countDocuments(),
    Part.aggregate([{ $group: { _id: null, total: { $sum: '$stock' } } }]),
    Part.countDocuments({ $expr: { $lte: ['$stock', '$minStock'] }, stock: { $gt: 0 } }),
    Part.countDocuments({ stock: { $lte: 0 } }),
  ]);

  return {
    totalParts,
    totalQuantity: totalQuantity[0]?.total || 0,
    lowStock: lowStockCount,
    outOfStock: outOfStockCount,
  };
}

async function getInventoryKPI({ fromDate, toDate } = {}) {
  const from = fromDate ? new Date(fromDate) : null;
  const to = toDate ? new Date(toDate) : null;

  const [parts, allImportItems, allUsageTransactions] = await Promise.all([
    Part.find(),
    ImportItem.find()
      .populate({ path: 'order', populate: [{ path: 'supplier', select: 'name' }, { path: 'createdBy', select: 'fullName' }] })
      .populate('product', 'partName brand price stock minStock'),
    InventoryTransaction.find({ type: { $in: ['OUT', 'WARRANTY_OUT'] } })
      .populate('part', 'partName brand price stock minStock'),
  ]);

  // Filter theo khoảng ngày
  const importItems = allImportItems.filter((i) => {
    const date = i.order?.importedAt || i.createdAt;
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
  });
  const usageTransactions = allUsageTransactions.filter((t) => {
    if (from && t.createdAt < from) return false;
    if (to && t.createdAt > to) return false;
    return true;
  });

  // Tổng giá trị kho hiện tại (luôn dùng all, không filter ngày)
  const totalInventoryValue = parts.reduce((sum, p) => sum + p.stock * p.price, 0);
  const totalImportCost = importItems.reduce((sum, i) => sum + i.quantity * i.importPrice, 0);
  const totalUsageValue = usageTransactions.reduce((sum, t) => {
    return sum + t.quantity * (t.unitPrice || t.part?.price || 0);
  }, 0);
  const totalImportQty = importItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalUsageQty = usageTransactions.reduce((sum, t) => sum + t.quantity, 0);
  const grossProfit = totalUsageValue - totalImportCost;
  const grossMargin = totalUsageValue > 0 ? ((grossProfit / totalUsageValue) * 100).toFixed(1) : '0.0';

  // Top 10 xuất nhiều nhất
  const usageByPart = {};
  for (const t of usageTransactions) {
    const id = t.part?._id?.toString();
    if (!id) continue;
    if (!usageByPart[id]) usageByPart[id] = { partName: t.part.partName, brand: t.part.brand || '', quantity: 0, value: 0 };
    usageByPart[id].quantity += t.quantity;
    usageByPart[id].value += t.quantity * (t.unitPrice || t.part?.price || 0);
  }
  const topUsedParts = Object.values(usageByPart).sort((a, b) => b.quantity - a.quantity).slice(0, 10);

  // Top 10 nhập nhiều nhất
  const importByPartAgg = {};
  for (const i of importItems) {
    const id = i.product?._id?.toString();
    if (!id) continue;
    if (!importByPartAgg[id]) importByPartAgg[id] = { partName: i.product.partName, brand: i.product.brand || '', totalQty: 0, totalCost: 0, avgImportPrice: 0, sellPrice: i.product.price || 0 };
    importByPartAgg[id].totalQty += i.quantity;
    importByPartAgg[id].totalCost += i.quantity * i.importPrice;
  }
  for (const id of Object.keys(importByPartAgg)) {
    const r = importByPartAgg[id];
    r.avgImportPrice = r.totalQty > 0 ? r.totalCost / r.totalQty : 0;
  }
  const topImportedParts = Object.values(importByPartAgg).sort((a, b) => b.totalQty - a.totalQty).slice(0, 10);

  // Bảng chi tiết từng linh kiện (dùng all data để tính đúng)
  const importByPart = {};
  for (const i of allImportItems) {
    const id = i.product?._id?.toString();
    if (!id) continue;
    if (!importByPart[id]) importByPart[id] = { totalQty: 0, totalCost: 0, lastImportDate: null, supplierName: '' };
    importByPart[id].totalQty += i.quantity;
    importByPart[id].totalCost += i.quantity * i.importPrice;
    const date = i.order?.importedAt || i.createdAt;
    if (!importByPart[id].lastImportDate || date > importByPart[id].lastImportDate) {
      importByPart[id].lastImportDate = date;
      importByPart[id].supplierName = i.order?.supplier?.name || '';
    }
  }
  const usageByPartAll = {};
  for (const t of allUsageTransactions) {
    const id = t.part?._id?.toString();
    if (!id) continue;
    if (!usageByPartAll[id]) usageByPartAll[id] = { quantity: 0, value: 0 };
    usageByPartAll[id].quantity += t.quantity;
    usageByPartAll[id].value += t.quantity * (t.unitPrice || t.part?.price || 0);
  }

  const partDetails = parts.map((p) => {
    const id = p._id.toString();
    const imp = importByPart[id] || { totalQty: 0, totalCost: 0, lastImportDate: null, supplierName: '' };
    const used = usageByPartAll[id] || { quantity: 0, value: 0 };
    const avgImportPrice = imp.totalQty > 0 ? imp.totalCost / imp.totalQty : 0;
    const inventoryValue = p.stock * p.price;
    const turnoverRate = imp.totalQty > 0 ? ((used.quantity / imp.totalQty) * 100).toFixed(1) : '0.0';
    const profitMargin = used.value > 0 ? (((used.value - imp.totalCost) / used.value) * 100).toFixed(1) : '0.0';
    const stockStatus = p.stock <= 0 ? 'out' : p.stock <= p.minStock ? 'low' : 'healthy';
    return { _id: id, partName: p.partName, brand: p.brand || '', stock: p.stock, minStock: p.minStock, sellPrice: p.price, avgImportPrice, inventoryValue, totalImported: imp.totalQty, totalUsed: used.quantity, totalUsageValue: used.value, turnoverRate, profitMargin, stockStatus, lastImportDate: imp.lastImportDate, supplierName: imp.supplierName };
  });

  // Xác định khoảng tháng để vẽ chart (tối đa 12 tháng)
  const now = new Date();
  const chartMonths = 12;
  const monthlyImport = [];
  const monthlyUsage = [];
  const monthlyMargin = [];

  for (let i = chartMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${d.getMonth() + 1}/${d.getFullYear()}`;
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);

    const impFiltered = importItems.filter((item) => {
      const date = item.order?.importedAt || item.createdAt;
      return date >= d && date < nextMonth;
    });
    const usageFiltered = usageTransactions.filter((t) => t.createdAt >= d && t.createdAt < nextMonth);

    const cost = impFiltered.reduce((sum, item) => sum + item.quantity * item.importPrice, 0);
    const impQty = impFiltered.reduce((sum, item) => sum + item.quantity, 0);
    const impCount = new Set(impFiltered.map((i) => i.order?._id?.toString())).size;

    const value = usageFiltered.reduce((sum, t) => sum + t.quantity * (t.unitPrice || t.part?.price || 0), 0);
    const usageQty = usageFiltered.reduce((sum, t) => sum + t.quantity, 0);
    const usageCount = usageFiltered.length;

    const margin = value > 0 ? parseFloat(((value - cost) / value * 100).toFixed(1)) : 0;

    monthlyImport.push({ label, cost, qty: impQty, count: impCount });
    monthlyUsage.push({ label, value, qty: usageQty, count: usageCount });
    monthlyMargin.push({ label, margin });
  }

  const stockStatus = {
    healthy: parts.filter((p) => p.stock > p.minStock).length,
    low: parts.filter((p) => p.stock > 0 && p.stock <= p.minStock).length,
    out: parts.filter((p) => p.stock <= 0).length,
  };

  return {
    totalInventoryValue,
    totalImportCost,
    totalUsageValue,
    totalImportQty,
    totalUsageQty,
    grossProfit,
    grossMargin,
    topUsedParts,
    topImportedParts,
    monthlyImport,
    monthlyUsage,
    monthlyMargin,
    stockStatus,
    totalParts: parts.length,
    partDetails,
  };
}

module.exports = {
  listParts,
  createPart,
  updatePart,
  deletePart,
  importStock,
  listImportHistory,
  listUsageHistory,
  createStockAlert,
  listStockAlerts,
  getInventoryStats,
  importStockOrder,
  getInventoryKPI,
};
