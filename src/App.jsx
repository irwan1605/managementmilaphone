// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useParams,
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

// ⬇️ GANTI: gunakan folder `pages/stock` dan sebutkan ekstensi .jsx
import StockMotorListrik from "./pages/stock/StockMotorListrik.jsx";
import StockHandphone from "./pages/stock/StockHandphone.jsx";
import StockAccessories from "./pages/stock/StockAccessories.jsx";

import Keuangan from "./pages/Keuangan";
import InputPenjualan from "./pages/InputPenjualan";
import StrukPenjualan from "./pages/StrukPenjualan";
import StrukPenjualanIMEI from "./pages/StrukPenjualanIMEI";
import SuratJalan from "./pages/SuratJalan";
import Invoice from "./pages/Invoice";
import DashboardToko from "./pages/DashboardToko";

import ProtectedRoute from "./components/ProtectedRoute";

// daftar user default terpusat
import defaultUsers from "./data/UserManagementRole";

// ---------- dummy data toko ----------
const generateDummyData = (tokoName) =>
  Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    tanggal: `2025-08-${(i + 1).toString().padStart(2, "0")}`,
    kategori: ["Accessories", "Handphone", "Motor Listrik", "Service"][i % 4],
    produk: `${tokoName} Produk ${i + 1}`,
    qty: Math.floor(Math.random() * 5) + 1,
    harga: (Math.floor(Math.random() * 5) + 1) * 1_000_000,
  }));

const initialTokoData = {
  1: generateDummyData("CILANGKAP"),
  2: generateDummyData("KONTEN LIVE"),
  3: generateDummyData("GAS ALAM"),
  4: generateDummyData("CITEUREUP"),
  5: generateDummyData("CIRACAS"),
  6: generateDummyData("METLAND 1"),
  7: generateDummyData("METLAND 2"),
  8: generateDummyData("PITARA"),
  9: generateDummyData("KOTA WISATA"),
};

export default function App() {
  // ===== Session user =====
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  const handleLogin = (u) => setUser(u);
  const handleLogout = () => setUser(null);

  // ===== Sumber data user (UserManagementRole + localStorage) =====
  const [users, setUsers] = useState(() => {
    try {
      const ls = JSON.parse(localStorage.getItem("users"));
      return Array.isArray(ls) && ls.length ? ls : defaultUsers;
    } catch {
      return defaultUsers;
    }
  });

  useEffect(() => {
    localStorage.setItem("users", JSON.stringify(users));
  }, [users]);

  const addUser = (newUser) => {
    setUsers((prev) => {
      if (prev.some((u) => u.username === newUser.username)) return prev;
      return [...prev, newUser];
    });
  };

  // ===== Data toko (const) =====
  const tokoData = useMemo(() => initialTokoData, []);

  // ===== Guard: pic_toko hanya boleh akses tokonya =====
  const TokoGuard = ({ id }) => {
    const tokoId = Number(id);

    if (user?.role === "superadmin") {
      return (
        <DashboardToko
          user={user}
          tokoId={tokoId}
          initialData={tokoData[tokoId]}
        />
      );
    }

    if (user?.role?.startsWith("pic_toko")) {
      const allowed =
        Number(user.toko) ||
        Number(String(user.role).replace("pic_toko", "")) ||
        1;

      if (allowed !== tokoId) {
        return <Navigate to={`/toko/${allowed}`} replace />;
      }

      return (
        <DashboardToko
          user={user}
          tokoId={tokoId}
          initialData={tokoData[tokoId]}
        />
      );
    }

    return <Navigate to="/dashboard" replace />;
  };

  const TokoRoute = () => {
    const { id } = useParams();
    return <TokoGuard id={id} />;
  };

  return (
    <Router>
      {!user ? (
        // ===== Belum login =====
        <Routes>
          <Route
            path="/"
            element={<Login onLogin={handleLogin} users={users} />}
          />
          <Route path="/register" element={<Register addUser={addUser} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      ) : (
        // ===== Sudah login =====
        <div className="flex h-screen">
          <Sidebar role={user.role} toko={user.toko} onLogout={handleLogout} />
          <div className="flex-1 flex flex-col">
            <Navbar user={user} onLogout={handleLogout} />
            <div className="p-4 overflow-y-auto">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" />} />

                {/* Dashboard umum */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin", "pic_toko"]}>
                      <Dashboard user={user} />
                    </ProtectedRoute>
                  }
                />

                {/* Dashboard per toko */}
                <Route
                  path="/toko/:id"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin", "pic_toko"]}>
                      <TokoRoute />
                    </ProtectedRoute>
                  }
                />

                {/* Modul khusus superadmin */}
                <Route
                  path="/user-management"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin"]}>
                      <UserManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sales-report"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin"]}>
                      <SalesReport />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/inventory-report"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin"]}>
                      <InventoryReport />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pembelian-motor-listrik"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin"]}>
                      <PembelianMotorListrik />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/stock-motor-listrik"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin"]}>
                      <StockMotorListrik />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/stock-handphone"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin"]}>
                      <StockHandphone />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/stock-accessories"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin"]}>
                      <StockAccessories />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/keuangan"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin"]}>
                      <Keuangan />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin"]}>
                      <Products />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/data-management"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin"]}>
                      <DataManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/surat-jalan"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin"]}>
                      <SuratJalan />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/invoice"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin"]}>
                      <Invoice />
                    </ProtectedRoute>
                  }
                />

                {/* Modul yang juga boleh untuk pic_toko */}
                <Route
                  path="/penjualan-handphone"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin", "pic_toko"]}>
                      <PenjualanHandphone />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/penjualan-motor-listrik"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin", "pic_toko"]}>
                      <PenjualanMotorListrik />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/input-penjualan"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin", "pic_toko"]}>
                      <InputPenjualan />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/accessories"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin", "pic_toko"]}>
                      <Accessories />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/service-handphone"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin", "pic_toko"]}>
                      <ServiceHandphone />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/service-motor-listrik"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin", "pic_toko"]}>
                      <ServiceMotorListrik />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/struk-penjualan"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin", "pic_toko"]}>
                      <StrukPenjualan />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/struk-penjualan-imei"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin", "pic_toko"]}>
                      <StrukPenjualanIMEI />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </div>
          </div>
        </div>
      )}
    </Router>
  );
}
