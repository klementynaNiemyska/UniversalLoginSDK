import {Provider} from 'web3/providers';
import {Config, getConfigForNetwork, Network} from './config';
import UniversalLoginSDK, {WalletService} from '@universal-login/sdk';
import {MetamaskService} from './services/MetamaskService';
import {UIController} from './services/UIController';
import {providers, utils} from 'ethers';
import {Callback, JsonRPCRequest, JsonRPCResponse} from './models/rpc';
import {ensure, Message, walletFromBrain} from '@universal-login/commons';
import {waitForTrue} from './utils';
import {initUi} from './ui';
import {AppProps} from './ui/App';
import {StorageService, WalletStorageService} from '@universal-login/react';
import {combine, Property} from 'reactive-properties';
import {renderLogoButton} from './ui/logoButton';

export interface ULWeb3ProviderOptions {
  provider: Provider;
  relayerUrl: string;
  ensDomains: string[];
  uiInitializer?: (services: AppProps) => void;
  storageService?: StorageService;
}

export class ULWeb3Provider implements Provider {
  static getDefaultProvider(networkOrConfig: Network | Config) {
    const config = typeof networkOrConfig === 'string' ? getConfigForNetwork(networkOrConfig) : networkOrConfig;

    return new ULWeb3Provider({
      provider: config.provider,
      relayerUrl: config.relayerUrl,
      ensDomains: config.ensDomains,
    });
  }

  readonly isUniversalLogin = true;

  private readonly provider: Provider;
  private readonly sdk: UniversalLoginSDK;
  private readonly walletService: WalletService;
  private readonly metamaskService: MetamaskService;
  private readonly uiController: UIController;

  readonly isLoggedIn: Property<boolean>;

  constructor({
    provider,
    relayerUrl,
    ensDomains,
    uiInitializer = initUi,
    storageService = new StorageService(),
  }: ULWeb3ProviderOptions) {
    this.provider = provider;
    this.sdk = new UniversalLoginSDK(
      relayerUrl,
      new providers.Web3Provider(this.provider as any),
    );
    const walletStorageService = new WalletStorageService(storageService);
    this.walletService = new WalletService(this.sdk, walletFromBrain, walletStorageService);
    this.metamaskService = new MetamaskService();
    this.uiController = new UIController(this.walletService, this.metamaskService);

    this.isLoggedIn = combine(
      [this.walletService.isAuthorized, this.metamaskService.metamaskProvider],
      (walletCreated, metamask) => walletCreated || !!metamask,
    );

    this.sdk.start();

    uiInitializer({
      sdk: this.sdk,
      domains: ensDomains,
      walletService: this.walletService,
      uiController: this.uiController,
      metamaskService: this.metamaskService,
    });
  }

  async send(payload: JsonRPCRequest, callback: Callback<JsonRPCResponse>) {
    const metamaskProvider = this.metamaskService.metamaskProvider.get();
    if (metamaskProvider) {
      return metamaskProvider.sendAsync(payload, callback);
    }

    switch (payload.method) {
      case 'eth_sendTransaction':
      case 'eth_accounts':
      case 'eth_sign':
      case 'personal_sign':
        try {
          const result = await this.handle(payload.method, payload.params);
          callback(null, {
            id: payload.id,
            jsonrpc: '2.0',
            result,
          });
        } catch (err) {
          callback(err);
        }
        break;
      default:
        return this.provider.send(payload, callback as any);
    }
  }

  async handle(method: string, params: any[]): Promise<any> {
    switch (method) {
      case 'eth_sendTransaction':
        const tx = params[0];
        return this.sendTransaction(tx);
      case 'eth_accounts':
        return this.getAccounts();
      case 'eth_sign':
        return this.sign(params[0], params[1]);
      case 'personal_sign':
        return this.sign(params[1], params[0]);
      default:
        throw new Error(`Method not supported: ${method}`);
    }
  }

  getAccounts() {
    if (this.walletService.walletDeployed.get()) {
      return [this.walletService.getDeployedWallet().contractAddress];
    } else {
      return [];
    }
  }

  async sendTransaction(tx: Partial<Message>): Promise<string> {
    await this.ensureWalletIsDeployed();

    const execution = await this.walletService.getDeployedWallet().execute({
      ...tx,
      from: this.walletService.getDeployedWallet().contractAddress,
    });
    const succeeded = await execution.waitForTransactionHash();
    if (!succeeded.transactionHash) {
      throw new Error('Expected tx hash to not be null');
    }
    return succeeded.transactionHash;
  }

  async sign(address: string, message: string) {
    await this.ensureWalletIsDeployed();

    const wallet = this.walletService.getDeployedWallet();
    ensure(wallet.contractAddress !== address, Error, `Address ${address} is not available to sign`);

    return wallet.signMessage(utils.arrayify(message));
  }

  async create() {
    this.uiController.requireWallet();

    await waitForTrue(this.isLoggedIn);
  }

  private async ensureWalletIsDeployed() {
    if (!this.walletService.walletDeployed.get()) {
      this.uiController.requireWallet();
      await waitForTrue(this.walletService.walletDeployed);
    }
  }

  initWeb3Button(element: Element) {
    renderLogoButton(element, this.walletService);
  }

  finalizeAndStop() {
    return this.sdk.finalizeAndStop();
  }
}
