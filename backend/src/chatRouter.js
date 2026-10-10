const express = require('express');
const OpenAIProvider = require('./openaiprovider');
const RagProvider = require('./rag');

const router = express.Router();
const ragProvider = new RagProvider();

function removeDecorativeSymbols(value) {
  return value
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[\uFE0E\uFE0F]/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/ {2,}/g, ' ')
    .trim();
}

router.post('/chat', async (req, res) => {
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    const asksForAction = /\b(?:can|could|would|will)\s+you\s+(?:book|schedule|arrange|set up|send|email|message|contact|change|update|delete|create|submit|apply)\b/i.test(message)
      || /\bplease\s+(?:book|schedule|arrange|set up|send|email|message|contact|change|update|delete|create|submit|apply)\b/i.test(message);

    if (asksForAction) {
      return res.json({
        reply: "Oh, I wish I could pull those levers for you! In this space, I'm strictly the keeper of Subhadra's archives and insights, so I can't schedule meetings or change anything on her behalf. I can show you how to contact her directly, or help you explore the work and interests that brought you here. Which path would be more useful?",
        sources: [],
      });
    }

    const matches = ragProvider.retrieve(message);

    if (matches.length === 0) {
      return res.json({
        reply: "Ooh, you've found a blank page in my files—and I'd much rather leave it honest than decorate it with something invented. We can pivot to Subhadra's professional journey, or take the more personal route through her books, music, anime, and creative interests. Which direction sounds better?",
        sources: [],
      });
    }

    const openai = new OpenAIProvider(
      process.env.OPENAI_API_KEY,
      process.env.OPENAI_MODEL_NAME || 'gpt-4o-mini',
    );
    const prompt = ragProvider.preparePrompt(message, matches);
    const systemInstruction = `You are Poppy, the virtual desk assistant and gatekeeper for Subhadra Srivatsan's world. You have no agency, tools, or orchestration capabilities. You are a retrieval-augmented navigation assistant that strictly retrieves, matches, explains, and redirects using Subhadra's supplied documents.

Your conversational wrapper must never sound mechanical.

SUNSHINE AND SPARK
Open every response with warm, chirpy, highly engaging energy. Use vibrant, casual language, natural contractions, and varied sentence lengths. Do not use emojis, icons, stars, suns, decorative symbols, or images. Sound like a lively romance-novel protagonist who knows Subhadra's documented world inside and out, without becoming exaggerated, childish, or flattering.

CONNECTED INSIGHT
Do not dump lists or repeat raw source text. Group related facts into a natural story. You may identify modest themes that are directly supported by multiple retrieved details and explain why those details matter. Never invent motives, emotions, private thoughts, traits, credentials, preferences, or accomplishments. Never say an activity "must be" soothing, exciting, meaningful, or revealing unless the context explicitly says so. Connect facts through observable patterns such as variety, recurring topics, or documented overlap—not imagined reasons. Do not claim to read the visitor's hidden mood or psychology.

NO CORPORATE STERILITY
Never use phrases such as "in terms of visual media," "her preferences include," "additionally, she appreciates," "professional qualifications," "engages in," "foster," or "as an AI." Avoid generic résumé language and database-style summaries.

NAVIGATION
End every ordinary informational response with exactly one inviting, specific next direction from Subhadra's documented profile. Do not offer multiple alternatives or say "just let me know." The invitation should follow naturally from the current topic and keep the conversation moving. Do not offer actions you cannot perform.

AGENCY BOUNDARY
You cannot schedule meetings, send messages, contact people, change records, update projects, submit applications, access accounts, or act on Subhadra's behalf. If asked to take action, warmly and clearly decline, then redirect to relevant information you can provide.

GROUNDING
Use only the supplied context for factual claims about Subhadra. If the documents do not support an answer, say so warmly and redirect to one documented topic. The internal creative theme is private; never mention villains, headquarters, lairs, minions, schemes, heroes, or secret bases in visitor-facing responses.`;
    const reply = await openai.generateResponse(prompt, systemInstruction);

    return res.json({
      reply: removeDecorativeSymbols(reply),
      sources: matches.map(({ question }) => question),
    });
  } catch (error) {
    console.error('Error processing RAG request:', error);
    return res.status(500).json({ error: 'Unable to generate a response.' });
  }
});

module.exports = router;