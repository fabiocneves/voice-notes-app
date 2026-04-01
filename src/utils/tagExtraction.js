export function extractDate(text) {
  if (!text) return null;
  const t = text.toLowerCase();
  const today = new Date();

  // 1. Specific fixed entities
  if (t.includes('anteontem')) {
    const d = new Date(today);
    d.setDate(today.getDate() - 2);
    return d.toISOString();
  }
  if (t.includes('ontem')) {
    const d = new Date(today);
    d.setDate(today.getDate() - 1);
    return d.toISOString();
  }
  if (t.includes('hoje')) {
    return today.toISOString();
  }
  if (t.includes('depois de amanhã')) {
    const d = new Date(today);
    d.setDate(today.getDate() + 2);
    return d.toISOString();
  }
  if (t.includes('amanhã')) {
    const d = new Date(today);
    d.setDate(today.getDate() + 1);
    return d.toISOString();
  }

  // 2. Relative "daqui a X dias/semanas"
  const relativeMatch = t.match(/daqui\s+a\s+(\d+|um|dois|três|quatro|cinco|seis|sete)\s+(dia|semana)/i);
  if (relativeMatch) {
    const numMap = { 'um': 1, 'dois': 2, 'três': 3, 'quatro': 4, 'cinco': 5, 'seis': 6, 'sete': 7 };
    let amount = parseInt(relativeMatch[1]);
    if (isNaN(amount)) amount = numMap[relativeMatch[1]];
    const unit = relativeMatch[2];
    
    const d = new Date(today);
    if (unit.startsWith('dia')) d.setDate(today.getDate() + amount);
    if (unit.startsWith('semana')) d.setDate(today.getDate() + (amount * 7));
    return d.toISOString();
  }

  // 3. "Semana que vem"
  if (t.includes('semana que vem')) {
    const d = new Date(today);
    d.setDate(today.getDate() + 7);
    return d.toISOString();
  }

  // 2. Specific DD/MM format
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
    if (month === undefined) month = parseInt(monthInput) - 1;

    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      const d = new Date(year, month, day, 12, 0, 0);
      return d.toISOString();
    }
  }

  return null;
}

export default function extractTags(text) {
  if (!text) return [];
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
