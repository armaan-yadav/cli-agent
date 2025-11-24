import os from "os";
import path from "path";
import dotenv from "dotenv";


dotenv.config();
// cli auth config
export const CONFIG_DIR = path.join(os.homedir(), ".arka-cli");
export const TOKEN_FILE = path.join(CONFIG_DIR, "token.json");
export const URL = `http://localhost:9000`;
export const CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  "351141722258-52rbna7vl0pobq5m18kf5hel6ia55f2q.apps.googleusercontent.com";