// src/pages/InputPenjualan.jsx
import React, { useState } from "react";
import * as XLSX from "xlsx";

export default function InputPenjualan() {
  const [formData, setFormData] = useState({
    tanggal: "",
    invoice: "",
    namaUser: "",
    noHp: "",
    salesToko: "",
    salesTitipan: "",
    namaReferensi: "",
    toko: "",
    brand: "",
    barang: "",
    qty: "",
    imei: "",
    kategoriHarga: "",
    hargaUnit: "",
    metodePayment: "",
    systemPayment: "",
    total: "",
    mdr: "",
    potonganMdr: "",
    noOrder: "",
    tenor: "",
    dpViaMerchant: "",
    dpKeToko: "",
    requestDpTalangan: "",
    keterangan: "",
  });

  const [data, setData] = useState([]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAdd = () => {
    setData([...data, formData]);
    setFormData({
      tanggal: "",
      invoice: "",
      namaUser: "",
      noHp: "",
      salesToko: "",
      salesTitipan: "",
      namaReferensi: "",
      toko: "",
      brand: "",
      barang: "",
      qty: "",
      imei: "",
      kategoriHarga: "",
      hargaUnit: "",
      metodePayment: "",
      systemPayment: "",
      total: "",
      mdr: "",
      potonganMdr: "",
      noOrder: "",
      tenor: "",
      dpViaMerchant: "",
      dpKeToko: "",
      requestDpTalangan: "",
      keterangan: "",
    });
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Penjualan");
    XLSX.writeFile(wb, "DataPenjualan.xlsx");
  };

  return (
    <div className="container mx-auto p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Input Penjualan</h2>

      {/* Form Input */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.keys(formData).map((field) => (
          <input
            key={field}
            type="text"
            name={field}
            value={formData[field]}
            onChange={handleChange}
            placeholder={field.toUpperCase()}
            className="border p-2 rounded"
          />
        ))}
      </div>

      <button
        onClick={handleAdd}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
      >
        Tambah Penjualan
      </button>

      {/* Tabel Data */}
      <div className="bg-white p-4 rounded shadow-lg">
        <div className="mt-6">
          <div className="flex justify-between mb-2">
            <button
              onClick={handleExport}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Download Excel
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border">
              <thead>
                <tr className="bg-gray-200 text-sm">
                  {Object.keys(formData).map((field) => (
                    <th key={field} className="border px-2 py-1">
                      {field.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx} className="text-sm">
                    {Object.keys(formData).map((field) => (
                      <td key={field} className="border px-2 py-1">
                        {row[field]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
