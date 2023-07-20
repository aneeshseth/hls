const express = require('express');
const app = express();
const port = 3000;
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

// Middlewares
app.use(cors());
app.use(express.urlencoded({ extended: false }));


// Multer Sotrage Engine
const storage = multer.diskStorage({
  destination: (res, file, cb) => {
    cb(null, './upload');
  },
  filename: (res, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
})

const upload = multer({ storage: storage });


// Routes
app.post('/upload', upload.single('video'), async (req, res) => {

  try {
    console.log(req.file);
    const inputFilePath = req.file.path;
    const outputDir = path.join(__dirname, 'public', 'hls');
    const outputFileName = `${Date.now()}.m3u8`;

    await ffmpeg(inputFilePath)
      .outputOptions([
        '-hls_time 10',
        '-hls_list_size 0'
      ])
      .output(`${outputDir}/${outputFileName}`)
      .on('end', () => {
        console.log('Video Transcoding Complete');
        res.status(200).json({ status: true, manifest: outputFileName });
      })
      .run();
  }
  catch (er) {
    console.log(er);
    res.status(500).json({status: false, msg: 'Error Trascoding'});
  }

})

app.get('/stream/:manifest', (req, res) => {
  const manifestFileName = req.params.manifest;
  const manifestPath = path.join(__dirname, 'public', 'hls', manifestFileName);

  if ( !fs.existsSync(manifestPath) ) return res.status(400).json({status: false, msg: 'No Such Manifest file'});

  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
  fs.createReadStream(manifestPath).pipe(res);
})


app.listen(port, () => {
  console.log('Example app listening on port ', port)
})