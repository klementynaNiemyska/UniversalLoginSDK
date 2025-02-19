type ErrorType = 'InvalidContract' | 'NotEnoughTokens';

export class ValidationError extends Error {
  errorType: ErrorType;
  constructor(message: string, errorType: ErrorType) {
    super(message);
    this.errorType = errorType;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class InvalidContract extends ValidationError {
  constructor(contractAddress: string) {
    super(`Invalid contract address: ${contractAddress}`, 'InvalidContract');
    Object.setPrototypeOf(this, InvalidContract.prototype);
  }
}

export class PaymentError extends Error {
  errorType: ErrorType;
  constructor(message: string, errorType: ErrorType) {
    super(message);
    this.errorType = errorType;
    Object.setPrototypeOf(this, PaymentError.prototype);
  }
}

export class NotEnoughTokens extends PaymentError {
  constructor() {
    super('Not enough tokens', 'NotEnoughTokens');
    Object.setPrototypeOf(this, NotEnoughTokens.prototype);
  }
}
