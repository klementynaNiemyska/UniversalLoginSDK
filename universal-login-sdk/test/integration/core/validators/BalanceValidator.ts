import {expect} from 'chai';
import {DeployedWallet} from '../../../../lib/api/DeployedWallet';
import {loadFixture} from 'ethereum-waffle';
import basicSDK from '../../../fixtures/basicSDK';
import {Wallet, Contract, utils} from 'ethers';
import {BalanceValidator} from '../../../../lib/core/services/validators/BalanceValidator';
import {ETHER_NATIVE_TOKEN, TEST_ACCOUNT_ADDRESS, DEFAULT_GAS_LIMIT} from '@universal-login/commons';

describe('INT: BalanceValidator', () => {
  let mockToken: Contract;
  let relayer: any;
  let deployedWallet: DeployedWallet;
  let balanceValidator: BalanceValidator;
  const gasLimit = DEFAULT_GAS_LIMIT;
  const initialMockTokenBalance = utils.bigNumberify('1000000000000000000');
  const gasPrice = utils.bigNumberify('1000');
  const initialEthBalanceInWei = '1999999999999316000';


  beforeEach(async () => {
    const {contractAddress, sdk, ensName, privateKey, ...rest} = await loadFixture(basicSDK) as any;
    ({mockToken, relayer} = rest);
    deployedWallet = new DeployedWallet(contractAddress, ensName, privateKey, sdk);
    balanceValidator = new BalanceValidator(deployedWallet);
  });

  after(async () => {
    await relayer.stop()
  });

  it('Successful validation ETH', async () => {
    const gasParameters = {gasToken: ETHER_NATIVE_TOKEN.address, gasPrice};
    const amountEth = '1';
    const transferToken = ETHER_NATIVE_TOKEN.address;
    await balanceValidator.validate({transferToken, amount: amountEth, gasParameters, to: TEST_ACCOUNT_ADDRESS}, gasLimit);
  });

  it('Successful validation Token', async () => {
    const gasParameters = {gasToken: mockToken.address, gasPrice};
    const amount = initialMockTokenBalance.sub(gasParameters.gasPrice.mul(gasLimit)).toString();
    const transferToken = mockToken.address;
    await balanceValidator.validate({transferToken, amount, gasParameters, to: TEST_ACCOUNT_ADDRESS}, gasLimit);
  });

  describe('Gas and transfer have same token', () => {
    it('Too high amount ETH', async () => {
      const gasParameters = {gasToken: ETHER_NATIVE_TOKEN.address, gasPrice};
      const amountEth = '2';
      const transferToken = ETHER_NATIVE_TOKEN.address;
      await expect(balanceValidator.validate({transferToken, amount: amountEth, gasParameters, to: TEST_ACCOUNT_ADDRESS}, gasLimit)).to.rejectedWith('Insufficient Balance');
    });

    it('Too high amount Token', async () => {
      const gasParameters = {gasToken: mockToken.address, gasPrice};
      const amount = initialMockTokenBalance.sub(gasParameters.gasPrice.mul(gasLimit)).add('1').toString();
      const transferToken = mockToken.address;
      await expect(balanceValidator.validate({transferToken, amount, gasParameters, to: TEST_ACCOUNT_ADDRESS}, gasLimit)).to.rejectedWith('Insufficient Balance');
    });
  });
});