function extractTags(text) {
  if (!text) return [];

  // Remove punctuation and convert to lowercase
  const cleanText = text.replace(/[^\w\s\u00C0-\u00FF]/g, '').toLowerCase();
  
  // Basic stop words in English and Portuguese to ignore
  const stopWords = new Set([
    'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'e', 'ou', 'mas', 'se', 'como',
    'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'por', 'para', 'com',
    'sem', 'sobre', 'que', 'qual', 'quem', 'me', 'te', 'se', 'lhe', 'nos', 'vos', 'lhes',
    'eu', 'tu', 'ele', 'ela', 'nós', 'vós', 'eles', 'elas', 'meu', 'minha', 'teu', 'tua',
    'seu', 'sua', 'nosso', 'nossa', 'isso', 'isto', 'aquilo', 'este', 'esta', 'esse', 'essa',
    'ser', 'estar', 'ir', 'ter', 'fazer', 'poder', 'dizer', 'ver', 'dar', 'saber', 'querer',
    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'if', 'as', 'how',
    'of', 'in', 'by', 'for', 'with', 'about', 'to', 'from', 'into', 'up', 'down', 'out',
    'it', 'he', 'she', 'we', 'they', 'i', 'you', 'my', 'your', 'his', 'her', 'our', 'their',
    'this', 'that', 'these', 'those', 'be', 'have', 'do', 'say', 'go', 'can', 'will', 'would',
    'am', 'are', 'was', 'were', 'been', 'has', 'had', 'does', 'did', 'very', 'not'
  ]);

  const words = cleanText.split(/\s+/).filter(word => word.length > 3 && !stopWords.has(word));

  const frequencies = {};
  words.forEach(word => {
    frequencies[word] = (frequencies[word] || 0) + 1;
  });

  // Sort by frequency, then by length
  const sortedWords = Object.keys(frequencies).sort((a, b) => {
    if (frequencies[b] !== frequencies[a]) {
      return frequencies[b] - frequencies[a];
    }
    return b.length - a.length;
  });

  // Return top 3-4 keywords as tags
  return sortedWords.slice(0, 4);
}

export default extractTags;
