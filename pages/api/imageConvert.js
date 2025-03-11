// pages/api/convertImage.js
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const { image } = req.query + ''
  console.log(image)

  const imagePath = path.join(process.cwd(), '/Images/', image, '.jpg')
  console.log(imagePath)

  // Read the image file
  fs.readFile(imagePath, (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Error reading the image file' });
    }

    // Convert the image to a Base64 string
    const base64Image = data.toString('base64');

    // Return the Base64 string in the response
    res.status(200).json({ base64: `data:image/jpeg;base64,${base64Image}` });
  });
}