export const usernamePattern = "[A-Za-z0-9_]{3,32}";
export const emailPattern = "[^\\s@]+@[^\\s@]+\\.[^\\s@]+";
export const passwordPattern = "(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^A-Za-z0-9\\s])[^\\r\\n]{12,128}";
export const passwordHelp = "Use 12–128 characters with an uppercase letter, a lowercase letter, a number, and a special character (such as !).";

export function validateCredentials(username, email, password) {
  if (!new RegExp(`^(?:${usernamePattern})$`).test(username)) {
    return "Use 3–32 letters, numbers, or underscores for your username.";
  }
  if (email.length > 254 || !new RegExp(`^(?:${emailPattern})$`).test(email)) {
    return "Enter a valid email address.";
  }
  if (password !== undefined && !new RegExp(`^(?:${passwordPattern})$`, "u").test(password)) {
    return passwordHelp;
  }
  return "";
}

