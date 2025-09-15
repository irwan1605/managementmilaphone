// src/pages/DataManagement.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
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
import TOKO_LABELS_DEFAULT from "../data/TokoLabels";

/* ===== Storage Keys (punyamu) ===== */
const STORAGE_MASTER_PRICE = "dm_master_harga";
const STORAGE_REF_LISTS = "dm_ref_lists";

/* ===== Storage Keys (global lintas modul) ===== */
const LS_MASTER_HARGA_PENJUALAN = "MASTER_HARGA_PENJUALAN";
const LS_MASTER_CATALOG_INDEX = "MASTER_CATALOG_INDEX";
const LS_MASTER_SALES_BY_TOKO = "MASTER_SALES_BY_TOKO";
const LS_MASTER_MDR_RULES = "MASTER_MDR_RULES";
const LS_MASTER_TENOR_RULES = "MASTER_TENOR_RULES";
const LS_MASTER_TOKO_LABELS = "MASTER_TOKO_LABELS";
const LS_MASTER_MP_PROTECT_OPTIONS = "MASTER_MP_PROTECT_OPTIONS";
const LS_MASTER_PAYMENT_METHODS = "MASTER_PAYMENT_METHODS";
const LS_MASTER_PRICE_CATEGORIES = "MASTER_PRICE_CATEGORIES";

/* ===== Utils ===== */
const toNumber = (v) =>
  v === "" || v == null ? 0 : Number(String(v).replace(/[^\d.-]/g, "")) || 0;
const fmt = (n) =>
  (Number(n) || 0).toLocaleString("id-ID", { style: "currency", currency: "IDR" });

const nonEmpty = (v) => v !== undefined && v !== null && String(v).trim() !== "";
const uniq = (arr) => Array.from(new Set(arr || []));

const defaultRefs = {
  paymentMethods: PAYMENT_METHODS,
  priceCategories: PRICE_CATEGORIES,
  mpProtectOptions: MP_PROTECT_OPTIONS,
  tenorOptions: TENOR_OPTIONS,
  brandList: BRAND_LIST,
  productList: PRODUCT_LIST,
  warnaList: WARNA_LIST,
};

function getLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function setLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ===== Parser helpers (Excel) ===== */
const normHeaders = (row) =>
  Object.fromEntries(
    Object.entries(row || {}).map(([k, v]) => [String(k || "").toLowerCase().trim(), v])
  );

const slugSheet = (n) => String(n || "").toLowerCase().replace(/\s+/g, "");

function parseSheetHarga(json) {
  const rows = (json || []).map(normHeaders);
  const out = [];
  for (const r of rows) {
    const brand = r["brand"] ?? r["merk"] ?? r["merek"];
    const name = r["type"] ?? r["tipe"] ?? r["produk"] ?? r["name"] ?? r["nama"];
    if (!nonEmpty(brand) || !nonEmpty(name)) continue;
    const warna = r["warna"] ?? r["color"];
    const srp = toNumber(r["srp"] ?? r["harga srp"]);
    const grosir = toNumber(r["grosir"] ?? r["harga grosir"]);
    const harga = toNumber(r["harga"]);
    const kategori = r["kategori"] ?? r["category"] ?? "";
    const baterai = r["baterai"] ?? r["battery"] ?? "";
    const charger = r["charger"] ?? r["pengisi daya"] ?? "";
    out.push({
      brand: String(brand).trim(),
      name: String(name).trim(),
      warna: warna ? String(warna).trim() : "",
      srp,
      grosir,
      harga: harga || grosir || srp || 0,
      kategori: kategori ? String(kategori).trim() : "",
      baterai: baterai ? String(baterai).trim() : "",
      charger: charger ? String(charger).trim() : "",
    });
  }
  return out;
}

function parseSheetKatalog(json) {
  const rows = (json || []).map(normHeaders);
  const map = new Map(); // brand -> name -> {warna:Set, baterai:Set, charger:Set}
  for (const r of rows) {
    const brand = r["brand"] ?? r["merk"] ?? r["merek"];
    const name = r["type"] ?? r["tipe"] ?? r["produk"] ?? r["name"] ?? r["nama"];
    if (!nonEmpty(brand) || !nonEmpty(name)) continue;
    const warna = r["warna"] ?? r["color"];
    const baterai = r["baterai"] ?? r["battery"];
    const charger = r["charger"] ?? r["pengisi daya"];
    const b = String(brand).trim();
    const p = String(name).trim();
    if (!map.has(b)) map.set(b, new Map());
    const pm = map.get(b);
    if (!pm.has(p)) pm.set(p, { warna: new Set(), baterai: new Set(), charger: new Set() });
    const rec = pm.get(p);
    if (nonEmpty(warna)) rec.warna.add(String(warna).trim());
    if (nonEmpty(baterai)) rec.baterai.add(String(baterai).trim());
    if (nonEmpty(charger)) rec.charger.add(String(charger).trim());
  }
  const out = [];
  for (const [brand, prodMap] of map.entries()) {
    const products = [];
    for (const [name, rec] of prodMap.entries()) {
      products.push({
        name,
        warna: Array.from(rec.warna),
        baterai: Array.from(rec.baterai),
        charger: Array.from(rec.charger),
      });
    }
    out.push({ brand, products });
  }
  return out;
}

