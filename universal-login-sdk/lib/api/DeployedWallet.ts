import {
  ApplicationWallet,
  Message,
  generateBackupCode,
  walletFromBrain,
  ETHER_NATIVE_TOKEN,
  DEFAULT_GAS_PRICE,
  DEFAULT_GAS_LIMIT,
  sign,
  MessageStatus,
} from '@universal-login/commons';
import UniversalLoginSDK from './sdk';
import {Execution} from '../core/services/ExecutionFactory';
import {Contract, utils} from 'ethers';
import WalletContract from '@universal-login/contracts/build/Wallet.json';
import {BigNumber} from 'ethers/utils';
import {OnBalanceChange} from '../core/observers/BalanceObserver';

interface BackupCodesWithExecution {
  waitToBeSuccess: () => Promise<string[]>;
  waitForTransactionHash: () => Promise<MessageStatus>;
}

export class DeployedWallet implements ApplicationWallet {
  constructor(
    public readonly contractAddress: string,
    public readonly name: string,
    public readonly privateKey: string,
    public readonly sdk: UniversalLoginSDK,
  ) {
  }

  get publicKey() {
    return utils.computeAddress(this.privateKey);
  }

  get asApplicationWallet(): ApplicationWallet {
    return {
      contractAddress: this.contractAddress,
      name: this.name,
      privateKey: this.privateKey,
    };
  }

  async addKey(publicKey: string, transactionDetails: Partial<Message>): Promise<Execution> {
    return this.sdk.addKey(this.contractAddress, publicKey, this.privateKey, transactionDetails);
  }

  async addKeys(publicKeys: string[], transactionDetails: Partial<Message>): Promise<Execution> {
    return this.sdk.addKeys(this.contractAddress, publicKeys, this.privateKey, transactionDetails);
  }

  async removeKey(key: string, transactionDetails: Partial<Message>): Promise<Execution> {
    return this.sdk.removeKey(this.contractAddress, key, this.privateKey, transactionDetails);
  }

  async removeCurrentKey(transactionDetails: Partial<Message>): Promise<Execution> {
    const ownKey = utils.computeAddress(this.privateKey);
    return this.removeKey(ownKey, transactionDetails);
  }

  async denyRequests() {
    return this.sdk.denyRequests(this.contractAddress, this.privateKey);
  }

  async setRequiredSignatures(requiredSignatures: number, transactionDetails: Partial<Message>): Promise<Execution> {
    return this.sdk.setRequiredSignatures(this.contractAddress, requiredSignatures, this.privateKey, transactionDetails);
  }

  async execute(message: Partial<Message>): Promise<Execution> {
    return this.sdk.execute({
      from: this.contractAddress,
      ...message,
    }, this.privateKey);
  }

  async keyExist(key: string) {
    return this.sdk.keyExist(this.contractAddress, key);
  }

  async getNonce() {
    return this.sdk.getNonce(this.contractAddress);
  }

  async getBalance(tokenAddress: string) {
    return this.sdk.getBalance(this.contractAddress, tokenAddress);
  }

  async getConnectedDevices() {
    return this.sdk.getConnectedDevices(this.contractAddress, this.privateKey);
  }

  async getRequiredSignatures(): Promise<BigNumber> {
    const walletContract = new Contract(this.contractAddress, WalletContract.interface, this.sdk.provider);
    return walletContract.requiredSignatures();
  }

  async getGasModes() {
    return this.sdk.getGasModes();
  }

  async generateBackupCodes(): Promise<BackupCodesWithExecution> {
    const codes: string[] = [generateBackupCode(), generateBackupCode()];
    const addresses: string[] = [];

    for (const code of codes) {
      const {address} = await walletFromBrain(this.name, code);
      addresses.push(address);
    }

    const execution = await this.sdk.addKeys(this.contractAddress, addresses, this.privateKey, {gasToken: ETHER_NATIVE_TOKEN.address, gasPrice: DEFAULT_GAS_PRICE, gasLimit: DEFAULT_GAS_LIMIT});
    return {
      waitToBeSuccess: async () => {
        await execution.waitToBeSuccess();
        return codes;
      },
      waitForTransactionHash: execution.waitForTransactionHash,
    };
  }

  signMessage(bytes: Uint8Array) {
    return sign(bytes, this.privateKey);
  }

  subscribeAuthorisations(callback: Function) {
    return this.sdk.subscribeAuthorisations(this.contractAddress, this.privateKey, callback);
  }

  subscribeToBalances(callback: OnBalanceChange) {
    return this.sdk.subscribeToBalances(this.contractAddress, callback);
  }
}
