import dbConnect from "@/config/DBConnect";
import User from "@/config/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { email, role } = await request.json();

    if (!email || !role) {
      return Response.json({ error: "Email and role are required" }, { status: 400 });
    }

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { role },
      { new: true }
    );

    if (!updatedUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({
      success: true,
      message: `User role updated to ${role}`,
      user: {
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}