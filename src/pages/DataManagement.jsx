import React, { useState } from "react";

const DataManagement = () => {
  // Data dummy untuk accessories handphone dan motor listrik
  const [accessories, setAccessories] = useState([
    {
      id: 1,
      tanggal: "02/01/2024",
      namaKaryawan: "John Doe",
      nomorKaryawan: "08176678822",
      namaPic: "Sarah Lee",
      nomorPic: "08123456789",
      hargaModal: "300.000",
      hargaJual: "500.000",
      namaBarang: "LCD",
      nomorMesin: "M123456",
      nomorImei: "081767890123",
      phoneType: "iPhone 13 Pro",
      motorType: "Yamaha E01",
    },
    {
      id: 2,
      tanggal: "02/01/2024",
      namaKaryawan: "Jane Smith",
      nomorKaryawan: "0838456743434",
      namaPic: "Michael Tan",
      nomorPic: "08234567890",
      hargaModal: "1.500.000",
      hargaJual: "2.000.000",
      namaBarang: "Anti Gores",
      nomorMesin: "M234567",
      nomorImei: "083845678012",
      phoneType: "Samsung Galaxy S21",
      motorType: "Gogoro Viva",
    },
    {
      id: 3,
      tanggal: "02/01/2024",
      namaKaryawan: "Robert Brown",
      nomorKaryawan: "081344567891",
      namaPic: "Alice Wong",
      nomorPic: "08345678901",
      hargaModal: "1.300.000",
      hargaJual: "1.500.000",
      namaBarang: "LCD",
      nomorMesin: "M345678",
      nomorImei: "081334567890",
      phoneType: "Xiaomi Mi 11",
      motorType: "NIU NQi GT",
    },
    {
      id: 4,
      tanggal: "02/01/2024",
      namaKaryawan: "Emily Johnson",
      nomorKaryawan: "089876093922",
      namaPic: "David Lim",
      nomorPic: "08456789012",
      hargaModal: "23.000.000",
      hargaJual: "25.000.000",
      namaBarang: "Baterai",
      nomorMesin: "M456789",
      nomorImei: "08987654321",
      phoneType: "iPhone 12",
      motorType: "Vespa Elettrica",
    },
    {
      id: 5,
      tanggal: "02/01/2024",
      namaKaryawan: "Chris Evans",
      nomorKaryawan: "5678904321",
      namaPic: "James Lee",
      nomorPic: "08567890123",
      hargaModal: "8.300.000",
      hargaJual: "9.000.000",
      namaBarang: "Baterai ",
      nomorMesin: "M567890",
      nomorImei: "5678901234",
      phoneType: "Samsung Galaxy S21",
      motorType: "Honda PCX Electric",
    },
  ]);

  // State untuk form input accessories baru
  const [newAccessory, setNewAccessory] = useState({
    id: "",
    tanggal: "",
    namaKaryawan: "",
    namaPic: "",
    nomorPic: "",
    nomorKaryawan: "",
    harga: "",
    namaBarang: "",
    nomorMesin: "",
    phoneType: "",
    nomorImei: "",
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
      namaKaryawan: "",
      namaPic: "",
      nomorPic: "",
      phone: "",
      hargaModal: "",
      hargaJual: "",
      namaBarang: "",
      nomorMesin: "",
      phoneType: "",
      nomorImei: "",
      motorType: "",
    }); // Reset form
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Master Data Management</h1>

      {/* Form Input Accessories Baru */}
      <div className="bg-white p-4 rounded shadow-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Tambah Master Data Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="tanggal"
            value={newAccessory.tanggal}
            onChange={handleChange}
            placeholder="Tanggal Update"
            className="border border-gray-300 p-2 rounded w-full"
          />
          <input
            type="text"
            name="namaPic"
            value={newAccessory.namaPic}
            onChange={handleChange}
            placeholder="Nama PIC"
            className="border border-gray-300 p-2 rounded w-full"
          />
          <input
            type="text"
            name="nomorPic"
            value={newAccessory.nomorPic}
            onChange={handleChange}
            placeholder="Nomor Telepon PIC"
            className="border border-gray-300 p-2 rounded w-full"
          />
          <input
            type="text"
            name="namaKaryawan"
            value={newAccessory.namaKaryawan}
            onChange={handleChange}
            placeholder="Nama Karyawan"
            className="border border-gray-300 p-2 rounded w-full"
          />
          <input
            type="text"
            name="nomorKaryawan"
            value={newAccessory.nomorKaryawan}
            onChange={handleChange}
            placeholder="Nomor Telepon Karyawan"
            className="border border-gray-300 p-2 rounded w-full"
          />
          <input
            type="text"
            name="hargaModal"
            value={newAccessory.hargaModal}
            onChange={handleChange}
            placeholder="Harga Modal"
            className="border border-gray-300 p-2 rounded w-full"
          />
           <input
            type="text"
            name="hargaJual"
            value={newAccessory.hargaJual}
            onChange={handleChange}
            placeholder="Harga Jual"
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
            name="nomorImei"
            value={newAccessory.nomorImei}
            onChange={handleChange}
            placeholder="Nomor Emei"
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
          <input
            type="text"
            name="nomorMesin"
            value={newAccessory.nomorMesin}
            onChange={handleChange}
            placeholder="Nomor Mesin"
            className="border border-gray-300 p-2 rounded w-full"
          />
        </div>
        <button
          onClick={handleAddAccessory}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Tambah Data Management
        </button>
      </div>

      {/* Tabel Daftar Accessories */}
      <div className="bg-white p-4 rounded shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Daftar Master Data Managemant</h2>
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b  text-left">ID</th>
              <th className="py-2 px-4 border-b  text-left">Tanggal Update</th>
              <th className="py-2 px-4 border-b  text-left">Nama PIC</th>
              <th className="py-2 px-4 border-b  text-left">Nomor tlp PIC</th>
              <th className="py-2 px-4 border-b  text-left">Nama Karyawan</th>
              <th className="py-2 px-4 border-b  text-left">Nomor tlp Karyawan</th>
              <th className="py-2 px-4 border-b  text-left">HargaModal</th>
              <th className="py-2 px-4 border-b  text-left">HargaJual</th>
              <th className="py-2 px-4 border-b  text-left">Type Barang</th>
              <th className="py-2 px-4 border-b  text-left">Type Handphone</th>
              <th className="py-2 px-4 border-b  text-left">Nomor Imei HP</th>
              <th className="py-2 px-4 border-b  text-left">Type Motor Listrik</th>
              <th className="py-2 px-4 border-b  text-left">Nomor Mesin</th>
            </tr>
          </thead>
          <tbody>
            {accessories.map((accessory) => (
              <tr key={accessory.id}>
                <td className="py-2 px-4 border-b">{accessory.id}</td>
                <td className="py-2 px-4 border-b">{accessory.tanggal}</td>
                <td className="py-2 px-4 border-b">{accessory.namaPic}</td>
                <td className="py-2 px-4 border-b">{accessory.nomorPic}</td>
                <td className="py-2 px-4 border-b">{accessory.namaKaryawan}</td>
                <td className="py-2 px-4 border-b">{accessory.nomorKaryawan}</td>
                <td className="py-2 px-4 border-b">{accessory.hargaModal}</td>
                <td className="py-2 px-4 border-b">{accessory.hargaJual}</td>
                <td className="py-2 px-4 border-b">{accessory.namaBarang}</td>
                <td className="py-2 px-4 border-b">{accessory.phoneType}</td>
                <td className="py-2 px-4 border-b">{accessory.nomorImei}</td>
                <td className="py-2 px-4 border-b">{accessory.motorType}</td>
                <td className="py-2 px-4 border-b">{accessory.nomorMesin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataManagement;
