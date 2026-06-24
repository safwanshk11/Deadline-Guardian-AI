import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing json requests
app.use(express.json());

// Lazy-initialization of Gemini SDK to prevent crash if key is missing on startup
let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("GEMINI_API_KEY is not configured or still has the placeholder. Please configure your API key in the Settings > Secrets menu.");
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// Helper to perform resilient Gemini requests with automatic retry and model fallback
async function callGeminiWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
    model?: string;
  }
) {
  const models = [params.model || "gemini-3.5-flash", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const modelName of models) {
    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Calling Gemini API [Model: ${modelName}, Attempt: ${attempt}/${maxAttempts}]...`);
        const response = await ai.models.generateContent({
          ...params,
          model: modelName,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini warning [Model: ${modelName}, Attempt: ${attempt}]:`, err.message || err);
        if (attempt < maxAttempts) {
          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
        }
      }
    }
  }
  throw lastError || new Error("Gemini API service is currently experiencing high demand. Please try again in a few moments.");
}

// --------------------------------------------------------------------------------
// API ENDPOINTS
// --------------------------------------------------------------------------------

// Health check and config check endpoint
app.get("/api/config-status", (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const isConfigured = !!apiKey && apiKey !== "MY_GEMINI_API_KEY";
  res.json({ isConfigured });
});

// Endpoint 1: Generate subtasks for a task
app.post("/api/generate-subtasks", async (req, res) => {
  try {
    const { title, description, category, estimatedHours } = req.body;
    if (!title) {
       res.status(400).json({ error: "Task title is required." });
       return;
    }

    const ai = getGeminiClient();
    const prompt = `Goal: Generate high-quality subtasks for the following task:
Task Title: "${title}"
Description: ${description || "No description provided."}
Category: ${category || "General"}
Target Hours: ${estimatedHours || 2}

Please break this task down into logical, atomic, step-by-step subtasks. Each subtask must have a clear actionable title and an estimated completion time in minutes. Keep the number of subtasks between 3 and 7. The sum of estimated minutes should roughly correspond to the goal hours (e.g., if goal hours is 3, total minutes should be around 180).`;

    const response = await callGeminiWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "List of actionable subtasks",
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Actionable name / title for the subtask" },
              estimatedMinutes: { type: Type.INTEGER, description: "Estimated completion time in minutes" }
            },
            required: ["title", "estimatedMinutes"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response received from Gemini.");
    }
    const subtasks = JSON.parse(text);
    res.json({ subtasks });
  } catch (error: any) {
    console.error("Error in /api/generate-subtasks:", error);
    res.status(500).json({
      error: error.message || "Failed to generate subtasks due to a server error."
    });
  }
});

// Endpoint 2: Estimate deadline delay risk
app.post("/api/estimate-risk", async (req, res) => {
  try {
    const { task, currentLocalTime, otherTasks } = req.body;
    if (!task || !task.title || !task.deadline) {
       res.status(400).json({ error: "Task object with 'title' and 'deadline' is required." });
       return;
    }

    const completedCount = task.subtasks ? task.subtasks.filter((s: any) => s.isCompleted).length : 0;
    const totalCount = task.subtasks ? task.subtasks.length : 0;
    
    let otherTasksText = "None";
    if (otherTasks && otherTasks.length > 0) {
      otherTasksText = otherTasks
        .map((t: any) => `- "${t.title}" (Deadline: ${t.deadline}, Priority: ${t.priority}, Status: ${t.status})`)
        .join("\n");
    }

    const prompt = `Goal: Analyze deadline delay risk for the following task from a strategic portfolio-level perspective.
You must evaluate all active commitments together as a cohesive portfolio rather than analyzing each in isolation.

Task of Interest Details:
- Title: "${task.title}"
- Description: "${task.description || "N/A"}"
- Category: "${task.category || "General"}"
- Deadline: "${task.deadline}"
- Estimated Hours: ${task.estimatedHours || 2}
- Subtasks Progress: ${completedCount} out of ${totalCount} complete.
- Task status: "${task.status}"
- Current Date/Time: "${currentLocalTime || new Date().toISOString()}"

Other concurrent active commitments in the user's workload portfolio:
${otherTasksText}

Perform an advanced PORTFOLIO-LEVEL reasoning evaluation:
1. Consider interactions, shared capacity, and dependencies between this task and the rest of the portfolio.
2. Detect workload collisions (overlapping effort peaks) and competing deadlines (multiple heavy deliverables due within the same compressed window).
3. Identify which specific commitment contributes the most overall risk to the user's success today.
4. Generate recommendations that optimize overall portfolio success probability, rather than just solving for this task in isolation.

Provide the following outputs:
1. 'riskScore' (0 to 100): An integer representing the risk of missing this specific deadline.
2. 'riskExplanation': A brief portfolio-level risk analysis (1-2 sentences). Instead of saying "[Task] Risk = X%", explain exactly how it relates to the entire commitment portfolio. For example: Identify if it or another task contributes the largest share of overall deadline risk, call out any competing deadlines or workload collisions, and explain the dynamic. (e.g., "The DBMS Exam contributes the largest share of overall deadline risk because it is due tomorrow and has no remaining recovery buffer, which collides heavily with the preparation required for this task.")
3. 'suggestedMitigation': One highly tactical, portfolio-optimizing recommendation that secures this deadline while managing overall success probability for the entire list of commitments.`;

    const ai = getGeminiClient();
    const response = await callGeminiWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskScore: { type: Type.INTEGER, description: "Risk probability between 0 and 100" },
            riskExplanation: { type: Type.STRING, description: "Explanation of risk factors" },
            suggestedMitigation: { type: Type.STRING, description: "Concrete recommendation to stay on track" }
          },
          required: ["riskScore", "riskExplanation", "suggestedMitigation"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response received from Gemini.");
    }
    const result = JSON.parse(text);
    res.json(result);
  } catch (error: any) {
    console.error("Error in /api/estimate-risk:", error);
    res.status(500).json({
      error: error.message || "Failed to estimate deadline risk due to a server error."
    });
  }
});

