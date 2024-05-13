const { JWT_TOKEN } = require("./config");
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(403).json({ message: "Invalid Header/inputs" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_TOKEN);

    req.userId = decoded.userId;

    next();
  } catch (err) {
    return res.status(403).json({ message: err.message });
  }
};

module.exports = {
  authMiddleware,
};
