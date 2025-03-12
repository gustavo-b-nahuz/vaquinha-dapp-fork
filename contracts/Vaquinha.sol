// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Vaquinha {
    address public organizador;
    string public titulo;
    string public descricao;
    uint public meta;
    uint public totalArrecadado;

    mapping(address => uint) public doadores;

    event DoacaoRecebida(address doador, uint valor);
    event Retirada(address organizador, uint valor);

    constructor(string memory _titulo, string memory _descricao, uint _meta, address _organizador) {
        titulo = _titulo;
        descricao = _descricao;
        meta = _meta;
        organizador = _organizador;
    }

    function doar() public payable {
        require(msg.value > 0, "Doacao deve ser maior que zero.");
        doadores[msg.sender] += msg.value;
        totalArrecadado += msg.value;
        emit DoacaoRecebida(msg.sender, msg.value);
    }

    function retirar() public {
        require(msg.sender == organizador, "Apenas o organizador pode retirar.");
        require(totalArrecadado >= meta, "Meta ainda nao atingida.");
        
        uint valor = totalArrecadado;
        totalArrecadado = 0;
        payable(organizador).transfer(valor);

        emit Retirada(organizador, valor);
    }
}