// Endpoint 3: Collective Work Prioritization
app.post("/api/prioritize-tasks", async (req, res) => {
  try {
    const { tasks, currentLocalTime } = req.body;
    if (!tasks || !Array.isArray(tasks)) {
       res.status(400).json({ error: "An array of 'tasks' is required." });
       return;
    }

    if (tasks.length === 0) {
       res.json({ recommendations: [] });
       return;
    }

    const ai = getGeminiClient();
    const prompt = `Goal: Upgrade your evaluation to portfolio-level reasoning. Analyze the entire list of active commitments collectively rather than in isolation to recommend optimal priorities that prevent deadline collisions.
Current Date/Time: "${currentLocalTime || new Date().toISOString()}"

Active commitments portfolio to analyze:
${JSON.stringify(tasks, null, 2)}

Please evaluate all active commitments together from the perspective of a strategic portfolio planner:
1. Consider interactions and potential conflicts between different commitments.
2. Detect workload collisions (overlapping effort peaks) and competing deadlines (deliverables due in close proximity).
3. Identify which specific commitment contributes the most overall risk to the user's timeline.
4. Decide the most strategic recommended priority level ('low', 'medium', 'high', 'critical', or 'guardian-priority') for each task to maximize overall portfolio success probability.
5. Reserve 'guardian-priority' for the SINGLE most critical, high-risk commitment that represents the absolute largest share of overall risk and demands immediate, undivided focus.

In 'priorityReasoning' for each task, write a brief (1-2 sentences) portfolio-level explanation. Explicitly specify workload collisions or competing deadlines, and highlight which task represents the largest share of overall risk in the portfolio (e.g., "The DBMS Exam contributes the largest share of overall deadline risk because it is due tomorrow with zero recovery buffer, causing a severe workload collision with your API Integration Bridge").`;

    const response = await callGeminiWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "List of recommended priority adjustments",
          items: {
            type: Type.OBJECT,
            properties: {
              taskId: { type: Type.STRING, description: "The exact ID of the task" },
              recommendedPriority: { 
                type: Type.STRING, 
                description: "Recommended density: 'low', 'medium', 'high', 'critical', or 'guardian-priority'"
              },
              priorityReasoning: { type: Type.STRING, description: "Clear and concise explanation of why this priority is recommended" }
            },
            required: ["taskId", "recommendedPriority", "priorityReasoning"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response received from Gemini.");
    }
    const recommendations = JSON.parse(text);
    res.json({ recommendations });
  } catch (error: any) {
    console.error("Error in /api/prioritize-tasks:", error);
    res.status(500).json({
      error: error.message || "Failed to prioritize tasks due to a server error."
    });
  }
});

// Endpoint 4: Create Daily Action Plan
app.post("/api/generate-action-plan", async (req, res) => {
  try {
    const { tasks, currentLocalTime, wakeTime, sleepTime, availableHours } = req.body;

    if (!tasks || !Array.isArray(tasks)) {
      res.status(400).json({ error: "An array of active 'tasks' is required." });
      return;
    }

    const ai = getGeminiClient();
    const prompt = `Goal: Create a structured Daily Action Plan employing portfolio-level strategic planning. You must evaluate all active commitments together as a cohesive portfolio rather than analyzing each in isolation.
Current Date/Time: "${currentLocalTime || new Date().toISOString()}"
User Constraints:
- Preferred wake-up time: "${wakeTime || "07:00"}"
- Preferred bedtime: "${sleepTime || "23:00"}"
- Targeted active focused work hours for today: ${availableHours || 6} hours

Active, pending, or in-progress commitments:
${JSON.stringify(tasks, null, 2)}

As a strategic planner managing the entire portfolio of commitments:
1. Consider interactions between commitments, detecting workload collisions and competing deadlines.
2. Identify the single commitment contributing the most overall risk to the user's timeline.
3. Design a daily block schedule that resolves workload collisions and optimizes overall success probability for the entire portfolio.
4. Allocate time slots to address high-risk commitments first, ensuring adequate buffers to mitigate competing deadline risks.

Provide:
1. 'summary': A portfolio-level overview of today's tactical game plan, explaining how it mitigates workload collisions and competing deadlines to optimize success (2-3 sentences).
2. 'focusMessage': A highly motivating, strategic sentence pointing out the highest-priority risk and how today's schedule overcomes it.
3. 'scheduledItems': Chronological list of schedule blocks starting from wake-time to bedtime.
4. 'mitigationTips': Tactical portfolio-safety tips for today to keep all active commitments on track while preventing burnout.`;

    const response = await callGeminiWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "Overview of today's tactical plan" },
            focusMessage: { type: Type.STRING, description: "Encouraging, urgent, or reassuring advice line matching deadline pressure" },
            scheduledItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timeSlot: { type: Type.STRING, description: "Visual time block, e.g. '09:00 - 10:30'" },
                  taskId: { type: Type.STRING, description: "The ID of the task associated to, or 'break'/'buffer' for non-task items" },
                  taskTitle: { type: Type.STRING, description: "Title of the task, e.g. 'Work on Reports' or 'Rest Break'" },
                  activity: { type: Type.STRING, description: "Exactly what action or subtask to focus on during this block" }
                },
                required: ["timeSlot", "taskId", "taskTitle", "activity"]
              }
            },
            mitigationTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Dynamic safety tips for today to stay resilient"
            }
          },
          required: ["summary", "focusMessage", "scheduledItems", "mitigationTips"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response received from Gemini.");
    }
    const plan = JSON.parse(text);
    res.json(plan);
  } catch (error: any) {
    console.error("Error in /api/generate-action-plan:", error);
    res.status(500).json({
      error: error.message || "Failed to generate dynamic action plan due to a server error."
    });
  }
});

