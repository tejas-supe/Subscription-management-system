// Format paise to INR (₹)
export const formatINR = (paise: number = 0, showDecimals: boolean = false): string => {
  const rupees = paise / 100;
  if (isNaN(rupees)) return '₹0';

  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });

  return formatter.format(rupees);
};

// Format short date (e.g. 24 Oct 2025)
export const formatDate = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '—';

  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

// Format date and time
export const formatDateTime = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '—';

  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// Color palettes for badges
export const getStatusColor = (status: string = ''): { bg: string; text: string; dot: string; border: string } => {
  const s = status.toLowerCase();

  switch (s) {
    case 'active':
    case 'paid':
    case 'success':
    case 'healthy':
    case 'accepted':
    case 'converted':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-700',
        dot: 'bg-emerald-500',
        border: 'border-emerald-500/20'
      };

    case 'trial':
    case 'sent':
    case 'pending':
    case 'partially paid':
    case 'at risk':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-800',
        dot: 'bg-amber-500',
        border: 'border-amber-500/20'
      };

    case 'paused':
    case 'draft':
    case 'archived':
    case 'inactive':
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-700',
        dot: 'bg-slate-400',
        border: 'border-slate-500/20'
      };

    case 'past due':
    case 'overdue':
    case 'failed':
    case 'cancelled':
    case 'critical':
    case 'rejected':
    case 'void':
      return {
        bg: 'bg-rose-500/10',
        text: 'text-rose-700',
        dot: 'bg-rose-500',
        border: 'border-rose-500/20'
      };

    case 'refunded':
      return {
        bg: 'bg-indigo-500/10',
        text: 'text-indigo-700',
        dot: 'bg-indigo-500',
        border: 'border-indigo-500/20'
      };

    default:
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-700',
        dot: 'bg-slate-400',
        border: 'border-slate-500/20'
      };
  }
};
