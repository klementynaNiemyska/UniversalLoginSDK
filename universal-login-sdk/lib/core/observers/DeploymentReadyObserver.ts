import {providers, utils} from 'ethers';
import {SupportedToken, ensure, RequiredBalanceChecker, BalanceChecker, Nullable} from '@universal-login/commons';
import {ConcurrentDeployment} from '../utils/errors';
import ObserverRunner from './ObserverRunner';

export type ReadyToDeployCallback = (tokenAddress: string, contractAddress: string) => void;

export class DeploymentReadyObserver extends ObserverRunner {
  private contractAddress?: string;
  private callback?: ReadyToDeployCallback;
  private requiredBalanceChecker: RequiredBalanceChecker;
  private supportedTokens: Nullable<SupportedToken[]> = null;
  private isSubscribed = false;

  constructor(private provider: providers.Provider) {
    super();
    this.requiredBalanceChecker = new RequiredBalanceChecker(new BalanceChecker(this.provider));
  }

  setSupportedTokens(supportedTokens: SupportedToken[]) {
    const tokensWithValidMinimaAmount =
      supportedTokens.filter(supportedToken => utils.parseEther(supportedToken.minimalAmount).gt(0));
    if (tokensWithValidMinimaAmount.length > 0) {
      this.supportedTokens = supportedTokens;
      this.isSubscribed && this.start();
    }
    return tokensWithValidMinimaAmount;
  }

  async subscribeAndStart(contractAddress: string, callback: ReadyToDeployCallback) {
    ensure(this.isStopped(), ConcurrentDeployment);
    this.contractAddress = contractAddress;
    this.callback = callback;
    this.isSubscribed = true;
    if (this.supportedTokens) {
      this.start();
    }
  }

  execute() {
    return this.checkDeploymentReadiness();
  }

  async checkDeploymentReadiness() {
    if (this.contractAddress && this.supportedTokens) {
      const tokenAddress = await this.requiredBalanceChecker.findTokenWithRequiredBalance(this.supportedTokens, this.contractAddress);
      if (tokenAddress) {
        this.onDeploymentReady(this.contractAddress, tokenAddress);
      }
    }
  }

  onDeploymentReady(contractAddress: string, tokenAddress: string) {
    this.callback!(tokenAddress, contractAddress);
    this.contractAddress = undefined;
    this.stop();
  }
}
