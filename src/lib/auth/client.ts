"use client";

import { createAuthClient } from "better-auth/react";

// Client-side auth — hooks for login, signup, session
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL!,
});

export const { signIn, signUp, signOut, useSession } = authClient;
