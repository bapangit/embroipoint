import mongoose, { Schema } from "mongoose";

const productSchema = new Schema(
  {
    title: String,
    description:String,
    price: String,
    prevPrice:String,
    category: String,
    image1: String,
    image2: String,
    image3: String,
    image4: String,
    image5: String,
    orderFrequency:{type:Number,default:0},
    fabric:String,
    pattern: String,
    occasion: String,
    fit: String,
    neckline: String,
    closure: String,
    packSize: String,
    dressesSubcategory: String,
    sleeveStyle: String,
    dressShape: String,
    careInstructions: String,
    published: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.models.product || mongoose.model("product", productSchema);
export default Product;
