require("dotenv").config()
const express = require("express")
// const cors = require("cors")
// const helmet = require("helmet")
// const morgan = require("morgan")
// const rateLimit = require("express-rate-limit")
const swaggerUi = require("swagger-ui-express")
const swaggerJsDoc = require("swagger-jsdoc")


// const connectDB = require("./config/database")
const errorHandler = require("./middleware/errorHandler")
const studentRoutes = require("./routes/studentRoutes")



const app = express()



// Middleware
app.use(express.json())


// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Student Management System API',
      version: '1.0.0',
      description: 'API documentation for Student Management System'
    },
    servers: [
      {
        url: 'http://localhost:3000'
      }
    ]
  },
  apis: ['./src/routes/*.js']
}

const swaggerDocs = swaggerJsDoc(swaggerOptions)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs))


// Routes
app.use('/api/students', studentRoutes)


// Error handling
app.use(errorHandler)



const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

module.exports = app