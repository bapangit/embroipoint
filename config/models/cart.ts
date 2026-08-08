import mongoose, { Schema } from "mongoose";

const cartSchema = new Schema(
  {
    userId: String,
    productId:String,
    size:String
  },
  {
    timestamps: true,
  }
);

const Cart =
  mongoose.models.cart || mongoose.model("cart", cartSchema);
export default Cart;
