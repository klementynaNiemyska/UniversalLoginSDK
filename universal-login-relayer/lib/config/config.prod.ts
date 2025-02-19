import path from 'path';
import {getEnv, ETHER_NATIVE_TOKEN, UNIVERSAL_LOGIN_LOGO_URL} from '@universal-login/commons';
import {Config} from './relayer';

export const config: Config = Object.freeze({
  jsonRpcUrl: getEnv('JSON_RPC_URL', ''),
  port: getEnv('PORT', ''),
  privateKey: getEnv('PRIVATE_KEY', ''),
  chainSpec: Object.freeze({
    name: getEnv('CHAIN_NAME', ''),
    ensAddress: getEnv('ENS_ADDRESS', ''),
    chainId: 0,
  }),
  ensRegistrars: [
    getEnv('ENS_DOMAIN_1', ''),
    getEnv('ENS_DOMAIN_2', ''),
    getEnv('ENS_DOMAIN_3', ''),
  ],
  walletContractAddress: getEnv('WALLET_MASTER_ADDRESS', ''),
  contractWhiteList: {
    wallet: ['0x0fc2be641158de5ed5cdbc4cec010c762bc74771e51b15432bb458addac3513d', '0x6575c72edecb8ce802c58b1c1b9cbb290ef2b27588b76c73302cb70b862702a7'],
    proxy: ['0xb68afa7e9356b755f3d76e981adaa503336f60df29b28c0a8013c17cecb750bb'],
  },
  factoryAddress: getEnv('FACTORY_ADDRESS', ''),
  supportedTokens: [{
    address: ETHER_NATIVE_TOKEN.address,
    minimalAmount: '500000',
  }],
  localization: {
    language: 'en',
    country: 'any',
  },
  onRampProviders: {
    safello: {
      appId: getEnv('SAFELLO_APP_ID', ''),
      baseAddress: getEnv('SAFELLO_URL', ''),
      addressHelper: true,
    },
    ramp: {
      appName: 'Universal Login',
      logoUrl: UNIVERSAL_LOGIN_LOGO_URL,
      rampUrl: getEnv('RAMP_URL', ''),
    },
    wyre: {
      wyreUrl: 'https://pay.sendwyre.com/purchase',
      paymentMethod: 'apple-pay',
    },
  },
  database: {
    client: 'postgresql',
    connection: getEnv('DATABASE_URL', ''),
    migrations: {
      directory: path.join(__dirname, '../integration/sql/migrations'),
    },
  },
  maxGasLimit: 500000,
  ipGeolocationApi: {
    baseUrl: 'https://api.ipdata.co',
    accessKey: 'c7fd60a156452310712a66ca266558553470f80bf84674ae7e34e9ee',
  },
  httpsRedirect: getEnv('HTTPS_REDIRECT', '') === 'true',
});

export default config;
