import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";
import ConnectWallet from "./ConnectWallet";
import VaquinhaFactoryArtifact from "./artifacts/contracts/VaquinhaFactory.sol/VaquinhaFactory.json";
import VaquinhaArtifact from "./artifacts/contracts/Vaquinha.sol/Vaquinha.json";
import "./VaquinhaHome.css";

const factoryABI = VaquinhaFactoryArtifact.abi;
const factoryAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const vaquinhaABI = VaquinhaArtifact.abi;

export function VaquinhaHome() {
    const [titulo, setTitulo] = useState("");
    const [descricao, setDescricao] = useState("");
    const [meta, setMeta] = useState("");
    const [metaUnit, setMetaUnit] = useState("ether"); // NOVO estado para a unidade
    const [vaquinhas, setVaquinhas] = useState([]);
    const [account, setAccount] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [signer, setSigner] = useState(null);
    const [provider, setProvider] = useState(null);
    const navigate = useNavigate();

    // Criar Vaquinha
    const criarVaquinha = async () => {
        if (!isConnected) {
            alert("Por favor, conecte a wallet primeiro!");
            return;
        }

        const contract = new ethers.Contract(factoryAddress, factoryABI, signer);

        try {
            // Converter a meta para wei conforme a unidade escolhida
            let metaEmWei;
            if (metaUnit === "ether") {
                metaEmWei = ethers.utils.parseEther(meta);
            } else if (metaUnit === "gwei") {
                metaEmWei = ethers.utils.parseUnits(meta, "gwei");
            } else {
                // "wei"
                metaEmWei = ethers.utils.parseUnits(meta, "wei");
            }

            const tx = await contract.criarVaquinha(titulo, descricao, metaEmWei, metaUnit);
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
                    const unidade = await vaquinhaContract.unidade();
                    return { vaquinhaAddress, titulo, descricao, meta, unidade };
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

    const handleCardClick = (vaquinhaAddress) => {
        navigate(`/vaquinha/${vaquinhaAddress}`);
    };

    return (
        <div className="vaquinha-container">
            <h1>Vaquinha DApp</h1>

            {!isConnected ? (
                <ConnectWallet
                    setAccount={setAccount}
                    setIsConnected={setIsConnected}
                    setSigner={setSigner}
                    setProvider={setProvider}
                />
            ) : (
                <p className="wallet-info">Conta conectada: {account}</p>
            )}

            <div className="form-section">
                <h2>Criar Nova Vaquinha</h2>
                <input
                    type="text"
                    placeholder="Título"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                />
                <textarea
                    placeholder="Descrição"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                />

                {/* Container flex para input da meta e select */}
                <div className="meta-input-container">
                    <input
                        type="number"
                        placeholder="Meta"
                        value={meta}
                        onChange={(e) => setMeta(e.target.value)}
                    />

                    <select
                        value={metaUnit}
                        onChange={(e) => setMetaUnit(e.target.value)}
                    >
                        <option value="ether">ETH</option>
                        <option value="gwei">GWEI</option>
                        <option value="wei">WEI</option>
                    </select>
                </div>

                <button className="create-btn" onClick={criarVaquinha}>
                    Criar
                </button>
            </div>

            <h2>Vaquinhas Criadas</h2>
            {vaquinhas.length === 0 ? (
                <p className="no-vaquinhas">Nenhuma vaquinha criada ainda</p>
            ) : (
                <div className="vaquinha-grid">
                    {vaquinhas.map((vaquinha, index) => (
                        <div
                            key={index}
                            className="vaquinha-card"
                            onClick={() => handleCardClick(vaquinha.vaquinhaAddress)}
                        >
                            <h3>{vaquinha.titulo}</h3>
                            <p>{vaquinha.descricao}</p>
                            <p>
                                <strong>Meta:</strong>{" "}
                                {ethers.utils.formatUnits(vaquinha.meta, vaquinha.unidade)} {vaquinha.unidade}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
