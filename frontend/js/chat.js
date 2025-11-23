const chatWidget = {
    init() {
        this.inyectarHTML();
        this.cargarEventos();
    },

    // 1. DIBUJAR EL CHAT EN LA PANTALLA
    inyectarHTML() {
        const html = `
            <button id="btn-chat-float" class="btn btn-primary rounded-circle shadow p-3" 
                style="position: fixed; bottom: 20px; right: 20px; z-index: 1000; width: 60px; height: 60px;">
                💬
            </button>

            <div id="ventana-chat" class="card shadow d-none" 
                style="position: fixed; bottom: 90px; right: 20px; width: 350px; height: 500px; z-index: 1000; display: flex; flex-direction: column;">
                
                <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <span id="chat-titulo">Mensajería</span>
                    <button class="btn-close btn-close-white small" id="btn-cerrar-chat"></button>
                </div>

                <div id="vista-lista-chats" class="card-body p-0 overflow-auto" style="height: 100%;">
                    <div class="d-grid gap-2 p-2">
                        <button class="btn btn-sm btn-outline-primary" id="btn-nuevo-chat">+ Nuevo Chat</button>
                    </div>
                    <ul class="list-group list-group-flush" id="lista-conversaciones">
                        </ul>
                </div>

                <div id="vista-mensajes" class="card-body p-0 d-none d-flex flex-column" style="height: 100%;">
                    <div class="bg-light p-2 border-bottom text-center">
                        <button class="btn btn-sm btn-secondary float-start" id="btn-volver-lista">⬅</button>
                        <small class="fw-bold" id="nombre-chat-activo">Chat</small>
                    </div>
                    
                    <div id="contenedor-burbujas" class="flex-grow-1 p-2 overflow-auto bg-white">
                        </div>

                    <div class="p-2 border-top">
                        <form id="form-chat-envio" class="d-flex gap-1">
                            <input type="text" id="input-chat-msg" class="form-control form-control-sm" placeholder="..." autocomplete="off">
                            <button type="submit" class="btn btn-sm btn-primary">➤</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    },

    // 2. LÓGICA Y EVENTOS
    chatActivoId: null,

    cargarEventos() {
        // Abrir/Cerrar
        document.getElementById('btn-chat-float').addEventListener('click', () => {
            const ventana = document.getElementById('ventana-chat');
            ventana.classList.toggle('d-none');
            if (!ventana.classList.contains('d-none')) this.cargarListaChats();
        });

        document.getElementById('btn-cerrar-chat').addEventListener('click', () => {
            document.getElementById('ventana-chat').classList.add('d-none');
        });

        // Navegación interna
        document.getElementById('btn-volver-lista').addEventListener('click', () => {
            document.getElementById('vista-mensajes').classList.add('d-none');
            document.getElementById('vista-lista-chats').classList.remove('d-none');
            this.cargarListaChats(); // Refrescar
        });

        // Enviar Mensaje
        document.getElementById('form-chat-envio').addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = document.getElementById('input-chat-msg');
            const texto = input.value.trim();
            if (!texto || !this.chatActivoId) return;

            try {
                await api.post(`/mensajeria/${this.chatActivoId}/enviar`, { texto });
                input.value = '';
                this.cargarMensajes(this.chatActivoId); // Recargar para ver el propio
            } catch (error) {
                console.error(error);
            }
        });

        document.getElementById('btn-nuevo-chat').addEventListener('click', async () => {
            const idDestinoRaw = prompt("Ingresa el ID del usuario (Ej: 101 para Admin, 102 Tecnico):");
            const idDestino = parseInt(idDestinoRaw); 

            if (isNaN(idDestino) || idDestino <= 0) { 
                return alert("Por favor, ingresa un ID de usuario válido y numérico.");
            }
            
            try {
                // El cuerpo ahora envía un Number
                const res = await api.post('/mensajeria/privado', { destinatarioId: idDestino });
                
                if(res._id) {
                    this.abrirChat(res._id, "Chat Privado");
                }
            } catch (error) {
                alert("Error al iniciar chat: " + error.message);
            }
        });
    },

    async cargarListaChats() {
        const lista = document.getElementById('lista-conversaciones');
        lista.innerHTML = '<li class="list-group-item text-center text-muted">Cargando...</li>';
        
        try {
            const chats = await api.get('/mensajeria');
            const miUsuario = JSON.parse(localStorage.getItem('usuario'));
            const miId = parseInt(miUsuario.usuario_id);

            for (const chat of chats) { // Usamos for...of para poder usar await
                // 1. Identificar al otro miembro
                const otroId = chat.miembros.find(id => id !== miId);
                
                // 2. OBTENER EL NOMBRE REAL (AWAIT es obligatorio aquí)
                const nombreChat = chat.nombre 
                                   || await this.obtenerNombreUsuario(otroId) 
                                   || `Chat ${chat._id.substr(-4)}`;
                
                // 3. Renderizar el <li>
                const li = document.createElement('li');
                li.className = 'list-group-item list-group-item-action cursor-pointer';
                li.textContent = nombreChat; // Usamos el nombre resuelto
                li.onclick = () => this.abrirChat(chat._id, nombreChat);
                lista.appendChild(li);
            }
        } catch (error) {
            lista.innerHTML = '<li class="list-group-item text-danger">Error de conexión al cargar chats</li>';
        }
    },

    async abrirChat(chatId, nombre) {
        this.chatActivoId = chatId;
        document.getElementById('nombre-chat-activo').textContent = nombre;
        
        // Cambiar vista
        document.getElementById('vista-lista-chats').classList.add('d-none');
        document.getElementById('vista-mensajes').classList.remove('d-none');
        
        this.cargarMensajes(chatId);
    },

    async cargarMensajes(chatId) {
        const contenedor = document.getElementById('contenedor-burbujas');
        try {
            const mensajes = await api.get(`/mensajeria/${chatId}/mensajes`);
            const miUsuario = JSON.parse(localStorage.getItem('usuario'));
            
            let html = '';
            mensajes.forEach(msg => {
                const esMio = msg.emisor_id === parseInt(miUsuario.usuario_id);
                const align = esMio ? 'text-end' : 'text-start';
                const color = esMio ? 'bg-primary text-white' : 'bg-light border';
                
                html += `
                    <div class="${align} mb-2">
                        <div class="d-inline-block p-2 rounded ${color}" style="max-width: 80%; text-align: left;">
                            ${msg.texto}
                        </div>
                    </div>
                `;
            });
            contenedor.innerHTML = html;
            contenedor.scrollTop = contenedor.scrollHeight; // Scroll abajo
        } catch (error) {
            console.error(error);
        }
    },
    async obtenerNombreUsuario(userId) {
        if (!userId) return 'Usuario Desconocido';
        
        // La ruta que creamos en el paso anterior
        try {
            const user = await api.get(`/usuarios/id:${userId}`);
            // Asumo que tu objeto de usuario tiene un campo 'nombre'
            return user.nombre || user.email; 
        } catch (error) {
            console.error("Error al obtener nombre de usuario:", userId, error);
            return `Usuario #${userId}`;
        }
    },
};

// Autoiniciar si estamos logueados
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('token')) {
        chatWidget.init();
    }
});