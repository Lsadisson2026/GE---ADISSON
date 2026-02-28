import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE':
    case 'PAID':
      return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    case 'PENDING':
      return 'text-amber-600 bg-amber-50 border-amber-100';
    case 'BLOCKED':
    case 'LATE':
      return 'text-rose-600 bg-rose-50 border-rose-100';
    default:
      return 'text-slate-600 bg-slate-50 border-slate-100';
  }
};
