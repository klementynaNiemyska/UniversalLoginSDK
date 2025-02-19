import chai, {expect} from 'chai';
import {utils} from 'ethers';
import {SignedMessage, GAS_FIXED} from '@universal-login/commons';
import {GasValidator} from '../../../../lib/core/services/validators/GasValidator';
import chaiAsPromised from 'chai-as-promised';
import {GasComputation} from '../../../../lib/core/services/GasComputation';
import {BlockchainService} from '@universal-login/contracts';

chai.use(chaiAsPromised);

describe('UNIT: GasValidator', () => {
  const MAX_GAS_LIMIT = 500000;
  const mockedBlockchainService = {
    fetchWalletVersion: (address: string) => 'beta2',
    fetchHardforkVersion: () => new Promise(resolve => resolve('constantinople')),
  } as any as BlockchainService;
  const gasComputation = new GasComputation(mockedBlockchainService);
  const gasValidator = new GasValidator(MAX_GAS_LIMIT, gasComputation);
  let message: SignedMessage;
  const gasBase = utils.bigNumberify(11408).add(GAS_FIXED);

  beforeEach(() => {
    message = {
      to: '0xa3697367b0e19F6E9E3E7Fa1bC8b566106C68e1b',
      value: 0,
      data: '0x5f7b68be00000000000000000000000063fc2ad3d021a4d7e64323529a55a9442c444da0',
      nonce: 0,
      gasPrice: 10000000000,
      gasBase,
      gasCall: utils.bigNumberify(MAX_GAS_LIMIT).sub(gasBase),
      gasToken: '0xFDFEF9D10d929cB3905C71400ce6be1990EA0F34',
      from: '0xa3697367b0e19F6E9E3E7Fa1bC8b566106C68e1b',
      signature: '0x0302cfd70e07e8d348e2b84803689fc44c1393ad6f02be5b1f2b4747eebd3d180ebfc4946f7f51235876313a11596e0ee55cd692275ca0f0cc30d79f5fba80e01b',
    };
  });

  it('just about right', async () => {
    await expect(gasValidator.validate(message)).to.be.eventually.fulfilled;
  });

  it('too less', async () => {
    const actualGasBase = await gasComputation.calculateGasBase(message);
    message.gasBase = (message.gasBase as utils.BigNumber).sub(1);
    await expect(gasValidator.validate(message)).to.be.eventually.rejectedWith(`Insufficient Gas. Got GasBase ${message.gasBase} but should be ${actualGasBase}`);
  });

  it('gas limit too high', async () => {
    message.gasCall = (message.gasCall as utils.BigNumber).add(1);
    await expect(gasValidator.validate(message)).to.be.eventually.rejectedWith(`GasLimit is too high. Got ${MAX_GAS_LIMIT + 1} but should be less than ${MAX_GAS_LIMIT}`);
  });
});
