import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

function ConnectWallet({ setAccount, setIsConnected, setSigner, setProvider }) {
  const [loading, setLoading] = useState(false);

  // Função para verificar a conexão
  const checkConnection = useCallback(async () => {
    try {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length > 0) {
        // Configurar provider e signer
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();

        setAccount(address);
        setIsConnected(true);
        setSigner(signer);
        setProvider(provider);
      }
    } catch (error) {
      console.error("Erro ao verificar a conexão:", error);
    }
  }, [setAccount, setIsConnected, setSigner, setProvider]);

  useEffect(() => {
    if (window.ethereum) {
      // Verificar a conexão inicial
      checkConnection();

      // Funções para manipulação de mudanças
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          const newAccount = accounts[0];
          setAccount(newAccount);
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          setSigner(signer);
          setProvider(provider);
        } else {
          setIsConnected(false);
          setAccount("");
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      // Adicionar listeners
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        // Limpar os listeners ao desmontar o componente
        if (window.ethereum) {
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
          window.ethereum.removeListener("chainChanged", handleChainChanged);
        }
      };
    }
  }, [checkConnection, setAccount, setIsConnected, setSigner, setProvider]);

  const connectToMetaMask = async () => {
    setLoading(true);

    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });

        const provider = new ethers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();

        setAccount(address);
        setIsConnected(true);
        setSigner(signer);
        setProvider(provider);

        setLoading(false);
      } catch (error) {
        console.error("Erro ao conectar com o MetaMask:", error);
        setLoading(false);
      }
    } else {
      alert("Por favor, instale o MetaMask!");
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={connectToMetaMask} disabled={loading}>
        {loading ? "Conectando..." : "Conectar Wallet"}
      </button>
    </div>
  );
}

export default ConnectWallet;
