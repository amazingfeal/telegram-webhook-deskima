const express = require("express");

const app = express();

app.use(express.json());

app.post("/", async (req, res) => {
  const update = req.body;

  try {
    await fetch("https://deskima.ir/api/telegram", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(update)
    });

    res.send("ok");
  } catch (e) {
    console.error(e);
    res.status(500).send("error");
  }
});

app.get("/", (req, res) => {
  res.send("Telegram webhook running");
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("Server started");
});
