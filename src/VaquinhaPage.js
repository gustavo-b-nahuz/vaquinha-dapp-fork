import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ethers } from "ethers";
import VaquinhaArtifact from "./artifacts/contracts/Vaquinha.sol/Vaquinha.json";
import "./VaquinhaPage.css";

const vaquinhaABI = VaquinhaArtifact.abi;

export function VaquinhaPage() {
  const { address } = useParams();

  // Estados de informações gerais
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [meta, setMeta] = useState("0");
  const [saldo, setSaldo] = useState("0");
  const [unidade, setUnidade] = useState("ether");

  // Estados para doação
  const [valorDoacao, setValorDoacao] = useState("0");
  const [donationUnit, setDonationUnit] = useState("ether");

  // Instância do contrato
  const [vaquinhaContract, setVaquinhaContract] = useState(null);

  // -------------------------
  //     Estados do popup
  // -------------------------
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [startBlock, setStartBlock] = useState(null);

  // Fecha pop-up ao clicar no "X"
  const closePopup = () => {
    setShowPopup(false);
    setPopupMessage("");
  };

  // Carrega a vaquinha ao montar o componente
  useEffect(() => {
    if (!address) return;

    const loadVaquinha = async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      const currentBlock = await provider.getBlockNumber();
      setStartBlock(currentBlock + 1);

      const signer = provider.getSigner();
      const contract = new ethers.Contract(address, vaquinhaABI, signer);

      setVaquinhaContract(contract);

      // Carregar dados do contrato
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

  // Ouvir eventos quando o contrato está pronto
  useEffect(() => {
    if (!vaquinhaContract || startBlock === null) return;

    // Handlers dos eventos
    const handleDoacaoRecebida = (event) => {
      // event.blockNumber estará dentro de event.blockNumber
      if (event.blockNumber >= startBlock) {
        setPopupMessage("Doação recebida com sucesso!");
        setShowPopup(true);
      }
    };

    const handleRetirada = (valor, unidadeRetirada, event) => {
      // Valor vem do evento em wei; formatamos com a unidade do contrato
      if (event.blockNumber >= startBlock) {
        const valorFormatado = ethers.utils.formatUnits(valor, unidadeRetirada);
        setPopupMessage(`Retirada realizada! Valor: ${valorFormatado} ${unidadeRetirada}`);
        setShowPopup(true);
      }
    };

    const handleMetaAtingida = (totalArrecadado, metaAlvo, event) => {
      // Aqui podemos formatar para ETH (ou outra unidade fixa)
      if (event.blockNumber >= startBlock) {
        const arrecadadoFormatado = ethers.utils.formatEther(totalArrecadado);
        const metaFormatada = ethers.utils.formatEther(metaAlvo);
        setPopupMessage(
            `Meta atingida! Arrecadado: ${arrecadadoFormatado} / Meta: ${metaFormatada} ETH`
        );
        setShowPopup(true);
      }
    };

    // Ativar listeners
    vaquinhaContract.on("DoacaoRecebida", handleDoacaoRecebida);
    vaquinhaContract.on("Retirada", handleRetirada);
    vaquinhaContract.on("MetaAtingida", handleMetaAtingida);

    // Remover listeners quando sair do componente ou mudar de contrato
    return () => {
      vaquinhaContract.off("DoacaoRecebida", handleDoacaoRecebida);
      vaquinhaContract.off("Retirada", handleRetirada);
      vaquinhaContract.off("MetaAtingida", handleMetaAtingida);
    };
  }, [vaquinhaContract, startBlock]);

  // Função de doação
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

      // Atualiza saldo para exibir na tela
      const provider = vaquinhaContract.provider;
      const novoSaldo = await provider.getBalance(address);
      setSaldo(novoSaldo);

    } catch (error) {
      console.error(error);
      alert("Erro ao doar.");
    }
  };

  // Cálculo de progresso (sempre formatando ambos como Ether para ficar coerente)
  const progresso =
      (parseFloat(ethers.utils.formatEther(saldo)) /
          parseFloat(ethers.utils.formatEther(meta))) *
      100;

  return (
      <div className="vaquinha-page-container">
        <h1>Detalhes da Vaquinha</h1>

        {/* Se showPopup for true, exibe o modal com a mensagem */}
        {showPopup && (
            <div className="popup-backdrop">
              <div className="popup-box">
            <span className="popup-close" onClick={closePopup}>
              &times;
            </span>
                <p>{popupMessage}</p>
              </div>
            </div>
        )}

        <div className="vaquinha-details">
          <h2>{titulo}</h2>
          <p className="descricao">{descricao}</p>

          <div className="meta-container">
            <p>
              <strong>Meta:</strong> {ethers.utils.formatUnits(meta, unidade)}{" "}
              {unidade}
            </p>
            <p>
              <strong>Saldo Atual:</strong>{" "}
              {ethers.utils.formatUnits(saldo, unidade)} {unidade}
            </p>

            <div className="progress-bar">
              <div
                  className="progress"
                  style={{ width: `${progresso}%` }}
              ></div>
            </div>
            <p>{progresso.toFixed(2)}% alcançado</p>
          </div>
        </div>

        <div className="doacao-section">
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
