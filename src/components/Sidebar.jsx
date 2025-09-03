// Sidebar.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import "./Sidebar.css"; // <-- pastikan file CSS ini ada

// Icons
import {
  FaHome,
  FaMobileAlt,
  FaMotorcycle,
  FaToolbox,
  FaClipboardList,
  FaStore,
  FaUsers,
  FaShoppingCart,
  FaCartPlus,
  FaMoneyCheckAlt,
  FaCashRegister, // <-- balik lagi
} from "react-icons/fa";
import { AiFillPhone, AiOutlineDatabase } from "react-icons/ai";
import { BsGraphUp, BsTagsFill, BsFileEarmarkText } from "react-icons/bs";
import { MdBuild } from "react-icons/md";
import { FiBox } from "react-icons/fi";

const Sidebar = ({ role, toko, onLogout }) => {
  const [showSubMenuService, setShowSubMenuService] = useState(false);
  const [showSubMenulaporan, setShowSubMenulaporan] = useState(false);
  const [showSubMenuPenjualan, setShowSubMenuPenjualan] = useState(false);
  const [showSubMenuPembelian, setShowSubMenuPembelian] = useState(false);
  const [showSubMenuStock, setShowSubMenuStock] = useState(false);
  const [showSubMenuStruk, setShowSubMenuStruk] = useState(false);
  const [showSubMenuDashboardToko, setShowSubMenuDashboardToko] = useState(false);

  // const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    if (typeof onLogout === "function") onLogout(); // App.jsx akan setUser(null)
    // Tidak perlu navigate(); ketika user null,
    // App.jsx otomatis render branch login dan route "*" → "/"
  };

  return (
    <div className="bg-blue-700 w-64 h-screen text-white overflow-y-auto">
      <img src="/logoMMT.jpg" alt="Logo" className="logo mb-4" />
      <div className="font-bold p-2">
        <h2 className="text-gray-200 text-center text-sm">
          PT. MILA MEDIA TELEKOMUNIKASI
        </h2>
      </div>

      <nav className="mt-6 font-bold">
        {/* DASHBOARD */}
        <Link to="/dashboard" className="flex items-center p-3 hover:bg-blue-500">
          <FaHome className="text-xl" />
          <span className="ml-2">DASHBOARD PUSAT</span>
        </Link>

        {/* DASHBOARD TOKO */}
        <button
          onClick={() => setShowSubMenuDashboardToko((s) => !s)}
          className="w-full flex items-center p-3 hover:bg-blue-500 text-left"
        >
          <FaStore className="text-xl" />
          <span className="ml-2">DASHBOARD TOKO</span>
        </button>
        {showSubMenuDashboardToko && (
          <ul className="pl-6">
            {Array.from({ length: 10 }, (_, i) => (
              <li key={i}>
                <Link to={`/toko/${i + 1}`} className="flex items-center p-2 hover:bg-blue-500">
                  <FaStore className="text-sm" />
                  <span className="ml-2">Toko {i + 1}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* LAPORAN */}
        <button
          onClick={() => setShowSubMenulaporan((s) => !s)}
          className="w-full flex items-center p-3 hover:bg-blue-500 text-left"
        >
          <BsFileEarmarkText className="text-xl" />
          <span className="ml-2">LAPORAN</span>
        </button>
        {showSubMenulaporan && (
          <ul className="pl-6">
            <li>
              <Link to="/sales-report" className="flex items-center p-2 hover:bg-blue-500">
                <BsGraphUp className="text-lg" />
                <span className="ml-2">Laporan Penjualan</span>
              </Link>
            </li>
            <li>
              <Link to="/inventory-report" className="flex items-center p-2 hover:bg-blue-500">
                <BsTagsFill className="text-lg" />
                <span className="ml-2">Laporan Persediaan</span>
              </Link>
            </li>
            <li>
              <Link to="/finance-report" className="flex items-center p-2 hover:bg-blue-500">
                <FaClipboardList className="text-lg" />
                <span className="ml-2">Laporan Keuangan</span>
              </Link>
            </li>
          </ul>
        )}

        {/* PENJUALAN */}
        <button
          onClick={() => setShowSubMenuPenjualan((s) => !s)}
          className="w-full flex items-center p-3 hover:bg-blue-500 text-left"
        >
          <FaShoppingCart className="text-xl" />
          <span className="ml-2">PENJUALAN</span>
        </button>
        {showSubMenuPenjualan && (
          <ul className="pl-6">
            <li>
              <Link to="/input-penjualan" className="flex items-center p-2 hover:bg-blue-500">
                <FaClipboardList className="text-lg" />
                <span className="ml-2">Input Penjualan</span>
              </Link>
            </li>
            <li>
              <Link to="/penjualan-handphone" className="flex items-center p-2 hover:bg-blue-500">
                <FaMobileAlt className="text-lg" />
                <span className="ml-2">Handphone</span>
              </Link>
            </li>
            <li>
              <Link to="/penjualan-motor-listrik" className="flex items-center p-2 hover:bg-blue-500">
                <FaMotorcycle className="text-lg" />
                <span className="ml-2">Motor Listrik</span>
              </Link>
            </li>
            <li>
              <Link to="/accessories" className="flex items-center p-2 hover:bg-blue-500">
                <FaToolbox className="text-lg" />
                <span className="ml-2">Accessories</span>
              </Link>
            </li>
          </ul>
        )}

        {/* PEMBELIAN */}
        <button
          onClick={() => setShowSubMenuPembelian((s) => !s)}
          className="w-full flex items-center p-3 hover:bg-blue-500 text-left"
        >
          <FaCartPlus className="text-xl" />
          <span className="ml-2">PEMBELIAN</span>
        </button>
        {showSubMenuPembelian && (
          <ul className="pl-6">
            <li>
              <Link to="/pembelian-motor-listrik" className="flex items-center p-2 hover:bg-blue-500">
                <AiFillPhone className="text-lg" />
                <span className="ml-2">Pembelian Produk</span>
              </Link>
            </li>
          </ul>
        )}

        {/* SERVICE */}
        <button
          onClick={() => setShowSubMenuService((s) => !s)}
          className="w-full flex items-center p-3 hover:bg-blue-500 text-left"
        >
          <MdBuild className="text-xl" />
          <span className="ml-2">SERVICE</span>
        </button>
        {showSubMenuService && (
          <ul className="pl-6">
            <li>
              <Link to="/service-handphone" className="flex items-center p-2 hover:bg-blue-500">
                <AiFillPhone className="text-lg" />
                <span className="ml-2">Service Handphone</span>
              </Link>
            </li>
            <li>
              <Link to="/service-motor-listrik" className="flex items-center p-2 hover:bg-blue-500">
                <FaMotorcycle className="text-lg" />
                <span className="ml-2">Service Motor Listrik</span>
              </Link>
            </li>
          </ul>
        )}

        {/* PRODUK & STOCK */}
        <button
          onClick={() => setShowSubMenuStock((s) => !s)}
          className="w-full flex items-center p-3 hover:bg-blue-500 text-left"
        >
          <FiBox className="text-xl" />
          <span className="ml-2">PRODUK DAN STOCK</span>
        </button>
        {showSubMenuStock && (
          <ul className="pl-6">
            <li>
              <Link to="/stock-handphone" className="flex items-center p-2 hover:bg-blue-500">
                <FaMobileAlt className="text-lg" />
                <span className="ml-2">Handphone</span>
              </Link>
            </li>
            <li>
              <Link to="/stock-motor-listrik" className="flex items-center p-2 hover:bg-blue-500">
                <FaMotorcycle className="text-lg" />
                <span className="ml-2">Motor Listrik</span>
              </Link>
            </li>
            <li>
              <Link to="/stock-accessories" className="flex items-center p-2 hover:bg-blue-500">
                <FaToolbox className="text-lg" />
                <span className="ml-2">Accessories</span>
              </Link>
            </li>
          </ul>
        )}

        {/* KEUANGAN */}
        <Link to="/keuangan" className="flex items-center p-3 hover:bg-blue-500">
          <FaMoneyCheckAlt className="text-xl" />
          <span className="ml-2">KEUANGAN</span>
        </Link>

        {/* USER MANAGEMENT */}
        <Link to="/user-management" className="flex items-center p-3 hover:bg-blue-500">
          <FaUsers className="text-xl" />
          <span className="ml-2">USER MANAGEMENT</span>
        </Link>

        {/* MASTER DATA */}
        <Link to="/data-management" className="flex items-center p-3 hover:bg-blue-500">
          <AiOutlineDatabase className="text-xl" />
          <span className="ml-2">MASTER DATA</span>
        </Link>

        {/* CETAK FAKTUR */}
        <button
          onClick={() => setShowSubMenuStruk((s) => !s)}
          className="w-full flex items-center p-3 hover:bg-blue-500 text-left"
        >
          <FaCashRegister className="mr-2" />
          <span className="ml-2">CETAK FAKTUR</span>
        </button>
        {showSubMenuStruk && (
          <ul className="pl-6">
            <li>
              <Link to="/struk-penjualan" className="block pl-6 py-1 hover:bg-blue-600 rounded">
                Struk Faktur Penjualan
              </Link>
            </li>
            <li>
              <Link to="/struk-penjualan-imei" className="block pl-6 py-1 hover:bg-blue-600 rounded">
                Struk Faktur Penjualan IMEI
              </Link>
            </li>
            <li>
              <Link to="/surat-jalan" className="block pl-6 py-1 hover:bg-blue-600 rounded">
                Surat Jalan
              </Link>
            </li>
            <li>
              <Link to="/invoice" className="block pl-6 py-1 hover:bg-blue-600 rounded">
                Invoice
              </Link>
            </li>
          </ul>
        )}
      </nav>

      {/* ---- TOMBOL KELUAR ---- */}
      <div className="p-4">
      <button type="button" onClick={handleLogout} className="logout-btn">
          <LogOut size={18} className="logout-icon" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
