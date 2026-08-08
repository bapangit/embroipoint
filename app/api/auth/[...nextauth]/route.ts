import NextAuth, { type AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/config/DBConnect";
import User from "@/config/models/user"

const GOOGLE_ID = process.env.GOOGLE_ID!
const GOOGLE_SECRET = process.env.GOOGLE_SECRET!

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: GOOGLE_ID,
      clientSecret: GOOGLE_SECRET,
    }),
  ],
  session:{
    strategy:"jwt"
  },
  callbacks:{
    async signIn({ profile }) {
      if(!profile?.email){
        throw new Error("email not found")
      }
      
      try {
        await dbConnect();
        
        // Check if user already exists
        const existingUser = await User.findOne({ email: profile.email });
        
        if (!existingUser) {
          // Create new user
          const newUser = new User({
            name: profile.name || profile.email,
            email: profile.email,
            image: profile.image,
          });
          
          await newUser.save();
          console.log("New user created:", newUser);
        } else {
          // Update existing user's name and image
          const updatedUser = await User.findOneAndUpdate(
            { email: profile.email },
            {
              name: profile.name || existingUser.name,
            },
            { new: true }
          );
          console.log("User updated:", updatedUser);
        }
      } catch (error) {
        console.error("Error during sign in:", error);
        throw new Error("Failed to process sign in");
      }
      
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
      }

      if (token.email) {
        await dbConnect();
        const dbUser = await User.findOne({ email: token.email });
        if (dbUser) {
          token.role = dbUser.role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token?.role) {
        session.user.role = token.role;
      }
      return session;
    }
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
