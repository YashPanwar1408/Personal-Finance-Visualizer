import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  amount: number;
  date: string;
  description: string;
  category: string;
}

const TransactionSchema = new Schema<ITransaction>({
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
});

export default mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);