// src/pages/UserManagement.jsx - MODIFIED
import React, { useState } from "react";
import DataManager from "../components/DataManager/DataManager"; // Import DataManager
import { useAuth } from "../components/GoogleAuth/AuthContext"; // Untuk cek role

export default function UserManagement({ users, setUsers }) {
  const { user } = useAuth(); // Ambil info user yang login
  const [editingUser, setEditingUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fungsi untuk mengedit user
  const handleEdit = (userId) => {
    const userToEdit = users.find((u) => u.id === userId);
    setEditingUser(userToEdit);
    setIsModalOpen(true);
  };

  // Fungsi untuk menghapus user
  const handleDelete = (userId) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus user ini?")) {
      setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userId));
    }
  };

  // Fungsi untuk menyimpan perubahan user
  const handleSaveUser = (updatedUser) => {
    setUsers((prevUsers) =>
      prevUsers.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
    setIsModalOpen(false);
    setEditingUser(null);
  };

  // Konversi data users ke format yang sesuai untuk DataManager
  const usersForDataManager = users.map(u => ({
    id: u.id,
    username: u.username,
    email: u.email || '', // Tambahkan email jika ada (dari Google Login)
    role: u.role,
    toko: u.toko || '',
  }));

  // Jika Anda ingin DataManager hanya muncul untuk superadmin yang login dengan Google
  // const showDataManager = user?.role === 'superadmin' && isAuthenticated;
  
  // Untuk saat ini, kita tampilkan DataManager jika user adalah superadmin/admin
  const showDataManager = user?.role === 'superadmin' || user?.role === 'admin';

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Manajemen Pengguna Mia Phone</h1>

      {showDataManager && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Sinkronisasi Data Pengguna dengan Google</h2>
          <DataManager
            appData={usersForDataManager}
            setAppData={(newData) => {
                // Konversi kembali data dari DataManager ke format users lokal jika perlu
                const updatedUsers = newData.map(item => ({
                    id: item.id,
                    username: item.username,
                    email: item.email,
                    role: item.role,
                    toko: item.toko,
                    password: users.find(u => u.id === item.id)?.password || 'default_password' // Pertahankan password lokal atau set default
                }));
                setUsers(updatedUsers);
            }}
            dataType="users" // Tipe data 'users' untuk DataManager
            allowedActions={['export', 'import']} // Hanya export/import untuk user management
            tokoId={null} // Tidak spesifik toko
          />
        </div>
      )}

      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Username
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Email (Google)
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Role
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Toko
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((userItem) => (
              <tr key={userItem.id}>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  {userItem.username}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  {userItem.email || '-'} {/* Tampilkan email jika ada */}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  {userItem.role}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  {userItem.toko || '-'}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <button
                    onClick={() => handleEdit(userItem.id)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(userItem.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Edit User */}
      {isModalOpen && editingUser && (
        <EditUserModal
          user={editingUser}
          onSave={handleSaveUser}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

// Komponen Modal Edit User (bisa diletakkan di file terpisah juga)
const EditUserModal = ({ user, onSave, onClose }) => {
  const [editedUsername, setEditedUsername] = useState(user.username);
  const [editedEmail, setEditedEmail] = useState(user.email || ''); // Tambah state email
  const [editedRole, setEditedRole] = useState(user.role);
  const [editedToko, setEditedToko] = useState(user.toko || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...user,
      username: editedUsername,
      email: editedEmail, // Simpan email
      role: editedRole,
      toko: editedToko,
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Edit Pengguna</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Username:</label>
            <input
              type="text"
              value={editedUsername}
              onChange={(e) => setEditedUsername(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
            <input
              type="email"
              value={editedEmail}
              onChange={(e) => setEditedEmail(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Role:</label>
            <select
              value={editedRole}
              onChange={(e) => setEditedRole(e.target.value)}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="superadmin">Superadmin</option>
              <option value="admin">Admin</option>
              <option value="pic_toko">PIC Toko</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Toko (jika PIC Toko):</label>
            <input
              type="text"
              value={editedToko}
              onChange={(e) => setEditedToko(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded mr-2"
            >
              Batal
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};