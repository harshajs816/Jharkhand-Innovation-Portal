const multer  = require('multer')
const path    = require('path')
const fs      = require('fs')

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (_req, file,  cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${unique}${path.extname(file.originalname)}`)
  },
})

const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|mp4|mov|avi|pdf|doc|docx|xls|xlsx/
  const ext     = path.extname(file.originalname).toLowerCase().slice(1)
  cb(null, allowed.test(ext))
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 },  // 20 MB
})

module.exports = upload
