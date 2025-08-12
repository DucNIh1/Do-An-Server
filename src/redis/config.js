import { createClient } from "redis";

const redisClient = createClient({
  url: "redis://localhost:6380",
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

await redisClient.connect();

export default redisClient;
