import Redis from 'ioredis';

let redis;
let redisDisabled = false;
let lastCaller = null; // FIX: track who last called connectRedis

export function isRedisDisabled() {
  return redisDisabled;
}

export function getRedisClient() {
  if (redisDisabled) return null;
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: process.env.REDIS_DB || 0,
      retryStrategy: (times) => {
        if (times >= 3) {
          console.log(`Redis retry limit reached. Last API call: ${lastCaller || 'unknown'}. Permanently disabling Redis, all calls will go directly to DB.`);
          redisDisabled = true;
          redis = null;
          return null;
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      enableReadyCheck: false,
      enableOfflineQueue: true,
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      console.error('Redis Client Error', err.message);
    });

    redis.on('connect', () => {
      console.log('✓ Redis Connected');
    });

    redis.on('ready', () => {
      console.log('✓ Redis Ready');
    });

    redis.on('reconnecting', () => {
      console.log('⚠ Redis Reconnecting...');
    });
  }

  return redis;
}

export async function connectRedis(callerPath = null) {  // FIX: accept caller info
  if (callerPath) lastCaller = callerPath;               // FIX: store it

  if (redisDisabled) {
    console.log('⚠ Redis permanently disabled, skipping connection');
    return null;
  }

  const client = getRedisClient();
  if (!client) return null;

  if (client.status === 'ready') return client;

  if (client.status === 'connecting') {
    return new Promise((resolve) => {
      client.once('ready', () => resolve(client));
    });
  }

  if (client.status === 'wait' || client.status === 'end') {
    try {
      await client.connect();
    } catch (err) {
      console.log('Redis connection failed, continuing without cache');
      return null;
    }
  }

  return client;
}