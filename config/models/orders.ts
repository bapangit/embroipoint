import mongoose, { Schema } from "mongoose";

const orderSchema = new Schema(
  {
    user:String,
    productId:String,
    addressId:String,
    address: {
      name: String,
      ph: String,
      pin: String,
      at: String,
      po: String,
      dist: String,
      state: String,
    },
    size:String,
    amount:String,
    paymentMethod:String,
    paymentStatus:String,
    razorpayOrderId:String,
    razorpayPaymentId:String,
    status:{type:String,default:"placed"} // placed, confirmed, shipped, delivered, cancelled
  },
  {
    timestamps: true,
  }
);

const Order =
  mongoose.models.order || mongoose.model("order", orderSchema);
export default Order;
