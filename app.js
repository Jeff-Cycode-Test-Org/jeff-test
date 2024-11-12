const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken'); // For JWT token
const app = express();
// const fs = require('fs');
// const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
// Middleware to parse JSON request bodies
app.use(express.json());
// ----------------- this section is only for debug purpose to generate the token in the console log  to be used to test in the Postman-------------
// Payload (data) for the token
const payload = {
  userId: 123, // Example user ID
  username: 'testuser'
};
// Generate the token
const token = jwt.sign(payload, "this_is_not_really_a_JWT_secret", { expiresIn: '365d' });
console.log('Generated JWT Token:', token);
// ----------------- this section is only for debug purpose to generate the token in the console log  to be used to test in the Postman-------------
// Create a MySQL connection pool
const pool = mysql.createPool({
  host: 'mysql',
  user: 'root',
  password: 'password',
  database: 'testdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
// Promisify pool.query to use async/await (optional but convenient)
const poolPromise = pool.promise();
// Vulnerable route (SQL Injection)
// No authentication for this route, and it's vulnerable to SQL injection
app.get('/', (req, res) => {
  res.send(`
    <form action="/user" method="GET">
      <label for="name">Enter user name:</label>
      <input type="text" id="name" name="name">
      <button type="submit">Submit</button>
    </form>
  `);
});
// SQL Injection vulnerability - no authentication required
app.get('/user', async (req, res) => {
  const userName = req.query.name;
  try {
    // SQL Injection: User input is directly injected into the SQL query without sanitization
    const [results] = await poolPromise.query(`SELECT * FROM users WHERE name = '${userName}'`);
    if (results.length > 0) {
      res.send(`User found: ${JSON.stringify(results)}`);
    } else {
      res.send('No user found');
    }
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(500).send('Internal Server Error');
  }
});
// Middleware to protect routes with JWT authentication
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, "this_is_not_really_a_JWT_secret", (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};
// XSS Vulnerability in /api/data API (with JWT authentication)
const DOMPurify = require('dompurify');
app.post('/api/data', authenticateJWT, (req, res) => {
  const { inputData } = req.body;
  // Sanitize user input to prevent XSS vulnerability
  const sanitizedInputData = DOMPurify.sanitize(inputData);
  const responseData = `<div>User Input: ${sanitizedInputData}</div>`;
  // Send a 200 OK status code and the response
  res.status(200).send({
    message: 'Request was successful!',
    data: responseData
  });
});
// Insecure Deserialization Vulnerability
app.post('/api/deserialize', authenticateJWT, (req, res) => {
  try {
    // Vulnerable deserialization: User-provided JSON is parsed directly
    const data = JSON.parse(req.body.serializedData);
    // Example usage of deserialized data
    res.status(200).send({
      message: 'Data deserialized successfully',
      data: data
    });
  } catch (error) {
    res.status(400).send('Invalid input');
  }
});
// app.get('/openapi.yml', (req, res) => {
//   const yamlPath = path.join(__dirname, 'openapi.yaml');
//   fs.readFile(yamlPath, 'utf8', (err, data) => {
//     if (err) {
//       res.status(500).send('Could not load OpenAPI YAML file');
//     } else {
//       res.setHeader('Content-Type', 'text/yaml');
//       res.send(data);
//     }
//   });
// });
// Swagger definition setup
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Vulnerable App API',
    version: '1.0.0',
    description: 'API documentation for the vulnerable app implementing OWASP top 10 vulnerabilities.',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local server',
    },
  ],
};
const options = {
  swaggerDefinition,
  apis: ['./app.js'], // Path to the API docs
};
const swaggerSpec = swaggerJsdoc(options);
/**
 * @swagger
 * /:
 *   get:
 *     summary: SQL Injection vulnerability example
 *     description: This route demonstrates SQL injection by allowing unsanitized input directly into the SQL query.
 *     responses:
 *       200:
 *         description: Form to submit username for SQL query.
 */
/**
 * @swagger
 * /user:
 *   get:
 *     summary: SQL Injection vulnerability
 *     description: Fetches user details based on unsanitized input, leading to SQL Injection vulnerability.
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Name of the user to query
 *     responses:
 *       200:
 *         description: User details
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/data:
 *   post:
 *     summary: XSS Vulnerability
 *     description: Returns user input without sanitization, leading to XSS vulnerability.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               inputData:
 *                 type: string
 *     responses:
 *       200:
 *         description: User input echoed back
 *       403:
 *         description: Forbidden
 */
/**
 * @swagger
 * /api/deserialize:
 *   post:
 *     summary: Insecure Deserialization Vulnerability
 *     description: Accepts user input and deserializes it without validation, leading to potential insecure deserialization vulnerability.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               serializedData:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully deserialized the data
 *       400:
 *         description: Bad Request
 */
// Bearer Authentication definition
/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
// Serve Swagger docs at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// Start the application
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
