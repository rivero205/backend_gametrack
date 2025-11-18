import path from 'path';
import { fileURLToPath } from 'url';

export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Build a public URL for the uploaded file
    const filename = req.file.filename;
    const protocol = req.protocol;
    const host = req.get('host');
    const url = `${protocol}://${host}/assets/portadas/${filename}`;

    // Return URL and file metadata to help client-side debugging
    return res.status(201).json({ url, filename, size: req.file.size, mime: req.file.mimetype });
  } catch (err) {
    console.error('[uploadsController] uploadImage error:', err);
    return res.status(500).json({ error: 'Upload failed' });
  }
};
