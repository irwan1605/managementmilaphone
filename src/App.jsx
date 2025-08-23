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
import SalesReportToko1 from "./pages/Toko1/SalesReportToko1";
import SalesReportToko2 from "./pages/SalesReportToko2";
import SalesReportHandphone from "./pages/Toko1/SalesReportHandphone";
import SalesReportMotorListrik from "./pages/Toko1/SalesReportMotorListrik";
import SalesReportAccessories from "./pages/Toko1/SalesReportAccessories";
import SalesReportServisHandphone from "./pages/Toko1/SalesReportServisHandphone";
import TambahPenjualan from "./pages/Toko1/TambahPenjualan";
import EditPenjualan from "./pages/Toko1/EditPenjualan";
import HapusPenjualan from "./pages/Toko1/HapusPenjualan";
import PembelianMotorListrik from "./pages/PembelianMotorListrik";
import StockMotorListrik from "./pages/StockMotorListrik";
import StockHandphone from "./pages/StockHandphone";
import StockAccessories from "./pages/StockAccessories";
import Keuangan from "./pages/Keuangan";
import InputPenjualan from "./pages/InputPenjualan";

// dummy users
const dummyUsers = [
  { username: "admin", password: "123", role: "superadmin" },
  { username: "toko1", password: "123", role: "pic_toko", toko: "Toko A" },
  { username: "toko2", password: "123", role: "pic_toko", toko: "Toko B" },
  { username: "toko3", password: "123", role: "pic_toko", toko: "Toko C" },
];

export default function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (username, role, toko) => {
    setUser({ username, role, toko }); // simpan user login
  };

  const handleLogout = () => {
    setUser(null); // hapus user saat logout
  };

  return (
    <Router>
      {/* Kalau belum login → hanya Login/Register */}
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
        // Kalau sudah login → tampil layout utama
        <div className="flex h-screen">
          <Sidebar role={user.role} toko={user.toko} />
          <div className="flex-1 flex flex-col">
            <Navbar user={user} onLogout={handleLogout} />
            <div className="p-4 overflow-y-auto">
              <Routes>
                <Route path="/dashboard" element={<Dashboard user={user} />} />

                {/* Menu umum */}
                <Route path="/sales-report" element={<SalesReport />} />
                <Route path="/inventory-report" element={<InventoryReport />} />
                <Route path="/penjualan-handphone" element={<PenjualanHandphone />} />
                <Route path="/input-penjualan" element={<InputPenjualan />} />
                <Route path="/penjualan-motor-listrik" element={<PenjualanMotorListrik />} />
                <Route path="/pembelian-motor-listrik" element={<PembelianMotorListrik />} />
                <Route path="/stock-motor-listrik" element={<StockMotorListrik />} />
                <Route path="/stock-handphone" element={<StockHandphone />} />
                <Route path="/keuangan" element={<Keuangan />} />
                <Route path="/stock-accessories" element={<StockAccessories />} />
                <Route path="/accessories" element={<Accessories />} />
                <Route path="/service-handphone" element={<ServiceHandphone />} />
                <Route path="/service-motor-listrik" element={<ServiceMotorListrik />} />
                <Route path="/products" element={<Products />} />
                <Route path="/user-management" element={<UserManagement />} />
                <Route path="/data-management" element={<DataManagement />} />

                {/* Route untuk toko */}
                <Route path="/sales-report/toko1" element={<SalesReportToko1 />} />
                <Route path="/sales-report/toko1/handphone" element={<SalesReportHandphone />} />
                <Route path="/sales-report/toko1/motor-listrik" element={<SalesReportMotorListrik />} />
                <Route path="/sales-report/toko1/accessories" element={<SalesReportAccessories />} />
                <Route path="/sales-report/toko1/servis-handphone" element={<SalesReportServisHandphone />} />
                <Route path="/sales-report/toko2" element={<SalesReportToko2 />} />
                <Route path="/toko1/tambah-penjualan" element={<TambahPenjualan />} />
                <Route path="/toko1/hapus-penjualan" element={<HapusPenjualan />} />
                <Route path="/toko1/edit-penjualan" element={<EditPenjualan />} />

                {/* Default redirect */}
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </div>
          </div>
        </div>
      )}
    </Router>
  );
}
