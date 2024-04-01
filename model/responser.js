import { config } from "dotenv";
config();

import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { FaissStore } from "langchain/vectorstores/faiss";
import { OpenAI } from "langchain/llms/openai";
import { RetrievalQAChain, loadQAStuffChain } from "langchain/chains";
const apiKey = process.env.OPENAI_API_KEY
const embeddings = new OpenAIEmbeddings({openAIApiKey:apiKey});
const vectorStore = FaissStore.load("./", embeddings);

const model = new OpenAI({openAIApiKey: apiKey,modelName:"gpt-3.5-turbo", temperature: 1 });

const chain = new RetrievalQAChain({
  combineDocumentsChain: loadQAStuffChain(model),
  retriever: vectorStore.asRetriever(),
  returnSourceDocuments: true,
});

const responder = async (text) => {
  // Call the chain with the query
  const res = await chain.call({
    query: text,
  });

  if (res.text.toLowerCase() === "i don't know.") {
    // Choose a random humorous response or helpful action from an array of options
    const responses = [
      "Let's try a different question...",
      "My knowledge is a work in progress, but I'm a fast learner!",
      "Hold on, gotta consult the ancient archives of the internet... (crickets)",
      "What was the question again?",
      "If I knew everything, what would be the point of Google?",
      "My circuits are overheating from that question. Maybe a cat video break will help?",
      "That's a question for the ages...or perhaps Wikipedia?",
      "I can't answer that directly, but here are some keywords to help you search further:...",
      "That's an intriguing question! Let's see what other users have asked about similar topics...",
      "Would you like me to summarize a relevant article or document for you?",
      "Although I don't have the answer, I'm a great listener. Tell me more about what you're curious about.",
      "That's beyond my current knowledge, but I'm constantly learning. Maybe you can teach me something new!"
    ];
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
  }
  return res.text;
}


export default responder;
