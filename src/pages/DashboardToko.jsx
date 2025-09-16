// src/pages/DashboardToko.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

/* ========== Satu sumber nama toko ========== */
import TOKO_LABELS from "../data/TokoLabels";

/* ========== Master harga & katalog ========== */
import { getBrandIndex, findHarga } from "../data/MasterDataHargaPenjualan";

/* ========== Payment method terpusat dari MasterDataPenjualan ========== */
import { PAYMENT_METHODS } from "../data/MasterDataPenjualan";

/* ========== Master list data dropdown & helper lain ========== */
import {
  PRICE_CATEGORIES,
  MP_PROTECT_OPTIONS,
  TENOR_OPTIONS,
  TOKO_LIST,
  getSalesByToko,
  getMdr,
  getBateraiByBrandProduct,
  getChargerByBrandProduct,
  getBungaByTenor, // pastikan diexport
} from "../data/ListDataPenjualan";

/* ========== Helper stok untuk 3 kartu ringkas ========== */
import { getStockIndex } from "../data/StockBarang";

/* ================= Utils ================= */
const toNum = (v) => (isNaN(Number(v)) ? 0 : Number(v));
const unique = (arr) =>
  Array.from(
    new Set((arr || []).map((x) => (x ?? "").toString().trim()).filter(Boolean))
  );

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

const formatDateTime = (d) => {
  try {
    const dt = new Date(d);
    return `${dt.toLocaleDateString("id-ID")} ${dt.toLocaleTimeString(
      "id-ID"
    )}`;
  } catch {
    return d || "-";
  }
};

