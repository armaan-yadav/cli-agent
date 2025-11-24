#!/usr/bin/env node
import chalk from "chalk";
import { Command } from "commander";
import dotenv from "dotenv";
import figlet from "figlet";
import { login } from "./auth/login.js";
import { logout } from "./auth/logout.js";
import { whoami } from "./auth/whoami.js";

//configure dotenv
dotenv.config();

async function main() {
  //display  a banner
  console.log(
    chalk.cyan(
      figlet.textSync("Arka CLI", {
        font: "Standard",
        horizontalLayout: "default",
      })
    )
  );
  console.log(chalk.red("A Command Line Based AI Tool"));

  //create a new program
  const program = new Command("arka");

  //versioning
  program.version("0.0.1").description("Arka CLI - A CLI based AI Tool");

  //default actions
  program
    .action(() => {
      program.help();
    })
    .addCommand(login)
    .addCommand(logout)
    .addCommand(whoami)

  //parsing
  program.parse();
}

main().catch((err) => {
  console.log(chalk.red("Error running Arka CLI  :"), err);
  process.exit(1);
});
