// src/pages/InputPenjualan.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";

/** ===== Sumber label toko ===== */
import TOKO_LABELS from "../data/TokoLabels";

/** ===== Master harga & katalog produk ===== */
import {
  getBrandIndex, // -> [{ brand, products:[{ name, warna:[], imei|imeis|serials?:[] }] }]
  findHarga, // ({brand,name,warna,prefer}) -> { srp,grosir,harga,kategori? }
} from "../data/MasterDataHargaPenjualan";

/** ===== Master list dropdown & logika pendukung ===== */
import {
  PAYMENT_METHODS, // string[]
  PRICE_CATEGORIES, // string[]
  MP_PROTECT_OPTIONS, // string[]
  TENOR_OPTIONS, // number[]
  TOKO_LIST, // string[]
  getSalesByToko, // (tokoName) -> [{ name, nik, sh, sl, tuyul, toko }]
  getMdr, // ({ method,toko,brand }) -> percent
  getBateraiByBrandProduct, // (brand,product) -> string[]
  getChargerByBrandProduct, // (brand,product) -> string[]
} from "../data/ListDataPenjualan";

/* ================= Utils ================= */
const toNum = (v) => (isNaN(Number(v)) ? 0 : Number(v));
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
const unique = (arr) =>
  Array.from(
    new Set((arr || []).map((x) => (x ?? "").toString().trim()).filter(Boolean))
  );

function parseXlsxDate(v) {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number" && XLSX.SSF?.parse_date_code) {
    const d = XLSX.SSF.parse_date_code(v);
    if (d)
      return new Date(Date.UTC(d.y, d.m - 1, d.d)).toISOString().slice(0, 10);
  }
  if (typeof v === "string" && v.trim()) return v;
  return new Date().toISOString().slice(0, 10);
}

/* ============== Import normalizer ============== */
function normalizeRowFromExcel(row) {
  const lower = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [String(k).trim().toLowerCase(), v])
  );
  const pick = (...keys) => {
    for (const k of keys) {
      if (
        k in lower &&
        lower[k] !== undefined &&
        lower[k] !== null &&
        `${lower[k]}`.trim() !== ""
      )
        return lower[k];
    }
    return undefined;
  };

  const tanggal = parseXlsxDate(
    pick("tanggal", "tgl", "tgl transaksi", "tanggal transaksi", "date")
  );
  const tokoRef = pick("toko", "store", "nama toko");
  const salesName = pick("sales", "nama sales");
  const shName = pick("sh", "nama sh");
  const slName = pick("sl", "nama sl");
  const tuyulName = pick("tuyul", "freelance", "teknisi");
  const nik = pick("nik", "id");
  const akunPelanggan = pick(
    "akun transaksi (pelanggan)",
    "akun pelanggan",
    "akun"
  );
  const noHp = pick("no hp user / wa", "no hp", "wa", "whatsapp");
  const noKontrak = pick("no. kontrak/id order", "kontrak", "id order");

  const brand = pick("brand", "merk") || "";
  const produk =
    pick("produk", "product", "type", "tipe", "sepeda listrik", "nama") || "";
  const warna = pick("warna", "color") || "";
  const baterai = pick("baterai", "battery") || "";
  const charger = pick("charger") || "";
  const qty = toNum(pick("qty", "jumlah"));

  const namaBrand = pick("nama brand", "namabrand") || "";
  const namaBarang = pick("nama barang", "namabarang") || "";
  const noImei = pick("no imei", "imei", "imei/no dinamo/rangka") || "";

  const hargaTypeRaw = (
    pick("harga dipakai", "tipe harga", "price type") || ""
  ).toString();
  const hargaType = /srp/i.test(hargaTypeRaw) ? "SRP" : "GROSIR";
  const srp = toNum(pick("srp", "harga srp"));
  const grosir = toNum(pick("grosir", "harga grosir"));
  const harga =
    toNum(pick("harga", "price", "payment user (dashboard)")) || grosir || srp;
  const kategori = pick("kategori") || "";
  const priceCategory = pick("kategori harga", "kat harga") || "";
  const mpProtect =
    pick("mp proteck", "mp protect", "proteck", "protect") || "";

  const paymentMethod =
    (pick("payment metode", "payment method", "pembayaran") || "") + "";
  const leasingName = pick("pembayaran melalui", "leasing") || "";
  const tenor = toNum(pick("tenor", "bulan"));
  const bunga = toNum(pick("bunga", "interest", "bunga%"));
  const dpMerchant = toNum(
    pick(
      "dp user via merchant (piutang)",
      "dp merchant (piutang)",
      "dp merchant"
    )
  );
  const dpToko = toNum(
    pick("dp user ke toko (cash)", "dp toko (cash)", "dp toko")
  );
  const dpTalangan = toNum(pick("request dp talangan", "dp talangan"));
  const dp = toNum(pick("dp", "down payment"));
  const ongkirHsCard = toNum(pick("ongkir/hs card", "ongkir"));

  const aksesoris1Desc = pick("aksesoris/sparepart", "aksesoris 1");
  const aksesoris1Amount = toNum(
    pick("aksesoris/sparepart rp", "aksesoris 1 rp")
  );
  const aksesoris2Desc = pick("aksesoris/sparepart 2");
  const aksesoris2Amount = toNum(pick("aksesoris/sparepart 2 rp"));
  const bundlingProtectAmount = toNum(
    pick("bundling mp proteck", "bundling proteck")
  );

  const imei1 = pick("imei 1", "imei_1") || noImei || "";
  const imei2 = pick("imei 2", "imei_2") || "";
  const note = pick("note/keterangan tambahan", "catatan");
  const tglPengambilan = parseXlsxDate(
    pick("tgl pengambilan unit", "tgl pegambilan unit")
  );
  const alamatPengiriman = pick("alamat pengiriman", "alamat");

  return {
    tanggal,
    tokoRef,
    salesName,
    shName,
    slName,
    tuyulName,
    nik,
    akunPelanggan,
    noHp,
    noKontrak,

    brand,
    produk,
    warna,
    baterai,
    charger,
    qty,
    hargaType,
    srp,
    grosir,
    harga,
    kategori,
    priceCategory,
    mpProtect,

    // alias
    namaBrand,
    namaBarang,
    noImei,

    paymentMethod,
    leasingName,
    tenor,
    bunga,
    dpMerchant,
    dpToko,
    dpTalangan,
    dp,
    ongkirHsCard,
    aksesoris1Desc,
    aksesoris1Amount,
    aksesoris2Desc,
    aksesoris2Amount,
    bundlingProtectAmount,

    imei1,
    imei2,
    note,
    tglPengambilan,
    alamatPengiriman,
  };
}

