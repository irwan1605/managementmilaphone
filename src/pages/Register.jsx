// Register.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const tokoOptions = Array.from({ length: 10 }, (_, i) => i + 1);

export default function Register({ addUser }) {
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "pic_toko",
    toko: 1,
    name: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = () => {
    const { username, password, role, toko, name } = form;
    if (!username || !password) {
      setError("Username & password wajib diisi.");
      return;
    }

    // rakit role final
    const finalRole = role === "superadmin" ? "superadmin" : `pic_toko${toko}`;
    const newUser = {
      username: username.trim(),
      password,
      role: finalRole,
      toko: role === "superadmin" ? null : Number(toko),
      name: name || username.trim(),
    };

    // simpan ke localStorage.users
    try {
      const ls = JSON.parse(localStorage.getItem("users")) || [];
      if (ls.some((u) => u.username === newUser.username)) {
        setError("Username sudah dipakai.");
        return;
      }
      const updated = [...ls, newUser];
      localStorage.setItem("users", JSON.stringify(updated));
    } catch {
      localStorage.setItem("users", JSON.stringify([newUser]));
    }

    if (typeof addUser === "function") addUser(newUser);

    alert("Registrasi berhasil. Silakan login.");
    navigate("/", { replace: true });
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-[28rem]">
        <h2 className="text-xl font-bold mb-4 text-center">Register</h2>
        {error && <p className="text-red-500 mb-3 text-center">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">Nama Lengkap (opsional)</label>
            <input
              type="text"
              className="w-full border p-2 rounded"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nama lengkap"
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">Username</label>
            <input
              type="text"
              className="w-full border p-2 rounded"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="username"
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">Password</label>
            <input
              type="password"
              className="w-full border p-2 rounded"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="password"
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">Role</label>
            <select
              className="w-full border p-2 rounded"
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
                className="w-full border p-2 rounded"
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

        <button
          onClick={handleSubmit}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold"
        >
          Daftar
        </button>

        <div className="mt-3 text-center text-sm">
          Sudah punya akun?{" "}
          <a href="/" className="text-blue-600 hover:underline">
            Login
          </a>
        </div>
      </div>
    </div>
  );
}
