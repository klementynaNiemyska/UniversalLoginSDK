import {MemoryStorageService, StorageService, WalletStorageService} from '../../../src';
import {ApplicationWallet, SerializableFutureWallet} from '@universal-login/commons';
import sinon from 'sinon';
import {expect} from 'chai';
import {Wallet} from 'ethers';

describe('WalletStorageService', () => {
  const futureWallet: SerializableFutureWallet = {
    contractAddress: Wallet.createRandom().address,
    privateKey: Wallet.createRandom().privateKey,
  };
  const applicationWallet: ApplicationWallet = {
    name: 'name',
    ...futureWallet,
  };
  const STORAGE_KEY = 'wallet';

  const setup = () => {
    const storage: StorageService = {
      get: sinon.fake(),
      set: sinon.fake(),
      remove: sinon.fake(),
    };
    const service = new WalletStorageService(storage);
    return {storage, service};
  };

  it('returns None state by default', () => {
    const {storage, service} = setup();
    storage.get = sinon.fake.returns(null);
    expect(service.load()).to.deep.eq({kind: 'None'});
    expect(storage.get).to.be.calledWith(STORAGE_KEY);
  });

  it('can load deployed state', () => {
    const {storage, service} = setup();
    storage.get = sinon.fake.returns(JSON.stringify({kind: 'Deployed', wallet: applicationWallet}));
    expect(service.load()).to.deep.eq({kind: 'Deployed', wallet: applicationWallet});
    expect(storage.get).to.be.calledWith(STORAGE_KEY);
  });

  it('can load future state', () => {
    const {storage, service} = setup();
    storage.get = sinon.fake.returns(JSON.stringify({kind: 'Future', name: 'name.mylogin.eth', wallet: futureWallet}));
    expect(service.load()).to.deep.eq({kind: 'Future', name: 'name.mylogin.eth', wallet: futureWallet});
    expect(storage.get).to.be.calledWith(STORAGE_KEY);
  });

  it('sanitizes data', () => {
    const {storage, service} = setup();
    storage.get = sinon.fake.returns(JSON.stringify({foo: 'bar'}));
    expect(() => service.load()).to.throw;
  });

  it('can save data', () => {
    const {storage, service} = setup();
    service.save({kind: 'Deployed', wallet: applicationWallet});
    expect(storage.set).to.be.calledWith(STORAGE_KEY, JSON.stringify({kind: 'Deployed', wallet: applicationWallet}));
  });

  it('can migrate data from previous versions', () => {
    const {storage, service} = setup();
    let state = JSON.stringify(applicationWallet);
    storage.get = sinon.fake(() => state);
    storage.set = sinon.fake((key: string, val: string) => {
      state = val;
    });

    expect(service.load()).to.deep.eq({kind: 'Deployed', wallet: applicationWallet});
    expect(storage.set).to.be.calledWith(STORAGE_KEY, JSON.stringify({kind: 'Deployed', wallet: applicationWallet}));
  });

  it('roundtrip', () => {
    const storage = new MemoryStorageService();
    const service = new WalletStorageService(storage);

    expect(service.load()).to.deep.eq({kind: 'None'});

    service.save({kind: 'Future', name: 'name.mylogin.eth', wallet: futureWallet});
    expect(service.load()).to.deep.eq({kind: 'Future', name: 'name.mylogin.eth', wallet: futureWallet});

    service.save({kind: 'Deployed', wallet: applicationWallet});
    expect(service.load()).to.deep.eq({kind: 'Deployed', wallet: applicationWallet});
  });
});
