import chalk from "chalk";
import { Command } from "commander";
import prisma from "../../../lib/db.js";
import { requireAuth } from "../../../lib/token.js";
import { URL } from "./auth.config.js";

async function whoamiAction(opts:any) {
    try {
        const token =  await requireAuth()

        //checl for the access token
        if(!token?.access_token){
            console.log(chalk.red("No access token found. Please login."))
            process.exit(1);
        }

        const user = await prisma.user.findFirst({
            where : {
                sessions : {
                    some : {
                        token : token?.access_token
                    }
                }
            },
            select : {
                id  : true,
                name : true,
                email : true,
                image : true,
                createdAt  : true
            }
        })

        console.log(chalk.greenBright(`\n Name: ${user?.name} \n Email: ${user?.email} \n ID: ${user?.id} \n`))

    } catch (error) {
        console.log(chalk.red(`Something went wrong in whoamiAction: ${error}`))
    }
}

export const whoami = new Command("whoami")
    .description("Show current authenticated user")
    .option("--server-url <url>", "The Better Auth server url", URL)
    .action(whoamiAction)