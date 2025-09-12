// src/pages/StockHandphone.jsx
import React, { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// ====== DATA (stock handphone) ======
// Perbaikan: gunakan STOCK_HANDPHONE (bukan STOCK)
import {
  STOCK_HANDPHONE,              // ← array data katalog & stok handphone
  getProductsByBrand,           // (category, brand) => string[] of product names
  getHargaValue,                // ({category, brand, name, warna?, prefer}) => number
} from "../data/StockBarang";

/* ================= Utils ================= */
const unique = (arr) =>
  Array.from(new Set((arr || []).map((x) => (x ?? "").toString().trim()).filter(Boolean)));

const toNum = (v) => (isNaN(Number(v)) ? 0 : Number(v));

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

function downloadWorkbook(wb, filename) {
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([out], { type: "application/octet-stream" });
  saveAs(blob, filename);
}

/* ================= Komponen ================= */
export default function StockHandphone() {
  /* ---------- Data master (katalog HP dari file data) ---------- */
  // Perbaikan: ambil dari STOCK_HANDPHONE
  const katalogHP = Array.isArray(STOCK_HANDPHONE) ? STOCK_HANDPHONE : [];

  const brandOptions = useMemo(
    () => unique(katalogHP.map((it) => it.brand)).sort(),
    [katalogHP]
  );

  /* ---------- Bagian A: Katalog & Stok Model ---------- */
  const [filterBrand, setFilterBrand] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterKeyword, setFilterKeyword] = useState("");

  const typeOptions = useMemo(() => {
    if (!filterBrand) return [];
    // Coba pakai helper; jika tidak ada data, fallback hitung dari katalogHP
    const fromHelper =
      (typeof getProductsByBrand === "function" &&
        (getProductsByBrand("handphone", filterBrand) || [])) ||
      [];
    if (fromHelper.length) return fromHelper;
    return unique(
      katalogHP
        .filter((r) => (r.brand || "").toLowerCase() === filterBrand.toLowerCase())
        .map((r) => r.name)
    );
  }, [filterBrand, katalogHP]);

  const katalogFiltered = useMemo(() => {
    let rows = katalogHP;
    if (filterBrand) rows = rows.filter((r) => (r.brand || "").toLowerCase() === filterBrand.toLowerCase());
    if (filterType) rows = rows.filter((r) => (r.name || "").toLowerCase() === filterType.toLowerCase());
    if (filterKeyword.trim()) {
      const q = filterKeyword.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          (r.brand || "").toLowerCase().includes(q) ||
          (r.name || "").toLowerCase().includes(q)
      );
    }
    return rows;
  }, [katalogHP, filterBrand, filterType, filterKeyword]);

  const totalStokModel = useMemo(
    () => katalogFiltered.reduce((acc, r) => acc + (Number(r.stock) || 0), 0),
    [katalogFiltered]
  );

  const exportKatalogToExcel = () => {
    const data = katalogFiltered.map((r) => ({
      BRAND: r.brand,
      TIPE: r.name,
      SRP: r.srp || 0,
      GROSIR: r.grosir || 0,
      HARGA: r.harga || 0,
      STOK: r.stock || 0,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Katalog_Handphone");
    downloadWorkbook(wb, "Katalog_Handphone.xlsx");
  };

  /* ---------- Bagian B: Registrasi / Mutasi Unit (IMEI) ---------- */
  const [rows, setRows] = useState(() => [
    { id: 1, customer: "John Doe",  salesName: "Sarah Lee",   imei: "1234567890", phone: "08123456789", price: 5000000, brand: "Apple",   type: "iPhone 12",    warranty: "1 Tahun" },
    { id: 2, customer: "Jane Smith",salesName: "Michael Tan", imei: "0987654321", phone: "08234567890", price: 6500000, brand: "Samsung", type: "Galaxy S21",  warranty: "2 Tahun" },
  ]);

  const [searchRegis, setSearchRegis] = useState("");
  const fileInputRef = useRef(null);

  const filteredRows = useMemo(() => {
    if (!searchRegis.trim()) return rows;
    const q = searchRegis.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (r.customer || "").toLowerCase().includes(q) ||
        (r.salesName || "").toLowerCase().includes(q) ||
        (r.imei || "").toLowerCase().includes(q) ||
        (r.phone || "").toLowerCase().includes(q) ||
        (r.brand || "").toLowerCase().includes(q) ||
        (r.type || "").toLowerCase().includes(q)
    );
  }, [rows, searchRegis]);

  // Form registrasi
  const [newForm, setNewForm] = useState({
    customer: "",
    salesName: "",
    imei: "",
    phone: "",
    brand: "",
    type: "",
    price: 0,
    warranty: "",
  });

  const typeOptionsForForm = useMemo(() => {
    if (!newForm.brand) return [];
    const helper =
      (typeof getProductsByBrand === "function" &&
        (getProductsByBrand("handphone", newForm.brand) || [])) ||
      [];
    if (helper.length) return helper;
    return unique(
      katalogHP
        .filter((r) => (r.brand || "").toLowerCase() === (newForm.brand || "").toLowerCase())
        .map((r) => r.name)
    );
  }, [newForm.brand, katalogHP]);

  const onChangeForm = (field, value) => {
    setNewForm((f) => ({ ...f, [field]: value }));
  };

  const onChangeBrandForm = (brand) => {
    setNewForm((f) => ({
      ...f,
      brand,
      type: "",
      price: 0,
    }));
  };

  const onChangeTypeForm = (name) => {
    // auto harga dari data stock (prioritas SRP → Grosir → Harga)
    const hargaAuto =
      (typeof getHargaValue === "function" &&
        (getHargaValue({ category: "handphone", brand: newForm.brand, name, prefer: "srp" }) ||
          getHargaValue({ category: "handphone", brand: newForm.brand, name, prefer: "grosir" }) ||
          getHargaValue({ category: "handphone", brand: newForm.brand, name, prefer: "harga" }))) ||
      0;

    setNewForm((f) => ({
      ...f,
      type: name,
      price: hargaAuto,
    }));
  };

  const addRow = () => {
    if (!newForm.brand || !newForm.type || !newForm.imei) {
      alert("Brand, Tipe, dan IMEI wajib diisi.");
      return;
    }
    const nextId = rows.length ? Math.max(...rows.map((r) => Number(r.id) || 0)) + 1 : 1;
    setRows((prev) => [
      {
        id: nextId,
        customer: newForm.customer || "",
        salesName: newForm.salesName || "",
        imei: (newForm.imei || "").trim(),
        phone: newForm.phone || "",
        brand: newForm.brand || "",
        type: newForm.type || "",
        price: toNum(newForm.price),
        warranty: newForm.warranty || "",
      },
      ...prev,
    ]);
    setNewForm({
      customer: "",
      salesName: "",
      imei: "",
      phone: "",
      brand: "",
      type: "",
      price: 0,
      warranty: "",
    });
  };

  const exportRegistrasiToExcel = () => {
    const data = filteredRows.map((r) => ({
      ID: r.id,
      CUSTOMER: r.customer,
      SALES: r.salesName,
      IMEI: r.imei,
      PHONE: r.phone,
      BRAND: r.brand,
      TIPE: r.type,
      HARGA: r.price,
      GARANSI: r.warranty,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Registrasi_Unit_HP");
    downloadWorkbook(wb, "Registrasi_Unit_Handphone.xlsx");
  };

  const onImportRegistrasi = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { defval: "" });

      // Normalizer kolom populer:
      const lowered = json.map((row) => {
        const L = Object.fromEntries(
          Object.entries(row).map(([k, v]) => [String(k).trim().toLowerCase(), v])
        );
        const pick = (...keys) => {
          for (const k of keys) {
            if (k in L && L[k] !== null && L[k] !== undefined && `${L[k]}`.trim() !== "") {
              return L[k];
            }
          }
          return "";
        };
        return {
          customer: pick("customer", "nama pelanggan", "pelanggan", "customer name"),
          salesName: pick("sales", "salesname", "nama sales"),
          imei: `${pick("imei", "emei", "serial")}`.trim(),
          phone: pick("phone", "no hp", "hp", "wa", "whatsapp"),
          brand: pick("brand", "merek", "merk"),
          type: pick("tipe", "type", "model", "handphone"),
          price: toNum(pick("harga", "price", "amount")),
          warranty: pick("garansi", "warranty"),
        };
      });

      const nextBase = rows.length ? Math.max(...rows.map((r) => Number(r.id) || 0)) + 1 : 1;
      const withIds = lowered.map((r, i) => ({ id: nextBase + i, ...r }));
      setRows((prev) => [...withIds, ...prev]);
    } catch (err) {
      console.error("Import error:", err);
      alert("Gagal membaca Excel. Pastikan format kolomnya benar.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Edit/Delete
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
    setRows((prev) =>
      prev.map((r) => (r.id === editingId ? { ...editDraft, price: toNum(editDraft.price) } : r))
    );
    cancelEdit();
  };
  const deleteRow = (id) => {
    if (!window.confirm("Hapus baris ini?")) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  /* ================= Render ================= */
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Produk & Stok — Handphone</h1>

      {/* ================= A. Katalog & Stok Model ================= */}
      <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Katalog & Stok Model (dari data)</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={exportKatalogToExcel}
              className="rounded-lg border bg-white px-3 py-2 text-sm shadow-sm hover:bg-slate-50"
            >
              Export Katalog (.xlsx)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div>
            <label className="text-xs text-slate-600">Brand</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={filterBrand}
              onChange={(e) => {
                setFilterBrand(e.target.value);
                setFilterType("");
              }}
            >
              <option value="">— Semua Brand —</option>
              {brandOptions.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">Tipe</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              disabled={!filterBrand}
            >
              <option value="">— Semua Tipe —</option>
              {typeOptions.map((t) => (
                <option key={`${filterBrand}-${t}`} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="text-xs text-slate-600">Cari (brand/tipe)</label>
            <input
              className="w-full border rounded px-2 py-1"
              placeholder="Ketik kata kunci…"
              value={filterKeyword}
              onChange={(e) => setFilterKeyword(e.target.value)}
            />
          </div>
        </div>

        <div className="text-sm text-slate-600">
          Total model: <span className="font-semibold">{katalogFiltered.length}</span> • Total stok unit:
          <span className="font-semibold"> {totalStokModel}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[800px] text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left">Brand</th>
                <th className="px-3 py-2 text-left">Tipe</th>
                <th className="px-3 py-2 text-right">SRP</th>
                <th className="px-3 py-2 text-right">Grosir</th>
                <th className="px-3 py-2 text-right">Harga</th>
                <th className="px-3 py-2 text-right">Stock</th>
              </tr>
            </thead>
            <tbody>
              {katalogFiltered.map((r, idx) => (
                <tr key={`${r.brand}-${r.name}-${idx}`} className="border-b last:border-0">
                  <td className="px-3 py-2">{r.brand}</td>
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(r.srp || 0)}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(r.grosir || 0)}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(r.harga || 0)}</td>
                  <td className="px-3 py-2 text-right">{r.stock || 0}</td>
                </tr>
              ))}
              {!katalogFiltered.length && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                    Tidak ada data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= B. Registrasi / Mutasi Unit (IMEI) ================= */}
      <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-4">
        <h2 className="text-lg font-semibold">Registrasi / Mutasi Unit</h2>

        {/* Form */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">Brand</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={newForm.brand}
              onChange={(e) => onChangeBrandForm(e.target.value)}
            >
              <option value="">— Pilih Brand —</option>
              {brandOptions.map((b) => (
                <option key={`form-brand-${b}`} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">Tipe Handphone</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={newForm.type}
              onChange={(e) => onChangeTypeForm(e.target.value)}
              disabled={!newForm.brand}
            >
              <option value="">— Pilih Tipe —</option>
              {typeOptionsForForm.map((t) => (
                <option key={`form-type-${newForm.brand}-${t}`} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-600">Harga</label>
            <input
              type="number"
              min={0}
              className="w-full border rounded px-2 py-1 text-right"
              value={newForm.price}
              onChange={(e) => onChangeForm("price", toNum(e.target.value))}
              placeholder="Harga otomatis dari data"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">IMEI</label>
            <input
              className="w-full border rounded px-2 py-1"
              value={newForm.imei}
              onChange={(e) => onChangeForm("imei", e.target.value)}
              placeholder="Nomor IMEI perangkat"
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">Nama Pelanggan</label>
            <input
              className="w-full border rounded px-2 py-1"
              value={newForm.customer}
              onChange={(e) => onChangeForm("customer", e.target.value)}
              placeholder="Nama Pelanggan"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">Nama Sales</label>
            <input
              className="w-full border rounded px-2 py-1"
              value={newForm.salesName}
              onChange={(e) => onChangeForm("salesName", e.target.value)}
              placeholder="Nama Sales"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">No. Telepon</label>
            <input
              className="w-full border rounded px-2 py-1"
              value={newForm.phone}
              onChange={(e) => onChangeForm("phone", e.target.value)}
              placeholder="No HP/WA"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">Garansi</label>
            <input
              className="w-full border rounded px-2 py-1"
              value={newForm.warranty}
              onChange={(e) => onChangeForm("warranty", e.target.value)}
              placeholder="1 Tahun / 2 Tahun ..."
            />
          </div>
        </div>

        <div>
          <button
            onClick={addRow}
            className="mt-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold shadow-sm"
          >
            Tambah Registrasi
          </button>
        </div>

        {/* Toolbar tabel registrasi */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Total registrasi: <span className="font-semibold">{filteredRows.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".xlsx"
              ref={fileInputRef}
              onChange={onImportRegistrasi}
              className="hidden"
              id="import-registrasi-input"
            />
            <label
              htmlFor="import-registrasi-input"
              className="cursor-pointer rounded-lg border bg-white px-3 py-2 text-sm shadow-sm hover:bg-slate-50"
              title="Import Excel (.xlsx)"
            >
              Import (.xlsx)
            </label>
            <button
              onClick={exportRegistrasiToExcel}
              className="rounded-lg border bg-white px-3 py-2 text-sm shadow-sm hover:bg-slate-50"
            >
              Export (.xlsx)
            </button>
            <input
              className="border rounded px-2 py-1 text-sm"
              placeholder="Cari registrasi (nama/sales/imei/brand/tipe)…"
              value={searchRegis}
              onChange={(e) => setSearchRegis(e.target.value)}
            />
          </div>
        </div>

        {/* Tabel registrasi */}
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-left">Customer</th>
                <th className="px-3 py-2 text-left">Sales</th>
                <th className="px-3 py-2 text-left">IMEI</th>
                <th className="px-3 py-2 text-left">Brand</th>
                <th className="px-3 py-2 text-left">Tipe</th>
                <th className="px-3 py-2 text-right">Harga</th>
                <th className="px-3 py-2 text-left">Phone</th>
                <th className="px-3 py-2 text-left">Garansi</th>
                <th className="px-3 py-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const isEditing = editingId === row.id;
                if (isEditing && editDraft) {
                  return (
                    <tr key={row.id} className="border-b last:border-0 bg-slate-50/50">
                      <td className="px-3 py-2">{row.id}</td>
                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1 w-40"
                          value={editDraft.customer}
                          onChange={(e) =>
                            setEditDraft((d) => ({ ...d, customer: e.target.value }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1 w-36"
                          value={editDraft.salesName}
                          onChange={(e) =>
                            setEditDraft((d) => ({ ...d, salesName: e.target.value }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1 w-40"
                          value={editDraft.imei}
                          onChange={(e) => setEditDraft((d) => ({ ...d, imei: e.target.value }))}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1 w-32"
                          value={editDraft.brand}
                          onChange={(e) => setEditDraft((d) => ({ ...d, brand: e.target.value }))}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1 w-40"
                          value={editDraft.type}
                          onChange={(e) => setEditDraft((d) => ({ ...d, type: e.target.value }))}
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          className="border rounded px-2 py-1 text-right w-28"
                          value={editDraft.price}
                          onChange={(e) =>
                            setEditDraft((d) => ({ ...d, price: toNum(e.target.value) }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1 w-40"
                          value={editDraft.phone}
                          onChange={(e) => setEditDraft((d) => ({ ...d, phone: e.target.value }))}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1 w-32"
                          value={editDraft.warranty}
                          onChange={(e) =>
                            setEditDraft((d) => ({ ...d, warranty: e.target.value }))
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
                  );
                }

                return (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="px-3 py-2">{row.id}</td>
                    <td className="px-3 py-2">{row.customer}</td>
                    <td className="px-3 py-2">{row.salesName}</td>
                    <td className="px-3 py-2">{row.imei}</td>
                    <td className="px-3 py-2">{row.brand}</td>
                    <td className="px-3 py-2">{row.type}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(row.price)}</td>
                    <td className="px-3 py-2">{row.phone}</td>
                    <td className="px-3 py-2">{row.warranty}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
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

              {!filteredRows.length && (
                <tr>
                  <td colSpan={10} className="px-3 py-6 text-center text-slate-500">
                    Belum ada data registrasi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        • Bagian atas menampilkan katalog & stok dari file data. • Bagian bawah untuk registrasi unit (IMEI),
        lengkap dengan import/export Excel. • Harga otomatis terisi saat Tipe dipilih berdasarkan data.
      </p>
    </div>
  );
}
