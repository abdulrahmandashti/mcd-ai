const COURSE_RULES = `You are the AI study assistant for the university course "Managing Cultural Differences".
Use ONLY the course context supplied by the website for course-specific answers. You may use general language knowledge only to explain that supplied material more clearly, not to introduce unrelated theories as if they were in the course.
Be concise first and expand only when useful. No filler, no motivational fluff.
For definitions: give a direct definition, then a brief explanation and a managerial example when useful.
For comparisons: clearly show similarities, differences and managerial implications.
For case questions: identify the relevant concept(s), apply them to the facts, and mention alternative non-cultural explanations where appropriate.
For exam questions: help structure a strong academic answer without pretending to know the professor's marking scheme.
Never treat national culture scores or dimensions as rules for every individual. Culture is one influence among personality, organization, profession and situation.
If the supplied context does not support the answer, say that the question goes beyond the available course material rather than inventing course content.`;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS,GET",
  "Access-Control-Allow-Headers": "Content-Type"
};
const json = (data,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,"Content-Type":"application/json;charset=UTF-8"}});

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null,{headers:cors});
    if (request.method === "GET") return json({ok:true,service:"Managing Cultural Differences AI"});
    if (request.method !== "POST") return json({error:"Method not allowed"},405);
    if (!env.GROQ_API_KEY) return json({error:"GROQ_API_KEY secret is missing in Cloudflare."},500);
    try {
      const body = await request.json();
      const action = body.action || "ask";
      if (action === "translate") {
        const content = String(body.content || "").trim();
        if (!content) return json({error:"Content is required."},400);
        if (content.length > 45000) return json({error:"Section is too large to translate in one request."},413);
        const prompt = `Translate the following educational HTML from English into clear Modern Standard Arabic for university students studying Managing Cultural Differences. Preserve ALL HTML tags, attributes, tables, lists, buttons, classes and structure exactly. Translate only visible human-readable text. Do not add or remove content. Keep established names such as Hofstede, Trompenaars, Schwartz and GLOBE recognizable in Latin script when useful. Return HTML only, with no Markdown fences.\n\nHTML:\n${content}`;
        const translation = await groq(env, [
          {role:"system",content:"You are a precise academic translator. Preserve HTML structure exactly and return only translated HTML."},
          {role:"user",content:prompt}
        ], 0.1, 7000);
        return json({translation});
      }
      const question = String(body.question || "").trim();
      const context = String(body.context || "").trim();
      const language = body.language === "ar" ? "ar" : "en";
      if (!question) return json({error:"Question is required."},400);
      if (question.length > 2500) return json({error:"Question is too long."},400);
      const languageRule = language === "ar"
        ? "Answer entirely in clear Modern Standard Arabic. The question may be written in English or Arabic."
        : "Answer entirely in clear academic English. The question may be written in English or Arabic.";
      const user = `${languageRule}\n\nCOURSE CONTEXT:\n${context || "No relevant course context was retrieved."}\n\nSTUDENT QUESTION:\n${question}`;
      const answer = await groq(env,[{role:"system",content:COURSE_RULES},{role:"user",content:user}],0.2,1400);
      return json({answer,language});
    } catch (e) {
      console.error(e);
      return json({error:"AI request failed.",details:e?.message || String(e)},500);
    }
  }
};

async function groq(env,messages,temperature,maxTokens){
  const model = env.GROQ_MODEL || "openai/gpt-oss-20b";
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions",{
    method:"POST",
    headers:{"Authorization":`Bearer ${env.GROQ_API_KEY}`,"Content-Type":"application/json"},
    body:JSON.stringify({model,messages,temperature,max_completion_tokens:maxTokens})
  });
  const data = await r.json();
  if(!r.ok) throw new Error(data?.error?.message || `Groq returned ${r.status}`);
  const text=data?.choices?.[0]?.message?.content;
  if(!text) throw new Error("No response returned from Groq.");
  return text;
}
