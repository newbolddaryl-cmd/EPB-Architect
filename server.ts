import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Google Gen AI client server-side
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set in environment. Gemini features may fail.');
  }
  return new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Strips markdown formatting if the model wrapped the JSON output in ```json fences
 */
function cleanJsonText(rawText: string): string {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

/**
 * Robust Gemini caller with exponential backoff for 503 high demand / 429 rate limit errors
 * and automated model fallback (gemini-3.7-flash -> gemini-3.1-flash-lite).
 */
async function generateContentWithRetry(
  ai: GoogleGenAI,
  options: {
    contents: any;
    config?: any;
    preferredModel?: string;
    maxRetries?: number;
  }
): Promise<string> {
  const primaryModel = options.preferredModel || 'gemini-3.7-flash';
  const fallbackModel = 'gemini-3.1-flash-lite';
  const modelsToTry = [primaryModel, fallbackModel];

  let lastError: any = null;

  for (const model of modelsToTry) {
    const attempts = model === primaryModel ? (options.maxRetries ?? 3) : 2;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        console.log(`[Gemini Engine] Querying model: ${model} (attempt ${attempt}/${attempts})`);
        const response = await ai.models.generateContent({
          model,
          contents: options.contents,
          config: options.config,
        });

        const text = response.text;
        if (text && text.trim().length > 0) {
          return text;
        }
      } catch (err: any) {
        lastError = err;
        const errMessage = err?.message || String(err);
        const is503OrUnavailable =
          err?.status === 503 ||
          err?.status === 'UNAVAILABLE' ||
          err?.code === 503 ||
          /503|UNAVAILABLE|high demand|overloaded|temporarily unavailable/i.test(errMessage);
        const isRateLimit =
          err?.status === 429 ||
          err?.code === 429 ||
          /RESOURCE_EXHAUSTED|rate limit|quota/i.test(errMessage);

        console.warn(`[Gemini Engine] Attempt ${attempt} failed on ${model}:`, errMessage);

        if (is503OrUnavailable || isRateLimit) {
          const waitTime = Math.min(1000 * Math.pow(1.8, attempt - 1) + Math.random() * 500, 5000);
          console.log(`[Gemini Engine] Retrying after ${Math.round(waitTime)}ms delay...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        } else {
          // If error is not a transient capacity issue, skip retrying this model
          break;
        }
      }
    }
  }

  throw lastError || new Error('All model attempts failed.');
}

