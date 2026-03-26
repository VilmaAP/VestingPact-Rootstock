import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { useWallet } from "./hooks/useWallet";
import Navbar from "./components/Navbar";

const Landing = lazy(() => import("./pages/Landing"));
const CreatePact = lazy(() => import("./pages/CreatePact"));
const Dashboard = lazy(() => import("./pages/Dashboard"));

export default function App() {
  const wallet = useWallet();

  return (
    <div className="app">
      <Navbar wallet={wallet} />
      <main className="main-content">
        <Suspense fallback={<div className="loading-container"><div className="spinner" /></div>}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/create" element={<CreatePact wallet={wallet} />} />
            <Route path="/dashboard/:contractAddress" element={<Dashboard wallet={wallet} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

function NotFound() {
  return (
    <div className="empty-state">
      <h2>Este pacto no existe</h2>
      <p>¿Tu socio se fue? 😏</p>
      <a href="/" className="btn btn-primary">Volver al inicio</a>
    </div>
  );
}
