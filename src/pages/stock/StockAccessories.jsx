import React, { useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import * as XLSX from "xlsx";
import { getStockIndex } from "../../data/StockBarang";

const toNum = (v) => (isNaN(Number(v)) ? 0 : Number(v));
const pick = (obj, keys, def = "") => {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== "") {
      return obj[k];
    }
  }
  return def;
};

function useInitialRows(toko) {
  const index = useMemo(() => getStockIndex(toko), [toko]);
  const raw = Array.isArray(index?.accessories) ? index.accessories : [];
  return useMemo(
    () =>
      raw.map((r, i) => ({
        id: i + 1,
        nama: pick(r, ["nama", "name", "namaBarang", "NAMA BARANG"], ""),
        imei: pick(r, ["imei", "IMEI"], ""),
        stokSistem: toNum(pick(r, ["stokSistem", "stok_sistem", "STOK SISTEM", "stok"], 0)),
        stokFisik: toNum(pick(r, ["stokFisik", "stok_fisik", "STOK FISIK"], 0)),
        keterangan: pick(r, ["keterangan", "note", "KETERANGAN"], ""),
      })),
    [raw]
  );
}

export default function StockAccessories() {
  const [sp] = useSearchParams();
  const toko = (sp.get("toko") || "").toLowerCase(); // ciracas|citeureup|gasalam (opsional)
  const initial = useInitialRows(toko);

  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ nama: "", imei: "", stokSistem: 0, stokFisik: 0, keterangan: "" });
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const fileInputRef = useRef(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (r) =>
        String(r.nama).toLowerCase().includes(s) ||
        String(r.imei).toLowerCase().includes(s) ||
        String(r.keterangan).toLowerCase().includes(s)
    );
  }, [rows, q]);

  const addRow = () => {
    if (!form.nama.trim()) return alert("Nama barang wajib diisi.");
    const id = rows.length ? Math.max(...rows.map((r) => r.id)) + 1 : 1;
    setRows((prev) => [
      {
        id,
        nama: form.nama.trim(),
        imei: (form.imei || "").trim(),
        stokSistem: toNum(form.stokSistem),
        stokFisik: toNum(form.stokFisik),
        keterangan: (form.keterangan || "").trim(),
      },
      ...prev,
    ]);
    setForm({ nama: "", imei: "", stokSistem: 0, stokFisik: 0, keterangan: "" });
  };

  const beginEdit = (row) => {
    setEditingId(row.id);
    setEditDraft({ ...row });
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };
  const saveEdit = () => {
    setRows((prev) => prev.map((r) => (r.id === editingId ? { ...editDraft, stokSistem: toNum(editDraft.stokSistem), stokFisik: toNum(editDraft.stokFisik) } : r)));
    cancelEdit();
  };
  const delRow = (id) => {
    if (!window.confirm("Hapus data ini?")) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const exportExcel = () => {
    const data = rows.map((r) => ({
      "NAMA BARANG": r.nama,
      IMEI: r.imei,
      "STOK SISTEM": r.stokSistem,
      "STOK FISIK": r.stokFisik,
      KETERANGAN: r.keterangan,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Accessories");
    const ymd = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `STOCK_Accessories_${toko || "ALL"}_${ymd}.xlsx`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Stock Accessories {toko ? `— ${toko.toUpperCase()}` : ""}</h1>
          <p className="text-slate-600 text-sm">Kelola stok accessories: tambah, edit, hapus, cari, export Excel.</p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama / IMEI / keterangan..."
            className="border rounded-lg px-3 py-2 w-64"
          />
          <button onClick={exportExcel} className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 shadow-sm">
            Export Excel
          </button>
        </div>
      </div>

      {/* Form tambah */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Tambah Stock</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input className="border rounded px-3 py-2" placeholder="NAMA BARANG" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
          <input className="border rounded px-3 py-2" placeholder="IMEI" value={form.imei} onChange={(e) => setForm({ ...form, imei: e.target.value })} />
          <input className="border rounded px-3 py-2 text-right" type="number" placeholder="STOK SISTEM" value={form.stokSistem} onChange={(e) => setForm({ ...form, stokSistem: e.target.value })} />
          <input className="border rounded px-3 py-2 text-right" type="number" placeholder="STOK FISIK" value={form.stokFisik} onChange={(e) => setForm({ ...form, stokFisik: e.target.value })} />
          <input className="border rounded px-3 py-2" placeholder="KETERANGAN" value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} />
        </div>
        <div className="mt-3">
          <button onClick={addRow} className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold shadow-sm">Tambah</button>
        </div>
      </div>

      {/* List responsif: table md+, kartu <md */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        {/* Table for md+ */}
        <div className="hidden md:block">
          <table className="table-fixed w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left w-[30%]">NAMA BARANG</th>
                <th className="px-3 py-2 text-left">IMEI</th>
                <th className="px-3 py-2 text-right w-[10%]">STOK SISTEM</th>
                <th className="px-3 py-2 text-right w-[10%]">STOK FISIK</th>
                <th className="px-3 py-2 text-left">KETERANGAN</th>
                <th className="px-3 py-2 text-left w-[16%]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const isEditing = editingId === row.id;
                if (isEditing && editDraft) {
                  return (
                    <tr key={row.id} className="border-b last:border-0 bg-slate-50/50">
                      <td className="px-3 py-2">
                        <input className="border rounded px-2 py-1 w-full" value={editDraft.nama} onChange={(e) => setEditDraft((d) => ({ ...d, nama: e.target.value }))} />
                      </td>
                      <td className="px-3 py-2">
                        <input className="border rounded px-2 py-1 w-full" value={editDraft.imei} onChange={(e) => setEditDraft((d) => ({ ...d, imei: e.target.value }))} />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input className="border rounded px-2 py-1 w-24 text-right" type="number" value={editDraft.stokSistem} onChange={(e) => setEditDraft((d) => ({ ...d, stokSistem: e.target.value }))} />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input className="border rounded px-2 py-1 w-24 text-right" type="number" value={editDraft.stokFisik} onChange={(e) => setEditDraft((d) => ({ ...d, stokFisik: e.target.value }))} />
                      </td>
                      <td className="px-3 py-2">
                        <input className="border rounded px-2 py-1 w-full" value={editDraft.keterangan} onChange={(e) => setEditDraft((d) => ({ ...d, keterangan: e.target.value }))} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <button onClick={saveEdit} className="px-3 py-1 text-xs rounded bg-emerald-600 text-white hover:bg-emerald-700">Simpan</button>
                          <button onClick={cancelEdit} className="px-3 py-1 text-xs rounded bg-slate-100 hover:bg-slate-200">Batal</button>
                        </div>
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="px-3 py-2">{row.nama}</td>
                    <td className="px-3 py-2">{row.imei || "-"}</td>
                    <td className="px-3 py-2 text-right">{row.stokSistem}</td>
                    <td className="px-3 py-2 text-right">{row.stokFisik}</td>
                    <td className="px-3 py-2">{row.keterangan || "-"}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button onClick={() => beginEdit(row)} className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700">Edit</button>
                        <button onClick={() => delRow(row.id)} className="px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700">Hapus</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-500">Tidak ada data.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Cards for <md */}
        <div className="md:hidden space-y-3">
          {filtered.map((row) => {
            const isEditing = editingId === row.id;
            if (isEditing && editDraft) {
              return (
                <div key={row.id} className="border rounded-xl p-3 bg-slate-50">
                  <div className="font-medium mb-2">Edit item</div>
                  <div className="space-y-2">
                    <input className="border rounded px-2 py-1 w-full" value={editDraft.nama} onChange={(e) => setEditDraft((d) => ({ ...d, nama: e.target.value }))} placeholder="NAMA BARANG" />
                    <input className="border rounded px-2 py-1 w-full" value={editDraft.imei} onChange={(e) => setEditDraft((d) => ({ ...d, imei: e.target.value }))} placeholder="IMEI" />
                    <input className="border rounded px-2 py-1 w-full text-right" type="number" value={editDraft.stokSistem} onChange={(e) => setEditDraft((d) => ({ ...d, stokSistem: e.target.value }))} placeholder="STOK SISTEM" />
                    <input className="border rounded px-2 py-1 w-full text-right" type="number" value={editDraft.stokFisik} onChange={(e) => setEditDraft((d) => ({ ...d, stokFisik: e.target.value }))} placeholder="STOK FISIK" />
                    <input className="border rounded px-2 py-1 w-full" value={editDraft.keterangan} onChange={(e) => setEditDraft((d) => ({ ...d, keterangan: e.target.value }))} placeholder="KETERANGAN" />
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="flex-1 px-3 py-2 text-sm rounded bg-emerald-600 text-white">Simpan</button>
                      <button onClick={cancelEdit} className="flex-1 px-3 py-2 text-sm rounded bg-slate-200">Batal</button>
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <div key={row.id} className="border rounded-xl p-3">
                <div className="font-semibold">{row.nama}</div>
                <div className="text-xs text-slate-600 mt-1">IMEI: {row.imei || "-"}</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 rounded bg-slate-50">
                    <div className="text-[11px] text-slate-500">STOK SISTEM</div>
                    <div className="font-semibold">{row.stokSistem}</div>
                  </div>
                  <div className="p-2 rounded bg-slate-50">
                    <div className="text-[11px] text-slate-500">STOK FISIK</div>
                    <div className="font-semibold">{row.stokFisik}</div>
                  </div>
                </div>
                {row.keterangan && <div className="mt-2 text-sm">{row.keterangan}</div>}
                <div className="mt-2 flex gap-2">
                  <button onClick={() => beginEdit(row)} className="flex-1 px-3 py-2 text-sm rounded bg-blue-600 text-white">Edit</button>
                  <button onClick={() => delRow(row.id)} className="flex-1 px-3 py-2 text-sm rounded bg-red-600 text-white">Hapus</button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center text-slate-500 py-6">Tidak ada data.</div>
          )}
        </div>
      </div>
    </div>
  );
}
