// server.js

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use("/renders", express.static(path.join(__dirname, "renders")));

// File upload settings
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage: storage });

app.post("/api/render", upload.fields([
  { name: "audio", maxCount: 1 },
  { name: "image", maxCount: 1 }
]), (req, res) => {
  if (!req.files.audio || !req.files.image) {
    return res.status(400).json({ error: "Audio and image files are required." });
  }

  const audioPath = req.files.audio[0].path;
  const imagePath = req.files.image[0].path;
  const outputFilename = `output-${Date.now()}.mp4`;
  const outputPath = path.join(__dirname, "renders", outputFilename);

  const command = `ffmpeg -loop 1 -i "${imagePath}" -i "${audioPath}" -shortest -c:v libx264 -c:a aac -b:a 192k -pix_fmt yuv420p -vf "fade=in:0:30" "${outputPath}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("FFmpeg error:", stderr);
      return res.status(500).json({ error: "Video rendering failed." });
    }

    const videoUrl = `${req.protocol}://${req.get("host")}/renders/${outputFilename}`;
    res.json({ videoUrl });
  });
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

