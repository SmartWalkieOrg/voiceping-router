
import * as nodeMandrill from "node-mandrill";
import * as request from "request";
import config = require("./config");
import logger = require("./logger");

const mandrill = nodeMandrill(config.mandrillApiKey);

const verifyNginxConfig = () => {
  setTimeout(() => {
    const nginxConfig = {
      proxy_connect_timeout: null,
      proxy_read_timeout: null,
      proxy_send_timeout:  null,
      worker_connections: null,
      worker_rlimit_nofile: null
    };
    const expectedNginxConfig = {
      ...nginxConfig,
      proxy_connect_timeout: "3600",
      proxy_read_timeout: "3600",
      proxy_send_timeout:  "3600",
      worker_connections: "65535",
      worker_rlimit_nofile: "65535"
    };
    request(`http://${process.env.ROUTER_HOSTNAME}/nginx/conf/da294a9090fbd056140f680689c79e41`, (err, res, body) => {
      if (err) {
        const message = `Failed to get nginx.conf.
        err: ${err.stack}`;
        logger.error(message);
        sendEmailAlert(message);
        return;
      }
      body.split("\n").forEach((line) => {
        Object.keys(nginxConfig).forEach((key) => {
          if (line.includes(key)) {
            const value = line.replace(key, "").replace(/\W/g, "");
            nginxConfig[key] = value;
          }
        });
      });
      const valid = JSON.stringify(nginxConfig) === JSON.stringify(expectedNginxConfig);
      logger.info(`nginx.conf valid: ${valid}, values: ${JSON.stringify(nginxConfig)}`);
      if (!valid) {
        const message = `Invalid nginx.conf value.
          given: ${JSON.stringify(nginxConfig)}

          expected: ${JSON.stringify(expectedNginxConfig)}
        `;
        logger.error(message);
        sendEmailAlert(message);
      }

      if (process.env.NODE_ENV !== "production") {
        const nodeEnvMessage = `NODE_ENV is not ${process.env.NODE_ENV }. Expected to be production`;
        logger.error(nodeEnvMessage);
        sendEmailAlert(nodeEnvMessage);
      }
    });
  }, config.nginxChecking.delay);
};

const sendEmailAlert = (message) => {
  mandrill("/messages/send", {
    message: {
      from_email: "wenhan@voicepingapp.com",
      subject: `[DEV-WARNING] ${process.env.ROUTER_HOSTNAME} Deployment`,
      text: message,
      to: [{email: config.nginxChecking.emailAlert, name: "SmartWalkie Devs"}]
    }
  }, (error, response) => {
    if (error) {
      return logger.error(JSON.stringify(error.stack));
    }
    logger.info(`Email sent successfully. response: ${JSON.stringify(response)}`);
  });
};

export {
  verifyNginxConfig
};
