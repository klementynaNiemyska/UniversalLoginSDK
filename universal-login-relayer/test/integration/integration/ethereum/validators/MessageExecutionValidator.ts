import {expect} from 'chai';
import {Contract, Wallet} from 'ethers';
import {loadFixture, deployContract} from 'ethereum-waffle';
import {TEST_ACCOUNT_ADDRESS, ContractWhiteList, Message, IMessageValidator} from '@universal-login/commons';
import {emptyMessage, unsignedMessageToSignedMessage} from '@universal-login/contracts';
import basicWalletContractWithMockToken from '../../../../fixtures/basicWalletContractWithMockToken';
import MessageExecutionValidator from '../../../../../lib/integration/ethereum/validators/MessageExecutionValidator';
import {getContractWhiteList} from '../../../../../lib/http/relayers/RelayerUnderTest';
import {transferMessage} from '../../../../fixtures/basicWalletContract';
import MockToken from '@universal-login/contracts/build/MockToken.json';
import {getTestSignedMessage} from '../../../../config/message';

describe('INT: MessageExecutionValidator', async () => {
  let message: Message;
  let master: Contract;
  let walletContract: Contract;
  let wallet: Wallet;
  let messageExecutionValidator: IMessageValidator;
  const contractWhiteList: ContractWhiteList = getContractWhiteList();

  beforeEach(async () => {
    ({wallet, master, walletContract} = await loadFixture(basicWalletContractWithMockToken));
    message = {...emptyMessage, ...transferMessage, from: walletContract.address, to: TEST_ACCOUNT_ADDRESS, nonce: 1, gasLimit: '200000'};
    messageExecutionValidator = new MessageExecutionValidator(wallet, contractWhiteList);
  });

  it('successfully pass the validation', async () => {
    const signedMessage = getTestSignedMessage({...message}, wallet.privateKey);
    await expect(messageExecutionValidator.validate(signedMessage)).to.not.be.rejected;
  });

  it('throws when not enough gas', async () => {
    const signedMessage = unsignedMessageToSignedMessage({...message, gasCall: 100, gasBase: 100}, wallet.privateKey);
    await expect(messageExecutionValidator.validate(signedMessage)).to.be.eventually.rejectedWith('Not enough gas');
  });

  it('throws when not enough tokens', async () => {
    const mockToken = await deployContract(wallet, MockToken);
    await mockToken.transfer(walletContract.address, 1);

    const signedMessage = getTestSignedMessage({...message, gasToken: mockToken.address}, wallet.privateKey);
    await expect(messageExecutionValidator.validate(signedMessage))
      .to.be.eventually.rejectedWith('Not enough tokens');
  });

  it('throws when invalid proxy', async () => {
    const messageValidatorWithInvalidProxy = new MessageExecutionValidator(wallet, {
      wallet: contractWhiteList.wallet,
      proxy: [TEST_ACCOUNT_ADDRESS],
    });
    const signedMessage = getTestSignedMessage({...message}, wallet.privateKey);
    await expect(messageValidatorWithInvalidProxy.validate(signedMessage)).to.be.eventually.rejectedWith(`Invalid proxy at address '${signedMessage.from}'. Deployed contract bytecode hash: '${contractWhiteList.proxy[0]}'. Supported bytecode hashes: [${TEST_ACCOUNT_ADDRESS}]`);
  });

  it('throws when invalid master', async () => {
    const messageValidatorWithInvalidMaster = new MessageExecutionValidator(wallet, {
      wallet: [TEST_ACCOUNT_ADDRESS],
      proxy: contractWhiteList.proxy,
    });
    const signedMessage = getTestSignedMessage({...message}, wallet.privateKey);
    await expect(messageValidatorWithInvalidMaster.validate(signedMessage)).to.be.eventually
      .rejectedWith(`Invalid master at address '${master.address}'. Deployed contract bytecode hash: '${contractWhiteList.wallet[0]}'. Supported bytecode hashes: [${TEST_ACCOUNT_ADDRESS}]`);
  });
});
