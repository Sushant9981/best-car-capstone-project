import LoginPanel from "./components/Login/Login";
import Register from "./components/Register/Register";
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <Routes>
      {/* Login Route */}
      <Route path="/login" element={<LoginPanel />} />

      {/* Register Route */}
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}

export default App;
