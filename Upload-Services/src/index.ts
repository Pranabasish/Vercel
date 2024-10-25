import  express  from "express";
import cors from "cors";
import simpleGit from "simple-git";
import { generate } from "./utils";
import { getAllFiles } from "./file";
import path from "path";
import { uploadFile } from "./aws";
import { createClient } from "redis";
const publisher = createClient();
publisher.connect();

const app = express();
app.use(cors())
app.use(express.json());

// POSTMAN
app.post("/deploy", async(req, res) => {
    const repoUrl = req.body.repoUrl;
    const id = generate();
    await simpleGit().clone(repoUrl, path.join(__dirname, `output/${id}`));
    
    const files = getAllFiles(path.join(__dirname, `output/${id}`));
    
    // changed by me
    files.forEach(file => {
        const absoluteFilePath = path.resolve(file);

        // Calculate relative path from the base directory (e.g., __dirname)
        const relativePath = path.relative(__dirname, absoluteFilePath).replace(/\\/g, '/');
        uploadFile(relativePath, absoluteFilePath);
    }); //

    publisher.lPush("build-queue", id);
    
    res.json({
        id: id
    })
});

app.listen(3000);