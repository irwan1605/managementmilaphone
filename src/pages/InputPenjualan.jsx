import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import * as ListData from "../data/ListDataPenjualan";

/* ===================== Helpers ===================== */
const toNum = (v) => (isNaN(Number(v)) ? 0 : Number(v));
const unique = (arr) =>
  Array.from(new Set((arr || []).map((x) => (x ?? "").toString().trim()).filter(Boolean)));
const fmtIDR = (n) => {
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n || 0);
  } catch {
    return `Rp ${Number(n || 0).toLocaleString("id-ID")}`;
  }
};
const rSafe = (s) => (s || "").replace(/[^\p{L}\p{N}_-]+/gu, "_");

/* ===================== Data getters ===================== */
function getTokoList() {
  return Array.isArray(ListData.TOKO_LIST) ? ListData.TOKO_LIST : [];
}
function getBrands() {
  if (Array.isArray(ListData.BRAND_LIST) && ListData.BRAND_LIST.length) return ListData.BRAND_LIST;
  if (ListData.CATALOG_INDEX && typeof ListData.CATALOG_INDEX === "object") {
    return Object.keys(ListData.CATALOG_INDEX);
  }
  return [];
}
function getProducts(brand) {
  if (typeof ListData.getProductsByBrand === "function") {
    const out = ListData.getProductsByBrand(brand);
    if (Array.isArray(out) && out.length) return out;
  }
  if (brand && ListData.CATALOG_INDEX && ListData.CATALOG_INDEX[brand]) {
    return Object.keys(ListData.CATALOG_INDEX[brand]);
  }
  if (Array.isArray(ListData.PRODUCT_LIST) && ListData.PRODUCT_LIST.length) {
    return ListData.PRODUCT_LIST;
  }
  return [];
}
function getWarna(brand, product) {
  if (typeof ListData.getWarnaByBrandProduct === "function") {
    const out = ListData.getWarnaByBrandProduct(brand, product) || [];
    if (Array.isArray(out)) return out;
  }
  const idx = ListData.CATALOG_INDEX || {};
  return idx[brand] && idx[brand][product] ? idx[brand][product].warna || [] : [];
}
function getBaterai(brand, product) {
  if (typeof ListData.getBateraiByBrandProduct === "function") {
    const out = ListData.getBateraiByBrandProduct(brand, product) || [];
    if (Array.isArray(out)) return out;
  }
  const idx = ListData.CATALOG_INDEX || {};
  return idx[brand] && idx[brand][product] ? idx[brand][product].baterai || [] : [];
}
function getCharger(brand, product) {
  if (typeof ListData.getChargerByBrandProduct === "function") {
    const out = ListData.getChargerByBrandProduct(brand, product) || [];
    if (Array.isArray(out)) return out;
  }
  const idx = ListData.CATALOG_INDEX || {};
  return idx[brand] && idx[brand][product] ? idx[brand][product].charger || [] : [];
}
function getImei(brand, product) {
  const idx = ListData.CATALOG_INDEX || {};
  const node = idx[brand] && idx[brand][product] ? idx[brand][product] : null;
  return node?.imei || node?.imeis || node?.serials || [];
}
function getSalesByTokoName(tokoName) {
  if (typeof ListData.getSalesByToko === "function") {
    return ListData.getSalesByToko(tokoName) || [];
  }
  const all = Array.isArray(ListData.SALES_PEOPLE) ? ListData.SALES_PEOPLE : [];
  if (!tokoName) return all;
  return all.filter((s) => (s.toko || "").toLowerCase() === (tokoName || "").toLowerCase());
}

