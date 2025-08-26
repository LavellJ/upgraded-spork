// Utility function to get the learner's name from localStorage
export function getLearnerName(): string {
  try {
    const childProfile = localStorage.getItem("childProfile");
    if (childProfile) {
      const profile = JSON.parse(childProfile);
      return profile.name || "friend"; // fallback to "friend" if name is missing
    }
  } catch (error) {
    console.warn("Failed to retrieve learner name from localStorage:", error);
  }
  return "friend"; // default fallback
}