// server.js - Starter Express server for Week 2 assignment

// Import required modules
const express = require("express");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(bodyParser.json());

// Sample in-memory products database
let products = [
  {
    id: uuidv4(),
    name: "Laptop",
    description: "High-performance laptop with 16GB RAM",
    price: 1200,
    category: "electronics",
    inStock: true,
  },
  {
    id: uuidv4(),
    name: "Smartphone",
    description: "Latest model with 128GB storage",
    price: 800,
    category: "electronics",
    inStock: true,
  },
  {
    id: uuidv4(),
    name: "Coffee Maker",
    description: "Programmable coffee maker with timer",
    price: 50,
    category: "kitchen",
    inStock: false,
  },
];

// 1. Custom Logger Middleware
const logger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
};

// 2. JSON Parser Middleware
app.use(bodyParser.json());

// 3. Apply logger to all routes
app.use(logger);

// 4. Authentication Middleware (checks for API key)
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  // For this example, we'll use a simple API key
  // In real apps, you'd store this securely
  if (!apiKey || apiKey !== "your-secret-api-key") {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Valid API key required",
    });
  }

  next();
};

// 5. Validation Middleware for Product Data
const validateProduct = (req, res, next) => {
  const { name, description, price, category, inStock } = req.body;

  // Check required fields
  if (!name || !description || !price || !category) {
    return res.status(400).json({
      error: "Validation Error",
      message: "Missing required fields: name, description, price, category",
    });
  }

  // Check data types
  if (typeof name !== "string" || typeof description !== "string") {
    return res.status(400).json({
      error: "Validation Error",
      message: "Name and description must be strings",
    });
  }

  if (typeof price !== "number" || price <= 0) {
    return res.status(400).json({
      error: "Validation Error",
      message: "Price must be a positive number",
    });
  }

  if (typeof category !== "string") {
    return res.status(400).json({
      error: "Validation Error",
      message: "Category must be a string",
    });
  }

  // inStock is optional, but if provided, must be boolean
  if (inStock !== undefined && typeof inStock !== "boolean") {
    return res.status(400).json({
      error: "Validation Error",
      message: "inStock must be a boolean",
    });
  }

  next();
};

// ===== ROUTES =====

// Root route - Hello World
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the Products API!",
    version: "1.0.0",
    endpoints: {
      products: "/api/products",
      documentation: "See README.md for full API documentation",
    },
  });
});

// GET /api/products - Get all products with optional filtering and pagination
app.get("/api/products", (req, res) => {
  try {
    let result = [...products]; // Copy the array

    // Filter by category if provided
    const { category, page = 1, limit = 10, search } = req.query;

    if (category) {
      result = result.filter((product) =>
        product.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    // Search by name if provided
    if (search) {
      result = result.filter((product) =>
        product.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedProducts = result.slice(startIndex, endIndex);

    res.json({
      products: paginatedProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(result.length / limit),
        totalItems: result.length,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
});

// GET /api/products/:id - Get a specific product by ID
app.get("/api/products/:id", (req, res) => {
  try {
    const { id } = req.params;
    const product = products.find((p) => p.id === id);

    if (!product) {
      return res.status(404).json({
        error: "Not Found",
        message: `Product with ID ${id} not found`,
      });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
});

// POST /api/products - Create a new product
app.post("/api/products", authenticateApiKey, validateProduct, (req, res) => {
  try {
    const { name, description, price, category, inStock = true } = req.body;

    const newProduct = {
      id: uuidv4(),
      name,
      description,
      price,
      category,
      inStock,
    };

    products.push(newProduct);

    res.status(201).json({
      message: "Product created successfully",
      product: newProduct,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
});

// PUT /api/products/:id - Update an existing product
app.put(
  "/api/products/:id",
  authenticateApiKey,
  validateProduct,
  (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, price, category, inStock } = req.body;

      const productIndex = products.findIndex((p) => p.id === id);

      if (productIndex === -1) {
        return res.status(404).json({
          error: "Not Found",
          message: `Product with ID ${id} not found`,
        });
      }

      // Update the product
      products[productIndex] = {
        ...products[productIndex],
        name,
        description,
        price,
        category,
        inStock:
          inStock !== undefined ? inStock : products[productIndex].inStock,
      };

      res.json({
        message: "Product updated successfully",
        product: products[productIndex],
      });
    } catch (error) {
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
);

// DELETE /api/products/:id - Delete a product
app.delete("/api/products/:id", authenticateApiKey, (req, res) => {
  try {
    const { id } = req.params;
    const productIndex = products.findIndex((p) => p.id === id);

    if (productIndex === -1) {
      return res.status(404).json({
        error: "Not Found",
        message: `Product with ID ${id} not found`,
      });
    }

    const deletedProduct = products.splice(productIndex, 1)[0];

    res.json({
      message: "Product deleted successfully",
      product: deletedProduct,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
});

// GET /api/products/stats - Get product statistics
app.get("/api/products/stats", (req, res) => {
  try {
    const stats = {
      totalProducts: products.length,
      inStockProducts: products.filter((p) => p.inStock).length,
      outOfStockProducts: products.filter((p) => !p.inStock).length,
      categoryCount: {},
    };

    // Count products by category
    products.forEach((product) => {
      if (stats.categoryCount[product.category]) {
        stats.categoryCount[product.category]++;
      } else {
        stats.categoryCount[product.category] = 1;
      }
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
});

// Handle 404 errors for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.url} not found`,
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);

  res.status(err.status || 500).json({
    error: err.name || "Internal Server Error",
    message: err.message || "Something went wrong",
  });
});

// // Root route

// app.get("/", (req, res) => {
//   res.send("Hello wolrdffffff");
// });

// TODO: Implement the following routes:
// GET /api/products - Get all products-+1
// GET /api/products/:id - Get a specific product
// POST /api/products - Create a new product
// PUT /api/products/:id - Update a product
// DELETE /api/products/:id - Delete a product

// Example route implementation for GET /api/products
app.get("/api/products", (req, res) => {
  res.json(products);
});

// TODO: Implement custom middleware for:
// - Request logging
// - Authentication
// - Error handling

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Export the app for testing purposes
module.exports = app;
