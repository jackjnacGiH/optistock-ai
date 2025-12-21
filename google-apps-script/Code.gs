/* ==========================================================================
   OPTISTOCK AI - SMART ROW MAPPING
   ========================================================================== */

const SCRIPT_PROP = PropertiesService.getScriptProperties();
const SHEET_NAMES = {
  INVENTORY: 'Inventory',
  HISTORY: 'Transaction_History',
  REPORTS: 'Reports'
};

// --- 1. Dynamic Column Mapping ---
function getColumnMap(sheet, type = 'INVENTORY') {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  
  headers.forEach((h, index) => {
    const key = String(h).toLowerCase().trim().replace(/_/g, ''); // ลบ _ ออกเพื่อให้เทียบง่ายขึ้น
    
    // Inventory Mapping
    if (type === 'INVENTORY') {
      if (['barcode', 'รหัส'].some(k => key.includes(k))) map.barcode = index;
      else if (['name', 'ชื่อ', 'สินค้า'].some(k => key.includes(k)) && !key.includes('user')) map.name = index; // กัน User_ID
      else if (['stock', 'qty', 'จำนวน', 'คงเหลือ'].some(k => key.includes(k)) && !key.includes('min') && !key.includes('prev') && !key.includes('new')) map.stock = index;
      else if (['price', 'ราคา'].some(k => key.includes(k))) map.price = index;
      else if (['min', 'ขั้นต่ำ'].some(k => key.includes(k))) map.minStock = index;
      else if (['category', 'หมวด'].some(k => key.includes(k))) map.category = index;
      else if (['unit', 'หน่วย'].some(k => key.includes(k))) map.unit = index;
      else if (['image', 'รูป', 'url'].some(k => key.includes(k))) map.imageUrl = index;
      else if (['shelf', 'เชลฟ์', 'ชั้น'].some(k => key.includes(k))) map.shelf = index;
      else if (['row', 'แถว'].some(k => key.includes(k))) map.row = index;
      else if (['update', 'ปรับปรุง'].some(k => key.includes(k))) map.lastUpdated = index;
    } 
    // History Mapping (ตามภาพที่คุณส่งมา)
    
    // History Mapping (ตามภาพที่คุณส่งมา)
    else if (type === 'HISTORY') {
      if (key.includes('time') || key.includes('date') || key.includes('เวลา')) map.timestamp = index;
      else if (key.includes('barcode') || key.includes('รหัส')) map.barcode = index;
      else if (key.includes('product') || key.includes('name') || key.includes('ชื่อ')) map.name = index; // Product_Name
      else if (key.includes('type') || key.includes('ประเภท')) map.type = index;
      else if (key.includes('amount') || key.includes('qty') || key.includes('จำนวน')) map.amount = index;
      else if (key.includes('prev') || key.includes('ก่อน')) map.prevStock = index; // Previous_Stock
      else if (key.includes('new') || key.includes('ใหม่') || key.includes('คงเหลือ')) map.newStock = index; // New_Stock
      else if (key.includes('user') || key.includes('ผู้ทำ')) map.user = index; // User_ID
      else if (key.includes('image') || key.includes('url')) map.image = index; // Image_URL
    }
    // Reports Mapping
    else if (type === 'REPORTS') {
      if (key.includes('date') || key.includes('วัน')) map.date = index;
      else if (key.includes('total_products') || key.includes('product') || key.includes('จำนวน')) map.totalProducts = index;
      else if (key.includes('total_value') || key.includes('value') || key.includes('มูลค่า')) map.totalValue = index;
      else if (key.includes('low_stock') || key.includes('low') || key.includes('ใกล้หมด')) map.lowStock = index;
      else if (key.includes('note') || key.includes('หมายเหตุ')) map.notes = index;
    }
  });

  map.maxColumn = headers.length;
  // console.log(`Map for ${type}:`, map);
  return map;
}

