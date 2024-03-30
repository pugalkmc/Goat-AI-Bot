import natural from 'natural';

const tokenizer = new natural.WordTokenizer();
const badWords = ['fuck', 'fuk', 'fck', 'suck', 'bitch'];

function detectBadWords(text) {
    if (!text) {
        return false;
    }

    const words = tokenizer.tokenize(text.toLowerCase());
    console.log(words);

    for (let i = 0; i < badWords.length; i++) {
        const regex = new RegExp(`\\b${badWords[i]}\\b`);
        if (regex.test(text.toLowerCase())) {
            return true;
        }
    }

    return false;
}

export { detectBadWords };
