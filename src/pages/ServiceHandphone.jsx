import React, { useState } from 'react';

const ServiceHandphone = () => {
  // Data dummy untuk layanan servis
  const [services, setServices] = useState([
    { id: 1, customer: 'John Doe', phoneModel: 'iPhone X', status: 'Selesai', problem: 'Layar Pecah' },
    { id: 2, customer: 'Jane Smith', phoneModel: 'Samsung S20', status: 'Dalam Proses', problem: 'Baterai Rusak' },
    // Tambahkan data lainnya jika diperlukan
  ]);

  // State untuk form input servis baru
  const [newService, setNewService] = useState({
    customer: '',
    phoneModel: '',
    status: '',
    problem: '',
  });

  // Fungsi untuk menangani perubahan input form
  const handleChange = (e) => {
    setNewService({ ...newService, [e.target.name]: e.target.value });
  };

  // Fungsi untuk menambahkan servis baru ke dalam daftar
  const handleAddService = () => {
    const newServiceWithId = { ...newService, id: services.length + 1 };
    setServices([...services, newServiceWithId]);
    setNewService({ customer: '', phoneModel: '', status: '', problem: '' }); // Reset form
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Service Handphone</h1>

      {/* Form Input Servis Baru */}
      <div className="bg-white p-4 rounded shadow-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Tambah Layanan Servis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="customer"
            value={newService.customer}
            onChange={handleChange}
            placeholder="Nama Pelanggan"
            className="border border-gray-300 p-2 rounded w-full"
          />
          <input
            type="text"
            name="phoneModel"
            value={newService.phoneModel}
            onChange={handleChange}
            placeholder="Model Handphone"
            className="border border-gray-300 p-2 rounded w-full"
          />
          <input
            type="text"
            name="problem"
            value={newService.problem}
            onChange={handleChange}
            placeholder="Masalah"
            className="border border-gray-300 p-2 rounded w-full"
          />
          <select
            name="status"
            value={newService.status}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded w-full"
          >
            <option value="">Pilih Status</option>
            <option value="Selesai">Selesai</option>
            <option value="Dalam Proses">Dalam Proses</option>
            <option value="Belum Dikerjakan">Belum Dikerjakan</option>
          </select>
        </div>
        <button
          onClick={handleAddService}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Tambah Servis
        </button>
      </div>

      {/* Tabel Daftar Layanan Servis */}
      <div className="bg-white p-4 rounded shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Daftar Layanan Servis</h2>
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b text-left">ID</th>
              <th className="py-2 px-4 border-b text-left">Nama Pelanggan</th>
              <th className="py-2 px-4 border-b text-left">Model Handphone</th>
              <th className="py-2 px-4 border-b text-left">Masalah</th>
              <th className="py-2 px-4 border-b text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id}>
                <td className="py-2 px-4 border-b text-left">{service.id}</td>
                <td className="py-2 px-4 border-b text-left">{service.customer}</td>
                <td className="py-2 px-4 border-b text-left">{service.phoneModel}</td>
                <td className="py-2 px-4 border-b text-left">{service.problem}</td>
                <td className="py-2 px-4 border-b text-left">{service.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ServiceHandphone;
