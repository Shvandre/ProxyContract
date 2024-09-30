import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode, toNano } from '@ton/core';
import { TreasuryContract } from '@ton/sandbox';

export type JettonProxyConfig = {
    owner: Address;
};

export function jettonProxyConfigToCell(config: JettonProxyConfig): Cell {
    return beginCell()
    .storeUint(0, 1)
    .storeUint(0, 1) //Allow to all by default is 0
    .storeAddress(config.owner)
    .storeAddress(Address.parse("UQD3jCOn7qw4fVUWEJBBboJ7fbNWVLsRjNAA2JAoxGHnpY3-"))
    .storeAddress(Address.parse("EQB3ncyBUTjZUA5EnFKR5_EnOMI9V1tTEAAPaiU71gc4TiUt")) //STON.FI Dex
    .endCell();
}

export class JettonProxy implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new JettonProxy(address);
    }

    static createFromConfig(config: JettonProxyConfig, code: Cell, workchain = 0) {
        const data = jettonProxyConfigToCell(config);
        const init = { code, data };
        return new JettonProxy(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendTranferRequest(provider: ContractProvider, via: Sender, address: Address) {
        var cellWithAddr = beginCell().storeAddress(address).endCell();
        await provider.internal(via, {
            value: toNano("0.05"),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(0x8422fdd4, 32).storeRef(cellWithAddr).endCell(),
        })
        
        

    }
    async sendAllowToNewAddress(provider: ContractProvider, via: Sender, addressToAllow: Address) {
        await provider.internal(via, {
            value: toNano("0.05"),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(0x283ad1b0, 32).storeAddress(addressToAllow).endCell(),
        }) 
    }
    async sendSwitchAllowToAll(provider: ContractProvider, via: Sender) {
        await provider.internal(via, {
            value: toNano("0.05"),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(0xfc3997e4, 32).endCell(),
        })
    } 
}
