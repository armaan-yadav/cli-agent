import { select } from "@clack/prompts";
import chalk from "chalk";
import { Command } from "commander";
import yoctoSpinner from "yocto-spinner";
import { startMessaging } from "../../chat/chatWithAi.js";
import prisma from "../../../lib/db.js";
import { getStoredToken } from "../../../lib/token.js";

const wakeUpAction = async ()=>{
    try {
        const token = await getStoredToken();
        if(!token){
            console.log("No stored token found. Please log in first.");
            return;
        }
        if(!token.access_token){
            console.log("Stored token is invalid. Please log in again.");
            return;
        }
        
        const spinner = yoctoSpinner({text : " Fetching user information\n"});
        spinner.start();

        //get user data
        const user = await prisma.user.findFirst
        (
            {
                where : {
                sessions : {
                    some : {
                        token  : token.access_token
                    }
                }
         },
                select :{
                    id : true,
                    name : true,
                    email : true,
                    image : true
                }
            }
        )

        spinner.stop();

        //if user does not exist
        if(!user){
            console.log(chalk.red("User not found."))
            return;
        }

        console.log(chalk.bgGreen(`Welcome back, ${user.name}!\n`));

        const choice = await select({message : "Select an option.",options:[

            {value : "chat", label : "Chat with AI",hint : "Simple chat with AI"},
            {value:"tool",label :"Use AI Tools",hint : "Use AI with integrated tools"},
            {
                value : "agent",label : "Agentic Mode",
                hint : "Advance AI agent"
            },
             {
                value : "exit",label : "Exit",
                hint : "Exit the Arka CLI"
             }
        ]})

        switch (choice) {
            case "chat":
                startMessaging({conversationId:null,mode:"chat"});
                break;
            case "tool":
                console.log("Tool is selected");
                break;
            case "agent":
                console.log("Agentic mode is selected");
                break;
        
            default:
                process.exit(1);
        }

    } catch (error : any) {
        console.log("Something went wrong in wakeUpAction: ",error)
    }
}

export const wakeUp = new Command("wake-up")
        .description('Wake up Arka CLI')
        .action(wakeUpAction);