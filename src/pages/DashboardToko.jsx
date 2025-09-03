import React, { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import * as MasterData from "../data/MasterDataPenjualan";

// ---------------- Nama Toko Override ----------------
const TOKO_NAME_MAP = {
  1: "Toko Cilangkap",
  2: "Toko KONTEN LIVE",
  3: "Toko GAS ALAM",
  4: "Toko KOTA WISATA", // pakai yang terakhir kamu minta
  5: "Toko CIRACAS",
  6: "Toko METLAND 1",
  7: "Toko METLAND 2",
  8: "Toko PITARA",
  // 9, 10 fallback default
};

// ---------------- Ambil master toko dari MasterData + override ----------------
function resolveTokoList(md) {
  const candArray = md.MASTER_TOKO || md.TOKO_LIST || md.tokoList || md.default || md.toko || [];
  const toObj = (id, name) => ({ id, name: TOKO_NAME_MAP[id] ?? name });

  if (Array.isArray(candArray)) {
    const arr = candArray
      .map((t) => {
        if (!t) return null;
        const id =
          t.id ??
          t.ID ??
          t.tokoId ??
          (typeof t.key === "number" ? t.key : undefined);
        const name = t.nama ?? t.name ?? t.nama_toko ?? t.toko ?? t.label ?? t.title;
        if (typeof id === "number" && name) return toObj(id, name);
        return null;
      })
      .filter(Boolean);
    // gabung override yang mungkin belum ada
    Object.entries(TOKO_NAME_MAP).forEach(([idStr, nm]) => {
      const id = Number(idStr);
      if (!arr.find((x) => x.id === id)) arr.push({ id, name: nm });
    });
    return arr.sort((a, b) => a.id - b.id);
  }

  if (candArray && typeof candArray === "object") {
    const arr = Object.entries(candArray)
      .map(([k, v]) => {
        const id = Number(k);
        const rawName = String(v);
        return toObj(id, rawName);
      })
      .filter(Boolean);
    Object.entries(TOKO_NAME_MAP).forEach(([idStr, nm]) => {
      const id = Number(idStr);
      if (!arr.find((x) => x.id === id)) arr.push({ id, name: nm });
    });
    return arr.sort((a, b) => a.id - b.id);
  }

  // fallback: hanya override
  return Object.entries(TOKO_NAME_MAP)
    .map(([id, name]) => ({ id: Number(id), name }))
    .sort((a, b) => a.id - b.id);
}

// ---------------- Ekstrak master produk/brand/warna/kategori ----------------
function extractMasterSets(md) {
  const candidates = Object.values(md).filter((v) => Array.isArray(v));
  const prodRows = [];

  // Cari array of objects yang terlihat seperti katalog produk (ada srp/grosir/type/brand)
  for (const arr of candidates) {
    if (!Array.isArray(arr) || arr.length === 0) continue;
    const sample = arr[0];
    if (sample && typeof sample === "object") {
      const keys = Object.keys(sample).map((k) => k.toLowerCase());
      const hasPrice = keys.some((k) => ["srp", "grosir", "price", "harga"].includes(k));
      const hasName = keys.some((k) =>
        ["sepedalistrik", "sepeda listrik", "type", "tipe", "produk", "product", "name", "nama"].includes(k)
      );
      if (hasPrice && hasName) {
        // Normalisasi semua row
        for (const r of arr) {
          const lower = Object.fromEntries(
            Object.entries(r).map(([k, v]) => [String(k).toLowerCase(), v])
          );
          prodRows.push({
            brand:
              lower["brand"] ??
              lower["merk"] ??
              lower["merek"] ??
              lower["kategori"] ??
              lower["category"] ??
              "",
            name:
              lower["sepedalistrik"] ??
              lower["sepeda listrik"] ??
              lower["type"] ??
              lower["tipe"] ??
              lower["produk"] ??
              lower["product"] ??
              lower["name"] ??
              lower["nama"] ??
              "",
            warna: lower["warna"] ?? "",
            srp: Number(lower["srp"] ?? lower["price"] ?? lower["harga"] ?? 0),
            grosir: Number(lower["grosir"] ?? 0),
            kategori:
              lower["kategori"] ??
              lower["category"] ??
              (lower["brand"] ? "Motor Listrik" : "") ??
              "",
          });
        }
      }
    }
  }

  // set unik
  const brands = Array.from(new Set(prodRows.map((r) => r.brand).filter(Boolean))).sort();
  const colors = Array.from(new Set(prodRows.map((r) => r.warna).filter(Boolean))).sort();
  const categories = Array.from(new Set(prodRows.map((r) => r.kategori).filter(Boolean))).sort();

  return { products: prodRows, brands, colors, categories };
}

function formatCurrency(n) {
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n || 0);
  } catch {
    return `Rp ${Number(n || 0).toLocaleString("id-ID")}`;
  }
}

