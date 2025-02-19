import chai, {expect} from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {loadFixture, solidity, deployContract} from 'ethereum-waffle';
import {utils, Contract, providers, Wallet} from 'ethers';
import {TEST_ACCOUNT_ADDRESS, ETHER_NATIVE_TOKEN, KeyPair, Message, DEFAULT_GAS_LIMIT} from '@universal-login/commons';
import basicExecutor from '../../fixtures/basicExecutor';
import {transferMessage} from '../../helpers/ExampleMessages';
import Loop from '../../../build/Loop.json';
import {encodeFunction} from '../../helpers/argumentsEncoding';
import {encodeDataForExecuteSigned} from '../../../lib/encode';
import {messageToSignedMessage} from '../../../lib/message';
import {calculateFinalGasLimit} from '../../../lib/estimateGas';

chai.use(chaiAsPromised);
chai.use(solidity);

const networkVersion = 'constantinople';
const walletVersion = 'beta2';

describe('CONTRACT: Executor - refund', async () => {
  let provider: providers.Provider;
  let walletContract: Contract;
  let wallet: Wallet;
  let mockToken: Contract;
  let managementKeyPair: KeyPair;
  let loopContract: Contract;
  let infiniteCallMessage: Message;
  let initialBalance: utils.BigNumber;

  beforeEach(async () => {
    ({provider, walletContract, managementKeyPair, mockToken, wallet} = await loadFixture(basicExecutor));
    loopContract = await deployContract(wallet, Loop);
    initialBalance = await wallet.getBalance();
  });

  it('refund works', async () => {
    const message = {...transferMessage, gasPrice: 1, from: walletContract.address, gasLimit: DEFAULT_GAS_LIMIT};
    const signedMessage = messageToSignedMessage(message, managementKeyPair.privateKey, networkVersion, walletVersion);
    const executeData = encodeDataForExecuteSigned(signedMessage);
    const gasLimit = calculateFinalGasLimit(signedMessage.gasCall, signedMessage.gasBase);
    const transaction = await wallet.sendTransaction({to: walletContract.address, data: executeData, gasPrice: 1, gasLimit});
    const receipt = await provider.getTransactionReceipt(transaction.hash as string);

    expect(await provider.getBalance(TEST_ACCOUNT_ADDRESS)).to.eq(utils.parseEther('1'));
    const expectedBalance = initialBalance.sub(receipt.gasUsed!).add(utils.bigNumberify(signedMessage.gasBase));
    expect(await wallet.getBalance()).to.be.above(expectedBalance);
  });

  describe('Loop Contract - infiniteCallMessage', async () => {
    beforeEach(async () => {
      const loopFunctionData = encodeFunction(Loop, 'loop');
      infiniteCallMessage = {
        from: walletContract.address,
        to: loopContract.address,
        value: utils.parseEther('0'),
        data: loopFunctionData,
        nonce: 0,
        gasPrice: 1,
        gasToken: '0x0',
        gasLimit: DEFAULT_GAS_LIMIT,
      };
    });

    it('ETHER_REFUND_CHARGE is enough for ether refund', async () => {
      const signedMessage = messageToSignedMessage({...infiniteCallMessage, gasToken: ETHER_NATIVE_TOKEN.address}, managementKeyPair.privateKey, networkVersion, walletVersion);
      const executeData = encodeDataForExecuteSigned(signedMessage);
      const gasLimit = calculateFinalGasLimit(signedMessage.gasCall, signedMessage.gasBase);

      const transaction = await wallet.sendTransaction({to: walletContract.address, data: executeData, gasPrice: 1, gasLimit});
      const receipt = await provider.getTransactionReceipt(transaction.hash as string);

      const balanceAfter = await wallet.getBalance();
      const expectedBalance = initialBalance
        .sub(receipt.gasUsed!)
        .add(utils.bigNumberify(signedMessage.gasBase))
        .add(signedMessage.gasCall);
      expect(balanceAfter).to.be.above(expectedBalance);
    });

    it('TOKEN_REFUND_CHARGE is enough for token refund', async () => {
      const initialTokenBalance = await mockToken.balanceOf(wallet.address);
      const signedMessage = messageToSignedMessage({...infiniteCallMessage, gasToken: mockToken.address}, managementKeyPair.privateKey, networkVersion, walletVersion);
      const executeData = encodeDataForExecuteSigned(signedMessage);
      const gasLimit = calculateFinalGasLimit(signedMessage.gasCall, signedMessage.gasBase);

      await wallet.sendTransaction({to: walletContract.address, data: executeData, gasPrice: 1, gasLimit});

      const balanceAfter = await mockToken.balanceOf(wallet.address);
      const expectedBalance = initialTokenBalance
        .add(signedMessage.gasBase)
        .add(signedMessage.gasCall);
      expect(balanceAfter).to.be.above(expectedBalance);
    });
  });
});