// --- 2. Smart Row Builder ---
function buildRowArray(map, data) {
  const row = new Array(map.maxColumn).fill(''); // สร้าง Array ว่างตามจำนวนคอลัมน์
  
  // ใส่ข้อมูลลงให้ตรงล็อก
  if (map.timestamp !== undefined) row[map.timestamp] = data.timestamp || new Date();
  if (map.barcode !== undefined) row[map.barcode] = "'" + data.barcode; // ใส่ ' นำหน้ากันเป็น Scientific notation
  if (map.name !== undefined) row[map.name] = data.name;
  if (map.type !== undefined) row[map.type] = data.type;
  if (map.stock !== undefined) row[map.stock] = data.stock;
  if (map.amount !== undefined) row[map.amount] = data.amount;
  if (map.price !== undefined) row[map.price] = data.price;
  if (map.category !== undefined) row[map.category] = data.category;
  if (map.unit !== undefined) row[map.unit] = data.unit;
  if (map.minStock !== undefined) row[map.minStock] = data.minStock;
  if (map.prevStock !== undefined) row[map.prevStock] = data.prevStock;
  if (map.newStock !== undefined) row[map.newStock] = data.newStock;
  if (map.user !== undefined) row[map.user] = data.user;
  if (map.image !== undefined) row[map.image] = data.image; // For History
  if (map.imageUrl !== undefined) row[map.imageUrl] = data.imageUrl; // For Inventory
  if (map.shelf !== undefined) row[map.shelf] = data.shelf;
  if (map.row !== undefined) row[map.row] = data.row;
  if (map.lastUpdated !== undefined) row[map.lastUpdated] = new Date();

  // Reports Fields
  if (map.date !== undefined) row[map.date] = data.date || new Date();
  if (map.totalProducts !== undefined) row[map.totalProducts] = data.totalProducts;
  if (map.totalValue !== undefined) row[map.totalValue] = data.totalValue;
  if (map.lowStock !== undefined) row[map.lowStock] = data.lowStock;
  if (map.notes !== undefined) row[map.notes] = data.notes;

  return row;
}

// --- 3. Main API Handlers ---
function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    const action = e.parameter.action;
    switch (action) {
      case 'getInventory': return jsonResponse(getInventory());
      case 'getHistory': return jsonResponse(getHistory(e.parameter.startDate));
      case 'updateStock': return jsonResponse(updateStock(e.parameter.barcode, parseInt(e.parameter.amount), e.parameter.type));
      case 'addProduct': return jsonResponse(addProduct(JSON.parse(e.parameter.productData)));
      case 'bulkUpdateMinStock': return jsonResponse(bulkUpdateMinStock(JSON.parse(e.parameter.updates)));
      case 'saveReport': return jsonResponse(generateReport(e.parameter.note));
      case 'clearHistory': return jsonResponse(clearHistory());
      case 'debug': return jsonResponse({ success: true, message: 'Backend v2.2 (Date Filter) Ready!' });
      default: return jsonResponse({ success: false, error: 'Invalid action' });
    }
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

// ... Logic Functions ...

// Updated getHistory to support startDate filtering
function getHistory(startDateStr = null) {
  const sheet = getOrCreateSheet(SHEET_NAMES.HISTORY);
  const data = sheet.getDataRange().getValues();
  data.shift(); // Remove header
  if (data.length === 0) return [];
  
  const map = getColumnMap(sheet, 'HISTORY');
  
  let filteredData = data;

  // Filter by Date if provided
  if (startDateStr) {
      const startDate = new Date(startDateStr);
      // Reset time portion to start of day
      startDate.setHours(0,0,0,0);
      
      filteredData = data.filter(row => {
          const rowDate = new Date(row[map.timestamp]);
          return rowDate >= startDate;
      });
  } else {
      // Default behavior: Last 500 items if no date specified (Increased from 200)
      filteredData = data.slice(-500);
  }
  
  return filteredData.reverse().map(row => ({
    timestamp: map.timestamp !== undefined ? row[map.timestamp] : '',
    type: map.type !== undefined ? row[map.type] : '',
    barcode: map.barcode !== undefined ? row[map.barcode] : '',
    productName: map.name !== undefined ? row[map.name] : '', 
    name: map.name !== undefined ? row[map.name] : '', // Fallback
    amount: map.amount !== undefined ? row[map.amount] : 0,
    userId: map.user !== undefined ? row[map.user] : '',
    prevStock: map.prevStock !== undefined ? row[map.prevStock] : 0,
    newStock: map.newStock !== undefined ? row[map.newStock] : 0
  }));
}

// --- 4. Logic Functions (Updated) ---

