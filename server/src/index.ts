import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import cors from "cors";
import express, { type Request, type Response } from "express";
import morgan from "morgan";
import { auth } from "./lib/auth.js";



const app = express();

//cors setup
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

//morgan for logging
app.use(morgan("dev"));

//better-auth handler
app.all("/api/auth/*splat", toNodeHandler(auth));

//middlewares
app.use(express.json());

// routes
app.get("/api/me", async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  return res.json(session);
});

//redirect to client app
app.get("/device", async (req: Request, res: Response) => {
  const { user_code } = req.query;
  res.redirect(`http://localhost:3000/device?user_code=${user_code}`);
});

app.get("/", (req: Request, res: Response) => {
  res.json("ok");
});

export default app;
