import pkg from 'natural';
const { WordTokenizer } = pkg;

const tokenizer = new WordTokenizer();
const badWords = ['fuck','fuk','fck','suck','**','bitch']

function detectBadWords(text) {
    if (!text) {
        return false;
      }
    const words = tokenizer.tokenize(text);
    console.log(words)
    const detected = words.filter(word => badWords.includes(word.toLowerCase()));
    if (detected.length>0){
        return true
    }
    return false
}

export {
    detectBadWords
}