import React, { useState } from 'react';

const StockMotorListrik = () => {
  // Data dummy untuk penjualan motor listrik
  const [sales, setSales] = useState([
    { id: 1, customer: 'John Doe', salesName: 'Sarah Lee', machineNumber: 'M123456', batteryNumber: 'B123456', phone: '08123456789', price: '15.000.000', type: 'Yamaha E01', warranty: '2 Tahun' },
    { id: 2, customer: 'Jane Smith', salesName: 'Michael Tan', machineNumber: 'M234567', batteryNumber: 'B234567', phone: '08234567890', price: '18.500.000', type: 'Honda PCX Electric', warranty: '3 Tahun' },
    { id: 3, customer: 'Robert Brown', salesName: 'Alice Wong', machineNumber: 'M345678', batteryNumber: 'B345678', phone: '08345678901', price: '14.200.000', type: 'Vespa Elettrica', warranty: '2 Tahun' },
    { id: 4, customer: 'Emily Johnson', salesName: 'David Lim', machineNumber: 'M456789', batteryNumber: 'B456789', phone: '08456789012', price: '19.800.000', type: 'NIU NQi GT', warranty: '3 Tahun' },
    { id: 5, customer: 'Chris Evans', salesName: 'James Lee', machineNumber: 'M567890', batteryNumber: 'B567890', phone: '08567890123', price: '20.500.000', type: 'Gogoro Viva', warranty: '2 Tahun' },
  ]);

  // State untuk form input penjualan baru
  const [newSale, setNewSale] = useState({
    customer: '',
    salesName: '',
    machineNumber: '',
    batteryNumber: '',
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
    setNewSale({ customer: '', salesName: '', machineNumber: '', batteryNumber: '', phone: '', price: '', type: '', warranty: '' }); // Reset form
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Stock Motor Listrik</h1>

      {/* Form Input Penjualan Baru */}
      <div className="bg-white p-4 rounded shadow-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Tambah Stock Motor Listrik</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="customer"
            value={newSale.customer}
            onChange={handleChange}
            placeholder="Nama Supplier"
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
            name="machineNumber"
            value={newSale.machineNumber}
            onChange={handleChange}
            placeholder="Nomor Mesin"
            className="border border-gray-300 p-2 rounded w-full"
          />
          <input
            type="text"
            name="batteryNumber"
            value={newSale.batteryNumber}
            onChange={handleChange}
            placeholder="Nomor Baterai"
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
            placeholder="Tipe Motor Listrik"
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
          Tambah Stock Motor Listrik
        </button>
      </div>

      {/* Tabel Daftar Penjualan */}
      <div className="bg-white p-4 rounded shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Daftar Stock Motor Listrik</h2>
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b text-left">ID</th>
              <th className="py-2 px-4 border-b text-left">Nama Supplier</th>
              <th className="py-2 px-4 border-b text-left">Nama Sales</th>
              <th className="py-2 px-4 border-b text-left">Nomor Mesin</th>
              <th className="py-2 px-4 border-b text-left">Nomor Baterai</th>
              <th className="py-2 px-4 border-b text-left">Nomor Telepon</th>
              <th className="py-2 px-4 border-b text-left">Harga</th>
              <th className="py-2 px-4 border-b text-left">Tipe Motor Listrik</th>
              <th className="py-2 px-4 border-b text-left">Garansi</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td className="py-2 px-4 border-b">{sale.id}</td>
                <td className="py-2 px-4 border-b">{sale.customer}</td>
                <td className="py-2 px-4 border-b">{sale.salesName}</td>
                <td className="py-2 px-4 border-b">{sale.machineNumber}</td>
                <td className="py-2 px-4 border-b">{sale.batteryNumber}</td>
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

export default StockMotorListrik;
