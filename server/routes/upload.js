const express = require('express'),
  router = express.Router()

router.post('/', async (req, res) => {
  try {
    if (!req.files) {
      res.send({
        status: false,
        message: 'No file uploaded'
      })
    } else {
      //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
      let zip = req.files.zip

      //Use the mv() method to place the file in upload directory (i.e. "uploads")
      zip.mv('./import-data/upload.zip')

      //send response
      res.send({
        status: true,
        message: 'File is uploaded',
        data: {
          name: zip.name,
          mimetype: zip.mimetype,
          size: zip.size
        }
      })
    }
  } catch (err) {
    res.status(500).send(err)
  }
})
