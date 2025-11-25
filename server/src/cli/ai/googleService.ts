import { google } from "@ai-sdk/google";
import { config } from "../../config/google.config.js";
import { streamText, type LanguageModel, type ModelMessage, } from "ai";
import chalk from "chalk";
import type { GetMessageParams, MessageResponse, SendMessageParams } from "../../interfaces/index.js";

export class AiService {
    private model: LanguageModel;

    constructor() {
        if (!config.googleApiKey) {
            throw new Error("Google API key is not configured.");
        }

        this.model = google(config.googleModel);
    }

    async sendMessage({
        messages,
        onChunk,
        tools,
        onToolCall
    }: SendMessageParams): Promise<MessageResponse> {
        try {
            const streamConfig: any = {
                model: this.model,
                messages: messages,
            };

            // Add tools to config if provided
            if (tools) {
                streamConfig.tools = tools;
            }

            const result = streamText(streamConfig);
            let fullResponse = "";

            // Stream the text chunks
            for await (const chunk of result.textStream) {
                fullResponse += chunk;
                if (onChunk) {
                    onChunk(chunk);
                }
            }

            // Await the final result
            const fullResult = await result;

            return {
                content: fullResponse,
                finishResponse: await fullResult.finishReason,
                usage: await fullResult.usage
            };

        } catch (error: any) {
            console.log(chalk.red("AI Service Error: ", error.message));
            throw new Error(error.message);
        }
    }

    async getMessage({ messages, tools }: GetMessageParams): Promise<string> {
        let fullResponse = "";
        await this.sendMessage({
            messages,
            onChunk: (chunk: string) => {
                fullResponse += chunk;
            },
            ...(tools && { tools }) // Only add tools if defined
        });
        return fullResponse;
    }
}