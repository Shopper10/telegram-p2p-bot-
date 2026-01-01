const { connectDB } = require("./db");

async function createOrder(data) {
  const db = await connectDB();
  const orders = db.collection("orders");

  const result = await orders.insertOne({
    ...data,
    status: "OPEN",
    createdAt: new Date()
  });

  return result.insertedId;
}

module.exports = { createOrder };
