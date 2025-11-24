import { cancel, confirm, intro, isCancel, outro } from "@clack/prompts";
import { logger } from "better-auth";
import { createAuthClient } from "better-auth/client";
import { deviceAuthorizationClient } from "better-auth/client/plugins";
import chalk from "chalk";
import { Command } from "commander";
import open from "open";
import yoctoSpinner from "yocto-spinner";
import * as z from "zod";
import { getStoredToken, isTokenExpired, storeToken } from "../../lib/token.js";
import { CLIENT_ID, TOKEN_FILE, URL } from "./config.js";




async function loginAction(opts: any) {
  //setup schema for the options
  const optionsSchema = z.object({
    serverUrl: z.string().optional(),
    clientId: z.string().optional(),
  });
  //extract  the options based on above schema
  const options = optionsSchema.parse(opts);
  // setup credentials
  const serverUrl = options.serverUrl || URL;
  const clientId = options.clientId || CLIENT_ID;

  intro(chalk.bold("🔐 Arka CLI Login"));

  //todo: change it dynamically as per user status
  const existingToken = await getStoredToken();
  const expired = await isTokenExpired();

  //if already logged in then show this
  if (existingToken && !expired) {
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
    baseURL: serverUrl,
    plugins: [deviceAuthorizationClient()],
  });

  // start the loading spinner?
  const spinner = yoctoSpinner({ text: "Requesting device authorization..." });
  spinner.start();

  //try  obtaining the device code
  try {
    const { data, error } = await authClient.device.code({
      client_id: clientId!,
      scope: "openid profile email",
    });

    //device code obtained successfully : stop the spinner
    spinner.stop();

    // if it failes to request device code
    if (error || !data) {
      logger.error(
        `Failed to request device authorization: ${error.error_description}`
      );

      process.exit(0);
    }

    //device code obtained, exract the data
    const {
      device_code,
      user_code,
      verification_uri,
      verification_uri_complete,
      interval,
      expires_in,
    } = data;

    // start device aurhorization
    console.log(chalk.cyan("Device authorization required."));
    console.log(
      `Please visit ${chalk.underline.blue(
        verification_uri || verification_uri_complete
      )}`
    );
    console.log(`Enter Code: ${chalk.bold.green(user_code)}`);

    //asking  user if it wants to open browser automatically
    const shouldOpen = await confirm({
      message: "Open browser automatically",
      initialValue: true,
    });

    // if users choooses yes then open the browser
    if (!isCancel(shouldOpen) && shouldOpen) {
      const urlToOpen = verification_uri_complete || verification_uri;
      await open(urlToOpen);
    }

    console.log(
      chalk.grey(
        `Waiting for authorization (expires in ${Math.floor(
          expires_in / 60
        )} minutes)...`
      )
    );

    //start polling for the access token
    const token = await pollForToken(authClient, device_code, clientId!, 5);

    if (token) {
      const savedToken = await storeToken(token);

      if(!savedToken){
        console.log(chalk.yellow("\n Watning: Could not save token."));
        console.log(chalk.yellow("You may need to login again on next use."));
      }

      //todo: get the  user data

      outro(chalk.green("Login successful!"));
      console.log(chalk.gray(`Token saved at ${TOKEN_FILE}`));
      console.log(
        chalk.gray("You can use AI commands without loggin in again.\n")
      );
    }
  } catch (error: any) {
    console.log(error);
    spinner.stop();
    console.log(chalk.red("\n Login Failed:", error?.message));
    process.exit(1);
  }
}

//todo: research about this in deep!
async function pollForToken(
  authClient: any,
  deviceCode: string,
  clientId: string,
  initialIntervalValue: number
) {
  let pollingInterval = initialIntervalValue;
  const spinner = yoctoSpinner({ text: "", color: "cyan" });
  let dots = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return new Promise((resolve, reject) => {
    const poll = async () => {
      dots = (dots + 1) % 4;
      spinner.text = chalk.gray(
        `Polling for authorization${".".repeat(dots)}${" ".repeat(3 - dots)}`
      );
      //if not spinning then start
      if (!spinner.isSpinning) spinner.start();

      try {
        const { data, error } = await authClient.device.token({
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
          device_code: deviceCode,
          client_id: clientId,
          fetchOptions: {
            headers: {
              "user-agent": `My CLI`,
            },
          },
        });

        //access token mil gaya
        if (data?.access_token) {
          console.log(
            chalk.bold.yellow(`Your access token:${data?.access_token}`)
          );

          spinner.stop();
          if (timeoutId) clearTimeout(timeoutId);
          resolve(data);
          return;
        } else if (error) {
          switch (error.error) {
            case "authorization_pending":
              // Continue polling
              timeoutId = setTimeout(poll, pollingInterval * 1000);
              break;
            case "slow_down":
              pollingInterval += 5;
              timeoutId = setTimeout(poll, pollingInterval * 1000);
              break;
            case "access_denied":
              spinner.stop();
              if (timeoutId) clearTimeout(timeoutId);
              reject(new Error("Access was denied by the user"));
              return;
            case "expired_token":
              spinner.stop();
              if (timeoutId) clearTimeout(timeoutId);
              reject(new Error("The device code has expired. Please try again."));
              return;
            default:
              spinner.stop();
              if (timeoutId) clearTimeout(timeoutId);
              reject(new Error(error.error_description));
              return;
          }
        }
      } catch (error: any) {
        spinner.stop();
        if (timeoutId) clearTimeout(timeoutId);
        reject(new Error(`Network Error: ${error.message}`));
      }
    };
    timeoutId = setTimeout(poll, pollingInterval * 1000);
  });
}

//create a mew commander command
export const login = new Command("login")
  .description("Login to Arka CLI")
  .option("--server-url <url>", "The Arka server URL", URL)
  .option("--client-id <id>", "The OAuth client ID", CLIENT_ID)
  .action(loginAction);
