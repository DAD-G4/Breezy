/**
 * Auth input validators.
 * Returns an array of error strings (empty if valid).
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  if (!email || typeof email !== 'string') {
    return 'Email is required';
  }
  if (!EMAIL_REGEX.test(email)) {
    return 'Invalid email format';
  }
  return null;
}

export function validateUsername(username: string): string | null {
  if (!username || typeof username !== 'string') {
    return 'Username is required';
  }
  if (username.length < 3) {
    return 'Username must be at least 3 characters';
  }
  if (username.length > 30) {
    return 'Username must be at most 30 characters';
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password || typeof password !== 'string') {
    return 'Password is required';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  return null;
}

export interface RegisterInput {
  email?: string;
  username?: string;
  password?: string;
}

/**
 * Validate the full registration payload.
 * Returns an array of error messages (empty = valid).
 */
export function validateRegisterInput(input: RegisterInput): string[] {
  const errors: string[] = [];

  const emailErr = validateEmail(input.email as string);
  if (emailErr) errors.push(emailErr);

  const usernameErr = validateUsername(input.username as string);
  if (usernameErr) errors.push(usernameErr);

  const passwordErr = validatePassword(input.password as string);
  if (passwordErr) errors.push(passwordErr);

  return errors;
}
