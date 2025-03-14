import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; 
import { VaquinhaHome } from "./VaquinhaHome";
import { VaquinhaPage } from "./VaquinhaPage";
import ConnectWallet from "./ConnectWallet";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

// Adicione o provider e signer no estado do App
export default function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            !isConnected ? (
              <ConnectWallet
                setAccount={setAccount}
                setIsConnected={setIsConnected}
                setSigner={setSigner}
                setProvider={setProvider}
              />
            ) : (
              <VaquinhaHome provider={provider} />
            )
          }
        />
        <Route path="/vaquinha/:address" element={<VaquinhaPage provider={provider} signer={signer} />} />
      </Routes>
    </Router>
  );
}
