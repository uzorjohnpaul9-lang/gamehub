const jwt = require("jsonwebtoken");

function getSecret() {
    const secret = process.env.AUTH_SECRET;
    if (!secret && process.env.NODE_ENV !== "test") {
        console.warn("AUTH_SECRET not set - using insecure dev secret. Set it in server/.env before deploying.");
    }
    return secret || "gamehub-dev-secret";
}

function signToken(user) {
    return jwt.sign(
        { sub: user.id, email: user.email },
        getSecret(),
        { expiresIn: "7d" }
    );
}

function requireAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
        return res.status(401).json({ error: "Missing bearer token" });
    }
    try {
        const payload = jwt.verify(token, getSecret());
        req.userId = payload.sub;
        req.userEmail = payload.email;
        return next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}

function requireDb(req, res, next) {
    if (!require("./db.js").isDbConfigured) {
        return res.status(503).json({ error: "Database not configured on this server" });
    }
    next();
}

module.exports = { signToken: signToken, requireAuth: requireAuth, requireDb: requireDb };
