import {dirname, join} from 'path';
import {getWallets} from 'ethereum-waffle';
import {providers, Wallet, utils} from 'ethers';
import {ContractWhiteList, getContractHash, SupportedToken, ContractJSON, ETHER_NATIVE_TOKEN, UNIVERSAL_LOGIN_LOGO_URL} from '@universal-login/commons';
import {RelayerClass, Config} from '@universal-login/relayer';
import ProxyContract from '@universal-login/contracts/build/WalletProxy.json';
import SaiToken from '@universal-login/contracts/build/MockSai.json';
import DaiToken from '@universal-login/contracts/build/MockDai.json';
import {ensureDatabaseExist} from '../common/ensureDatabaseExist';
import {startDevelopmentRelayer} from './startRelayer';
import {startGanache} from './startGanache';
import {deployENS} from './deployEns';
import deployWalletContractOnDev from './deployWalletContractOnDev';
import deployToken from './deployToken';
import deployFactory from '../ops/deployFactory';

const ganachePort = 18545;

const databaseConfig = {
  client: 'postgresql',
  connection: {
    database: 'universal_login_relayer_development',
    user: 'postgres',
    password: 'postgres',
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: getMigrationPath(),
  },
};

const ensDomains = ['mylogin.eth', 'universal-id.eth', 'popularapp.eth'];

function getRelayerConfig(jsonRpcUrl: string, wallet: Wallet, walletContractAddress: string, ensAddress: string, ensRegistrars: string[], contractWhiteList: ContractWhiteList, factoryAddress: string, daiTokenAddress: string, saiTokenAddress: string) {
  const supportedTokens: SupportedToken[] = [{
    address: daiTokenAddress,
    minimalAmount: utils.parseEther('0.05').toString(),
  },
  {
    address: saiTokenAddress,
    minimalAmount: utils.parseEther('0.05').toString(),
  },
  {
    address: ETHER_NATIVE_TOKEN.address,
    minimalAmount: '500000',
  }];
  return {
    jsonRpcUrl,
    port: '3311',
    privateKey: wallet.privateKey,
    chainSpec: {
      name: 'development',
      ensAddress,
      chainId: 0,
    },
    ensRegistrars,
    walletContractAddress,
    contractWhiteList,
    factoryAddress,
    supportedTokens,
    localization: {
      language: 'en',
      country: 'any',
    },
    onRampProviders: {
      safello: {
        appId: '1234-5678',
        baseAddress: 'https://app.s4f3.io/sdk/quickbuy.html',
        addressHelper: true,
      },
      ramp: {
        appName: 'Universal Login',
        logoUrl: UNIVERSAL_LOGIN_LOGO_URL,
        rampUrl: 'https://ri-widget-staging.firebaseapp.com/',
      },
      wyre: {
        wyreUrl: 'https://pay.sendwyre.com/purchase',
        paymentMethod: 'apple-pay',
      },
    },
    database: databaseConfig,
    maxGasLimit: 500000,
    ipGeolocationApi: {
      baseUrl: 'https://api.ipdata.co',
      accessKey: 'c7fd60a156452310712a66ca266558553470f80bf84674ae7e34e9ee',
    },
    httpsRedirect: false,
  };
}

function getProxyContractHash() {
  const proxyContractHash = getContractHash(ProxyContract as ContractJSON);
  console.log(`ProxyContract hash: ${proxyContractHash}`);
  return proxyContractHash;
}

function getMigrationPath() {
  const packagePath = require.resolve('@universal-login/relayer/package.json');
  return join(dirname(packagePath), 'build', 'lib', 'integration', 'sql', 'migrations');
}

declare interface StartDevelopmentOverrides {
  nodeUrl?: string;
  relayerClass?: RelayerClass;
}

async function startDevelopment({nodeUrl, relayerClass}: StartDevelopmentOverrides = {}) {
  const jsonRpcUrl = nodeUrl || await startGanache(ganachePort);
  const provider = new providers.JsonRpcProvider(jsonRpcUrl);
  const [, , , , ensDeployer, deployWallet] = await getWallets(provider);
  const ensAddress = await deployENS(ensDeployer, ensDomains);
  const {address, walletContractHash} = await deployWalletContractOnDev(deployWallet);
  const proxyContractHash = getProxyContractHash();
  const factoryAddress = await deployFactory(deployWallet, {walletContractAddress: address, nodeUrl: 'dev', privateKey: 'dev'});
  const saiTokenAddress = await deployToken(deployWallet, SaiToken);
  const daiTokenAddress = await deployToken(deployWallet, DaiToken);
  await ensureDatabaseExist(databaseConfig);
  const contractWhiteList = {
    wallet: [walletContractHash],
    proxy: [proxyContractHash],
  };
  const relayerConfig: Config = getRelayerConfig(jsonRpcUrl, deployWallet, address, ensAddress, ensDomains, contractWhiteList, factoryAddress, daiTokenAddress, saiTokenAddress);
  await startDevelopmentRelayer(relayerConfig, provider, relayerClass);
  return {jsonRpcUrl, deployWallet, walletContractAddress: address, saiTokenAddress, daiTokenAddress, ensAddress, ensDomains};
}

export default startDevelopment;
