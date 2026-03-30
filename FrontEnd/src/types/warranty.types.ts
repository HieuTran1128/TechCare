export interface WarrantyItem {
  _id: string;
  warrantyMonths: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  claimType?: 'STORE_FAULT' | 'CUSTOMER_FAULT';
  claimNote?: string;
  claimedAt?: string;
  claimedBy?: { fullName: string };
  part?: { partName: string; brand?: string };
  ticket?: {
    ticketCode: string;
    status?: string;
    isWarrantyClaim?: boolean;
    warrantyClaimType?: string;
    device?: {
      brand: string;
      model: string;
      deviceType: string;
      customer?: { fullName: string; phone: string; email?: string };
    };
  };
}