function clearHistory() {
  const sheet = getOrCreateSheet(SHEET_NAMES.HISTORY);
  const lastRow = sheet.getLastRow();
  
  if (lastRow > 1) {
    // Clear content from row 2 to the last row, keeping the header (row 1)
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
    return { success: true, message: 'History cleared success' };
  } else {
    return { success: true, message: 'History is already empty' };
  }
}

function generateReport(note = '') {
  const invSheet = getOrCreateSheet(SHEET_NAMES.INVENTORY);
  const repSheet = getOrCreateSheet(SHEET_NAMES.REPORTS);
  
  // 1. Compute Stats
  const data = invSheet.getDataRange().getValues();
  const invMap = getColumnMap(invSheet, 'INVENTORY');
  data.shift(); // Remove header row
  
  let totalProducts = 0;
  let totalValue = 0;
  let lowStockCount = 0;
  
  data.forEach(row => {
      // Must have barcode to count
      if (!row[invMap.barcode]) return; 
      
      const stock = parseInt(row[invMap.stock] || 0);
      const price = parseFloat(row[invMap.price] || 0);
      const min = parseInt(row[invMap.minStock] || 0);
      
      totalProducts++;
      totalValue += (stock * price);
      if (stock <= min) lowStockCount++;
  });
  
  // 2. Prepare Data Row
  const repMap = getColumnMap(repSheet, 'REPORTS');
  const reportData = {
      date: new Date(),
      totalProducts: totalProducts,
      totalValue: totalValue,
      lowStock: lowStockCount,
      notes: note || 'Auto-generated'
  };
  
  // 3. Write to Sheet
  const rowArray = buildRowArray(repMap, reportData);
  repSheet.appendRow(rowArray);
  
  return { success: true, message: 'Daily report saved successfully' };
}

// ... (Existing getInventory, getHistory functions remain the same) ...

function generateReport(note = '') {
  const invSheet = getOrCreateSheet(SHEET_NAMES.INVENTORY);
  const repSheet = getOrCreateSheet(SHEET_NAMES.REPORTS);
  
  // 1. Compute Stats
  const data = invSheet.getDataRange().getValues();
  const invMap = getColumnMap(invSheet, 'INVENTORY');
  data.shift(); // Remove header row
  
  let totalProducts = 0;
  let totalValue = 0;
  let lowStockCount = 0;
  
  data.forEach(row => {
      // Must have barcode to count
      if (!row[invMap.barcode]) return; 
      
      const stock = parseInt(row[invMap.stock] || 0);
      const price = parseFloat(row[invMap.price] || 0);
      const min = parseInt(row[invMap.minStock] || 0);
      
      totalProducts++;
      totalValue += (stock * price);
      if (stock <= min) lowStockCount++;
  });
  
  // 2. Prepare Data Row
  const repMap = getColumnMap(repSheet, 'REPORTS');
  const reportData = {
      date: new Date(),
      totalProducts: totalProducts,
      totalValue: totalValue,
      lowStock: lowStockCount,
      notes: note
  };
  
  // 3. Write to Sheet
  const rowArray = buildRowArray(repMap, reportData);
  repSheet.appendRow(rowArray);
  
  return { success: true, message: 'Daily report saved successfully' };
}
// --- 4. Logic Functions (Updated) ---

function getInventory() {
  const sheet = getOrCreateSheet(SHEET_NAMES.INVENTORY);
  const data = sheet.getDataRange().getValues();
  data.shift(); 
  const map = getColumnMap(sheet, 'INVENTORY');
  
  return data.map(row => ({
    barcode: row[map.barcode],
    name: row[map.name],
    stock: map.stock !== undefined ? (row[map.stock] === "" ? 0 : row[map.stock]) : 0, 
    price: map.price !== undefined ? row[map.price] : 0,
    category: map.category !== undefined ? row[map.category] : '',
    unit: map.unit !== undefined ? row[map.unit] : '',
    minStock: map.minStock !== undefined ? row[map.minStock] : 0,
    imageUrl: map.imageUrl !== undefined ? row[map.imageUrl] : '',
    lastUpdated: map.lastUpdated !== undefined ? row[map.lastUpdated] : '',
    shelf: map.shelf !== undefined ? row[map.shelf] : '',
    row: map.row !== undefined ? row[map.row] : ''
  }));
}

