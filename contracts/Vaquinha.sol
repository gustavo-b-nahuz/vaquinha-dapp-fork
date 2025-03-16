// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Vaquinha {
    address public organizador;
    string public titulo;
    string public descricao;
    uint public meta;
    uint public totalArrecadado;
    string public unidade;
    bool public encerrada;

    mapping(address => uint) public doadores;

    event DoacaoRecebida();
    event Retirada(uint valor, string unidade);
    event MetaAtingida(uint totalArrecadado, uint meta);

    constructor(
        string memory _titulo,
        string memory _descricao,
        uint _meta,
        string memory _unidade,
        address _organizador
    ) {
        titulo = _titulo;
        descricao = _descricao;
        meta = _meta;
        unidade = _unidade;
        organizador = _organizador;
        encerrada = false;
    }

    // ---------------------------
    //           MODIFIERS
    // ---------------------------
    modifier onlyOrganizer() {
        require(msg.sender == organizador, "Apenas o organizador pode retirar.");
        _;
    }

    modifier metaAtingida() {
        require(totalArrecadado >= meta, "Meta ainda nao atingida.");
        _;
    }

    modifier doacaoValida() {
        require(msg.value > 0, "Doacao deve ser maior que zero.");
        _;
    }

    modifier onlyIfActive() {
        require(encerrada == false, "Vaquinha nao esta ativa.");
        _;
    }

    // ---------------------------
    //        FUNCOES
    // ---------------------------
    function doar() public payable doacaoValida {
        doadores[msg.sender] += msg.value;
        totalArrecadado += msg.value;
        emit DoacaoRecebida();

        if(totalArrecadado >= meta){
            emit MetaAtingida(totalArrecadado, meta);
        }
    }

    function retirar() public onlyOrganizer metaAtingida onlyIfActive{
        uint valor = totalArrecadado;
        payable(organizador).transfer(valor);
        encerrada = true;

        emit Retirada( valor, unidade);
    }
}