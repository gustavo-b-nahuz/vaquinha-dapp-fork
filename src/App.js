import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { Link } from "react-router-dom";
import "./App.css";
import ConnectWallet from "./ConnectWallet";
import VaquinhaFactoryArtifact from "./artifacts/contracts/VaquinhaFactory.sol/VaquinhaFactory.json";
import VaquinhaArtifact from "./artifacts/contracts/Vaquinha.sol/Vaquinha.json";

const factoryABI = VaquinhaFactoryArtifact.abi;
const factoryAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const vaquinhaABI = VaquinhaArtifact.abi;

function App() {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [meta, setMeta] = useState("");
  const [vaquinhas, setVaquinhas] = useState([]);
  const [account, setAccount] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);

  // Criar Vaquinha
  const criarVaquinha = async () => {
    if (!isConnected) {
      alert("Por favor, conecte a wallet primeiro!");
      return;
    }

    const contract = new ethers.Contract(factoryAddress, factoryABI, signer);

    try {
      const tx = await contract.criarVaquinha(titulo, descricao, ethers.utils.parseEther(meta));
      await tx.wait();
      alert("Vaquinha criada com sucesso!");
      listarVaquinhas();
    } catch (error) {
      console.error(error);
      alert("Erro ao criar vaquinha.");
    }
  };

  // Listar Vaquinhas com useCallback
  const listarVaquinhas = useCallback(async () => {
    if (!provider) return;

    const contract = new ethers.Contract(factoryAddress, factoryABI, provider);

    try {
      const vaquinhasList = await contract.listarVaquinhas();
      const vaquinhasInfo = await Promise.all(
        vaquinhasList.map(async (vaquinhaAddress) => {
          const vaquinhaContract = new ethers.Contract(vaquinhaAddress, vaquinhaABI, provider);
          const titulo = await vaquinhaContract.titulo();
          const descricao = await vaquinhaContract.descricao();
          const meta = await vaquinhaContract.meta();
          return { vaquinhaAddress, titulo, descricao, meta };
        })
      );
      setVaquinhas(vaquinhasInfo);
    } catch (error) {
      console.error(error);
    }
  }, [provider]);

  useEffect(() => {
    if (isConnected && signer) {
      listarVaquinhas();
    }
  }, [isConnected, signer, listarVaquinhas]);

  return (
    <div className="App">
      <h1>Vaquinha Dapp</h1>

      {/* Componente para conectar com MetaMask */}
      {!isConnected ? (
        <ConnectWallet
          setAccount={setAccount}
          setIsConnected={setIsConnected}
          setSigner={setSigner}
          setProvider={setProvider}
        />
      ) : (
        <div>
          <p>Conta conectada: {account}</p>
        </div>
      )}

      <h2>Criar Nova Vaquinha</h2>
      <input
        type="text"
        placeholder="Título"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
      />
      <input
        type="text"
        placeholder="Descrição"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
      />
      <input
        type="number"
        placeholder="Meta (em ETH)"
        value={meta}
        onChange={(e) => setMeta(e.target.value)}
      />
      <button onClick={criarVaquinha}>Criar Vaquinha</button>

      <h2>Vaquinhas Criadas</h2>
      {/* Verifica se a lista de vaquinhas está vazia */}
      {vaquinhas.length === 0 ? (
        <p>Nenhuma vaquinha criada ainda</p>
      ) : (
        <ul>
          {vaquinhas.map((vaquinha, index) => (
            <li key={index} className="vaquinha-card">
                <h3>{vaquinha.titulo}</h3>
                <p>{vaquinha.descricao}</p>
                <p>Meta: {ethers.utils.formatEther(vaquinha.meta)} ETH</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;