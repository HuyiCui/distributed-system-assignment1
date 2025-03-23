import { Handler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const ddbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

export const handler: Handler = async (event) => {
  try {
    const productName = event.pathParameters?.productName;
    const storeName = event.pathParameters?.storeName;

    if (!productName || !storeName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing productName or storeName" }),
      };
    }

    const body = JSON.parse(event.body || "{}");
    const { price, quantity } = body;

    if (price === undefined && quantity === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "No fields to update" }),
      };
    }

    let updateExpr = "SET ";
    const exprNames: Record<string, string> = {};
    const exprValues: Record<string, any> = {};

    if (price !== undefined) {
      updateExpr += "#p = :p, ";
      exprNames["#p"] = "price";
      exprValues[":p"] = price;
    }
    if (quantity !== undefined) {
      updateExpr += "#q = :q, ";
      exprNames["#q"] = "quantity";
      exprValues[":q"] = quantity;
    }

    updateExpr = updateExpr.slice(0, -2);

    await ddbDocClient.send(
      new UpdateCommand({
        TableName: process.env.TABLE_NAME!,
        Key: { productName, storeName },
        UpdateExpression: updateExpr,
        ExpressionAttributeNames: exprNames,
        ExpressionAttributeValues: exprValues,
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Product updated successfully" }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err }) };
  }
};
