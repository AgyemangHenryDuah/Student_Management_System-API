const swaggerJsDoc = require("swagger-jsdoc");
const schemas = require("./schemas");
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Student Management System API",
            version: "1.0.0",
            description: "API documentation for Student Management System",
            contact: {
                name: "API Support",
                email: "amglna2020@gmail.com"
            }
        },
        servers: [
            {
                url:
                    process.env.NODE_ENV === "production"
                        ? "https://your-production-url.com"
                        : "http://localhost:3000",
                description: process.env.NODE_ENV === "production" ? "Production server": "Development server"
            },
        ],
        components: {
            schemas: schemas,
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ["./src/routes/*.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = swaggerDocs