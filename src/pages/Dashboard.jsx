import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, ArcElement, Tooltip, Legend);

const Dashboard = ({user}) => {
  const navigate = useNavigate();
  const [showWhatsAppDropdown, setShowWhatsAppDropdown] = useState(false);

  const handleWhatsAppClick = (phoneNumber) => {
    window.open(`https://wa.me/${phoneNumber}`, '_blank');
  };

  const picContacts = [
    { name: 'PIC Toko 1', phone: '6282211174447' },
    { name: 'PIC Toko 2', phone: '6281234567891' },
    { name: 'PIC Toko 3', phone: '6281234567892' },
    { name: 'PIC Toko 4', phone: '6281234567893' },
    { name: 'PIC Toko 5', phone: '6281234567894' },
    { name: 'PIC Toko 6', phone: '6281234567895' },
    { name: 'PIC Toko 7', phone: '6281234567896' },
    { name: 'PIC Toko 8', phone: '6281234567897' },
    { name: 'PIC Toko 9', phone: '6281234567898' },
    { name: 'PIC Toko 10', phone: '6281234567899' },
  ];

  const cards = [
    {
      title: 'Penjualan Handphone : Rp 131.000.000',
      color: 'bg-blue-500',
      description: 'Lihat laporan penjualan handphone',
      route: '/sales-report/toko1/handphone',
    },
    {
      title: 'Penjualan Motor Listrik : Rp 125.000.000',
      color: 'bg-green-500',
      description: 'Lihat laporan penjualan motor listrik',
      route: '/sales-report/toko1/motor-listrik',
    },
    {
      title: 'Penjualan Accessories : Rp 24.000.000',
      color: 'bg-yellow-500',
      description: 'Lihat laporan penjualan accessories',
      route: '/sales-report/toko1/accessories',
    },
    {
      title: 'Service Handphone All : Rp 15.000.000',
      color: 'bg-red-500',
      description: 'Lihat laporan servis handphone',
      route: '/sales-report/toko1/servis-handphone',
    },
  ];

  // 1. Data untuk Bar Chart (Penjualan Produk per Bulan)
  const barData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'juli', 'Agtus', 'Okt', 'Sept', 'Nov', 'Des'],
    datasets: [
      {
        label: 'Penjualan Produk',
        data: [50, 75, 60, 90, 120, 85, 65, 85, 60, 80, 95, 105],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  // 2. Data untuk Line Chart (Pertumbuhan Pendapatan)
  const lineData = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
      {
        label: 'Pendapatan (Juta)',
        data: [15, 20, 30, 45],
        borderColor: 'rgba(75, 192, 192, 1)',
        fill: false,
        tension: 0.1,
      },
    ],
  };

  // 3. Data untuk Pie Chart (Distribusi Produk Terjual)
  const pieData = {
    labels: ['Phone X', 'E-Bike Y', 'Phone Z'],
    datasets: [
      {
        data: [45, 25, 30],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
        ],
        hoverBackgroundColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
        ],
      },
    ],
  };

  // 4. Data untuk Doughnut Chart (Persentase Cabang Penjualan)
  const doughnutData = {
    labels: ['Toko Pusat', 'Cabang 1', 'Cabang 2'],
    datasets: [
      {
        data: [60, 25, 15],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
        ],
        hoverBackgroundColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
      },
    ],
  };

  return (
    <div className="container  p-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p>Selamat datang, {user.username} (Role: {user.role})</p>

      {/* Tombol Filter Chat WhatsApp */}
      <div className="flex items-center mt-2">
        {/* <button
          onClick={() => setShowWhatsAppDropdown(!showWhatsAppDropdown)}
          className="px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-700 ml-4 mt-2 mb-2 item-rigth px-4 py-2 rounded-lg"
        >
          Filter Chat WhatsApp
        </button> */}

        {/* Dropdown WhatsApp PIC */}
        {showWhatsAppDropdown && (
          <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg">
            {picContacts.map((pic, index) => (
              <button
                key={index}
                onClick={() => handleWhatsAppClick(pic.phone)}
                className="block w-full text-left px-4 py-2 hover:bg-gray-200"
              >
                {pic.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`p-6 rounded-lg shadow-lg ${card.color} text-white cursor-pointer`}
            onClick={() => navigate(card.route)}
          >
            <h2 className="text-2xl font-bold mb-4">{card.title}</h2>
            <p>{card.description}</p>
          </div>
        ))}
      </div>

      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
      <div className="bg-blue-700 shadow-md rounded-lg p-6">
        <h2 className="text-white text-xl font-bold">Total Penjualan</h2>
        <p className="text-green-300 text-3xl font-semibold">Rp 295,000,000</p>
      </div>
      <div className="bg-gray-500 shadow-md rounded-lg p-6">
        <h2 className="text-white text-xl font-bold">Jumlah Penjualan Produk</h2>
        <p className="text-yellow-300 text-3xl font-semibold">100</p>
      </div>
      <div className="bg-red-500 shadow-md rounded-lg p-6">
        <h2 className="text-white text-xl font-bold">Total Pelanggan</h2>
        <p className="text-black-400 text-3xl font-semibold">200</p>
      </div>
      </div> */}

    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 p-2">
      <div className="bg-blue-300 shadow-md rounded-lg p-2">
        <p className="text-black text-xl font-bold">Toko 1 </p>
        <p className="text-black text-l font-semibold">Total Penjualan : Rp 45,000,000</p>
        <p className="text-black text-l font-semibold">Total Pelanggan : 85</p>
        <p className="text-black text-l font-semibold">Total Produk    : 101</p>
      </div>
      <div className="bg-blue-300 shadow-md rounded-lg p-2">
        <p className="text-black text-xl font-bold">Toko 2 </p>
        <p className="text-black text-l font-semibold">Total Penjualan : Rp 15,000,000</p>
        <p className="text-black text-l font-semibold">Total Pelanggan : 25</p>
        <p className="text-black text-l font-semibold">Total Produk    : 31</p>
      </div>
      <div className="bg-blue-300 shadow-md rounded-lg p-2">
        <p className="text-black text-xl font-bold">Toko 3 </p>
        <p className="text-black text-l font-semibold">Total Penjualan : Rp 35,000,000</p>
        <p className="text-black text-l font-semibold">Total Pelanggan : 40</p>
        <p className="text-black text-l font-semibold">Total Produk    : 37</p>
      </div>
      <div className="bg-blue-300 shadow-md rounded-lg p-2">
        <p className="text-black text-xl font-bold">Toko 4 </p>
        <p className="text-black text-l font-semibold">Total Penjualan : Rp 55,000,000</p>
        <p className="text-black text-l font-semibold">Total Pelanggan : 65</p>
        <p className="text-black text-l font-semibold">Total Produk    : 70</p>
      </div>
      <div className="bg-blue-300 shadow-md rounded-lg p-2">
        <p className="text-black text-xl font-bold">Toko 5 </p>
        <p className="text-black text-l font-semibold">Total Penjualan : Rp 75,000,000</p>
        <p className="text-black text-l font-semibold">Total Pelanggan : 121</p>
        <p className="text-black text-l font-semibold">Total Produk    : 80</p>
      </div>
      <div className="bg-blue-300 shadow-md rounded-lg p-2">
        <p className="text-black text-xl font-bold">Toko 6 </p>
        <p className="text-black text-l font-semibold">Total Penjualan : Rp 15,000,000</p>
        <p className="text-black text-l font-semibold">Total Pelanggan : 27</p>
        <p className="text-black text-l font-semibold">Total Produk    : 30</p>
      </div>
      <div className="bg-blue-300 shadow-md rounded-lg p-2">
        <p className="text-black text-xl font-bold">Toko 7 </p>
        <p className="text-black text-l font-semibold">Total Penjualan : Rp 25,000,000</p>
        <p className="text-black text-l font-semibold">Total Pelanggan : 64</p>
        <p className="text-black text-l font-semibold">Total Produk    : 68</p>
      </div>
      <div className="bg-blue-300 shadow-md rounded-lg p-2">
        <p className="text-black text-xl font-bold">Toko 8 </p>
        <p className="text-black text-l font-semibold">Total Penjualan : Rp 10,000,000</p>
        <p className="text-black text-l font-semibold">Total Pelanggan : 29</p>
        <p className="text-black text-l font-semibold">Total Produk    : 30</p>
      </div>
      <div className="bg-blue-300 shadow-md rounded-lg p-2">
        <p className="text-black text-xl font-bold">Toko 9 </p>
        <p className="text-black text-l font-semibold">Total Penjualan : Rp 12,000,000</p>
        <p className="text-black text-l font-semibold">Total Pelanggan : 75</p>
        <p className="text-black text-l font-semibold">Total Produk    : 84</p>
      </div>
      <div className="bg-blue-300 shadow-md rounded-lg p-2">
        <p className="text-black text-xl font-bold">Toko 10 </p>
        <p className="text-black text-l font-semibold">Total Penjualan : Rp 8,000,000</p>
        <p className="text-black text-l font-semibold">Total Pelanggan : 35</p>
        <p className="text-black text-l font-semibold">Total Produk    : 43</p>
      </div>
    </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 1. Bar Chart */}
        <div className="bg-white p-4 rounded shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Penjualan Produk (Bar Chart)</h2>
          <Bar data={barData}  />
        </div>

        {/* 2. Line Chart */}
        <div className="bg-white p-4 rounded shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Pertumbuhan Pendapatan (Line Chart)</h2>
          <Line data={lineData}  />
        </div>

         {/* 3. Pie Chart */}
         <div className="bg-white p-4 rounded shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Distribusi Produk Terjual (Pie Chart)</h2>
          <Pie data={pieData}  />
        </div>

        {/* 4. Doughnut Chart */}
        <div className="bg-white p-4 rounded shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Persentase Penjualan Cabang (Doughnut Chart)</h2>
          <Doughnut data={doughnutData}  />
        </div>    

      </div>
    </div>
  );
};

export default Dashboard;
