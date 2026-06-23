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

    const prompt = `Goal: Analyze deadline delay risk for the following task.
Task Details:
- Title: "${task.title}"
- Description: "${task.description || "N/A"}"
- Category: "${task.category || "General"}"
- Deadline: "${task.deadline}"
- Estimated Hours: ${task.estimatedHours || 2}
- Subtasks Progress: ${completedCount} out of ${totalCount} complete.
- Task status: "${task.status}"
- Current Date/Time: "${currentLocalTime || new Date().toISOString()}"

Other concurrent active tasks in the user's workload to evaluate overall capacity:
${otherTasksText}

Please evaluate the risk of missing this deadline:
1. 'riskScore' (0 to 100): An integer percentage representing the risk of missing the deadline. High risk factors: deadline is extremely close (e.g., today/tomorrow), incomplete subtasks, dense concurrent workload, high estimated hours.
2. 'riskExplanation': A brief, concise explanation (1-2 sentences) of the risk coefficients (such as timeline compression, workload density, context complexity).
3. 'suggestedMitigation': One concrete, highly tactical mitigation tip the user can perform immediately to secure the deadline.`;

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
    const prompt = `Goal: Analyze the entire list of tasks and recommend optimal priorities to prevent deadline misses.
Current Date/Time: "${currentLocalTime || new Date().toISOString()}"

Active Tasks to analyze:
${JSON.stringify(tasks, null, 2)}

Please evaluate all tasks collectively and decide the most strategic priority level ('low', 'medium', 'high', 'critical', or 'guardian-priority') for each task.
Reserve the 'guardian-priority' for the SINGLE most critical, at-risk, immediately urgent task that requires the user's undivided attention.

Return a list of recommendations, specifying the taskId, recommendedPriority, and priorityReasoning for each task.`;

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
    const prompt = `Goal: Create a highly personalized, structured Daily Action Plan to navigate deadlines safely based on the user's schedule constraints and active workload.
Current Date/Time: "${currentLocalTime || new Date().toISOString()}"
User Constraints:
- Preferred wake-up time: "${wakeTime || "07:00"}"
- Preferred bedtime: "${sleepTime || "23:00"}"
- Targeted active focused work hours for today: ${availableHours || 6} hours

Active, pending, or in-progress tasks:
${JSON.stringify(tasks, null, 2)}

Design a clean, productive block schedule for today starting from wake-time to bedtime. Divide the user's available focused hours into structured blocks (incorporating study/work blocks, healthy focus breaks, and brief buffers).
Assign priority task titles or activities of tasks (use the correct task ID!) so they can execute on their pending deadlines today. Use 'break' or 'buffer' for rest blocks.

Provide:
1. 'summary': Overview of today's tactical game plan (2-3 sentences).
2. 'focusMessage': A highly motivating, reassurance-oriented sentence matching the user's deadline pressure.
3. 'scheduledItems': Chronological list of schedule blocks.
4. 'mitigationTips': Workload-specific safety tips for today to prevent exhaustion while locking in key progress.`;

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
