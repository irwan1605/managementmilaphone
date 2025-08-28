// App.jsx
import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import SalesReport from "./pages/Reports/SalesReport";
import InventoryReport from "./pages/Reports/InventoryReport";
import UserManagement from "./pages/UserManagement";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ServiceHandphone from "./pages/ServiceHandphone";
import ServiceMotorListrik from "./pages/ServiceMotorListrik";
import PenjualanHandphone from "./pages/PenjualanHandphone";
import PenjualanMotorListrik from "./pages/PenjualanMotorListrik";
import Accessories from "./pages/Accessories";
import DataManagement from "./pages/DataManagement";
import PembelianMotorListrik from "./pages/PembelianMotorListrik";
import StockMotorListrik from "./pages/StockMotorListrik";
import StockHandphone from "./pages/StockHandphone";
import StockAccessories from "./pages/StockAccessories";
import Keuangan from "./pages/Keuangan";
import InputPenjualan from "./pages/InputPenjualan";
import StrukPenjualan from "./pages/StrukPenjualan";
import StrukPenjualanIMEI from "./pages/StrukPenjualanIMEI";
import SuratJalan from "./pages/SuratJalan";
import Invoice from "./pages/Invoice";

// === tambahan DashboardToko universal untuk 10 toko ===
import DashboardToko from "./pages/DashboardToko";

// dummy users
const dummyUsers = [
  { username: "admin", password: "123", role: "superadmin" },
  { username: "toko1", password: "123", role: "pic_toko", toko: "Toko A" },
  { username: "toko2", password: "123", role: "pic_toko", toko: "Toko B" },
  { username: "toko3", password: "123", role: "pic_toko", toko: "Toko C" },
];

// dummy data generator 10 row / toko
const generateDummyData = (tokoName) =>
  Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    tanggal: `2025-08-${(i + 1).toString().padStart(2, "0")}`,
    kategori: ["Accessories", "Handphone", "Motor Listrik", "Service"][i % 4],
    produk: `${tokoName} Produk ${i + 1}`,
    qty: Math.floor(Math.random() * 5) + 1,
    harga: (Math.floor(Math.random() * 5) + 1) * 1000000,
  }));

export default function App() {
  const [user, setUser] = useState(null);

  // data 10 toko
  const tokoData = {
    1: generateDummyData("Toko 1"),
    2: generateDummyData("Toko 2"),
    3: generateDummyData("Toko 3"),
    4: generateDummyData("Toko 4"),
    5: generateDummyData("Toko 5"),
    6: generateDummyData("Toko 6"),
    7: generateDummyData("Toko 7"),
    8: generateDummyData("Toko 8"),
    9: generateDummyData("Toko 9"),
    10: generateDummyData("Toko 10"),
  };

  const handleLogin = (username, role, toko) => {
    setUser({ username, role, toko });
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <Router>
      {!user ? (
        <Routes>
          <Route
            path="/login"
            element={<Login onLogin={handleLogin} dummyUsers={dummyUsers} />}
          />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      ) : (
        <div className="flex h-screen">
          <Sidebar role={user.role} toko={user.toko} onLogout={handleLogout} />
          <div className="flex-1 flex flex-col">
            <Navbar user={user} onLogout={handleLogout} />
            <div className="p-4 overflow-y-auto">
              <Routes>
                <Route path="/dashboard" element={<Dashboard user={user} />} />

                {/* Route untuk Dashboard 10 Toko */}
                {Object.keys(tokoData).map((id) => (
                  <Route
                    key={id}
                    path={`/toko/${id}`}
                    element={
                      <DashboardToko tokoId={id} initialData={tokoData[id]} />
                    }
                  />
                ))}

                {/* Menu umum */}
                <Route path="/sales-report" element={<SalesReport />} />
                <Route path="/inventory-report" element={<InventoryReport />} />
                <Route
                  path="/penjualan-handphone"
                  element={<PenjualanHandphone />}
                />
                <Route path="/input-penjualan" element={<InputPenjualan />} />
                <Route
                  path="/penjualan-motor-listrik"
                  element={<PenjualanMotorListrik />}
                />
                <Route
                  path="/pembelian-motor-listrik"
                  element={<PembelianMotorListrik />}
                />
                <Route
                  path="/stock-motor-listrik"
                  element={<StockMotorListrik />}
                />
                <Route path="/stock-handphone" element={<StockHandphone />} />
                <Route path="/keuangan" element={<Keuangan />} />
                <Route
                  path="/stock-accessories"
                  element={<StockAccessories />}
                />
                <Route path="/accessories" element={<Accessories />} />
                <Route
                  path="/service-handphone"
                  element={<ServiceHandphone />}
                />
                <Route
                  path="/service-motor-listrik"
                  element={<ServiceMotorListrik />}
                />
                <Route path="/products" element={<Products />} />
                <Route path="/user-management" element={<UserManagement />} />
                <Route path="/data-management" element={<DataManagement />} />

                {/* CETAK FAKTUR */}
                <Route path="/struk-penjualan" element={<StrukPenjualan />} />
                <Route
                  path="/struk-penjualan-imei"
                  element={<StrukPenjualanIMEI />}
                />
                <Route path="/surat-jalan" element={<SuratJalan />} />
                <Route path="/invoice" element={<Invoice />} />

                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </div>
          </div>
        </div>
      )}
    </Router>
  );
}
