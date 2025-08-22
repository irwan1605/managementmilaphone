import React, { useState } from "react";

export default function Register({ onRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("pic_toko");

  const handleSubmit = (e) => {
    e.preventDefault();
    // kirim data ke parent
    onRegister({ username, password, role });
  };

  return (
    <div className="flex justify-center items-center h-[80vh]">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded p-6 w-96"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>

        <label className="block mb-2 font-medium">Username</label>
        <input
          type="text"
          className="border w-full px-3 py-2 mb-4 rounded"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <label className="block mb-2 font-medium">Password</label>
        <input
          type="password"
          className="border w-full px-3 py-2 mb-4 rounded"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <label className="block mb-2 font-medium">Select Role</label>
        <select
          className="border w-full px-3 py-2 mb-4 rounded"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="superadmin">Superadmin</option>
          <option value="pic_toko">PIC Toko</option>
        </select>

        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded w-full hover:bg-green-700"
        >
          Register
        </button>
      </form>
    </div>
  );
}
