import React, { useState } from 'react';

const ServiceMotorListrik = () => {
  // Data dummy untuk layanan servis motor listrik
  const [services, setServices] = useState([
    { id: 1, customer: 'Alice Johnson', motorModel: 'E-Motor V1', status: 'Selesai', problem: 'Baterai Habis' },
    { id: 2, customer: 'Bob Brown', motorModel: 'E-Motor V2', status: 'Dalam Proses', problem: 'Rem Tidak Berfungsi' },
    // Tambahkan data lainnya jika diperlukan
  ]);

  // State untuk form input servis baru
  const [newService, setNewService] = useState({
    customer: '',
    motorModel: '',
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
    setNewService({ customer: '', motorModel: '', status: '', problem: '' }); // Reset form
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Service Motor Listrik</h1>

      {/* Form Input Servis Baru */}
      <div className="bg-white p-4 rounded shadow-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Tambah Layanan Servis Motor Listrik</h2>
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
            name="motorModel"
            value={newService.motorModel}
            onChange={handleChange}
            placeholder="Model Motor Listrik"
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
        <h2 className="text-xl font-semibold mb-4">Daftar Layanan Servis Motor Listrik</h2>
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b text-left">ID</th>
              <th className="py-2 px-4 border-b text-left">Nama Pelanggan</th>
              <th className="py-2 px-4 border-b text-left">Model Motor Listrik</th>
              <th className="py-2 px-4 border-b text-left">Masalah</th>
              <th className="py-2 px-4 border-b text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id}>
                <td className="py-2 px-4 border-b text-left">{service.id}</td>
                <td className="py-2 px-4 border-b text-left">{service.customer}</td>
                <td className="py-2 px-4 border-b text-left">{service.motorModel}</td>
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

export default ServiceMotorListrik;
