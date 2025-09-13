// src/pages/stock/StockAccessories.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";

import TOKO_LABELS, { ALL_TOKO_IDS } from "../../data/TokoLabels";
import { getStockIndex } from "../../data/StockBarang";

const toNum = (v) => (isNaN(Number(v)) ? 0 : Number(v));
const TODAY = new Date().toISOString().slice(0, 10);

const LS_LOCAL = "MMT_STOCK_ACC_LOCAL_V1";
const LS_HIDDEN = "MMT_STOCK_ACC_HIDDEN_V1";

function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(LS_LOCAL) || "{}");
  } catch {
    return {};
  }
}
function saveLocal(map) {
  try {
    localStorage.setItem(LS_LOCAL, JSON.stringify(map));
  } catch {}
}
function loadHidden() {
  try {
    return JSON.parse(localStorage.getItem(LS_HIDDEN) || "{}");
  } catch {
    return {};
  }
}
function saveHidden(map) {
  try {
    localStorage.setItem(LS_HIDDEN, JSON.stringify(map));
  } catch {}
}

function accKey(row) {
  return (row.namaBarang || row.imei || "").toString().trim().toLowerCase();
}
function normalizeBaseAcc(raw, tokoName) {
  const nama = raw.namaBarang || raw.nama || raw.name || raw.product || "";
  const imei = (raw.imei || raw.serial || "").toString(); // aksesoris mungkin tanpa imei
  const stokSistem = toNum(raw.stokSistem ?? raw.stok_sistem ?? raw.stok ?? 0);
  const stokFisik = toNum(raw.stokFisik ?? raw.stok_fisik ?? 0);
  const keterangan = raw.keterangan || raw.note || "";
  return {
    id: `${tokoName}::base::${accKey({ namaBarang: nama, imei })}`,
    source: "base",
    tanggal: raw.tanggal ? String(raw.tanggal).slice(0, 10) : "",
    tokoName,
    namaBarang: nama,
    imei,
    stokSistem,
    stokFisik,
    keterangan,
  };
}
function normalizeLocalAcc(raw, tokoName) {
  return {
    id: raw.id || `${tokoName}::local::${Date.now()}::${Math.random().toString(36).slice(2, 8)}`,
    source: "local",
    tanggal: raw.tanggal ? String(raw.tanggal).slice(0, 10) : TODAY,
    tokoName,
    namaBarang: raw.namaBarang || "",
    imei: (raw.imei || "").toString(),
    stokSistem: toNum(raw.stokSistem),
    stokFisik: toNum(raw.stokFisik),
    keterangan: raw.keterangan || "",
  };
}

