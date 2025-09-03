// Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import defaultUsers from "../data/UserManagementRole";

const Login = ({ onLogin, users }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const list =
    users ||
    (() => {
      try {
        const ls = JSON.parse(localStorage.getItem("users"));
        return Array.isArray(ls) ? ls : defaultUsers;
      } catch {
        return defaultUsers;
      }
    })();

  const handleLogin = () => {
    const foundUser = list.find(
      (u) => u.username === username.trim() && u.password === password
    );
    if (!foundUser) {
      setError("Username atau password salah!");
      return;
    }
    localStorage.setItem("user", JSON.stringify(foundUser));
    if (typeof onLogin === "function") onLogin(foundUser);

    if (foundUser.role === "superadmin") {
      navigate("/dashboard", { replace: true });
    } else if (foundUser.role?.startsWith("pic_toko")) {
      const tokoId = Number(foundUser.toko ?? foundUser.role.replace("pic_toko", "")) || 1;
      navigate(`/toko/${tokoId}`, { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  };

  const onKeyDown = (e) => e.key === "Enter" && handleLogin();

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4 text-center">Login</h2>
        {error && <p className="text-red-500 mb-3 text-center">{error}</p>}

        <input
          type="text"
          placeholder="Username"
          className="w-full border p-2 mb-3 rounded"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={onKeyDown}
          autoFocus
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2 mb-4 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={onKeyDown}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 transition text-white py-2 rounded font-semibold"
        >
          Login
        </button>

        <div className="mt-4 text-center text-sm text-slate-600">
          Belum punya akun?{" "}
          <a href="/register" className="text-blue-600 hover:underline">
            Register
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
