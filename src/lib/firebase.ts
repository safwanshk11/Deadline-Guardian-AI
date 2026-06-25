import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc 
} from "firebase/firestore";
import { Task, Habit, DailyActionPlan } from "../types";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore (use custom firestoreDatabaseId if configured, or default)
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || "(default)");

// Configure Google OAuth provider with Google Calendar events scopes
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("https://www.googleapis.com/auth/calendar.events");

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Auth listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // If logged in on reload, we might need a fresh login to retrieve the Calendar Access Token
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Google sign-in
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (isSigningIn) return null;
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to retrieve Google OAuth access token.");
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Google sign-in error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Logout
export const logoutUser = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// Cache accessor
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

// --------------------------------------------------------------------------------
// FIRESTORE SYNC LOGIC
// --------------------------------------------------------------------------------

export interface UserBackupData {
  tasks: Task[];
  habits: Habit[];
  dailyPlan: DailyActionPlan | null;
  updatedAt: string;
}

// Backup current state to Firestore
export const backupToFirestore = async (
  userId: string,
  tasks: Task[],
  habits: Habit[],
  dailyPlan: DailyActionPlan | null
): Promise<void> => {
  try {
    const userDocRef = doc(db, "deadline_guardian_users", userId);
    const backupData: UserBackupData = {
      tasks,
      habits,
      dailyPlan,
      updatedAt: new Date().toISOString()
    };
    await setDoc(userDocRef, backupData);
    console.log("State successfully backed up to Cloud Firestore.");
  } catch (err: any) {
    console.error("Firestore backup failed:", err);
    throw new Error(err.message || "Failed to sync data to the cloud.");
  }
};

// Load saved state from Firestore
export const loadFromFirestore = async (userId: string): Promise<UserBackupData | null> => {
  try {
    const userDocRef = doc(db, "deadline_guardian_users", userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserBackupData;
    }
    return null;
  } catch (err: any) {
    console.error("Firestore load failed:", err);
    throw new Error(err.message || "Failed to retrieve backup data from the cloud.");
  }
};

// --------------------------------------------------------------------------------
// GOOGLE CALENDAR API INTEGRATION
// --------------------------------------------------------------------------------

/**
 * Creates an event in the user's primary Google Calendar representing a Commitment.
 */
export const syncCommitmentToGoogleCalendar = async (
  accessToken: string,
  task: Task
): Promise<{ htmlLink: string }> => {
  try {
    // Standard event start/end times based on task deadline
    // Due dates in Google Calendar are best set as an all-day event or standard block
    const deadlineDate = new Date(task.deadline);
    const formattedDateString = deadlineDate.toISOString().split("T")[0]; // YYYY-MM-DD

    // Build the calendar event resource
    const subtaskBullets = task.subtasks && task.subtasks.length > 0
      ? "\n\nAI Checklist:\n" + task.subtasks.map(s => `- [${s.isCompleted ? "X" : " "}] ${s.title} (${s.estimatedMinutes} mins)`).join("\n")
      : "";

    const eventResource = {
      summary: `🛡️ Guardian Due Date: ${task.title}`,
      description: `Commitment managed by Deadline Guardian.\n\nDescription: ${task.description || "No description provided."}\nPriority: ${task.priority.toUpperCase()}\nEstimated Hours: ${task.estimatedHours} hrs${subtaskBullets}`,
      start: {
        date: formattedDateString, // All-day event
      },
      end: {
        date: formattedDateString, // All-day event end
      },
      colorId: task.priority === "critical" || task.priority === "guardian-priority" ? "11" : "5", // Red for high priority, banana for normal
    };

    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventResource),
      }
    );

    if (!response.ok) {
      const errDetails = await response.json();
      console.error("Google Calendar response error:", errDetails);
      throw new Error(errDetails.error?.message || "Google Calendar API rejected the event creation.");
    }

    const data = await response.json();
    return { htmlLink: data.htmlLink };
  } catch (err: any) {
    console.error("Google Calendar sync error:", err);
    throw err;
  }
};
