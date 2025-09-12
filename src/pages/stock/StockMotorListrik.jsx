// src/pages/stock/StockMotorListrik.jsx
import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import * as XLSX from "xlsx";

import TOKO_LABELS from "../../data/TokoLabels";
import { getStockIndex } from "../../data/StockBarang";

const toNum = (v) => (isNaN(Number(v)) ? 0 : Number(v));

export default function StockMotorListrik() {
  const [params] = useSearchParams();
  const tokoId = Number(params.get("tokoId") || 1);
  const tokoName = TOKO_LABELS[tokoId] || "TOKO 1";

  const { motor_listrik = [] } = useMemo(() => getStockIndex(tokoName) || {}, [tokoName]);

  const [rows, setRows] = useState(() =>
    motor_listrik.map((r, i) => ({
      id: r.id ?? i + 1,
      nama: r.nama || r.name || "",
      no_dinamo: r.no_dinamo || r.imei || r.sn || "",
      stok_sistem: toNum(r.stok_sistem ?? r.stok ?? r.stock ?? 0),
      stok_fisik: toNum(r.stok_fisik ?? r.fisik ?? 0),
      ket: r.keterangan || r.ket || "",
    }))
  );

  const [form, setForm] = useState({
    nama: "",
    no_dinamo: "",
    stok_sistem: 0,
    stok_fisik: 0,
    ket: "",
  });

  const addRow = () => {
    const nr = {
      id: rows.length ? Math.max(...rows.map((x) => x.id)) + 1 : 1,
      nama: form.nama,
      no_dinamo: form.no_dinamo,
      stok_sistem: toNum(form.stok_sistem),
      stok_fisik: toNum(form.stok_fisik),
      ket: form.ket,
    };
    setRows((p) => [nr, ...p]);
    setForm({ nama: "", no_dinamo: "", stok_sistem: 0, stok_fisik: 0, ket: "" });
  };

  const delRow = (id) => {
    if (!window.confirm("Hapus data ini?")) return;
    setRows((p) => p.filter((x) => x.id !== id));
  };

  const [editId, setEditId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const beginEdit = (r) => {
    setEditId(r.id);
    setEditDraft({ ...r });
  };
  const cancelEdit = () => {
    setEditId(null);
    setEditDraft(null);
  };
  const saveEdit = () => {
    setRows((p) => p.map((x) => (x.id === editId ? { ...editDraft } : x)));
    cancelEdit();
  };

  const exportExcel = () => {
    const data = rows.map((r) => ({
      NAMA_BARANG: r.nama,
      NO_DINAMO: r.no_dinamo,
      STOK_SISTEM: r.stok_sistem,
      STOK_FISIK: r.stok_fisik,
      KETERANGAN: r.ket,
      TOKO: tokoName,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Motor Listrik");
    XLSX.writeFile(wb, `Stock_MotorListrik_${tokoName}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Stock Motor Listrik — {tokoName}</h1>
          <p className="text-slate-600">Kelola stok motor listrik (form, tabel, export Excel).</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportExcel}
            className="rounded-lg border bg-white px-3 py-2 text-sm shadow-sm hover:bg-slate-50"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* Form tambah */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Tambah / Update Stock</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="text-xs text-slate-600">NAMA BARANG</label>
            <input
              className="w-full border rounded px-2 py-1"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">NO DINAMO</label>
            <input
              className="w-full border rounded px-2 py-1"
              value={form.no_dinamo}
              onChange={(e) => setForm({ ...form, no_dinamo: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">STOK SISTEM</label>
            <input
              type="number"
              className="w-full border rounded px-2 py-1 text-right"
              value={form.stok_sistem}
              onChange={(e) => setForm({ ...form, stok_sistem: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">STOK FISIK</label>
            <input
              type="number"
              className="w-full border rounded px-2 py-1 text-right"
              value={form.stok_fisik}
              onChange={(e) => setForm({ ...form, stok_fisik: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">KETERANGAN</label>
            <input
              className="w-full border rounded px-2 py-1"
              value={form.ket}
              onChange={(e) => setForm({ ...form, ket: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-3">
          <button
            onClick={addRow}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold shadow-sm"
          >
            Tambah
          </button>
        </div>
      </div>

      {/* Tabel */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left">NAMA BARANG</th>
                <th className="px-3 py-2 text-left">NO DINAMO</th>
                <th className="px-3 py-2 text-right">STOK SISTEM</th>
                <th className="px-3 py-2 text-right">STOK FISIK</th>
                <th className="px-3 py-2 text-left">KETERANGAN</th>
                <th className="px-3 py-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) =>
                editId === r.id && editDraft ? (
                  <tr key={r.id} className="border-b last:border-0 bg-slate-50/50">
                    <td className="px-3 py-2">
                      <input
                        className="border rounded px-2 py-1 w-56"
                        value={editDraft.nama}
                        onChange={(e) => setEditDraft((d) => ({ ...d, nama: e.target.value }))}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="border rounded px-2 py-1 w-44"
                        value={editDraft.no_dinamo}
                        onChange={(e) =>
                          setEditDraft((d) => ({ ...d, no_dinamo: e.target.value }))
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        className="border rounded px-2 py-1 text-right w-24"
                        value={editDraft.stok_sistem}
                        onChange={(e) =>
                          setEditDraft((d) => ({ ...d, stok_sistem: toNum(e.target.value) }))
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        className="border rounded px-2 py-1 text-right w-24"
                        value={editDraft.stok_fisik}
                        onChange={(e) =>
                          setEditDraft((d) => ({ ...d, stok_fisik: toNum(e.target.value) }))
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="border rounded px-2 py-1 w-56"
                        value={editDraft.ket}
                        onChange={(e) => setEditDraft((d) => ({ ...d, ket: e.target.value }))}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          className="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700"
                        >
                          Simpan
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-2 py-1 text-xs rounded bg-slate-100 hover:bg-slate-200"
                        >
                          Batal
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="px-3 py-2">{r.nama}</td>
                    <td className="px-3 py-2">{r.no_dinamo || "-"}</td>
                    <td className="px-3 py-2 text-right">{r.stok_sistem}</td>
                    <td className="px-3 py-2 text-right">{r.stok_fisik}</td>
                    <td className="px-3 py-2">{r.ket || "-"}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => beginEdit(r)}
                          className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => delRow(r.id)}
                          className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                    Belum ada data motor listrik untuk {tokoName}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
