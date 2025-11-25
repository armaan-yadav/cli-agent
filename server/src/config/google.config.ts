import dotenv from 'dotenv';


dotenv.config({quiet: true});


export const config = {
    googleApiKey: process.env.GOOGLE_AI_STUDIO_API_KEY || '',
    googleModel: process.env.GOOGLE_MODEL || 'gemini-2.5-flash',
    temperature : ""
}