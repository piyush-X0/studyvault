// src/auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,

            authorization: {
                params: {
                    prompt: "select_account",
                },
            },
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
    },
    pages: {
        signIn: "/signin",
    },
    callbacks: {
        async jwt({ token, account, profile }) {
            if (account?.provider !== "google") return token;
            if (!profile?.email) return token;
            if (token.userId) return token;

            const user = await prisma.user.upsert({
                where: {
                    email: profile.email,
                },
                update: {
                    name: profile.name ?? null,
                    image:
                        typeof profile.picture === "string"
                            ? profile.picture
                            : null,
                },
                create: {
                    email: profile.email,
                    name: profile.name ?? null,
                    image:
                        typeof profile.picture === "string"
                            ? profile.picture
                            : null,
                },
            });
            token.userId = user.id;
            return token;
        },
        async session({ session, token }) {
            if (session.user && typeof token.userId === "string") {
                session.user.id = token.userId;
            }

            return session;
        },
    },
});