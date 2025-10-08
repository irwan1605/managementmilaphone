// src/components/DataManager/DataManager.jsx - MODIFIED
import React, { useState, useEffect } from 'react';
import { useGoogleSheets } from '../../hooks/useGoogleSheets';
import { useGoogleDrive } from '../../hooks/useGoogleDrive';
import { useAuth } from '../GoogleAuth/AuthContext';
import GoogleAuth from '../GoogleAuth/GoogleAuth';
import { 
  convertArrayOfObjectsToCSV, 
  formatForSheets,
  SHEET_HEADERS // Import SHEET_HEADERS
} from '../../utils/dataTransformers';
import './DataManager.css';

const DataManager = ({ 
  appData = [], 
  setAppData, 
  dataType = 'products', // 'products', 'sales', 'inventory', 'stock', 'users', 'dashboard_toko', 'dashboard_overall'
  tokoId = null,
  allowedActions = ['export', 'import', 'backup', 'restore']
}) => {
  const { isAuthenticated, userProfile } = useAuth();
  const { 
    data: sheetData, // Ini adalah data mentah dari sheet jika di-fetch secara otomatis
    loading: sheetsLoading, 
    error: sheetsError, 
    exportDataToSheet, 
    importDataFromSheet,
    lastUpdated 
  } = useGoogleSheets();
  
  const { 
    driveLoading, 
    driveError, 
    backupAppDataToDrive, 
    restoreAppDataFromDrive,
    uploadedFiles,
    listDriveFiles // Tambahkan listDriveFiles
  } = useGoogleDrive();

  const [localData, setLocalData] = useState(appData);
  const [selectedFileId, setSelectedFileId] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [showFiles, setShowFiles] = useState(false);
  const [availableBackupFiles, setAvailableBackupFiles] = useState([]); // Untuk menyimpan daftar file backup

  // Sync local data with appData prop
  useEffect(() => {
    setLocalData(appData);
  }, [appData]);

  // Load daftar file backup saat komponen mount atau user auth berubah
  useEffect(() => {
    const fetchBackupFiles = async () => {
      if (isAuthenticated) {
        // Filter file backup berdasarkan dataType dan tokoId
        const query = `name contains 'backup_${dataType}' ${tokoId ? `and name contains '_${tokoId}_'` : ''} and mimeType = 'text/csv'`;
        const files = await listDriveFiles(null, query);
        setAvailableBackupFiles(files);
      }
    };
    fetchBackupFiles();
  }, [isAuthenticated, dataType, tokoId, listDriveFiles]);


  // Handle export to Google Sheets
  const handleExportToSheets = async () => {
    if (!isAuthenticated) {
      setStatusMessage('⚠️ Silakan login dengan Google terlebih dahulu.');
      return;
    }

    if (localData.length === 0) {
      setStatusMessage('⚠️ Tidak ada data untuk diexport.');
      return;
    }

    setStatusMessage('📤 Menghubungkan ke Google Sheets...');
    
    try {
      const sheetName = getSheetName(dataType, tokoId);
      const headers = getHeadersForType(dataType);
      const success = await exportDataToSheet(localData, sheetName, headers);
      
      if (success) {
        setStatusMessage(`✅ Data berhasil diexport ke ${sheetName}!`);
        // Update parent app data if needed
        if (setAppData) {
          setAppData(localData);
        }
      } else {
        setStatusMessage('❌ Gagal export ke Google Sheets.');
      }
    } catch (error) {
      setStatusMessage(`❌ Error: ${error.message}`);
      console.error('Export error:', error);
    }
  };

  // Handle import from Google Sheets
  const handleImportFromSheets = async () => {
    if (!isAuthenticated) {
      setStatusMessage('⚠️ Silakan login dengan Google terlebih dahulu.');
      return;
    }

    setStatusMessage('📥 Mengimpor data dari Google Sheets...');
    
    try {
      const sheetName = getSheetName(dataType, tokoId);
      const headers = getHeadersForType(dataType);
      const importedData = await importDataFromSheet(`${sheetName}!A:Z`, headers);
      
      if (importedData && importedData.length > 0) {
        setLocalData(importedData);
        if (setAppData) {
          setAppData(importedData);
        }
        setStatusMessage(`✅ Berhasil mengimpor ${importedData.length} record dari ${sheetName}.`);
      } else {
        setStatusMessage('⚠️ Tidak ada data di Google Sheets.');
      }
    } catch (error) {
      setStatusMessage(`❌ Error: ${error.message}`);
      console.error('Import error:', error);
    }
  };

  // Handle backup to Google Drive
  const handleBackupToDrive = async () => {
    if (!isAuthenticated) {
      setStatusMessage('⚠️ Silakan login dengan Google terlebih dahulu.');
      return;
    }

    if (localData.length === 0) {
      setStatusMessage('⚠️ Tidak ada data untuk backup.');
      return;
    }

    setStatusMessage('💾 Membuat backup ke Google Drive...');
    
    try {
      const fileName = `backup_${dataType}${tokoId ? `_${tokoId}` : ''}_${new Date().toISOString().slice(0, 10)}`;
      const backupFile = await backupAppDataToDrive(localData, fileName);
      
      if (backupFile) {
        setStatusMessage(`✅ Backup berhasil! File ID: ${backupFile.id}`);
        // Refresh daftar file backup
        const query = `name contains 'backup_${dataType}' ${tokoId ? `and name contains '_${tokoId}_'` : ''} and mimeType = 'text/csv'`;
        const files = await listDriveFiles(null, query);
        setAvailableBackupFiles(files);
      } else {
        setStatusMessage('❌ Gagal membuat backup.');
      }
    } catch (error) {
      setStatusMessage(`❌ Error: ${error.message}`);
      console.error('Backup error:', error);
    }
  };

  // Handle restore from Google Drive
  const handleRestoreFromDrive = async () => {
    if (!selectedFileId) {
      setStatusMessage('⚠️ Pilih file backup terlebih dahulu.');
      return;
    }

    if (!isAuthenticated) {
      setStatusMessage('⚠️ Silakan login dengan Google terlebih dahulu.');
      return;
    }

    setStatusMessage('🔄 Memulihkan data dari backup...');
    
    try {
      const restoredData = await restoreAppDataFromDrive(selectedFileId);
      
      if (restoredData && restoredData.length > 0) {
        setLocalData(restoredData);
        if (setAppData) {
          setAppData(restoredData);
        }
        setStatusMessage(`✅ Data berhasil dipulihkan! ${restoredData.length} record.`);
      } else {
        setStatusMessage('⚠️ File backup kosong atau tidak valid.');
      }
    } catch (error) {
      setStatusMessage(`❌ Error: ${error.message}`);
      console.error('Restore error:', error);
    }
  };

  // Get appropriate sheet name based on data type and toko
  const getSheetName = (type, toko) => {
    let name;
    switch (type) {
      case 'products': name = 'Products'; break;
      case 'sales': name = 'Sales'; break;
      case 'inventory': name = 'Inventory'; break;
      case 'stock_accessories': name = 'StockAccessories'; break;
      case 'stock_handphone': name = 'StockHandphone'; break;
      case 'stock_motor': name = 'StockMotorListrik'; break;
      case 'users': name = 'Users'; break; // Untuk manajemen user
      case 'dashboard_toko': name = 'DashboardToko'; break; // Untuk data per toko
      case 'dashboard_overall': name = 'DashboardOverall'; break; // Untuk data umum
      default: name = 'Data'; break;
    }
    return tokoId ? `${name}_Toko${tokoId}` : name; // Naming convention: e.g., Products_Toko1
  };

  // Get headers for specific data type
  const getHeadersForType = (type) => {
    switch (type) {
      case 'products': return SHEET_HEADERS.PRODUCTS;
      case 'sales': return SHEET_HEADERS.SALES;
      case 'inventory': return SHEET_HEADERS.INVENTORY;
      case 'stock_accessories': return SHEET_HEADERS.STOCK_ACCESSORIES;
      case 'stock_handphone': return SHEET_HEADERS.STOCK_HANDPHONE;
      case 'stock_motor': return SHEET_HEADERS.STOCK_MOTOR;
      case 'users': return SHEET_HEADERS.USERS;
      case 'dashboard_toko': return SHEET_HEADERS.DASHBOARD_TOKO;
      case 'dashboard_overall': return SHEET_HEADERS.DASHBOARD_OVERALL;
      default: return Object.keys(localData[0] || {}); // Fallback ke keys objek pertama
    }
  };

  // Render data preview
  const renderDataPreview = () => {
    if (sheetsLoading || driveLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading...</span>
        </div>
      );
    }

    if (localData.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>Tidak ada data untuk ditampilkan</p>
          <p className="text-sm">Gunakan tombol import atau export untuk mengelola data</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {Object.keys(localData[0] || {}).map((key) => (
                <th key={key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {localData.slice(0, 5).map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {Object.values(item).map((value, i) => (
                  <td key={i} className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value)}
                  </td>
                ))}
              </tr>
            ))}
            {localData.length > 5 && (
              <tr>
                <td colSpan={Object.keys(localData[0] || {}).length} className="px-4 py-2 text-center text-sm text-gray-500">
                  ... {localData.length - 5} baris lainnya
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // Render status message
  const renderStatus = () => {
    if (!statusMessage) return null;
    return (
      <div className={`status-message ${
        statusMessage.includes('❌') ? 'bg-red-50 border border-red-200 text-red-800' :
        statusMessage.includes('⚠️') ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' :
        'bg-blue-50 border border-blue-200 text-blue-800'
      } mb-4`}>
        {statusMessage}
      </div>
    );
  };

  // Render Google auth status
  const renderAuthStatus = () => {
    if (!isAuthenticated) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-md mb-6 flex flex-col sm:flex-row items-center justify-between">
          <div>
            <p className="font-medium">
              Autentikasi Google Dibutuhkan
            </p>
            <p className="text-sm">
              Login dengan Google untuk mengaktifkan fitur export, import, dan backup data.
            </p>
          </div>
          <GoogleAuth className="mt-4 sm:mt-0 ml-auto" />
        </div>
      );
    } else {
      return (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md mb-6 flex flex-col sm:flex-row items-center justify-between">
          <div>
            <p className="font-medium">
              ✅ Terhubung ke Google ({userProfile?.name})
            </p>
            {lastUpdated && (
              <p className="text-sm text-green-700">
                Terakhir disinkron: {lastUpdated.toLocaleString('id-ID')}
              </p>
            )}
          </div>
          <GoogleAuth className="mt-4 sm:mt-0 ml-4" />
        </div>
      );
    }
  };

  return (
    <div className="data-manager p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Pengelolaan Data - {getSheetName(dataType, tokoId)}
        </h2>
        <p className="text-gray-600">
          Export, import, dan backup data {dataType} ke Google Sheets & Drive
        </p>
      </div>

      {/* Auth Status */}
      {renderAuthStatus()}

      {/* Status Messages */}
      {renderStatus()}

      {/* Action Buttons */}
      {isAuthenticated && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {allowedActions.includes('export') && (
            <button
              onClick={handleExportToSheets}
              disabled={sheetsLoading}
              className="btn-export flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>
                {sheetsLoading ? 'Mengekspor...' : `Export ke Sheets (${localData.length} items)`}
              </span>
            </button>
          )}

          {allowedActions.includes('import') && (
            <button
              onClick={handleImportFromSheets}
              disabled={sheetsLoading}
              className="btn-import flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>
                {sheetsLoading ? 'Mengimpor...' : 'Import dari Sheets'}
              </span>
            </button>
          )}

          {allowedActions.includes('backup') && (
            <button
              onClick={handleBackupToDrive}
              disabled={driveLoading || localData.length === 0}
              className="btn-backup flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span>
                {driveLoading ? 'Membuat backup...' : `Backup ke Drive (${localData.length} items)`}
              </span>
            </button>
          )}

          {allowedActions.includes('restore') && (
            <div className="flex items-center space-x-2 flex-grow">
              <select
                value={selectedFileId}
                onChange={(e) => setSelectedFileId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                disabled={driveLoading || availableBackupFiles.length === 0}
              >
                <option value="">Pilih file backup...</option>
                {availableBackupFiles.map(file => (
                  <option key={file.id} value={file.id}>
                    {file.name} ({new Date(file.createdTime).toLocaleDateString()})
                  </option>
                ))}
              </select>
              <button
                onClick={handleRestoreFromDrive}
                disabled={driveLoading || !selectedFileId}
                className="btn-restore px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {driveLoading ? 'Memulihkan...' : 'Restore'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Errors */}
      {(sheetsError || driveError) && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">
            <strong>Error:</strong> {sheetsError || driveError}
          </p>
          {!isAuthenticated && (
            <p className="text-xs text-red-700 mt-1">
              Pastikan Anda sudah login dengan Google dan spreadsheet ID sudah benar.
            </p>
          )}
        </div>
      )}

      {/* Data Preview */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Preview Data ({localData.length} items)</h3>
          {showFiles && uploadedFiles.length > 0 && (
            <div className="text-sm text-gray-500">
              Backup terakhir: {uploadedFiles[0]?.name}
            </div>
          )}
        </div>
        {renderDataPreview()}
      </div>
    </div>
  );
};

export default DataManager;