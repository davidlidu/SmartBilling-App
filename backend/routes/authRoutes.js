const express = require("express");
const router = express.Router();
const db = require("../database");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ message: "Missing username or password" });

  try {
    const [rows] = await db.execute(
      "SELECT * FROM users WHERE username = ? LIMIT 1",
      [username]
    );

    if (rows.length === 0)
      return res.status(401).json({ message: "Usuario no encontrado" });

    const user = rows[0];

    if (user.password !== password)
      return res.status(401).json({ message: "Contraseña incorrecta" });

    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ token });

  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
