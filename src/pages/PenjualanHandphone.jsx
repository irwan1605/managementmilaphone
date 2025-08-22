import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';


const PenjualanHandphone = () => {
  // Data dummy untuk penjualan handphone
  const [sales, setSales] = useState([
    { id: 1, customer: 'John Doe', salesName: 'Sarah Lee', emei: '1234567890', phone: '08123456789', price: '5.000.000', type: 'iPhone 12', warranty: '1 Tahun' },
    { id: 2, customer: 'Jane Smith', salesName: 'Michael Tan', emei: '0987654321', phone: '08234567890', price: '6.500.000', type: 'Samsung Galaxy S21', warranty: '2 Tahun' },
    { id: 3, customer: 'Robert Brown', salesName: 'Alice Wong', emei: '5678901234', phone: '08345678901', price: '4.200.000', type: 'Xiaomi Mi 11', warranty: '1 Tahun' },
    { id: 4, customer: 'Emily Johnson', salesName: 'David Lim', emei: '3456789012', phone: '08456789012', price: '3.800.000', type: 'Oppo Reno 5', warranty: '1 Tahun' },
    { id: 5, customer: 'Chris Evans', salesName: 'James Lee', emei: '4567890123', phone: '08567890123', price: '5.500.000', type: 'Huawei P40', warranty: '1 Tahun' },
  ]);

  // const [searchTerm, setSearchTerm] = useState(''); // State untuk input pencarian

  // // Fungsi untuk filter sales berdasarkan pencarian
  // const filteredPenjualan = sales.filter(penjualan =>
  //   penjualan.name.toLowerCase().includes(searchTerm.toLowerCase())
  // );

  // const handleDownloadExcel = () => {
  //   const worksheet = XLSX.utils.json_to_sheet(sales); // Mengonversi data menjadi sheet Excel
  //   const workbook = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    
  //   // Menyimpan file Excel
  //   const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  //   const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  //   saveAs(blob, 'Products.xlsx');
  // };

  // const handleUploadExcel = (event) => {
  //   const file = event.target.files[0];
  //   const reader = new FileReader();
    
  //   reader.onload = (e) => {
  //     const data = new Uint8Array(e.target.result);
  //     const workbook = XLSX.read(data, { type: 'array' });
  //     const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  //     const jsonData = XLSX.utils.sheet_to_json(worksheet);
  //     setSales(jsonData); // Set data dari Excel ke state
  //   };
    
  //   reader.readAsArrayBuffer(file);
  // };

  // State untuk form input penjualan baru
  const [newSale, setNewSale] = useState({
    customer: '',
    salesName: '',
    emei: '',
    phone: '',
    price: '',
    type: '',
    warranty: '',
  });

  // Fungsi untuk menangani perubahan input form
  const handleChange = (e) => {
    setNewSale({ ...newSale, [e.target.name]: e.target.value });
  };

  // Fungsi untuk menambahkan penjualan baru ke dalam daftar
  const handleAddSale = () => {
    const newSaleWithId = { ...newSale, id: sales.length + 1 };
    setSales([...sales, newSaleWithId]);
    setNewSale({ customer: '', salesName: '', emei: '', phone: '', price: '', type: '', warranty: '' }); // Reset form
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Penjualan Handphone</h1>

      {/* Form Input Penjualan Baru */}
      <div className="bg-white p-4 rounded shadow-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Tambah Penjualan Handphone</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="customer"
            value={newSale.customer}
            onChange={handleChange}
            placeholder="Nama Pelanggan"
            className="border border-gray-300 p-2 rounded w-full"
          />
          <input
            type="text"
            name="salesName"
            value={newSale.salesName}
            onChange={handleChange}
            placeholder="Nama Sales"
            className="border border-gray-300 p-2 rounded w-full"
          />
          <input
            type="text"
            name="emei"
            value={newSale.emei}
            onChange={handleChange}
            placeholder="Nomor Emei HP"
            className="border border-gray-300 p-2 rounded w-full"
          />
          <input
            type="text"
            name="phone"
            value={newSale.phone}
            onChange={handleChange}
            placeholder="Nomor Telepon Pelanggan"
            className="border border-gray-300 p-2 rounded w-full"
          />
          <input
            type="text"
            name="price"
            value={newSale.price}
            onChange={handleChange}
            placeholder="Harga"
            className="border border-gray-300 p-2 rounded w-full"
          />
          <input
            type="text"
            name="type"
            value={newSale.type}
            onChange={handleChange}
            placeholder="Tipe Handphone"
            className="border border-gray-300 p-2 rounded w-full"
          />
          <input
            type="text"
            name="warranty"
            value={newSale.warranty}
            onChange={handleChange}
            placeholder="Garansi"
            className="border border-gray-300 p-2 rounded w-full"
          />
        </div>
        <button
          onClick={handleAddSale}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Tambah Penjualan Handphone
        </button>
      </div>

      {/* Tabel Daftar Penjualan */}
      <div className="bg-white p-4 rounded shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Daftar Penjualan Handphone</h2>
        
        {/* Tombol untuk download dan upload */}
      <div className="mb-4">
        <button
          // onClick={handleDownloadExcel}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-4"
        >
          Download Excel
        </button>
         {/* Input pencarian */}
         <input
          type="text"
          placeholder="Search penjualan..."
          // value={searchTerm}
          // onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 rounded px-4 py-2"
        />
      </div>
        
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b text-left">ID</th>
              <th className="py-2 px-4 border-b text-left">Nama Pelanggan</th>
              <th className="py-2 px-4 border-b text-left">Nama Sales</th>
              <th className="py-2 px-4 border-b text-left">Nomor Emei HP</th>
              <th className="py-2 px-4 border-b text-left">Nomor Telepon</th>
              <th className="py-2 px-4 border-b text-left">Harga</th>
              <th className="py-2 px-4 border-b text-left">Tipe Handphone</th>
              <th className="py-2 px-4 border-b text-left">Garansi</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td className="py-2 px-4 border-b">{sale.id}</td>
                <td className="py-2 px-4 border-b">{sale.customer}</td>
                <td className="py-2 px-4 border-b">{sale.salesName}</td>
                <td className="py-2 px-4 border-b">{sale.emei}</td>
                <td className="py-2 px-4 border-b">{sale.phone}</td>
                <td className="py-2 px-4 border-b">{sale.price}</td>
                <td className="py-2 px-4 border-b">{sale.type}</td>
                <td className="py-2 px-4 border-b">{sale.warranty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PenjualanHandphone;
