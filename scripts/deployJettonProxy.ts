import { toNano, Address } from '@ton/core';
import { JettonProxy } from '../wrappers/JettonProxy';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const jettonProxy = provider.open(JettonProxy.createFromConfig({owner: Address.parse("0QA7AdGYEsVtThUxXr2vCuIywv3Rh7Gvbn0S3nzzsLm-5lCX")}, await compile('JettonProxy')));

    await jettonProxy.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(jettonProxy.address);

    // run methods on `jettonProxy`
}
