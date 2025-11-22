import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'mi_secreto_super_seguro';

// validamos el token
export const verifyToken = (req, res, next) => {
    const tokenHeader = req.headers['authorization'];

    if (!tokenHeader) {
        return res.status(403).json({ error: 'Acceso denegado. No se proporcionó token.' });
    }

    // El formato suele ser "Bearer <token>", quitamos el "Bearer "
    const token = tokenHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ error: 'Formato de token inválido.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // inyectamos el usuario en la peticion
        next(); // Pasa al siguiente paso (el controlador u otro middleware)
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido o expirado.' });
    }
};

// para validar los tres roles
export const requireRole = (rolesPermitidos) => {
    return (req, res, next) => {
        // req.user existe porque 'verifyToken' corrió antes
        if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
            return res.status(403).json({ 
                error: `Acceso prohibido. Se requiere rol: ${rolesPermitidos.join(' o ')}` 
            });
        }
        next();
    };
};