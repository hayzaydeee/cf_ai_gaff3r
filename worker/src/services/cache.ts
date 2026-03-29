// Cache helpers — re-exports from the Redis service module.
// Services that previously imported from './cache' continue to work unchanged.
export {
  getRedisOrFetch,
  invalidateRedisKey,
  mgetPipeline,
  createRedisClient,
} from './redis';
export type { Redis } from './redis';
