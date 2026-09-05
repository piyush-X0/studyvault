import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    session: {
        strategy: "jwt",                //stateless cookies , no session table 
        maxAge: 60 * 60 * 24 * 7,           // 7days
        updateAge: 60 * 60 * 24            //re-issue cookie once a day(rotation)
    },
    pages: { signIn: "/signin" },
    callbacks: {
        async jwt({ token, account, profile }) {
            if (account && profile?.email) {
                const user = await prisma.user.upsert({
                    where: { email: profile.email },
                    update: { name: profile.name, image: profile.picture as string },
                    create: {
                        email: profile.email,
                        name: profile.name,
                        image: profile.picture as string
                    },
                });
                token.userId = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token.userId) session.user.id = token.userId as string;
            return session;
        }
    }
});