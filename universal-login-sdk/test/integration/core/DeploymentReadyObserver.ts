import {expect} from 'chai';
import sinon from 'sinon';
import {utils, Wallet, providers, Contract} from 'ethers';
import {deployContract, createMockProvider, getWallets} from 'ethereum-waffle';
import {ETHER_NATIVE_TOKEN, TEST_ACCOUNT_ADDRESS, waitUntil} from '@universal-login/commons';
import MockToken from '@universal-login/contracts/build/MockToken.json';
import {DeploymentReadyObserver} from '../../../lib/core/observers/DeploymentReadyObserver';

describe('INT: DeploymentReadyObserver', () => {
  let deploymentReadyObserver: DeploymentReadyObserver;
  let provider: providers.Provider;
  let wallet: Wallet;
  let mockToken: Contract;
  const minimalAmount = '0.5';
  let supportedTokens = [
    {
      address: ETHER_NATIVE_TOKEN.address,
      minimalAmount,
    },
  ];
  let callback: sinon.SinonSpy;

  const testInstantiation = async () => {
    provider = createMockProvider();
    [wallet] = getWallets(provider);
    mockToken = await deployContract(wallet, MockToken);
    supportedTokens = [...supportedTokens, {address: mockToken.address, minimalAmount}];
    callback = sinon.spy();
    deploymentReadyObserver = new DeploymentReadyObserver(provider);
    deploymentReadyObserver.tick = 10;
  };

  const testExecution = () => {
    it('calls callback if ether balance changed', async () => {
      await wallet.sendTransaction({to: TEST_ACCOUNT_ADDRESS, value: utils.parseEther('1.0')});
      await waitUntil(() => !!callback.firstCall);
      expect(callback).to.have.been.calledWith(ETHER_NATIVE_TOKEN.address, TEST_ACCOUNT_ADDRESS);
    });

    it('calls callback if token balance changed', async () => {
      await mockToken.transfer(TEST_ACCOUNT_ADDRESS, utils.parseEther('1.0'));
      await waitUntil(() => !!callback.firstCall);
      expect(callback).to.have.been.calledWith(mockToken.address, TEST_ACCOUNT_ADDRESS);
    });

    it('shouldn`t call callback if token balance is smaller than minimalAmount', async () => {
      await mockToken.transfer(TEST_ACCOUNT_ADDRESS, utils.parseEther('0.49'));
      expect(callback).to.not.have.been.called;
    });

    it('should throw error if is already started', async () => {
      expect(deploymentReadyObserver.subscribeAndStart(TEST_ACCOUNT_ADDRESS, callback))
        .to.be.rejectedWith('Other wallet waiting for counterfactual deployment. Stop observer to cancel old wallet instantialisation.');
    });

    it('#setSupportedTokens, minimalAmount > 9', () => {
      expect(deploymentReadyObserver.setSupportedTokens(supportedTokens)).to.deep.eq(supportedTokens);
    });

    it('#setSupportedTokens, minimalAmount = 0', () => {
      let supportedTokens = [{address: ETHER_NATIVE_TOKEN.address, minimalAmount: '0'}];
      expect(deploymentReadyObserver.setSupportedTokens(supportedTokens)).to.deep.eq([]);
      const supportedMockToken = {address: mockToken.address, minimalAmount};
      supportedTokens = [...supportedTokens, supportedMockToken];
      expect(deploymentReadyObserver.setSupportedTokens(supportedTokens)).to.deep.eq([supportedMockToken]);
    });
  };

  describe('Set supported tokens then run', () => {
    beforeEach(async () => {
      await testInstantiation();
      deploymentReadyObserver.setSupportedTokens(supportedTokens);
      await deploymentReadyObserver.subscribeAndStart(TEST_ACCOUNT_ADDRESS, callback);
    });

    testExecution();

    afterEach(async () => {
      await deploymentReadyObserver.finalizeAndStop();
    });
  });

  describe('Run then set supported tokens', () => {
    beforeEach(async () => {
      await testInstantiation();
      await deploymentReadyObserver.subscribeAndStart(TEST_ACCOUNT_ADDRESS, callback);
      deploymentReadyObserver.setSupportedTokens(supportedTokens);
    });

    testExecution();

    afterEach(async () => {
      await deploymentReadyObserver.finalizeAndStop();
    });
  });

  describe('Cannot start without supported token set', () => {
    before(async () => {
      await testInstantiation();
      await deploymentReadyObserver.subscribeAndStart(TEST_ACCOUNT_ADDRESS, callback);
    });

    it('shouldn`t call callback if supported token are`t set', async () => {
      await wallet.sendTransaction({to: TEST_ACCOUNT_ADDRESS, value: utils.parseEther('1.0')});
      expect(callback).to.not.have.been.called;
    });
  });
});
