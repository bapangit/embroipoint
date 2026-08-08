import mongoose, { Schema } from "mongoose";

const addressSchema = new Schema(
  {
    userId: String,
    name: String,
    ph: String,
    pin: String,
    at: String,
    po: String,
    dist: String,
    state: String,
  },
  {
    timestamps: true,
  }
);

const Address =
  mongoose.models.address || mongoose.model("address", addressSchema);
export default Address;
