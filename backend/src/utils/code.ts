// 单据编号生成工具

// 出入库类型编码
export const IO_TYPE_CODES = {
  in: 'RK',   // 入库
  out: 'CK',  // 出库
};

// 出入库业务类型编码
export const IO_CATEGORY_CODES: Record<string, { in: string; out: string }> = {
  purchase: { in: 'CGRK', out: '' },      // 采购入库
  return: { in: 'THRK', out: 'THCK' },     // 退货
  transfer: { in: 'DDRK', out: 'DDCK' },  // 调拨
  profit: { in: 'PYRK', out: '' },        // 盘盈
  loss: { in: '', out: 'PCK' },           // 盘亏
  sale: { in: '', out: 'XSCK' },          // 销售出库
  other: { in: 'QTRK', out: 'QTCK' },     // 其他
};

// 盘点编号前缀
export const STOCKTAKE_CODE_PREFIX = 'PD';

// 生成单据编号
export function generateIOCode(type: 'in' | 'out', category: string, date: Date = new Date()): string {
  const prefix = type === 'in' 
    ? (IO_CATEGORY_CODES[category]?.in || 'RK')
    : (IO_CATEGORY_CODES[category]?.out || 'CK');
  
  const dateStr = formatDate(date);
  const seq = Math.floor(Math.random() * 9000) + 1000; // 4位随机序列
  
  return `${prefix}${dateStr}${seq}`;
}

// 生成盘点编号
export function generateStocktakeCode(date: Date = new Date()): string {
  const dateStr = formatDate(date);
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `${STOCKTAKE_CODE_PREFIX}${dateStr}${seq}`;
}

// 格式化日期为 YYYYMMDD
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}
