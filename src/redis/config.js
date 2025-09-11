import Redis from "ioredis";

const redisClient = new Redis({
  host: "localhost",
  port: 6380,
  maxRetriesPerRequest: null,
});

export default redisClient;
