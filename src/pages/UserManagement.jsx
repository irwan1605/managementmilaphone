import React, { useState } from "react";

const UserManagement = () => {
  // Dummy data untuk user
  const [users, setUsers] = useState([
    { id: 1, name: "Admin Toko Pusat", role: "admin", store: "Toko Pusat" },
    { id: 2, name: "User Toko Cabang 1", role: "user", store: "Toko Cabang 1" },
    { id: 3, name: "User Toko Cabang 2", role: "user", store: "Toko Cabang 2" },
    { id: 4, name: "User Toko Cabang 3", role: "user", store: "Toko Cabang 3" },
    { id: 5, name: "User Toko Cabang 4", role: "user", store: "Toko Cabang 4" },
    { id: 6, name: "User Toko Cabang 5", role: "user", store: "Toko Cabang 5" },
    { id: 7, name: "User Toko Cabang 6", role: "user", store: "Toko Cabang 6" },
    { id: 8, name: "User Toko Cabang 7", role: "user", store: "Toko Cabang 7" },
    { id: 9, name: "User Toko Cabang 8", role: "user", store: "Toko Cabang 8" },
    {
      id: 10,
      name: "User Toko Cabang 9",
      role: "user",
      store: "Toko Cabang 9",
    },
    {
      id: 11,
      name: "User Toko Cabang 10",
      role: "user",
      store: "Toko Cabang 10",
    },
  ]);

  // State for the new user input form
  const [newUser, setNewUser] = useState({
    id: '',
    name: '',
    role: '',
    store: '',
  });
  
  // Function to handle form input change
  const handleInputChange = (e) => {
    setNewUser({
      ...newUser,
      [e.target.name]: e.target.value,
    });
  };

  // Function to handle adding a new user
  const handleAddUser = (e) => {
    e.preventDefault();
    // Generate a new ID for the new user
    const newId = users.length + 1;
    
    // Create the new user object
    const userToAdd = { id: newId, ...newUser };

    // Add the new user to the users array
    setUsers([...users, userToAdd]);

    // Reset form input
    setNewUser({
      name: '',
      role: '',
      toko: '',
    });
  };

  // State untuk menyimpan user yang sedang diedit
  const [editUser, setEditUser] = useState(null);

  // State untuk mengontrol modal edit
  const [isEditing, setIsEditing] = useState(false);

  // Fungsi untuk membuka modal edit
  const handleEditClick = (user) => {
    setEditUser(user);
    setIsEditing(true);
  };

  // Fungsi untuk menyimpan perubahan
  const handleSaveEdit = () => {
    setUsers((prevUsers) =>
      prevUsers.map((user) => (user.id === editUser.id ? editUser : user))
    );
    setIsEditing(false); // Tutup modal setelah disimpan
  };

  // Fungsi untuk menghapus user
  const deleteUser = (id) => {
    setUsers(users.filter((user) => user.id !== id));
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>

      {/* Tombol download*/}
      <div className="mb-4 flex items-center">
        <button
          // onClick={handleDownloadExcel}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-4"
        >
          Download Excel
        </button>

        <input
          type="text"
          placeholder="Search reports..."
          // value={searchTerm}
          // onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 rounded px-4 py-2"
        />
      </div>

      <table className="min-w-full bg-white border">
        <thead className="bg-gray-200">
          <tr>
            <th className="py-2 px-4 border text-left">ID</th>
            <th className="py-2 px-4 border text-left">Nama User</th>
            <th className="py-2 px-4 border">Role</th>
            <th className="py-2 px-4 border">Store</th>
            <th className="py-2 px-4 border">Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="py-2 px-4 border-b">{user.id}</td>
              <td className="border-t py-2 px-4 text-left">{user.name}</td>
              <td className="border-t py-2 px-4 text-center">{user.role}</td>
              <td className="border-t py-2 px-4 text-center">{user.store}</td>
              <td className="border-t py-2 px-4 text-center">
                <button
                  onClick={() => deleteUser(user.id)}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold ml-4 py-2 px-4 rounded-lg"
                >
                  Hapus
                </button>
                <button
                  className="bg-blue-500  hover:bg-blue-700 text-white font-bold ml-4 px-4 py-2 rounded-lg"
                  onClick={() => handleEditClick(user)}
                >
                  Edit
                </button>
                <button
                  className="bg-blue-500  hover:bg-blue-700 text-white font-bold ml-4 px-4 py-2 rounded-lg"
                  onClick={() => handleEditClick(user)}
                >
                  Tambahkan Data
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal untuk edit user */}
      {isEditing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 px-8">
          <div className="bg-white p-8 px-8 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4 px-32">Edit User</h2>

            {/* Form untuk edit user */}
            <div className="mb-4">
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                value={editUser.name}
                onChange={(e) =>
                  setEditUser({ ...editUser, name: e.target.value })
                }
                className="border border-gray-300 rounded px-4 py-2 w-full"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Role</label>
              <select
                value={editUser.role}
                onChange={(e) =>
                  setEditUser({ ...editUser, role: e.target.value })
                }
                className="border border-gray-300 rounded px-4 py-2 w-full"
              >
                <option value="Admin">Admin</option>
                <option value="User">User</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Store</label>
              <select
                value={editUser.store}
                onChange={(e) =>
                  setEditUser({ ...editUser, store: e.target.value })
                }
                className="border border-gray-300 rounded px-4 py-2 w-full"
              >
                <option value="Toko Pusat">Toko Pusat</option>
                <option value="Cabang 1">Cabang 1</option>
                <option value="Cabang 2">Cabang 2</option>
                <option value="Cabang 1">Cabang 3</option>
                <option value="Cabang 2">Cabang 4</option>
                <option value="Cabang 1">Cabang 5</option>
                <option value="Cabang 2">Cabang 6</option>
                <option value="Cabang 1">Cabang 7</option>
                <option value="Cabang 2">Cabang 8</option>
                <option value="Cabang 1">Cabang 9</option>
                <option value="Cabang 2">Cabang 10</option>
              </select>
            </div>

            {/* Tombol Save dan Cancel */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveEdit}
                className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
