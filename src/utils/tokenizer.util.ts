import { english } from 'stopwords'; // Ensure stopword module is installed
import * as natural from 'natural'; // Ensure `npm install natural` is done

export function advancedTokenizeContent(content: string): string[] {
  if (!content) return [];

  const tokenizer = new natural.WordTokenizer();
  const tokens = tokenizer.tokenize(content.toLowerCase()); // Tokenize and normalize to lowercase

  // 1. Remove stop words
  const filteredTokens = tokens.filter((token) => !english.includes(token));

  // 2. Remove special characters and numeric-only tokens
  const alphanumericTokens = filteredTokens.filter(
    (token) => /^[a-z]+$/.test(token), // Keep only alphabetic tokens
  );

  // 3. Apply length filter (e.g., min 3, max 20 characters)
  const lengthFilteredTokens = alphanumericTokens.filter(
    (token) => token.length >= 3 && token.length <= 20,
  );

  // 4. Apply lemmatization/stemming to handle plurals
  const lemmatizedTokens = lengthFilteredTokens.map(
    (token) => natural.LancasterStemmer.stem(token), // Use the static `stem` method directly
  );

  // 5. Remove duplicates
  const uniqueTokens = [...new Set(lemmatizedTokens)];

  console.log('Filtered Tokens:', uniqueTokens);
  return uniqueTokens;
}
