import * as cluster from "cluster";

import { Logger, LoggerInstance, transports } from "winston";

class Lgger {
  private logger: LoggerInstance;

  constructor() {
    this.logger = new Logger({
      transports: [
        new transports.Console({
          colorize: true,
          handleExceptions: true,
          humanReadableUnhandledException: true,
          timestamp: true
        })
      ]
    });
  }

  public info = (msg: string, ...meta: any[]): void => {
    this.logger.info((cluster.worker ? `worker ${cluster.worker.id} ` : "") + msg, ...meta);
  }

  public error = (msg: string, ...meta: any[]): void => {
    this.logger.error((cluster.worker ? `worker ${cluster.worker.id} ` : "") + msg, ...meta);
  }
}

export = new Lgger();
