import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    name: String,
    email: {
      type: String,
      unique: true,
    },
    addressIds: {
      type: [String],
      default: [],
      validate: {
        validator: (addressIds: string[]) => addressIds.length <= 5,
        message: "A user can save a maximum of 5 addresses.",
      },
    },
    selectedAddress: String,
    orderIds: {
      type: [String],
      default: [],
    },
    role: { type: String, default: "user" }, // Roles - "user", "admin"
  },
);

const User = mongoose.models.user || mongoose.model("user", userSchema);
export default User;
