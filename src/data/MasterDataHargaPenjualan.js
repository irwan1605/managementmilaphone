// src/data/MasterDataHargaPenjualan.js
// Master brand -> produk -> warna serta harga SRP & Grosir.
// Sesuaikan isinya dengan kebutuhanmu. Sudah disiapkan agar dropdown Brand→Produk→Warna bekerja.

const BRAND_INDEX = [
  {
    brand: "Selis",
    kategori: "Motor Listrik",
    products: [
      {
        name: "E-Max",
        warna: ["Hitam", "Putih", "Merah"],
        srp: 17000000,
        grosir: 16000000,
      },
      {
        name: "Nava",
        warna: ["Hitam", "Abu-abu"],
        srp: 15500000,
        grosir: 14500000,
      },
    ],
  },
  {
    brand: "United",
    kategori: "Motor Listrik",
    products: [
      {
        name: "TX1800",
        warna: ["Hitam", "Biru"],
        srp: 16500000,
        grosir: 15500000,
      },
      {
        name: "TX3000",
        warna: ["Merah", "Putih"],
        srp: 19500000,
        grosir: 18500000,
      },
    ],
  },
  {
    brand: "Yadea",
    kategori: "Motor Listrik",
    products: [
      {
        name: "G5",
        warna: ["Hitam", "Silver"],
        srp: 21000000,
        grosir: 20000000,
      },
      {
        name: "T9",
        warna: ["Putih", "Kuning"],
        srp: 18000000,
        grosir: 17000000,
      },
    ],
  },

  // Contoh handphone
  {
    brand: "Samsung",
    kategori: "Handphone",
    products: [
      {
        name: "Galaxy A15",
        warna: ["Hitam", "Biru"],
        srp: 2999000,
        grosir: 2899000,
      },
      {
        name: "Galaxy A55",
        warna: ["Hitam", "Hijau"],
        srp: 6499000,
        grosir: 6299000,
      },
    ],
  },
  {
    brand: "Xiaomi",
    kategori: "Handphone",
    products: [
      {
        name: "Redmi Note 13",
        warna: ["Hitam", "Biru"],
        srp: 2999000,
        grosir: 2899000,
      },
      {
        name: "Poco X6",
        warna: ["Hitam", "Putih"],
        srp: 4499000,
        grosir: 4399000,
      },
    ],
  },

  // Contoh accessories
  {
    brand: "Acc Generic",
    kategori: "Accessories",
    products: [
      {
        name: "Helm SNI",
        warna: ["Hitam", "Merah"],
        srp: 250000,
        grosir: 225000,
      },
      { name: "Sarung Tangan", warna: ["Hitam"], srp: 75000, grosir: 65000 },
    ],
  },
];

/** Deep clone supaya aman jika dimodifikasi di sisi pemanggil */
export function getBrandIndex() {
  return JSON.parse(JSON.stringify(BRAND_INDEX));
}

/**
 * Cari harga berdasarkan brand + nama produk (+opsional warna).
 * @param {{brand:string, name:string, warna?:string, prefer?:"srp"|"grosir"}} args
 * @returns {{brand:string,name:string,warna?:string,kategori:string,srp:number,grosir:number,harga:number}|undefined}
 */
export function findHarga({ brand, name, warna, prefer = "grosir" }) {
  const b = BRAND_INDEX.find(
    (x) => (x.brand || "").toLowerCase() === String(brand).toLowerCase()
  );
  if (!b) return undefined;

  const p = b.products.find(
    (pp) => (pp.name || "").toLowerCase() === String(name).toLowerCase()
  );
  if (!p) return undefined;

  // validasi warna opsional (harga tidak berubah pada contoh ini)
  if (warna) {
    const ok =
      (p.warna || []).some(
        (w) =>
          (w || "").toLowerCase().trim() === String(warna).toLowerCase().trim()
      ) || p.warna?.length === 0;
    if (!ok) {
      // Jika ingin strict, boleh return undefined di sini.
    }
  }

  const srp = Number(p.srp || 0);
  const grosir = Number(p.grosir || 0);
  const harga = prefer?.toLowerCase() === "srp" ? srp : grosir;

  return {
    brand: b.brand,
    name: p.name,
    warna,
    kategori: b.kategori || "Lainnya",
    srp,
    grosir,
    harga,
  };
}

/** Ambil daftar nama produk saja untuk brand tertentu */
export function getProductsByBrand(brand) {
  const b = BRAND_INDEX.find(
    (x) => (x.brand || "").toLowerCase() === String(brand).toLowerCase()
  );
  return b ? b.products.map((p) => p.name) : [];
}

/** Katalog (clone) untuk kebutuhan lain (misal DataManagement) */
export const CATALOG_INDEX = getBrandIndex();

/** Kompat untuk DataManagement.jsx yang meng-import HARGA_PENJUALAN */
export const HARGA_PENJUALAN = CATALOG_INDEX;

// Default export harus bukan anonymous object (lint fix)
const masterDataApi = {
  getBrandIndex,
  findHarga,
  getProductsByBrand,
  CATALOG_INDEX,
  HARGA_PENJUALAN,
};

export default masterDataApi;
