// src/pages/DashboardToko.jsx - MODIFIED
import React, { useState, useEffect } from "react";
import DataManager from "../components/DataManager/DataManager"; // Import DataManager
import { useAuth } from "../components/GoogleAuth/AuthContext"; // Untuk cek user role

export default function DashboardToko({ user, tokoId, appData, setAppData }) {
  const [dataTokoLokal, setDataTokoLokal] = useState(appData || []);
  const { userProfile, isAuthenticated } = useAuth(); // Ambil dari AuthContext

  useEffect(() => {
    setDataTokoLokal(appData);
  }, [appData]);

  const tokoNames = {
    1: "CILANGKAP",
    2: "KONTEN LIVE",
    3: "GAS ALAM",
    4: "CITEUREUP",
    5: "CIRACAS",
    6: "METLAND 1",
    7: "METLAND 2",
    8: "PITARA",
    9: "KOTA WISATA",
  };

  const currentTokoName = tokoNames[tokoId] || `Toko #${tokoId}`;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Dashboard Toko {currentTokoName}
      </h1>
      <p className="mb-4 text-gray-600">
        Selamat datang, {user.username}! Anda login sebagai {user.role}.
      </p>

      {/* Tampilkan DataManager hanya jika user terautentikasi Google */}
      {isAuthenticated && (user.role === 'superadmin' || user.role === 'admin' || (user.role.startsWith('pic_toko') && Number(user.toko) === tokoId)) && (
        <div className="mb-8 p-6 bg-white shadow-md rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">
            Manajemen Data Toko Mila Phone {currentTokoName} dengan Google
          </h2>
          <DataManager
            appData={dataTokoLokal}
            setAppData={setAppData} // Teruskan fungsi setAppData dari App.jsx
            dataType="dashboard_toko" // Tipe data spesifik untuk dashboard toko
            tokoId={tokoId} // Teruskan ID toko
            allowedActions={['export', 'import', 'backup', 'restore']} // Semua aksi diizinkan
          />
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Data Penjualan dan Stok (Dummy)
        </h2>
        {dataTokoLokal && dataTokoLokal.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full leading-normal">
              <thead>
                <tr>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Produk
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Harga
                  </th>
                </tr>
              </thead>
              <tbody>
                {dataTokoLokal.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      {item.id}
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      {item.tanggal}
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      {item.kategori}
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      {item.produk}
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      {item.qty}
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      {item.harga.toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">Tidak ada data untuk toko ini.</p>
        )}
      </div>
    </div>
  );
}