import NextAuth from "next-auth"
import EmailProvider from "next-auth/providers/email"

const handler = NextAuth({
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST ?? "smtp.sendgrid.net",
        port: 587,
        auth: { user: "apikey", pass: process.env.SENDGRID_API_KEY },
      },
      from: process.env.SENDGRID_FROM ?? "noreply@richardortizcoaching.com",
    }),
  ],
  pages: { signIn: "/auth/signin" },
  callbacks: {
    async session({ session }) { return session },
  },
})

export { handler as GET, handler as POST }