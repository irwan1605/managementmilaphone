// src/hooks/useGoogleSheets.js Mila
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../components/GoogleAuth/AuthContext';
import { formatForSheets, formatDateForSheets } from '../utils/dataTransformers';
import { GOOGLE_CONFIG, SHEET_HEADERS } from '../utils/googleConfig';

const createSheetsApi = (accessToken) => {
  const api = axios.create({
    baseURL: 'https://sheets.googleapis.com/v4/spreadsheets',
  });

  api.interceptors.request.use(config => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    config.headers['Content-Type'] = 'application/json';
    return config;
  });

  return api;
};

export const useGoogleSheets = (spreadsheetId = process.env.REACT_APP_GOOGLE_SHEET_ID) => {
  const { accessToken, isAuthenticated } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const sheetsApi = useCallback(() => {
    if (!accessToken) return null;
    return createSheetsApi(accessToken);
  }, [accessToken]);

  // Fetch data from specific sheet range
  const fetchDataFromSheet = useCallback(async (range = 'Sheet1!A:Z', headers = null) => {
    if (!isAuthenticated || !accessToken || !spreadsheetId) {
      setError('Authentication or spreadsheet ID required');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const api = sheetsApi();
      if (!api) throw new Error('API not initialized');

      const response = await api.get(`/${spreadsheetId}/values/${range}`);
      const values = response.data.values || [];

      if (values.length === 0) {
        setData([]);
        setLastUpdated(new Date());
        return [];
      }

      // Convert 2D array to objects if headers provided
      if (headers) {
        const sheetData = values.slice(1).map(row => {
          const obj = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] ?? '';
          });
          return obj;
        });
        setData(sheetData);
      } else {
        setData(values);
      }

      setLastUpdated(new Date());
      return values;
    } catch (err) {
      console.error('Sheets fetch error:', err);
      setError(err.response?.data?.error?.message || err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, accessToken, spreadsheetId, sheetsApi]);

  // Append data to sheet
  const appendDataToSheet = useCallback(async (values, range = 'Sheet1!A1') => {
    if (!isAuthenticated || !accessToken || !spreadsheetId) {
      setError('Authentication or spreadsheet ID required');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const api = sheetsApi();
      if (!api) throw new Error('API not initialized');

      const response = await api.post(
        `/${spreadsheetId}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
        { values }
      );

      console.log('Data appended to Sheets:', response.data);
      setLastUpdated(new Date());
      return true;
    } catch (err) {
      console.error('Sheets append error:', err);
      setError(err.response?.data?.error?.message || err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, accessToken, spreadsheetId, sheetsApi]);

  // Update specific range in sheet
  const updateSheetRange = useCallback(async (range, values) => {
    if (!isAuthenticated || !accessToken || !spreadsheetId) {
      setError('Authentication or spreadsheet ID required');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const api = sheetsApi();
      if (!api) throw new Error('API not initialized');

      const response = await api.put(
        `/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
        { values }
      );

      console.log('Sheet range updated:', response.data);
      setLastUpdated(new Date());
      return true;
    } catch (err) {
      console.error('Sheets update error:', err);
      setError(err.response?.data?.error?.message || err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, accessToken, spreadsheetId, sheetsApi]);

  // Export app data to specific sheet
  const exportDataToSheet = useCallback(async (appData, sheetName, headers = null) => {
    if (!appData || appData.length === 0) {
      setError('No data to export');
      return false;
    }

    const formattedData = formatForSheets(appData, headers);
    const range = `${sheetName}!A1`;

    // Clear existing data first (optional)
    await updateSheetRange(range, [['Exporting data...']]);

    // Then append the actual data
    const success = await appendDataToSheet(formattedData, range);
    
    if (success) {
      // Refresh data after export
      await fetchDataFromSheet(range, headers);
    }

    return success;
  }, [appendDataToSheet, updateSheetRange, fetchDataFromSheet]);

  // Import data from sheet to app format
  const importDataFromSheet = useCallback(async (range = 'Sheet1!A:Z', headers = SHEET_HEADERS.PRODUCTS) => {
    const rawData = await fetchDataFromSheet(range, headers);
    if (!rawData || rawData.length <= 1) return [];

    // Skip header row and convert to objects
    return rawData.slice(1).map((row, index) => {
      const obj = {};
      headers.forEach((header, hIndex) => {
        let value = row[hIndex];
        
        // Type conversion
        if (header.includes('harga') || header.includes('total')) {
          obj[header] = parseFloat(value) || 0;
        } else if (header.includes('stok') || header.includes('qty')) {
          obj[header] = parseInt(value) || 0;
        } else if (header.includes('id')) {
          obj[header] = value?.toString() || `item_${index}`;
        } else if (header.includes('tanggal') || header.includes('updated_at')) {
          obj[header] = value ? new Date(value).toISOString() : new Date().toISOString();
        } else {
          obj[header] = value || '';
        }
      });
      return obj;
    });
  }, [fetchDataFromSheet]);

  // Auto-sync effect (optional)
  useEffect(() => {
    if (isAuthenticated && spreadsheetId) {
      const timer = setTimeout(() => {
        fetchDataFromSheet('Sheet1!A:Z');
      }, 1000); // Delay to avoid immediate calls

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, spreadsheetId, fetchDataFromSheet]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    fetchDataFromSheet,
    appendDataToSheet,
    updateSheetRange,
    exportDataToSheet,
    importDataFromSheet,
    isReady: isAuthenticated && !!spreadsheetId
  };
};