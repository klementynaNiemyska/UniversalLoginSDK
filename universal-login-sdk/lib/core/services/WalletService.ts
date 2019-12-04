import {ensure, ApplicationWallet, walletFromBrain, Procedure, ExecutionOptions, GasParameters, INITIAL_GAS_PARAMETERS, ensureNotNull} from '@universal-login/commons';
import UniversalLoginSDK from '../../api/sdk';
import {FutureWallet} from '../../api/FutureWalletFactory';
import {FutureWalletNotSet, InvalidPassphrase, WalletOverridden, TransactionHashNotFound} from '../utils/errors';
import {utils, Wallet} from 'ethers';
import {DeployedWallet, WalletStorage} from '../..';
import {map, State} from 'reactive-properties';
import {WalletState, DeployingWallet} from '../models/WalletService';
import {WalletSerializer} from './WalletSerializer';
import {NoopWalletStorage} from './NoopWalletStorage';
import {ConnectingWallet} from '../../api/DeployedWallet';

type WalletFromBackupCodes = (username: string, password: string) => Promise<Wallet>;

export class WalletService {
  private readonly walletSerializer: WalletSerializer;

  private gasParameters: GasParameters = INITIAL_GAS_PARAMETERS;

  stateProperty = new State<WalletState>({kind: 'None'});

  walletDeployed = this.stateProperty.pipe(map((state) => state.kind === 'Deployed'));
  isAuthorized = this.walletDeployed;

  get state() {
    return this.stateProperty.get();
  }

  constructor(
    public readonly sdk: UniversalLoginSDK,
    private readonly walletFromPassphrase: WalletFromBackupCodes = walletFromBrain,
    private readonly storage: WalletStorage = new NoopWalletStorage(),
  ) {
    this.walletSerializer = new WalletSerializer(sdk);
  }

  getDeployedWallet(): DeployedWallet {
    ensure(this.state.kind === 'Deployed', Error, 'Invalid state: expected deployed wallet');
    return this.state.wallet;
  }

  private getDeployingWallet(): DeployingWallet {
    ensure(this.state.kind === 'Deploying', Error, 'Invalid state: expected deploying wallet');
    return this.state.wallet;
  }

  getConnectingWallet(): ConnectingWallet {
    ensure(this.state.kind === 'Connecting', Error, 'Invalid state: expected connecting wallet');
    return this.state.wallet;
  }

  async createFutureWallet(name: string): Promise<FutureWallet> {
    const futureWallet = await this.sdk.createFutureWallet();
    this.setFutureWallet(futureWallet, name);
    return futureWallet;
  }

  async initDeploy() {
    ensure(this.state.kind === 'Future', FutureWalletNotSet);
    const {name, wallet: {deploy, contractAddress, privateKey}} = this.state;
    const applicationWallet = {contractAddress, name, privateKey};
    const deployment = await deploy(name, this.gasParameters.gasPrice.toString(), this.gasParameters.gasToken);
    this.stateProperty.set({kind: 'Deploying', wallet: {...applicationWallet, ...deployment}});
    return this.getDeployingWallet();
  }

  async waitForTransactionHash() {
    const deployingWallet = this.getDeployingWallet();
    const {transactionHash} = await deployingWallet.waitForTransactionHash();
    ensureNotNull(transactionHash, TransactionHashNotFound);
    this.stateProperty.set({kind: 'Deploying', wallet: deployingWallet, transactionHash});
    return deployingWallet;
  }

  async waitToBeSuccess() {
    const deployingWallet = this.getDeployingWallet();
    const deployedWallet = await deployingWallet.waitToBeSuccess();
    this.stateProperty.set({kind: 'Deployed', wallet: deployedWallet});
    this.saveToStorage();
    return deployedWallet;
  }

  async deployFutureWallet(gasPrice: string, gasToken: string) {
    ensure(this.state.kind === 'Future', FutureWalletNotSet);
    const {name, wallet: {deploy, contractAddress, privateKey}} = this.state;

    const applicationWallet = {contractAddress, name, privateKey};

    const deployment = await deploy(name, gasPrice, gasToken);
    const deployingWallet = {...applicationWallet, ...deployment};
    this.stateProperty.set({kind: 'Deploying', wallet: deployingWallet});

    const {transactionHash} = await deployingWallet.waitForTransactionHash();
    transactionHash && this.stateProperty.set({kind: 'Deploying', wallet: deployingWallet, transactionHash});

    const deployedWallet = await deployingWallet.waitToBeSuccess();
    this.stateProperty.set({kind: 'Deployed', wallet: deployedWallet});
    this.saveToStorage();
    return deployedWallet;
  }

