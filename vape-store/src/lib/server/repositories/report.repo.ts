import pool from '../db/index.js';
import type { RowDataPacket } from 'mysql2';
import type { DashboardStats } from '$lib/types/index.js';

export const ReportRepo = {
  async getDashboardStats(lowStockThreshold = 5): Promise<DashboardStats> {
    // 1. Today sales & revenue
    const [todayRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as count, 
        COALESCE(SUM(grand_total), 0) as revenue 
       FROM sales 
       WHERE DATE(created_at) = CURDATE() AND status = 'completed'`
    );

    // 2. This month sales & revenue
    const [monthRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as count, 
        COALESCE(SUM(grand_total), 0) as revenue 
       FROM sales 
       WHERE YEAR(created_at) = YEAR(CURDATE()) 
         AND MONTH(created_at) = MONTH(CURDATE()) 
         AND status = 'completed'`
    );

    // 3. Products stock status
    const [productRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN stock <= 0 THEN 1 ELSE 0 END) as out_of_stock,
        SUM(CASE WHEN stock > 0 AND stock <= ? THEN 1 ELSE 0 END) as low_stock
       FROM products 
       WHERE status = 'active'`,
      [lowStockThreshold]
    );

    return {
      todaySalesCount: Number(todayRows[0].count) || 0,
      todayRevenue: Number(todayRows[0].revenue) || 0,
      monthSalesCount: Number(monthRows[0].count) || 0,
      monthRevenue: Number(monthRows[0].revenue) || 0,
      totalProducts: Number(productRows[0].total) || 0,
      lowStockCount: Number(productRows[0].low_stock) || 0,
      outOfStockCount: Number(productRows[0].out_of_stock) || 0
    };
  },

  async getDailyChartData(days = 7): Promise<{ date: string; label: string; count: number; revenue: number }[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        DATE(created_at) as sale_date,
        COUNT(*) as count,
        COALESCE(SUM(grand_total), 0) as revenue
       FROM sales
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         AND status = 'completed'
       GROUP BY DATE(created_at)
       ORDER BY sale_date ASC`,
      [days - 1]
    );

    const result: { date: string; label: string; count: number; revenue: number }[] = [];
    const dateMap = new Map<string, { count: number; revenue: number }>();

    for (const r of rows) {
      // Format as YYYY-MM-DD
      const d = new Date(r.sale_date);
      const key = d.toISOString().slice(0, 10);
      dateMap.set(key, { count: Number(r.count), revenue: Number(r.revenue) });
    }

    // Fill all days
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      const val = dateMap.get(key) || { count: 0, revenue: 0 };
      result.push({
        date: key,
        label,
        count: val.count,
        revenue: val.revenue
      });
    }

    return result;
  },

  async getCategorySales(): Promise<{ category: string; total_quantity: number; total_revenue: number }[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        p.category,
        COALESCE(SUM(si.quantity), 0) as total_quantity,
        COALESCE(SUM(si.subtotal), 0) as total_revenue
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       JOIN sales s ON si.sale_id = s.id
       WHERE s.status = 'completed'
       GROUP BY p.category`
    );

    return rows.map((r) => ({
      category: r.category,
      total_quantity: Number(r.total_quantity),
      total_revenue: Number(r.total_revenue)
    }));
  },

  async getTopSellingProducts(limit = 5): Promise<{ id: number; name: string; category: string; quantity: number; revenue: number }[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        p.id,
        si.product_name as name,
        p.category,
        COALESCE(SUM(si.quantity), 0) as quantity,
        COALESCE(SUM(si.subtotal), 0) as revenue
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       JOIN sales s ON si.sale_id = s.id
       WHERE s.status = 'completed'
       GROUP BY p.id, si.product_name, p.category
       ORDER BY quantity DESC
       LIMIT ?`,
      [limit]
    );

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      quantity: Number(r.quantity),
      revenue: Number(r.revenue)
    }));
  },

  async getFinancialReport(startDate?: string, endDate?: string) {
    const conditions: string[] = ["s.status = 'completed'"];
    const params: (string | number)[] = [];

    if (startDate) {
      conditions.push('s.created_at >= ?');
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      conditions.push('s.created_at <= ?');
      params.push(`${endDate} 23:59:59`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // 1. Overview Totals & Payment Method Breakdown
    const [overviewRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(s.id) as total_transactions,
        COALESCE(SUM(s.grand_total), 0) as total_revenue,
        COALESCE(SUM(s.discount), 0) as total_discount,
        COALESCE(SUM(CASE WHEN s.payment_method = 'Cash' THEN s.grand_total ELSE 0 END), 0) as cash_total,
        COUNT(CASE WHEN s.payment_method = 'Cash' THEN 1 END) as cash_count,
        COALESCE(SUM(CASE WHEN s.payment_method = 'QRIS' THEN s.grand_total ELSE 0 END), 0) as qris_total,
        COUNT(CASE WHEN s.payment_method = 'QRIS' THEN 1 END) as qris_count,
        COALESCE(SUM(CASE WHEN s.payment_method = 'Transfer' THEN s.grand_total ELSE 0 END), 0) as transfer_total,
        COUNT(CASE WHEN s.payment_method = 'Transfer' THEN 1 END) as transfer_count,
        COALESCE(SUM(CASE WHEN s.payment_method = 'Other' THEN s.grand_total ELSE 0 END), 0) as other_total,
        COUNT(CASE WHEN s.payment_method = 'Other' THEN 1 END) as other_count
       FROM sales s
       ${whereClause}`,
      params
    );

    const [itemRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COALESCE(SUM(si.quantity), 0) as total_items_sold,
        COALESCE(SUM(si.quantity * si.purchase_price), 0) as total_cost
       FROM sales s
       JOIN sale_items si ON s.id = si.sale_id
       ${whereClause}`,
      params
    );

    const overview = overviewRows[0] || {};
    const itemData = itemRows[0] || {};

    const totalTransactions = Number(overview.total_transactions) || 0;
    const totalRevenue = Number(overview.total_revenue) || 0;
    const totalItemsSold = Number(itemData.total_items_sold) || 0;
    const totalCost = Number(itemData.total_cost) || 0;
    const grossProfit = totalRevenue - totalCost;

    const paymentBreakdown = {
      cash: { total: Number(overview.cash_total || 0), count: Number(overview.cash_count || 0) },
      qris: { total: Number(overview.qris_total || 0), count: Number(overview.qris_count || 0) },
      transfer: { total: Number(overview.transfer_total || 0), count: Number(overview.transfer_count || 0) },
      other: { total: Number(overview.other_total || 0), count: Number(overview.other_count || 0) }
    };

    // 2. Category Breakdown
    const [categoryRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        p.category,
        COALESCE(SUM(si.quantity), 0) as total_quantity,
        COALESCE(SUM(si.subtotal), 0) as total_revenue,
        COALESCE(SUM(si.quantity * si.purchase_price), 0) as total_cost
       FROM sales s
       JOIN sale_items si ON s.id = si.sale_id
       JOIN products p ON si.product_id = p.id
       ${whereClause}
       GROUP BY p.category`,
      params
    );

    const categoryBreakdown = categoryRows.map((r) => ({
      category: r.category,
      quantity: Number(r.total_quantity),
      revenue: Number(r.total_revenue),
      cost: Number(r.total_cost),
      profit: Number(r.total_revenue) - Number(r.total_cost)
    }));

    // 3. Top Products in Period
    const [topProductRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        si.product_name,
        p.category,
        COALESCE(SUM(si.quantity), 0) as total_quantity,
        COALESCE(SUM(si.subtotal), 0) as total_revenue,
        COALESCE(SUM(si.quantity * si.purchase_price), 0) as total_cost
       FROM sales s
       JOIN sale_items si ON s.id = si.sale_id
       JOIN products p ON si.product_id = p.id
       ${whereClause}
       GROUP BY si.product_name, p.category
       ORDER BY total_quantity DESC
       LIMIT 10`,
      params
    );

    const topProducts = topProductRows.map((r) => ({
      name: r.product_name,
      category: r.category,
      quantity: Number(r.total_quantity),
      revenue: Number(r.total_revenue),
      profit: Number(r.total_revenue) - Number(r.total_cost)
    }));

    return {
      totalTransactions,
      totalItemsSold,
      totalRevenue,
      totalCost,
      grossProfit,
      paymentBreakdown,
      categoryBreakdown,
      topProducts
    };
  },

  async getItemSalesLog(startDate?: string, endDate?: string) {
    const conditions: string[] = ["s.status = 'completed'"];
    const params: (string | number)[] = [];

    if (startDate) {
      conditions.push('s.created_at >= ?');
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      conditions.push('s.created_at <= ?');
      params.push(`${endDate} 23:59:59`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        si.id,
        si.product_name,
        p.category,
        si.quantity,
        si.unit_price,
        si.subtotal,
        s.invoice_number,
        s.payment_method,
        s.created_by,
        s.created_at
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       LEFT JOIN products p ON si.product_id = p.id
       ${whereClause}
       ORDER BY s.created_at DESC, si.id DESC`,
      params
    );

    return rows.map((r) => ({
      id: r.id,
      productName: r.product_name,
      category: r.category || 'other',
      quantity: Number(r.quantity),
      unitPrice: Number(r.unit_price),
      total: Number(r.subtotal),
      invoiceNumber: r.invoice_number,
      paymentMethod: r.payment_method,
      createdBy: r.created_by,
      createdAt: r.created_at
    }));
  },

  /**
   * Get daily revenue mutations grouped by date with optional cashier filter.
   * Used by the Mutasi Pendapatan page.
   */
  async getRevenueMutations(startDate?: string, endDate?: string, createdBy?: string): Promise<{
    daily: {
      date: string;
      label: string;
      transactionCount: number;
      totalRevenue: number;
      cashRevenue: number;
      cashCount: number;
      qrisRevenue: number;
      qrisCount: number;
      transferRevenue: number;
      transferCount: number;
      otherRevenue: number;
      otherCount: number;
      totalCost: number;
      profit: number;
    }[];
    periodPayment: {
      totalRevenue: number;
      totalTransactions: number;
      cashRevenue: number;
      cashCount: number;
      qrisRevenue: number;
      qrisCount: number;
      transferRevenue: number;
      transferCount: number;
      otherRevenue: number;
      otherCount: number;
    };
    summary: {
      todayRevenue: number;
      todayTransactions: number;
      todayCash: number;
      todayQris: number;
      todayTransfer: number;
      monthRevenue: number;
      monthTransactions: number;
      monthCash: number;
      monthQris: number;
      monthTransfer: number;
      yearRevenue: number;
      yearTransactions: number;
      yearCash: number;
      yearQris: number;
      yearTransfer: number;
    };
  }> {
    const conditions: string[] = ["s.status = 'completed'"];
    const params: (string | number)[] = [];

    if (createdBy) {
      conditions.push('s.created_by = ?');
      params.push(createdBy);
    }

    if (startDate) {
      conditions.push('s.created_at >= ?');
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      conditions.push('s.created_at <= ?');
      params.push(`${endDate} 23:59:59`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Daily aggregation with payment method breakdown and accurate item cost
    const [dailyRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        DATE(s.created_at) as sale_date,
        COUNT(s.id) as transaction_count,
        COALESCE(SUM(s.grand_total), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN s.payment_method = 'Cash' THEN s.grand_total ELSE 0 END), 0) as cash_revenue,
        COUNT(CASE WHEN s.payment_method = 'Cash' THEN 1 END) as cash_count,
        COALESCE(SUM(CASE WHEN s.payment_method = 'QRIS' THEN s.grand_total ELSE 0 END), 0) as qris_revenue,
        COUNT(CASE WHEN s.payment_method = 'QRIS' THEN 1 END) as qris_count,
        COALESCE(SUM(CASE WHEN s.payment_method = 'Transfer' THEN s.grand_total ELSE 0 END), 0) as transfer_revenue,
        COUNT(CASE WHEN s.payment_method = 'Transfer' THEN 1 END) as transfer_count,
        COALESCE(SUM(CASE WHEN s.payment_method = 'Other' THEN s.grand_total ELSE 0 END), 0) as other_revenue,
        COUNT(CASE WHEN s.payment_method = 'Other' THEN 1 END) as other_count,
        COALESCE(SUM(cost_table.item_cost), 0) as total_cost
       FROM sales s
       LEFT JOIN (
         SELECT sale_id, SUM(quantity * purchase_price) as item_cost
         FROM sale_items
         GROUP BY sale_id
       ) cost_table ON s.id = cost_table.sale_id
       ${whereClause}
       GROUP BY DATE(s.created_at)
       ORDER BY sale_date DESC`,
      params
    );

    const daily = dailyRows.map((r) => {
      const d = new Date(r.sale_date);
      const revenue = Number(r.total_revenue);
      const cost = Number(r.total_cost);
      return {
        date: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
        transactionCount: Number(r.transaction_count),
        totalRevenue: revenue,
        cashRevenue: Number(r.cash_revenue || 0),
        cashCount: Number(r.cash_count || 0),
        qrisRevenue: Number(r.qris_revenue || 0),
        qrisCount: Number(r.qris_count || 0),
        transferRevenue: Number(r.transfer_revenue || 0),
        transferCount: Number(r.transfer_count || 0),
        otherRevenue: Number(r.other_revenue || 0),
        otherCount: Number(r.other_count || 0),
        totalCost: cost,
        profit: revenue - cost
      };
    });

    // Summary stats: today, month, year, and selected period (filtered by createdBy if applicable)
    const summaryConditions: string[] = ["status = 'completed'"];
    const summaryParams: (string | number)[] = [];
    if (createdBy) {
      summaryConditions.push('created_by = ?');
      summaryParams.push(createdBy);
    }
    const summaryWhere = `WHERE ${summaryConditions.join(' AND ')}`;

    // Period Totals
    const [periodRow] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as cnt,
        COALESCE(SUM(grand_total), 0) as rev,
        COALESCE(SUM(CASE WHEN payment_method = 'Cash' THEN grand_total ELSE 0 END), 0) as cash_rev,
        COUNT(CASE WHEN payment_method = 'Cash' THEN 1 END) as cash_cnt,
        COALESCE(SUM(CASE WHEN payment_method = 'QRIS' THEN grand_total ELSE 0 END), 0) as qris_rev,
        COUNT(CASE WHEN payment_method = 'QRIS' THEN 1 END) as qris_cnt,
        COALESCE(SUM(CASE WHEN payment_method = 'Transfer' THEN grand_total ELSE 0 END), 0) as transfer_rev,
        COUNT(CASE WHEN payment_method = 'Transfer' THEN 1 END) as transfer_cnt,
        COALESCE(SUM(CASE WHEN payment_method = 'Other' THEN grand_total ELSE 0 END), 0) as other_rev,
        COUNT(CASE WHEN payment_method = 'Other' THEN 1 END) as other_cnt
       FROM sales s
       ${whereClause}`,
      params
    );

    const [todayRow] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as cnt, 
        COALESCE(SUM(grand_total), 0) as rev,
        COALESCE(SUM(CASE WHEN payment_method = 'Cash' THEN grand_total ELSE 0 END), 0) as cash_rev,
        COALESCE(SUM(CASE WHEN payment_method = 'QRIS' THEN grand_total ELSE 0 END), 0) as qris_rev,
        COALESCE(SUM(CASE WHEN payment_method = 'Transfer' THEN grand_total ELSE 0 END), 0) as transfer_rev
       FROM sales ${summaryWhere} AND DATE(created_at) = CURDATE()`,
      summaryParams
    );

    const [monthRow] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as cnt, 
        COALESCE(SUM(grand_total), 0) as rev,
        COALESCE(SUM(CASE WHEN payment_method = 'Cash' THEN grand_total ELSE 0 END), 0) as cash_rev,
        COALESCE(SUM(CASE WHEN payment_method = 'QRIS' THEN grand_total ELSE 0 END), 0) as qris_rev,
        COALESCE(SUM(CASE WHEN payment_method = 'Transfer' THEN grand_total ELSE 0 END), 0) as transfer_rev
       FROM sales ${summaryWhere} AND YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())`,
      summaryParams
    );

    const [yearRow] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as cnt, 
        COALESCE(SUM(grand_total), 0) as rev,
        COALESCE(SUM(CASE WHEN payment_method = 'Cash' THEN grand_total ELSE 0 END), 0) as cash_rev,
        COALESCE(SUM(CASE WHEN payment_method = 'QRIS' THEN grand_total ELSE 0 END), 0) as qris_rev,
        COALESCE(SUM(CASE WHEN payment_method = 'Transfer' THEN grand_total ELSE 0 END), 0) as transfer_rev
       FROM sales ${summaryWhere} AND YEAR(created_at) = YEAR(CURDATE())`,
      summaryParams
    );

    return {
      daily,
      periodPayment: {
        totalRevenue: Number(periodRow[0]?.rev || 0),
        totalTransactions: Number(periodRow[0]?.cnt || 0),
        cashRevenue: Number(periodRow[0]?.cash_rev || 0),
        cashCount: Number(periodRow[0]?.cash_cnt || 0),
        qrisRevenue: Number(periodRow[0]?.qris_rev || 0),
        qrisCount: Number(periodRow[0]?.qris_cnt || 0),
        transferRevenue: Number(periodRow[0]?.transfer_rev || 0),
        transferCount: Number(periodRow[0]?.transfer_cnt || 0),
        otherRevenue: Number(periodRow[0]?.other_rev || 0),
        otherCount: Number(periodRow[0]?.other_cnt || 0),
      },
      summary: {
        todayRevenue: Number(todayRow[0]?.rev || 0),
        todayTransactions: Number(todayRow[0]?.cnt || 0),
        todayCash: Number(todayRow[0]?.cash_rev || 0),
        todayQris: Number(todayRow[0]?.qris_rev || 0),
        todayTransfer: Number(todayRow[0]?.transfer_rev || 0),

        monthRevenue: Number(monthRow[0]?.rev || 0),
        monthTransactions: Number(monthRow[0]?.cnt || 0),
        monthCash: Number(monthRow[0]?.cash_rev || 0),
        monthQris: Number(monthRow[0]?.qris_rev || 0),
        monthTransfer: Number(monthRow[0]?.transfer_rev || 0),

        yearRevenue: Number(yearRow[0]?.rev || 0),
        yearTransactions: Number(yearRow[0]?.cnt || 0),
        yearCash: Number(yearRow[0]?.cash_rev || 0),
        yearQris: Number(yearRow[0]?.qris_rev || 0),
        yearTransfer: Number(yearRow[0]?.transfer_rev || 0),
      }
    };
  }
};

