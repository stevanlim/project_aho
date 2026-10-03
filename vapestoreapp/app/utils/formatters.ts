/**
 * Format number to Indonesian Rupiah currency
 */
export function formatRupiah(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return 'Rp 0';
  return 'Rp ' + num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Format number with dots separator (no currency prefix)
 */
export function formatNumber(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';
  return num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Format date to Indonesian locale (WIB)
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Format date with time
 */
export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes} WIB`;
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatYMD(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Get category label in Indonesian
 */
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    device: 'Device',
    liquid: 'Liquid',
    coil: 'Coil',
    catridge: 'Cartridge',
    other: 'Lainnya'
  };
  return labels[category] || category;
}

/**
 * Get payment method label
 */
export function getPaymentLabel(method: string): string {
  const labels: Record<string, string> = {
    Cash: 'Tunai',
    QRIS: 'QRIS',
    Transfer: 'Transfer',
    Other: 'Lainnya'
  };
  return labels[method] || method;
}
