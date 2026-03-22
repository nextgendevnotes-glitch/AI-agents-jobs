import dns from 'dns/promises';
import { AIService } from './aiService';
import { supabase } from '../db/supabaseClient';

export interface FraudCheckResult {
  isFraud: boolean;
  fraudScore: number;       // 0–100 (100 = definitely fraud)
  reasons: string[];
  emailDomainValid: boolean;
  aiVerdict: string;
}

export class FraudDetectionService {

  /**
   * Full multi-layer fraud check: DNS validation + AI analysis
   */
  static async checkJob(jobData: any): Promise<FraudCheckResult> {
    const reasons: string[] = [];
    let fraudScore = 0;

    // ─── Layer 1: DNS / Email Domain Validation ───────────────────────
    const emailDomainValid = await this.validateEmailDomain(jobData.apply_email);
    if (!emailDomainValid) {
      reasons.push(`Email domain "${this.extractDomain(jobData.apply_email)}" has no valid MX records — domain may not exist or is a throwaway`);
      fraudScore += 60; // Strong signal
    }

    // ─── Layer 2: Basic Heuristic Flags ──────────────────────────────
    const title = (jobData.title || '').toLowerCase();
    const desc  = (jobData.description || '').toLowerCase();
    const comp  = (jobData.company || '').toLowerCase();

    if (desc.includes('no experience required') && desc.includes('high salary')) {
      reasons.push('Job description promises high salary with no experience required');
      fraudScore += 20;
    }
    if (title.includes('easy money') || title.includes('work from home – earn') || title.includes('data entry – earn')) {
      reasons.push('Job title uses classic scam language');
      fraudScore += 30;
    }
    if (!jobData.company || jobData.company.trim().length < 3) {
      reasons.push('No company name provided');
      fraudScore += 15;
    }
    if (!jobData.apply_email || !jobData.apply_email.includes('@')) {
      reasons.push('Missing or invalid application email');
      fraudScore += 40;
    }

    const freeEmailDomains = ['gmail.com','yahoo.com','hotmail.com','outlook.com','ymail.com','rediffmail.com'];
    const domain = this.extractDomain(jobData.apply_email || '');
    if (freeEmailDomains.includes(domain)) {
      reasons.push(`Application email uses a free consumer email service (@${domain}) — legitimate companies use corporate email`);
      fraudScore += 25;
    }

    // ─── Layer 3: AI Deep Analysis ───────────────────────────────────
    const aiResult = await this.aiAnalyzeJob(jobData);
    fraudScore = Math.min(100, fraudScore + aiResult.additionalScore);
    if (aiResult.reasons.length > 0) reasons.push(...aiResult.reasons);

    const isFraud = fraudScore >= 55;

    // ─── Persist fraud_score to jobs table ───────────────────────────
    if (jobData.id) {
      await supabase
        .from('jobs')
        .update({
          fraud_score: fraudScore,
          is_flagged: isFraud,
        })
        .eq('id', jobData.id);
    }

    console.log(`[FraudDetection] Job "${jobData.title}" at "${jobData.company}" — Score: ${fraudScore} | Fraud: ${isFraud}`);

    return {
      isFraud,
      fraudScore,
      reasons,
      emailDomainValid,
      aiVerdict: aiResult.verdict,
    };
  }

  /**
   * Checks if the email's domain has valid MX records (i.e. can actually receive email)
   */
  static async validateEmailDomain(email?: string): Promise<boolean> {
    if (!email || !email.includes('@')) return false;
    const domain = this.extractDomain(email);
    try {
      const mxRecords = await dns.resolveMx(domain);
      return mxRecords.length > 0;
    } catch {
      // ENODATA / ENOTFOUND = domain doesn't exist
      return false;
    }
  }

  static extractDomain(email: string): string {
    return (email || '').split('@')[1]?.toLowerCase() || '';
  }

  /**
   * Uses Llama-3 to deeply analyze the job for fraud signals
   */
  private static async aiAnalyzeJob(jobData: any): Promise<{ additionalScore: number; reasons: string[]; verdict: string }> {
    try {
      const prompt = `You are an expert job fraud detector. Analyze this job posting and determine if it is fake/fraudulent.

Job Details:
- Title: ${jobData.title}
- Company: ${jobData.company}
- Location: ${jobData.location}
- Source Platform: ${jobData.source}
- Apply Email: ${jobData.apply_email}
- Description (first 500 chars): ${(jobData.description || '').substring(0, 500)}

Look for these fraud signals:
1. Vague or unrealistic job descriptions
2. Promises of unusually high pay for simple tasks
3. Company name sounds fake or generic (e.g. "XYZ Enterprises", "ABC Corporation")
4. Mismatched location vs company name
5. Generic job titles designed to cast a wide net
6. Missing specific responsibilities or requirements

Output ONLY valid JSON:
{
  "fraud_likelihood_score": <number 0-40, how much additional fraud score to add>,
  "verdict": "<Legitimate|Suspicious|Likely Fraud>",
  "reasons": ["<reason1>", "<reason2>"]
}`;

      const result = await AIService.callRaw(prompt);
      const parsed = JSON.parse(result || '{}');
      return {
        additionalScore: Math.min(40, parsed.fraud_likelihood_score || 0),
        reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
        verdict: parsed.verdict || 'Unknown',
      };
    } catch (err) {
      console.warn('AI fraud analysis failed:', err);
      return { additionalScore: 0, reasons: [], verdict: 'Analysis unavailable' };
    }
  }
}
