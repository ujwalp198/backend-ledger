const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_URI || "redis://localhost:6379", {
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
        if (times > 3) {
            return null; // stop reconnect spam if Redis is offline
        }
        return Math.min(times * 100, 1000);
    }
});

redis.on("connect", () => {
    console.log("Connected to Redis cache");
});

redis.on("error", (err) => {
    // Log once as warning rather than crashing or spamming unhandled rejections
    console.warn("Redis is offline or unreachable - continuing without cache:", err.message);
});

module.exports = redis;