// ---------------- Normalisasi baris dari Excel (PO/LIST) ----------------
function normalizeRowFromExcel(row) {
  const lower = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [String(k).trim().toLowerCase(), v])
  );
  const pick = (...names) => {
    for (const n of names) {
      const v = lower[n.toLowerCase()];
      if (v !== undefined && v !== null && v !== "") return v;
    }
    return undefined;
  };

  // tanggal
  let tanggal = pick("tanggal", "tgl transaksi", "tgl", "tanggal transaksi", "date");
  if (tanggal instanceof Date) {
    tanggal = tanggal.toISOString().slice(0, 10);
  } else if (typeof tanggal === "number") {
    const d = XLSX.SSF.parse_date_code(tanggal);
    if (d) {
      const dt = new Date(Date.UTC(d.y, d.m - 1, d.d));
      tanggal = dt.toISOString().slice(0, 10);
    }
  } else if (typeof tanggal === "string") {
    // biarkan
  }

  const brand = pick("brand", "merk", "merek");
  const kategori = pick("kategori", "category") || (brand ? "Motor Listrik" : "Lainnya");
  const produk =
    pick("sepeda listrik", "sepedalistrik", "type", "tipe", "produk", "product", "name", "nama") ||
    "Produk";
  const warna = pick("warna");
  const qty = Number(pick("qty", "jumlah", "kuantitas") || 0);
  const srp = Number(pick("srp", "price", "harga") || 0);
  const grosir = Number(pick("grosir") || 0);
  const tokoName = pick("toko", "store", "outlet", "nama toko");

  // default harga pakai grosir bila ada, kalau tidak SRP
  const hargaType = grosir ? "GROSIR" : "SRP";
  const harga = hargaType === "GROSIR" ? grosir : srp;

  return { tanggal, brand, kategori, produk, warna, qty, srp, grosir, hargaType, harga, tokoName };
}

// ---------------- Filter baris Excel berdasarkan toko aktif ----------------
function filterByToko(rows, tokoName) {
  if (!tokoName) return rows;
  const t = String(tokoName).trim().toLowerCase();
  return rows.filter((r) => {
    if (!r.tokoName) return true;
    return String(r.tokoName).trim().toLowerCase() === t;
  });
}