/* ===================== Component ===================== */
export default function InputPenjualan() {
  // role user
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);
  const isSuperadmin = user?.role === "superadmin";
  const isPicToko = (user?.role || "").startsWith("pic_toko");

  /* ---------- Master options ---------- */
  const TOKO = useMemo(() => getTokoList(), []);
  const DEFAULT_TOKO = useMemo(() => {
    if (isPicToko) {
      const t = user?.toko?.[0] || user?.toko || "";
      return (TOKO.includes(t) && t) || t || TOKO[0] || "";
    }
    return TOKO[0] || "";
  }, [TOKO, isPicToko, user?.toko]);

  const brandOptions = useMemo(() => getBrands(), []);
  const priceCategoryOptions = useMemo(
    () => (Array.isArray(ListData.PRICE_CATEGORIES) ? ListData.PRICE_CATEGORIES : ["SRP", "GROSIR"]),
    []
  );
  const paymentMethods = useMemo(
    () => (Array.isArray(ListData.PAYMENT_METHODS) ? ListData.PAYMENT_METHODS : ["Cash", "Kredit"]),
    []
  );
  const tenorOptions = useMemo(
    () => (Array.isArray(ListData.TENOR_OPTIONS) ? ListData.TENOR_OPTIONS : []),
    []
  );
  const mpProtectOptions = useMemo(
    () => (Array.isArray(ListData.MP_PROTECT_OPTIONS) ? ListData.MP_PROTECT_OPTIONS : []),
    []
  );

  // toko terpilih (PIC toko dikunci)
  const [tokoRef, setTokoRef] = useState(DEFAULT_TOKO);

  // opsi sales mengikuti toko
  const salesOptions = useMemo(() => getSalesByTokoName(tokoRef), [tokoRef]);
  const SH_LIST = useMemo(() => unique(salesOptions.map((s) => s.sh)), [salesOptions]);
  const SL_LIST = useMemo(() => unique(salesOptions.map((s) => s.sl)), [salesOptions]);

  /* ---------- Toggle persist (Kurangi MP Protect dari NET) ---------- */
  const [subtractMPFromNet, setSubtractMPFromNet] = useState(() => {
    try {
      const raw = localStorage.getItem("pref_subtract_mp_from_net");
      return raw === null ? true : JSON.parse(raw);
    } catch {
      return true;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("pref_subtract_mp_from_net", JSON.stringify(subtractMPFromNet));
    } catch {
      /* ignore */
    }
  }, [subtractMPFromNet]);

  /* ---------- Form state ---------- */
  const [form, setForm] = useState(() => {
    const defaultBrand = brandOptions[0] || "";
    const defaultProducts = getProducts(defaultBrand);
    const defaultProduct = defaultProducts[0] || "";
    const defaultWarna = getWarna(defaultBrand, defaultProduct)[0] || "";
    const defaultBaterai = getBaterai(defaultBrand, defaultProduct)[0] || "";
    const defaultCharger = getCharger(defaultBrand, defaultProduct)[0] || "";
    const priceCat = priceCategoryOptions[0] || "GROSIR";
    const tenor0 = tenorOptions[0] || "";
    const mp0 = mpProtectOptions[0] || "";

    return {
      // identitas
      tanggal: new Date().toISOString().slice(0, 10),
      tokoRef: DEFAULT_TOKO,

      salesName: "",
      shName: "",
      slName: "",
      nik: "",

      akunPelanggan: "",
      noHp: "",
      noKontrak: "",

      // produk
      brand: defaultBrand,
      produk: defaultProduct,
      warna: defaultWarna,
      baterai: defaultBaterai,
      charger: defaultCharger,
      qty: 1,

      // alias
      namaBrand: defaultBrand,
      namaBarang: defaultProduct,
      noImei: getImei(defaultBrand, defaultProduct)[0] || "",

      // harga
      priceCategory: priceCat,
      srp: 0,
      grosir: 0,
      harga: 0,

      // payment
      paymentMethod: paymentMethods[0] || "Cash",
      tenor: tenor0,
      mpProtect: mp0, // nominal string, mis. "150000"
    };
  });

  // Reset sales saat toko berubah
  useEffect(() => {
    setForm((f) => ({
      ...f,
      tokoRef,
      salesName: "",
      shName: "",
      slName: "",
      nik: "",
    }));
  }, [tokoRef]);

  // Isi otomatis SH/SL/NIK saat sales dipilih (kalau tersedia)
  useEffect(() => {
    if (!form.salesName) return;
    const s =
      salesOptions.find(
        (x) => (x.name || "").toLowerCase() === (form.salesName || "").toLowerCase()
      ) || null;
    if (s) {
      setForm((f) => ({
        ...f,
        shName: f.shName || s.sh || "",
        slName: f.slName || s.sl || "",
        nik: f.nik || s.nik || "",
      }));
    }
  }, [form.salesName, salesOptions]);

  // Ganti brand → reset dependent
  const onChangeBrand = (brand) => {
    const products = getProducts(brand);
    const product = products[0] || "";
    const warna = getWarna(brand, product)[0] || "";
    const baterai = getBaterai(brand, product)[0] || "";
    const charger = getCharger(brand, product)[0] || "";
    const imei0 = getImei(brand, product)[0] || "";
    setForm((f) => ({
      ...f,
      brand,
      produk: product,
      warna,
      baterai,
      charger,
      namaBrand: brand,
      namaBarang: product,
      noImei: imei0,
    }));
  };
  // Ganti produk → reset dependent
  const onChangeProduk = (product) => {
    const warna = getWarna(form.brand, product)[0] || "";
    const baterai = getBaterai(form.brand, product)[0] || "";
    const charger = getCharger(form.brand, product)[0] || "";
    const imei0 = getImei(form.brand, product)[0] || "";
    setForm((f) => ({
      ...f,
      produk: product,
      warna,
      baterai,
      charger,
      namaBarang: product,
      noImei: imei0,
    }));
  };

  // options turunan
  const productOptions = useMemo(() => getProducts(form.brand), [form.brand]);
  const warnaOptions = useMemo(() => getWarna(form.brand, form.produk), [form.brand, form.produk]);
  const bateraiOptions = useMemo(
    () => getBaterai(form.brand, form.produk),
    [form.brand, form.produk]
  );
  const chargerOptions = useMemo(
    () => getCharger(form.brand, form.produk),
    [form.brand, form.produk]
  );
  const imeiOptions = useMemo(() => getImei(form.brand, form.produk), [form.brand, form.produk]);

  /* ---------- MDR & NET derived ---------- */
  const mdrPercent = useMemo(() => {
    try {
      return Number(
        ListData.getMdr({
          method: form.paymentMethod,
          toko: tokoRef,
          brand: form.brand,
        }) || 0
      );
    } catch {
      return 0;
    }
  }, [form.paymentMethod, tokoRef, form.brand]);

  const mdrAmount = useMemo(() => toNum(form.harga) * mdrPercent, [form.harga, mdrPercent]);
  const mpProtectNum = useMemo(() => toNum(form.mpProtect), [form.mpProtect]);

  const netAmount = useMemo(() => {
    const base = toNum(form.harga) - mdrAmount;
    return subtractMPFromNet ? base - mpProtectNum : base;
  }, [form.harga, mdrAmount, mpProtectNum, subtractMPFromNet]);

  /* ---------- Data Tabel ---------- */
  const [rows, setRows] = useState([]);

  const addRow = () => {
    const newRow = {
      id: rows.length ? Math.max(...rows.map((r) => Number(r.id) || 0)) + 1 : 1,
      ...form,
      qty: toNum(form.qty),
      srp: toNum(form.srp),
      grosir: toNum(form.grosir),
      harga: toNum(form.harga),
      // derived snapshot
      mdrPercent,
      mdrAmount,
      netAmount,
      subtractMPFromNet, // snapshot toggle (preferensi aktif)
      approved: false,
    };
    setRows((prev) => [newRow, ...prev]);
  };

  /* ---------- Export Excel ---------- */
  const handleExport = () => {
    const data = rows.map((r) => ({
      TANGGAL: r.tanggal,
      TOKO: r.tokoRef,
      SALES: r.salesName,
      SH: r.shName,
      SL: r.slName,
      NIK: r.nik,
      AKUN_PELANGGAN: r.akunPelanggan,
      NO_HP: r.noHp,
      NO_KONTRAK: r.noKontrak,

      BRAND: r.brand,
      NAMA_BRAND: r.namaBrand,
      PRODUK: r.produk,
      NAMA_BARANG: r.namaBarang,
      WARNA: r.warna,
      BATERAI: r.baterai,
      CHARGER: r.charger,
      NO_IMEI: r.noImei,

      KATEGORI_HARGA: r.priceCategory,
      QTY: r.qty,
      SRP: r.srp,
      GROSIR: r.grosir,
      HARGA: r.harga,

      PAYMENT: r.paymentMethod,
      TENOR: r.tenor,
      MP_PROTECT: toNum(r.mpProtect),

      MDR_PERSEN: r.mdrPercent,
      MDR_RUPIAH: r.mdrAmount,
      NET_RUPIAH: r.netAmount,
      NET_MINUS_MP: r.subtractMPFromNet ? "YA" : "TIDAK",

      STATUS: r.approved ? "APPROVED" : "DRAFT",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "INPUT");
    const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    XLSX.writeFile(wb, `INPUT_PENJUALAN_${rSafe(form.tokoRef)}_${ymd}.xlsx`);
  };

  /* ---------- Edit/Delete/Approve ---------- */
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);

  const beginEdit = (row) => {
    setEditingId(row.id);
    setDraft({ ...row });
  };
  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };
  const saveEdit = () => {
    // hitung ulang derived sebelum simpan
    const draftMdrPercent = Number(
      ListData.getMdr({
        method: draft.paymentMethod,
        toko: draft.tokoRef,
        brand: draft.brand,
      }) || 0
    );
    const draftMdrAmount = toNum(draft.harga) * draftMdrPercent;
    const draftMp = toNum(draft.mpProtect);
    const draftNet =
      toNum(draft.harga) - draftMdrAmount - (draft.subtractMPFromNet ? draftMp : 0);

    setRows((prev) =>
      prev.map((r) =>
        r.id === editingId
          ? {
              ...draft,
              mdrPercent: draftMdrPercent,
              mdrAmount: draftMdrAmount,
              netAmount: draftNet,
            }
          : r
      )
    );
    cancelEdit();
  };
  const deleteRow = (id) => {
    if (!window.confirm("Hapus baris ini?")) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };
  const approveRow = (id) => {
    if (!isSuperadmin) return;
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, approved: true } : r)));
  };

  /* ---------- Filter & Pagination ---------- */
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");

  const filteredRows = useMemo(() => {
    const q = (search || "").toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [
        r.tanggal,
        r.tokoRef,
        r.salesName,
        r.shName,
        r.slName,
        r.brand,
        r.namaBrand,
        r.produk,
        r.namaBarang,
        r.warna,
        r.noImei,
        r.priceCategory,
        r.paymentMethod,
        r.tenor,
        r.noKontrak,
        r.akunPelanggan,
        r.noHp,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize, rows.length]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pageRows = filteredRows.slice(startIdx, endIdx);

  /* ===================== UI ===================== */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Input Penjualan</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="rounded-lg border bg-white px-3 py-2 text-sm shadow-sm hover:bg-slate-50"
          >
            Export (.xlsx)
          </button>
        </div>
      </div>

      {/* ========== CARD: Data Transaksi ========== */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Data Transaksi</h2>

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
            <label className="text-xs text-slate-600">Toko</label>
            <select
              disabled={isPicToko}
              className="w-full border rounded px-2 py-1"
              value={tokoRef}
              onChange={(e) => setTokoRef(e.target.value)}
            >
              {getTokoList().map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-600">Sales</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={form.salesName}
              onChange={(e) => setForm({ ...form, salesName: e.target.value })}
            >
              <option value="">— Pilih Sales —</option>
              {salesOptions.map((s) => (
                <option key={s.nik || s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-600">SH</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={form.shName}
              onChange={(e) => setForm({ ...form, shName: e.target.value })}
            >
              <option value="">— Pilih SH —</option>
              {SH_LIST.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-600">SL</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={form.slName}
              onChange={(e) => setForm({ ...form, slName: e.target.value })}
            >
              <option value="">— Pilih SL —</option>
              {SL_LIST.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-600">NIK</label>
            <input
              className="w-full border rounded px-2 py-1"
              value={form.nik}
              onChange={(e) => setForm({ ...form, nik: e.target.value })}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">Akun Pelanggan</label>
            <input
              className="w-full border rounded px-2 py-1"
              value={form.akunPelanggan}
              onChange={(e) => setForm({ ...form, akunPelanggan: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">No. HP/WA</label>
            <input
              className="w-full border rounded px-2 py-1"
              value={form.noHp}
              onChange={(e) => setForm({ ...form, noHp: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">No. Kontrak / ID Order</label>
            <input
              className="w-full border rounded px-2 py-1"
              value={form.noKontrak}
              onChange={(e) => setForm({ ...form, noKontrak: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* ========== CARD: Produk & Harga ========== */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Produk & Harga</h2>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div>
            <label className="text-xs text-slate-600">Brand</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={form.brand}
              onChange={(e) => onChangeBrand(e.target.value)}
            >
              {brandOptions.length ? (
                brandOptions.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))
              ) : (
                <option value="">— Kosong —</option>
              )}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">Produk</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={form.produk}
              onChange={(e) => onChangeProduk(e.target.value)}
            >
              {productOptions.length ? (
                productOptions.map((p) => (
                  <option key={`${form.brand}-${p}`} value={p}>
                    {p}
                  </option>
                ))
              ) : (
                <option value="">— Kosong —</option>
              )}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-600">Warna</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={form.warna}
              onChange={(e) => setForm({ ...form, warna: e.target.value })}
            >
              {warnaOptions.length ? (
                warnaOptions.map((w) => (
                  <option key={`w-${w}`} value={w}>
                    {w}
                  </option>
                ))
              ) : (
                <option value="">— Kosong —</option>
              )}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-600">Baterai</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={form.baterai}
              onChange={(e) => setForm({ ...form, baterai: e.target.value })}
            >
              {bateraiOptions.length ? (
                bateraiOptions.map((x) => (
                  <option key={`bat-${x}`} value={x}>
                    {x}
                  </option>
                ))
              ) : (
                <option value="">— Kosong —</option>
              )}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-600">Charger</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={form.charger}
              onChange={(e) => setForm({ ...form, charger: e.target.value })}
            >
              {chargerOptions.length ? (
                chargerOptions.map((x) => (
                  <option key={`chg-${x}`} value={x}>
                    {x}
                  </option>
                ))
              ) : (
                <option value="">— Kosong —</option>
              )}
            </select>
          </div>

          {/* alias nama brand & barang */}
          <div>
            <label className="text-xs text-slate-600">Nama Brand</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={form.namaBrand}
              onChange={(e) => setForm({ ...form, namaBrand: e.target.value })}
            >
              <option value="">— Pilih —</option>
              {brandOptions.map((b) => (
                <option key={`nb-${b}`} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">Nama Barang</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={form.namaBarang}
              onChange={(e) => setForm({ ...form, namaBarang: e.target.value })}
            >
              <option value="">— Pilih —</option>
              {productOptions.map((p) => (
                <option key={`nbg-${p}`} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">No IMEI</label>
            {imeiOptions.length ? (
              <select
                className="w-full border rounded px-2 py-1"
                value={form.noImei}
                onChange={(e) => setForm({ ...form, noImei: e.target.value })}
              >
                <option value="">— Pilih —</option>
                {imeiOptions.map((im) => (
                  <option key={`imei-${im}`} value={im}>
                    {im}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="w-full border rounded px-2 py-1"
                placeholder="Masukkan IMEI/No Rangka"
                value={form.noImei}
                onChange={(e) => setForm({ ...form, noImei: e.target.value })}
              />
            )}
          </div>

          <div>
            <label className="text-xs text-slate-600">Kategori Harga</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={form.priceCategory}
              onChange={(e) => setForm({ ...form, priceCategory: e.target.value })}
            >
              {priceCategoryOptions.map((c) => (
                <option key={`cat-${c}`} value={c}>
                  {c}
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
              onChange={(e) => setForm({ ...form, qty: toNum(e.target.value) })}
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">SRP</label>
            <input
              type="number"
              min={0}
              className="w-full border rounded px-2 py-1 text-right"
              value={form.srp}
              onChange={(e) => setForm({ ...form, srp: toNum(e.target.value) })}
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">Grosir</label>
            <input
              type="number"
              min={0}
              className="w-full border rounded px-2 py-1 text-right"
              value={form.grosir}
              onChange={(e) => setForm({ ...form, grosir: toNum(e.target.value) })}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">Harga</label>
            <input
              type="number"
              min={0}
              className="w-full border rounded px-2 py-1 text-right"
              value={form.harga}
              onChange={(e) => setForm({ ...form, harga: toNum(e.target.value) })}
            />
          </div>
        </div>
      </div>

      {/* ========== CARD: Pembayaran (Tenor, MP Protect, MDR/NET Otomatis) ========== */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Pembayaran</h2>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">Payment Method</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={form.paymentMethod}
              onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
            >
              {paymentMethods.map((pm) => (
                <option key={`pm-${pm}`} value={pm}>
                  {pm}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-600">Tenor</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={form.tenor}
              onChange={(e) => setForm({ ...form, tenor: e.target.value })}
            >
              <option value="">— Pilih —</option>
              {tenorOptions.map((t) => (
                <option key={`tenor-${t}`} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-600">MP Protect (Rp)</label>
            <select
              className="w-full border rounded px-2 py-1 text-right"
              value={form.mpProtect}
              onChange={(e) => setForm({ ...form, mpProtect: e.target.value })}
            >
              <option value="">0</option>
              {mpProtectOptions.map((v) => (
                <option key={`mp-${v}`} value={v}>
                  {Number(v).toLocaleString("id-ID")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-600">MDR % (auto)</label>
            <input
              disabled
              className="w-full border rounded px-2 py-1 text-right bg-slate-50"
              value={(mdrPercent * 100).toFixed(2) + " %"}
              readOnly
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">MDR (Rp) (auto)</label>
            <input
              disabled
              className="w-full border rounded px-2 py-1 text-right bg-slate-50"
              value={fmtIDR(mdrAmount)}
              readOnly
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">
              NET (Rp) (auto = Harga − MDR − {subtractMPFromNet ? "MP" : "0"})
            </label>
            <input
              disabled
              className="w-full border rounded px-2 py-1 text-right bg-slate-50"
              value={fmtIDR(netAmount)}
              readOnly
            />
          </div>
        </div>

        {/* Toggle persist */}
        <div className="mt-3">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={subtractMPFromNet}
              onChange={(e) => setSubtractMPFromNet(e.target.checked)}
            />
            Kurangi MP Protect dari NET
          </label>
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

      {/* ========== Tabel + Filter + Pagination ========== */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
          <h2 className="text-lg font-semibold">Tabel Penjualan</h2>
          <div className="flex items-center gap-2">
            <input
              className="border rounded px-3 py-2 text-sm"
              placeholder="Cari tanggal/produk/sales/akun/no kontrak..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex items-center gap-1 text-sm">
              <span className="text-slate-500">Rows:</span>
              <select
                className="border rounded px-2 py-1"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                {[10, 25, 50, 100].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[2000px] text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left">Tanggal</th>
                <th className="px-3 py-2 text-left">Toko</th>
                <th className="px-3 py-2 text-left">Sales</th>
                <th className="px-3 py-2 text-left">SH</th>
                <th className="px-3 py-2 text-left">SL</th>
                <th className="px-3 py-2 text-left">Brand</th>
                <th className="px-3 py-2 text-left">Nama Brand</th>
                <th className="px-3 py-2 text-left">Produk</th>
                <th className="px-3 py-2 text-left">Nama Barang</th>
                <th className="px-3 py-2 text-left">Warna</th>
                <th className="px-3 py-2 text-left">IMEI</th>

                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-left">Kategori Harga</th>
                <th className="px-3 py-2 text-right">SRP</th>
                <th className="px-3 py-2 text-right">Grosir</th>
                <th className="px-3 py-2 text-right">Harga</th>

                <th className="px-3 py-2 text-left">Payment</th>
                <th className="px-3 py-2 text-left">Tenor</th>
                <th className="px-3 py-2 text-right">MP Protect</th>
                <th className="px-3 py-2 text-right">MDR %</th>
                <th className="px-3 py-2 text-right">MDR (Rp)</th>
                <th className="px-3 py-2 text-right">NET (Rp)</th>

                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => {
                const isEditing = editingId === row.id;

                if (isEditing && draft) {
                  // hitung ulang mdr & net untuk draft dgn toggle per-baris
                  const dMdrPercent = Number(
                    ListData.getMdr({
                      method: draft.paymentMethod,
                      toko: draft.tokoRef,
                      brand: draft.brand,
                    }) || 0
                  );
                  const dMdrAmount = toNum(draft.harga) * dMdrPercent;
                  const dMp = toNum(draft.mpProtect);
                  const dNet =
                    toNum(draft.harga) - dMdrAmount - (draft.subtractMPFromNet ? dMp : 0);

                  return (
                    <tr key={row.id} className="border-b last:border-0 bg-slate-50/50">
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          className="border rounded px-2 py-1"
                          value={draft.tanggal}
                          onChange={(e) => setDraft((d) => ({ ...d, tanggal: e.target.value }))}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1 w-40"
                          value={draft.tokoRef}
                          onChange={(e) => setDraft((d) => ({ ...d, tokoRef: e.target.value }))}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1 w-36"
                          value={draft.salesName}
                          onChange={(e) => setDraft((d) => ({ ...d, salesName: e.target.value }))}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1 w-28"
                          value={draft.shName}
                          onChange={(e) => setDraft((d) => ({ ...d, shName: e.target.value }))}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1 w-28"
                          value={draft.slName}
                          onChange={(e) => setDraft((d) => ({ ...d, slName: e.target.value }))}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1 w-28"
                          value={draft.brand}
                          onChange={(e) => setDraft((d) => ({ ...d, brand: e.target.value }))}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1 w-28"
                          value={draft.namaBrand}
                          onChange={(e) => setDraft((d) => ({ ...d, namaBrand: e.target.value }))}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1 w-40"
                          value={draft.produk}
                          onChange={(e) => setDraft((d) => ({ ...d, produk: e.target.value }))}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1 w-40"
                          value={draft.namaBarang}
                          onChange={(e) => setDraft((d) => ({ ...d, namaBarang: e.target.value }))}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1 w-36"
                          value={draft.warna}
                          onChange={(e) => setDraft((d) => ({ ...d, warna: e.target.value }))}
                        />
                      </td>

                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1 w-40"
                          value={draft.noImei}
                          onChange={(e) => setDraft((d) => ({ ...d, noImei: e.target.value }))}
                        />
                      </td>

                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          className="border rounded px-2 py-1 text-right w-20"
                          value={draft.qty}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, qty: toNum(e.target.value) }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1 w-28"
                          value={draft.priceCategory}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, priceCategory: e.target.value }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          className="border rounded px-2 py-1 text-right w-28"
                          value={draft.srp}
                          onChange={(e) => setDraft((d) => ({ ...d, srp: toNum(e.target.value) }))}
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          className="border rounded px-2 py-1 text-right w-28"
                          value={draft.grosir}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, grosir: toNum(e.target.value) }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          className="border rounded px-2 py-1 text-right w-28"
                          value={draft.harga}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, harga: toNum(e.target.value) }))
                          }
                        />
                      </td>

                      <td className="px-3 py-2">
                        <select
                          className="border rounded px-2 py-1 w-44"
                          value={draft.paymentMethod}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, paymentMethod: e.target.value }))
                          }
                        >
                          {paymentMethods.map((pm) => (
                            <option key={`pm-ed-${pm}`} value={pm}>
                              {pm}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          className="border rounded px-2 py-1 w-36"
                          value={draft.tenor}
                          onChange={(e) => setDraft((d) => ({ ...d, tenor: e.target.value }))}
                        >
                          <option value="">—</option>
                          {tenorOptions.map((t) => (
                            <option key={`tenor-ed-${t}`} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center gap-2">
                          <select
                            className="border rounded px-2 py-1 w-32 text-right"
                            value={draft.mpProtect}
                            onChange={(e) =>
                              setDraft((d) => ({ ...d, mpProtect: e.target.value }))
                            }
                          >
                            <option value="">0</option>
                            {mpProtectOptions.map((v) => (
                              <option key={`mp-ed-${v}`} value={v}>
                                {Number(v).toLocaleString("id-ID")}
                              </option>
                            ))}
                          </select>
                          {/* Toggle per-baris saat edit */}
                          <label className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                            <input
                              type="checkbox"
                              className="h-3 w-3"
                              checked={!!draft.subtractMPFromNet}
                              onChange={(e) =>
                                setDraft((d) => ({ ...d, subtractMPFromNet: e.target.checked }))
                              }
                            />
                            Kurangi MP
                          </label>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">{(dMdrPercent * 100).toFixed(2)}%</td>
                      <td className="px-3 py-2 text-right">{fmtIDR(dMdrAmount)}</td>
                      <td className="px-3 py-2 text-right">{fmtIDR(dNet)}</td>

                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${
                            draft.approved
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {draft.approved ? "APPROVED" : "DRAFT"}
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
                    <td className="px-3 py-2">{row.tokoRef}</td>
                    <td className="px-3 py-2">{row.salesName || "-"}</td>
                    <td className="px-3 py-2">{row.shName || "-"}</td>
                    <td className="px-3 py-2">{row.slName || "-"}</td>
                    <td className="px-3 py-2">{row.brand || "-"}</td>
                    <td className="px-3 py-2">{row.namaBrand || "-"}</td>
                    <td className="px-3 py-2">{row.produk || "-"}</td>
                    <td className="px-3 py-2">{row.namaBarang || "-"}</td>
                    <td className="px-3 py-2">{row.warna || "-"}</td>
                    <td className="px-3 py-2">{row.noImei || "-"}</td>

                    <td className="px-3 py-2 text-right">{row.qty || 0}</td>
                    <td className="px-3 py-2">{row.priceCategory}</td>
                    <td className="px-3 py-2 text-right">{fmtIDR(row.srp)}</td>
                    <td className="px-3 py-2 text-right">{fmtIDR(row.grosir)}</td>
                    <td className="px-3 py-2 text-right">{fmtIDR(row.harga)}</td>

                    <td className="px-3 py-2">{row.paymentMethod}</td>
                    <td className="px-3 py-2">{row.tenor || "-"}</td>
                    <td className="px-3 py-2 text-right">
                      {row.mpProtect ? fmtIDR(toNum(row.mpProtect)) : "Rp 0"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {((row.mdrPercent || 0) * 100).toFixed(2)}%
                    </td>
                    <td className="px-3 py-2 text-right">{fmtIDR(row.mdrAmount || 0)}</td>
                    <td className="px-3 py-2 text-right">{fmtIDR(row.netAmount || 0)}</td>

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
                        {isSuperadmin && !row.approved && (
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

              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={24} className="px-3 py-6 text-center text-slate-500">
                    Tidak ada data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="text-sm text-slate-600">
            Menampilkan {filteredRows.length === 0 ? 0 : startIdx + 1}–
            {Math.min(endIdx, filteredRows.length)} dari {filteredRows.length} baris
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 rounded border hover:bg-slate-50 disabled:opacity-50"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              « First
            </button>
            <button
              className="px-3 py-1 rounded border hover:bg-slate-50 disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ‹ Prev
            </button>
            <span className="text-sm">
              Halaman <b>{currentPage}</b> / {totalPages}
            </span>
            <button
              className="px-3 py-1 rounded border hover:bg-slate-50 disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next ›
            </button>
            <button
              className="px-3 py-1 rounded border hover:bg-slate-50 disabled:opacity-50"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last »
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
