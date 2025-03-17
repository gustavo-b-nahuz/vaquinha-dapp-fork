import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ethers } from "ethers";
import VaquinhaArtifact from "./artifacts/Vaquinha.json";
import "./VaquinhaPage.css";

const vaquinhaABI = VaquinhaArtifact.abi;

export function VaquinhaPage() {
    const { address } = useParams();

    // -------------------------
    //     Estados principais
    // -------------------------
    const [titulo, setTitulo] = useState("");
    const [descricao, setDescricao] = useState("");
    const [meta, setMeta] = useState("0");
    const [saldo, setSaldo] = useState("0");
    const [unidade, setUnidade] = useState("ether");

    // -------------------------
    //     Estados adicionais
    // -------------------------
    const [encerrada, setEncerrada] = useState(false);
    const [organizador, setOrganizador] = useState(null);
    const [totalArrecadado, setTotalArrecadado] = useState("0");
    const [currentUser, setCurrentUser] = useState(null);

    // -------------------------
    //     Estados de doação
    // -------------------------
    const [valorDoacao, setValorDoacao] = useState("0");
    const [donationUnit, setDonationUnit] = useState("ether");

    // -------------------------
    //     Contrato e pop-up
    // -------------------------
    const [vaquinhaContract, setVaquinhaContract] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [startBlock, setStartBlock] = useState(null);

    const closePopup = () => {
        setShowPopup(false);
        setPopupMessage("");
    };

    // -------------------------
    //  Carregar dados iniciais
    // -------------------------
    useEffect(() => {
        if (!address) return;

        const loadVaquinha = async () => {
            const provider = new ethers.providers.Web3Provider(window.ethereum);

            // Guardar bloco atual para filtrar eventos antigos
            const currentBlock = await provider.getBlockNumber();
            setStartBlock(currentBlock + 1);

            const signer = provider.getSigner();
            const contract = new ethers.Contract(address, vaquinhaABI, signer);
            setVaquinhaContract(contract);

            // Ler dados do contrato
            const titulo = await contract.titulo();
            const descricao = await contract.descricao();
            const meta = await contract.meta();
            const saldo = await provider.getBalance(address);
            const unidade = await contract.unidade();

            // Ler variáveis adicionais
            const encerrada = await contract.encerrada();
            const organizador = await contract.organizador();
            const totalArrecadado = await contract.totalArrecadado();
            const currentUser = await signer.getAddress();

            // Salvar no state
            setTitulo(titulo);
            setDescricao(descricao);
            setMeta(meta);
            setSaldo(saldo);
            setUnidade(unidade);

            setEncerrada(encerrada);
            setOrganizador(organizador);
            setTotalArrecadado(totalArrecadado);
            setCurrentUser(currentUser);
        };

        loadVaquinha();
    }, [address]);

    // -------------------------
    // Ouvir eventos do contrato
    // -------------------------
    useEffect(() => {
        if (!vaquinhaContract || startBlock === null) return;

        // Handlers
        const handleDoacaoRecebida = (event) => {
            if (event.blockNumber >= startBlock) {
                setPopupMessage("Doação recebida com sucesso!");
                setShowPopup(true);
            }
        };

        const handleRetirada = (valor, unidadeRetirada, event) => {
            if (event.blockNumber >= startBlock) {
                const valorFormatado = ethers.utils.formatUnits(
                    valor,
                    unidadeRetirada
                );
                setPopupMessage(
                    `Retirada realizada! Valor: ${valorFormatado} ${unidadeRetirada}`
                );
                setShowPopup(true);

                // Depois que retira, a vaquinha é encerrada. Atualizamos o estado:
                setEncerrada(true);
            }
        };

        const handleMetaAtingida = (totalArrecadado, metaAlvo, event) => {
            if (event.blockNumber >= startBlock) {
                const arrecadadoFormatado =
                    ethers.utils.formatEther(totalArrecadado);
                const metaFormatada = ethers.utils.formatEther(metaAlvo);
                setPopupMessage(
                    `Meta atingida! Arrecadado: ${arrecadadoFormatado} / Meta: ${metaFormatada} ETH`
                );
                setShowPopup(true);
            }
        };

        vaquinhaContract.on("DoacaoRecebida", (...args) => {
            // "DoacaoRecebida" não possui parâmetros no Solidity, então pega o último
            const event = args[args.length - 1];
            handleDoacaoRecebida(event);
        });

        vaquinhaContract.on("Retirada", (valor, unidadeRetirada, event) => {
            handleRetirada(valor, unidadeRetirada, event);
        });

        vaquinhaContract.on(
            "MetaAtingida",
            (totalArrecadado, metaAlvo, event) => {
                handleMetaAtingida(totalArrecadado, metaAlvo, event);
            }
        );

        // Cleanup
        return () => {
            vaquinhaContract.removeAllListeners("DoacaoRecebida");
            vaquinhaContract.removeAllListeners("Retirada");
            vaquinhaContract.removeAllListeners("MetaAtingida");
        };
    }, [vaquinhaContract, startBlock]);

    // -------------------------
    //    Função de Doar
    // -------------------------
    const doar = async () => {
        if (!valorDoacao || Number(valorDoacao) <= 0) {
            return alert("Digite um valor válido!");
        }

        try {
            let donationValue;
            if (donationUnit === "ether") {
                donationValue = ethers.utils.parseEther(valorDoacao);
            } else if (donationUnit === "gwei") {
                donationValue = ethers.utils.parseUnits(valorDoacao, "gwei");
            } else {
                donationValue = ethers.utils.parseUnits(valorDoacao, "wei");
            }

            const tx = await vaquinhaContract.doar({ value: donationValue });
            await tx.wait();

            // Atualizar saldo e totalArrecadado
            const provider = vaquinhaContract.provider;
            const novoSaldo = await provider.getBalance(address);
            setSaldo(novoSaldo);

            const novoTotalArrecadado =
                await vaquinhaContract.totalArrecadado();
            setTotalArrecadado(novoTotalArrecadado);
        } catch (error) {
            console.error(error);
            alert("Erro ao doar.");
        }
    };

    // -------------------------
    //   Função de Retirar
    // -------------------------
    const retirar = async () => {
        try {
            const tx = await vaquinhaContract.retirar();
            await tx.wait();

            // Depois do withdraw, o contrato dispara o evento Retirada, que já
            // configura 'encerrada = true' no front via o handler do evento.
            // Mas vamos também atualizar saldo localmente:
            const provider = vaquinhaContract.provider;
            const novoSaldo = await provider.getBalance(address);
            setSaldo(novoSaldo);
        } catch (error) {
            console.error(error);
            alert("Erro ao retirar.");
        }
    };

    // -------------------------
    //     Renderização
    // -------------------------

    // Progresso (formatando meta e saldo como ether)
    const progresso =
        (parseFloat(ethers.utils.formatEther(totalArrecadado)) /
            parseFloat(ethers.utils.formatEther(meta))) *
        100;

    // Converter totalArrecadado e meta para "number" (em ETH) p/ comparação
    // Obs: Se preferir comparar em wei, também pode
    const totalArrEmEther = parseFloat(
        ethers.utils.formatEther(totalArrecadado)
    );
    const metaEmEther = parseFloat(ethers.utils.formatEther(meta));
    const atingiuMeta = totalArrEmEther >= metaEmEther;

    // Verifica se o usuário é o organizador
    const isOrganizer =
        currentUser &&
        organizador &&
        currentUser.toLowerCase() === organizador.toLowerCase();

    // Lógica de exibição dos botões
    let acaoElemento = null;

    if (encerrada) {
        // Caso 1: Vaquinha encerrada => não mostra nada
        acaoElemento = null;
    } else {
        // Vaquinha não está encerrada
        if (atingiuMeta) {
            // Caso 2: Atingiu meta => se organizer, mostra botão "Retirar"
            if (isOrganizer) {
                acaoElemento = (
                    <button className="doar-btn" onClick={retirar}>
                        Retirar
                    </button>
                );
            } else {
                // Se não for organizer, não mostra nada
                acaoElemento = null;
            }
        } else {
            // Caso 3: não atingiu meta => mostra input e botão doar
            acaoElemento = (
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
            );
        }
    }

    return (
        <div className="vaquinha-page-container">
            <h1>Detalhes da Vaquinha</h1>

            {/* Popup (modal) */}
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
                {encerrada && <h3 style={{ color: "red" }}>Encerrada</h3>}
                <p className="descricao">{descricao}</p>

                <div className="meta-container">
                    <p>
                        <strong>Meta:</strong>{" "}
                        {ethers.utils.formatUnits(meta, unidade)} {unidade}
                    </p>
                    <p>
                        <strong>Total Arrecadado:</strong>{" "}
                        {ethers.utils.formatUnits(totalArrecadado, unidade)}{" "}
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

            {/* Aqui definimos qual "ação" aparece, dependendo das condições */}
            {acaoElemento}

            <div className="voltar-link">
                <Link to="/">Voltar para a página principal</Link>
            </div>
        </div>
    );
}
