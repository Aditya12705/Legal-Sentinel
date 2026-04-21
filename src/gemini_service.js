/**
 * Legal Sentinel - AI Service Layer
 * Interfaces with the Mistral API (Gemini 3.1 Pro Proxy) for high-fidelity legal analysis.
 */

const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY || 'YOUR_LOCAL_KEY_HERE';
const API_URL = 'https://api.mistral.ai/v1/chat/completions';

/**
 * Sanitizes Markdown artifacts to keep output professional and clean.
 */
function cleanMarkdown(text) {
  return text
    .replace(/\*\*/g, '')   // Remove Bold
    .replace(/\* /g, '• ') // Convert bullet points to dots
    .replace(/#/g, '')      // Remove Headers
    .replace(/__/g, '')     // Remove Underscores
    .replace(/`/g, '')      // Remove Backticks
    .trim();
}

/**
 * Standard chat completion with Gemini 3.1 Pro (via Mistral)
 */
export async function invokeGemini31Pro(prompt) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s Timeout

  try {
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    
    const systemPrompt = `You are the Legal Sentinel Scout (Indian Law Expert).
    Current Date: ${today}.
    STRICT JURISDICTION: You only provide advice based on INDIAN LAW (Consumer Protection Act 2019, BNS, etc.). 
    DO NOT reference global or outside-India laws. Respond in user's language. Plaintext ONLY.`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'open-mistral-7b', // RESTORED FOR INSTANT SPEED
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1
      })
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`SENTINEL ERROR ${response.status}: ${err.message || 'Connection Interrupted'}`);
    }

    const data = await response.json();
    return cleanMarkdown(data.choices[0].message.content);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') throw new Error("SENTINEL TIMEOUT: The AI took too long to respond. Please try a shorter question.");
    console.error("Scout Fail:", error);
    throw error;
  }
}

/**
 * Performs a deep audit of a legal document.
 * Returns an Executive Summary, Red-Flag Heatmap, and Actionable Suggestions.
 */
export async function auditContractWithGemini31(documentText) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s for Deep Audits

  try {
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const safeText = documentText.substring(0, 25000);

    const systemPrompt = `You are the Legal Sentinel Audit Engine (3.1-PRO - INDIAN LAW CENTRIC).
    Current Date: ${today}.
    STRICT JURISDICTION: AUDIT ONLY BASED ON INDIAN STATUTES (Contract Act, BNS, Consumer Rights).
    DO NOT reference global laws.
    
    STRUCTURE YOUR RESPONSE EXACTLY LIKE THIS (USE CAPS FOR HEADERS):
    
    1. EXECUTIVE SUMMARY
    Provide a professional summary.
    
    2. RED-FLAG HEATMAP
    List individual risks and attach one of these tags: [HIGH], [MEDIUM], or [LOW].
    Example: Clause 4.2 - Data Privacy: [HIGH]
    
    3. ACTIONABLE SUGGESTIONS
    Provide 3-5 clear steps based on Indian legal procedures.
    
    4. LEGAL STANDING
    Cite ONLY Indian laws or acts.
    
    STRICT RULES:
    - NO MARKDOWN symbols (**, #, etc.).
    - Use EXACT tags [HIGH], [MEDIUM], [LOW] for the heatmap.`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'mistral-small-latest', // Pivoted to confirmed working tier
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: safeText }
        ],
        temperature: 0.1
      })
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`AUDIT ERROR ${response.status}: ${err.message || 'Logic Failure'}`);
    }

    const data = await response.json();
    console.log("SENTINEL AUDIT COMPLETE");
    return cleanMarkdown(data.choices[0].message.content);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') throw new Error("AUDIT TIMEOUT: Complex document. Auditing first 5000 words.");
    console.error("Audit Fail:", error);
    throw error;
  }
}

/**
 * Generates a legal draft (e.g. eviction notice, refund dispute).
 */
export async function generateLegalDraft(type, details) {
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  
  const systemPrompt = `You are a Senior Indian Legal Draftsman.
  Today's Date: ${today}.
  STRICT JURISDICTION: DRAFT ONLY BASED ON INDIAN LEGAL FORMATS.
  
  Generate a professional Indian legal ${type} based on the user's details.
  
  STRICT RULES:
  - NO MARKDOWN.
  - USE PROFESSIONALLY FORMATTED PLAINTEXT.
  - Include placeholders like [USER NAME] or [DATE: ${today}] where appropriate.
  - Tone: Formal, authoritative, and 100% Indian Law centric.`;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MISTRAL_API_KEY}`
    },
    body: JSON.stringify({
      model: 'mistral-large-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: details }
      ]
    })
  });

  const data = await response.json();
  return cleanMarkdown(data.choices[0].message.content);
}
