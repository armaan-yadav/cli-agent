import { cancel, confirm, isCancel, outro } from "@clack/prompts";
import chalk from "chalk";
import { Command } from "commander";
import { clearStoredToken, getStoredToken } from "../../../lib/token.js";

async function logoutAction(opts:any

) {
    try{
    const token = await getStoredToken()


    // if token is null
    if(!token) {
        console.log(chalk.yellow("You're not logged in."));
        process.exit(0);
    }
    //token exists

    // ask for cancellation
    const shouldLogout = await confirm({message : "Are you sure you want to logout?",initialValue:false})

    // if user wants to cancel the logout
    if(isCancel(shouldLogout) || !shouldLogout){
        cancel("Logout cancelled.");
        process.exit(0);
    }

    //here user wants to go further
    // clear the token
    const cleared = await clearStoredToken()

    if(cleared){
        outro(chalk.green("Successfully logged out!"))
    }else{
        console.log(chalk.yellow("Could not remove the token file."))
    }
}catch(err){
    console.log(chalk.red(`Something went wrong while removing the token: ${err}`))

}
    
    
}



// create a new commander command
export const logout = new Command("logout")
    .description("Logout from Arka CLI")
    .action(logoutAction);