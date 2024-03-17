import { config } from "dotenv";
config();

import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { FaissStore } from "langchain/vectorstores/faiss";
import { OpenAI } from "langchain/llms/openai";
import { RetrievalQAChain, loadQAStuffChain } from "langchain/chains";

const embeddings = new OpenAIEmbeddings();
const vectorStore = await FaissStore.load("./", embeddings);

const model = new OpenAI({modelName:"gpt-3.5-turbo", temperature: 0 });

const chain = new RetrievalQAChain({
  combineDocumentsChain: loadQAStuffChain(model),
  retriever: vectorStore.asRetriever(),
  returnSourceDocuments: true,
});

const responder = async (text)=>{
    const res = await chain.call({
        query: text,
      });
    return res.text;
      
}

export default responder;