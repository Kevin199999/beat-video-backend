// server.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());

const upload = multer({ dest: "uploads/" });

app.post("/api/render", upload.fields([{ name: "audio" }, { name: "image" }]), async (req, res) => {
  const audioPath = req.files.audio[0].path;
  const imagePath = req.files.image[0].path;
  const outputPath = `renders/${Date.now()}_output.mp4`;

  const command = `ffmpeg -loop 1 -i ${imagePath} -i ${audioPath} -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest -vf "fade=t=in:st=0:d=1,fade=t=out:st=5:d=1" -y ${outputPath}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("FFmpeg Error:", error);
      return res.status(500).json({ error: "Video rendering failed." });
    }
    res.json({ videoUrl: `https://your-domain.com/${outputPath}` });
  });
});

app.use("/renders", express.static(path.join(__dirname, "renders")));

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
