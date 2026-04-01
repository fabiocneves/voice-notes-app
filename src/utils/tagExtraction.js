export function extractDate(text) {
  if (!text) return null;
  const t = text.toLowerCase();
  const today = new Date();

  // "ontem"
  if (t.includes('ontem')) {
    const date = new Date(today);
    date.setDate(today.getDate() - 1);
    return date.toISOString();
  }

  // "anteontem"
  if (t.includes('anteontem')) {
    const date = new Date(today);
    date.setDate(today.getDate() - 2);
    return date.toISOString();
  }

  // "amanhã" (just in case)
  if (t.includes('amanhã')) {
    const date = new Date(today);
    date.setDate(today.getDate() + 1);
    return date.toISOString();
  }

  // DD/MM/YYYY or DD/MM
  const dateRegex = /(\d{1,2})[\/\s]?(de\s)?(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|\d{1,2})([\/\s]?(de\s)?(\d{2,4}))?/gi;
  const match = dateRegex.exec(t);

  if (match) {
    const day = parseInt(match[1]);
    let monthInput = match[3];
    let year = match[6] ? parseInt(match[6]) : today.getFullYear();
    if (year < 100) year += 2000;

    const months = {
      'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3, 'maio': 4, 'junho': 5,
      'julho': 6, 'agosto': 7, 'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
    };

    let month = months[monthInput];
    if (month === undefined) {
      month = parseInt(monthInput) - 1;
    }

    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      const date = new Date(year, month, day, 12, 0, 0);
      return date.toISOString();
    }
  }

  return null;
}

export default function extractTags(text) {
  if (!text) return [];
  // Rest of original logic...
  const cleanText = text.replace(/[^\w\s\u00C0-\u00FF]/g, '').toLowerCase();
  const stopWords = new Set([
    'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'e', 'ou', 'mas', 'se', 'como',
    'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'por', 'para', 'com',
    'sem', 'sobre', 'que', 'qual', 'quem', 'me', 'te', 'se', 'lhe', 'nos', 'vos', 'lhes',
    'eu', 'tu', 'ele', 'ela', 'nós', 'vós', 'eles', 'elas', 'meu', 'minha', 'teu', 'tua',
    'seu', 'sua', 'nosso', 'nossa', 'isso', 'isto', 'aquilo', 'este', 'esta', 'esse', 'essa',
    'ser', 'estar', 'ir', 'ter', 'fazer', 'poder', 'dizer', 'ver', 'dar', 'saber', 'querer'
  ]);

  const words = cleanText.split(/\s+/).filter(word => word.length > 3 && !stopWords.has(word));
  const frequencies = {};
  words.forEach(word => { frequencies[word] = (frequencies[word] || 0) + 1; });
  const sortedWords = Object.keys(frequencies).sort((a, b) => {
    if (frequencies[b] !== frequencies[a]) return frequencies[b] - frequencies[a];
    return b.length - a.length;
  });
  return sortedWords.slice(0, 4);
}
