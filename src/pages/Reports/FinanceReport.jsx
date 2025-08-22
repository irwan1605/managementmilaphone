import React from 'react';

const FinanceReport = () => {
  // Dummy data laporan keuangan
  const transactions = [
    { date: '2024-09-01', description: 'Penjualan iPhone 13', income: 30000000, expense: 0 },
    { date: '2024-09-02', description: 'Pembelian Sepeda Listrik', income: 0, expense: 10000000 },
    { date: '2024-09-03', description: 'Penjualan Samsung Galaxy', income: 20000000, expense: 0 },
    { date: '2024-09-05', description: 'Pembayaran Listrik Toko', income: 0, expense: 1500000 },
  ];

  // Total pemasukan, pengeluaran, dan laba/rugi
  const totalIncome = transactions.reduce((sum, transaction) => sum + transaction.income, 0);
  const totalExpense = transactions.reduce((sum, transaction) => sum + transaction.expense, 0);
  const profitLoss = totalIncome - totalExpense;

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h1 className="text-2xl font-bold mb-4">Laporan Keuangan</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Ringkasan</h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-green-100 p-4 rounded-lg text-center">
            <h3 className="text-lg font-bold">Total Pemasukan</h3>
            <p className="text-2xl font-bold text-green-600">Rp{totalIncome.toLocaleString()}</p>
          </div>
          <div className="bg-red-100 p-4 rounded-lg text-center">
            <h3 className="text-lg font-bold">Total Pengeluaran</h3>
            <p className="text-2xl font-bold text-red-600">Rp{totalExpense.toLocaleString()}</p>
          </div>
          <div className={`p-4 rounded-lg text-center ${profitLoss >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            <h3 className="text-lg font-bold">Laba / Rugi</h3>
            <p className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Rp{profitLoss.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

        {/* Tombol download*/}
        <div className="mb-4 flex items-center">
        <button
          // onClick={handleDownloadExcel}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-4"
        >
          Download Excel
        </button>
       
        <input
          type="text"
          placeholder="Search reports..."
          // value={searchTerm}
          // onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 rounded px-4 py-2"
        />
      </div>

      <table className="min-w-full bg-white border">
        <thead className="bg-gray-200">
          <tr>
            <th className="py-2 px-4 border text-left">Tanggal</th>
            <th className="py-2 px-4 border text-left">Deskripsi</th>
            <th className="py-2 px-4 border text-left">Pemasukan (Rp)</th>
            <th className="py-2 px-4 border text-left">Pengeluaran (Rp)</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction, index) => (
            <tr key={index}>
              <td className="border-t py-2 px-4 text-left">{transaction.date}</td>
              <td className="border-t py-2 px-4 text-left">{transaction.description}</td>
              <td className="border-t py-2 px-4 text-left">{transaction.income.toLocaleString()}</td>
              <td className="border-t py-2 px-4 text-left">{transaction.expense.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FinanceReport;
