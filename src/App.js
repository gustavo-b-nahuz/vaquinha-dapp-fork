import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { VaquinhaHome } from "./VaquinhaHome"; // Importando a página de VaquinhaHome
import { VaquinhaPage } from "./VaquinhaPage"; // Importando a página de VaquinhaPage
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* Página Principal - VaquinhaHome */}
        <Route path="/" element={<VaquinhaHome />} />

        {/* Página de Detalhes da Vaquinha - VaquinhaPage */}
        <Route path="/vaquinha/:address" element={<VaquinhaPage />} />
      </Routes>
    </Router>
  );
}

export default App;
