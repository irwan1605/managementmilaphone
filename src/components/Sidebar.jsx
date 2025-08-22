import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
} from "lucide-react";

// Import Icons
import { 
  FaHome, FaMobileAlt, FaMotorcycle, FaToolbox, FaClipboardList, 
  FaStore, FaUsers, FaShoppingCart, FaCartPlus, FaMoneyCheckAlt 
} from "react-icons/fa";
import { AiFillPhone, AiOutlineDatabase } from "react-icons/ai";
import { BsGraphUp, BsTagsFill, BsFileEarmarkText } from "react-icons/bs";
import { MdBuild } from "react-icons/md";
import { FiBox } from "react-icons/fi"; // <— ini yang hilang

const Sidebar = () => {
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [showSubMenuService, setShowSubMenuService] = useState(false);
  const [showSubMenulaporan, setShowSubMenulaporan] = useState(false);
  const [showSubMenuPenjualan, setShowSubMenuPenjualan] = useState(false);
  const [showSubMenuPembelian, setShowSubMenuPembelian] = useState(false);
  const [showSubMenuStock, setShowSubMenuStock] = useState(false);
  const navigate = useNavigate();


  const handleLogout = () => {
    localStorage.removeItem("auth");
    navigate("/login");
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
        <Link
          to="/dashboard"
          className="flex items-center p-3 hover:bg-blue-500"
        >
          <FaHome className="text-xl" />
          <span className="ml-2">DASHBOARD</span>
        </Link>

        {/* LAPORAN */}
        <button
          onClick={() => setShowSubMenulaporan(!showSubMenulaporan)}
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

            {/* Laporan Penjualan Toko */}
            <button
              onClick={() => setShowSubMenu(!showSubMenu)}
              className="w-full flex items-center p-2 hover:bg-blue-500 text-left"
            >
              <FaStore className="text-lg" />
              <span className="ml-2">Laporan Penjualan Toko</span>
            </button>
            {showSubMenu && (
              <ul className="pl-6">
                {Array.from({ length: 10 }, (_, i) => (
                  <li key={i}>
                    <Link
                      to={`/sales-report/toko${i + 1}`}
                      className="flex items-center p-2 hover:bg-blue-500"
                    >
                      <FaStore className="text-sm" />
                      <span className="ml-2">Toko {i + 1}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </ul>
        )}

        {/* PENJUALAN */}
        <button
          onClick={() => setShowSubMenuPenjualan(!showSubMenuPenjualan)}
          className="w-full flex items-center p-3 hover:bg-blue-500 text-left"
        >
          <FaShoppingCart className="text-xl" />
          <span className="ml-2">PENJUALAN</span>
        </button>
        {showSubMenuPenjualan && (
          <ul className="pl-6">
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
          onClick={() => setShowSubMenuPembelian(!showSubMenuPembelian)}
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
          onClick={() => setShowSubMenuService(!showSubMenuService)}
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
          onClick={() => setShowSubMenuStock(!showSubMenuStock)}
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
      </nav>
      <div className="flex items-center mt-6 p-8 ms-6">
      <button className="logout-btn px-10 py-2 bg-red-500 text-white hover:bg-green-500 rounded-lg" onClick={handleLogout}>
        <LogOut size={30} /> <span>Keluar</span>
      </button>
      </div>
    </div>
  );
};

export default Sidebar;