// Endpoint 5: Dynamic AI Motivation & Guidance
app.post("/api/generate-motivation", async (req, res) => {
  try {
    const { tasks, productivityScore, highRiskCount, isDarkMode } = req.body;

    if (!tasks || !Array.isArray(tasks)) {
      res.status(400).json({ error: "An array of active 'tasks' is required." });
      return;
    }

    const ai = getGeminiClient();
    const prompt = `Goal: You are an elite strategic portfolio planner and productivity coach inside "Deadline Guardian AI". Your role is to evaluate all active commitments together rather than analyzing each in isolation, detecting interactions and competing deadlines.
- Enlisted Commitments Portfolio: ${JSON.stringify(tasks, null, 2)}
- High Risk / Critical Commitments count: ${highRiskCount || 0}
- Productivity / Velocity score: ${productivityScore || 0}%
- Dark Mode / High Pressure state: ${!!isDarkMode}

Strategic Reasoning Rules:
1. Evaluate interactions between commitments, detecting workload collisions and competing deadlines.
2. Identify the single commitment in the portfolio contributing the most overall risk to success.
3. Formulate guidance that optimizes overall portfolio success probability, balancing high-impact execution with stress recovery.

THEME TONE STYLE (CRITICAL REQUIREMENT):
- Since isDarkMode is ${!!isDarkMode}:
  - If TRUE (Dark Mode), provide a hard-hitting, extremely direct, high-pressure, tough-love, ultimate-accountability "no-nonsense" quote. Be blunt, call out procrastination, challenge them to push limits.
  - If FALSE (Light Mode), provide an encouraging, light-hearted, positive, supportive, warm, and comforting quote.

Provide:
1. 'quote': A single, memorable, powerful focus quote reflecting their current portfolio-level stress or momentum.
2. 'primaryObjective': Today's single, absolute highest-leverage, core human-centric objective based on optimizing overall portfolio success (e.g. "Secure the DBMS exam foundations to resolve the largest timeline threat, unlocking capacity for your other projects").
3. 'biggestRisk': The biggest portfolio-level operational risk currently threatening success today (e.g., "Workload collision between Q4 Audit and the API Bridge, leading to fragmented attention and missed targets").
4. 'recommendedAction': One tactical, portfolio-level immediate action they can perform in 15-30 minutes to mitigate the largest share of risk and gain immediate traction (e.g., "Complete the first two subtasks of your highest-risk commitment to establish safety buffers").`;

    const response = await callGeminiWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quote: { type: Type.STRING, description: "Highly curated context-driven motivational or focus quote" },
            primaryObjective: { type: Type.STRING, description: "Single most critical focal objective for today" },
            biggestRisk: { type: Type.STRING, description: "Main behavioral or operational hazard today" },
            recommendedAction: { type: Type.STRING, description: "High-impact micro-step to execute immediately" }
          },
          required: ["quote", "primaryObjective", "biggestRisk", "recommendedAction"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response received from Gemini.");
    }
    const motivation = JSON.parse(text);
    res.json(motivation);
  } catch (error: any) {
    console.error("Error in /api/generate-motivation:", error);
    res.status(500).json({
      error: error.message || "Failed to generate AI motivation due to a server error."
    });
  }
});

// --------------------------------------------------------------------------------
// EXPRESS SERVER & VITE INTEGRATION
// --------------------------------------------------------------------------------

async function initialize() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

initialize().catch((err) => {
  console.error("Failed to start server:", err);
});
