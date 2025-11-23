import { deviceAuthorizationClient } from "better-auth/client/plugins";
import { intro, outro, cancel, confirm, isCancel } from "@clack/prompts";
import { logger } from "better-auth";
// import { createAuthClient } from "better-auth/client";

import chalk from "chalk";
import { Command } from "commander";
import fs from "fs/promises";
import open from "open";
import os from "os";
import path from "path";
import yoctoSpinner from "yocto-spinner";
import dotenv from "dotenv";
import * as z from "zod";
import prisma from "../../lib/db.js";
import { createAuthClient } from "better-auth/client";

dotenv.config();

const URL = `http://localhost:${process.env.PORT}`;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CONFIG_DIR = path.join(os.homedir(), ".better-auth");
const TOKEN_FILE = path.join(CONFIG_DIR, "token.json");

export async function loginAction(opts: any) {
  //setup schema for the options
  const optionsSchema = z.object({
    serverUrl: z.string().optional(),
    clientUrl: z.string().optional(),
  });
  //extract  the options based on above schema
  const options = optionsSchema.parse(opts);
  // setup credentials
  const serverUrl = options.serverUrl || URL;
  const clientId = options.clientUrl || URL;

  intro(chalk.bold("🔐 Arka CLI Login"));

  //todo: change it dynamically as per user status
  const existingToken: boolean = true;
  const expired: boolean = true;

  //if already logged in then show this
  if (!existingToken && !expired) {
    const shouldReauth = await confirm({
      message: "You are already logged in. Do you want to login again?",
      initialValue: false,
    });

    // if users chooses NO option from above confirm
    if (isCancel(shouldReauth) || !shouldReauth) {
      cancel("Login cancelled");
      process.exit(0);
    }
  }

  //setup authClient
  // todo : why we creating a new authClient?
  const authClient = createAuthClient({
    serverUrl: serverUrl,
    plugins: [deviceAuthorizationClient()],
  });

  // start the loading spinner?
  const spinner = yoctoSpinner({ text: "Requesting device authorization..." });
  spinner.start();

  //try  authenticating using device code
  try {
    const { data, error } = await authClient.device.code({
      client_id: clientId,
      scope: "openid profile email",
    });

    //authentication successfull : stop the spinner
    spinner.stop();

    // if authentication fails
    if (error || !data) {
      logger.error(
        `Failed to request device authorization: ${error.error_description}`
      );

      process.exit(0);
    }

    //auth is successfull
    const {
      device_code,
      user_code,
      verification_uri,
      verification_uri_complete,
      interval,
      expires_in,
    } = data;

    console.log(chalk.cyan("Device authorization required."));
    console.log(
      `Please visit ${chalk.underline.blue(
        verification_uri || verification_uri_complete
      )}`
    );
    console.log(`Enter Code: ${chalk.bold.green(user_code)}`);

    const shouldOpen = await confirm({
      message: "Open browser automatically",
      initialValue: true,
    });

    if (!isCancel(shouldOpen) && shouldOpen) {
      const urlToOpen = verification_uri || verification_uri_complete;
      await open(urlToOpen);
    }

    console.log(
      chalk.grey(
        `Waiting for authorization (expires in ${Math.floor(
          expires_in / 60
        )} minutes)...`
      )
    );
  } catch (error) {
    
    console.log(error);
  }
}

//commander setup

export const login = new Command("login")
  .description("Login to Arka CLI")
  .option("--server-url <url>", "The Arka server URL", URL)
  .option("--client-id <id>", "The OAuth client ID", URL)
  .action(loginAction);
