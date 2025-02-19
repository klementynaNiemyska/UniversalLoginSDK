import {expect} from 'chai';
import {SufficientBalanceValidator} from '../../../../lib/integration/ethereum/validators/SufficientBalanceValidator';
import {utils, providers} from 'ethers';
import {EMPTY_DATA} from '../../../../lib/core/constants/constants';
import {TEST_ACCOUNT_ADDRESS, TEST_CONTRACT_ADDRESS, TEST_PRIVATE_KEY, TEST_GAS_PRICE} from '../../../../lib/core/constants/test';
import {deployContract, getWallets, createMockProvider} from 'ethereum-waffle';
import MockToken from '../../../fixtures/MockToken.json';
import {SignedMessage, calculateMessageSignature} from '../../../../lib';

describe('INT: SufficientBalanceValidator', () => {
  const provider: providers.Provider = createMockProvider();
  const validator = new SufficientBalanceValidator(provider);
  let signedMessage: SignedMessage;

  before(async () => {
    const [wallet] = await getWallets(provider);
    const token = await deployContract(wallet, MockToken);
    await token.transfer(TEST_CONTRACT_ADDRESS, utils.parseEther('1'));
    const message = {
      from: TEST_CONTRACT_ADDRESS,
      to: TEST_ACCOUNT_ADDRESS,
      value: utils.parseEther('1.0'),
      data: EMPTY_DATA,
      nonce: 0,
      gasPrice: TEST_GAS_PRICE,
      gasCall: utils.bigNumberify(190000),
      gasBase: utils.bigNumberify(10000),
      gasToken: token.address,
    };
    signedMessage = {
      ...message,
      signature: calculateMessageSignature(TEST_PRIVATE_KEY, message),
    };
  });

  it('successfully pass the validation', async () => {
    await expect(validator.validate(signedMessage)).to.not.be.rejected;
  });

  it('passes when not enough gas', async () => {
    await expect(validator.validate({...signedMessage, gasCall: 100, gasBase: 1000})).to.be.eventually.fulfilled;
  });

  it('throws when not enough tokens', async () => {
    await expect(validator.validate({...signedMessage, gasCall: utils.parseEther('2.0')})).to.be.eventually.rejectedWith('Not enough tokens');
  });
});
