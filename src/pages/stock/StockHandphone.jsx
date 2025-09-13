// src/pages/stock/StockHandphone.jsx
import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { useNavigate, useParams } from "react-router-dom";
import TOKO_LABELS from "../../data/TokoLabels";
import { getStockIndex } from "../../data/StockBarang";

const toNum = (v) => (isNaN(Number(v)) ? 0 : Number(v));
const today = () => new Date().toISOString().slice(0, 10);

export default function StockHandphone() {
  const navigate = useNavigate();
  const { id } = useParams();
  const tokoId = Number(id);
  const tokoName = useMemo(
    () => TOKO_LABELS[tokoId] || `Toko ${tokoId}`,
    [tokoId]
  );

  const storageKey = `stock:handphone:${tokoName}`;

  const masterRows = useMemo(() => {
    const idx = getStockIndex(tokoName) || {};
    const list = idx.handphone || [];
    return (list || []).map((it, i) => ({
      id: i + 1,
      tanggal: it.tanggal || today(),
      namaBarang: it.namaBarang || it.name || it.nama || "",
      imei: it.imei || it.serial || "",
      stokSistem: toNum(it.stokSistem ?? it.stok ?? 0),
      stokFisik: toNum(it.stokFisik ?? 0),
      keterangan: it.keterangan || "",
    }));
  }, [tokoName]);

  const [rows, setRows] = useState(() => {
    try {
      const ls = JSON.parse(localStorage.getItem(storageKey));
      if (Array.isArray(ls)) return ls;
    } catch {}
    return masterRows;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(rows));
  }, [rows, storageKey]);

  const [form, setForm] = useState({
    tanggal: today(),
    namaBarang: "",
    imei: "",
    stokSistem: 0,
    stokFisik: 0,
    keterangan: "",
  });

  const addRow = () => {
    if (!form.namaBarang.trim()) return alert("Nama barang wajib diisi");
    const newRow = {
      id: rows.length ? Math.max(...rows.map((r) => r.id)) + 1 : 1,
      ...form,
      stokSistem: toNum(form.stokSistem),
      stokFisik: toNum(form.stokFisik),
    };
    setRows((prev) => [newRow, ...prev]);
    setForm({
      tanggal: today(),
      namaBarang: "",
      imei: "",
      stokSistem: 0,
      stokFisik: 0,
      keterangan: "",
    });
  };

  const deleteRow = (id) => {
    if (!window.confirm("Hapus baris ini?")) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);

  const startEdit = (row) => {
    setEditingId(row.id);
    setDraft({ ...row });
  };
  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };
  const saveEdit = () => {
    setRows((prev) => prev.map((r) => (r.id === editingId ? { ...draft } : r)));
    cancelEdit();
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      rows.map((r) => ({
        TANGGAL: r.tanggal,
        NAMA_BARANG: r.namaBarang,
        IMEI: r.imei,
        STOK_SISTEM: r.stokSistem,
        STOK_FISIK: r.stokFisik,
        KETERANGAN: r.keterangan,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Handphone");
    const ymd = today().replace(/-/g, "");
    const safe = tokoName.replace(/[^\p{L}\p{N}_-]+/gu, "_");
    XLSX.writeFile(wb, `STOCK_HANDPHONE_${safe}_${ymd}.xlsx`);
  };

  const totalItem = rows.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Stock Handphone — {tokoName}
          </h1>
          <p className="text-slate-600">Total item: {totalItem}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg border bg-white px-3 py-2 text-sm shadow-sm hover:bg-slate-50"
          >
            ← Kembali
          </button>
          <button
            onClick={exportExcel}
            className="rounded-lg border bg-white px-3 py-2 text-sm shadow-sm hover:bg-slate-50"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Tambah Stok</h2>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div>
            <label className="text-xs text-slate-600">Tanggal</label>
            <input
              type="date"
              className="w-full border rounded px-2 py-1"
              value={form.tanggal}
              onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">Nama Barang</label>
            <input
              className="w-full border rounded px-2 py-1"
              value={form.namaBarang}
              onChange={(e) => setForm({ ...form, namaBarang: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">IMEI</label>
            <input
              className="w-full border rounded px-2 py-1"
              value={form.imei}
              onChange={(e) => setForm({ ...form, imei: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">Stok Sistem</label>
            <input
              type="number"
              className="w-full border rounded px-2 py-1 text-right"
              value={form.stokSistem}
              onChange={(e) =>
                setForm({ ...form, stokSistem: toNum(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">Stok Fisik</label>
            <input
              type="number"
              className="w-full border rounded px-2 py-1 text-right"
              value={form.stokFisik}
              onChange={(e) =>
                setForm({ ...form, stokFisik: toNum(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">Keterangan</label>
            <input
              className="w-full border rounded px-2 py-1"
              value={form.keterangan}
              onChange={(e) =>
                setForm({ ...form, keterangan: e.target.value })
              }
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
          <table className="min-w-[1100px] text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left">Tanggal</th>
                <th className="px-3 py-2 text-left">Nama Barang</th>
                <th className="px-3 py-2 text-left">IMEI</th>
                <th className="px-3 py-2 text-right">Stok Sistem</th>
                <th className="px-3 py-2 text-right">Stok Fisik</th>
                <th className="px-3 py-2 text-left">Keterangan</th>
                <th className="px-3 py-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) =>
                editingId === row.id && draft ? (
                  <tr key={row.id} className="border-b last:border-0 bg-slate-50/50">
                    <td className="px-3 py-2">
                      <input
                        type="date"
                        className="border rounded px-2 py-1"
                        value={draft.tanggal}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, tanggal: e.target.value }))
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="border rounded px-2 py-1 w-56"
                        value={draft.namaBarang}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, namaBarang: e.target.value }))
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="border rounded px-2 py-1 w-40"
                        value={draft.imei}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, imei: e.target.value }))
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        className="border rounded px-2 py-1 text-right w-24"
                        value={draft.stokSistem}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, stokSistem: toNum(e.target.value) }))
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        className="border rounded px-2 py-1 text-right w-24"
                        value={draft.stokFisik}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, stokFisik: toNum(e.target.value) }))
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="border rounded px-2 py-1 w-60"
                        value={draft.keterangan}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, keterangan: e.target.value }))
                        }
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
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="px-3 py-2">{row.tanggal}</td>
                    <td className="px-3 py-2">{row.namaBarang}</td>
                    <td className="px-3 py-2">{row.imei || "-"}</td>
                    <td className="px-3 py-2 text-right">{row.stokSistem}</td>
                    <td className="px-3 py-2 text-right">{row.stokFisik}</td>
                    <td className="px-3 py-2">{row.keterangan || "-"}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(row)}
                          className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteRow(row.id)}
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
                  <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                    Belum ada data stok Handphone untuk {tokoName}.
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