/* ============== Perhitungan ============== */
function computeFinancials(row, tokoName) {
  const qty = toNum(row.qty);
  const harga = toNum(row.harga);
  const base = qty * harga;

  const addOns =
    toNum(row.ongkirHsCard) +
    toNum(row.aksesoris1Amount) +
    toNum(row.aksesoris2Amount) +
    toNum(row.bundlingProtectAmount);

  const subtotal = base + addOns;

  const mdrPct =
    getMdr({
      method: row.paymentMethod,
      toko: tokoName,
      brand: row.brand,
    }) || 0;

  const mdrFee = subtotal * (Number(mdrPct) / 100);
  const net = subtotal - mdrFee;

  const method = (row.paymentMethod || "").toLowerCase();
  if (method === "kredit") {
    const dp = Math.max(toNum(row.dp), 0);
    const tenor = Math.max(toNum(row.tenor), 0);
    const bungaRate = Math.max(toNum(row.bunga), 0) / 100;
    const principal = Math.max(subtotal - dp, 0);
    const totalBunga = principal * bungaRate * tenor;
    const cicilan = tenor > 0 ? (principal + totalBunga) / tenor : 0;
    const grandTotal = dp + principal + totalBunga;
    const sisaKembalian =
      toNum(row.dpMerchant) +
      toNum(row.dpToko) +
      toNum(row.dpTalangan) -
      subtotal;

    return {
      base,
      addOns,
      subtotal,
      mdrPct,
      mdrFee,
      net,
      dp,
      tenor,
      bungaRate,
      principal,
      totalBunga,
      cicilan,
      grandTotal,
      sisaKembalian,
    };
  }

  const sisaKembalian =
    toNum(row.dpMerchant) +
    toNum(row.dpToko) +
    toNum(row.dpTalangan) -
    subtotal;

  return {
    base,
    addOns,
    subtotal,
    mdrPct,
    mdrFee,
    net,
    dp: toNum(row.dp),
    tenor: 0,
    bungaRate: 0,
    principal: subtotal,
    totalBunga: 0,
    cicilan: 0,
    grandTotal: subtotal,
    sisaKembalian,
  };
}

