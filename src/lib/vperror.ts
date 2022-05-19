export enum ErrorType {
  General,
  AudioTimeout
}

export class VPError extends Error {

  private errorType1: ErrorType;

  constructor(errorType: ErrorType, ...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params);

    this.name = this.constructor.name;

    // Maintains proper stack trace for where our error was thrown (only available in V8)
    if (typeof Error.captureStackTrace === "function") {
      // Error.captureStackTrace(this, VPError);
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error(...params)).stack;
    }

    // Custom debugging information
    this.errorType = errorType;
  }

  get errorType(): ErrorType {
    return this.errorType1;
  }

  set errorType(errorType: ErrorType) {
    this.errorType1 = errorType;
  }
}
