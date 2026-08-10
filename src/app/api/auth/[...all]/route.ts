import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Catch-all route — Better Auth handles all auth endpoints
export const { GET, POST } = toNextJsHandler(auth);
