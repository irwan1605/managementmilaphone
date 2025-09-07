// src/pages/UserManagement.jsx
import React, { useEffect, useMemo, useState } from "react";
import defaultUsers from "../data/UserManagementRole";
import TOKO_LABELS from "../data/TokoLabels";

const tokoEntries = Object.entries(TOKO_LABELS)
  .map(([id, label]) => ({ id: Number(id), label }))
  .sort((a, b) => a.id - b.id);

function rolePieces(role, toko) {
  if (role === "superadmin") return { base: "superadmin", tokoId: null };
  const m = /^pic_toko(\d+)$/.exec(role || "");
  const tokoId = Number(toko ?? (m ? m[1] : undefined));
  return { base: "pic_toko", tokoId: Number.isFinite(tokoId) ? tokoId : null };
}

export default function UserManagement() {
  // ====== sumber data users (localStorage -> default) ======
  const [users, setUsers] = useState(() => {
    try {
      const ls = JSON.parse(localStorage.getItem("users"));
      return Array.isArray(ls) && ls.length ? ls : defaultUsers;
    } catch {
      return defaultUsers;
    }
  });

  useEffect(() => {
    localStorage.setItem("users", JSON.stringify(users));
  }, [users]);

  // ====== form tambah user ======
  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    roleBase: "pic_toko", // "superadmin" | "pic_toko"
    tokoId: tokoEntries[0]?.id ?? 1, // aktif saat roleBase = pic_toko
  });

  const resetForm = () =>
    setForm({
      name: "",
      username: "",
      password: "",
      roleBase: "pic_toko",
      tokoId: tokoEntries[0]?.id ?? 1,
    });

  const addUser = () => {
    const username = (form.username || "").trim();
    const password = (form.password || "").trim();

    if (!username || !password) {
      alert("Username & Password wajib diisi.");
      return;
    }
    if (users.some((u) => u.username === username)) {
      alert("Username sudah dipakai.");
      return;
    }

    const final =
      form.roleBase === "superadmin"
        ? {
            username,
            password,
            role: "superadmin",
            toko: null,
            name: form.name?.trim() || username,
          }
        : {
            username,
            password,
            role: `pic_toko${form.tokoId}`,
            toko: form.tokoId,
            name: form.name?.trim() || username,
          };

    setUsers((prev) => [final, ...prev]);
    resetForm();
    // reset halaman ke pertama setelah tambah
    setPage(1);
  };

  // ====== edit user ======
  const [editing, setEditing] = useState(null); // username yg sedang diedit
  const [draft, setDraft] = useState(null);

  const beginEdit = (u) => {
    const { base, tokoId } = rolePieces(u.role, u.toko);
    setEditing(u.username);
    setDraft({
      ...u,
      roleBase: base,
      tokoId: tokoId,
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setDraft(null);
  };

  const saveEdit = () => {
    if (!draft) return;
    const password = (draft.password || "").trim();
    if (!password) {
      alert("Password tidak boleh kosong.");
      return;
    }

    const final =
      draft.roleBase === "superadmin"
        ? {
            ...draft,
            role: "superadmin",
            toko: null,
          }
        : {
            ...draft,
            role: `pic_toko${draft.tokoId}`,
            toko: draft.tokoId,
          };

    // username dipakai sbg primary key & tidak diubah pada edit
    setUsers((prev) => prev.map((u) => (u.username === editing ? final : u)));
    cancelEdit();
  };

  // ====== delete user ======
  const del = (username) => {
    if (!window.confirm("Hapus user ini?")) return;
    setUsers((prev) => prev.filter((u) => u.username !== username));
    // jika di halaman terakhir dan setelah hapus data habis, mundurkan halaman
    setTimeout(() => {
      setPage((p) => {
        const newCount = filteredUsers.length - 1;
        const totalPages = Math.max(1, Math.ceil(newCount / pageSize));
        return Math.min(p, totalPages);
      });
    }, 0);
  };

  // ====== FILTER & SEARCH ======
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all"); // all | superadmin | pic_toko
  const [filterTokoId, setFilterTokoId] = useState("all"); // "all" | number

  // Reset ke page 1 saat filter berubah
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterRole, filterTokoId]);

  const filteredUsers = useMemo(() => {
    const s = searchTerm.trim().toLowerCase();

    return users
      .filter((u) => {
        // Filter role
        if (filterRole !== "all") {
          if (filterRole === "superadmin" && u.role !== "superadmin") return false;
          if (filterRole === "pic_toko" && !/^pic_toko\d+$/i.test(u.role || "")) return false;
        }
        // Filter toko
        if (filterTokoId !== "all") {
          const { tokoId } = rolePieces(u.role, u.toko);
          if (tokoId !== Number(filterTokoId)) return false;
        }
        // Search (username, name, role, label toko)
        if (!s) return true;
        const { tokoId } = rolePieces(u.role, u.toko);
        const tokoLabel = tokoId ? TOKO_LABELS[tokoId] || `Toko ${tokoId}` : "—";
        const haystack = [
          u.username,
          u.name,
          u.role,
          String(tokoId || ""),
          tokoLabel,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(s);
      })
      .sort((a, b) => a.username.localeCompare(b.username));
  }, [users, searchTerm, filterRole, filterTokoId]);

  // ====== PAGINATION ======
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredUsers.length / pageSize)),
    [filteredUsers.length, pageSize]
  );

  // Clamp page ketika filteredUsers atau pageSize berubah
  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const pageUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize]);

  // ====== ringkasan/utility ======
  const countByRole = useMemo(() => {
    const acc = { superadmin: 0, pic_toko: 0 };
    for (const u of users) {
      if (u.role === "superadmin") acc.superadmin += 1;
      else acc.pic_toko += 1;
    }
    return acc;
  }, [users]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">User Management</h1>
        <p className="text-slate-600">
          Kelola pengguna, password, role, dan akses toko. Nama toko memakai label dari TokoLabels.js.
        </p>
      </div>

      {/* ====== Form Tambah ====== */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Tambah User</h2>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">Nama Lengkap (opsional)</label>
            <input
              className="w-full border rounded px-2 py-1"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nama lengkap"
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">Username</label>
            <input
              className="w-full border rounded px-2 py-1"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="username"
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">Password</label>
            <input
              type="text"
              className="w-full border rounded px-2 py-1"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="password"
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">Role</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={form.roleBase}
              onChange={(e) => setForm({ ...form, roleBase: e.target.value })}
            >
              <option value="pic_toko">pic_toko</option>
              <option value="superadmin">superadmin</option>
            </select>
          </div>

          {form.roleBase !== "superadmin" && (
            <div>
              <label className="text-xs text-slate-600">Toko (pic_toko)</label>
              <select
                className="w-full border rounded px-2 py-1"
                value={form.tokoId}
                onChange={(e) => setForm({ ...form, tokoId: Number(e.target.value) })}
              >
                {tokoEntries.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="mt-3">
          <button
            onClick={addUser}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold shadow-sm"
          >
            Tambah
          </button>
        </div>
      </div>

      {/* ====== Filter & Search ====== */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">Cari</label>
            <input
              className="w-full border rounded px-2 py-1"
              placeholder="Cari username, nama, role, atau toko…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">Role</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">Semua Role</option>
              <option value="superadmin">superadmin</option>
              <option value="pic_toko">pic_toko</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-600">Toko (untuk pic_toko)</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={filterTokoId}
              onChange={(e) => setFilterTokoId(e.target.value === "all" ? "all" : Number(e.target.value))}
            >
              <option value="all">Semua Toko</option>
              {tokoEntries.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-600">Item per halaman</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n} / halaman
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 text-xs text-slate-500">
          Menampilkan {pageUsers.length} dari {filteredUsers.length} hasil (total {users.length} user).
        </div>
      </div>

      {/* ====== Tabel Users ====== */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Daftar User</h2>
          <div className="text-sm text-slate-500">
            SA: {countByRole.superadmin} • PIC: {countByRole.pic_toko}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left">Username</th>
                <th className="px-3 py-2 text-left">Password</th>
                <th className="px-3 py-2 text-left">Nama</th>
                <th className="px-3 py-2 text-left">Role</th>
                <th className="px-3 py-2 text-left">Toko</th>
                <th className="px-3 py-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pageUsers.map((u) => {
                const isEdit = editing === u.username;

                if (isEdit && draft) {
                  const { roleBase } = draft;
                  const tokoId =
                    roleBase === "superadmin"
                      ? null
                      : (draft.tokoId ?? rolePieces(draft.role, draft.toko).tokoId) ??
                        tokoEntries[0]?.id ??
                        1;

                  return (
                    <tr key={u.username} className="border-b last:border-0 bg-slate-50/50">
                      <td className="px-3 py-2">
                        <span className="font-mono">{u.username}</span>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1"
                          value={draft.password}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, password: e.target.value }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="border rounded px-2 py-1"
                          value={draft.name || ""}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, name: e.target.value }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          className="border rounded px-2 py-1"
                          value={roleBase}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, roleBase: e.target.value }))
                          }
                        >
                          <option value="pic_toko">pic_toko</option>
                          <option value="superadmin">superadmin</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        {roleBase === "superadmin" ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <select
                            className="border rounded px-2 py-1"
                            value={tokoId ?? ""}
                            onChange={(e) =>
                              setDraft((d) => ({ ...d, tokoId: Number(e.target.value) }))
                            }
                          >
                            {tokoEntries.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        )}
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

                const { base, tokoId } = rolePieces(u.role, u.toko);
                const tokoLabel =
                  base === "superadmin"
                    ? "—"
                    : TOKO_LABELS[tokoId] || (tokoId ? `Toko ${tokoId}` : "—");

                return (
                  <tr key={u.username} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <span className="font-mono">{u.username}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-mono">{u.password}</span>
                    </td>
                    <td className="px-3 py-2">{u.name || "—"}</td>
                    <td className="px-3 py-2">{base}</td>
                    <td className="px-3 py-2">{tokoLabel}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => beginEdit(u)}
                          className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => del(u.username)}
                          className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {pageUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                    Tidak ada hasil. Coba ubah filter atau kata kunci.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ====== Pagination controls ====== */}
        <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-sm text-slate-600">
            Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className={`px-3 py-1 rounded border text-sm ${
                page <= 1 ? "bg-slate-100 text-slate-400" : "bg-white hover:bg-slate-50"
              }`}
            >
              ‹ Sebelumnya
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className={`px-3 py-1 rounded border text-sm ${
                page >= totalPages ? "bg-slate-100 text-slate-400" : "bg-white hover:bg-slate-50"
              }`}
            >
              Berikutnya ›
            </button>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Data user disimpan pada <code>localStorage.users</code> dan digunakan untuk proses Login.
          Role <code>pic_toko</code> disimpan sebagai <code>pic_toko&lt;id&gt;</code> (mis. <code>pic_toko3</code>).
          Nama toko ditampilkan dari <code>TokoLabels.js</code>. Gunakan filter & pagination untuk mempermudah pencarian.
        </p>
      </div>
    </div>
  );
}