function deriveCatalogFromMaster(masterHarga) {
  const map = new Map(); // brand -> name -> sets
  for (const h of masterHarga || []) {
    const { brand, name, warna, baterai, charger } = h;
    if (!nonEmpty(brand) || !nonEmpty(name)) continue;
    if (!map.has(brand)) map.set(brand, new Map());
    const pm = map.get(brand);
    if (!pm.has(name)) pm.set(name, { warna: new Set(), baterai: new Set(), charger: new Set() });
    const rec = pm.get(name);
    if (nonEmpty(warna)) rec.warna.add(String(warna).trim());
    if (nonEmpty(baterai)) rec.baterai.add(String(baterai).trim());
    if (nonEmpty(charger)) rec.charger.add(String(charger).trim());
  }
  const out = [];
  for (const [brand, prodMap] of map.entries()) {
    const products = [];
    for (const [name, rec] of prodMap.entries()) {
      products.push({
        name,
        warna: Array.from(rec.warna),
        baterai: Array.from(rec.baterai),
        charger: Array.from(rec.charger),
      });
    }
    out.push({ brand, products });
  }
  return out;
}

function parseSheetSales(json) {
  const rows = (json || []).map(normHeaders);
  return rows
    .map((r) => {
      const toko = r["toko"] ?? r["nama toko"];
      const store = r["store"] ?? r["nama store"];
      const name = r["name"] ?? r["nama"] ?? r["sales"] ?? r["nama sales"];
      const nik = r["nik"] ?? r["id"];
      const sh = r["sh"] ?? r["nama sh"];
      const sl = r["sl"] ?? r["nama sl"];
      const tuyul = r["tuyul"] ?? r["freelance"] ?? r["teknisi"];
      if (!nonEmpty(name)) return null;
      return {
        toko: toko ? String(toko).trim() : "",
        store: store ? String(store).trim() : "",
        name: String(name).trim(),
        nik: nik ? String(nik).trim() : "",
        sh: sh ? String(sh).trim() : "",
        sl: sl ? String(sl).trim() : "",
        tuyul: tuyul ? String(tuyul).trim() : "",
      };
    })
    .filter(Boolean);
}

function parseSheetMdr(json) {
  const rows = (json || []).map(normHeaders);
  return rows
    .map((r) => {
      const method = r["method"] ?? r["payment"] ?? r["pembayaran"];
      const toko = r["toko"] ?? r["nama toko"] ?? "";
      const brand = r["brand"] ?? r["merk"] ?? r["merek"] ?? "";
      const mdrPct = toNumber(r["mdr"] ?? r["mdr%"] ?? r["fee%"]);
      if (!nonEmpty(method)) return null;
      return { method: String(method).trim(), toko: String(toko).trim(), brand: String(brand).trim(), mdrPct };
    })
    .filter(Boolean);
}

function parseSheetTenor(json) {
  const rows = (json || []).map(normHeaders);
  return rows
    .map((r) => {
      const tenor = toNumber(r["tenor"] ?? r["bulan"]);
      const bungaPct = toNumber(r["bunga"] ?? r["bunga%"] ?? r["interest"]);
      const method = r["method"] ?? r["payment"] ?? r["pembayaran"] ?? "";
      const brand = r["brand"] ?? r["merk"] ?? r["merek"] ?? "";
      const toko = r["toko"] ?? r["nama toko"] ?? "";
      if (!tenor) return null;
      return { tenor, bungaPct, method: String(method).trim(), brand: String(brand).trim(), toko: String(toko).trim() };
    })
    .filter(Boolean);
}

function parseSheetToko(json) {
  const rows = (json || []).map(normHeaders);
  const out = {};
  for (const r of rows) {
    const id = r["id"] ?? r["kode"] ?? r["no"];
    const name = r["toko"] ?? r["nama toko"] ?? r["name"] ?? r["nama"];
    if (!nonEmpty(name)) continue;
    const key = nonEmpty(id) ? String(id).trim() : String(Object.keys(out).length + 1);
    out[key] = String(name).trim().toUpperCase();
  }
  return out;
}

function parseSimpleArray(json, keys) {
  const rows = (json || []).map(normHeaders);
  const arr = [];
  for (const r of rows) {
    for (const k of keys) {
      if (nonEmpty(r[k])) {
        arr.push(String(r[k]).trim());
        break;
      }
    }
  }
  return uniq(arr);
}

