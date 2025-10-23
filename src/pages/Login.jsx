// src/pages/Login.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import defaultUsers from "../data/UserManagementRole";

export default function Login({ onLogin, users: usersProp }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Sumber users: props -> localStorage -> default
  const users = useMemo(() => {
    if (Array.isArray(usersProp) && usersProp.length) return usersProp;
    try {
      const ls = JSON.parse(localStorage.getItem("users"));
      return Array.isArray(ls) && ls.length ? ls : defaultUsers;
    } catch {
      return defaultUsers;
    }
  }, [usersProp]);

  useEffect(() => {
    // sinkronkan agar register dari halaman lain tetap terbaca
    localStorage.setItem("users", JSON.stringify(users));
  }, [users]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const u = users.find(
      (x) =>
        (x.username || "").trim().toLowerCase() === username.trim().toLowerCase() &&
        (x.password || "") === password
    );
    if (!u) {
      alert("Username/Password salah.");
      return;
    }

    // Normalisasi user yang login -> pastikan role & toko konsisten
    let role = u.role;
    let toko = u.toko;

    // Bila role pic_toko<something> tapi toko belum numerik, coba paksa numerik
    if (String(role).startsWith("pic_toko")) {
      const pickNum = Number(String(role).replace("pic_toko", "")) || Number(toko) || null;
      if (Number.isFinite(pickNum)) {
        role = `pic_toko${pickNum}`;
        toko = pickNum;
      }
    }

    const logged = {
      username: u.username,
      name: u.name || u.nama || u.username,
      role,
      toko, // numerik untuk PIC (null untuk superadmin)
    };
    localStorage.setItem("user", JSON.stringify(logged));
    if (typeof onLogin === "function") onLogin(logged);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-indigo-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-6">
          <div className="text-center mb-6">
            <img src="/logoMMT.png" alt="Logo" className="mx-auto h-12 w-12 object-contain" />
            <h1 className="mt-3 text-2xl font-bold text-slate-800">Inventory Pusat</h1>
            <p className="text-slate-500 text-sm">Silakan masuk ke akun Anda</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600">Username</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600">Password</label>
              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 transition shadow-md"
            >
              Masuk
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-slate-600">
            Belum punya akun?{" "}
            <Link className="text-indigo-600 hover:text-indigo-700 font-medium" to="/register">
              Daftar
            </Link>
          </div>
        </div>

        <p className="mt-3 text-center text-xs text-slate-500">
          Versi UI Tailwind — konsisten dengan komponen lain.
        </p>
      </div>
    </div>
  );
}
