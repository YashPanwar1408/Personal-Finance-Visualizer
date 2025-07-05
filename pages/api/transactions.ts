import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "../../lib/mongodb";
import Transaction from "../../models/Transaction";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === "GET") {
    const transactions = await Transaction.find().sort({ date: -1 });
    return res.status(200).json(transactions);
  }

  if (req.method === "POST") {
    const { amount, date, description, category } = req.body;
    if (!amount || !date || !description || !category) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const transaction = await Transaction.create({ amount, date, description, category });
    return res.status(201).json(transaction);
  }

  if (req.method === "DELETE") {
    const { id } = req.body;
    await Transaction.findByIdAndDelete(id);
    return res.status(204).end();
  }

  if (req.method === "PUT") {
    const { id, amount, date, description, category } = req.body;
    if (!amount || !date || !description || !category) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const transaction = await Transaction.findByIdAndUpdate(
      id,
      { amount, date, description, category },
      { new: true }
    );
    return res.status(200).json(transaction);
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE", "PUT"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}