import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ethers } from "ethers";
import VaquinhaArtifact from "./artifacts/contracts/Vaquinha.sol/Vaquinha.json";
import "./VaquinhaPage.css";

const vaquinhaABI = VaquinhaArtifact.abi;

export function VaquinhaPage() {
  const { address } = useParams();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [meta, setMeta] = useState("0");
  const [saldo, setSaldo] = useState("0");
  const [unidade, setUnidade] = useState("ether");

  // Estado para valor da doação
  const [valorDoacao, setValorDoacao] = useState("0");

  // Estado para unidade da doação (eth, gwei, wei)
  const [donationUnit, setDonationUnit] = useState("ether");

  const [vaquinhaContract, setVaquinhaContract] = useState(null);

  useEffect(() => {
    if (!address) return;
    const loadVaquinha = async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(address, vaquinhaABI, signer);
      setVaquinhaContract(contract);

      const titulo = await contract.titulo();
      const descricao = await contract.descricao();
      const meta = await contract.meta();
      const saldo = await provider.getBalance(address);
      const unidade = await contract.unidade();

      setTitulo(titulo);
      setDescricao(descricao);
      setMeta(meta);
      setSaldo(saldo);
      setUnidade(unidade);
    };
    loadVaquinha();
  }, [address]);

  const doar = async () => {
    if (!valorDoacao || Number(valorDoacao) <= 0) {
      return alert("Digite um valor válido!");
    }

    try {
      // Converte o valor de doação conforme a unidade escolhida
      let donationValue;
      if (donationUnit === "ether") {
        donationValue = ethers.utils.parseEther(valorDoacao);
      } else if (donationUnit === "gwei") {
        donationValue = ethers.utils.parseUnits(valorDoacao, "gwei");
      } else {
        // "wei"
        donationValue = ethers.utils.parseUnits(valorDoacao, "wei");
      }

      const tx = await vaquinhaContract.doar({ value: donationValue });
      await tx.wait();
      alert("Doação realizada com sucesso!");
      // Recarrega a página para atualizar o saldo
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Erro ao doar.");
    }
  };

  // Cálculo de progresso
  const progresso = (parseFloat(ethers.utils.formatEther(saldo)) / parseFloat(ethers.utils.formatEther(meta))) * 100;

  return (
      <div className="vaquinha-page-container">
        <h1>Detalhes da Vaquinha</h1>

        <div className="vaquinha-details">
          <h2>{titulo}</h2>
          <p className="descricao">{descricao}</p>

          <div className="meta-container">
            <p>
              <strong>Meta:</strong> {ethers.utils.formatUnits(meta, unidade)} {unidade}
            </p>
            <p>
              <strong>Saldo Atual:</strong> {ethers.utils.formatUnits(saldo, unidade)} {unidade}
            </p>

            <div className="progress-bar">
              <div className="progress" style={{ width: `${progresso}%` }}></div>
            </div>
            <p>{progresso.toFixed(2)}% alcançado</p>
          </div>
        </div>

        <div className="doacao-section">
          {/* Container flex para input e select */}
          <div className="doacao-input-container">
            <input
                type="number"
                placeholder="Valor da Doação"
                value={valorDoacao}
                onChange={(e) => setValorDoacao(e.target.value)}
            />
            <select
                value={donationUnit}
                onChange={(e) => setDonationUnit(e.target.value)}
            >
              <option value="ether">ETH</option>
              <option value="gwei">GWEI</option>
              <option value="wei">WEI</option>
            </select>
          </div>

          <button className="doar-btn" onClick={doar}>
            Doar
          </button>
        </div>

        <div className="voltar-link">
          <Link to="/">Voltar para a página principal</Link>
        </div>
      </div>
  );
}
