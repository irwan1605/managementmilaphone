// UserManagement.jsx
import React, { useEffect, useState } from "react";
import defaultUsers from "../data/UserManagementRole";

const tokoOptions = Array.from({ length: 10 }, (_, i) => i + 1);

export default function UserManagement() {
  const [users, setUsers] = useState(() => {
    try {
      const ls = JSON.parse(localStorage.getItem("users"));
      return Array.isArray(ls) ? ls : defaultUsers;
    } catch {
      return defaultUsers;
    }
  });

  useEffect(() => {
    localStorage.setItem("users", JSON.stringify(users));
  }, [users]);

  // ---- form tambah ----
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "pic_toko",
    toko: 1,
    name: "",
  });

  const addUser = () => {
    if (!form.username || !form.password) {
      alert("Username & password wajib diisi.");
      return;
    }
    const finalRole = form.role === "superadmin" ? "superadmin" : `pic_toko${form.toko}`;
    const newUser = {
      username: form.username.trim(),
      password: form.password,
      role: finalRole,
      toko: form.role === "superadmin" ? null : Number(form.toko),
      name: form.name || form.username.trim(),
    };
    if (users.some((u) => u.username === newUser.username)) {
      alert("Username sudah dipakai.");
      return;
    }
    setUsers((prev) => [newUser, ...prev]);
    setForm({ username: "", password: "", role: "pic_toko", toko: 1, name: "" });
  };

  // ---- edit ----
  const [editing, setEditing] = useState(null); // username yang sedang diedit
  const [draft, setDraft] = useState(null);

  const beginEdit = (u) => {
    setEditing(u.username);
    setDraft({ ...u });
  };
  const cancelEdit = () => {
    setEditing(null);
    setDraft(null);
  };
  const saveEdit = () => {
    if (!draft.username || !draft.password) {
      alert("Username & password wajib diisi.");
      return;
    }
    setUsers((prev) =>
      prev.map((u) => (u.username === editing ? { ...draft } : u))
    );
    cancelEdit();
  };

  // ---- delete ----
  const del = (username) => {
    if (!window.confirm("Hapus user ini?")) return;
    setUsers((prev) => prev.filter((u) => u.username !== username));
  };

  // helper role/toko editor
  const rolePieces = (role, toko) => {
    if (role === "superadmin") return { base: "superadmin", toko: null };
    const match = /^pic_toko(\d+)$/.exec(role || "");
    return { base: "pic_toko", toko: Number(toko ?? (match ? match[1] : 1)) };
    // base = "superadmin" | "pic_toko"
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">User Management</h1>
        <p className="text-slate-600">Kelola pengguna, password, role, dan akses toko.</p>
      </div>

      {/* Form Tambah */}
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
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="pic_toko">pic_toko</option>
              <option value="superadmin">superadmin</option>
            </select>
          </div>
          {form.role !== "superadmin" && (
            <div>
              <label className="text-xs text-slate-600">Toko</label>
              <select
                className="w-full border rounded px-2 py-1"
                value={form.toko}
                onChange={(e) => setForm({ ...form, toko: Number(e.target.value) })}
              >
                {tokoOptions.map((n) => (
                  <option key={n} value={n}>
                    Toko {n}
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

      {/* Tabel Users */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Daftar User</h2>
          <span className="text-sm text-slate-500">{users.length} user</span>
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
              {users.map((u) => {
                const isEdit = editing === u.username;
                if (isEdit) {
                  const rp = rolePieces(draft.role, draft.toko);
                  return (
                    <tr key={u.username} className="border-b last:border-0 bg-slate-50/50">
                      <td className="px-3 py-2">{u.username}</td>
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
                          value={rp.base}
                          onChange={(e) => {
                            const base = e.target.value;
                            const role =
                              base === "superadmin" ? "superadmin" : `pic_toko${rp.toko || 1}`;
                            setDraft((d) => ({
                              ...d,
                              role,
                              toko: base === "superadmin" ? null : (rp.toko || 1),
                            }));
                          }}
                        >
                          <option value="pic_toko">pic_toko</option>
                          <option value="superadmin">superadmin</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        {draft.role === "superadmin" ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <select
                            className="border rounded px-2 py-1"
                            value={rp.toko || 1}
                            onChange={(e) => {
                              const toko = Number(e.target.value);
                              const role = `pic_toko${toko}`;
                              setDraft((d) => ({ ...d, toko, role }));
                            }}
                          >
                            {tokoOptions.map((n) => (
                              <option key={n} value={n}>
                                Toko {n}
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

                const { base, toko } = rolePieces(u.role, u.toko);
                return (
                  <tr key={u.username} className="border-b last:border-0">
                    <td className="px-3 py-2">{u.username}</td>
                    <td className="px-3 py-2">
                      <span className="font-mono">{u.password}</span>
                    </td>
                    <td className="px-3 py-2">{u.name || "—"}</td>
                    <td className="px-3 py-2">
                      {base === "superadmin" ? "superadmin" : "pic_toko"}
                    </td>
                    <td className="px-3 py-2">
                      {base === "superadmin" ? "—" : `Toko ${toko}`}
                    </td>
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
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                    Belum ada user.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Data user disimpan pada <code>localStorage.users</code> dan digunakan untuk proses login.
        </p>
      </div>
    </div>
  );
}
