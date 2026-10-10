const fs = require('node:fs');
const path = require('node:path');

class RagProvider {
  constructor() {
    this.filePath = path.join(__dirname, '..', 'data', 'knowledgebase.json');
    this.stopWords = new Set([
      'a', 'am', 'an', 'and', 'are', 'about', 'does', 'for', 'how', 'i', 'in', 'is', 'it', 'me', 'of',
      'on', 'she', 'subhadra', 'srivatsan', 'tell', 'the', 'to', 'what', 'when', 'where', 'which', 'who', 'why', 'you',
    ]);
  }

  loadEntries() {
    const kbData = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
    const entries = Array.isArray(kbData) ? kbData : kbData.questions;

    if (!Array.isArray(entries)) {
      throw new Error('knowledgebase.json must contain a questions array.');
    }

    return entries.filter(
      (entry) => typeof entry?.question === 'string' && typeof entry?.answer === 'string',
    );
  }

  normalize(value) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  keywords(value) {
    return new Set(
      this.normalize(value)
        .split(' ')
        .filter((word) => word && !this.stopWords.has(word)),
    );
  }

  retrieve(query, limit = 3) {
    const normalizedQuery = this.normalize(query);
    const queryWords = this.keywords(query);

    if (!normalizedQuery) {
      return [];
    }

    return this.loadEntries()
      .map((entry) => {
        const candidatePhrases = [entry.question, ...(entry.aliases ?? [])];
        const score = Math.max(
          ...candidatePhrases.map((phrase) => {
            const normalizedPhrase = this.normalize(phrase);
            const phraseWords = this.keywords(phrase);
            const sharedWords = [...queryWords].filter((word) => phraseWords.has(word)).length;
            const lexicalScore = sharedWords / Math.max(queryWords.size, phraseWords.size, 1);
            const exactBonus = normalizedPhrase === normalizedQuery ? 1 : 0;
            const phraseBonus =
              normalizedPhrase.includes(normalizedQuery) || normalizedQuery.includes(normalizedPhrase)
                ? 0.5
                : 0;

            return lexicalScore + exactBonus + phraseBonus;
          }),
        );

        return {
          ...entry,
          score,
        };
      })
      .filter((entry) => entry.score >= 0.34)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  preparePrompt(query, entries) {
    const identityQueries = new Set([
      'who am i',
      'tell me about myself',
      'what do i do',
    ]);
    const resolvedQuery = identityQueries.has(this.normalize(query))
      ? 'Give a high-level, balanced introduction to Subhadra Srivatsan based on her resume. Use neutral professional language with at most one brief, dry corporate aside. State what she has worked on and the practical value she could bring. Do not praise her, use superlatives, or call her clever, exceptional, expert, powerful, great, or magnificent. End with a modest suggestion that a team seeking that background consider a conversation with her.'
      : query;
    const context = entries
      .map(
        (entry, index) =>
          `[Source ${index + 1}]\nQuestion: ${entry.question}\nAnswer: ${entry.answer}`,
      )
      .join('\n\n');

    return `Use only the approved knowledge-base context below to answer the request. Do not add outside facts or unsupported assumptions. If the context is insufficient, state that the requested information is not in the approved knowledge base. Keep the response concise, structured, and useful.

${context}

User question: ${resolvedQuery}

Poppy's response:`;
  }
}

module.exports = RagProvider;