function getHistory() {
  const sheet = getOrCreateSheet(SHEET_NAMES.HISTORY);
  const data = sheet.getDataRange().getValues();
  data.shift();
  if (data.length === 0) return [];
  
  const map = getColumnMap(sheet, 'HISTORY');
  
  return data.reverse().slice(0, 200).map(row => ({
    timestamp: map.timestamp !== undefined ? row[map.timestamp] : '',
    type: map.type !== undefined ? row[map.type] : '',
    barcode: map.barcode !== undefined ? row[map.barcode] : '',
    productName: map.name !== undefined ? row[map.name] : '', 
    name: map.name !== undefined ? row[map.name] : '', // Fallback
    amount: map.amount !== undefined ? row[map.amount] : 0,
    userId: map.user !== undefined ? row[map.user] : '',
    prevStock: map.prevStock !== undefined ? row[map.prevStock] : 0,
    newStock: map.newStock !== undefined ? row[map.newStock] : 0
  }));
}

function updateStock(barcode, amount, type) {
  const sheet = getOrCreateSheet(SHEET_NAMES.INVENTORY);
  const data = sheet.getDataRange().getValues();
  const map = getColumnMap(sheet, 'INVENTORY');
  
  let rowIndex = -1;
  let currentStock = 0;
  let productName = '';
  let imageUrl = '';

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][map.barcode]) === String(barcode)) {
      rowIndex = i + 1;
      currentStock = parseInt(data[i][map.stock] || 0);
      productName = data[i][map.name];
      imageUrl = map.imageUrl !== undefined ? data[i][map.imageUrl] : '';
      break;
    }
  }

  if (rowIndex === -1) return { success: false, error: 'Product not found' };

  let newStock = currentStock;
  if (type === 'IN') newStock += amount;
  else if (type === 'OUT') newStock -= amount;

  // Update Inventory Sheet
  sheet.getRange(rowIndex, map.stock + 1).setValue(newStock);
  if (map.lastUpdated !== undefined) {
    sheet.getRange(rowIndex, map.lastUpdated + 1).setValue(new Date());
  }

  // Record History (ใช้ Smart Row Builder)
  const historySheet = getOrCreateSheet(SHEET_NAMES.HISTORY);
  const historyMap = getColumnMap(historySheet, 'HISTORY');
  
  const historyData = {
    timestamp: new Date(),
    barcode: barcode,
    name: productName,
    type: type,
    amount: amount,
    prevStock: currentStock,
    newStock: newStock,
    user: 'WebApp', // หรือรับจาก parameter userId
    image: imageUrl
  };

  const rowArray = buildRowArray(historyMap, historyData);
  historySheet.appendRow(rowArray);

  return { success: true, newStock: newStock, message: 'Stock updated' };
}

function addProduct(product) {
  const sheet = getOrCreateSheet(SHEET_NAMES.INVENTORY);
  const map = getColumnMap(sheet, 'INVENTORY');
  
  // สร้าง row ใหม่โดยใช้ Smart Builder
  const rowArray = buildRowArray(map, product);
  
  sheet.appendRow(rowArray);
  return { success: true, message: 'Product added' };
}

function bulkUpdateMinStock(updates) {
  const sheet = getOrCreateSheet(SHEET_NAMES.INVENTORY);
  const data = sheet.getDataRange().getValues();
  const map = getColumnMap(sheet, 'INVENTORY');
  
  if (map.minStock === undefined) return { success: false, error: 'Min Stock column not found' };

  const barcodeMap = {};
  for (let i = 1; i < data.length; i++) {
    barcodeMap[String(data[i][map.barcode])] = i + 1;
  }

  updates.forEach(u => {
    const row = barcodeMap[String(u.barcode)];
    if (row) {
      sheet.getRange(row, map.minStock + 1).setValue(u.minStock);
      if (map.lastUpdated !== undefined) sheet.getRange(row, map.lastUpdated + 1).setValue(new Date());
    }
  });
  
  return { success: true, message: 'Bulk update success' };
}

// --- Utils ---
function getOrCreateSheet(name) {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = doc.getSheetByName(name);
  if (!sheet) sheet = doc.insertSheet(name);
  return sheet;
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
