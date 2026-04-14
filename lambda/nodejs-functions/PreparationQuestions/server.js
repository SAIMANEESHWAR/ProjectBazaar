import express from "express";
import cors from "cors";
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";

const app = express();
app.use(cors());

const client = new DynamoDBClient({ region: "ap-south-2" });

// ✅ Get all questions
app.get("/questions", async (req, res) => {
  const command = new QueryCommand({
    TableName: "perpQuestions",
    IndexName: "GSI4",
    KeyConditionExpression: "GSI4PK = :pk",
    ExpressionAttributeValues: {
      ":pk": { S: "ALL" }
    }
  });

  const data = await client.send(command);
  res.json(data.Items);
});

// ✅ Filter by company
// app.get("/questions/company/:company", async (req, res) => {
//   const company = req.params.company.toUpperCase();

//   const command = new QueryCommand({
//     TableName: "QuestionsTable",
//     IndexName: "GSI1",
//     KeyConditionExpression: "GSI1PK = :pk",
//     ExpressionAttributeValues: {
//       ":pk": { S: `COMPANY#${company}` }
//     }
//   });

//   const data = await client.send(command);
//   res.json(data.Items);
// });

app.listen(5000, () => console.log("Server running on port 5000"));