const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.DB_NAME || 'Complete_innovation',
    })
    console.log(`✅  MongoDB connected: ${conn.connection.host} / ${conn.connection.name}`)
  } catch (err) {
    console.error('❌  MongoDB connection failed:', err.message)
    process.exit(1)
  }
}

module.exports = connectDB
