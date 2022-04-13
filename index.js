import express from "express";

const app = express();
let PORT = process.env.PORT || 8888;

app.get("/", (req, res) => {
    console.log("Got request", req.url);
    res.send("Hola");
});

app.get("/env", (req, res) => {
    res.send(process.env);
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});