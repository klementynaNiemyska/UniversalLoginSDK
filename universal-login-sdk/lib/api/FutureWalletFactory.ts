import {providers, utils} from 'ethers';
import {
  calculateInitializeSignature,
  SerializableFutureWallet,
  MineableStatus,
  PublicRelayerConfig,
  ensure,
  isValidEnsName,
  SupportedToken,
} from '@universal-login/commons';
import {encodeInitializeWithENSData, BlockchainService} from '@universal-login/contracts';
import {DeploymentReadyObserver} from '../core/observers/DeploymentReadyObserver';
import {RelayerApi} from '../integration/http/RelayerApi';
import {ENSService} from '../integration/ethereum/ENSService';
import {DeployedWallet} from './DeployedWallet';
import UniversalLoginSDK from './sdk';
import {MineableFactory} from '../core/services/MineableFactory';
import {InvalidAddressOrEnsName} from '../core/utils/errors';
import {SerializedDeployingWallet} from '../core/models/WalletService';

export type BalanceDetails = {
  tokenAddress: string;
  contractAddress: string;
};

export interface DeployingWallet extends SerializedDeployingWallet {
  waitForTransactionHash: () => Promise<MineableStatus>;
  waitToBeSuccess: () => Promise<DeployedWallet>;
}

export interface FutureWallet extends SerializableFutureWallet {
  waitForBalance: () => Promise<BalanceDetails>;
  deploy: (ensName: string, gasPrice: string, gasToken: string) => Promise<DeployingWallet>;
  setSupportedTokens: (supportedTokens: SupportedToken[]) => void;
}

type FutureFactoryConfig = Pick<PublicRelayerConfig, 'supportedTokens' | 'factoryAddress' | 'contractWhiteList' | 'chainSpec'>;

export class FutureWalletFactory extends MineableFactory {
  private ensService: ENSService;
  private deploymentReadyObserver: DeploymentReadyObserver;

  constructor(
    private config: FutureFactoryConfig,
    private provider: providers.Provider,
    private blockchainService: BlockchainService,
    private relayerApi: RelayerApi,
    private sdk: UniversalLoginSDK,
    tick?: number,
    timeout?: number,
  ) {
    super(
      tick,
      timeout,
      (hash: string) => this.relayerApi.getDeploymentStatus(hash),
    );
    this.ensService = new ENSService(provider, config.chainSpec.ensAddress);
    this.deploymentReadyObserver = new DeploymentReadyObserver(provider);
  }

  private async setupInitData(publicKey: string, ensName: string, gasPrice: string, gasToken: string) {
    const args = await this.ensService.argsFor(ensName) as string[];
    const initArgs = [publicKey, ...args, gasPrice, gasToken];
    return encodeInitializeWithENSData(initArgs);
  }

  createDeployingWallet(serializedDeployingWallet: SerializedDeployingWallet): DeployingWallet {
    const {deploymentHash, contractAddress, name, privateKey} = serializedDeployingWallet;
    return {
      ...serializedDeployingWallet,
      waitForTransactionHash: this.createWaitForTransactionHash(deploymentHash),
      waitToBeSuccess: async () => {
        await this.createWaitToBeSuccess(deploymentHash)();
        return new DeployedWallet(contractAddress, name, privateKey, this.sdk);
      },
    };
  }

  createFromExistingCounterfactual(wallet: SerializableFutureWallet): FutureWallet {
    const {privateKey, contractAddress} = wallet;
    const publicKey = utils.computeAddress(privateKey);

    return {
      privateKey,
      contractAddress,
      waitForBalance: async () => new Promise<BalanceDetails>(
        (resolve) => {
          this.deploymentReadyObserver.subscribeAndStart(
            contractAddress,
            (tokenAddress, contractAddress) => resolve({tokenAddress, contractAddress}),
          ).catch(console.error);
        },
      ),
      deploy: async (ensName: string, gasPrice: string, gasToken: string): Promise<DeployingWallet> => {
        ensure(isValidEnsName(ensName), InvalidAddressOrEnsName, ensName);
        const initData = await this.setupInitData(publicKey, ensName, gasPrice, gasToken);
        const signature = await calculateInitializeSignature(initData, privateKey);
        const {deploymentHash} = await this.relayerApi.deploy(publicKey, ensName, gasPrice, gasToken, signature, this.sdk.sdkConfig.applicationInfo);
        return this.createDeployingWallet({deploymentHash, contractAddress, name: ensName, privateKey});
      },
      setSupportedTokens: (supportedTokens: SupportedToken[]) => {
        this.deploymentReadyObserver.setSupportedTokens(supportedTokens);
      },
    };
  }

  async createFutureWallet(): Promise<FutureWallet> {
    const [privateKey, contractAddress] = await this.blockchainService.createFutureWallet(this.config.factoryAddress);
    return this.createFromExistingCounterfactual({privateKey, contractAddress});
  }
}
