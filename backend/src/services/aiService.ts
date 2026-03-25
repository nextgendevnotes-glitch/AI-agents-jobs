import Groq from 'groq-sdk';
import { ENV } from '../config/env';

const groq = new Groq({ 
  apiKey: ENV.GROQ_API_KEY,
  maxRetries: 5,
  timeout: 60 * 1000, 
});
export const aiClient = groq;
const AI_MODEL = 'llama-3.3-70b-versatile';

export class AIService {
  static async parseResume(text: string) {
    if (!ENV.GROQ_API_KEY) throw new Error('Groq key missing');

    const prompt = `You are an expert ATS. Extract candidate info from the Resume text. 
CRITICAL RULE: If the Resume text is empty, unreadable, or missing data, return null for those fields. DO NOT hallucinate or return the schema example. Output ONLY pure valid JSON.
Analyze the location of the user's most recent or last company/job to determine their current 'country' and 'city'. If not found, make a smart guess based on the universities or phone numbers, or leave null.

Required JSON format:
{
  "skills": ["string", "string"],
  "experience_years": 1,
  "preferred_roles": ["string"],
  "locations": ["string"],
  "country": "string | null",
  "city": "string | null",
  "resume_name": "string | null",
  "resume_email": "string | null",
  "resume_phone": "string | null",
  "address": "string | null",
  "education": [{"degree": "string", "school": "string", "year": "string"}],
  "companies": [{"name": "string", "title": "string", "duration": "string"}]
}

Resume text:
${text}`;

    const response = await groq.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'system', content: prompt }],
      temperature: 0,
      response_format: { type: 'json_object' },
    });
    
    let extract = response.choices[0]?.message?.content || '{}';
    extract = extract.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(extract);
  }

  static async matchJob(profile: any, job: any) {
    if (!ENV.GROQ_API_KEY) throw new Error('Groq key missing');

    const prompt = `Critically evaluate the candidate's Resume against this Job Post.
Be EXTREMELY hyper-critical and calculating. Score out of 100.
Reduce points dynamically if specific years of experience or distinct software tools are missing. Scores should naturally vary across jobs.
Output ONLY pure valid JSON (no markdown).
Profile: ${JSON.stringify(profile)}
Job: ${JSON.stringify(job)}
Output JSON format: { "score": 85, "reasoning": "brief rigorous reason why" }`;

    const response = await groq.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0]?.message?.content || '{}');
  }

  static async generateApplication(profile: any, job: any) {
    if (!ENV.GROQ_API_KEY) throw new Error('Groq key missing');

    const candidateName = profile.resume_name || 'Candidate';
    const candidateEmail = profile.resume_email || '';
    const candidatePhone = profile.resume_phone || '';

    const prompt = `You are a professional career coach. Write a polished, human-sounding job application email for the candidate below.

RULES:
- Write like a real human professional, NOT like AI
- Split the body into EXACTLY 4 short paragraphs separated by \n\n:
  1. Opening: Express genuine enthusiasm for the specific role and company. Mention how you found the listing.
  2. Relevant Experience: Highlight 2-3 directly relevant skills/experiences matching the job description.
  3. Value Proposition: Explain what unique value you bring and why you are specifically drawn to THIS company.
  4. Closing: Politely invite them to review your resume and discuss further. Include contact details.
- Do NOT use bullet points or lists
- Do NOT say "I am writing to apply" - use a more engaging opener
- Keep the entire email under 350 words
- The email signature should be: "Warm regards,\n${candidateName}\n${candidateEmail}${candidatePhone ? `\n${candidatePhone}` : ''}"

Candidate Profile: ${JSON.stringify(profile)}
Job Details: ${JSON.stringify(job)}

Output ONLY pure valid JSON (no markdown, no backticks):
{ "subject": "Application for [Role] at [Company]", "body": "paragraph1\n\nparagraph2\n\nparagraph3\n\nparagraph4\n\nWarm regards,\n[name]\n[email]\n[phone]" }`;

    const response = await groq.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.75,
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0]?.message?.content || '{}');
  }

  /** Generic raw call — returns string content for flexible parsing */
  static async callRaw(prompt: string): Promise<string> {
    if (!ENV.GROQ_API_KEY) throw new Error('Groq key missing');
    const response = await groq.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });
    return response.choices[0]?.message?.content || '{}';
  }
}
