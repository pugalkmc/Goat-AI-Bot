import { config } from "dotenv";
config();

import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { FaissStore } from "langchain/vectorstores/faiss";
import { OpenAI } from "langchain/llms/openai";
import { RetrievalQAChain, loadQAStuffChain } from "langchain/chains";
const apiKey = process.env.OPENAI_API_KEY
const embeddings = new OpenAIEmbeddings({openAIApiKey:apiKey});
const vectorStore = await FaissStore.load("./", embeddings);

const model = new OpenAI({openAIApiKey: apiKey,modelName:"gpt-3.5-turbo", temperature: 0 });

const chain = new RetrievalQAChain({
  combineDocumentsChain: loadQAStuffChain(model),
  retriever: vectorStore.asRetriever(),
  returnSourceDocuments: true,
});

const responder = async (text)=>{
    // Get the query vector
    const queryVector = await embeddings.embedQuery(text);
    // Log the length of the query vector
    console.log("Query Vector Length:", queryVector.length);
    // Call the chain with the query
    const res = await chain.call({
        query: text,
      });
    return res.text;
}

export default responder;
