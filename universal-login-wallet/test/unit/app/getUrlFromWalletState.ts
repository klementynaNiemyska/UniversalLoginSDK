import {expect} from 'chai';
import {getUrlFromWalletState} from '../../../src/app/getUrlFromWalletState';

describe('UNIT: getUrlFromWalletState', () => {
  const pathNames: string[] = ['/', '/create', '/welcome', 'connect']
  for (const pathName of pathNames) {
    it(`return proper url for ${pathName}`, () => {
      expect(getUrlFromWalletState('Future', pathName)).to.be.eq('/create')
      expect(getUrlFromWalletState('Deployed', pathName)).to.be.eq('/')
      expect(getUrlFromWalletState(undefined, pathName)).to.be.eq('/welcome')
    });
  }
});
