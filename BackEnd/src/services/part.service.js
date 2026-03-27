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
};
