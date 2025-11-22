import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as UsuarioRepository from '../repositories/postgres/usuario.repository.js';

// Clave secreta para firmar tokens (En producción esto va en .env)
const JWT_SECRET = process.env.JWT_SECRET || 'mi_secreto_super_seguro';

/**
 * Lógica de REGISTRO
 * 1. Encriptar contraseña.
 * 2. Llamar al repositorio para guardar en Postgres (Transacción).
 * 3. Retornar el usuario creado (sin la contraseña).
 */
export async function register(datosUsuario) {
    const { nombre, mail, password} = datosUsuario; //ignoramos el rol para prevenir las inyecciones

    //revisamos si existe
    const usuarioExistente = await UsuarioRepository.buscarPorEmail(mail);
    if (usuarioExistente) {
        throw new Error('El email ya está registrado');
    }

    //hasheamos la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt); // Encripta

    // retornamos con la contraseña hasheada y el rol forzado
    const nuevoId = await UsuarioRepository.crearUsuarios({
        nombre,
        mail,
        password: passwordHash,
        rol_descripcion: 'usuario' // rol por defecto
    });

    return { id: nuevoId, nombre, mail };
}

/**
 * Lógica de LOGIN
 * 1. Buscar usuario por email.
 * 2. Comparar contraseña (hash vs plano).
 * 3. Generar Token JWT.
 */
export async function login({ mail, password }) {
    // Buscamos el usuario
    const usuario = await UsuarioRepository.buscarPorEmail(mail);
    if (!usuario) {
        throw new Error('Usuario no existente');
    }

    // validamos que la contraseña coincida, previo se desencripta
    const esPasswordValido = await bcrypt.compare(password, usuario.contraseña);
    if (!esPasswordValido) {
        throw new Error('Credenciales invalidas');
    }

    //generamos un token para el manejo de las sesiones
    const token = jwt.sign(
        { id: usuario.usuario_id, rol: usuario.rol },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    // Retornamos datos del usuario y el token (sin la contraseña)
    const { contraseña, ...usuarioSinPass } = usuario;
    return { user: usuarioSinPass, token };
}