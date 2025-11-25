import prisma from "../lib/db.js";

export class ChatService{

    async createConversation(userId:string,mode:string="chat",title:string){

      const conversation = await prisma.conversation.create({
            data:{
                title : title|| `New ${mode} Conversation`,
                userId,
                mode
            }
        })
        return conversation;
    }

    async getOrCreateConversation(userId:string,conversationId:string|null,mode:string="chat"){
        let conversation ;
        if(conversationId !== null){
            console.log("ifffffffffffffff")
        conversation = await prisma.conversation.findFirst({
            where: {
                    id : conversationId,
                    userId
            }, include : {
                messages : {
                    orderBy : {
                            createdAt : 'asc'
                    }
                },
                
            }
        })}else{
            conversation = await this.createConversation(userId,mode,`New ${mode} Conversation`);
        }
        return conversation;
    }

    async addMessageToConversation(conversationId:string,role:string,content:string){

        await prisma.message.create({
            data :{
                conversationId,
                role,
                content
            }
        })
    }

    async getConversationMessages(conversationId:string){
        const messages = await prisma.message.findMany({
            where : {
                conversationId
            },
            orderBy : {
                createdAt : 'asc'
            }
        })

        return messages;
    }

    async getAllConversationsForUser(userId:string){
        const conversations = await prisma.conversation.findFirst({
            where : {
                userId
            },
            orderBy : {
                updatedAt : 'desc'
            },
            include:{
                messages : {
                 take : 1,
                    orderBy : {
                        createdAt : 'desc'
                    }
                }
            }
        })
        return conversations;
    }

    async deleteConversation(conversationId:string,userId:string){
        await prisma.conversation.deleteMany({
            where : {
                id : conversationId,
                userId
            }
        })
    }

    async renameConversation(conversationId:string,newTitle:string){
        await prisma.conversation.update({
            where :{
                id : conversationId,
            },
            data : {
                title : newTitle
            }
        })

    }

     async formatMessagesForAI(messages:any) {
    return messages.map((msg:any) => ({
      role: msg.role,
      content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
    }));
  }
}