import {NotFound} from '../../lib/core/utils/errors';
import IRepository from '../../lib/core/models/messages/IRepository';
import {MineableState} from '@universal-login/commons';
import {ensureProperTransactionHash} from '../../lib/core/utils/validations';
import {Mineable} from '../../lib/core/models/Mineable';

export default class MemoryRepository<T extends Mineable> implements IRepository<T> {
  items: Record<string, T>;

  constructor() {
    this.items = {};
  }

  async add(hash: string, item: T) {
    this.items[hash] = item;
  }

  async isPresent(hash: string) {
    return hash in this.items;
  }

  async get(hash: string): Promise<T> {
    if (!this.items[hash]) {
      throw new NotFound(hash, 'NotFound');
    }
    return this.items[hash];
  }

  async remove(hash: string): Promise<T> {
    const item = this.items[hash];
    delete this.items[hash];
    return item;
  }

  async markAsPending(hash: string, transactionHash: string) {
    ensureProperTransactionHash(transactionHash);
    this.items[hash].transactionHash = transactionHash;
    this.items[hash].state = 'Pending';
  }

  async markAsError(hash: string, error: string) {
    this.items[hash].error = error;
    this.items[hash].state = 'Error';
  }

  async setState(hash: string, state: MineableState) {
    this.items[hash].state = state;
  }
}
