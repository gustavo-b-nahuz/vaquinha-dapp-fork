import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ethers } from "ethers";
import VaquinhaArtifact from "./artifacts/contracts/Vaquinha.sol/Vaquinha.json";
import "./App.css";

const vaquinhaABI = VaquinhaArtifact.abi;

export function VaquinhaPage() {
  const { address } = useParams();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [meta, setMeta] = useState("0");
  const [saldo, setSaldo] = useState("0");
  const [valorDoacao, setValorDoacao] = useState("0");
  const [vaquinhaContract, setVaquinhaContract] = useState(null);

  useEffect(() => {
    if (!address) return;
      const loadVaquinha = async () => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(address, vaquinhaABI, signer);
        setVaquinhaContract(contract)

        const titulo = await contract.titulo();
        const descricao = await contract.descricao();
        const meta = await contract.meta();
        const saldo = await provider.getBalance(address);
        setTitulo(titulo);
        setDescricao(descricao);
        setMeta(meta);
        setSaldo(saldo);
      };
      loadVaquinha();

  }, [address]);

  const doar = async () => {
    if (!valorDoacao) return alert("Digite um valor válido!");

    try {
      const tx = await vaquinhaContract.doar({ value: ethers.utils.parseEther(valorDoacao) });
      await tx.wait();
      alert("Doação realizada com sucesso!");
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Erro ao doar.");
    }
  };

  const progresso = (parseFloat(ethers.utils.formatEther(saldo)) / parseFloat(ethers.utils.formatEther(meta))) * 100;

  return (
    <div className="App">
      <h1>Detalhes da Vaquinha</h1>
      
      <div>
        {/* Exibindo o título e descrição da vaquinha */}
        <h2>{titulo}</h2>
        <p>{descricao}</p>

        <div>
          <p><strong>Meta:</strong> {ethers.utils.formatEther(meta)} ETH</p>
          <p><strong>Saldo Atual:</strong> {ethers.utils.formatEther(saldo)} ETH</p>
          
          <div>
            <div style={{ width: `${progresso}%` }}></div>
          </div>
          <p>{progresso.toFixed(2)}% alcançado</p>
        </div>

        {/* Seção de doação */}
        <div>
          <input
            type="number"
            placeholder="Valor da Doação (ETH)"
            value={valorDoacao}
            onChange={(e) => setValorDoacao(e.target.value)}
          />
          <button onClick={doar}>Doar</button>
        </div>
      </div>
      
      {/* Link de navegação para a página principal, agora na parte inferior */}
      <div>
        <Link to="/">Voltar para a página principal</Link>
      </div>
    </div>
  );
}