const SYSTEM_INSTRUCTION_BASE = `
You are EPB Architect – General Edition v1.0. You are a senior Air Force writing engine and board adviser.
Your mission is to turn raw Air Force notes and accomplishments into board-ready, high-impact performance statements, duty descriptions, and AF 1206 award packages.

Follow these strict rules:

# EPB Architect – General Edition v1.0
## INIT & HARD GATE
- Confirm required items: Product Type (EPB / OPB / 1206), Rank/Grade, AFSC or duty area, and exact Character Limit.
- If ANY critical item is missing or empty, do NOT draft final performance statements. Instead, output only structured organization of notes, gap identification, and missing requirement prompts.
- Context Hygiene: If prior EPBs/EPRs/OPRs are provided, use them for progression analysis and section balancing. If none are provided, include the warning: "Progression assessment is degraded without prior records. Strongly recommend providing your last 2–3 evaluations for better calibration."

## VOICE & TONE
- Professional, concise, military staff tone. BLUF (Bottom Line Up Front), active voice, strong action verbs, tight writing.
- Be direct when input is weak, vague, or inflated.
- Duty Description: No direct reference to the member (no "MSgt Smith is", no "Capt Doe leads"). Define scope, authority, equipment/asset value, personnel overseen, and why the job matters to the mission.
- Performance statements: Vary references to the member naturally (Rank Last Name, Last Name, First Name, or pronoun) or omit the reference when cleaner.

## GUARD & OPSEC
- Never invent metrics, numbers, or outcomes. If a metric, dollar amount, percentage, time saved, or impact is missing from raw notes, insert clear placeholders like [INSERT METRIC] or [VALIDATE IMPACT].
- Never process or repeat classified data, PII, PHI, or personal financial data.

## SCOPE & EVALUATION LOGIC
- Default audience: Air Force promotion boards with low tolerance for fluff, weak causality, inflated claims, and generic language.
- Causal Integrity Test: Every causal claim must be supported by an explicit mechanism or a direct action-result link from the provided facts. If weak, use narrower language ("enabled," "supported," "contributed to") and flag it in Key Issues. Never use "led to," "drove," "resulted in" without clear evidence.
- Capability & Impact Test: Identify what genuinely changed. Use only supported quantification (People, Time, Money, Volume, Ranking/Rate, Scope). Default to "executed" language for one-off actions unless repeatability is clear.
- Progression Test: Compare against prior evaluations when available. Flag repeated achievements, stagnant scope, or recycled impacts.

## CRAFT & CHARACTER LIMITS
- Character limits are hard. For 350-character statements, target the sweet-spot of 320–340 characters (counting all spaces and punctuation). For custom limits, target 90%–97% of limit. Never exceed the limit.
- Anti-Inflation Purge: rewrite vague or inflated input. Remove generic transitions, empty superlatives, and template phrasing.
- Acronyms: Use approved Air Force acronyms. Avoid obscure jargon that could confuse a cross-functional board.

## WORKFLOW & STRUCTURE
Respond in this order / structure:
1. BLUF / Summary
2. Revised content or organized sections (Air Force Major Graded Areas: Executing the Mission, Leading People, Managing Resources, Improving the Unit for EPB/OPB; or Leadership/Job Performance, Whole Airman Concept for 1206)
3. Key Issues & Recommendations (Causation, Inflation, Metrics, Scope, Acronyms)
4. 4-Chief Murderboard Review (Functional Chief, Operations Chief, Personnel Chief, Cynical MAJCOM Chief + Score 1-10 + Path to 10/10)
5. Next Steps (Actionable choices)

Always append the Red-Team disclaimer: "Validate all metrics, causal claims, and external facts before submission."
`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  // Main Generation endpoint
  app.post('/api/generate', async (req, res) => {
    try {
      const formData = req.body;
      const {
        productType,
        rankGrade,
        afsc,
        charLimit = 350,
        workMode = 'full',
        name = '',
        dutyTitle = '',
        unit = '',
        ratingPeriod = '',
        priorEvaluations = '',
        rawNotes = ''
      } = formData || {};

      // Server-side sensitive data check
      const classifiedRegex = /\b(TOP\s+SECRET|SECRET|CONFIDENTIAL|CUI|CONTROLLED\s+UNCLASSIFIED|NOFORN|REL\s+TO|ORCON|FGI|SI\/TK|COMINT|HCS|FOUO|FOR\s+OFFICIAL\s+USE\s+ONLY)\b/i;
      const ssnRegex = /\b(?:\d{3}-\d{2}-\d{4}|\bSSN\s*[:#]?\s*\d{3}[- ]?\d{2}[- ]?\d{4})\b/i;
      const dodIdRegex = /\b(?:EDIPI|DOD\s*ID|DODID)\s*[:#]?\s*\d{10}\b/i;

      if (classifiedRegex.test(rawNotes) || ssnRegex.test(rawNotes) || dodIdRegex.test(rawNotes)) {
        return res.status(400).json({
          error: 'SENSITIVE_DATA_DETECTED',
          message: 'Input contains potential classified, CUI, SSN, or DoD ID data. For OPSEC compliance, sanitize notes first. Sensitive text was not processed.'
        });
      }

      // Hard Gate validation
      const missingRequired: string[] = [];
      if (!productType) missingRequired.push('Product Type');
      if (!rankGrade || !rankGrade.trim()) missingRequired.push('Rank / Grade');
      if (!afsc || !afsc.trim()) missingRequired.push('AFSC or Duty Area');
      if (!charLimit || isNaN(Number(charLimit)) || Number(charLimit) <= 0) missingRequired.push('Character Limit');

      const isHardGated = missingRequired.length > 0;
      const hasPrior = Boolean(priorEvaluations && priorEvaluations.trim().length > 10);

      const promptPayload = `
Analyze and process the following Air Force evaluation package according to EPB Architect – General Edition v1.0:

MEMBER CONTEXT:
- Product Type: ${productType || '[MISSING]'}
- Rank/Grade: ${rankGrade || '[MISSING]'}
- AFSC / Duty Area: ${afsc || '[MISSING]'}
- Character Limit: ${charLimit || 350} chars
- Work Mode: ${workMode}
- Name: ${name || 'N/A'}
- Duty Title: ${dutyTitle || 'N/A'}
- Unit: ${unit || 'N/A'}
- Rating Period: ${ratingPeriod || 'N/A'}

PRIOR EVALUATIONS (EPRs / EPBs / OPRs):
${priorEvaluations || '[NONE PROVIDED - Flag progression degradation]'}

RAW NOTES & ACCOMPLISHMENTS:
${rawNotes || '[NO RAW NOTES PROVIDED]'}

HARD GATE STATUS:
${isHardGated ? `CRITICAL FIELDS MISSING: ${missingRequired.join(', ')}. DO NOT write final performance statements. Only organize raw notes and outline gaps.` : 'All required fields provided. Proceed with board-ready statements.'}

OUTPUT REQUIREMENTS:
- Target statement character length: For ${charLimit} limit, target ${Math.round(Number(charLimit) * 0.92)} to ${Math.round(Number(charLimit) * 0.98)} characters.
- Ensure Duty Description contains NO direct references to the member (no "MSgt Smith is", no "Capt Doe leads").
- Insert placeholders [INSERT METRIC] or [VALIDATE IMPACT] where numbers/metrics are missing.
- Perform the Causal Integrity Test and Quality 4-Chief Murderboard.
- Provide practical Next Steps as interactive options.
`;

      const ai = getGeminiClient();

      const responseText = await generateContentWithRetry(ai, {
        preferredModel: 'gemini-3.7-flash',
        contents: promptPayload,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_BASE,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              blufSummary: { type: Type.STRING, description: 'Bottom line up front summary of the package and overall board caliber' },
              dutyDescription: { type: Type.STRING, description: 'Rewritten board-ready duty description with no direct references to member, defining scope and mission impact' },
              dutyDescriptionCharCount: { type: Type.INTEGER, description: 'Character count of duty description' },
              sections: {
                type: Type.ARRAY,
                description: 'Organized sections (e.g., Executing the Mission, Leading People, Managing Resources, Improving the Unit for EPB/OPB; or Leadership & Job Performance, Whole Airman Concept for 1206)',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: 'Section name' },
                    description: { type: Type.STRING, description: 'Section focus description' },
                    targetCount: { type: Type.INTEGER, description: 'Recommended number of statements' },
                    statements: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          section: { type: Type.STRING },
                          statement: { type: Type.STRING, description: 'The polished performance statement strictly within character limit' },
                          charCount: { type: Type.INTEGER, description: 'Exact character count including spaces' },
                          originalNote: { type: Type.STRING, description: 'Brief reference to original accomplishment note' },
                          placeholders: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: 'List of placeholders like [INSERT METRIC] or [VALIDATE IMPACT] present in this statement'
                          },
                          causalIntegrity: {
                            type: Type.STRING,
                            description: 'Causal integrity rating: Strong, Moderate, Weak, or Caution'
                          },
                          actionVerb: { type: Type.STRING, description: 'Primary action verb used' },
                          notes: { type: Type.STRING, description: 'Coaching note or why this wording was chosen' }
                        },
                        required: ['id', 'statement', 'charCount', 'placeholders', 'causalIntegrity']
                      }
                    }
                  },
                  required: ['name', 'statements']
                }
              },
              additionalComments: { type: Type.STRING, description: 'Optional additional comments or board advice' },
              keyIssues: {
                type: Type.ARRAY,
                description: 'Red-team issues flagged (weak causation, inflation, missing metrics, etc.)',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    category: { type: Type.STRING, description: 'Causation, Inflation, Metrics, Scope, Acronym, or Placement' },
                    severity: { type: Type.STRING, description: 'high, medium, or low' },
                    issue: { type: Type.STRING, description: 'The specific issue or vulnerability' },
                    recommendation: { type: Type.STRING, description: 'How to fix or strengthen' }
                  },
                  required: ['id', 'category', 'severity', 'issue', 'recommendation']
                }
              },
              murderboardRisks: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Quick murderboard risk points'
              },
              murderboardReview: {
                type: Type.OBJECT,
                description: '4-Chief Murderboard breakdown',
                properties: {
                  functionalChief: {
                    type: Type.OBJECT,
                    properties: {
                      chiefTitle: { type: Type.STRING },
                      focusArea: { type: Type.STRING },
                      analysis: { type: Type.STRING, description: 'Accurate and appropriate for grade & AFSC? Specific or generic?' },
                      strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                      weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                      gradeRating: { type: Type.STRING }
                    },
                    required: ['chiefTitle', 'analysis', 'strengths', 'weaknesses']
                  },
                  operationsChief: {
                    type: Type.OBJECT,
                    properties: {
                      chiefTitle: { type: Type.STRING },
                      focusArea: { type: Type.STRING },
                      analysis: { type: Type.STRING, description: 'Real effect on mission, readiness, resources, people, or risk? Causation defensible?' },
                      strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                      weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                      gradeRating: { type: Type.STRING }
                    },
                    required: ['chiefTitle', 'analysis', 'strengths', 'weaknesses']
                  },
                  personnelChief: {
                    type: Type.OBJECT,
                    properties: {
                      chiefTitle: { type: Type.STRING },
                      focusArea: { type: Type.STRING },
                      analysis: { type: Type.STRING, description: 'Does this read like the next higher grade? Evidence of increased scope, complexity, or leadership?' },
                      strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                      weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                      gradeRating: { type: Type.STRING }
                    },
                    required: ['chiefTitle', 'analysis', 'strengths', 'weaknesses']
                  },
                  cynicalMajcomChief: {
                    type: Type.OBJECT,
                    properties: {
                      chiefTitle: { type: Type.STRING },
                      focusArea: { type: Type.STRING },
                      analysis: { type: Type.STRING, description: 'If I wanted to kill this package, which claims would I attack?' },
                      strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                      weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                      gradeRating: { type: Type.STRING }
                    },
                    required: ['chiefTitle', 'analysis', 'strengths', 'weaknesses']
                  },
                  verdictScore: { type: Type.NUMBER, description: 'Score out of 10 (e.g. 7.5)' },
                  verdictSummary: { type: Type.STRING, description: 'Overall verdict summary' },
                  pathToTen: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Specific high-impact steps to elevate this package to a 10/10'
                  }
                },
                required: ['functionalChief', 'operationsChief', 'personnelChief', 'cynicalMajcomChief', 'verdictScore', 'verdictSummary', 'pathToTen']
              },
              nextSteps: {
                type: Type.ARRAY,
                description: 'Interactive next step choices for the user',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    label: { type: Type.STRING, description: 'Action title' },
                    description: { type: Type.STRING, description: 'What this step will accomplish' },
                    actionType: { type: Type.STRING, description: 'refine_statement, tighten_chars, inject_metrics, run_murderboard, fix_causality, or rebalance_sections' },
                    targetSection: { type: Type.STRING },
                    instructionPrompt: { type: Type.STRING }
                  },
                  required: ['id', 'label', 'actionType']
                }
              },
              isPartialOrganizationOnly: { type: Type.BOOLEAN, description: 'True if critical fields were missing and statements were not finalized' },
              missingRequiredFields: { type: Type.ARRAY, items: { type: Type.STRING } },
              hasPriorRecords: { type: Type.BOOLEAN },
              priorRecordsWarningMessage: { type: Type.STRING },
              redTeamDisclaimer: { type: Type.STRING, description: 'Mandatory disclaimer: Validate all metrics, causal claims, and external facts before submission.' }
            },
            required: ['blufSummary', 'sections', 'keyIssues', 'nextSteps', 'redTeamDisclaimer']
          }
        }
      });

      let parsedResult;
      try {
        parsedResult = JSON.parse(cleanJsonText(responseText));
      } catch (parseError) {
        console.error('Failed to parse Gemini JSON response:', parseError, responseText);
        return res.status(500).json({ error: 'PARSE_ERROR', raw: responseText });
      }

      // Ensure exact character count accuracy on statements
      if (parsedResult.sections && Array.isArray(parsedResult.sections)) {
        parsedResult.sections.forEach((sec: any) => {
          if (sec.statements && Array.isArray(sec.statements)) {
            sec.statements.forEach((st: any) => {
              if (st.statement) {
                st.charCount = st.statement.length;
              }
            });
          }
        });
      }

      if (parsedResult.dutyDescription) {
        parsedResult.dutyDescriptionCharCount = parsedResult.dutyDescription.length;
      }

      // Metadata attachments
      parsedResult.productType = productType;
      parsedResult.rankGrade = rankGrade;
      parsedResult.afsc = afsc;
      parsedResult.charLimit = Number(charLimit);
      parsedResult.generatedAt = Date.now();
      parsedResult.missingRequiredFields = missingRequired;
      parsedResult.isPartialOrganizationOnly = isHardGated;
      parsedResult.hasPriorRecords = hasPrior;
      if (!hasPrior) {
        parsedResult.priorRecordsWarningMessage = 'Progression assessment is degraded without prior records. Strongly recommend providing your last 2–3 evaluations for better calibration.';
      }
      parsedResult.redTeamDisclaimer = 'Validate all metrics, causal claims, and external facts before submission.';

      return res.json(parsedResult);
    } catch (err: any) {
      console.error('Error in /api/generate:', err);
      return res.status(500).json({
        error: 'GENERATION_FAILED',
        message: err?.message || 'Failed to generate performance statements. Please try again.'
      });
    }
  });

  // Refine single statement endpoint (tighten characters, inject metrics, strengthen impact, fix causality)
  app.post('/api/refine-statement', async (req, res) => {
    try {
      const {
        statement,
        charLimit = 350,
        targetAction = 'tighten', // 'tighten' | 'strengthen_impact' | 'fix_causality' | 'replace_placeholder' | 'active_voice'
        replacementMetric = '',
        userFeedback = '',
        rankGrade = '',
        afsc = ''
      } = req.body || {};

      if (!statement) {
        return res.status(400).json({ error: 'Statement is required' });
      }

      const prompt = `
You are EPB Architect – General Edition v1.0. Refine this single performance statement for an Air Force ${rankGrade || 'member'} (${afsc || 'general duty'}).

CURRENT STATEMENT:
"${statement}" (Current length: ${statement.length} chars)

TARGET LIMIT:
${charLimit} chars (Ideal sweet-spot range: ${Math.round(Number(charLimit) * 0.92)}–${Math.round(Number(charLimit) * 0.98)} chars).

REQUESTED REFINEMENT:
- Action: ${targetAction}
${replacementMetric ? `- Insert this verified metric/impact: "${replacementMetric}"` : ''}
${userFeedback ? `- Specific guidance: "${userFeedback}"` : ''}

RULES:
1. Active voice, strong action verbs, tight military board tone.
2. Character count MUST NOT exceed ${charLimit}.
3. Retain causal integrity; do not invent unsupported numbers. Use [INSERT METRIC] or [VALIDATE IMPACT] if more data is needed.
4. Output JSON with refined statement, char count, and brief coaching note.
`;

      const ai = getGeminiClient();
      const responseText = await generateContentWithRetry(ai, {
        preferredModel: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_BASE,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              refinedStatement: { type: Type.STRING },
              charCount: { type: Type.INTEGER },
              actionVerb: { type: Type.STRING },
              placeholders: { type: Type.ARRAY, items: { type: Type.STRING } },
              causalIntegrity: { type: Type.STRING },
              coachingNote: { type: Type.STRING }
            },
            required: ['refinedStatement', 'charCount', 'placeholders', 'causalIntegrity']
          }
        }
      });

      const parsed = JSON.parse(cleanJsonText(responseText));
      if (parsed.refinedStatement) {
        parsed.charCount = parsed.refinedStatement.length;
      }
      return res.json(parsed);
    } catch (err: any) {
      console.error('Error in /api/refine-statement:', err);
      return res.status(500).json({
        error: 'REFINE_FAILED',
        message: err?.message || 'Failed to refine statement.'
      });
    }
  });

  // Dedicated 4-Chief Murderboard review endpoint
  app.post('/api/murderboard', async (req, res) => {
    try {
      const {
        productType = 'EPB',
        rankGrade = 'SSgt',
        afsc = 'General',
        dutyDescription = '',
        statements = [],
        priorEvaluations = ''
      } = req.body || {};

      const prompt = `
Conduct a thorough 4-Chief Murderboard Review on this Air Force ${productType} package for ${rankGrade} (${afsc}).

DUTY DESCRIPTION:
${dutyDescription || 'N/A'}

PERFORMANCE STATEMENTS:
${JSON.stringify(statements, null, 2)}

PRIOR EVALUATIONS:
${priorEvaluations || '[No prior evaluations provided - note progression evaluation handicap]'}

Execute the 4-Chief Murderboard roles:
1. Functional Chief: accurate & appropriate for grade and AFSC? specific or generic/inflated?
2. Operations Chief: real effect on mission, readiness, resources, people, or risk? causation defensible?
3. Personnel Chief: does this read like the next higher grade? evidence of increased scope, complexity, or leadership?
4. Cynical MAJCOM Chief: if I wanted to kill this package, which claims would I attack?
5. Verdict: score 1-10 + Path to 10/10.
`;

      const ai = getGeminiClient();
      const responseText = await generateContentWithRetry(ai, {
        preferredModel: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_BASE,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              functionalChief: {
                type: Type.OBJECT,
                properties: {
                  chiefTitle: { type: Type.STRING },
                  focusArea: { type: Type.STRING },
                  analysis: { type: Type.STRING },
                  strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                  weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                  gradeRating: { type: Type.STRING }
                },
                required: ['chiefTitle', 'analysis', 'strengths', 'weaknesses']
              },
              operationsChief: {
                type: Type.OBJECT,
                properties: {
                  chiefTitle: { type: Type.STRING },
                  focusArea: { type: Type.STRING },
                  analysis: { type: Type.STRING },
                  strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                  weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                  gradeRating: { type: Type.STRING }
                },
                required: ['chiefTitle', 'analysis', 'strengths', 'weaknesses']
              },
              personnelChief: {
                type: Type.OBJECT,
                properties: {
                  chiefTitle: { type: Type.STRING },
                  focusArea: { type: Type.STRING },
                  analysis: { type: Type.STRING },
                  strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                  weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                  gradeRating: { type: Type.STRING }
                },
                required: ['chiefTitle', 'analysis', 'strengths', 'weaknesses']
              },
              cynicalMajcomChief: {
                type: Type.OBJECT,
                properties: {
                  chiefTitle: { type: Type.STRING },
                  focusArea: { type: Type.STRING },
                  analysis: { type: Type.STRING },
                  strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                  weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                  gradeRating: { type: Type.STRING }
                },
                required: ['chiefTitle', 'analysis', 'strengths', 'weaknesses']
              },
              verdictScore: { type: Type.NUMBER },
              verdictSummary: { type: Type.STRING },
              pathToTen: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['functionalChief', 'operationsChief', 'personnelChief', 'cynicalMajcomChief', 'verdictScore', 'verdictSummary', 'pathToTen']
          }
        }
      });

      const parsed = JSON.parse(cleanJsonText(responseText));
      return res.json(parsed);
    } catch (err: any) {
      console.error('Error in /api/murderboard:', err);
      return res.status(500).json({
        error: 'MURDERBOARD_FAILED',
        message: err?.message || 'Failed to conduct 4-Chief murderboard review.'
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EPB Architect server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
