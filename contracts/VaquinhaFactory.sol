// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Vaquinha.sol";

contract VaquinhaFactory {
    address[] public vaquinhas;

    event NovaVaquinha(address vaquinha, string titulo, address organizador);

    function criarVaquinha(string memory _titulo, string memory _descricao, uint _meta) public {
        Vaquinha novaVaquinha = new Vaquinha(_titulo, _descricao, _meta, msg.sender);
        vaquinhas.push(address(novaVaquinha));

        emit NovaVaquinha(address(novaVaquinha), _titulo, msg.sender);
    }

    function listarVaquinhas() public view returns (address[] memory) {
        return vaquinhas;
    }
}