const db = require("../database");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await db.query(
    "SELECT * FROM users WHERE email = ? LIMIT 1",
    [email]
  );

  if (rows.length === 0) {
    return res.status(401).json({ message: "Usuario no encontrado" });
  }

  const user = rows[0];

  if (user.password !== password) {
    return res.status(401).json({ message: "Contraseña incorrecta" });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token, user });
};
