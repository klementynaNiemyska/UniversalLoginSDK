import Executor from '../../build/TestableExecutor.json';
import MockToken from '../../build/MockToken.json';
import MockContract from '../../build/MockContract.json';
import {utils, Wallet, providers} from 'ethers';
import {deployContract} from 'ethereum-waffle';
import {sortPrivateKeysByAddress, createKeyPair} from '@universal-login/commons';
const {parseEther} = utils;

export default async function basicExecutor(unusedProvider: providers.Provider, [, , , , , , , , , wallet]: Wallet []) {
  const managementKeyPair = {publicKey: wallet.address, privateKey: wallet.privateKey};
  const actionKeyPair = createKeyPair();
  const actionKeyPair2 = createKeyPair();
  const sortedKeys = sortPrivateKeysByAddress([actionKeyPair2.privateKey, actionKeyPair.privateKey, managementKeyPair.privateKey]);
  const walletContract = await deployContract(wallet, Executor, [managementKeyPair.publicKey]);
  const mockToken = await deployContract(wallet, MockToken);
  const mockContract = await deployContract(wallet, MockContract);
  await wallet.sendTransaction({to: walletContract.address, value: parseEther('2.0')});
  await mockToken.transfer(walletContract.address, parseEther('1.0'));
  await walletContract.addKey(actionKeyPair.publicKey);
  await walletContract.addKey(actionKeyPair2.publicKey);
  return {provider: wallet.provider, managementKeyPair, sortedKeys, walletContract, mockToken, mockContract, wallet};
}
