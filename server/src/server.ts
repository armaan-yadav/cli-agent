import dotenv from "dotenv";
import app from "./index.ts";

dotenv.config();

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log("Server is running on port: ", port);
});
