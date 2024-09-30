import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, Cell, toNano } from '@ton/core';
import { JettonProxy } from '../wrappers/JettonProxy';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { randomAddress } from '@ton/test-utils';

describe('JettonProxy', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('JettonProxy');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let jettonProxy: SandboxContract<JettonProxy>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');

        jettonProxy = blockchain.openContract(JettonProxy.createFromConfig({owner: deployer.address}, code));

        const deployResult = await jettonProxy.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonProxy.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and jettonProxy are ready to use
    });

    it("Should receive msg", async() => {
        const requestResult = await jettonProxy.sendTranferRequest(deployer.getSender(), randomAddress());

        expect(requestResult.transactions).toHaveTransaction({success: false, deploy: false, exitCode : 710})

        const requestResult2 = await jettonProxy.sendTranferRequest(deployer.getSender(), deployer.address);
        
        expect(requestResult2.transactions).toHaveTransaction({success: true, deploy: false})
    })
    it("Should allow new address", async () => {
        let rndAddr = randomAddress();
        const beforeAdding = await jettonProxy.sendTranferRequest(deployer.getSender(), rndAddr);

        expect(beforeAdding.transactions).toHaveTransaction(
            {success: false, 
            deploy: false, 
            exitCode : 710})

        const allowRequest = await jettonProxy.sendAllowToNewAddress(deployer.getSender(), rndAddr);
        
        expect(allowRequest.transactions).toHaveTransaction(
            {success: true, 
            from: deployer.address,
            to: jettonProxy.address,
            deploy: false})

        const afterAdding = await jettonProxy.sendTranferRequest(deployer.getSender(), rndAddr);

        expect(afterAdding.transactions).toHaveTransaction(
            {success: true, 
            deploy: false, 
            from: jettonProxy.address, 
            op: 0x70d70a85}) //allowed transfer
        
    })
    it("Should allow to all", async () => {
        let rndAddr = randomAddress();
        const beforeEnabling = await jettonProxy.sendTranferRequest(deployer.getSender(), rndAddr);

        expect(beforeEnabling.transactions).toHaveTransaction(
            {success: false, 
            deploy: false, 
            exitCode : 710})

        const enableRequest = await jettonProxy.sendSwitchAllowToAll(deployer.getSender());

        expect(enableRequest.transactions).toHaveTransaction(
            {success: true, 
            from: deployer.address,
            to: jettonProxy.address,
            op: 0xfc3997e4,
            deploy: false})

        const afterEnabling = await jettonProxy.sendTranferRequest(deployer.getSender(), rndAddr);

        expect(afterEnabling.transactions).toHaveTransaction(
            {success: true, 
            deploy: false, 
            from: jettonProxy.address, 
            op: 0x70d70a85}) //allowed transfer
        
        const disableRequest = await jettonProxy.sendSwitchAllowToAll(deployer.getSender());

        expect(disableRequest.transactions).toHaveTransaction(
            {success: true, 
            from: deployer.address,
            to: jettonProxy.address,
            op: 0xfc3997e4,
            deploy: false})
        const afterDisabling = await jettonProxy.sendTranferRequest(deployer.getSender(), rndAddr);

        expect(afterDisabling.transactions).toHaveTransaction(
                {success: false, 
                deploy: false, 
                exitCode : 710})
    })
});
