import { english } from 'stopwords'; // Import the appropriate language stopword list

export function advancedTokenizeContent(text: string): string[] {
  if (!text) {
    console.error('Input text is empty or undefined:', text);
    return []; // Return an empty array if the text is invalid
  }

  // Convert the text to lowercase and split it into tokens (words)
  const tokens = text.toLowerCase().split(/\s+/);

  // Filter out stopwords by checking if the token is in the stopwords list
  return tokens.filter((token) => !english.includes(token)); // Filter out stopwords
}
