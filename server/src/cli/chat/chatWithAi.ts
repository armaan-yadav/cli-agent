import { isCancel, outro, text } from "@clack/prompts";
import boxen from "boxen";
import chalk from "chalk";
import { marked } from "marked";
import TerminalRenderer from "marked-terminal";
import yoctoSpinner from "yocto-spinner";
import prisma from "../../lib/db.js";
import { getStoredToken } from "../../lib/token.js";
import { ChatService } from "../../service/chatService.js";
import { AiService } from "../ai/aiService.js";

marked.setOptions({
  renderer: new TerminalRenderer({
    code: chalk.cyan,
    blockquote: chalk.gray.italic,
    heading: chalk.green.bold,
    firstHeading: chalk.magenta.underline.bold,
    hr: chalk.reset,
    listitem: chalk.reset,
    list: chalk.reset,
    paragraph: chalk.reset,
    strong: chalk.bold,
    em: chalk.italic,
    codespan: chalk.yellow.bgBlack,
    del: chalk.dim.gray.strikethrough,
    link: chalk.blue.underline,
    href: chalk.blue.underline
  }) as any
});

//start the services
const aiService =  new AiService();
const chatService = new ChatService()

async function getUserFromToken() {
  try {
    const token = await getStoredToken()

    if(!token){
      throw new Error("No stored token found.");
    }
    if(!token.access_token){
      throw new Error("Stored token is invalid.");
    }

    const spinner  =  yoctoSpinner({text : " Fetching user information"});
    spinner.start();
    const user = await prisma.user.findFirst({
      where  : {
        sessions : {
          some : {
            token : token.access_token
          }
        }
      }
    })
    if(!user){
      spinner.error("User not found.");
      throw new Error("User not found for the stored token.");
    }
    spinner.success(`Welcome back, ${user.name}!`);
    return user;
  } catch (error: any) {
    throw new Error(`[getUserFromToken] ${error.message}`);
  }
}
async function initConversation(userId:string, conversationId:string|null,mode:string="chat") {
  try {
    const spinner = yoctoSpinner({text : " Initializing conversation"}).start();

    const conversation = await chatService.getOrCreateConversation(userId,conversationId,mode);

    spinner.success("Conversation Loaded.");
    if(conversation){

      
      const conversationInfo = boxen(
        `${chalk.bold("Conversation")}: ${conversation.title}\n` +
        `${chalk.gray("ID: " + conversation.id)}\n` +
        `${chalk.gray("Mode: " + conversation.mode)}`,
        {
          padding: 1,
          margin: { top: 1, bottom: 1 },
          borderStyle: "round",
          borderColor: "cyan",
          title: "💬  Chat Session",
          titleAlignment: "center"
        }
      );
      console.log(conversationInfo);
    }

    // if(conversation?.messages?.length && conversation.messages.length > 0){
    //   console.log(chalk.yellow("Previous messages: \n"))
    //   //todo : display previous messages
    // }
    return conversation;
  } catch (error: any) {
    throw new Error(`[initConversation] ${error.message}`);
  }
}

async function saveMessage(conversationId:string,role:string, content: string) {
  try {
    return await  chatService.addMessageToConversation(conversationId,role,content);
  } catch (error: any) {
    throw new Error(`[saveMessage] ${error.message}`);
  }
}

async function renameConversationTitle(conversationId:string,title:string) {
  try {
    await  chatService.renameConversation(conversationId,title);
  } catch (error: any) {
    throw new Error(`[renameConversationTitle] ${error.message}`);
  }
}

async function chatLoop(conversation:any) {
  try {
    const helpBox = boxen(
      `${chalk.gray('• Type your message and press Enter')}\n${chalk.gray('• Markdown formatting is supported in responses')}\n${chalk.gray('• Type "exit" to end conversation')}\n${chalk.gray('• Press Ctrl+C to quit anytime')}`,
      {
        padding: 1,
        margin: { bottom: 1 },
        borderStyle: "round",
        borderColor: "gray",
        dimBorder: true,
      }
    );

    console.log(helpBox);

    while(true){
      const userInput = await text({
        message : chalk.cyan("Your message"),
        placeholder : "Type your message here...",

        validate(value){
          if(!value || value.trim().length === 0){
            return "Message cannot be empty.";
          }
        }

      })

      if(isCancel(userInput)){
        console.log(chalk.yellow("\nConversation ended by user."));
        process.exit(0);
      }

      if(userInput.trim().toLowerCase() === "exit"){
        console.log(chalk.yellow("\nExiting conversation."));
        process.exit(0);
      }

      await saveMessage(conversation.id,"user",userInput.trim());

      const messages =  await chatService.getConversationMessages(conversation.id);

      const aiResponse = await getAIResponse(conversation.id);


      await saveMessage(conversation.id,"assistant",aiResponse);

      await renameConversationTitle(conversation.id,aiResponse.slice(0,30) + "...");
    }
  } catch (error: any) {
    throw new Error(`[chatLoop] ${error.message}`);
  }
}


const STREAM_RESPONSE = true;

async function getAIResponse(conversationId:string) {
  const spinner = yoctoSpinner({ 
    text: "AI is thinking...", 
    color: "cyan" 
  }).start();

  const dbMessages = await chatService.getConversationMessages(conversationId);
  const aiMessages = await chatService.formatMessagesForAI(dbMessages);
  
  let fullResponse = "";
  let isFirstChunk = true;
  
  try {
    const sendMessageParams: any = {
      messages: aiMessages,
    };

    if (STREAM_RESPONSE) {
      sendMessageParams.onChunk = (chunk: string) => {
        // Stop spinner on first chunk and show header
        if (isFirstChunk) {
          spinner.stop();
          console.log("\n");
          const header = chalk.green.bold("🤖 Assistant:");
          console.log(header);
          console.log(chalk.gray("─".repeat(60)));
          console.log();
          isFirstChunk = false;
        }
        // Stream each chunk in real-time without buffering
        process.stdout.write(chunk);
        fullResponse += chunk;
      };
    }

    const result = await aiService.sendMessage(sendMessageParams);
    
    // If not streaming, show the full response after spinner
    if (!STREAM_RESPONSE) {
      spinner.stop();
      console.log("\n");
      const header = chalk.green.bold("🤖 Assistant:");
      console.log(header);
      console.log(chalk.gray("─".repeat(60)));
      console.log();
      console.log(result.content);
    }
    
    // Add spacing after response
    console.log("\n");
    console.log(chalk.gray("─".repeat(60)));
    console.log("\n");
    
    return result.content;
  } catch (error: any) {
    spinner.error("Failed to get AI response");
    throw new Error(`[getAIResponse] ${error.message}`);
  }
}


export async function startMessaging({mode = "chat", conversationId}:{mode:string, conversationId:string|null}) {
  
  try {
    console.log(boxen(chalk.bold.cyan("Welcome to Arka AI Chat! Type your message below to get started."), {padding: 1, borderStyle: "round", borderColor: "cyan"}));
   

    const user= await getUserFromToken()
    const conversation = await initConversation(user.id,conversationId,mode);
    await chatLoop(conversation);

    outro(chalk.green("Thank you for using Arka AI Chat! Goodbye."));
  } catch (error:any) {
        const errorBox = boxen(chalk.bgRed(`❌ Error: ${error.message}`), {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "red",
    });
        console.log(errorBox);
    process.exit(1);
  }
}