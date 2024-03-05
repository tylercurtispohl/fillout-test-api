import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { getFilteredResponseBody } from "./lib";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/:formId/filteredResponses", async (req: Request, res: Response) => {
  try {
    const responseBody = await getFilteredResponseBody(req);
    res.json(responseBody);
  } catch (err: any) {
    console.log(err);
    res.status(500).json({ message: err.message || "An error occurred" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
