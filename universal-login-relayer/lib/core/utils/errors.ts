type ErrorType =
  'NotFound' |
  'GasLimitTooHigh' |
  'InsufficientGas' |
  'StatusNotFound' |
  'MessageNotFound' |
  'TransactionHashNotFound' |
  'NodeEnvNotSpecified' |
  'InvalidENSDomain' |
  'PaymentError' |
  'NotEnoughGas' |
  'NotEnoughBalance' |
  'InvalidExecution' |
  'InvalidMaster' |
  'InvalidProxy' |
  'InvalidSignature' |
  'DuplicatedSignature' |
  'DuplicatedExecution' |
  'NotEnoughSignatures' |
  'InvalidTransaction' |
  'InvalidHexData' |
  'EnsNameTaken' |
  'UnauthorisedAddress';

export class RelayerError extends Error {
  errorType: ErrorType;
  constructor(message: string, errorType: ErrorType) {
    super(message);
    this.errorType = errorType;
    Object.setPrototypeOf(this, RelayerError.prototype);
  }
}

export class Unauthorised extends RelayerError {
  constructor(message: string, errorType: ErrorType) {
    super(message, errorType);
    this.errorType = errorType;
    Object.setPrototypeOf(this, Unauthorised.prototype);
  }
}

export class UnauthorisedAddress extends Unauthorised {
  constructor(address: string) {
    super(`Unauthorised address: ${address}`, 'UnauthorisedAddress');
    Object.setPrototypeOf(this, UnauthorisedAddress.prototype);
  }
}

export class ValidationFailed extends RelayerError {
  constructor(message: string, errorType: ErrorType) {
    super(message, errorType);
    this.errorType = errorType;
    Object.setPrototypeOf(this, ValidationFailed.prototype);
  }
}

export class InvalidSignature extends ValidationFailed {
  constructor(additionalMessage = '') {
    super(`Invalid signature ${additionalMessage}`, 'InvalidSignature');
    Object.setPrototypeOf(this, InvalidSignature.prototype);
  }
}

export class InvalidProxy extends ValidationFailed {
  constructor(address: string, proxyHash: string, supportedProxyHashes: string[]) {
    super(`Invalid proxy at address '${address}'. Deployed contract bytecode hash: '${proxyHash}'. Supported bytecode hashes: [${supportedProxyHashes}]`, 'InvalidProxy');
    Object.setPrototypeOf(this, InvalidProxy.prototype);
  }
}

export class InvalidMaster extends ValidationFailed {
  constructor(address: string, masterHash: string, supportedMasterHashes: string[]) {
    super(`Invalid master at address '${address}'. Deployed contract bytecode hash: '${masterHash}'. Supported bytecode hashes: [${supportedMasterHashes}]`, 'InvalidMaster');
    Object.setPrototypeOf(this, InvalidMaster.prototype);
  }
}

export class NotEnoughSignatures extends ValidationFailed {
  constructor(requiredSignatures: number, actualSignatures: number) {
    super(`Not enough signatures, required ${requiredSignatures}, got only ${actualSignatures}`, 'NotEnoughSignatures');
    Object.setPrototypeOf(this, NotEnoughSignatures.prototype);
  }
}

export class InvalidTransaction extends ValidationFailed {
  constructor(transactionHash: string) {
    super(`Invalid transaction: ${transactionHash}`, 'InvalidTransaction');
    Object.setPrototypeOf(this, InvalidTransaction.prototype);
  }
}

export class InvalidHexData extends ValidationFailed {
  constructor(hexData: string) {
    super(`Invalid hex data: ${hexData}`, 'InvalidHexData');
    Object.setPrototypeOf(this, InvalidHexData.prototype);
  }
}

export class InsufficientGas extends ValidationFailed {
  constructor(msg: string) {
    super(`Insufficient Gas. ${msg}`, 'InsufficientGas');
    Object.setPrototypeOf(this, InsufficientGas.prototype);
  }
}

export class GasLimitTooHigh extends ValidationFailed {
  constructor(msg: string) {
    super(`GasLimit is too high. ${msg}`, 'GasLimitTooHigh');
    Object.setPrototypeOf(this, GasLimitTooHigh.prototype);
  }
}

export class NotFound extends RelayerError {
  constructor(message: string, errorType: ErrorType) {
    super(message, errorType);
    this.errorType = errorType;
    Object.setPrototypeOf(this, NotFound.prototype);
  }
}

export class InvalidMessage extends NotFound {
  constructor(hash: string) {
    super(`Could not find message with hash: ${hash}`, 'InvalidExecution');
    Object.setPrototypeOf(this, InvalidMessage.prototype);
  }
}

export class InvalidENSDomain extends NotFound {
  constructor(ensDomain: string) {
    super(`ENS domain ${ensDomain} does not exist or is not compatible with Universal Login`, 'InvalidENSDomain');
  }
}

export class StatusNotFound extends NotFound {
  constructor() {
    super('Status not found', 'StatusNotFound');
    Object.setPrototypeOf(this, StatusNotFound.prototype);
  }
}

export class MessageNotFound extends NotFound {
  constructor(messageHash: string) {
    super(`Message not found for hash: ${messageHash}`, 'MessageNotFound');
    Object.setPrototypeOf(this, MessageNotFound.prototype);
  }
}

export class TransactionHashNotFound extends NotFound {
  constructor() {
    super('Transaction hash not found for executed transaction ', 'TransactionHashNotFound');
    Object.setPrototypeOf(this, TransactionHashNotFound.prototype);
  }
}

export class NodeEnvNotSpecified extends NotFound {
  constructor() {
    super('NODE_ENV was not specified', 'NodeEnvNotSpecified');
    Object.setPrototypeOf(this, NodeEnvNotSpecified.prototype);
  }
}

export class PaymentError extends RelayerError {
  constructor(message: string, errorType: ErrorType) {
    super(message, errorType);
    this.errorType = errorType;
    Object.setPrototypeOf(this, PaymentError.prototype);
  }
}

export class NotEnoughGas extends PaymentError {
  constructor() {
    super('Not enough gas', 'NotEnoughGas');
    Object.setPrototypeOf(this, NotEnoughGas.prototype);
  }
}

export class NotEnoughBalance extends PaymentError {
  constructor() {
    super('Not enough balance', 'NotEnoughBalance');
    Object.setPrototypeOf(this, NotEnoughBalance.prototype);
  }
}

export class Conflict extends RelayerError {
  constructor(message: string, errorType: ErrorType) {
    super(message, errorType);
    this.errorType = errorType;
    Object.setPrototypeOf(this, Conflict.prototype);
  }
}

export class EnsNameTaken extends Conflict {
  constructor(ensName: string) {
    super(`ENS name ${ensName} already taken`, 'EnsNameTaken');
    Object.setPrototypeOf(this, EnsNameTaken.prototype);
  }
}

export class DuplicatedSignature extends Conflict {
  constructor() {
    super('Signature already collected', 'DuplicatedSignature');
    Object.setPrototypeOf(this, DuplicatedSignature.prototype);
  }
}

export class DuplicatedExecution extends Conflict {
  constructor() {
    super('Execution request already processed', 'DuplicatedExecution');
    Object.setPrototypeOf(this, DuplicatedExecution.prototype);
  }
}
