import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";

const credentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (rawCredentials) => {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const expectedUsername = process.env.APP_LOGIN_USERNAME;
        const expectedPasswordHash = process.env.APP_LOGIN_PASSWORD_HASH;
        if (!expectedUsername || !expectedPasswordHash) return null;

        if (parsed.data.username !== expectedUsername) return null;

        const ok = await bcrypt.compare(
          parsed.data.password,
          expectedPasswordHash,
        );
        if (!ok) return null;

        return { id: "admin", name: "admin" };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
};

