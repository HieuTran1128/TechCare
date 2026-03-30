// Shared types cho inventory domain

export interface Part {
  _id: string;
  partName: string;
  brand?: string;
  imageUrl: string;
  price: number;
  stock: number;
  minStock: number;
}

export interface Supplier {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  note?: string;
}

export interface ImportRecord {
  _id: string;
  quantity: number;
  importPrice: number;
  total: number;
  createdAt: string;
  product?: {
    _id?: string;
    partName?: string;
    brand?: string;
  };
  supplier?: {
    name?: string;
  };
  createdBy?: {
    fullName?: string;
    role?: string;
  };
  note?: string;
  batchCode?: string;
}

export interface UsageRecord {
  _id: string;
  quantity: number;
  unitPrice: number;
  total: number;
  createdAt: string;
  part?: {
    partName?: string;
    brand?: string;
  };
  ticket?: {
    ticketCode?: string;
  };
  createdBy?: {
    fullName?: string;
    role?: string;
  };
}

export interface StockAlert {
  _id: string;
  message: string;
  createdAt: string;
  part?: {
    partName?: string;
    brand?: string;
    stock?: number;
    minStock?: number;
    imageUrl?: string;
  };
  createdBy?: {
    fullName?: string;
    role?: string;
  };
}

export interface InventoryStats {
  totalParts: number;
  totalQuantity: number;
  lowStock: number;
  outOfStock: number;
}

export interface InventoryRequestItem {
  part?: { _id?: string; partName?: string; brand?: string; price?: number };
  quantity?: number;
  unitPrice?: number;
}

export interface InventoryRequest {
  _id: string;
  ticketCode?: string;
  createdAt?: string;
  statusHistory?: Array<{ status?: string; changedBy?: { _id?: string; fullName?: string; role?: string } }>;
  inventoryRequest?: {
    status?: string;
    noteFromTechnician?: string;
    noteFromStorekeeper?: string;
    requiredParts?: InventoryRequestItem[];
    requestedBy?: { _id?: string; fullName?: string };
  };
  technician?: { _id?: string; fullName?: string };
  device?: { brand?: string; model?: string; deviceType?: string; customer?: { fullName?: string } };
}

export interface InventoryKPI {
  totalInventoryValue: number;
  totalImportCost: number;
  totalUsageValue: number;
  totalImportQty: number;
  totalUsageQty: number;
  grossProfit: number;
  grossMargin: string;
  topUsedParts: {
    partName: string;
    brand?: string;
    quantity: number;
    value: number;
  }[];
  topImportedParts: {
    partName: string;
    brand?: string;
    totalQty: number;
    totalCost: number;
    avgImportPrice: number;
    sellPrice: number;
  }[];
  monthlyImport: {
    label: string;
    cost: number;
    qty: number;
    count: number;
  }[];
  monthlyUsage: {
    label: string;
    value: number;
    qty: number;
    count: number;
  }[];
  monthlyMargin: {
    label: string;
    margin: number;
  }[];
  stockStatus: {
    healthy: number;
    low: number;
    out: number;
  };
  totalParts: number;
  partDetails: {
    _id: string;
    partName: string;
    brand: string;
    stock: number;
    minStock: number;
    sellPrice: number;
    avgImportPrice: number;
    inventoryValue: number;
    totalImported: number;
    totalUsed: number;
    totalUsageValue: number;
    turnoverRate: string;
    profitMargin: string;
    stockStatus: 'healthy' | 'low' | 'out';
    lastImportDate: string | null;
    supplierName: string;
  }[];
}
