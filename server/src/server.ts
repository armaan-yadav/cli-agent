import dotenv from "dotenv";
import app from "./index.js";

dotenv.config({quiet: true});

const port = process.env.PORT || 9000;

console.log(process.env.PORT);

app.listen(port, () => {
  console.log("Server is running on port: ", port);
});
