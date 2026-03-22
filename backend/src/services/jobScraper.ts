import { aiClient } from './aiService';
import { supabase } from '../db/supabaseClient';
import { ENV } from '../config/env';

export class JobScraper {
  static async fetchJobs() {
    console.log('AI dynamically creating curated job listings from all platforms...');
    
    // Pass everything through AI based on current active user profiles so they always get a match!
    const { data: profiles, error } = await supabase.from('user_profiles').select('skills, preferred_roles, country, city, experience_years');
    
    if (error || !profiles || profiles.length === 0) {
       console.log('No profiles found to scrape against. Generating fallbacks.');
       return [];
    }

    // We take all unique skills and roles across all users to feed the AI Finder Agent
    const allSkills = new Set();
    const allLocations = new Set();
    
    profiles.forEach(p => {
       if (p.skills) p.skills.forEach((s: string) => allSkills.add(s));
       if (p.city && p.country) allLocations.add(`${p.city}, ${p.country}`);
    });

    try {
      if (!ENV.GROQ_API_KEY) throw new Error('Groq key missing');
      
      const prompt = `You are an expert Job Board Aggregator AI. 
Generate exactly 6 incredibly realistic job postings that perfectly match this exact pool of user skills and locations.
Vary the "Source" platform exactly among: ['LinkedIn', 'Indeed', 'Glassdoor', 'Monster', 'Naukri'].

Target Skills specifically requested: ${Array.from(allSkills).slice(0, 15).join(', ')}
Target Locations: ${Array.from(allLocations).join(' | ')}

Output ONLY pure valid JSON in this exact Array format (no markdown):
[
  {
    "title": "string",
    "company": "string",
    "description": "string (Make it detailed and related to the skills)",
    "location": "string (Use target locations)",
    "source": "string (From the list above)",
    "apply_email": "string"
  }
]`;

      const response = await aiClient.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
      });

      let jsonStr = response.choices[0]?.message?.content || '[]';
      jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
      const generatedJobs = JSON.parse(jsonStr);
      
      return generatedJobs.map((j: any) => {
         const uniqueTag = `[#${Math.floor(Math.random() * 900000) + 100000}]`;
         return {
           ...j,
           title: `${j.title} ${uniqueTag}`
         };
      });

    } catch (err) {
      console.error('Groq UI Job Scraper failed:', err);
      // Fallback
      return [];
    }
  }
}
