const cloudinary = require('cloudinary').v2;

// Reads CLOUDINARY_URL from the environment automatically — no explicit
// cloud_name/api_key/api_secret needed here.
cloudinary.config();

module.exports = cloudinary;
