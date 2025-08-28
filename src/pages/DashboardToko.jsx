// src/pages/DashboardToko.jsx
import React, { useMemo, useState } from "react";
import { utils as xlsxUtils, writeFile as writeXLSX } from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

/**
 * Props:
 * - tokoId (string or number) : required for title
 * - initialData (optional) : array of rows to use instead of generating dummy
 *
 * Row shape:
 * { id, tanggal, kategori, produk, qty, harga }
 */

const categories = ["Accessories", "Handphone", "Motor Listrik", "Service HP"];

const currency = (n) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n || 0);

const generateDummyData = (tokoId, n = 10) =>
  Array.from({ length: n }, (_, i) => {
    const kategori = categories[i % categories.length];
    return {
      id: i + 1,
      tanggal: `2025-08-${String((i % 28) + 1).padStart(2, "0")}`,
      kategori,
      produk: `Produk ${i + 1} (${kategori}) - Toko ${tokoId}`,
      qty: Math.floor(Math.random() * 5) + 1,
      harga: (Math.floor(Math.random() * 9) + 1) * 100000, // 100k..900k
    };
  });

export default function DashboardToko({ tokoId, initialData = null }) {
  const [rows, setRows] = useState(
    Array.isArray(initialData) ? initialData : generateDummyData(tokoId, 10)
  );

  // Search + Pagination + Edit state
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [editingId, setEditingId] = useState(null);
  const [tempRow, setTempRow] = useState({
    tanggal: "",
    kategori: categories[0],
    produk: "",
    qty: 1,
    harga: 0,
  });

  // Derived filtered data
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [
        r.id,
        r.tanggal,
        r.kategori,
        r.produk,
        r.qty,
        r.harga,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  // Charts data (derive from rows so charts update live)
  const chartPerCategory = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      const value = (r.harga || 0) * (r.qty || 0);
      map[r.kategori] = (map[r.kategori] || 0) + value;
    });
    return Object.entries(map).map(([kategori, total]) => ({ kategori, total }));
  }, [rows]);

  const chartPerDate = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      const value = (r.harga || 0) * (r.qty || 0);
      map[r.tanggal] = (map[r.tanggal] || 0) + value;
    });
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([tanggal, total]) => ({ tanggal, total }));
  }, [rows]);

  // CRUD handlers
  const addNew = () => {
    const newId = rows.length ? Math.max(...rows.map((r) => r.id)) + 1 : 1;
    const newRow = {
      id: newId,
      tanggal: new Date().toISOString().slice(0, 10),
      kategori: categories[0],
      produk: `Produk Baru ${newId}`,
      qty: 1,
      harga: 100000,
    };
    setRows((s) => [newRow, ...s]);
    setPage(1);
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setTempRow({ ...row });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTempRow({
      tanggal: "",
      kategori: categories[0],
      produk: "",
      qty: 1,
      harga: 0,
    });
  };

  const saveEdit = () => {
    setRows((s) => s.map((r) => (r.id === editingId ? { ...tempRow, id: editingId } : r)));
    cancelEdit();
  };

  const deleteRow = (id) => {
    setRows((s) => s.filter((r) => r.id !== id));
  };

  // Export functions (use filtered so user exports current filtered set)
  const exportExcel = () => {
    try {
      const dataToExport = filtered.map((r) => ({
        ID: r.id,
        Tanggal: r.tanggal,
        Kategori: r.kategori,
        Produk: r.produk,
        Qty: r.qty,
        Harga: r.harga,
        Total: (r.harga || 0) * (r.qty || 0),
      }));
      const ws = xlsxUtils.json_to_sheet(dataToExport);
      const wb = xlsxUtils.book_new();
      xlsxUtils.book_append_sheet(wb, ws, `Toko_${tokoId}`);
      writeXLSX(wb, `Laporan_Toko_${tokoId}.xlsx`);
    } catch (err) {
      console.error("Export Excel error:", err);
    }
  };

  const exportPDF = () => {
    try {
      const doc = new jsPDF({ unit: "pt" });
      doc.text(`Laporan Toko ${tokoId}`, 40, 40);
      const head = [["ID", "Tanggal", "Kategori", "Produk", "Qty", "Harga", "Total"]];
      const body = filtered.map((r) => [
        r.id,
        r.tanggal,
        r.kategori,
        r.produk,
        r.qty,
        r.harga,
        (r.harga || 0) * (r.qty || 0),
      ]);
      // autoTable options
      // @ts-ignore
      doc.autoTable({
        startY: 60,
        head,
        body,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [22, 160, 133] },
      });
      doc.save(`Laporan_Toko_${tokoId}.pdf`);
    } catch (err) {
      console.error("Export PDF error:", err);
    }
  };

  // helpers for inline edit inputs
  const handleTempChange = (field, value) => {
    setTempRow((t) => ({ ...t, [field]: value }));
  };

  // Ensure page remains valid if filtered size shrinks
  if (page > totalPages) {
    setPage(totalPages);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Dashboard Toko {tokoId}</h1>
        <p className="text-sm text-slate-500">
          CRUD, Search, Pagination, Export (Excel/PDF) & Chart ringkasan.
        </p>
      </header>

      {/* Charts */}
      <section className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Total per Kategori</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartPerCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="kategori" />
                <YAxis tickFormatter={(v) => currency(v)} />
                <Tooltip formatter={(v) => `Rp ${currency(v)}`} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Penjualan per Tanggal</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartPerDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tanggal" />
                <YAxis tickFormatter={(v) => currency(v)} />
                <Tooltip formatter={(v) => `Rp ${currency(v)}`} />
                <Area type="monotone" dataKey="total" stroke="#8884d8" fill="#8884d8" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Controls */}
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={addNew}
            className="bg-emerald-500 text-white px-4 py-2 rounded hover:opacity-95"
          >
            + Tambah Data
          </button>
          <button
            onClick={exportExcel}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:opacity-95"
          >
            Export Excel
          </button>
          <button
            onClick={exportPDF}
            className="bg-red-600 text-white px-4 py-2 rounded hover:opacity-95"
          >
            Export PDF
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari (produk / kategori / tanggal)..."
            className="border rounded px-3 py-2 w-64"
          />
          <div className="text-sm text-slate-500">Total hasil: {filtered.length}</div>
        </div>
      </section>

      {/* Table */}
      <section className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Tanggal</th>
              <th className="px-3 py-2 text-left">Kategori</th>
              <th className="px-3 py-2 text-left">Produk</th>
              <th className="px-3 py-2 text-left">Qty</th>
              <th className="px-3 py-2 text-left">Harga</th>
              <th className="px-3 py-2 text-left">Total</th>
              <th className="px-3 py-2 text-left">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((r) => {
              const isEditing = editingId === r.id;
              return (
                <tr key={r.id} className="border-b">
                  <td className="px-3 py-2 align-top">{r.id}</td>

                  <td className="px-3 py-2 align-top w-40">
                    {isEditing ? (
                      <input
                        type="date"
                        value={tempRow.tanggal}
                        onChange={(e) => handleTempChange("tanggal", e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                      />
                    ) : (
                      r.tanggal
                    )}
                  </td>

                  <td className="px-3 py-2 align-top w-40">
                    {isEditing ? (
                      <select
                        value={tempRow.kategori}
                        onChange={(e) => handleTempChange("kategori", e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                      >
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    ) : (
                      r.kategori
                    )}
                  </td>

                  <td className="px-3 py-2 align-top">
                    {isEditing ? (
                      <input
                        value={tempRow.produk}
                        onChange={(e) => handleTempChange("produk", e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                      />
                    ) : (
                      r.produk
                    )}
                  </td>

                  <td className="px-3 py-2 align-top w-24">
                    {isEditing ? (
                      <input
                        type="number"
                        value={tempRow.qty}
                        min={1}
                        onChange={(e) => handleTempChange("qty", Number(e.target.value))}
                        className="border rounded px-2 py-1 w-full"
                      />
                    ) : (
                      r.qty
                    )}
                  </td>

                  <td className="px-3 py-2 align-top w-32">
                    {isEditing ? (
                      <input
                        type="number"
                        value={tempRow.harga}
                        min={0}
                        onChange={(e) => handleTempChange("harga", Number(e.target.value))}
                        className="border rounded px-2 py-1 w-full"
                      />
                    ) : (
                      `Rp ${currency(r.harga)}`
                    )}
                  </td>

                  <td className="px-3 py-2 align-top w-32">{`Rp ${currency(r.harga * r.qty)}`}</td>

                  <td className="px-3 py-2 align-top w-44">
                    {isEditing ? (
                      <>
                        <button
                          onClick={saveEdit}
                          className="bg-blue-600 text-white px-3 py-1 rounded mr-2"
                        >
                          Simpan
                        </button>
                        <button onClick={cancelEdit} className="px-3 py-1 rounded border">
                          Batal
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(r)}
                          className="bg-amber-500 text-white px-3 py-1 rounded mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteRow(r.id)}
                          className="bg-rose-600 text-white px-3 py-1 rounded"
                        >
                          Hapus
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center p-6 text-slate-500">
                  Tidak ada data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Pagination */}
      <section className="flex items-center justify-between">
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>

        <div className="text-sm text-slate-600">
          Halaman {page} dari {totalPages} — Menampilkan {paginated.length} dari{" "}
          {filtered.length} hasil (total rows: {rows.length})
        </div>
      </section>
    </div>
  );
}
