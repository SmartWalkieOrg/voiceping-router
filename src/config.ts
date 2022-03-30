const config = {
  cleaner: {
    expiration: Number(process.env.CLEANER_EXPIRATION) || (1000 * 60 * 60 * 24 * 30),
    interval: Number(process.env.CLEANER_INTERVAL) || (1000 * 60 * 60)
  },
  mandrillApiKey: process.env.MANDRILL_API_KEY || "",
  nginxChecking: {
    delay: +process.env.DELAY_NGINX_CHECKING || 2 * 60 * 1000,
    emailAlert: process.env.EMAIL_ALERT || "",
    enable: process.env.ENABLE_NGINX_CONFIG_CHECKING
      ? process.env.ENABLE_NGINX_CONFIG_CHECKING.toLowerCase() === "true"
      : true
  }
};

export = config;
