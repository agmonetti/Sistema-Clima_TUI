import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error("ERROR: La variable de entorno JWT_SECRET no fue definida.");
    process.exit(1);
}

// validamos el token
export const verifyToken = (req, res, next) => {
    const tokenHeader = req.headers['authorization'];

    if (!tokenHeader) {
        return res.status(403).json({ error: 'Acceso denegado: no se proporciono token.' });
    }

    // como el formato es "Bearer <token>", quitamos el "Bearer "
    const token = tokenHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ error: 'Formato de token invalido.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // inyectamos el usuario en la peticion
        next(); // Pasa al siguiente paso (el controlador u otro middleware)
    } catch (error) {
        return res.status(401).json({ error: 'Token invalido o expirado.' });
    }
};

// para validar los tres roles
export const requireRole = (rolesPermitidos) => {
    return (req, res, next) => {
        // req.user existe porque 'verifyToken' corrió antes
        if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
            return res.status(403).json({ 
                error: `Acceso prohibido: se requiere rol: ${rolesPermitidos.join(' o ')}` 
            });
        }
        next();
    };
};