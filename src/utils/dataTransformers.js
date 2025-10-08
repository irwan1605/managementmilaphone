// src/utils/dataTransformers.js - MODIFIED

export const GOOGLE_CONFIG = {
    // ... (tetap sama) ...
    sheetRanges: {
      // ... (range yang sudah ada) ...
      USERS: "Users!A:Z", // Range untuk data user
      DASHBOARD_TOKO: "DashboardToko!A:Z", // Range untuk data dashboard toko
      DASHBOARD_OVERALL: "DashboardOverall!A:Z", // Range untuk data dashboard umum
    },
  };
  
  // ... (SHEET_HEADERS yang sudah ada) ...
  export const SHEET_HEADERS = {
    PRODUCTS: ["id", "nama", "kategori", "harga", "stok", "updated_at"],
    SALES: ["id", "tanggal", "produk", "qty", "harga", "total", "toko_id", "user_id"],
    INVENTORY: ["id", "produk", "stok_awal", "stok_akhir", "tanggal", "toko_id"],
    // Tambahkan headers untuk Users dan Dashboard Toko
    USERS: ["id", "username", "email", "role", "toko"], // Sesuaikan dengan field di UserManagement
    DASHBOARD_TOKO: ["id", "tanggal", "kategori", "produk", "qty", "harga"], // Sesuaikan dengan data toko dummy
    DASHBOARD_OVERALL: ["id", "tanggal", "kategori", "produk", "qty", "harga", "toko_id"], // Sesuaikan jika ada data overall
  };
  
  /**
   * Mengubah array of objects menjadi string CSV.
   * @param {Array<Object>} data - Array objek data, misal: [{ nama: 'A', stok: 10 }]
   * @param {Array<string>} headers - Opsional, urutan header untuk CSV. Jika tidak ada, pakai key dari objek pertama.
   * @returns {string} String format CSV
   */
  export const convertArrayOfObjectsToCSV = (data, headers = null) => {
    if (!data || data.length === 0) return '';
  
    const finalHeaders = headers || Object.keys(data[0]);
    const csvRows = [];
  
    // Header row
    csvRows.push(finalHeaders.join(','));
  
    // Data rows
    data.forEach(row => {
      const values = finalHeaders.map(header => {
        let value = row[header] ?? ''; // Handle undefined/null
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          value = `"${value.replace(/"/g, '""')}"`; // Escape double quotes and wrap in quotes
        }
        return value;
      });
      csvRows.push(values.join(','));
    });
  
    return csvRows.join('\n');
  };
  
  /**
   * Mengubah string CSV menjadi array of objects.
   * @param {string} csv - String format CSV
   * @returns {Array<Object>} Array objek data
   */
  export const convertCSVToArrayOfObjects = (csv) => {
    if (!csv) return [];
  
    const lines = csv.split('\n').filter(line => line.trim() !== ''); // Filter baris kosong
    if (lines.length === 0) return [];
  
    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const result = [];
  
    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i];
      if (!currentLine.trim()) continue; // Skip empty lines
  
      // Menggunakan regex yang lebih robust untuk parsing CSV sederhana
      const values = currentLine.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g); 
      if (!values) continue;
  
      let obj = {};
      headers.forEach((header, j) => {
        let value = values[j] ? values[j].trim().replace(/^"|"$/g, '') : '';
        // Coba konversi tipe data dasar
        if (!isNaN(Number(value)) && !isNaN(parseFloat(value))) { // Cek apakah bisa jadi angka
          obj[header] = Number(value);
        } else if (value.toLowerCase() === 'true') {
          obj[header] = true;
        } else if (value.toLowerCase() === 'false') {
          obj[header] = false;
        } else {
          obj[header] = value;
        }
      });
      result.push(obj);
    }
  
    return result;
  };
  
  
  /**
   * Format data untuk Google Sheets (2D array).
   * Baris pertama adalah header.
   * @param {Array<Object>} data - Array objek data
   * @param {Array<string>} headers - Opsional, urutan header. Jika tidak, ambil dari keys objek pertama.
   * @returns {Array<Array<any>>} Array 2D yang siap untuk Google Sheets
   */
  export const formatForSheets = (data, headers = null) => {
    if (!data || data.length === 0) return [['No data available']];
  
    const finalHeaders = headers || Object.keys(data[0]);
    const sheetData = [finalHeaders]; // Baris pertama adalah header
  
    data.forEach(item => {
      const row = finalHeaders.map(header => item[header] ?? ''); // Ambil nilai atau string kosong jika undefined/null
      sheetData.push(row);
    });
  
    return sheetData;
  };
  
  /**
   * Mengonversi tanggal ke format ISO string (YYYY-MM-DD)
   * @param {Date | string} date - Objek Date atau string tanggal
   * @returns {string} Format YYYY-MM-DD
   */
  export const toYYYYMMDD = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };