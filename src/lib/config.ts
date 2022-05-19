const config = {
  app: {
    port: process.env.PORT || 3000
  },
  group: {
    busyTimeout: Number(process.env.GROUP_BUSY_TIMEOUT) || (95 * 1000),
    inspectInterval: Number(process.env.GROUP_INSPECT_INTERVAL) || (60 * 1000)
  },
  message: {
    maximumDuration: Number(process.env.MAXIMUM_AUDIO_DURATION) || (90 * 1000),
    maximumIdleDuration: Number(process.env.MAXIMUM_IDLE_DURATION) || (3 * 1000)
  },
  network: {
    name: process.env.NETWORK || "voiceping-lite"
  },
  nodeEnv: process.env.NODE_ENV || "production",
  pingInterval: Number(process.env.PING_INTERVAL) || (2 * 60 * 1000),
  redis: {
    cleanGroupsAmount: Number(process.env.REDIS_CLEAN_GROUPS_AMOUNT) || 10000,
    cleanInterval: Number(process.env.REDIS_CLEAN_INTERVAL) || (60 * 1000),
    cleanLogEnabled: (process.env.REDIS_CLEAN_LOG_ENABLED === "true") || false,
    dryCleanEnabled: (process.env.REDIS_DRY_CLEAN_ENABLED === "true") || false,
    host: process.env.REDIS_HOST || "127.0.0.1",
    password: process.env.REDIS_PASSWORD || null,
    port: process.env.REDIS_PORT || 6379
  },
  secretKey: process.env.SECRET_KEY || "awesomevoiceping",
  web: {
    serverUrl: process.env.WEB_SERVER_URL || "",
    socketSecret: process.env.WEB_SOCKET_SECRET || ""
  }
};

export = config;
