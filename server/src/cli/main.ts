#!/usr/bin/env node
import chalk from "chalk";
import { Command } from "commander";
import dotenv from "dotenv";
import figlet from "figlet";
import { login } from "./commands/auth/login.js";
import { logout } from "./commands/auth/logout.js";
import { whoami } from "./commands/auth/whoami.js";
import { wakeUp } from "./commands/ai/wakeUp.js";

//configure dotenv
dotenv.config({quiet: true});

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

  //create a new program
  const program = new Command("arka");

  //versioning
  program.version("0.0.1").description(chalk.red("A Command Line Based AI Tool"));

  //default actions
  program
    .action(() => {
      program.help();
    })
    .addCommand(login)
    .addCommand(logout)
    .addCommand(whoami)
    .addCommand(wakeUp)

  //parsing
  program.parse();
}

main().catch((err) => {
  console.log(chalk.red("Error running Arka CLI  :"), err);
  process.exit(1);
});
