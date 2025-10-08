// src/App.jsx - MODIFIED VERSION
import React, { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useParams,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./components/GoogleAuth/AuthContext"; // NEW IMPORT

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
// import DataManagement from "./pages/DataManagement"; // Hapus import ini jika sudah ada DataManager di components

// === Halaman stok baru (per halaman) ===
import StockAccessories from "./pages/stock/StockAccessories";
import StockHandphone from "./pages/stock/StockHandphone";
import StockMotorListrik from "./pages/stock/StockMotorListrik";
import InputPenjualan from "./pages/InputPenjualan";
import StrukPenjualan from "./pages/StrukPenjualan";
import StrukPenjualanIMEI from "./pages/StrukPenjualanIMEI";
import SuratJalan from "./pages/SuratJalan";
import Invoice from "./pages/Invoice";
import DashboardToko from "./pages/DashboardToko";

import ProtectedRoute from "./components/ProtectedRoute";
import defaultUsers from "./data/UserManagementRole";
import PenjualanAccessories from "./pages/PenjualanAccessories";
import TransferBarangPusat from "./pages/Reports/TransferBarangPusat";
import PembelianProdukPusat from "./pages/PembelianProdukPusat";

import StockAccessoriesPusat from "./pages/stock/StockAccessoriesPusat";
import StockHandphonePusat from "./pages/stock/StockHandphonePusat";
import StockMotorListrikPusat from "./pages/stock/StockMotorListrikPusat";
import FinanceReport from "./pages/Reports/FinanceReport";
import FinanceReportMonthly from "./pages/Reports/FinanceReportMonthly";

// NEW IMPORTS for Google Integration
import DataManager from "./components/DataManager/DataManager";

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

function AppContent() {
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

  // ===== Sumber data user =====
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
  // Kita akan menggunakan state untuk data toko ini, agar bisa di-update dari Google Sheets
  const [currentTokoData, setCurrentTokoData] = useState(initialTokoData);

  // Fungsi untuk mengupdate data toko (misalnya setelah import dari Sheets)
  const updateTokoData = (tokoId, newData) => {
    setCurrentTokoData((prev) => ({
      ...prev,
      [tokoId]: newData,
    }));
  };

  // ===== Guard: pic_toko hanya boleh akses tokonya =====
  const TokoGuard = ({ id }) => {
    const tokoId = Number(id);

    if (user?.role === "superadmin" || user?.role === "admin") { // Admin juga bisa lihat semua toko
      return (
        <DashboardToko
          user={user}
          tokoId={tokoId}
          appData={currentTokoData[tokoId]} // Pakai state data toko
          setAppData={(newData) => updateTokoData(tokoId, newData)} // Fungsi update
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
          appData={currentTokoData[tokoId]} // Pakai state data toko
          setAppData={(newData) => updateTokoData(tokoId, newData)} // Fungsi update
        />
      );
    }

    return <Navigate to="/dashboard" replace />;
  };

  const TokoRoute = () => {
    const { id } = useParams();
    return <TokoGuard id={id} />;
  };

  // ===== Guard halaman stok per toko (akan diupdate serupa) =====
  // Untuk kesederhanaan, saya hanya akan menunjukkan bagaimana mengimplementasikan
  // DataManager di DashboardToko. Anda bisa mengadaptasi GuardedAccessories, dll.
  // dengan pola yang sama jika Anda ingin DataManager di sana juga.

  const GuardedAccessories = () => {
    const { id } = useParams();
    const tokoId = Number(id);

    if (user?.role === "superadmin" || user?.role === "admin") {
      return <StockAccessories />;
    }

    if (user?.role?.startsWith("pic_toko")) {
      const allowed =
        Number(user.toko) ||
        Number(String(user.role).replace("pic_toko", "")) ||
        1;
      if (allowed !== tokoId)
        return <Navigate to={`/toko/${allowed}`} replace />;
      return <StockAccessories />;
    }

    return <Navigate to="/dashboard" replace />;
  };

  const GuardedHandphone = () => {
    const { id } = useParams();
    const tokoId = Number(id);

    if (user?.role === "superadmin" || user?.role === "admin") {
      return <StockHandphone />;
    }

    if (user?.role?.startsWith("pic_toko")) {
      const allowed =
        Number(user.toko) ||
        Number(String(user.role).replace("pic_toko", "")) ||
        1;
      if (allowed !== tokoId)
        return <Navigate to={`/toko/${allowed}`} replace />;
      return <StockHandphone />;
    }

    return <Navigate to="/dashboard" replace />;
  };

  const GuardedMotor = () => {
    const { id } = useParams();
    const tokoId = Number(id);

    if (user?.role === "superadmin" || user?.role === "admin") {
      return <StockMotorListrik />;
    }

    if (user?.role?.startsWith("pic_toko")) {
      const allowed =
        Number(user.toko) ||
        Number(String(user.role).replace("pic_toko", "")) ||
        1;
      if (allowed !== tokoId)
        return <Navigate to={`/toko/${allowed}`} replace />;
      return <StockMotorListrik />;
    }

    return <Navigate to="/dashboard" replace />;
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
          <div className="flex-1 flex flex-col overflow-hidden">
            <Navbar user={user} onLogout={handleLogout} />
            <div className="flex-1 p-4 overflow-y-auto">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" />} />

                {/* Dashboard umum */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute
                      allowedRoles={["superadmin", "admin", "pic_toko"]}
                    >
                      <Dashboard user={user} />
                    </ProtectedRoute>
                  }
                />

                {/* Dashboard per toko */}
                <Route
                  path="/toko/:id"
                  element={
                    <ProtectedRoute
                      allowedRoles={["superadmin", "admin", "pic_toko"]}
                    >
                      <TokoRoute />
                    </ProtectedRoute>
                  }
                />

                {/* Halaman Stok per toko */}
                <Route
                  path="/toko/:id/stock-accessories"
                  element={
                    <ProtectedRoute
                      allowedRoles={["superadmin", "admin", "pic_toko"]}
                    >
                      <GuardedAccessories />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/toko/:id/stock-handphone"
                  element={
                    <ProtectedRoute
                      allowedRoles={["superadmin", "admin", "pic_toko"]}
                    >
                      <GuardedHandphone />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/toko/:id/stock-motor-listrik"
                  element={
                    <ProtectedRoute
                      allowedRoles={["superadmin", "admin", "pic_toko"]}
                    >
                      <GuardedMotor />
                    </ProtectedRoute>
                  }
                />

                {/* Modul khusus superadmin/admin */}
                <Route
                  path="/user-management"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin", "admin"]}>
                      <UserManagement users={users} setUsers={setUsers} /> {/* Teruskan users state */}
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sales-report"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin", "admin"]}>
                      <SalesReport />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/inventory-report"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin", "admin"]}>
                      <InventoryReport />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pembelian-produk-pusat"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin", "admin"]}>
                      <PembelianProdukPusat user={user} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/finance-report"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin", "admin"]}>
                      <FinanceReport />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/finance-report-monthly"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin", "admin"]}>
                      <FinanceReportMonthly />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin", "admin"]}>
                      {/* Anda mungkin ingin DataManager di sini juga untuk data produk */}
                      <Products />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/google-data-manager"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin", "admin"]}>
                      {/* DataManager umum untuk superadmin/admin */}
                      <DataManager 
                        appData={currentTokoData[1]} // Contoh: data toko 1 sebagai default
                        setAppData={(newData) => updateTokoData(1, newData)}
                        dataType="dashboard_overall" // Tipe data umum
                        tokoId={null} // Tidak spesifik toko
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/surat-jalan"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin", "admin", "pic_toko"]}>
                      <SuratJalan />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/invoice"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin", "admin", "pic_toko"]}>
                      <Invoice />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/transfer-barang-pusat"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin"]}>
                      <TransferBarangPusat />
                    </ProtectedRoute>
                  }
                />

                {/* Modul yang juga boleh untuk pic_toko */}
                <Route
                  path="/penjualan-handphone"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin", "admin"]}>
                      <PenjualanHandphone />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/penjualan-motor-listrik"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin", "admin"]}>
                      <PenjualanMotorListrik />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/input-penjualan"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin", "admin"]}>
                      <InputPenjualan />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/accessories"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin", "admin"]}>
                      <PenjualanAccessories />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/service-handphone"
                  element={
                    <ProtectedRoute
                      allowedRoles={["superadmin", "admin", "pic_toko"]}
                    >
                      <ServiceHandphone user={user} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/service-motor-listrik"
                  element={
                    <ProtectedRoute
                      allowedRoles={["superadmin", "admin", "pic_toko"]}
                    >
                      <ServiceMotorListrik user={user} />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/stock-handphone-pusat"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin"]}>
                      <StockHandphonePusat user={user} />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/stock-accessories-pusat"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin"]}>
                      <StockAccessoriesPusat user={user} />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/stock-motor-listrik-pusat"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin"]}>
                      <StockMotorListrikPusat user={user} />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/struk-penjualan"
                  element={
                    <ProtectedRoute
                      allowedRoles={["superadmin", "admin", "pic_toko"]}
                    >
                      <StrukPenjualan />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/struk-penjualan-imei"
                  element={
                    <ProtectedRoute
                      allowedRoles={["superadmin", "admin", "pic_toko"]}
                    >
                      <StrukPenjualanIMEI />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </div>
          </div>
        </div>
      )}
    </Router>
  );
}

// Komponen pembungkus AppContent dengan AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}