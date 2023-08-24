import * as cluster from "cluster";
import * as os from "os";

import { Logger, LoggerInstance, transports } from "winston";
import * as winstonPapertrail from "winston-papertrail";

class Lgger {
  private logger: LoggerInstance;

  constructor() {
    if (process.env.PAPERTRAIL_HOST && process.env.PAPERTRAIL_PORT) {
      this.logger = new Logger({
        transports: [
          new transports.Console({
            colorize: true,
            handleExceptions: true,
            humanReadableUnhandledException: true,
            timestamp: true
          }),
          new winstonPapertrail.Papertrail({
            handleExceptions: true,
            host: process.env.PAPERTRAIL_HOST,
            hostname: process.env.ROUTER_HOSTNAME || os.hostname(),
            humanReadableUnhandledException: true,
            port: process.env.PAPERTRAIL_PORT
          })
        ]
      });
    } else {
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
  }

  public info = (msg: string, ...meta: any[]): void => {
    this.logger.info((cluster.worker ? `worker ${cluster.worker.id} ` : "") + msg, ...meta);
  }

  public error = (msg: string, ...meta: any[]): void => {
    this.logger.error((cluster.worker ? `worker ${cluster.worker.id} ` : "") + msg, ...meta);
  }
}

export = new Lgger();