export default function StockAccessoriesPusat({ user }) {
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === "superadmin";
  const isAdmin = user?.role === "admin";
  const picMatch = /^pic_toko(\d+)$/i.exec(user?.role || "");
  const picTokoId = picMatch ? Number(picMatch[1]) : (user?.toko ? Number(user.toko) : null);

  const [scope, setScope] = useState(
    isSuperAdmin || isAdmin ? "all" : picTokoId ? String(picTokoId) : "all"
  );
  const selectedTokoIds = useMemo(() => {
    if (scope === "all") return ALL_TOKO_IDS;
    const id = Number(scope);
    return ALL_TOKO_IDS.includes(id) ? [id] : [];
  }, [scope]);

  const baseRows = useMemo(() => {
    const out = [];
    for (const id of selectedTokoIds) {
      const tokoName = TOKO_LABELS[id];
      const idx = getStockIndex(tokoName);
      const acc = idx?.accessories || [];
      for (const r of acc) out.push(normalizeBaseAcc(r, tokoName));
    }
    return out;
  }, [selectedTokoIds]);

  const [localMap, setLocalMap] = useState(() => loadLocal());
  const [hiddenMap, setHiddenMap] = useState(() => loadHidden());

  const mergedRows = useMemo(() => {
    const hiddenSet = new Set(
      selectedTokoIds.flatMap((id) => hiddenMap[TOKO_LABELS[id]] || [])
    );
    const byKey = new Map();
    for (const r of baseRows) {
      const key = `${r.tokoName}::${accKey(r)}`;
      if (!hiddenSet.has(key)) byKey.set(key, r);
    }
    for (const id of selectedTokoIds) {
      const tokoName = TOKO_LABELS[id];
      const locals = (localMap[tokoName] || []).map((x) => normalizeLocalAcc(x, tokoName));
      for (const lr of locals) {
        const key = `${lr.tokoName}::${accKey(lr)}`;
        if (accKey(lr)) byKey.set(key, { ...lr, source: "local" });
        else byKey.set(lr.id, lr);
      }
    }
    return Array.from(byKey.values()).sort((a, b) =>
      (b.tanggal || "").localeCompare(a.tanggal || "")
    );
  }, [baseRows, localMap, hiddenMap, selectedTokoIds]);

  const ringkas = useMemo(
    () =>
      mergedRows.reduce(
        (acc, r) => {
          acc.items += 1;
          acc.stokSistem += toNum(r.stokSistem);
          acc.stokFisik += toNum(r.stokFisik);
          return acc;
        },
        { items: 0, stokSistem: 0, stokFisik: 0 }
      ),
    [mergedRows]
  );

  const [form, setForm] = useState(() => ({
    tanggal: TODAY,
    tokoId: selectedTokoIds[0] || ALL_TOKO_IDS[0],
    namaBarang: "",
    imei: "",
    stokSistem: 0,
    stokFisik: 0,
    keterangan: "",
  }));

  useEffect(() => {
    setForm((f) => ({ ...f, tokoId: selectedTokoIds[0] ?? ALL_TOKO_IDS[0] }));
  }, [selectedTokoIds]);

  const addRow = () => {
    const tokoName = TOKO_LABELS[Number(form.tokoId)];
    const next = {
      source: "local",
      tanggal: form.tanggal || TODAY,
      namaBarang: form.namaBarang,
      imei: (form.imei || "").toString(),
      stokSistem: toNum(form.stokSistem),
      stokFisik: toNum(form.stokFisik),
      keterangan: form.keterangan || "",
    };
    const map = loadLocal();
    map[tokoName] = Array.isArray(map[tokoName]) ? [...map[tokoName], next] : [next];
    saveLocal(map);
    setLocalMap(map);

    setForm((f) => ({
      ...f,
      namaBarang: "",
      imei: "",
      stokSistem: 0,
      stokFisik: 0,
      keterangan: "",
    }));
  };

  const [editId, setEditId] = useState(null);
  const [draft, setDraft] = useState(null);

  const beginEdit = (row) => {
    setEditId(row.id);
    setDraft({ ...row });
  };
  const cancelEdit = () => {
    setEditId(null);
    setDraft(null);
  };
  const saveEdit = () => {
    const tokoName = draft.tokoName;
    const key = accKey(draft);
    const map = loadLocal();
    const arr = Array.isArray(map[tokoName]) ? [...map[tokoName]] : [];

    if (draft.source === "base") {
      const override = {
        source: "local",
        tanggal: draft.tanggal || TODAY,
        namaBarang: draft.namaBarang || "",
        imei: (draft.imei || "").toString(),
        stokSistem: toNum(draft.stokSistem),
        stokFisik: toNum(draft.stokFisik),
        keterangan: draft.keterangan || "",
      };
      const filtered = arr.filter((x) => accKey(x) !== key);
      map[tokoName] = [...filtered, override];
    } else {
      map[tokoName] = arr.map((x) =>
        normalizeLocalAcc(x, tokoName).id === draft.id
          ? {
              source: "local",
              tanggal: draft.tanggal || TODAY,
              namaBarang: draft.namaBarang || "",
              imei: (draft.imei || "").toString(),
              stokSistem: toNum(draft.stokSistem),
              stokFisik: toNum(draft.stokFisik),
              keterangan: draft.keterangan || "",
            }
          : x
      );
    }

    saveLocal(map);
    setLocalMap(map);
    cancelEdit();
  };

  const deleteRow = (row) => {
    const tokoName = row.tokoName;
    if (row.source === "local") {
      const map = loadLocal();
      const arr = Array.isArray(map[tokoName]) ? [...map[tokoName]] : [];
      const next = arr.filter((x) => normalizeLocalAcc(x, tokoName).id !== row.id);
      map[tokoName] = next;
      saveLocal(map);
      setLocalMap(map);
    } else {
      const key = `${row.tokoName}::${accKey(row)}`;
      const hmap = loadHidden();
      const list = Array.isArray(hmap[tokoName]) ? new Set(hmap[tokoName]) : new Set();
      list.add(key);
      hmap[tokoName] = Array.from(list);
      saveHidden(hmap);
      setHiddenMap(hmap);
    }
  };

  const fileRef = useRef(null);
  const onImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { defval: "" });

      const rowsToAdd = json.map((r) => {
        const lower = Object.fromEntries(
          Object.entries(r).map(([k, v]) => [String(k).trim().toLowerCase(), v])
        );
        const pick = (...keys) => {
          for (const k of keys) if (k in lower && `${lower[k]}`.trim() !== "") return lower[k];
          return "";
        };
        const tokoName = pick("toko", "store") || TOKO_LABELS[Number(form.tokoId)];
        return normalizeLocalAcc(
          {
            tanggal: String(pick("tanggal", "tgl", "date")).slice(0, 10) || TODAY,
            namaBarang: pick("nama barang", "nama", "product", "model"),
            imei: pick("imei", "serial"),
            stokSistem: toNum(pick("stok sistem", "stok_sistem", "stok")),
            stokFisik: toNum(pick("stok fisik", "stok_fisik")),
            keterangan: pick("keterangan", "catatan"),
          },
          tokoName
        );
      });

      const grouped = new Map();
      for (const r of rowsToAdd) {
        if (!grouped.has(r.tokoName)) grouped.set(r.tokoName, []);
        grouped.get(r.tokoName).push({
          source: "local",
          tanggal: r.tanggal,
          namaBarang: r.namaBarang,
          imei: r.imei,
          stokSistem: r.stokSistem,
          stokFisik: r.stokFisik,
          keterangan: r.keterangan,
        });
      }

      const map = loadLocal();
      for (const [tokoName, arr] of grouped.entries()) {
        map[tokoName] = Array.isArray(map[tokoName]) ? [...map[tokoName], ...arr] : arr;
      }
      saveLocal(map);
      setLocalMap(map);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      console.error(err);
      alert("Gagal import. Pastikan format kolom sesuai.");
    }
  };

  const onExport = () => {
    const data = mergedRows.map((r) => ({
      TANGGAL: r.tanggal,
      TOKO: r.tokoName,
      NAMA_BARANG: r.namaBarang,
      IMEI: r.imei,
      STOK_SISTEM: r.stokSistem,
      STOK_FISIK: r.stokFisik,
      KETERANGAN: r.keterangan,
      SUMBER: r.source,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock ACC");
    const label =
      scope === "all" ? "SEMUA_TOKO" : TOKO_LABELS[Number(scope)].replace(/\s+/g, "_");
    const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    XLSX.writeFile(wb, `STOCK_ACCESSORIES_${label}_${ymd}.xlsx`);
  };

  const back = () => navigate(-1);
  const canPickAll = isSuperAdmin || isAdmin;
  const tokoOptions = [{ value: "all", label: "— Semua Toko —" }, ...ALL_TOKO_IDS.map((id) => ({ value: String(id), label: TOKO_LABELS[id] }))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Produk & Stock — Accessories</h1>
          <p className="text-slate-600">Pemeriksaan stock pusat.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={back}
            className="rounded-lg border bg-white px-3 py-2 text-sm shadow-sm hover:bg-slate-50"
          >
            ← Kembali
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            id="import-xlsx"
            onChange={onImport}
          />
          <label
            htmlFor="import-xlsx"
            className="cursor-pointer rounded-lg border bg-white px-3 py-2 text-sm shadow-sm hover:bg-slate-50"
          >
            Import Excel
          </label>
          <button
            onClick={onExport}
            className="rounded-lg border bg-white px-3 py-2 text-sm shadow-sm hover:bg-slate-50"
          >
            Export Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Total Item</div>
          <div className="mt-1 text-2xl font-semibold">{ringkas.items}</div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Total Stok Sistem</div>
          <div className="mt-1 text-2xl font-semibold">{ringkas.stokSistem}</div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Total Stok Fisik</div>
          <div className="mt-1 text-2xl font-semibold">{ringkas.stokFisik}</div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <label className="text-xs text-slate-600">Toko</label>
          <select
            className="mt-1 w-full border rounded px-2 py-1"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            disabled={!canPickAll}
          >
            {tokoOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Form tambah */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Tambah Stock (Lokal)</h2>
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
              value={form.tokoId}
              onChange={(e) => setForm({ ...form, tokoId: Number(e.target.value) })}
              disabled={!canPickAll && scope !== "all"}
            >
              {ALL_TOKO_IDS.map((id) => (
                <option key={id} value={id}>
                  {TOKO_LABELS[id]}
                </option>
              ))}
            </select>
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
            <label className="text-xs text-slate-600">IMEI (opsional)</label>
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
              min={0}
              className="w-full border rounded px-2 py-1 text-right"
              value={form.stokSistem}
              onChange={(e) => setForm({ ...form, stokSistem: toNum(e.target.value) })}
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">Stok Fisik</label>
            <input
              type="number"
              min={0}
              className="w-full border rounded px-2 py-1 text-right"
              value={form.stokFisik}
              onChange={(e) => setForm({ ...form, stokFisik: toNum(e.target.value) })}
            />
          </div>
          <div className="md:col-span-3">
            <label className="text-xs text-slate-600">Keterangan</label>
            <input
              className="w-full border rounded px-2 py-1"
              value={form.keterangan}
              onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
            />
          </div>
          <div className="md:col-span-3 flex items-end">
            <button
              onClick={addRow}
              className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold shadow-sm w-full md:w-auto"
            >
              Tambah
            </button>
          </div>
        </div>
      </div>

      {/* Tabel */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm overflow-x-auto">
        <h2 className="text-lg font-semibold mb-3">Daftar Stock</h2>
        <table className="min-w-[980px] text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left">Tanggal</th>
              <th className="px-3 py-2 text-left">Toko</th>
              <th className="px-3 py-2 text-left">Nama Barang</th>
              <th className="px-3 py-2 text-left">IMEI</th>
              <th className="px-3 py-2 text-right">Stok Sistem</th>
              <th className="px-3 py-2 text-right">Stok Fisik</th>
              <th className="px-3 py-2 text-left">Keterangan</th>
              <th className="px-3 py-2 text-left">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {mergedRows.map((r) => {
              const [editId, setEditId] = [null, null]; // dummy to satisfy lints—handled below
              return null;
            })}
            {mergedRows.map((r) => (
              <EditableRow
                key={r.id}
                row={r}
                onSave={(draft) => {
                  // inline handlers borrowed from the HP page
                  const tokoName = draft.tokoName;
                  const key = accKey(draft);
                  const map = loadLocal();
                  const arr = Array.isArray(map[tokoName]) ? [...map[tokoName]] : [];

                  if (draft.source === "base") {
                    const override = {
                      source: "local",
                      tanggal: draft.tanggal || TODAY,
                      namaBarang: draft.namaBarang || "",
                      imei: (draft.imei || "").toString(),
                      stokSistem: toNum(draft.stokSistem),
                      stokFisik: toNum(draft.stokFisik),
                      keterangan: draft.keterangan || "",
                    };
                    const filtered = arr.filter((x) => accKey(x) !== key);
                    map[tokoName] = [...filtered, override];
                  } else {
                    map[tokoName] = arr.map((x) =>
                      normalizeLocalAcc(x, tokoName).id === draft.id
                        ? {
                            source: "local",
                            tanggal: draft.tanggal || TODAY,
                            namaBarang: draft.namaBarang || "",
                            imei: (draft.imei || "").toString(),
                            stokSistem: toNum(draft.stokSistem),
                            stokFisik: toNum(draft.stokFisik),
                            keterangan: draft.keterangan || "",
                          }
                        : x
                    );
                  }
                  saveLocal(map);
                  setLocalMap(map);
                }}
                onDelete={(row) => {
                  if (!window.confirm("Hapus baris ini?")) return;
                  const tokoName = row.tokoName;
                  if (row.source === "local") {
                    const map = loadLocal();
                    const arr = Array.isArray(map[tokoName]) ? [...map[tokoName]] : [];
                    const next = arr.filter((x) => normalizeLocalAcc(x, tokoName).id !== row.id);
                    map[tokoName] = next;
                    saveLocal(map);
                    setLocalMap(map);
                  } else {
                    const key = `${row.tokoName}::${accKey(row)}`;
                    const hmap = loadHidden();
                    const list = Array.isArray(hmap[tokoName]) ? new Set(hmap[tokoName]) : new Set();
                    list.add(key);
                    hmap[tokoName] = Array.from(list);
                    saveHidden(hmap);
                    setHiddenMap(hmap);
                  }
                }}
              />
            ))}
            {mergedRows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-slate-500" colSpan={8}>
                  Belum ada data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        Data dasar dari <code>getStockIndex(tokoName).accessories</code>. Tambahan/override/hidden
        disimpan di <code>{LS_LOCAL}</code> & <code>{LS_HIDDEN}</code>.
      </p>
    </div>
  );
}

/* ===== Row component (edit inline) ===== */
function EditableRow({ row, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [d, setD] = useState({ ...row });

  if (editing) {
    return (
      <tr className="border-b last:border-0 bg-slate-50/60">
        <td className="px-3 py-2">
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={d.tanggal || ""}
            onChange={(e) => setD((x) => ({ ...x, tanggal: e.target.value }))}
          />
        </td>
        <td className="px-3 py-2">{row.tokoName}</td>
        <td className="px-3 py-2">
          <input
            className="border rounded px-2 py-1 w-48"
            value={d.namaBarang}
            onChange={(e) => setD((x) => ({ ...x, namaBarang: e.target.value }))}
          />
        </td>
        <td className="px-3 py-2">
          <input
            className="border rounded px-2 py-1"
            value={d.imei}
            onChange={(e) => setD((x) => ({ ...x, imei: e.target.value }))}
          />
        </td>
        <td className="px-3 py-2 text-right">
          <input
            type="number"
            className="border rounded px-2 py-1 text-right w-24"
            value={d.stokSistem}
            onChange={(e) => setD((x) => ({ ...x, stokSistem: toNum(e.target.value) }))}
          />
        </td>
        <td className="px-3 py-2 text-right">
          <input
            type="number"
            className="border rounded px-2 py-1 text-right w-24"
            value={d.stokFisik}
            onChange={(e) => setD((x) => ({ ...x, stokFisik: toNum(e.target.value) }))}
          />
        </td>
        <td className="px-3 py-2">
          <input
            className="border rounded px-2 py-1 w-48"
            value={d.keterangan}
            onChange={(e) => setD((x) => ({ ...x, keterangan: e.target.value }))}
          />
        </td>
        <td className="px-3 py-2">
          <div className="flex gap-2">
            <button
              onClick={() => {
                onSave(d);
                setEditing(false);
              }}
              className="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700"
            >
              Simpan
            </button>
            <button
              onClick={() => setEditing(false)}
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
    <tr className="border-b last:border-0">
      <td className="px-3 py-2">{row.tanggal || "-"}</td>
      <td className="px-3 py-2">{row.tokoName}</td>
      <td className="px-3 py-2">{row.namaBarang}</td>
      <td className="px-3 py-2">{row.imei || "-"}</td>
      <td className="px-3 py-2 text-right">{row.stokSistem}</td>
      <td className="px-3 py-2 text-right">{row.stokFisik}</td>
      <td className="px-3 py-2">{row.keterangan || "-"}</td>
      <td className="px-3 py-2">
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(row)}
            className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
          >
            Hapus
          </button>
        </div>
      </td>
    </tr>
  );
}