  setFutureWallet(wallet: FutureWallet, name: string) {
    ensure(this.state.kind === 'None', WalletOverridden);
    this.stateProperty.set({kind: 'Future', name, wallet});
    this.saveToStorage();
  }

  setDeployed() {
    ensure(this.state.kind === 'Future', FutureWalletNotSet);
    const {name, wallet: {contractAddress, privateKey}} = this.state;
    const wallet = new DeployedWallet(contractAddress, name, privateKey, this.sdk);
    this.stateProperty.set({kind: 'Deployed', wallet});
    this.saveToStorage();
  }

  setConnecting(wallet: ConnectingWallet) {
    ensure(this.state.kind === 'None', WalletOverridden);
    this.stateProperty.set({kind: 'Connecting', wallet});
  }

  setWallet(wallet: ApplicationWallet) {
    ensure(this.state.kind === 'None' || this.state.kind === 'Connecting', WalletOverridden);
    this.stateProperty.set({
      kind: 'Deployed',
      wallet: new DeployedWallet(wallet.contractAddress, wallet.name, wallet.privateKey, this.sdk),
    });
    this.saveToStorage();
  }

  async recover(name: string, passphrase: string) {
    const contractAddress = await this.sdk.getWalletContractAddress(name);
    const wallet = await this.walletFromPassphrase(name, passphrase);
    ensure(await this.sdk.keyExist(contractAddress, wallet.address), InvalidPassphrase);
    const applicationWallet: ApplicationWallet = {contractAddress, name, privateKey: wallet.privateKey};
    this.setWallet(applicationWallet);
  }

  async initializeConnection(name: string): Promise<number[]> {
    const contractAddress = await this.sdk.getWalletContractAddress(name);
    const {privateKey, securityCode} = await this.sdk.connect(contractAddress);
    const connectingWallet: ConnectingWallet = new ConnectingWallet(contractAddress, name, privateKey);
    this.setConnecting(connectingWallet);
    return securityCode;
  }

  async waitForConnection() {
    const connectingWallet = this.getConnectingWallet();
    const filter = {
      contractAddress: connectingWallet.contractAddress,
      key: connectingWallet.publicKey,
    };
    const setWallet = this.setWallet
    return new Promise((resolve, reject) => {
      console.log("#####");
      const subscription = this.sdk.subscribe('KeyAdded', filter, () => {
        console.log("*******");
        setWallet(connectingWallet);
        subscription.remove();
        resolve();
      });
    });
  }

  async cancelWaitForConnection() {

  }

  async connect(name: string, callback: Procedure) {
    const contractAddress = await this.sdk.getWalletContractAddress(name);
    const {privateKey, securityCode} = await this.sdk.connect(contractAddress);
    const connectingWallet: ConnectingWallet = new ConnectingWallet(contractAddress, name, privateKey);
    this.setConnecting(connectingWallet);

    const filter = {
      contractAddress,
      key: utils.computeAddress(privateKey),
    };

    const subscription = this.sdk.subscribe('KeyAdded', filter, () => {
      this.setWallet(connectingWallet);
      subscription.remove();
      callback();
    });

    return {
      unsubscribe: () => subscription.remove(),
      securityCode,
    };
  }

  async removeWallet(executionOptions: ExecutionOptions) {
    if (this.state.kind !== 'Deployed') {
      this.disconnect();
      return;
    }
    const execution = await this.state.wallet.removeCurrentKey(executionOptions);
    execution.waitToBeSuccess().then(() => this.disconnect());
    return execution;
  }

  disconnect(): void {
    this.stateProperty.set({kind: 'None'});
    this.saveToStorage();
  }

  saveToStorage() {
    const serialized = this.walletSerializer.serialize(this.state);
    if (serialized !== undefined) {
      this.storage.save(serialized);
    }
  }

  async loadFromStorage() {
    ensure(this.state.kind === 'None', WalletOverridden);
    const state = this.storage.load();
    this.stateProperty.set(await this.walletSerializer.deserialize(state));
  }

  setGasParameters(gasParameters: GasParameters) {
    this.gasParameters = gasParameters;
  }
}
