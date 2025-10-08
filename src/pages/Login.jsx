// src/pages/Login.jsx - MODIFIED
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GoogleAuth from "../components/GoogleAuth/GoogleAuth"; // Import komponen GoogleAuth
import { useAuth } from "../components/GoogleAuth/AuthContext"; // Import useAuth hook

export default function Login({ onLogin, users }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { isAuthenticated, userProfile, login, logout } = useAuth(); // Ambil dari AuthContext

  // --- Login Lokal ---
  const handleLocalLogin = (e) => {
    e.preventDefault();
    setError("");

    const foundUser = users.find(
      (u) => u.username === username && u.password === password
    );

    if (foundUser) {
      onLogin(foundUser); // Ini akan mengupdate state 'user' di App.jsx
      navigate("/dashboard");
    } else {
      setError("Username atau password salah.");
    }
  };

  // --- Callback setelah Google Login (dari GoogleAuth component) ---
  const handleGoogleAuthChange = (isGoogleLoggedIn) => {
    if (isGoogleLoggedIn && userProfile) {
      // Logic Anda untuk mengautentikasi user Google di sistem lokal
      // Misalnya, cek apakah email Google userProfile.email sudah terdaftar
      // Jika belum, Anda bisa arahkan ke halaman register atau membuat user baru secara otomatis
      // Untuk tujuan demo, kita asumsikan login Google berarti "berhasil"
      console.log("User Google berhasil login:", userProfile);

      // Cek apakah user Google ini sudah terdaftar di sistem lokal kita
      const existingUser = users.find((u) => u.email === userProfile.email);

      if (existingUser) {
        onLogin(existingUser); // Login ke sistem lokal dengan user yang sudah ada
        navigate("/dashboard");
      } else {
        // Jika belum ada, Anda bisa memutuskan untuk:
        // 1. Otomatis membuat user baru (misal, role default 'pic_toko')
        // 2. Arahkan ke halaman register dengan data Google sudah terisi
        // 3. Tampilkan pesan bahwa akun Google ini belum terdaftar.

        // Contoh: Jika user Google belum terdaftar, bisa tampilkan pesan
        setError(
          "Akun Google ini belum terdaftar di sistem. Silakan login lokal atau daftar."
        );
        // Atau: Anda bisa panggil addUser(newUser) dan onLogin(newUser) di App.jsx
        // logout(); // Logout dari Google jika tidak diizinkan masuk
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          Silahkan Login ke Mila Phone Management
        </h2>

        {/* Tombol Google Login */}
        <GoogleAuth onAuthChange={handleGoogleAuthChange} />
        {isAuthenticated && userProfile && (
          <p className="text-center text-sm text-green-600">
            Terhubung dengan Google sebagai {userProfile.name} (
            {userProfile.email})
          </p>
        )}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">Atau</span>
          </div>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleLocalLogin}>
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <button
              type="submit"
              className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Login
            </button>
          </div>
        </form>
        <p className="text-sm text-center text-gray-600">
          Belum punya akun?{" "}
          <a
            href="/register"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Daftar sekarang
          </a>
        </p>
      </div>
    </div>
  );
}