// --- Normalisasi nama payment agar selalu valid terhadap PAYMENT_METHODS ---
function normalizePayment(method) {
  const s = String(method || "").trim();
  if (!s) return PAYMENT_METHODS[0] || "Cash";
  const hit = PAYMENT_METHODS.find((m) => m.toLowerCase() === s.toLowerCase());
  return hit || PAYMENT_METHODS[0] || "Cash";
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
    pick("tanggal", "tgl transaksi", "tgl", "tanggal transaksi", "date")
  );

  const brand = pick("brand", "merk", "merek");
  const produk =
    pick(
      "sepeda listrik",
      "sepedalistrik",
      "type",
      "tipe",
      "produk",
      "product",
      "name",
      "nama"
    ) || "Produk";
  const warna = pick("warna", "color");
  const qty = toNum(pick("qty", "jumlah", "kuantitas", "quantity"));
  const srp = toNum(pick("srp", "price", "harga srp"));
  const grosir = toNum(pick("grosir", "harga grosir"));
  const hargaTypeRaw =
    (pick("harga dipakai", "harga_pakai", "tipe harga", "price type") ||
      (grosir ? "GROSIR" : "SRP")) + "";
  const hargaType = /grosir/i.test(hargaTypeRaw) ? "GROSIR" : "SRP";
  const harga =
    toNum(pick("harga", "amount", "payment user (dashboard)")) || grosir || srp;
  const kategori =
    pick("kategori", "category") || (brand ? "Motor Listrik" : "Lainnya");

  const baterai = pick("baterai", "battery") || "";
  const charger = pick("charger", "pengisi daya") || "";

  const priceCategory =
    pick("kategori harga", "kategoriharga", "kat harga") || "";
  const mpProtect =
    pick("mp proteck", "mp protect", "proteck", "protect") || "";
  const paymentMethod =
    (pick("payment metode", "payment method", "pembayaran") || "") + "";
  const tenor = toNum(pick("tenor", "bulan"));
  const bunga = toNum(pick("bunga", "interest", "bunga%"));

  const salesName = pick("nama sales", "sales", "nama sales & sh");
  const nik = pick("nik", "id");
  const tokoRef = pick("toko", "nama toko");
  const storeName = pick("store", "nama store");
  const shName = pick("sh", "nama sh");
  const slName = pick("sl", "nama sl");
  const tuyulName = pick("tuyul", "freelance", "teknisi");

  const leasingName = pick("pembayaran melalui", "leasing") || "";
  const dp = toNum(pick("dp", "down payment"));
  const dpMerchant = toNum(
    pick("dp user via merchant", "dp merchant (piutang)")
  );
  const dpToko = toNum(pick("dp user ke toko", "dp toko (cash)"));
  const dpTalangan = toNum(pick("request dp talangan", "dp talangan"));
  const imei1 =
    pick("imei/no dinamo/rangka", "imei", "serial", "no rangka") || "";
  const imei2 =
    pick("imei/no dinamo/rangka 2", "imei2", "serial2", "no rangka 2") || "";
  const ongkirHsCard = toNum(pick("ongkir/hs card", "ongkir", "hs card"));
  const aksesoris1Desc = pick("aksesoris/sparepart", "aksesoris 1");
  const aksesoris1Amount = toNum(
    pick("aksesoris/sparepart rp", "aksesoris 1 rp")
  );
  const aksesoris2Desc = pick("aksesoris/sparepart 2");
  const aksesoris2Amount = toNum(pick("aksesoris/sparepart 2 rp"));
  const bundlingProtectAmount = toNum(
    pick("bundling mp proteck", "bundling proteck")
  );
  const free1 = pick("free/kelengkapan unit", "kelengkapan 1");
  const free2 = pick("free/kelengkapan unit 2", "kelengkapan 2");
  const free3 = pick("free/kelengkapan unit 3", "kelengkapan 3");

  // tambahan identitas user/order
  const akunPelanggan = pick(
    "akun transaksi (pelanggan)",
    "akun pelanggan",
    "akun"
  );
  const noHp = pick("no hp user / wa", "no hp", "whatsapp", "wa");
  const noKontrak = pick("no. kontrak/id order", "id order", "kontrak");
  const salesHandleTitipan = pick(
    "nama sales handle user titipan",
    "sales handle titipan"
  );
  const note = pick("note/keterangan tambahan", "catatan");
  const tglPengambilan = parseXlsxDate(
    pick("tgl pegambilan unit", "tgl pengambilan unit")
  );
  const alamatPengiriman = pick("alamat pengiriman", "alamat");

  return {
    tanggal,
    brand,
    produk,
    warna,
    qty,
    srp,
    grosir,
    hargaType,
    harga,
    kategori,
    priceCategory,
    mpProtect,
    baterai,
    charger,
    paymentMethod,
    tenor,
    bunga,
    salesName,
    nik,
    tokoRef,
    storeName,
    shName,
    slName,
    tuyulName,
    leasingName,
    dp,
    dpMerchant,
    dpToko,
    dpTalangan,
    imei1,
    imei2,
    ongkirHsCard,
    aksesoris1Desc,
    aksesoris1Amount,
    aksesoris2Desc,
    aksesoris2Amount,
    bundlingProtectAmount,
    free1,
    free2,
    free3,
    akunPelanggan,
    noHp,
    noKontrak,
    salesHandleTitipan,
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

/* ============== Komponen ============== */
export default function DashboardToko({ user, tokoId, initialData = [] }) {
  const navigate = useNavigate();
  const tokoName = useMemo(
    () => TOKO_LABELS[Number(tokoId)] || `Toko ${tokoId}`,
    [tokoId]
  );

  // stok ringkas untuk 3 kartu
  const stockIdx = useMemo(() => getStockIndex(tokoName) || {}, [tokoName]);
  const accCount = (stockIdx.accessories || []).length;
  const hpCount = (stockIdx.handphone || []).length;
  const molisCount = (stockIdx.motor_listrik || []).length;

  // katalog/brand
  const brandIndex = useMemo(() => getBrandIndex(), []);
  const brandOptions = useMemo(
    () => brandIndex.map((b) => b.brand),
    [brandIndex]
  );

  /* ---------- Data tabel ---------- */
  const [rows, setRows] = useState(() =>
    (initialData || []).map((r, i) => ({
      id: r.id ?? i + 1,
      tanggal: r.tanggal || new Date().toISOString().slice(0, 10),

      brand: r.brand ?? "",
      produk: r.produk ?? "",
      warna: r.warna ?? "",
      baterai: r.baterai ?? "",
      charger: r.charger ?? "",
      qty: toNum(r.qty),
      srp: toNum(r.srp),
      grosir: toNum(r.grosir),
      hargaType: r.hargaType || (r.grosir ? "GROSIR" : "SRP"),
      harga: toNum(r.harga || (r.grosir ? r.grosir : r.srp) || 0),
      kategori: r.kategori ?? "",
      priceCategory: r.priceCategory ?? "",
      mpProtect: r.mpProtect ?? "",

      paymentMethod: r.paymentMethod || PAYMENT_METHODS[0] || "Cash",
      tenor: toNum(r.tenor),
      bunga: toNum(r.bunga),
      dp: toNum(r.dp),
      leasingName: r.leasingName || "", // tetap ada untuk kompatibilitas
      dpMerchant: toNum(r.dpMerchant),
      dpToko: toNum(r.dpToko),
      dpTalangan: toNum(r.dpTalangan),

      imei1: r.imei1 || "",
      imei2: r.imei2 || "",
      ongkirHsCard: toNum(r.ongkirHsCard),
      aksesoris1Desc: r.aksesoris1Desc || "",
      aksesoris1Amount: toNum(r.aksesoris1Amount),
      aksesoris2Desc: r.aksesoris2Desc || "",
      aksesoris2Amount: toNum(r.aksesoris2Amount),
      bundlingProtectAmount: toNum(r.bundlingProtectAmount),
      free1: r.free1 || "",
      free2: r.free2 || "",
      free3: r.free3 || "",

      salesName: r.salesName || "",
      nik: r.nik || "",
      tokoRef: r.tokoRef || tokoName,
      storeName: r.storeName || "",
      shName: r.shName || "",
      slName: r.slName || "",
      tuyulName: r.tuyulName || "",

      // tambahan identitas user/order
      akunPelanggan: r.akunPelanggan || "",
      noHp: r.noHp || "",
      noKontrak: r.noKontrak || "",
      salesHandleTitipan: r.salesHandleTitipan || "",
      note: r.note || "",
      tglPengambilan: r.tglPengambilan || "",
      alamatPengiriman: r.alamatPengiriman || "",

      // approval status
      approved: !!r.approved,
      approvedBy: r.approvedBy || "",
      approvedAt: r.approvedAt || "",
    }))
  );

  /* ---------- Ringkasan ---------- */
  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        const f = computeFinancials(row, tokoName);
        acc.totalTransaksi += 1;
        acc.totalQty += toNum(row.qty);
        acc.totalOmzet += f.subtotal;
        acc.totalGrand += f.grandTotal;
        acc.totalNet += f.net;
        return acc;
      },
      {
        totalTransaksi: 0,
        totalQty: 0,
        totalOmzet: 0,
        totalGrand: 0,
        totalNet: 0,
      }
    );
  }, [rows, tokoName]);

  /* ---------- Form ---------- */
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(() => ({
    tanggal: new Date().toISOString().slice(0, 10),

    // identitas user/order
    salesHandleTitipan: "",
    akunPelanggan: "",
    noHp: "",
    noKontrak: "",

    // Sales & organisasi
    salesName: "",
    shName: "",
    tokoRef: TOKO_LIST?.includes(TOKO_LABELS[tokoId])
      ? TOKO_LABELS[tokoId]
      : TOKO_LABELS[tokoId],
    slName: "",
    tuyulName: "",
    nik: "",
    storeName: "",

    // Produk/Harga
    brand: (getBrandIndex()[0] && getBrandIndex()[0].brand) || "",
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
    priceCategory: PRICE_CATEGORIES?.[0] || "",
    mpProtect: "",

    // Payment
    paymentMethod: PAYMENT_METHODS[0] || "Cash",
    leasingName: "", // disinkron ke paymentMethod saat user ubah dropdown
    tenor: 0,
    bunga: 0,
    dp: 0,
    dpMerchant: 0,
    dpToko: 0,
    dpTalangan: 0,

    // Addons
    imei1: "",
    imei2: "",
    ongkirHsCard: 0,
    aksesoris1Desc: "",
    aksesoris1Amount: 0,
    aksesoris2Desc: "",
    aksesoris2Amount: 0,
    bundlingProtectAmount: 0,
    free1: "",
    free2: "",
    free3: "",

    // extra note
    note: "",
    tglPengambilan: "",
    alamatPengiriman: "",
  }));

  // produk dropdowns
  const productOptions = useMemo(() => {
    if (!form.brand) return [];
    const b = getBrandIndex().find((x) => x.brand === form.brand);
    return b ? b.products.map((p) => p.name) : [];
  }, [form.brand]);

  const warnaOptions = useMemo(() => {
    if (!form.brand || !form.produk) return [];
    const b = getBrandIndex().find((x) => x.brand === form.brand);
    const p = b?.products.find((pp) => pp.name === form.produk);
    return p ? p.warna : [];
  }, [form.brand, form.produk]);

  const bateraiOptions = useMemo(
    () => getBateraiByBrandProduct(form.brand, form.produk) || [],
    [form.brand, form.produk]
  );
  const chargerOptions = useMemo(
    () => getChargerByBrandProduct(form.brand, form.produk) || [],
    [form.brand, form.produk]
  );

  // Auto harga dari master
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
        // harga mengikuti tipe harga yang dipilih
        harga: toNum(f.hargaType === "SRP" ? row.srp : row.grosir),
        kategori: row.kategori || f.kategori,
      }));
    }
  }, [form.brand, form.produk, form.warna, form.hargaType]);

  // Auto isi data sales terkait
  useEffect(() => {
    if (!form.salesName) return;
    const sales =
      getSalesByToko(tokoName).find(
        (s) => (s.name || "").toLowerCase() === form.salesName.toLowerCase()
      ) || null;
    if (sales) {
      setForm((f) => ({
        ...f,
        nik: f.nik || sales.nik || "",
        tokoRef: f.tokoRef || sales.toko || tokoName,
        storeName: f.storeName || sales.store || "",
        shName: f.shName || sales.sh || "",
        slName: f.slName || sales.sl || "",
        tuyulName: f.tuyulName || sales.tuyul || "",
      }));
    }
  }, [form.salesName, tokoName]);

  // Auto bunga dari tenor (mapping helper)
  useEffect(() => {
    const t = toNum(form.tenor);
    if (!t) {
      setForm((f) => ({ ...f, bunga: 0 }));
      return;
    }
    try {
      const persen =
        getBungaByTenor?.({
          tenor: t,
          method: form.paymentMethod,
          brand: form.brand,
          toko: tokoName,
        }) ?? 0;
      setForm((f) => ({ ...f, bunga: toNum(persen) }));
    } catch {
      // jika helper belum ada, biarkan manual
    }
  }, [form.tenor, form.paymentMethod, form.brand, tokoName]);

  const onChangeBrand = (val) =>
    setForm((f) => ({
      ...f,
      brand: val,
      produk: "",
      warna: "",
      baterai: "",
      charger: "",
    }));
  const onChangeProduk = (val) =>
    setForm((f) => ({
      ...f,
      produk: val,
      warna: "",
      baterai: "",
      charger: "",
    }));

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
      approvedBy: "",
      approvedAt: "",
    };
    setRows((prev) => [newRow, ...prev]);

    // reset ringan
    setForm((f) => ({
      ...f,
      produk: "",
      warna: "",
      baterai: "",
      charger: "",
      qty: 1,
      imei1: "",
      imei2: "",
      ongkirHsCard: 0,
      aksesoris1Desc: "",
      aksesoris1Amount: 0,
      aksesoris2Desc: "",
      aksesoris2Amount: 0,
      bundlingProtectAmount: 0,
      free1: "",
      free2: "",
      free3: "",
      dpMerchant: 0,
      dpToko: 0,
      dpTalangan: 0,
    }));
  };

  /* ============== Import / Export ============== */
  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      const sheetName =
        wb.SheetNames.find((n) => /list|po/i.test(n)) || wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
      const normalized = json.map(normalizeRowFromExcel);

      const today = new Date().toISOString().slice(0, 10);
      const toRows = normalized.map((r, i) => ({
        id: rows.length + i + 1,
        approved: false,
        approvedBy: "",
        approvedAt: "",
        ...r,
        tanggal: r.tanggal || today,
        hargaType: r.hargaType || (r.grosir ? "GROSIR" : "SRP"),
        paymentMethod:
          PAYMENT_METHODS.find(
            (m) =>
              m.toLowerCase() === String(r.paymentMethod || "").toLowerCase()
          ) || "Cash",
        leasingName:
          PAYMENT_METHODS.find(
            (m) =>
              m.toLowerCase() === String(r.paymentMethod || "").toLowerCase()
          ) ||
          r.leasingName ||
          "",
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
      alert("File Excel tidak dikenali. Pastikan format kolom sesuai header.");
    }
  };

  const exportRows = (rowsToExport, sheetName, filePrefix) => {
    const data = rowsToExport.map((r) => {
      const f = computeFinancials(r, tokoName);
      return {
        TANGGAL: r.tanggal,
        TOKO: tokoName,
        KATEGORI: r.kategori,
        KATEGORI_HARGA: r.priceCategory,
        MP_PROTECK: r.mpProtect,
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
        PEMBAYARAN_MELALUI: r.paymentMethod, // gunakan payment method (bukan leasingName)
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
        FREE_1: r.free1,
        FREE_2: r.free2,
        FREE_3: r.free3,
        NAMA_SALES: r.salesName,
        SH: r.shName,
        NIK: r.nik,
        SL: r.slName,
        TUYUL: r.tuyulName,
        TOKO_REF: r.tokoRef,
        STORE: r.storeName,
        AKUN_PELANGGAN: r.akunPelanggan,
        NO_HP_WA: r.noHp,
        NO_KONTRAK: r.noKontrak,
        SALES_HANDLE_TITIPAN: r.salesHandleTitipan,
        NOTE: r.note,
        TGL_PENGAMBILAN: r.tglPengambilan,
        ALAMAT_PENGIRIMAN: r.alamatPengiriman,
        STATUS: r.approved ? "APPROVED" : "DRAFT",
        APPROVED_BY: r.approvedBy || "",
        APPROVED_AT: r.approvedAt || "",
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const safeName = (tokoName || "").replace(/[^\p{L}\p{N}_-]+/gu, "_");
    XLSX.writeFile(wb, `${filePrefix}_${safeName}_${ymd}.xlsx`);
  };

  const handleExportAll = () => exportRows(rows, "PO", "PO_ALL");
  const srpRows = useMemo(
    () => rows.filter((r) => r.hargaType === "SRP"),
    [rows]
  );
  const grosirRows = useMemo(
    () => rows.filter((r) => r.hargaType === "GROSIR"),
    [rows]
  );
  const handleExportSRP = () => exportRows(srpRows, "SRP", "PENJUALAN_SRP");
  const handleExportGrosir = () =>
    exportRows(grosirRows, "GROSIR", "PENJUALAN_GROSIR");

  // ============== Export Keuangan (sinkron ke FinanceReport import) ==============
  const handleExportKeuangan = React.useCallback(() => {
    // 1) Detail: map baris transaksi -> setoran
    const detail = rows
      .map((r) => {
        const f = computeFinancials(r, tokoName);
        const kategori = normalizePayment(r.paymentMethod);
        const isKredit = kategori.toLowerCase() === "kredit";

        // jumlah setoran yang benar-benar diterima
        const jumlah = isKredit
          ? toNum(r.dpMerchant) + toNum(r.dpToko) + toNum(r.dpTalangan)
          : f.net;

        const keterangan = [
          r.brand,
          r.produk,
          r.warna ? `(${r.warna})` : "",
          `x${toNum(r.qty) || 1}`,
          r.hargaType ? `[${r.hargaType}]` : "",
        ]
          .filter(Boolean)
          .join(" ");

        const refNo = r.noKontrak || r.imei1 || r.imei2 || "";
        const dibuatOleh = r.salesName || user?.username || user?.name || "";

        return {
          Tanggal: r.tanggal,
          Toko: tokoName, // FinanceReport detect nama toko
          Kategori: kategori, // harus cocok PAYMENT_METHODS
          Jumlah: Math.round(jumlah),
          Keterangan: keterangan,
          "No. Referensi": refNo,
          "Dibuat Oleh": dibuatOleh,
        };
      })
      // buang baris nol/negatif agar bersih
      .filter((x) => toNum(x.Jumlah) > 0);

    // 2) Rekap: agregasi per Tanggal × Kategori
    const rekapMap = new Map();
    for (const d of detail) {
      const key = `${d.Tanggal}||${d.Kategori}`;
      rekapMap.set(key, (rekapMap.get(key) || 0) + toNum(d.Jumlah));
    }
    const rekap = Array.from(rekapMap.entries()).map(([key, total]) => {
      const [Tanggal, Kategori] = key.split("||");
      return {
        Tanggal,
        Toko: tokoName,
        Kategori,
        Total: Math.round(total),
      };
    });

    if (detail.length === 0) {
      alert("Tidak ada data setoran yang dapat diexport.");
      return;
    }

    // 3) Tulis Excel
    const wsDetail = XLSX.utils.json_to_sheet(detail);
    const wsRekap = XLSX.utils.json_to_sheet(rekap);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsDetail, "Setoran"); // <- FinanceReport akan baca ini
    XLSX.utils.book_append_sheet(wb, wsRekap, "Rekap");

    const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const safeName = (tokoName || "").replace(/[^\p{L}\p{N}_-]+/gu, "_");
    XLSX.writeFile(wb, `Setoran_${safeName}_${ymd}.xlsx`);
  }, [rows, tokoName, user]);

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

  const canApprove = user?.role === "superadmin" || user?.role === "admin";
  const approveRow = (id) => {
    if (!canApprove) return;
    const approver = user?.username || user?.name || user?.role || "admin";
    const ts = new Date().toISOString();
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, approved: true, approvedBy: approver, approvedAt: ts }
          : r
      )
    );
  };

  /* ============== Derived untuk card Payment ============== */
  const finPreview = useMemo(
    () => computeFinancials(form, tokoName),
    [form, tokoName]
  );
  const sisaLimitBarang = useMemo(() => {
    const need = finPreview.subtotal;
    const paid =
      toNum(form.dpMerchant) + toNum(form.dpToko) + toNum(form.dpTalangan);
    return Math.max(0, need - paid);
  }, [finPreview, form.dpMerchant, form.dpToko, form.dpTalangan]);

  useEffect(() => {
    // tandai sebagai "used" agar ESLint no-unused-vars tidak warning
    void beginEdit;
    void saveEdit;
    void deleteRow;
    void approveRow;
  }, []);

  /* ============== Render ============== */
  return (
  <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between flex-wrap gap-3 bg-white/70 backdrop-blur rounded-2xl px-4 py-3 border shadow-sm">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard Toko — {tokoName}</h1>
        <p className="text-slate-600 text-sm">PO Penjualan, Payment, SRP/Kredit & Grosir. Dropdown & harga otomatis dari folder data.</p>
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
          className="cursor-pointer rounded-lg border bg-white px-3 h-10 text-sm shadow-sm hover:bg-slate-50 inline-flex items-center"
          title="Import Excel (.xlsx)"
        >
          Import Excel (.xlsx)
        </label>

        <button
          onClick={handleExportAll}
          className="rounded-lg border bg-white px-3 h-10 text-sm shadow-sm hover:bg-slate-50 inline-flex items-center"
          title="Export semua (.xlsx)"
        >
          Export ALL
        </button>

        <button
          onClick={handleExportKeuangan}
          className="rounded-lg bg-emerald-600 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 text-white px-3 h-10 text-sm font-semibold shadow-sm inline-flex items-center"
          title="Export file setoran untuk laporan keuangan pusat"
        >
          Export Keuangan
        </button>
      </div>
    </div>

    {/* Cards ringkasan */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition">
        <div className="text-sm text-slate-500">Total Transaksi</div>
        <div className="mt-1 text-2xl font-semibold">{totals.totalTransaksi}</div>
      </div>
      <div className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition">
        <div className="text-sm text-slate-500">Total Qty</div>
        <div className="mt-1 text-2xl font-semibold">{totals.totalQty}</div>
      </div>
      <div className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition">
        <div className="text-sm text-slate-500">Subtotal</div>
        <div className="mt-1 text-2xl font-semibold">{formatCurrency(totals.totalOmzet)}</div>
      </div>
      <div className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition">
        <div className="text-sm text-slate-500">Grand Total</div>
        <div className="mt-1 text-2xl font-semibold">{formatCurrency(totals.totalGrand)}</div>
      </div>
      <div className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition">
        <div className="text-sm text-slate-500">NET (setelah MDR)</div>
        <div className="mt-1 text-2xl font-semibold">{formatCurrency(totals.totalNet)}</div>
      </div>
    </div>

    {/* 3 Kartu Stok (ringkas) */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Accessories */}
      <button
        onClick={() => navigate(`/toko/${tokoId}/stock-accessories`)}
        className="group relative rounded-2xl p-[2px] bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500"
      >
        <div className="rounded-2xl bg-white p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-600">Stock Accessories</div>
            <div className="text-2xl font-bold">{accCount} item</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 opacity-80 group-hover:opacity-100 transition shadow-lg" />
        </div>
        <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-30 blur-xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 transition" />
      </button>

      {/* Handphone */}
      <button
        onClick={() => navigate(`/toko/${tokoId}/stock-handphone`)}
        className="group relative rounded-2xl p-[2px] bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500"
      >
        <div className="rounded-2xl bg-white p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-600">Stock Handphone</div>
            <div className="text-2xl font-bold">{hpCount} item</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-sky-500 opacity-80 group-hover:opacity-100 transition shadow-lg" />
        </div>
        <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-30 blur-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 transition" />
      </button>

      {/* Motor Listrik */}
      <button
        onClick={() => navigate(`/toko/${tokoId}/stock-motor-listrik`)}
        className="group relative rounded-2xl p-[2px] bg-gradient-to-r from-amber-500 via-orange-500 to-red-500"
      >
        <div className="rounded-2xl bg-white p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-600">Stock Motor Listrik</div>
            <div className="text-2xl font-bold">{molisCount} item</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-red-500 opacity-80 group-hover:opacity-100 transition shadow-lg" />
        </div>
        <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-30 blur-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 transition" />
      </button>
    </div>

    {/* CARD 1 — PO PENJUALAN */}
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-3">PO PENJUALAN</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <div>
          <label className="text-xs text-slate-600">Tgl Transaksi</label>
          <input
            type="date"
            className="w-full border rounded-lg px-3 h-10"
            value={form.tanggal}
            onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
          />
        </div>

        <div className="xl:col-span-2">
          <label className="text-xs text-slate-600">Nama Sales & SH</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              className="border rounded-lg px-3 h-10"
              value={form.salesName}
              onChange={(e) => setForm({ ...form, salesName: e.target.value })}
            >
              <option value="">— Pilih Sales —</option>
              {getSalesByToko(tokoName).map((s) => (
                <option key={s.nik || s.name} value={s.name}>{s.name}</option>
              ))}
            </select>
            <select
              className="border rounded-lg px-3 h-10"
              value={form.shName}
              onChange={(e) => setForm({ ...form, shName: e.target.value })}
            >
              <option value="">— Pilih SH —</option>
              {unique(getSalesByToko(tokoName).map((s) => s.sh)).map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="xl:col-span-2">
          <label className="text-xs text-slate-600">Nama Toko & Nama SL</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              className="border rounded-lg px-3 h-10"
              value={form.tokoRef}
              onChange={(e) => setForm({ ...form, tokoRef: e.target.value })}
            >
              {TOKO_LIST?.length
                ? TOKO_LIST.map((t) => <option key={t} value={t}>{t}</option>)
                : <option value={tokoName}>{tokoName}</option>
              }
            </select>
            <select
              className="border rounded-lg px-3 h-10"
              value={form.slName}
              onChange={(e) => setForm({ ...form, slName: e.target.value })}
            >
              <option value="">— Pilih SL —</option>
              {unique(getSalesByToko(tokoName).map((s) => s.sl)).map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-600">Nama Freelance/Teknisi</label>
          <select
            className="w-full border rounded-lg px-3 h-10"
            value={form.tuyulName}
            onChange={(e) => setForm({ ...form, tuyulName: e.target.value })}
          >
            <option value="">— Pilih —</option>
            {unique(getSalesByToko(tokoName).map((s) => s.tuyul)).map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-600">Sales handle user titipan</label>
          <input
            className="w-full border rounded-lg px-3 h-10"
            value={form.salesHandleTitipan}
            onChange={(e) => setForm({ ...form, salesHandleTitipan: e.target.value })}
          />
        </div>

        <div>
          <label className="text-xs text-slate-600">Akun Transaksi (PELANGGAN)</label>
          <input
            className="w-full border rounded-lg px-3 h-10"
            value={form.akunPelanggan}
            onChange={(e) => setForm({ ...form, akunPelanggan: e.target.value })}
          />
        </div>

        <div>
          <label className="text-xs text-slate-600">No Hp user / WA</label>
          <input
            className="w-full border rounded-lg px-3 h-10"
            value={form.noHp}
            onChange={(e) => setForm({ ...form, noHp: e.target.value })}
          />
        </div>

        <div>
          <label className="text-xs text-slate-600">No. KONTRAK/ID ORDER</label>
          <input
            className="w-full border rounded-lg px-3 h-10"
            value={form.noKontrak}
            onChange={(e) => setForm({ ...form, noKontrak: e.target.value })}
          />
        </div>
      </div>
    </div>

    {/* CARD 2 — PAYMENT METODE */}
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-3">PAYMENT METODE</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <div>
          <label className="text-xs text-slate-600">KATEGORI HARGA</label>
          <select
            className="w-full border rounded-lg px-3 h-10"
            value={form.priceCategory}
            onChange={(e) => setForm({ ...form, priceCategory: e.target.value })}
          >
            <option value="">— Pilih —</option>
            {PRICE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="xl:col-span-2">
          <label className="text-xs text-slate-600">PAYMENT METODE</label>
          <select
            className="w-full border rounded-lg px-3 h-10"
            value={form.paymentMethod}
            onChange={(e) => {
              const method = e.target.value;
              setForm((f) => ({ ...f, paymentMethod: method, leasingName: method }));
            }}
          >
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div className="xl:col-span-2">
          <label className="text-xs text-slate-600">Nominal Transaksi</label>
          <input
            type="number"
            min={0}
            className="w-full border rounded-lg px-3 h-10 text-right"
            value={form.harga}
            onChange={(e) => setForm({ ...form, harga: toNum(e.target.value) })}
          />
        </div>

        <div>
          <label className="text-xs text-slate-600">MDR (Pot Marketplace)</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              readOnly
              className="border rounded-lg px-3 h-10 bg-slate-50 text-right"
              value={Number(getMdr({ method: form.paymentMethod, toko: tokoName, brand: form.brand }) || 0).toFixed(2)}
              title="Persentase MDR otomatis"
            />
            <input
              readOnly
              className="border rounded-lg px-3 h-10 bg-slate-50 text-right"
              value={`- ${formatCurrency(finPreview.mdrFee)}`}
              title="Nominal MDR otomatis"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-600">Tenor</label>
          <select
            className="w-full border rounded-lg px-3 h-10 text-right"
            value={form.tenor}
            onChange={(e) => setForm({ ...form, tenor: toNum(e.target.value) })}
          >
            <option value={0}>— Pilih —</option>
            {TENOR_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-600">Bunga % (auto)</label>
          <input
            readOnly
            className="w-full border rounded-lg px-3 h-10 bg-slate-50 text-right"
            value={toNum(form.bunga).toFixed(2)}
            title="Diisi otomatis dari tenor via getBungaByTenor"
          />
        </div>

        <div>
          <label className="text-xs text-slate-600">Dp via Merchant (PIUTANG)</label>
          <input
            type="number"
            min={0}
            className="w-full border rounded-lg px-3 h-10 text-right"
            value={form.dpMerchant}
            onChange={(e) => setForm({ ...form, dpMerchant: toNum(e.target.value) })}
          />
        </div>

        <div>
          <label className="text-xs text-slate-600">DP ke Toko (CASH)</label>
          <input
            type="number"
            min={0}
            className="w-full border rounded-lg px-3 h-10 text-right"
            value={form.dpToko}
            onChange={(e) => setForm({ ...form, dpToko: toNum(e.target.value) })}
          />
        </div>

        <div>
          <label className="text-xs text-slate-600">Request DP Talangan</label>
          <input
            type="number"
            min={0}
            className="w-full border rounded-lg px-3 h-10 text-right"
            value={form.dpTalangan}
            onChange={(e) => setForm({ ...form, dpTalangan: toNum(e.target.value) })}
          />
        </div>

        <div className="xl:col-span-2">
          <label className="text-xs text-slate-600">Sisa Limit Untuk BARANG</label>
          <input
            readOnly
            className="w-full border rounded-lg px-3 h-10 bg-slate-50 text-right"
            value={formatCurrency(sisaLimitBarang)}
            title="Subtotal − (DP Merchant + DP Toko + DP Talangan)"
          />
        </div>
      </div>
    </div>

    {/* CARD 3 — PENJUALAN SRP/KREDIT */}
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-3">PENJUALAN SRP/KREDIT</h2>

      {/* MOLIS utama */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
        <div>
          <label className="text-xs text-slate-600">BANYAKNYA UNIT MOLIS</label>
          <input
            type="number"
            min={0}
            className="w-full border rounded-lg px-3 h-10 text-right"
            value={form.qty}
            onChange={(e) => setForm({ ...form, qty: toNum(e.target.value) })}
          />
        </div>

        <div className="xl:col-span-2">
          <label className="text-xs text-slate-600">TYPE UNIT SELIS MOLIS</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              className="border rounded-lg px-3 h-10"
              value={form.brand}
              onChange={(e) => onChangeBrand(e.target.value)}
            >
              {brandOptions.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <select
              className="border rounded-lg px-3 h-10"
              value={form.produk}
              onChange={(e) => onChangeProduk(e.target.value)}
            >
              <option value="">— Pilih Produk —</option>
              {productOptions.map((p) => (
                <option key={`${form.brand}-${p}`} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-600">Warna</label>
          <select
            className="w-full border rounded-lg px-3 h-10"
            value={form.warna}
            onChange={(e) => setForm({ ...form, warna: e.target.value })}
          >
            <option value="">— Pilih Warna —</option>
            {warnaOptions.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-600">Baterai</label>
          <select
            className="w-full border rounded-lg px-3 h-10"
            value={form.baterai}
            onChange={(e) => setForm({ ...form, baterai: e.target.value })}
          >
            <option value="">— Pilih —</option>
            {bateraiOptions.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-600">CHARGER</label>
          <select
            className="w-full border rounded-lg px-3 h-10"
            value={form.charger}
            onChange={(e) => setForm({ ...form, charger: e.target.value })}
          >
            <option value="">— Pilih —</option>
            {chargerOptions.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
        <div>
          <label className="text-xs text-slate-600">Harga Dipakai</label>
          <select
            className="w-full border rounded-lg px-3 h-10"
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
            className="w-full border rounded-lg px-3 h-10 text-right"
            value={form.srp}
            onChange={(e) => setForm({ ...form, srp: toNum(e.target.value) })}
          />
        </div>

        <div>
          <label className="text-xs text-slate-600">GROSIR</label>
          <input
            type="number"
            min={0}
            className="w-full border rounded-lg px-3 h-10 text-right"
            value={form.grosir}
            onChange={(e) => setForm({ ...form, grosir: toNum(e.target.value) })}
          />
        </div>

        <div className="xl:col-span-3">
          <label className="text-xs text-slate-600">TOTAL HARGA MOLIS</label>
          <input
            readOnly
            className="w-full border rounded-lg px-3 h-10 bg-slate-50 text-right"
            value={formatCurrency(toNum(form.qty) * toNum(form.harga))}
            title="Qty × Harga"
          />
        </div>
      </div>

      {/* IMEI / Ongkir / Accessories / Bundling / Free */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
        <div className="xl:col-span-3">
          <label className="text-xs text-slate-600">IMEI/NO DINAMO/RANGKA</label>
          <input
            className="w-full border rounded-lg px-3 h-10"
            value={form.imei1}
            onChange={(e) => setForm({ ...form, imei1: e.target.value })}
          />
        </div>
        <div className="xl:col-span-3">
          <label className="text-xs text-slate-600">IMEI/NO DINAMO/RANGKA</label>
          <input
            className="w-full border rounded-lg px-3 h-10"
            value={form.imei2}
            onChange={(e) => setForm({ ...form, imei2: e.target.value })}
          />
        </div>

        <div>
          <label className="text-xs text-slate-600">BANYAKNYA ONGKIR</label>
          <input readOnly className="w-full border rounded-lg px-3 h-10 bg-slate-50" value="-" />
        </div>
        <div>
          <label className="text-xs text-slate-600">ONGKIR/HS CARD</label>
          <input
            type="number"
            min={0}
            className="w-full border rounded-lg px-3 h-10 text-right"
            value={form.ongkirHsCard}
            onChange={(e) => setForm({ ...form, ongkirHsCard: toNum(e.target.value) })}
          />
        </div>

        <div>
          <label className="text-xs text-slate-600">BANYAKNYA AKSESORIS/SPAREPART</label>
          <input readOnly className="w-full border rounded-lg px-3 h-10 bg-slate-50" value="-" />
        </div>
        <div className="xl:col-span-2">
          <label className="text-xs text-slate-600">AKSESORIS/SPAREPART</label>
          <input
            className="w-full border rounded-lg px-3 h-10"
            value={form.aksesoris1Desc}
            onChange={(e) => setForm({ ...form, aksesoris1Desc: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs text-slate-600">TOTAL HARGA</label>
          <input
            type="number"
            min={0}
            className="w-full border rounded-lg px-3 h-10 text-right"
            value={form.aksesoris1Amount}
            onChange={(e) => setForm({ ...form, aksesoris1Amount: toNum(e.target.value) })}
          />
        </div>

        <div>
          <label className="text-xs text-slate-600">BANYAKNYA AKSESORIS/SPAREPART</label>
          <input readOnly className="w-full border rounded-lg px-3 h-10 bg-slate-50" value="-" />
        </div>
        <div className="xl:col-span-2">
          <label className="text-xs text-slate-600">AKSESORIS/SPAREPART</label>
          <input
            className="w-full border rounded-lg px-3 h-10"
            value={form.aksesoris2Desc}
            onChange={(e) => setForm({ ...form, aksesoris2Desc: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs text-slate-600">TOTAL HARGA</label>
          <input
            type="number"
            min={0}
            className="w-full border rounded-lg px-3 h-10 text-right"
            value={form.aksesoris2Amount}
            onChange={(e) => setForm({ ...form, aksesoris2Amount: toNum(e.target.value) })}
          />
        </div>

        <div>
          <label className="text-xs text-slate-600">BANYAKNYA BUNDLING MP PROTECK</label>
          <input readOnly className="w-full border rounded-lg px-3 h-10 bg-slate-50" value="-" />
        </div>
        <div>
          <label className="text-xs text-slate-600">TOTAL HARGA</label>
          <input
            type="number"
            min={0}
            className="w-full border rounded-lg px-3 h-10 text-right"
            value={form.bundlingProtectAmount}
            onChange={(e) => setForm({ ...form, bundlingProtectAmount: toNum(e.target.value) })}
          />
        </div>
        <div className="xl:col-span-4">
          <label className="text-xs text-slate-600">BUNDLING MP PROTECK</label>
          <select
            className="w-full border rounded-lg px-3 h-10"
            value={form.mpProtect}
            onChange={(e) => setForm({ ...form, mpProtect: e.target.value })}
          >
            <option value="">— Pilih —</option>
            {MP_PROTECT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div className="xl:col-span-2">
          <label className="text-xs text-slate-600">FREE/KELENGKAPAN UNIT</label>
          <input className="w-full border rounded-lg px-3 h-10" value={form.free1} onChange={(e) => setForm({ ...form, free1: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-slate-600">BANYAKNYA</label>
          <input readOnly className="w-full border rounded-lg px-3 h-10 bg-slate-50" value="-" />
        </div>

        <div className="xl:col-span-2">
          <label className="text-xs text-slate-600">FREE/KELENGKAPAN UNIT</label>
          <input className="w-full border rounded-lg px-3 h-10" value={form.free2} onChange={(e) => setForm({ ...form, free2: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-slate-600">BANYAKNYA</label>
          <input readOnly className="w-full border rounded-lg px-3 h-10 bg-slate-50" value="-" />
        </div>

        <div className="xl:col-span-2">
          <label className="text-xs text-slate-600">FREE/KELENGKAPAN UNIT</label>
          <input className="w-full border rounded-lg px-3 h-10" value={form.free3} onChange={(e) => setForm({ ...form, free3: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-slate-600">BANYAKNYA</label>
          <input readOnly className="w-full border rounded-lg px-3 h-10 bg-slate-50" value="-" />
        </div>
      </div>

      <div className="mt-3">
        <button
          onClick={addRow}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 text-white px-4 h-10 text-sm font-semibold shadow-sm"
        >
          Tambah
        </button>
      </div>
    </div>

    {/* CARD 4 — PENJUALAN GROSIR */}
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-3">PENJUALAN GROSIR</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <div className="xl:col-span-3">
          <div className="text-sm text-slate-600">TOTAL BARANG SELIS MOLIS</div>
          <div className="font-semibold">
            {formatCurrency(
              rows
                .filter((r) => r.hargaType === "GROSIR")
                .reduce((acc, r) => acc + computeFinancials(r, tokoName).subtotal, 0)
            )}
          </div>
        </div>
        <div className="xl:col-span-3">
          <div className="text-sm text-slate-600">TOTAL HARGA</div>
          <div className="font-semibold">
            {formatCurrency(grosirRows.reduce((a, r) => a + computeFinancials(r, tokoName).subtotal, 0))}
          </div>
        </div>
      </div>
    </div>

    {/* TABEL & EXPORT */}
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">PO Penjualan — Semua</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportSRP}
            className="rounded-lg border bg-white px-3 h-10 text-sm shadow-sm hover:bg-slate-50"
          >
            Export SRP (.xlsx)
          </button>
          <button
            onClick={handleExportGrosir}
            className="rounded-lg border bg-white px-3 h-10 text-sm shadow-sm hover:bg-slate-50"
          >
            Export Grosir (.xlsx)
          </button>
        </div>
      </div>

      {/* Shell responsif: mobile cards + desktop table */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden rounded-2xl border bg-white">
            {/* MOBILE CARDS */}
            <div className="md:hidden divide-y">
              {rows.map((row) => {
                const f = computeFinancials(row, tokoName);
                return (
                  <div key={row.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{row.produk || "-"}</div>
                        <div className="text-xs text-slate-500">
                          {row.brand} • {row.tanggal}
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${
                          row.approved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {row.approved ? "APPROVED" : "DRAFT"}
                      </span>
                    </div>

                    <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-slate-500">Payment</dt>
                        <dd className="font-medium">{row.paymentMethod}</dd>
                      </div>
                      <div className="text-right">
                        <dt className="text-slate-500">NET</dt>
                        <dd className="font-semibold">{formatCurrency(f.net)}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Qty</dt>
                        <dd className="font-medium">{row.qty}</dd>
                      </div>
                      <div className="text-right">
                        <dt className="text-slate-500">Harga</dt>
                        <dd className="font-medium">{formatCurrency(row.harga)}</dd>
                      </div>
                    </dl>
                  </div>
                );
              })}
              {rows.length === 0 && (
                <div className="p-6 text-center text-slate-500">
                  Belum ada data transaksi untuk {tokoName}.
                </div>
              )}
            </div>

            {/* DESKTOP TABLE */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left">Tanggal</th>
                    <th className="px-3 py-2 text-left">Brand</th>
                    <th className="px-3 py-2 text-left">Produk</th>
                    <th className="px-3 py-2 text-right">Harga</th>
                    <th className="px-3 py-2 text-right">NET</th>
                    <th className="px-3 py-2 text-left">Payment</th>
                    <th className="px-3 py-2 text-left hidden lg:table-cell">Warna</th>
                    <th className="px-3 py-2 text-right hidden lg:table-cell">Qty</th>
                    <th className="px-3 py-2 text-right hidden xl:table-cell">AddOns</th>
                    <th className="px-3 py-2 text-right hidden xl:table-cell">MDR %</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((row) => {
                    const f = computeFinancials(row, tokoName);
                    return (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2">{row.tanggal}</td>
                        <td className="px-3 py-2">{row.brand}</td>
                        <td className="px-3 py-2">{row.produk}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(row.harga)}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(f.net)}</td>
                        <td className="px-3 py-2">{row.paymentMethod}</td>
                        <td className="px-3 py-2 hidden lg:table-cell">{row.warna || "-"}</td>
                        <td className="px-3 py-2 text-right hidden lg:table-cell">{row.qty}</td>
                        <td className="px-3 py-2 text-right hidden xl:table-cell">
                          {formatCurrency(
                            toNum(row.ongkirHsCard) +
                              toNum(row.aksesoris1Amount) +
                              toNum(row.aksesoris2Amount) +
                              toNum(row.bundlingProtectAmount)
                          )}
                        </td>
                        <td className="px-3 py-2 text-right hidden xl:table-cell">
                          {Number(f.mdrPct).toFixed(2)}
                        </td>
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
                          <div className="flex items-center gap-2">
                            {/* tempatkan aksi jika diperlukan */}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={12} className="px-3 py-6 text-center text-slate-500">
                        Belum ada data transaksi untuk {tokoName}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Catatan & pengiriman */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <div className="xl:col-span-3">
          <label className="text-xs text-slate-600">Note/keterangan tambahan</label>
          <input
            className="w-full border rounded-lg px-3 h-10"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs text-slate-600">TGL PENGAMBILAN UNIT</label>
          <input
            type="date"
            className="w-full border rounded-lg px-3 h-10"
            value={form.tglPengambilan}
            onChange={(e) => setForm({ ...form, tglPengambilan: e.target.value })}
          />
        </div>
        <div className="xl:col-span-2">
          <label className="text-xs text-slate-600">ALAMAT PENGIRIMAN</label>
          <input
            className="w-full border rounded-lg px-3 h-10"
            value={form.alamatPengiriman}
            onChange={(e) => setForm({ ...form, alamatPengiriman: e.target.value })}
          />
        </div>
      </div>
    </div>

    <p className="text-xs text-slate-500">
      Semua Dropdown/Rumus mengikuti file di folder <code>data</code>. MDR% & nominal otomatis,
      Bunga% terisi otomatis saat memilih tenor (<code>getBungaByTenor</code>).
      “Sisa Limit Untuk BARANG” = Subtotal − (DP Merchant + DP Toko + DP Talangan).
      PAYMENT METODE diekspor terpusat dari <code>MasterDataPenjualan.js</code>.
    </p>
  </div>
);
}