/* ===== Komponen ===== */
export default function DataManagement() {
  /* ------- Master Harga ------- */
  const [master, setMaster] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_MASTER_PRICE) || "null");
      return Array.isArray(saved) && saved.length
        ? saved
        : (HARGA_PENJUALAN || []).map((x) => ({
            brand: x.brand,
            name: x.name,
            warna: x.warna || "",
            srp: toNumber(x.srp),
            grosir: toNumber(x.grosir),
            harga: toNumber(x.harga || x.grosir || x.srp || 0),
            kategori: x.kategori || "",
            baterai: x.baterai || "",
            charger: x.charger || "",
          }));
    } catch {
      return (HARGA_PENJUALAN || []).map((x) => ({
        brand: x.brand,
        name: x.name,
        warna: x.warna || "",
        srp: toNumber(x.srp),
        grosir: toNumber(x.grosir),
        harga: toNumber(x.harga || x.grosir || x.srp || 0),
        kategori: x.kategori || "",
        baterai: x.baterai || "",
        charger: x.charger || "",
      }));
    }
  });

  /* ------- Refs (lists) ------- */
  const [refs, setRefs] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_REF_LISTS) || "null");
      const base = saved || defaultRefs;
      // jaga minimal default list ada isinya
      return {
        paymentMethods: base.paymentMethods?.length ? base.paymentMethods : PAYMENT_METHODS,
        priceCategories: base.priceCategories?.length ? base.priceCategories : PRICE_CATEGORIES,
        mpProtectOptions: base.mpProtectOptions?.length ? base.mpProtectOptions : MP_PROTECT_OPTIONS,
        tenorOptions: base.tenorOptions?.length ? base.tenorOptions : TENOR_OPTIONS,
        brandList: base.brandList?.length ? base.brandList : BRAND_LIST,
        productList: base.productList?.length ? base.productList : PRODUCT_LIST,
        warnaList: base.warnaList?.length ? base.warnaList : WARNA_LIST,
      };
    } catch {
      return defaultRefs;
    }
  });

  /* ------- Data Organisasi & Rules ------- */
  const [sales, setSales] = useState(() => getLS(LS_MASTER_SALES_BY_TOKO, []));
  const [mdrRules, setMdrRules] = useState(() => getLS(LS_MASTER_MDR_RULES, []));
  const [tenorRules, setTenorRules] = useState(() => getLS(LS_MASTER_TENOR_RULES, []));
  const [tokoLabels, setTokoLabels] = useState(() =>
    getLS(LS_MASTER_TOKO_LABELS, TOKO_LABELS_DEFAULT || {})
  );

  /* ------- Form master ------- */
  const [form, setForm] = useState({
    brand: "",
    name: "",
    warna: "",
    baterai: "",
    charger: "",
    srp: 0,
    grosir: 0,
    harga: 0,
    kategori: "",
    id: null, // index master yang sedang diedit; null artinya tambah baru
  });

  /* ------- Search & Paging ------- */
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  /* ------- Persist set ------- */
  useEffect(() => {
    localStorage.setItem(STORAGE_MASTER_PRICE, JSON.stringify(master));
    // mirror ke global agar modul lain langsung pakai data terbaru
    setLS(LS_MASTER_HARGA_PENJUALAN, master);
    // derive & simpan catalog index
    const catalog = deriveCatalogFromMaster(master);
    setLS(LS_MASTER_CATALOG_INDEX, catalog);
  }, [master]);

  useEffect(() => {
    localStorage.setItem(STORAGE_REF_LISTS, JSON.stringify(refs));
    setLS(LS_MASTER_MP_PROTECT_OPTIONS, refs.mpProtectOptions || []);
    setLS(LS_MASTER_PAYMENT_METHODS, refs.paymentMethods || []);
    setLS(LS_MASTER_PRICE_CATEGORIES, refs.priceCategories || []);
  }, [refs]);

  useEffect(() => setLS(LS_MASTER_SALES_BY_TOKO, sales), [sales]);
  useEffect(() => setLS(LS_MASTER_MDR_RULES, mdrRules), [mdrRules]);
  useEffect(() => setLS(LS_MASTER_TENOR_RULES, tenorRules), [tenorRules]);
  useEffect(() => setLS(LS_MASTER_TOKO_LABELS, tokoLabels), [tokoLabels]);

  /* ------- Derived ------- */
  const filtered = useMemo(() => {
    const q = (search || "").toLowerCase();
    return master.filter(
      (r) =>
        (r.brand || "").toLowerCase().includes(q) ||
        (r.name || "").toLowerCase().includes(q) ||
        (r.warna || "").toLowerCase().includes(q) ||
        (r.kategori || "").toLowerCase().includes(q)
    );
  }, [master, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  /* ------- Handlers (Master Harga) ------- */
  const onChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addRow = () => {
    const row = {
      brand: form.brand,
      name: form.name,
      warna: form.warna,
      baterai: form.baterai || "",
      charger: form.charger || "",
      srp: toNumber(form.srp),
      grosir: toNumber(form.grosir),
      harga: toNumber(form.harga || form.grosir || form.srp),
      kategori: form.kategori || "",
    };
    setMaster((prev) => [row, ...prev]);
    setForm({
      brand: "",
      name: "",
      warna: "",
      baterai: "",
      charger: "",
      srp: 0,
      grosir: 0,
      harga: 0,
      kategori: "",
      id: null,
    });
  };

  const beginEditByIndex = (masterIdx) => {
    const r = master[masterIdx];
    if (!r) return;
    setForm({
      brand: r.brand,
      name: r.name,
      warna: r.warna,
      baterai: r.baterai || "",
      charger: r.charger || "",
      srp: r.srp,
      grosir: r.grosir,
      harga: r.harga || r.grosir || r.srp || 0,
      kategori: r.kategori,
      id: masterIdx,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateRow = () => {
    const idx = typeof form.id === "number" ? form.id : -1;
    if (idx < 0 || !master[idx]) {
      alert("Pilih baris yang akan diupdate (klik Edit di tabel).");
      return;
    }
    const row = {
      brand: form.brand,
      name: form.name,
      warna: form.warna,
      baterai: form.baterai || "",
      charger: form.charger || "",
      srp: toNumber(form.srp),
      grosir: toNumber(form.grosir),
      harga: toNumber(form.harga || form.grosir || form.srp),
      kategori: form.kategori || "",
    };
    setMaster((prev) => prev.map((x, i) => (i === idx ? row : x)));
    setForm({
      brand: "",
      name: "",
      warna: "",
      baterai: "",
      charger: "",
      srp: 0,
      grosir: 0,
      harga: 0,
      kategori: "",
      id: null,
    });
  };

  const deleteRowByIndex = (masterIdx) => {
    if (!window.confirm("Hapus baris ini?")) return;
    setMaster((prev) => prev.filter((_, i) => i !== masterIdx));
  };

  /* ------- Refs management ------- */
  const addRef = (key, value) => {
    if (!nonEmpty(value)) return;
    setRefs((r) => ({ ...r, [key]: uniq([...(r[key] || []), value]) }));
  };
  const deleteRef = (key, value) => {
    setRefs((r) => ({ ...r, [key]: (r[key] || []).filter((x) => x !== value) }));
  };

  /* ------- Sales / MDR / Tenor / Toko editor (ringkas) ------- */
  const [newSales, setNewSales] = useState({ toko: "", store: "", name: "", nik: "", sh: "", sl: "", tuyul: "" });
  const addSales = () => {
    if (!nonEmpty(newSales.name)) return;
    setSales((prev) => [newSales, ...prev]);
    setNewSales({ toko: "", store: "", name: "", nik: "", sh: "", sl: "", tuyul: "" });
  };
  const delSales = (idx) => setSales((prev) => prev.filter((_, i) => i !== idx));

  const [newMdr, setNewMdr] = useState({ method: "", toko: "", brand: "", mdrPct: 0 });
  const addMdr = () => {
    if (!nonEmpty(newMdr.method)) return;
    setMdrRules((prev) => [{ ...newMdr, mdrPct: toNumber(newMdr.mdrPct) }, ...prev]);
    setNewMdr({ method: "", toko: "", brand: "", mdrPct: 0 });
  };
  const delMdr = (idx) => setMdrRules((prev) => prev.filter((_, i) => i !== idx));

  const [newTenor, setNewTenor] = useState({ tenor: 0, bungaPct: 0, method: "", brand: "", toko: "" });
  const addTenor = () => {
    if (!toNumber(newTenor.tenor)) return;
    setTenorRules((prev) => [{ ...newTenor, tenor: toNumber(newTenor.tenor), bungaPct: toNumber(newTenor.bungaPct) }, ...prev]);
    setNewTenor({ tenor: 0, bungaPct: 0, method: "", brand: "", toko: "" });
  };
  const delTenor = (idx) => setTenorRules((prev) => prev.filter((_, i) => i !== idx));

  const [newToko, setNewToko] = useState({ id: "", name: "" });
  const addToko = () => {
    if (!nonEmpty(newToko.name)) return;
    setTokoLabels((prev) => {
      const next = { ...(prev || {}) };
      const id = newToko.id ? String(newToko.id) : String(Object.keys(next).length + 1);
      next[id] = String(newToko.name).toUpperCase();
      return next;
    });
    setNewToko({ id: "", name: "" });
  };
  const delToko = (id) => {
    setTokoLabels((prev) => {
      const next = { ...(prev || {}) };
      delete next[id];
      return next;
    });
  };

  /* ------- Import/Export ------- */
  const fileRef = useRef(null);

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    // Master Harga
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        (master || []).map((r) => ({
          Brand: r.brand,
          Type: r.name,
          Warna: r.warna,
          SRP: r.srp,
          Grosir: r.grosir,
          Harga: r.harga,
          Kategori: r.kategori,
          Baterai: r.baterai || "",
          Charger: r.charger || "",
        }))
      ),
      "Harga"
    );
    // Katalog (derive)
    const katalog = deriveCatalogFromMaster(master);
    const katalogFlat = [];
    for (const b of katalog) {
      for (const p of b.products || []) {
        const rows = Math.max(1, p.warna?.length || 0, p.baterai?.length || 0, p.charger?.length || 0);
        for (let i = 0; i < rows; i += 1) {
          katalogFlat.push({
            Brand: b.brand,
            Type: p.name,
            Warna: p.warna?.[i] || "",
            Baterai: p.baterai?.[i] || "",
            Charger: p.charger?.[i] || "",
          });
        }
      }
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(katalogFlat), "Katalog");

    // Sales
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        (sales || []).map((s) => ({
          Toko: s.toko,
          Store: s.store,
          Nama: s.name,
          NIK: s.nik,
          SH: s.sh,
          SL: s.sl,
          Tuyul: s.tuyul,
        }))
      ),
      "Sales"
    );

    // MDR
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        (mdrRules || []).map((m) => ({ Method: m.method, Toko: m.toko, Brand: m.brand, "MDR%": m.mdrPct }))
      ),
      "MDR"
    );

    // Tenor
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        (tenorRules || []).map((t) => ({
          Tenor: t.tenor,
          "Bunga%": t.bungaPct,
          Method: t.method || "",
          Brand: t.brand || "",
          Toko: t.toko || "",
        }))
      ),
      "Tenor"
    );

    // Toko
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(Object.entries(tokoLabels || {}).map(([id, name]) => ({ ID: id, Toko: name }))),
      "Toko"
    );

    // List sederhana
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet((refs.paymentMethods || []).map((x) => ({ Method: x }))),
      "PaymentMethods"
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet((refs.priceCategories || []).map((x) => ({ Kategori: x }))),
      "PriceCategories"
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet((refs.mpProtectOptions || []).map((x) => ({ Opsi: x }))),
      "MPProtect"
    );

    XLSX.writeFile(wb, "DataLaporanMilaPhone_Export.xlsx");
  };

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        {
          Brand: "CONTOH BRAND",
          Type: "CONTOH TYPE",
          Warna: "Hitam",
          SRP: 12000000,
          Grosir: 11000000,
          Harga: 11000000,
          Kategori: "Motor Listrik",
          Baterai: "Lithium 60V",
          Charger: "5A",
        },
      ]),
      "Harga"
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        { Brand: "CONTOH BRAND", Type: "CONTOH TYPE", Warna: "Hitam", Baterai: "Lithium 60V", Charger: "5A" },
      ]),
      "Katalog"
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        { Toko: "CIRACAS", Store: "-", Nama: "Budi", NIK: "S001", SH: "Anton", SL: "Sari", Tuyul: "Rio" },
      ]),
      "Sales"
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([{ Method: "Cash", Toko: "CIRACAS", Brand: "", "MDR%": 0 }]),
      "MDR"
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([{ Tenor: 6, "Bunga%": 2.5, Method: "Kredit", Brand: "", Toko: "" }]),
      "Tenor"
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        { ID: 5, Toko: "CIRACAS" },
        { ID: 4, Toko: "CITEUREUP" },
        { ID: 3, Toko: "GAS ALAM" },
      ]),
      "Toko"
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([{ Method: "Cash" }, { Method: "Transfer" }, { Method: "Kredit" }]),
      "PaymentMethods"
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([{ Kategori: "SRP" }, { Kategori: "GROSIR" }]),
      "PriceCategories"
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([{ Opsi: "Proteck Silver" }, { Opsi: "Proteck Gold" }]),
      "MPProtect"
    );
    XLSX.writeFile(wb, "DataLaporanMilaPhone_TEMPLATE.xlsx");
  };

  const importExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
        const pick = (...names) => {
          const set = new Set(names.map(slugSheet));
          const hit = wb.SheetNames.find((n) => set.has(slugSheet(n)));
          return hit ? XLSX.utils.sheet_to_json(wb.Sheets[hit], { defval: "" }) : null;
        };

        const shHarga = pick("harga", "masterharga", "price");
        const shKatalog = pick("katalog", "catalog", "produk");
        const shSales = pick("sales", "tim", "saleslist");
        const shMdr = pick("mdr", "fee");
        const shTenor = pick("tenor", "bunga");
        const shToko = pick("toko", "store", "outlet");
        const shPay = pick("paymentmethods", "payment", "metode");
        const shPCat = pick("pricecategories", "pricecategory", "kategoriharga");
        const shMP = pick("mpprotect", "mp protect", "mp");

        // Master harga
        let newMaster = master;
        if (shHarga && shHarga.length) newMaster = parseSheetHarga(shHarga);

        // Catalog
        let catalogIndex = null;
        if (shKatalog && shKatalog.length) {
          catalogIndex = parseSheetKatalog(shKatalog);
        } else {
          catalogIndex = deriveCatalogFromMaster(shHarga ? parseSheetHarga(shHarga) : newMaster);
        }

        // Sales / MDR / Tenor / Toko / Lists
        const newSales = shSales ? parseSheetSales(shSales) : sales;
        const newMdr = shMdr ? parseSheetMdr(shMdr) : mdrRules;
        const newTenor = shTenor ? parseSheetTenor(shTenor) : tenorRules;
        const newToko = shToko ? parseSheetToko(shToko) : tokoLabels;

        const newPay =
          shPay && shPay.length ? parseSimpleArray(shPay, ["method", "metode", "payment"]) : refs.paymentMethods;
        const newPCat =
          shPCat && shPCat.length ? parseSimpleArray(shPCat, ["kategori", "category", "pricecategory"]) : refs.priceCategories;
        const newMP =
          shMP && shMP.length ? parseSimpleArray(shMP, ["opsi", "option", "nama", "name", "mpprotect", "mp"]) : refs.mpProtectOptions;

        // Commit state (akan dipersist otomatis via useEffect)
        setMaster(newMaster);
        setSales(newSales);
        setMdrRules(newMdr);
        setTenorRules(newTenor);
        setTokoLabels(newToko);
        setRefs((prev) => ({
          ...prev,
          paymentMethods: newPay,
          priceCategories: newPCat,
          mpProtectOptions: newMP,
          // brand/product/warna biarkan manual dari default + user menambah via RefEditor
        }));

        // Simpan catalog index global
        setLS(LS_MASTER_CATALOG_INDEX, catalogIndex);

        alert("Import berhasil. Semua dataset sudah diperbarui.");
      } catch (err) {
        console.error(err);
        alert("Gagal mengimpor file. Pastikan format sheet sesuai template.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const resetDefaults = () => {
    if (!window.confirm("Yakin reset seluruh Master Data ke default repository?")) return;

    // bersihkan LS global & lokal
    [
      STORAGE_MASTER_PRICE,
      STORAGE_REF_LISTS,
      LS_MASTER_HARGA_PENJUALAN,
      LS_MASTER_CATALOG_INDEX,
      LS_MASTER_SALES_BY_TOKO,
      LS_MASTER_MDR_RULES,
      LS_MASTER_TENOR_RULES,
      LS_MASTER_TOKO_LABELS,
      LS_MASTER_MP_PROTECT_OPTIONS,
      LS_MASTER_PAYMENT_METHODS,
      LS_MASTER_PRICE_CATEGORIES,
    ].forEach((k) => localStorage.removeItem(k));

    // restore state default
    setMaster(
      (HARGA_PENJUALAN || []).map((x) => ({
        brand: x.brand,
        name: x.name,
        warna: x.warna || "",
        srp: toNumber(x.srp),
        grosir: toNumber(x.grosir),
        harga: toNumber(x.harga || x.grosir || x.srp || 0),
        kategori: x.kategori || "",
        baterai: x.baterai || "",
        charger: x.charger || "",
      }))
    );
    setRefs(defaultRefs);
    setSales([]);
    setMdrRules([]);
    setTenorRules([]);
    setTokoLabels(TOKO_LABELS_DEFAULT || {});
    alert("Berhasil reset. Master Data kembali ke default.");
  };

  /* ------- Render ------- */
  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl md:text-2xl font-bold">Data Management (Master Data)</h2>
        <div className="flex items-center gap-2">
          <button onClick={exportExcel} className="px-3 py-2 bg-green-600 text-white rounded shadow-sm">
            Export All (.xlsx)
          </button>
          <label className="px-3 py-2 bg-gray-100 border rounded cursor-pointer shadow-sm">
            Import Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              ref={fileRef}
              onChange={(e) => e.target.files?.[0] && importExcel(e.target.files[0])}
            />
          </label>
          <button onClick={downloadTemplate} className="px-3 py-2 bg-indigo-600 text-white rounded shadow-sm">
            Download Template
          </button>
          <button onClick={resetDefaults} className="px-3 py-2 bg-rose-600 text-white rounded shadow-sm">
            Reset Default
          </button>
        </div>
      </div>

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
          <label className="block text-sm">Baterai</label>
          <input
            value={form.baterai}
            onChange={(e) => onChange("baterai", e.target.value)}
            className="w-full border rounded p-2"
            placeholder="cth: Lithium 60V"
          />
        </div>
        <div>
          <label className="block text-sm">Charger</label>
          <input
            value={form.charger}
            onChange={(e) => onChange("charger", e.target.value)}
            className="w-full border rounded p-2"
            placeholder="cth: 5A"
          />
        </div>
        <div>
          <label className="block text-sm">Kategori</label>
          <input
            value={form.kategori}
            onChange={(e) => onChange("kategori", e.target.value)}
            className="w-full border rounded p-2"
            placeholder="cth: Motor Listrik / Handphone / Accessories"
          />
        </div>

        <div>
          <label className="block text-sm">SRP</label>
          <input
            value={form.srp}
            onChange={(e) => onChange("srp", toNumber(e.target.value))}
            className="w-full border rounded p-2 text-right"
          />
        </div>
        <div>
          <label className="block text-sm">Grosir</label>
          <input
            value={form.grosir}
            onChange={(e) => onChange("grosir", toNumber(e.target.value))}
            className="w-full border rounded p-2 text-right"
          />
        </div>
        <div>
          <label className="block text-sm">Harga (final, opsional)</label>
          <input
            value={form.harga}
            onChange={(e) => onChange("harga", toNumber(e.target.value))}
            className="w-full border rounded p-2 text-right"
            placeholder="kosongkan = pakai Grosir/SRP"
          />
        </div>

        <div className="md:col-span-3 flex gap-2">
          <button onClick={addRow} className="px-4 py-2 bg-blue-600 text-white rounded">
            Tambah
          </button>
          <button onClick={updateRow} className="px-4 py-2 bg-amber-600 text-white rounded">
            Update Baris
          </button>
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

      {/* Tabel master */}
      <div className="overflow-auto bg-white rounded-lg shadow">
        <table className="min-w-[1200px] w-full">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="p-2">Brand</th>
              <th className="p-2">Produk</th>
              <th className="p-2">Warna</th>
              <th className="p-2">Baterai</th>
              <th className="p-2">Charger</th>
              <th className="p-2">SRP</th>
              <th className="p-2">Grosir</th>
              <th className="p-2">Harga</th>
              <th className="p-2">Kategori</th>
              <th className="p-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, i) => {
              // hitung index asli di master (aman walau difilter/paging)
              const masterIdx = master.indexOf(r);
              return (
                <tr key={masterIdx} className="border-t">
                  <td className="p-2">{r.brand}</td>
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.warna}</td>
                  <td className="p-2">{r.baterai || "-"}</td>
                  <td className="p-2">{r.charger || "-"}</td>
                  <td className="p-2">{fmt(r.srp)}</td>
                  <td className="p-2">{fmt(r.grosir)}</td>
                  <td className="p-2">{fmt(r.harga)}</td>
                  <td className="p-2">{r.kategori}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => beginEditByIndex(masterIdx)}
                        className="px-2 py-1 text-xs bg-amber-500 text-white rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteRowByIndex(masterIdx)}
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
                <td colSpan={10} className="p-4 text-center text-gray-500">
                  Tidak ada data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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

      {/* ======= Editors: Lists sederhana ======= */}
      <div className="bg-white rounded-lg shadow p-4 grid md:grid-cols-3 gap-4">
        <RefEditor title="Payment Methods" listKey="paymentMethods" refs={refs} onAdd={addRef} onDel={deleteRef} />
        <RefEditor title="Price Categories" listKey="priceCategories" refs={refs} onAdd={addRef} onDel={deleteRef} />
        <RefEditor title="MP Protect Options" listKey="mpProtectOptions" refs={refs} onAdd={addRef} onDel={deleteRef} />
        <RefEditor title="Tenor Options" listKey="tenorOptions" refs={refs} onAdd={addRef} onDel={deleteRef} />
        <RefEditor title="Brand List" listKey="brandList" refs={refs} onAdd={addRef} onDel={deleteRef} />
        <RefEditor title="Product List" listKey="productList" refs={refs} onAdd={addRef} onDel={deleteRef} />
        <RefEditor title="Warna List" listKey="warnaList" refs={refs} onAdd={addRef} onDel={deleteRef} />
      </div>

      {/* ======= Editors: Sales / MDR / Tenor / Toko ======= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sales */}
        <section className="bg-white rounded-lg shadow p-4">
          <div className="font-semibold mb-2">Sales / Organisasi</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
            <input className="border rounded p-2" placeholder="Toko" value={newSales.toko} onChange={(e) => setNewSales((s) => ({ ...s, toko: e.target.value }))} />
            <input className="border rounded p-2" placeholder="Store" value={newSales.store} onChange={(e) => setNewSales((s) => ({ ...s, store: e.target.value }))} />
            <input className="border rounded p-2" placeholder="Nama" value={newSales.name} onChange={(e) => setNewSales((s) => ({ ...s, name: e.target.value }))} />
            <input className="border rounded p-2" placeholder="NIK" value={newSales.nik} onChange={(e) => setNewSales((s) => ({ ...s, nik: e.target.value }))} />
            <input className="border rounded p-2" placeholder="SH" value={newSales.sh} onChange={(e) => setNewSales((s) => ({ ...s, sh: e.target.value }))} />
            <input className="border rounded p-2" placeholder="SL" value={newSales.sl} onChange={(e) => setNewSales((s) => ({ ...s, sl: e.target.value }))} />
            <input className="border rounded p-2" placeholder="Tuyul/Freelance" value={newSales.tuyul} onChange={(e) => setNewSales((s) => ({ ...s, tuyul: e.target.value }))} />
          </div>
          <button onClick={addSales} className="px-3 py-2 bg-blue-600 text-white rounded">Tambah</button>
          <div className="overflow-auto mt-3 border rounded">
            <table className="min-w-[800px] w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Toko</th>
                  <th className="p-2 text-left">Store</th>
                  <th className="p-2 text-left">Nama</th>
                  <th className="p-2 text-left">NIK</th>
                  <th className="p-2 text-left">SH</th>
                  <th className="p-2 text-left">SL</th>
                  <th className="p-2 text-left">Tuyul</th>
                  <th className="p-2 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {(sales || []).map((s, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{s.toko}</td>
                    <td className="p-2">{s.store}</td>
                    <td className="p-2">{s.name}</td>
                    <td className="p-2">{s.nik}</td>
                    <td className="p-2">{s.sh}</td>
                    <td className="p-2">{s.sl}</td>
                    <td className="p-2">{s.tuyul}</td>
                    <td className="p-2">
                      <button onClick={() => delSales(i)} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Hapus</button>
                    </td>
                  </tr>
                ))}
                {!sales?.length && (
                  <tr>
                    <td colSpan={8} className="p-3 text-center text-gray-500">Kosong.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* MDR */}
        <section className="bg-white rounded-lg shadow p-4">
          <div className="font-semibold mb-2">Aturan MDR</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
            <input className="border rounded p-2" placeholder="Method (Cash/Transfer/...)" value={newMdr.method} onChange={(e) => setNewMdr((m) => ({ ...m, method: e.target.value }))} />
            <input className="border rounded p-2" placeholder="Toko (opsional)" value={newMdr.toko} onChange={(e) => setNewMdr((m) => ({ ...m, toko: e.target.value }))} />
            <input className="border rounded p-2" placeholder="Brand (opsional)" value={newMdr.brand} onChange={(e) => setNewMdr((m) => ({ ...m, brand: e.target.value }))} />
            <input className="border rounded p-2 text-right" placeholder="MDR %" value={newMdr.mdrPct} onChange={(e) => setNewMdr((m) => ({ ...m, mdrPct: toNumber(e.target.value) }))} />
          </div>
          <button onClick={addMdr} className="px-3 py-2 bg-blue-600 text-white rounded">Tambah</button>
          <div className="overflow-auto mt-3 border rounded">
            <table className="min-w-[700px] w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Method</th>
                  <th className="p-2 text-left">Toko</th>
                  <th className="p-2 text-left">Brand</th>
                  <th className="p-2 text-right">MDR%</th>
                  <th className="p-2 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {(mdrRules || []).map((m, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{m.method}</td>
                    <td className="p-2">{m.toko || "-"}</td>
                    <td className="p-2">{m.brand || "-"}</td>
                    <td className="p-2 text-right">{m.mdrPct}</td>
                    <td className="p-2">
                      <button onClick={() => delMdr(i)} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Hapus</button>
                    </td>
                  </tr>
                ))}
                {!mdrRules?.length && (
                  <tr>
                    <td colSpan={5} className="p-3 text-center text-gray-500">Kosong.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Tenor */}
        <section className="bg-white rounded-lg shadow p-4">
          <div className="font-semibold mb-2">Aturan Tenor & Bunga</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2">
            <input className="border rounded p-2 text-right" placeholder="Tenor (bulan)" value={newTenor.tenor} onChange={(e) => setNewTenor((t) => ({ ...t, tenor: toNumber(e.target.value) }))} />
            <input className="border rounded p-2 text-right" placeholder="Bunga %" value={newTenor.bungaPct} onChange={(e) => setNewTenor((t) => ({ ...t, bungaPct: toNumber(e.target.value) }))} />
            <input className="border rounded p-2" placeholder="Method (opsional)" value={newTenor.method} onChange={(e) => setNewTenor((t) => ({ ...t, method: e.target.value }))} />
            <input className="border rounded p-2" placeholder="Brand (opsional)" value={newTenor.brand} onChange={(e) => setNewTenor((t) => ({ ...t, brand: e.target.value }))} />
            <input className="border rounded p-2" placeholder="Toko (opsional)" value={newTenor.toko} onChange={(e) => setNewTenor((t) => ({ ...t, toko: e.target.value }))} />
          </div>
          <button onClick={addTenor} className="px-3 py-2 bg-blue-600 text-white rounded">Tambah</button>
          <div className="overflow-auto mt-3 border rounded">
            <table className="min-w-[800px] w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-right">Tenor</th>
                  <th className="p-2 text-right">Bunga %</th>
                  <th className="p-2 text-left">Method</th>
                  <th className="p-2 text-left">Brand</th>
                  <th className="p-2 text-left">Toko</th>
                  <th className="p-2 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {(tenorRules || []).map((t, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2 text-right">{t.tenor}</td>
                    <td className="p-2 text-right">{t.bungaPct}</td>
                    <td className="p-2">{t.method || "-"}</td>
                    <td className="p-2">{t.brand || "-"}</td>
                    <td className="p-2">{t.toko || "-"}</td>
                    <td className="p-2">
                      <button onClick={() => delTenor(i)} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Hapus</button>
                    </td>
                  </tr>
                ))}
                {!tenorRules?.length && (
                  <tr>
                    <td colSpan={6} className="p-3 text-center text-gray-500">Kosong.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Toko */}
        <section className="bg-white rounded-lg shadow p-4">
          <div className="font-semibold mb-2">Label Toko</div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input className="border rounded p-2" placeholder="ID (opsional)" value={newToko.id} onChange={(e) => setNewToko((t) => ({ ...t, id: e.target.value }))} />
            <input className="border rounded p-2" placeholder="Nama Toko" value={newToko.name} onChange={(e) => setNewToko((t) => ({ ...t, name: e.target.value }))} />
          </div>
          <button onClick={addToko} className="px-3 py-2 bg-blue-600 text-white rounded">Tambah</button>
          <div className="overflow-auto mt-3 border rounded">
            <table className="min-w-[400px] w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">ID</th>
                  <th className="p-2 text-left">Nama</th>
                  <th className="p-2 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(tokoLabels || {}).map(([id, name]) => (
                  <tr key={id} className="border-t">
                    <td className="p-2">{id}</td>
                    <td className="p-2">{name}</td>
                    <td className="p-2">
                      <button onClick={() => delToko(id)} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Hapus</button>
                    </td>
                  </tr>
                ))}
                {!Object.keys(tokoLabels || {}).length && (
                  <tr>
                    <td colSpan={3} className="p-3 text-center text-gray-500">Kosong.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <p className="text-xs text-gray-500">
        Semua perubahan otomatis disimpan dan disinkronkan ke localStorage. Modul lain (Dashboard Toko, Input
        Penjualan, Penjualan HP/ML/Accessories, Laporan Keuangan, Stock) langsung memakai data terbaru.
      </p>
    </div>
  );
}

/* ===== Komponen kecil: editor list sederhana ===== */
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
            <button onClick={() => onDel(listKey, x)} className="px-2 py-1 text-xs bg-red-600 text-white rounded">
              Hapus
            </button>
          </div>
        ))}
        {list.length === 0 && <div className="text-xs text-gray-500">Kosong.</div>}
      </div>
    </div>
  );
}
