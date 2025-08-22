import React, { useState } from "react";

const StockAccessories = () => {
  // Data dummy untuk accessories handphone dan motor listrik
  const [accessories, setAccessories] = useState([
    {
      id: 1,
      tanggal: "02/01/2024",
      customer: "John Doe",
      salesName: "Sarah Lee",
      phone: "08123456789",
      price: "500.000",
      namaBarang: "LCD",
      phoneType: "iPhone 13 Pro",
      motorType: "-",
    },
    {
      id: 2,
      tanggal: "02/01/2024",
      customer: "Jane Smith",
      salesName: "Michael Tan",
      phone: "08234567890",
      price: "300.000",
      namaBarang: "Anti Gores",
      phoneType: "Samsung Galaxy S21",
      motorType: "-",
    },
    {
      id: 3,
      tanggal: "02/01/2024",
      customer: "Robert Brown",
      salesName: "Alice Wong",
      phone: "08345678901",
      price: "200.000",
      namaBarang: "LCD",
      phoneType: "Xiaomi Mi 11",
      motorType: "-",
    },
    {
      id: 4,
      tanggal: "02/01/2024",
      customer: "Emily Johnson",
      salesName: "David Lim",
      phone: "08456789012",
      price: "150.000",
      namaBarang: "Baterai",
      phoneType: "-",
      motorType: "Helmet",
    },
    {
      id: 5,
      tanggal: "02/01/2024",
      customer: "Chris Evans",
      salesName: "James Lee",
      phone: "08567890123",
      price: "250.000",
      namaBarang: "Baterai ",
      phoneType: "-",
      motorType: "Gloves",
    },
  ]);

  // State untuk form input accessories baru
  const [newAccessory, setNewAccessory] = useState({
    customer: "",
    tanggal: "",
    salesName: "",
    phone: "",
    price: "",
    namaBarang: "",
    phoneType: "",
    motorType: "",
  });

  // Fungsi untuk menangani perubahan input form
  const handleChange = (e) => {
    setNewAccessory({ ...newAccessory, [e.target.name]: e.target.value });
  };

  // Fungsi untuk menambahkan accessories baru ke dalam daftar
  const handleAddAccessory = () => {
    const newAccessoryWithId = { ...newAccessory, id: accessories.length + 1 };
    setAccessories([...accessories, newAccessoryWithId]);
    setNewAccessory({
      tanggal: "",
      customer: "",
      salesName: "",
      phone: "",
      price: "",
      namaBarang: "",
      phoneType: "",
      motorType: "",
    }); // Reset form
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">
        Stock Accessories Handphone dan Motor Listrik
      </h1>

      {/* Form Input Accessories Baru */}
      <div className="bg-white p-4 rounded shadow-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Tambah Stock Accessories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="tanggal"
            value={newAccessory.tanggal}
            onChange={handleChange}
            placeholder="Tanggal Pembelian"
            className="border border-gray-300 p-2 rounded w-full"
          />
          <input
            type="text"
            name="customer"
            value={newAccessory.customer}
            onChange={handleChange}
            placeholder="Nama Pelanggan"
            className="border border-gray-300 p-2 rounded w-full"
          />
          <input
            type="text"
            name="salesName"
            value={newAccessory.salesName}
            onChange={handleChange}
            placeholder="Nama Sales"
            className="border border-gray-300 p-2 rounded w-full"
          />
          <input
            type="text"
            name="phone"
            value={newAccessory.phone}
            onChange={handleChange}
            placeholder="Nomor Telepon Pelanggan"
            className="border border-gray-300 p-2 rounded w-full"
          />
          <input
            type="text"
            name="price"
            value={newAccessory.price}
            onChange={handleChange}
            placeholder="Harga"
            className="border border-gray-300 p-2 rounded w-full"
          />
          <input
            type="text"
            name="namaBarang"
            value={newAccessory.namaBarang}
            onChange={handleChange}
            placeholder="Nama Barang"
            className="border border-gray-300 p-2 rounded w-full"
          />
          <input
            type="text"
            name="phoneType"
            value={newAccessory.phoneType}
            onChange={handleChange}
            placeholder="Tipe Handphone"
            className="border border-gray-300 p-2 rounded w-full"
          />
          <input
            type="text"
            name="motorType"
            value={newAccessory.motorType}
            onChange={handleChange}
            placeholder="Tipe Motor Listrik"
            className="border border-gray-300 p-2 rounded w-full"
          />
        </div>
        <button
          onClick={handleAddAccessory}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Tambah Stock Accessories
        </button>
      </div>

      {/* Tabel Daftar Accessories */}
      <div className="bg-white p-4 rounded shadow-lg">
        <h2 className="text-xl font-semibold mb-4">
          Daftar Accessories Handphone dan Motor Listrik
        </h2>
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b  text-left">ID</th>
              <th className="py-2 px-4 border-b  text-left">
                Tanggal Pembelian
              </th>
              <th className="py-2 px-4 border-b  text-left">Nama Pelanggan</th>
              <th className="py-2 px-4 border-b  text-left">Nama Sales</th>
              <th className="py-2 px-4 border-b  text-left">Nomor Telepon</th>
              <th className="py-2 px-4 border-b  text-left">Harga</th>
              <th className="py-2 px-4 border-b  text-left">Nama Barang</th>
              <th className="py-2 px-4 border-b  text-left">Tipe Handphone</th>
              <th className="py-2 px-4 border-b  text-left">
                Tipe Motor Listrik
              </th>
            </tr>
          </thead>
          <tbody>
            {accessories.map((accessory) => (
              <tr key={accessory.id}>
                <td className="py-2 px-4 border-b">{accessory.id}</td>
                <td className="py-2 px-4 border-b">{accessory.tanggal}</td>
                <td className="py-2 px-4 border-b">{accessory.customer}</td>
                <td className="py-2 px-4 border-b">{accessory.salesName}</td>
                <td className="py-2 px-4 border-b">{accessory.phone}</td>
                <td className="py-2 px-4 border-b">{accessory.price}</td>
                <td className="py-2 px-4 border-b">{accessory.namaBarang}</td>
                <td className="py-2 px-4 border-b">{accessory.phoneType}</td>
                <td className="py-2 px-4 border-b">{accessory.motorType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockAccessories;
