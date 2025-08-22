import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = ({ onLogin, dummyUsers }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = dummyUsers.find(
      (u) => u.username === username && u.password === password
    );
    if (found) {
      onLogin(found.username, found.role, found.toko);
      navigate("/dashboard");
    } else {
      setError("Username atau password salah");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white shadow-lg p-6 rounded-lg w-80">
        <h2 className="text-xl font-bold mb-4 text-center">Login</h2>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <input
          type="text"
          placeholder="Username"
          className="w-full border px-3 py-2 mb-3 rounded"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full border px-3 py-2 mb-3 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-800">
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
