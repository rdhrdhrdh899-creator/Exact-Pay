export type TabType = 'upi' | 'bank';

export interface PaymentData {
  upiId: string;
  payeeName: string;
  amount: string;
  note: string;
  accountNo?: string;
  ifsc?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export interface QRTheme {
  id: string;
  name: string;
  bgGradient: string;
  textColor: string;
  qrColor: string;
  primaryColor: string;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
  provider: 'google' | 'phone' | 'multiple';
  defaultUpiId?: string;
  defaultPayeeName?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface SavedQRCode {
  id: string;
  userId: string;
  title: string;
  paymentData: PaymentData;
  type: TabType;
  createdAt: number;
}
