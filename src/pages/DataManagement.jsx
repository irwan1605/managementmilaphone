// src/pages/DataManagement.jsx
import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  PAYMENT_METHODS,
  PRICE_CATEGORIES,
  MP_PROTECT_OPTIONS,
  TENOR_OPTIONS,
  BRAND_LIST,
  PRODUCT_LIST,
  WARNA_LIST,
} from "../data/ListDataPenjualan";
import { HARGA_PENJUALAN } from "../data/MasterDataHargaPenjualan";

const STORAGE_MASTER_PRICE = "dm_master_harga";
const STORAGE_REF_LISTS = "dm_ref_lists";

const toNumber = (v) =>
  v === "" || v == null ? 0 : Number(String(v).replace(/[^\d.-]/g, "")) || 0;
const fmt = (n) =>
  (Number(n) || 0).toLocaleString("id-ID", { style: "currency", currency: "IDR" });

const defaultRefs = {
  paymentMethods: PAYMENT_METHODS,
  priceCategories: PRICE_CATEGORIES,
  mpProtectOptions: MP_PROTECT_OPTIONS,
  tenorOptions: TENOR_OPTIONS,
  brandList: BRAND_LIST,
  productList: PRODUCT_LIST,
  warnaList: WARNA_LIST,
};

export default function DataManagement() {
  // master harga (brand, name, warna, srp, grosir, kategori)
  const [master, setMaster] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_MASTER_PRICE) || "null");
      return Array.isArray(saved) && saved.length ? saved : HARGA_PENJUALAN;
    } catch {
      return HARGA_PENJUALAN;
    }
  });

  // referensi list
  const [refs, setRefs] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_REF_LISTS) || "null");
      return saved || defaultRefs;
    } catch {
      return defaultRefs;
    }
  });

  const [form, setForm] = useState({
    brand: "",
    name: "",
    warna: "",
    srp: 0,
    grosir: 0,
    kategori: "",
    id: Date.now(),
  });

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    localStorage.setItem(STORAGE_MASTER_PRICE, JSON.stringify(master));
  }, [master]);

  useEffect(() => {
    localStorage.setItem(STORAGE_REF_LISTS, JSON.stringify(refs));
  }, [refs]);

  const filtered = useMemo(() => {
    const q = (search || "").toLowerCase();
    return master.filter(
      (r) =>
        (r.brand || "").toLowerCase().includes(q) ||
        (r.name || "").toLowerCase().includes(q) ||
        (r.warna || "").toLowerCase().includes(q)
    );
  }, [master, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const onChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addRow = () => {
    const row = {
      brand: form.brand,
      name: form.name,
      warna: form.warna,
      srp: toNumber(form.srp),
      grosir: toNumber(form.grosir),
      kategori: form.kategori || "",
      __id: Date.now(),
    };
    setMaster((prev) => [row, ...prev]);
    setForm({ brand: "", name: "", warna: "", srp: 0, grosir: 0, kategori: "", id: Date.now() });
  };
  const editRow = (rid) => {
    const r = master[rid];
    if (!r) return;
    setForm({
      brand: r.brand,
      name: r.name,
      warna: r.warna,
      srp: r.srp,
      grosir: r.grosir,
      kategori: r.kategori,
      id: rid,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const updateRow = () => {
    const idx = typeof form.id === "number" ? form.id : -1;
    if (idx < 0 || !master[idx]) {
      alert("Pilih baris yang akan diupdate (klik Edit).");
      return;
    }
    const row = {
      brand: form.brand,
      name: form.name,
      warna: form.warna,
      srp: toNumber(form.srp),
      grosir: toNumber(form.grosir),
      kategori: form.kategori || "",
    };
    setMaster((prev) => prev.map((x, i) => (i === idx ? row : x)));
    setForm({ brand: "", name: "", warna: "", srp: 0, grosir: 0, kategori: "", id: Date.now() });
  };
  const deleteRow = (rid) => {
    if (!window.confirm("Hapus baris ini?")) return;
    setMaster((prev) => prev.filter((_, i) => i !== rid));
  };

  // Refs management (minimal)
  const addRef = (key, value) => {
    if (!value) return;
    setRefs((r) => ({ ...r, [key]: Array.from(new Set([...(r[key] || []), value])) }));
  };
  const deleteRef = (key, value) => {
    setRefs((r) => ({ ...r, [key]: (r[key] || []).filter((x) => x !== value) }));
  };

  // Export/Import master harga
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(master);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MasterHarga");
    XLSX.writeFile(wb, "MasterDataHargaPenjualan.xlsx");
  };
  const importExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);
      // validasi minimal fields
      const rows = data
        .map((d) => ({
          brand: d.brand ?? d.Brand ?? "",
          name: d.name ?? d.Produk ?? d.Nama ?? "",
          warna: d.warna ?? d.Warna ?? "",
          srp: toNumber(d.srp ?? d.SRP ?? 0),
          grosir: toNumber(d.grosir ?? d.Grosir ?? 0),
          kategori: d.kategori ?? d.Kategori ?? "",
        }))
        .filter((r) => r.name);
      setMaster((prev) => [...rows, ...prev]);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold">Data Management (Master)</h2>

      {/* Form master harga */}
      <div className="bg-white rounded-lg shadow p-4 grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm">Brand</label>
          <input
            list="dm-brand"
            value={form.brand}
            onChange={(e) => onChange("brand", e.target.value)}
            className="w-full border rounded p-2"
          />
          <datalist id="dm-brand">
            {(refs.brandList || []).map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-sm">Nama Produk</label>
          <input
            list="dm-product"
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
            className="w-full border rounded p-2"
          />
          <datalist id="dm-product">
            {(refs.productList || []).map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-sm">Warna</label>
          <input
            list="dm-warna"
            value={form.warna}
            onChange={(e) => onChange("warna", e.target.value)}
            className="w-full border rounded p-2"
          />
          <datalist id="dm-warna">
            {(refs.warnaList || []).map((w) => (
              <option key={w} value={w} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-sm">SRP</label>
          <input
            value={form.srp}
            onChange={(e) => onChange("srp", toNumber(e.target.value))}
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm">Grosir</label>
          <input
            value={form.grosir}
            onChange={(e) => onChange("grosir", toNumber(e.target.value))}
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm">Kategori</label>
          <input
            value={form.kategori}
            onChange={(e) => onChange("kategori", e.target.value)}
            className="w-full border rounded p-2"
            placeholder="(opsional)"
          />
        </div>

        <div className="flex gap-2">
          <button onClick={addRow} className="px-4 py-2 bg-blue-600 text-white rounded">
            Tambah
          </button>
          <button onClick={updateRow} className="px-4 py-2 bg-amber-600 text-white rounded">
            Update Baris
          </button>
          <button onClick={exportExcel} className="px-4 py-2 bg-green-600 text-white rounded">
            Export Excel
          </button>
          <label className="px-4 py-2 bg-gray-100 border rounded cursor-pointer">
            Import Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && importExcel(e.target.files[0])}
            />
          </label>
          <div className="ml-auto">
            <input
              placeholder="Cari brand/produk/warna…"
              className="border rounded p-2"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Table master */}
      <div className="overflow-auto bg-white rounded-lg shadow">
        <table className="min-w-[900px] w-full">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="p-2">Brand</th>
              <th className="p-2">Produk</th>
              <th className="p-2">Warna</th>
              <th className="p-2">SRP</th>
              <th className="p-2">Grosir</th>
              <th className="p-2">Kategori</th>
              <th className="p-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, i) => {
              const ridx = (page - 1) * pageSize + i;
              return (
                <tr key={ridx} className="border-t">
                  <td className="p-2">{r.brand}</td>
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.warna}</td>
                  <td className="p-2">{fmt(r.srp)}</td>
                  <td className="p-2">{fmt(r.grosir)}</td>
                  <td className="p-2">{r.kategori}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => editRow(ridx)}
                        className="px-2 py-1 text-xs bg-amber-500 text-white rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteRow(ridx)}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">
                  Tidak ada data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Refs editor singkat */}
      <div className="bg-white rounded-lg shadow p-4 grid md:grid-cols-3 gap-4">
        <RefEditor
          title="Payment Methods"
          listKey="paymentMethods"
          refs={refs}
          onAdd={addRef}
          onDel={deleteRef}
        />
        <RefEditor
          title="Tenor Options"
          listKey="tenorOptions"
          refs={refs}
          onAdd={addRef}
          onDel={deleteRef}
        />
        <RefEditor
          title="MP Protect Options"
          listKey="mpProtectOptions"
          refs={refs}
          onAdd={addRef}
          onDel={deleteRef}
        />
        <RefEditor
          title="Brand List"
          listKey="brandList"
          refs={refs}
          onAdd={addRef}
          onDel={deleteRef}
        />
        <RefEditor
          title="Product List"
          listKey="productList"
          refs={refs}
          onAdd={addRef}
          onDel={deleteRef}
        />
        <RefEditor
          title="Warna List"
          listKey="warnaList"
          refs={refs}
          onAdd={addRef}
          onDel={deleteRef}
        />
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div>
          Halaman {page} / {totalPages} (Total {filtered.length})
        </div>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={`px-3 py-1 border rounded ${page <= 1 ? "opacity-50" : ""}`}
          >
            Prev
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className={`px-3 py-1 border rounded ${page >= totalPages ? "opacity-50" : ""}`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function RefEditor({ title, listKey, refs, onAdd, onDel }) {
  const [val, setVal] = useState("");
  const list = refs[listKey] || [];
  return (
    <div>
      <div className="font-semibold mb-2">{title}</div>
      <div className="flex gap-2">
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="border rounded p-2 w-full"
          placeholder={`Tambah ${title}…`}
        />
        <button
          onClick={() => {
            onAdd(listKey, val);
            setVal("");
          }}
          className="px-3 py-2 bg-blue-600 text-white rounded"
        >
          Add
        </button>
      </div>
      <div className="mt-2 max-h-40 overflow-auto border rounded p-2">
        {list.map((x) => (
          <div key={x} className="flex justify-between items-center py-1">
            <span className="text-sm">{x}</span>
            <button
              onClick={() => onDel(listKey, x)}
              className="px-2 py-1 text-xs bg-red-600 text-white rounded"
            >
              Hapus
            </button>
          </div>
        ))}
        {list.length === 0 && <div className="text-xs text-gray-500">Kosong.</div>}
      </div>
    </div>
  );
}