export default function DashboardToko({ tokoId, initialData = [] }) {
  const tokoList = useMemo(() => resolveTokoList(MasterData), []);
  const tokoName = useMemo(() => {
    const found = tokoList.find((t) => t.id === Number(tokoId));
    return found?.name || TOKO_NAME_MAP[Number(tokoId)] || `Toko ${tokoId}`;
  }, [tokoList, tokoId]);

  const { products, brands, colors, categories } = useMemo(
    () => extractMasterSets(MasterData),
    []
  );

  // ---------- State data gabungan ----------
  const [rows, setRows] = useState(() => {
    // normalisasi initialData ke bentuk baru (tambahkan field yang kurang)
    return (initialData || []).map((r, i) => ({
      id: r.id ?? i + 1,
      tanggal: r.tanggal,
      brand: r.brand ?? r.kategori ?? "",
      kategori: r.kategori ?? "",
      produk: r.produk,
      warna: r.warna ?? "",
      qty: Number(r.qty || 0),
      srp: Number(r.srp || 0),
      grosir: Number(r.grosir || 0),
      hargaType: r.hargaType || (r.grosir ? "GROSIR" : "SRP"),
      harga: Number(r.harga || (r.grosir ? r.grosir : r.srp) || 0),
      approved: !!r.approved,
    }));
  });

  // ---------- Ringkasan ----------
  const { totalTransaksi, totalQty, totalOmzet } = useMemo(() => {
    const totals = rows.reduce(
      (acc, row) => {
        acc.totalTransaksi += 1;
        acc.totalQty += Number(row.qty || 0);
        acc.totalOmzet += Number(row.harga || 0) * Number(row.qty || 0);
        return acc;
      },
      { totalTransaksi: 0, totalQty: 0, totalOmzet: 0 }
    );
    return totals;
  }, [rows]);

  // ---------- Form tambah ----------
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    kategori: categories[0] || "Motor Listrik",
    brand: brands[0] || "",
    produk: "",
    warna: "",
    qty: 1,
    hargaType: "GROSIR",
    srp: 0,
    grosir: 0,
    harga: 0,
  });

  // produk list by brand
  const productOptions = useMemo(() => {
    const filtered = products.filter((p) =>
      form.brand ? String(p.brand).toLowerCase() === String(form.brand).toLowerCase() : true
    );
    // unique by name
    const seen = new Set();
    return filtered.filter((p) => {
      const key = (p.name || "").toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [products, form.brand]);

  // warna options tergantung produk terpilih (kalau ada), jika tidak, semua warna di brand
  const warnaOptions = useMemo(() => {
    const base = form.produk
      ? products.filter(
          (p) =>
            String(p.name).toLowerCase() === String(form.produk).toLowerCase() &&
            (!form.brand ||
              String(p.brand).toLowerCase() === String(form.brand).toLowerCase())
        )
      : products.filter((p) =>
          form.brand ? String(p.brand).toLowerCase() === String(form.brand).toLowerCase() : true
        );
    const set = new Set(base.map((b) => b.warna).filter(Boolean));
    const list = Array.from(set).sort();
    return list.length ? list : colors;
  }, [products, colors, form.brand, form.produk]);

  // ketika ganti produk, isi SRP/GROSIR default dari master
  const applyPriceFromProduct = (prodName, brandName) => {
    const match = products.find(
      (p) =>
        String(p.name).toLowerCase() === String(prodName).toLowerCase() &&
        (!brandName || String(p.brand).toLowerCase() === String(brandName).toLowerCase())
    );
    if (match) {
      const srp = Number(match.srp || 0);
      const grosir = Number(match.grosir || 0);
      const hargaType = grosir ? "GROSIR" : "SRP";
      const harga = hargaType === "GROSIR" ? grosir : srp;
      setForm((f) => ({
        ...f,
        srp,
        grosir,
        hargaType,
        harga,
        kategori: match.kategori || f.kategori,
      }));
    }
  };

  // handlers form
  const onChangeBrand = (val) => {
    setForm((f) => ({ ...f, brand: val, produk: "", warna: "" }));
  };
  const onChangeProduk = (val) => {
    setForm((f) => ({ ...f, produk: val }));
    applyPriceFromProduct(val, form.brand);
  };
  const onChangeHargaType = (val) => {
    setForm((f) => ({
      ...f,
      hargaType: val,
      harga: val === "GROSIR" ? Number(f.grosir || 0) : Number(f.srp || 0),
    }));
  };

  const addRow = () => {
    const newRow = {
      id: rows.length ? Math.max(...rows.map((r) => Number(r.id) || 0)) + 1 : 1,
      tanggal: form.tanggal || new Date().toISOString().slice(0, 10),
      brand: form.brand || "",
      kategori: form.kategori || "Motor Listrik",
      produk: form.produk || "Produk",
      warna: form.warna || "",
      qty: Number(form.qty || 0),
      srp: Number(form.srp || 0),
      grosir: Number(form.grosir || 0),
      hargaType: form.hargaType,
      harga: Number(form.harga || 0),
      approved: false,
    };
    setRows((prev) => [newRow, ...prev]);
    setForm((f) => ({
      ...f,
      produk: "",
      warna: "",
      qty: 1,
      harga: f.hargaType === "GROSIR" ? f.grosir : f.srp,
    }));
  };

  // ---------- Import Excel ----------
  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      const sheetName =
        wb.SheetNames.find((n) => n.toUpperCase() === "LIST") ||
        wb.SheetNames.find((n) => n.toUpperCase() === "PO") ||
        wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(ws, { defval: "" });

      let normalized = json.map(normalizeRowFromExcel);
      normalized = filterByToko(normalized, tokoName);

      const todayStr = new Date().toISOString().slice(0, 10);
      const toRows = normalized.map((r, i) => ({
        id: rows.length + i + 1,
        tanggal: r.tanggal || todayStr,
        brand: r.brand || "",
        kategori: r.kategori || (r.brand ? "Motor Listrik" : "Lainnya"),
        produk: r.produk || "Produk",
        warna: r.warna || "",
        qty: Number(r.qty || 0),
        srp: Number(r.srp || 0),
        grosir: Number(r.grosir || 0),
        hargaType: r.hargaType || (r.grosir ? "GROSIR" : "SRP"),
        harga: Number(r.harga || (r.grosir ? r.grosir : r.srp) || 0),
        approved: false,
      }));

      setRows((prev) => [...prev, ...toRows]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Gagal memproses Excel:", err);
      alert("File Excel tidak dikenali. Pastikan format kolomnya benar.");
    }
  };

  // ---------- Export Excel ----------
  const handleExportExcel = () => {
    const data = rows.map((r) => ({
      TANGGAL: r.tanggal,
      TOKO: tokoName,
      BRAND: r.brand,
      TYPE: r.produk,
      WARNA: r.warna,
      QTY: r.qty,
      SRP: r.srp,
      GROSIR: r.grosir,
      HARGA_DIPAKAI: r.hargaType,
      HARGA: r.harga,
      SUBTOTAL: Number(r.harga || 0) * Number(r.qty || 0),
      STATUS: r.approved ? "APPROVED" : "DRAFT",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PO");
    const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    XLSX.writeFile(wb, `PO_${tokoName.replace(/\s+/g, "_")}_${ymd}.xlsx`);
  };

  // ---------- Edit/Delete/Approve ----------
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);

  const beginEdit = (row) => {
    setEditingId(row.id);
    setEditDraft({ ...row });
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };
  const saveEdit = () => {
    setRows((prev) => prev.map((r) => (r.id === editingId ? { ...editDraft } : r)));
    cancelEdit();
  };
  const deleteRow = (id) => {
    if (!window.confirm("Hapus baris ini?")) return; // ⬅️ pakai window.confirm
    setRows((prev) => prev.filter((r) => r.id !== id));
  };
  const approveRow = (id) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, approved: true } : r)));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard Toko — {tokoName}</h1>
          <p className="text-slate-600">
            Ringkasan performa penjualan & stok untuk {tokoName}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={handleImportExcel}
            className="hidden"
            id="excel-input"
          />
          <label
            htmlFor="excel-input"
            className="cursor-pointer rounded-lg border bg-white px-3 py-2 text-sm shadow-sm hover:bg-slate-50"
            title="Import Excel (.xlsx)"
          >
            Import Excel (.xlsx)
          </label>
          <button
            onClick={handleExportExcel}
            className="rounded-lg border bg-white px-3 py-2 text-sm shadow-sm hover:bg-slate-50"
            title="Export Excel (.xlsx)"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* Cards ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Total Transaksi</div>
          <div className="mt-1 text-2xl font-semibold">{totalTransaksi}</div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Total Qty</div>
          <div className="mt-1 text-2xl font-semibold">{totalQty}</div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Total Omzet</div>
          <div className="mt-1 text-2xl font-semibold">
            {formatCurrency(totalOmzet)}
          </div>
        </div>
      </div>

      {/* Form tambah data */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Tambah Data</h2>
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

          <div>
            <label className="text-xs text-slate-600">Kategori</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={form.kategori}
              onChange={(e) => setForm({ ...form, kategori: e.target.value })}
            >
              {[...categories, "Accessories", "Motor Listrik", "Handphone", "Service"]
                .filter((v, i, a) => v && a.indexOf(v) === i)
                .map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-600">Brand</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={form.brand}
              onChange={(e) => onChangeBrand(e.target.value)}
            >
              <option value="">— Pilih Brand —</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">Produk</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={form.produk}
              onChange={(e) => onChangeProduk(e.target.value)}
            >
              <option value="">— Pilih Produk —</option>
              {productOptions.map((p) => (
                <option key={`${p.brand}-${p.name}`} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-600">Warna</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={form.warna}
              onChange={(e) => setForm({ ...form, warna: e.target.value })}
            >
              <option value="">— Pilih Warna —</option>
              {warnaOptions.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-600">Qty</label>
            <input
              type="number"
              min={0}
              className="w-full border rounded px-2 py-1 text-right"
              value={form.qty}
              onChange={(e) => setForm({ ...form, qty: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">Harga Pakai</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={form.hargaType}
              onChange={(e) => onChangeHargaType(e.target.value)}
            >
              <option value="GROSIR">GROSIR</option>
              <option value="SRP">SRP</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-600">SRP</label>
            <input
              type="number"
              min={0}
              className="w-full border rounded px-2 py-1 text-right"
              value={form.srp}
              onChange={(e) => setForm({ ...form, srp: Number(e.target.value || 0) })}
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">GROSIR</label>
            <input
              type="number"
              min={0}
              className="w-full border rounded px-2 py-1 text-right"
              value={form.grosir}
              onChange={(e) => setForm({ ...form, grosir: Number(e.target.value || 0) })}
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">Harga</label>
            <input
              type="number"
              min={0}
              className="w-full border rounded px-2 py-1 text-right"
              value={form.harga}
              onChange={(e) => setForm({ ...form, harga: Number(e.target.value || 0) })}
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

      {/* Tabel transaksi */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Transaksi Terbaru</h2>
          <span className="text-sm text-slate-500">{rows.length} item</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left">Tanggal</th>
                <th className="px-3 py-2 text-left">Kategori</th>
                <th className="px-3 py-2 text-left">Brand</th>
                <th className="px-3 py-2 text-left">Produk</th>
                <th className="px-3 py-2 text-left">Warna</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-right">Harga</th>
                <th className="px-3 py-2 text-right">Subtotal</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isEditing = editingId === row.id;
                const subtotal = Number(row.harga || 0) * Number(row.qty || 0);

                if (isEditing) {
                  return (
                    <tr key={row.id} className="border-b last:border-0 bg-slate-50/50">
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          className="border rounded px-2 py-1"
                          value={editDraft.tanggal}
                          onChange={(e) =>
                            setEditDraft((d) => ({ ...d, tanggal: e.target.value }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1"
                          value={editDraft.kategori}
                          onChange={(e) =>
                            setEditDraft((d) => ({ ...d, kategori: e.target.value }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1"
                          value={editDraft.brand}
                          onChange={(e) =>
                            setEditDraft((d) => ({ ...d, brand: e.target.value }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1"
                          value={editDraft.produk}
                          onChange={(e) =>
                            setEditDraft((d) => ({ ...d, produk: e.target.value }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1"
                          value={editDraft.warna}
                          onChange={(e) =>
                            setEditDraft((d) => ({ ...d, warna: e.target.value }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          className="border rounded px-2 py-1 text-right w-24"
                          value={editDraft.qty}
                          onChange={(e) =>
                            setEditDraft((d) => ({ ...d, qty: Number(e.target.value || 0) }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          className="border rounded px-2 py-1 text-right w-28"
                          value={editDraft.harga}
                          onChange={(e) =>
                            setEditDraft((d) => ({ ...d, harga: Number(e.target.value || 0) }))
                          }
                        />
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          ({editDraft.hargaType}) SRP:{formatCurrency(editDraft.srp)} /
                          GRS:{formatCurrency(editDraft.grosir)}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">{formatCurrency((editDraft.harga || 0) * (editDraft.qty || 0))}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[11px]">
                          {editDraft.approved ? "APPROVED" : "DRAFT"}
                        </span>
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
                  );
                }

                return (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="px-3 py-2">{row.tanggal}</td>
                    <td className="px-3 py-2">{row.kategori}</td>
                    <td className="px-3 py-2">{row.brand}</td>
                    <td className="px-3 py-2">{row.produk}</td>
                    <td className="px-3 py-2">{row.warna}</td>
                    <td className="px-3 py-2 text-right">{row.qty}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(row.harga)}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(subtotal)}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${
                          row.approved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {row.approved ? "APPROVED" : "DRAFT"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        {!row.approved && (
                          <button
                            onClick={() => approveRow(row.id)}
                            className="px-2 py-1 text-xs rounded bg-emerald-600 text-white hover:bg-emerald-700"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => beginEdit(row)}
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
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-6 text-center text-slate-500">
                    Belum ada data transaksi untuk {tokoName}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Rumus PO: <code>Subtotal = Qty × HargaDipakai</code>. HargaDipakai mengikuti pilihan
          <code> GROSIR/SRP</code> serta akan otomatis terisi saat memilih produk (jika tersedia di master).
          Import Excel mendukung kolom: <code>TANGGAL/Tgl</code>, <code>QTY</code>, <code>SRP/GROSIR</code>,
          <code> STORE/SEPEDA LISTRIK/TYPE</code>, <code> BRAND</code>, <code> WARNA</code>, dan opsional <code>TOKO</code>.
        </p>
      </div>

      <p className="text-xs text-slate-500">
        Nama toko diambil dari <code>MasterDataPenjualan.jsx</code> dengan override sesuai instruksi.
        Jika nama tidak ditemukan, fallback ke <strong>Toko {tokoId}</strong>.
      </p>
    </div>
  );
}
