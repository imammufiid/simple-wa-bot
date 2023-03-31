const {Configuration, OpenAIApi} = require("openai");
require('dotenv').config()

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const gptCompletion = async (content) =>
    await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{role: "user", content: content}],
    });


module.exports = {gptCompletion}