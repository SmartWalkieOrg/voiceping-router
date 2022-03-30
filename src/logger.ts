import * as os from "os";
import { Logger, LoggerInstance, transports } from "winston";
import * as winstonPapertrail from "winston-papertrail";

class Lgger {
  private logger: LoggerInstance;

  constructor() {
    if (process.env.NODE_ENV === "production") {
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
            host: process.env.PAPERTRAIL_HOST || "logs2.papertrailapp.com",
            hostname: process.env.ROUTER_HOSTNAME || os.hostname(),
            humanReadableUnhandledException: true,
            port: process.env.PAPERTRAIL_PORT || 33808
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
    this.logger.info(msg, ...meta);
  }

  public error = (msg: string, ...meta: any[]): void => {
    this.logger.error(msg, ...meta);
  }
}

export = new Lgger();
