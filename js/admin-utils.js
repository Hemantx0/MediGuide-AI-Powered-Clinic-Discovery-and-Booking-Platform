import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db } from "./firebase.js";

export const ADMIN_EMAILS = ["admin@vitalchat.com"];

export async function isAdminUser(user) {
  if (!user) return false;
  if (ADMIN_EMAILS.includes(user.email || "")) return true;

  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    return userDoc.exists() && userDoc.data()?.role === "admin";
  } catch (error) {
    console.error("Admin role check failed:", error);
    return false;
  }
}
