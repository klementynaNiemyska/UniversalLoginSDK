import {expect} from 'chai';
import {utils} from 'ethers';
import {SignedMessage, calculateMessageHash} from '@universal-login/commons';
import {getTestSignedMessage} from '../../../config/message';
import {getKnexConfig} from '../../../helpers/knex';
import QueueSQLStore from '../../../../lib/integration/sql/services/QueueSQLStore';
import QueueMemoryStore from '../../../helpers/QueueMemoryStore';
import {IExecutionQueue} from '../../../../lib/core/models/execution/IExecutionQueue';
import {clearDatabase} from '../../../../lib/http/relayers/RelayerUnderTest';

for (const config of [{
  Type: QueueSQLStore,
}, {
  Type: QueueMemoryStore,
}]
) {
  describe(`INT: IQueueStore: ${config.Type.name}`, async () => {
    let executionQueue: IExecutionQueue;
    let signedMessage: SignedMessage;
    let expectedMessageHash: string;
    const knex = getKnexConfig();

    before(async () => {
      signedMessage = getTestSignedMessage();
      expectedMessageHash = calculateMessageHash(signedMessage);
    });

    beforeEach(async () => {
      let args: any;
      if (config.Type.name.includes('SQL')) {
        args = knex;
      }
      executionQueue = new config.Type(args);
    });

    it('construction: queue is empty', async () => {
      const nextTransaction = await executionQueue.getNext();
      expect(nextTransaction).to.be.undefined;
    });

    it('add message', async () => {
      const messageHash = await executionQueue.addMessage(signedMessage);
      expect(messageHash).to.be.a('string');
      expect(messageHash).to.be.eq(expectedMessageHash);
    });

    it('message round trip', async () => {
      const messageHash1 = await executionQueue.addMessage(signedMessage);
      const signedMessage2 = getTestSignedMessage({value: utils.parseEther('2')});
      const messageHash2 = await executionQueue.addMessage(signedMessage2);
      const nextMessageHash = (await executionQueue.getNext())!.hash;
      expect(nextMessageHash).to.be.equal(messageHash1);
      expect(nextMessageHash).to.be.eq(expectedMessageHash);
      await executionQueue.remove(messageHash1);
      const nextMessageHash2 = (await executionQueue.getNext())!.hash;
      expect(nextMessageHash2).to.be.equal(messageHash2);
      expect(nextMessageHash2).to.be.eq(calculateMessageHash(signedMessage2));
      await executionQueue.remove(messageHash2);
      expect(await executionQueue.getNext()).to.be.undefined;
    });

    afterEach(async () => {
      config.Type.name.includes('SQL') && await clearDatabase(knex);
    });

    after(async () => {
      await knex.destroy();
    });
  });
}