/* ================= Komponen ================= */
export default function InputPenjualan({ user, tokoId, initialData = [] }) {
  const tokoName = useMemo(
    () =>
      TOKO_LABELS?.[Number(tokoId)] || TOKO_LABELS?.[user?.toko?.[0]] || "Toko",
    [tokoId, user?.toko]
  );

  /** ========= Katalog Produk (Brand/Produk/Warna/IMEI) ========= */
  const brandIndex = useMemo(() => {
    const idx = getBrandIndex() || [];
    if (!Array.isArray(idx) || idx.length === 0) {
      console.warn(
        "[InputPenjualan] getBrandIndex() kosong — cek MasterDataHargaPenjualan.js"
      );
    }
    return idx;
  }, []);

  const baseBrandOptions = useMemo(
    () => unique(brandIndex.map((b) => b.brand)),
    [brandIndex]
  );

  // Helper cari node produk
  const findProductNode = (brand, prod) => {
    const b = brandIndex.find((x) => x.brand === brand);
    return b?.products?.find((pp) => pp.name === prod);
  };

  /** ========= Data Sales & Org ========= */
  const salesOptions = useMemo(() => {
    const arr = getSalesByToko(tokoName) || [];
    if (!arr.length)
      console.warn(
        "[InputPenjualan] getSalesByToko() kosong — cek ListDataPenjualan.js"
      );
    return arr;
  }, [tokoName]);

  const SH_LIST = useMemo(
    () => unique(salesOptions.map((s) => s.sh)),
    [salesOptions]
  );
  const SL_LIST = useMemo(
    () => unique(salesOptions.map((s) => s.sl)),
    [salesOptions]
  );
  const TUYUL_LIST = useMemo(
    () => unique(salesOptions.map((s) => s.tuyul)),
    [salesOptions]
  );

  /* ---------- Data tabel ---------- */
  const [rows, setRows] = useState(() =>
    (initialData || []).map((r, i) => ({
      id: r.id ?? i + 1,
      approved: !!r.approved,
      ...r,
    }))
  );

  /* ---------- Ringkasan cepat ---------- */
  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        const f = computeFinancials(row, tokoName);
        acc.transaksi += 1;
        acc.qty += toNum(row.qty);
        acc.subtotal += f.subtotal;
        acc.net += f.net;
        return acc;
      },
      { transaksi: 0, qty: 0, subtotal: 0, net: 0 }
    );
  }, [rows, tokoName]);

  /* ---------- Refs & Form ---------- */
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(() => ({
    tanggal: new Date().toISOString().slice(0, 10),

    // identitas
    tokoRef: TOKO_LIST?.includes(tokoName)
      ? tokoName
      : TOKO_LIST?.[0] || tokoName,
    salesName: "",
    shName: "",
    slName: "",
    tuyulName: "",
    nik: "",
    akunPelanggan: "",
    noHp: "",
    noKontrak: "",

    // produk
    brand: baseBrandOptions?.[0] || "",
    produk: "",
    warna: "",
    baterai: "",
    charger: "",
    qty: 1,
    hargaType: "GROSIR",
    srp: 0,
    grosir: 0,
    harga: 0,
    kategori: "Motor Listrik",

    // alias
    namaBrand: "",
    namaBarang: "",
    noImei: "",

    // kategori harga & proteck
    priceCategory: PRICE_CATEGORIES?.[0] || "",
    mpProtect: "",

    // payment
    paymentMethod: PAYMENT_METHODS?.[0] || "Cash",
    leasingName: "",
    tenor: 0,
    bunga: 0,
    dp: 0,
    dpMerchant: 0,
    dpToko: 0,
    dpTalangan: 0,

    // addons
    ongkirHsCard: 0,
    aksesoris1Desc: "",
    aksesoris1Amount: 0,
    aksesoris2Desc: "",
    aksesoris2Amount: 0,
    bundlingProtectAmount: 0,

    // imei & note
    imei1: "",
    imei2: "",
    note: "",
    tglPengambilan: "",
    alamatPengiriman: "",
  }));

  /** ====== Setelah brand ada, tampilkan produk/warna/baterai/charger ====== */
  // Mengisi default brand jika kosong saat brandIndex sudah ada
  useEffect(() => {
    if (!form.brand && baseBrandOptions.length > 0) {
      setForm((f) => ({ ...f, brand: baseBrandOptions[0] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseBrandOptions.length]);

  // Opsi produk/warna berbasis brand
  const _productOptions = useMemo(() => {
    if (!form.brand) return [];
    const b = brandIndex.find((x) => x.brand === form.brand);
    return unique((b?.products || []).map((p) => p.name));
  }, [form.brand, brandIndex]);

  const _warnaOptions = useMemo(() => {
    const p = findProductNode(form.brand, form.produk);
    return p?.warna || [];
  }, [form.brand, form.produk, brandIndex]);

  // Isi otomatis produk/warna pertama saat list muncul (agar dropdown terlihat ada datanya)
  useEffect(() => {
    if (_productOptions.length && !form.produk) {
      setForm((f) => ({
        ...f,
        produk: _productOptions[0],
        namaBarang: f.namaBarang || _productOptions[0],
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_productOptions.length]);

  useEffect(() => {
    if (_warnaOptions.length && !form.warna) {
      setForm((f) => ({ ...f, warna: _warnaOptions[0] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_warnaOptions.length]);

  // Opsi baterai/charger
  const bateraiOptions = useMemo(
    () => unique(getBateraiByBrandProduct(form.brand, form.produk) || []),
    [form.brand, form.produk]
  );
  const chargerOptions = useMemo(
    () => unique(getChargerByBrandProduct(form.brand, form.produk) || []),
    [form.brand, form.produk]
  );

  // Auto pilih default baterai/charger pertama saat ada
  useEffect(() => {
    if (bateraiOptions.length && !form.baterai)
      setForm((f) => ({ ...f, baterai: bateraiOptions[0] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bateraiOptions.length]);

  useEffect(() => {
    if (chargerOptions.length && !form.charger)
      setForm((f) => ({ ...f, charger: chargerOptions[0] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chargerOptions.length]);

  // Opsi IMEI dari node produk
  const imeiOptions = useMemo(() => {
    const p = findProductNode(form.brand, form.produk);
    const list = p?.imei || p?.imeis || p?.serials || [];
    return unique(list);
  }, [form.brand, form.produk]);

  // Auto harga dari master + kategori
  useEffect(() => {
    if (!form.produk) return;
    const row = findHarga({
      brand: form.brand,
      name: form.produk,
      warna: form.warna,
      prefer: form.hargaType === "SRP" ? "srp" : "grosir",
    });
    if (row) {
      setForm((f) => ({
        ...f,
        srp: toNum(row.srp),
        grosir: toNum(row.grosir),
        harga: toNum(row.harga),
        kategori: row.kategori || f.kategori,
      }));
    }
  }, [form.brand, form.produk, form.warna, form.hargaType]);

  // Oto-lengkapi data org saat pilih sales
  useEffect(() => {
    if (!form.salesName) return;
    const sales =
      salesOptions.find(
        (s) => (s.name || "").toLowerCase() === form.salesName.toLowerCase()
      ) || null;
    if (sales) {
      setForm((f) => ({
        ...f,
        nik: f.nik || sales.nik || "",
        tokoRef: f.tokoRef || sales.toko || tokoName,
        shName: f.shName || sales.sh || "",
        slName: f.slName || sales.sl || "",
        tuyulName: f.tuyulName || sales.tuyul || "",
      }));
    }
  }, [form.salesName, salesOptions, tokoName]);

  // Sinkron alias Nama Brand/Barang -> brand/produk
  useEffect(() => {
    if (form.namaBrand && !form.brand)
      setForm((f) => ({ ...f, brand: f.namaBrand }));
  }, [form.namaBrand, form.brand]);
  useEffect(() => {
    if (form.namaBarang && !form.produk)
      setForm((f) => ({ ...f, produk: f.namaBarang }));
  }, [form.namaBarang, form.produk]);

  // Handler ganti brand/produk (reset dependensi)
  const onChangeBrand = (val) =>
    setForm((f) => ({
      ...f,
      brand: val,
      namaBrand: f.namaBrand || val,
      produk: "",
      namaBarang: "",
      warna: "",
      baterai: "",
      charger: "",
      noImei: "",
      imei1: "",
    }));
  const onChangeProduk = (val) =>
    setForm((f) => ({
      ...f,
      produk: val,
      namaBarang: f.namaBarang || val,
      warna: "",
      baterai: "",
      charger: "",
      noImei: "",
      imei1: "",
    }));

  /* ============== Tambah data ============== */
  const addRow = () => {
    const newRow = {
      id: rows.length ? Math.max(...rows.map((r) => Number(r.id) || 0)) + 1 : 1,
      ...form,
      qty: toNum(form.qty),
      srp: toNum(form.srp),
      grosir: toNum(form.grosir),
      harga: toNum(form.harga),
      dp: toNum(form.dp),
      dpMerchant: toNum(form.dpMerchant),
      dpToko: toNum(form.dpToko),
      dpTalangan: toNum(form.dpTalangan),
      ongkirHsCard: toNum(form.ongkirHsCard),
      aksesoris1Amount: toNum(form.aksesoris1Amount),
      aksesoris2Amount: toNum(form.aksesoris2Amount),
      bundlingProtectAmount: toNum(form.bundlingProtectAmount),
      approved: false,
    };
    setRows((prev) => [newRow, ...prev]);

    // reset ringan (tetap mempertahankan brand)
    setForm((f) => ({
      ...f,
      produk: "",
      namaBarang: "",
      warna: "",
      baterai: "",
      charger: "",
      qty: 1,
      imei1: "",
      imei2: "",
      noImei: "",
      ongkirHsCard: 0,
      aksesoris1Desc: "",
      aksesoris1Amount: 0,
      aksesoris2Desc: "",
      aksesoris2Amount: 0,
      bundlingProtectAmount: 0,
      dpMerchant: 0,
      dpToko: 0,
      dpTalangan: 0,
      note: "",
      tglPengambilan: "",
      alamatPengiriman: "",
    }));
  };

  /* ============== Import / Export Excel ============== */
  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      const sheetName =
        wb.SheetNames.find((n) => /input|penjualan|list|po/i.test(n)) ||
        wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(ws, { defval: "" });

      const normalized = json.map(normalizeRowFromExcel);

      const today = new Date().toISOString().slice(0, 10);
      const toRows = normalized.map((r, i) => ({
        id: rows.length + i + 1,
        approved: false,
        ...r,
        tanggal: r.tanggal || today,
        hargaType: r.hargaType || (r.grosir ? "GROSIR" : "SRP"),
        paymentMethod:
          PAYMENT_METHODS.find(
            (m) =>
              m.toLowerCase() === String(r.paymentMethod || "").toLowerCase()
          ) || "Cash",
        qty: toNum(r.qty),
        srp: toNum(r.srp),
        grosir: toNum(r.grosir),
        harga: toNum(r.harga || (r.grosir ? r.grosir : r.srp) || 0),
        dp: toNum(r.dp),
        dpMerchant: toNum(r.dpMerchant),
        dpToko: toNum(r.dpToko),
        dpTalangan: toNum(r.dpTalangan),
        ongkirHsCard: toNum(r.ongkirHsCard),
        aksesoris1Amount: toNum(r.aksesoris1Amount),
        aksesoris2Amount: toNum(r.aksesoris2Amount),
        bundlingProtectAmount: toNum(r.bundlingProtectAmount),
      }));

      setRows((prev) => [...prev, ...toRows]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Gagal import Excel:", err);
      alert(
        "File Excel tidak dikenali. Pastikan header kolom sesuai template."
      );
    }
  };

  const exportRows = (rowsToExport, sheetName, filePrefix) => {
    const data = rowsToExport.map((r) => {
      const f = computeFinancials(r, tokoName);
      return {
        TANGGAL: r.tanggal,
        TOKO: r.tokoRef || tokoName,
        KATEGORI: r.kategori,
        KATEGORI_HARGA: r.priceCategory,
        MP_PROTECK: r.mpProtect,
        // alias:
        NAMA_BRAND: r.namaBrand || r.brand,
        NAMA_BARANG: r.namaBarang || r.produk,
        NO_IMEI: r.noImei || r.imei1,
        // utama:
        BRAND: r.brand,
        TYPE: r.produk,
        WARNA: r.warna,
        BATERAI: r.baterai,
        CHARGER: r.charger,
        QTY: r.qty,
        HARGA_DIPAKAI: r.hargaType,
        HARGA: r.harga,
        ADDONS_ONGKIR: r.ongkirHsCard,
        ADDONS_ACC1: r.aksesoris1Amount,
        ADDONS_ACC2: r.aksesoris2Amount,
        ADDONS_MP_PROTECK: r.bundlingProtectAmount,
        SUBTOTAL: f.subtotal,
        MDR_PCT: Number(f.mdrPct).toFixed(2),
        MDR_FEE: Math.round(f.mdrFee),
        NET: Math.round(f.net),
        PAYMENT: r.paymentMethod,
        PEMBAYARAN_MELALUI: r.leasingName,
        DP_UTAMA: r.dp,
        DP_MERCHANT_PIUTANG: r.dpMerchant,
        DP_TOKO_CASH: r.dpToko,
        DP_TALANGAN: r.dpTalangan,
        SISA_LIMIT_BARANG: Math.max(
          0,
          f.subtotal - (r.dpMerchant + r.dpToko + r.dpTalangan)
        ),
        TENOR_BULAN: r.tenor,
        BUNGA_PCT: r.bunga,
        CICILAN_PER_BULAN: Math.round(f.cicilan),
        GRAND_TOTAL: Math.round(f.grandTotal),
        IMEI_1: r.imei1,
        IMEI_2: r.imei2,
        SALES: r.salesName,
        SH: r.shName,
        SL: r.slName,
        TUYUL: r.tuyulName,
        NIK: r.nik,
        AKUN_PELANGGAN: r.akunPelanggan,
        NO_HP_WA: r.noHp,
        NO_KONTRAK: r.noKontrak,
        NOTE: r.note,
        TGL_PENGAMBILAN: r.tglPengambilan,
        ALAMAT_PENGIRIMAN: r.alamatPengiriman,
        STATUS: r.approved ? "APPROVED" : "DRAFT",
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const safeName = (tokoName || "").replace(/[^\p{L}\p{N}_-]+/gu, "_");
    XLSX.writeFile(wb, `${filePrefix}_${safeName}_${ymd}.xlsx`);
  };

  const handleExportAll = () => exportRows(rows, "INPUT", "INPUT_PENJUALAN");

  /* ============== Edit/Delete/Approve ============== */
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
      prev.map((r) => (r.id === editingId ? { ...editDraft } : r))
    );
    cancelEdit();
  };
  const deleteRow = (id) => {
    if (!window.confirm("Hapus baris ini?")) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };
  const approveRow = (id) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, approved: true } : r))
    );
  };
  const canApprove = user?.role === "superadmin";

  /* ============== Filter & Pagination ============== */
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  // >>> Satu-satunya deklarasi search (perbaikan error)
  const [search, setSearch] = useState("");

  const filteredRows = useMemo(() => {
    const q = (search || "").toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const bag = [
        r.tanggal,
        r.tokoRef,
        r.salesName,
        r.brand,
        r.namaBrand,
        r.produk,
        r.namaBarang,
        r.warna,
        r.noImei,
        r.imei1,
        r.paymentMethod,
        r.leasingName,
        r.noKontrak,
        r.akunPelanggan,
        r.noHp,
        r.note,
      ]
        .join(" ")
        .toLowerCase();
      return bag.includes(q);
    });
  }, [rows, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize, rows.length]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pageRows = filteredRows.slice(startIdx, endIdx);

  /* ============== Render ============== */
  const isPicToko = (user?.role || "").startsWith("pic_toko");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Input Penjualan — {tokoName}
          </h1>
          <p className="text-slate-600">
            Semua dropdown diambil dari <code>ListDataPenjualan.js</code> &{" "}
            <code>MasterDataHargaPenjualan.js</code>. Klik Brand →
            Produk/Warna/Baterai/Charger akan muncul.
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
            onClick={handleExportAll}
            className="rounded-lg border bg-white px-3 py-2 text-sm shadow-sm hover:bg-slate-50"
            title="Export semua (.xlsx)"
          >
            Export (.xlsx)
          </button>
        </div>
      </div>

      {/* Cards ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Total Transaksi</div>
          <div className="mt-1 text-2xl font-semibold">{summary.transaksi}</div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Total Qty</div>
          <div className="mt-1 text-2xl font-semibold">{summary.qty}</div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Subtotal</div>
          <div className="mt-1 text-2xl font-semibold">
            {fmtIDR(summary.subtotal)}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">NET (setelah MDR)</div>
          <div className="mt-1 text-2xl font-semibold">
            {fmtIDR(summary.net)}
          </div>
        </div>
      </div>

      {/* ==================== CARD — DATA TRANSAKSI ==================== */}
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
              className="w-full border rounded px-2 py-1"
              value={form.tokoRef}
              onChange={(e) => setForm({ ...form, tokoRef: e.target.value })}
              disabled={isPicToko}
            >
              {(TOKO_LIST?.length ? TOKO_LIST : [tokoName]).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">Pilih Sales & SH</label>
            <div className="grid grid-cols-2 gap-2">
              <select
                className="border rounded px-2 py-1"
                value={form.salesName}
                onChange={(e) =>
                  setForm({ ...form, salesName: e.target.value })
                }
              >
                <option value="">— Pilih Sales —</option>
                {salesOptions.map((s) => (
                  <option key={s.nik || s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select
                className="border rounded px-2 py-1"
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
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">
              Pilih SL & Freelance
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                className="border rounded px-2 py-1"
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
              <select
                className="border rounded px-2 py-1"
                value={form.tuyulName}
                onChange={(e) =>
                  setForm({ ...form, tuyulName: e.target.value })
                }
              >
                <option value="">— Pilih Freelance —</option>
                {TUYUL_LIST.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
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
              onChange={(e) =>
                setForm({ ...form, akunPelanggan: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">No HP / WA</label>
            <input
              className="w-full border rounded px-2 py-1"
              value={form.noHp}
              onChange={(e) => setForm({ ...form, noHp: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">
              No. Kontrak / ID Order
            </label>
            <input
              className="w-full border rounded px-2 py-1"
              value={form.noKontrak}
              onChange={(e) => setForm({ ...form, noKontrak: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* ==================== CARD — PRODUK & HARGA ==================== */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Produk & Harga</h2>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div>
            <label className="text-xs text-slate-600">Pilih Brand</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={form.brand}
              onChange={(e) => onChangeBrand(e.target.value)}
            >
              {baseBrandOptions.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">Pilih Produk</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={form.produk}
              onChange={(e) => onChangeProduk(e.target.value)}
            >
              <option value="">— Pilih Produk —</option>
              {_productOptions.map((p) => (
                <option key={`${form.brand}-${p}`} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-600">Pilih Warna</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={form.warna}
              onChange={(e) => setForm({ ...form, warna: e.target.value })}
            >
              <option value="">— Pilih Warna —</option>
              {_warnaOptions.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-600">Pilih Baterai</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={form.baterai}
              onChange={(e) => setForm({ ...form, baterai: e.target.value })}
            >
              <option value="">— Pilih —</option>
              {bateraiOptions.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-600">Pilih Charger</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={form.charger}
              onChange={(e) => setForm({ ...form, charger: e.target.value })}
            >
              <option value="">— Pilih —</option>
              {chargerOptions.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>

          {/* alias: nama brand / barang / no imei */}
          <div>
            <label className="text-xs text-slate-600">Nama Brand</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={form.namaBrand}
              onChange={(e) => setForm({ ...form, namaBrand: e.target.value })}
            >
              <option value="">— Pilih —</option>
              {baseBrandOptions.map((x) => (
                <option key={x} value={x}>
                  {x}
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
              {_productOptions.map((x) => (
                <option key={`nb-${x}`} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">No IMEI</label>
            {imeiOptions.length > 0 ? (
              <select
                className="w-full border rounded px-2 py-1"
                value={form.noImei}
                onChange={(e) =>
                  setForm({
                    ...form,
                    noImei: e.target.value,
                    imei1: e.target.value,
                  })
                }
              >
                <option value="">— Pilih —</option>
                {imeiOptions.map((x) => (
                  <option key={`imei-${x}`} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="w-full border rounded px-2 py-1"
                placeholder="Masukkan IMEI/No Rangka"
                value={form.noImei}
                onChange={(e) =>
                  setForm({
                    ...form,
                    noImei: e.target.value,
                    imei1: e.target.value,
                  })
                }
              />
            )}
          </div>

          {/* Qty & Harga */}
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
            <label className="text-xs text-slate-600">Harga Dipakai</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={form.hargaType}
              onChange={(e) => setForm({ ...form, hargaType: e.target.value })}
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
              onChange={(e) => setForm({ ...form, srp: toNum(e.target.value) })}
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">GROSIR</label>
            <input
              type="number"
              min={0}
              className="w-full border rounded px-2 py-1 text-right"
              value={form.grosir}
              onChange={(e) =>
                setForm({ ...form, grosir: toNum(e.target.value) })
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">Harga</label>
            <input
              type="number"
              min={0}
              className="w-full border rounded px-2 py-1 text-right"
              value={form.harga}
              onChange={(e) =>
                setForm({ ...form, harga: toNum(e.target.value) })
              }
            />
          </div>
        </div>
      </div>

      {/* ==================== CARD — PAYMENT ==================== */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Payment</h2>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div>
            <label className="text-xs text-slate-600">Kategori Harga</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={form.priceCategory}
              onChange={(e) =>
                setForm({ ...form, priceCategory: e.target.value })
              }
            >
              {PRICE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">
              Payment user (Dashboard)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                className="border rounded px-2 py-1"
                value={form.paymentMethod}
                onChange={(e) =>
                  setForm({ ...form, paymentMethod: e.target.value })
                }
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                readOnly
                className="border rounded px-2 py-1 bg-slate-50 text-right"
                title="NET setelah MDR"
                value={fmtIDR(computeFinancials(form, tokoName).net)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-600">
              Pembayaran Melalui (Leasing)
            </label>
            <input
              className="w-full border rounded px-2 py-1"
              value={form.leasingName}
              onChange={(e) =>
                setForm({ ...form, leasingName: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">MDR %</label>
            <input
              readOnly
              className="w-full border rounded px-2 py-1 bg-slate-50 text-right"
              value={Number(
                getMdr({
                  method: form.paymentMethod,
                  toko: tokoName,
                  brand: form.brand,
                }) || 0
              ).toFixed(2)}
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">Tenor</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={form.tenor}
              onChange={(e) =>
                setForm({ ...form, tenor: toNum(e.target.value) })
              }
            >
              <option value={0}>— Pilih —</option>
              {TENOR_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-600">
              DP Merchant (Piutang)
            </label>
            <input
              type="number"
              min={0}
              className="w-full border rounded px-2 py-1 text-right"
              value={form.dpMerchant}
              onChange={(e) =>
                setForm({ ...form, dpMerchant: toNum(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">DP Toko (Cash)</label>
            <input
              type="number"
              min={0}
              className="w-full border rounded px-2 py-1 text-right"
              value={form.dpToko}
              onChange={(e) =>
                setForm({ ...form, dpToko: toNum(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">DP Talangan</label>
            <input
              type="number"
              min={0}
              className="w-full border rounded px-2 py-1 text-right"
              value={form.dpTalangan}
              onChange={(e) =>
                setForm({ ...form, dpTalangan: toNum(e.target.value) })
              }
            />
          </div>
        </div>
      </div>

      {/* ==================== CARD — ADD-ONS ==================== */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Add-ons & Catatan</h2>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-3">
            <label className="text-xs text-slate-600">
              IMEI/No Dinamo/Rangka
            </label>
            <input
              className="w-full border rounded px-2 py-1"
              value={form.imei1}
              onChange={(e) => setForm({ ...form, imei1: e.target.value })}
            />
          </div>
          <div className="md:col-span-3">
            <label className="text-xs text-slate-600">
              IMEI/No Dinamo/Rangka
            </label>
            <input
              className="w-full border rounded px-2 py-1"
              value={form.imei2}
              onChange={(e) => setForm({ ...form, imei2: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">Ongkir / HS Card</label>
            <input
              type="number"
              min={0}
              className="w-full border rounded px-2 py-1 text-right"
              value={form.ongkirHsCard}
              onChange={(e) =>
                setForm({ ...form, ongkirHsCard: toNum(e.target.value) })
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">
              Accessories / Sparepart
            </label>
            <input
              className="w-full border rounded px-2 py-1"
              value={form.aksesoris1Desc}
              onChange={(e) =>
                setForm({ ...form, aksesoris1Desc: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">Total Harga</label>
            <input
              type="number"
              min={0}
              className="w-full border rounded px-2 py-1 text-right"
              value={form.aksesoris1Amount}
              onChange={(e) =>
                setForm({ ...form, aksesoris1Amount: toNum(e.target.value) })
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">
              Accessories / Sparepart
            </label>
            <input
              className="w-full border rounded px-2 py-1"
              value={form.aksesoris2Desc}
              onChange={(e) =>
                setForm({ ...form, aksesoris2Desc: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">Total Harga</label>
            <input
              type="number"
              min={0}
              className="w-full border rounded px-2 py-1 text-right"
              value={form.aksesoris2Amount}
              onChange={(e) =>
                setForm({ ...form, aksesoris2Amount: toNum(e.target.value) })
              }
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">
              Bundling MP Proteck
            </label>
            <select
              className="w-full border rounded px-2 py-1"
              value={form.mpProtect}
              onChange={(e) => setForm({ ...form, mpProtect: e.target.value })}
            >
              <option value="">— Pilih —</option>
              {MP_PROTECT_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-600">Nominal Bundling</label>
            <input
              type="number"
              min={0}
              className="w-full border rounded px-2 py-1 text-right"
              value={form.bundlingProtectAmount}
              onChange={(e) =>
                setForm({
                  ...form,
                  bundlingProtectAmount: toNum(e.target.value),
                })
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">Note/Keterangan</label>
            <input
              className="w-full border rounded px-2 py-1"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">Tgl Pengambilan</label>
            <input
              type="date"
              className="w-full border rounded px-2 py-1"
              value={form.tglPengambilan}
              onChange={(e) =>
                setForm({ ...form, tglPengambilan: e.target.value })
              }
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">Alamat Pengiriman</label>
            <input
              className="w-full border rounded px-2 py-1"
              value={form.alamatPengiriman}
              onChange={(e) =>
                setForm({ ...form, alamatPengiriman: e.target.value })
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

      {/* ==================== TABEL + FILTER + PAGINATION ==================== */}
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
          <table className="min-w-[2100px] text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left">Tanggal</th>
                <th className="px-3 py-2 text-left">Toko</th>
                <th className="px-3 py-2 text-left">Sales</th>
                <th className="px-3 py-2 text-left">Brand</th>
                <th className="px-3 py-2 text-left">Nama Brand</th>
                <th className="px-3 py-2 text-left">Produk</th>
                <th className="px-3 py-2 text-left">Nama Barang</th>
                <th className="px-3 py-2 text-left">Warna</th>
                <th className="px-3 py-2 text-left">No IMEI</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-left">HargaDipakai</th>
                <th className="px-3 py-2 text-right">Harga</th>
                <th className="px-3 py-2 text-right">AddOns</th>
                <th className="px-3 py-2 text-right">Subtotal</th>
                <th className="px-3 py-2 text-right">MDR %</th>
                <th className="px-3 py-2 text-right">NET</th>
                <th className="px-3 py-2 text-left">Payment</th>
                <th className="px-3 py-2 text-left">Leasing</th>
                <th className="px-3 py-2 text-right">DP Merch</th>
                <th className="px-3 py-2 text-right">DP Toko</th>
                <th className="px-3 py-2 text-right">DP Talangan</th>
                <th className="px-3 py-2 text-right">Cicilan/Bln</th>
                <th className="px-3 py-2 text-right">Grand Total</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => {
                const isEditing = editingId === row.id;

                if (isEditing && editDraft) {
                  const fe = computeFinancials(
                    editDraft,
                    row.tokoRef || tokoName
                  );
                  return (
                    <tr
                      key={row.id}
                      className="border-b last:border-0 bg-slate-50/50"
                    >
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          className="border rounded px-2 py-1"
                          value={editDraft.tanggal}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              tanggal: e.target.value,
                            }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1 w-40"
                          value={editDraft.tokoRef}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              tokoRef: e.target.value,
                            }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1 w-36"
                          value={editDraft.salesName}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              salesName: e.target.value,
                            }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1 w-32"
                          value={editDraft.brand}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              brand: e.target.value,
                            }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1 w-32"
                          value={editDraft.namaBrand || ""}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              namaBrand: e.target.value,
                            }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1 w-40"
                          value={editDraft.produk}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              produk: e.target.value,
                            }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1 w-40"
                          value={editDraft.namaBarang || ""}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              namaBarang: e.target.value,
                            }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1 w-24"
                          value={editDraft.warna}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              warna: e.target.value,
                            }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1 w-40"
                          value={editDraft.noImei || ""}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              noImei: e.target.value,
                            }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          className="border rounded px-2 py-1 text-right w-20"
                          value={editDraft.qty}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              qty: toNum(e.target.value),
                            }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          className="border rounded px-2 py-1"
                          value={editDraft.hargaType}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              hargaType: e.target.value,
                            }))
                          }
                        >
                          <option value="GROSIR">GROSIR</option>
                          <option value="SRP">SRP</option>
                        </select>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          className="border rounded px-2 py-1 text-right w-28"
                          value={editDraft.harga}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              harga: toNum(e.target.value),
                            }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        {fmtIDR(
                          toNum(editDraft.ongkirHsCard) +
                            toNum(editDraft.aksesoris1Amount) +
                            toNum(editDraft.aksesoris2Amount) +
                            toNum(editDraft.bundlingProtectAmount)
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {fmtIDR(fe.subtotal)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {Number(fe.mdrPct).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right">{fmtIDR(fe.net)}</td>
                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1 w-32"
                          value={editDraft.paymentMethod}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              paymentMethod: e.target.value,
                            }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1 w-32"
                          value={editDraft.leasingName}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              leasingName: e.target.value,
                            }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          className="border rounded px-2 py-1 text-right w-24"
                          value={editDraft.dpMerchant}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              dpMerchant: toNum(e.target.value),
                            }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          className="border rounded px-2 py-1 text-right w-24"
                          value={editDraft.dpToko}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              dpToko: toNum(e.target.value),
                            }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          className="border rounded px-2 py-1 text-right w-24"
                          value={editDraft.dpTalangan}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              dpTalangan: toNum(e.target.value),
                            }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        {fmtIDR(fe.cicilan)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {fmtIDR(fe.grandTotal)}
                      </td>
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

                const f = computeFinancials(row, row.tokoRef || tokoName);
                return (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="px-3 py-2">{row.tanggal}</td>
                    <td className="px-3 py-2">{row.tokoRef || "-"}</td>
                    <td className="px-3 py-2">{row.salesName || "-"}</td>
                    <td className="px-3 py-2">{row.brand || "-"}</td>
                    <td className="px-3 py-2">{row.namaBrand || "-"}</td>
                    <td className="px-3 py-2">{row.produk || "-"}</td>
                    <td className="px-3 py-2">{row.namaBarang || "-"}</td>
                    <td className="px-3 py-2">{row.warna || "-"}</td>
                    <td className="px-3 py-2">
                      {row.noImei || row.imei1 || "-"}
                    </td>
                    <td className="px-3 py-2 text-right">{row.qty || 0}</td>
                    <td className="px-3 py-2">{row.hargaType}</td>
                    <td className="px-3 py-2 text-right">
                      {fmtIDR(row.harga)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {fmtIDR(
                        toNum(row.ongkirHsCard) +
                          toNum(row.aksesoris1Amount) +
                          toNum(row.aksesoris2Amount) +
                          toNum(row.bundlingProtectAmount)
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {fmtIDR(f.subtotal)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {Number(f.mdrPct).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right">{fmtIDR(f.net)}</td>
                    <td className="px-3 py-2">{row.paymentMethod}</td>
                    <td className="px-3 py-2">{row.leasingName || "-"}</td>
                    <td className="px-3 py-2 text-right">
                      {fmtIDR(row.dpMerchant)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {fmtIDR(row.dpToko)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {fmtIDR(row.dpTalangan)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {fmtIDR(f.cicilan)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {fmtIDR(f.grandTotal)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${
                          row.approved
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {row.approved ? "APPROVED" : "DRAFT"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        {!row.approved && canApprove && (
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
                  <td
                    colSpan={26}
                    className="px-3 py-6 text-center text-slate-500"
                  >
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
            {Math.min(endIdx, filteredRows.length)} dari {filteredRows.length}{" "}
            baris
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

      <p className="text-xs text-slate-500">
        * Jika dropdown masih kosong, cek kembali file sumber di folder{" "}
        <code>data</code> (brandIndex, getSalesByToko, baterai/charger, dll).
        Saya sudah menambahkan <code>console.warn</code> untuk memandu.
      </p>
    </div>
  );
}
