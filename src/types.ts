export enum UserRole {
  ADMIN = 'ADMIN',
  COLLECTOR = 'COLLECTOR'
}

export enum ClientStatus {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  PENDING = 'PENDING'
}

export enum LoanStatus {
  ACTIVE = 'ACTIVE',
  PAID = 'PAID',
  RENEGOTIATED = 'RENEGOTIATED'
}

export enum PaymentType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY'
}

export enum InstallmentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  LATE = 'LATE'
}

export interface User {
  id: string | number;
  name: string;
  phone: string;
  login: string;
  role: UserRole;
}

export interface Client {
  id: number;
  name: string;
  cpf?: string;
  phone: string;
  address?: string;
  notes: string;
  score: number;
  status: ClientStatus;
  created_by: string | number;
  created_at: string;
  totalLoaned?: number;
  totalDebt?: number;
}

export interface Loan {
  id: number;
  client_id: number;
  capital: number;
  interest_rate: number;
  payment_type: PaymentType;
  installments_count: number;
  start_date: string;
  late_fee_enabled: boolean;
  late_fee_rate: number;
  status: LoanStatus;
  created_at: string;
}

export interface Installment {
  id: number;
  loan_id: number;
  number: number;
  amount: number;
  capital_amount: number;
  interest_amount: number;
  due_date: string;
  status: InstallmentStatus;
  paid_amount: number;
}

export interface Payment {
  id: number;
  installment_id: number;
  amount: number;
  date: string;
  type: 'FULL' | 'PARTIAL' | 'INTEREST';
  method: 'PIX' | 'CASH';
}

export interface DashboardData {
  today: {
    expected: number;
    paid: number;
    late: number;
  };
  overview: {
    totalEmprestado: number;
    totalRecebido: number;
    totalEmAberto: number;
    lucroProjetado: number;
    activeClients: number;
    lateClients: number;
    loanCount?: number;
  };
}
