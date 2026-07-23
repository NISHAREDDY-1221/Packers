import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "VillagKart Packing & Repacking ERP API",
      version: "1.0.0",
      description:
        "API documentation for the VillagKart backend workflow, including Auth, Master Data, Work Orders, QC, Repacking, and Finished Goods.",
    },
    servers: [
      {
        url: "http://localhost:5000/api/v1",
        description: "Local Development Server",
      },
    ],
    components: {
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
  apis: ["./src/routes/*.ts"], // This will scan the routes folder for JSDoc comments
};

export const swaggerSpec = swaggerJsdoc(options);
