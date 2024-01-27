import AWS from "aws-sdk";
import express from "express";
import serverless from "serverless-http";

const app = express();
const USERS_TABLE = process.env.USERS_TABLE;
const dynamoDbClient = new AWS.DynamoDB.DocumentClient();

app.use(express.json());

// GET /users Lista de usuários no DynamoDB
app.get("/users/:userId", async (req, res) => {
  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId: req.params.userId,
    },
  };

  try {
    const { Item } = await dynamoDbClient.get(params).promise();
    if (Item) {
      const { userId, name, email } = Item;
      return res.json({ userId, name, email });
    } else {
      return res
        .status(404)
        .json({ error: 'Could not find user with provided "userId"' });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Could not retreive user" });
  }
});

// POST /users Cria um novo usuário
app.post("/users", async (req, res) => {
  const { userId, name, email } = req.body;

  const params = {
    TableName: USERS_TABLE,
    Item: {
      userId,
      name,
      email,
    },
  };

  try {
    await dynamoDbClient.put(params).promise();
    return res.json({ userId, name, email });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Could not create user" });
  }
});

// PUT /users/:userId Atualiza um usuário existente
app.put("/users/:userId", async (req, res) => {
  const { userId } = req.params;
  const { name, email } = req.body;

  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId,
    },
    UpdateExpression: "set name = :n, email = :e",
    ExpressionAttributeValues: {
      ":n": name,
      ":e": email,
    },
    ReturnValues: "UPDATED_NEW",
  };

  try {
    const { Attributes } = await dynamoDbClient.update(params).promise();
    return res.json(Attributes);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Could not update user" });
  }
});

// DELETE /users/:userId Remove um usuário
app.delete("/users/:userId", async (req, res) => {
  const { userId } = req.params;

  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId,
    },
  };

  try {
    await dynamoDbClient.delete(params).promise();
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Could not delete user" });
  }
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

export const handler = serverless(app);
