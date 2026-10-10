const OpenAI = require('openai');

class OpenAIProvider {
   constructor(apikey, modelname) {
      this.apikey = apikey;
      this.modelname = modelname;

      if (!this.apikey) {
         throw new Error("API key is required");
      }
      if (!this.modelname) {
         throw new Error("Model name is required");
      }
   }
   async generateResponse(prompt, systemInstruction) {
      try {
          const openai = new OpenAI({
              apiKey: this.apikey,
          });
          const response = await openai.chat.completions.create({
              model: this.modelname,
              messages: [
              ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
              { role: "user", content: prompt },
          ],
          temperature: 0.6,
          });
          return response.choices[0].message.content;
      } catch (error) {
         console.error("Error generating response:", error);
         throw new Error("Failed to generate response");
      }
   }
}


module.exports = OpenAIProvider;