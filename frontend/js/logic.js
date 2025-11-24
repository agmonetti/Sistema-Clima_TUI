const logic = {
    // --- LÓGICA DE MENSAJERÍA (Se llama desde chat.js, la dejamos en el mismo archivo) ---
    async contactarUsuario(usuarioId) {
        alert("Iniciando chat con usuario: " + usuarioId);
        // Aquí se llamaría a chatWidget.iniciarChat, pero eso está en otro script.
        // Por ahora, solo alertamos.
    },    
    // ==================================================
    // 1. LÓGICA DE ADMIN: GESTIÓN DE USUARIOS
    // ==================================================

    async cargarUsuarios() {
        const contenedor = document.getElementById('tabla-usuarios-container');
        if(!contenedor) return;
        
        contenedor.innerHTML = '<div class="text-center"><div class="spinner-border text-primary"></div> Cargando...</div>';

        try {
            const res = await api.get('/usuarios'); 
            if (res.error) throw new Error(res.error); 

            const miUsuario = JSON.parse(localStorage.getItem('usuario'));
            const miId = String(miUsuario.usuario_id); // Asegurar que sea número
            
            let html = `
                <table class="table table-hover table-sm">
                    <thead>
                        <tr><th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Acción</th></tr>
                    </thead>
                    <tbody>
            `;

            res.forEach(u => {
            const esMiUsuario = String(u.usuario_id) === miId;
            
            // LÓGICA VISUAL DE ESTADO
            let claseFila = '';
            let nombreMostrar = u.nombre;
            let botonAccion = '';

            if (esMiUsuario) {
                nombreMostrar = `<strong>${u.nombre} (Usted)</strong>`;
                claseFila = 'table-primary'; // Azul para mí
                // Yo no me puedo borrar ni reactivar a mí mismo aquí
                botonAccion = `<button class="btn btn-secondary btn-sm" disabled>🔒</button>`;
            
            } else if (!u.isActive) {
                // CASO INACTIVO
                claseFila = 'table-secondary text-muted'; // Gris
                nombreMostrar = `${u.nombre} (Inactivo)`;
                // Botón VERDE para Reactivar
                botonAccion = `
                    <button class="btn btn-success btn-sm" 
                        onclick="logic.revivirUsuario(${u.usuario_id})" 
                        title="Revivir Usuario">
                        ♻️ Revivir
                    </button>`;
            } else {
                // CASO ACTIVO NORMAL
                // Botón ROJO para Eliminar
                // Validamos que no sea admin para no mostrar el botón al cuete (aunque el back protege)
                const disabled = (u.rol === 'admin') ? 'disabled' : '';
                botonAccion = `
                    <button class="btn btn-danger btn-sm" 
                        onclick="logic.eliminarUsuario(${u.usuario_id})" 
                        ${disabled} title="Eliminar Usuario">
                        🗑️
                    </button>`;
            }

            html += `
                <tr class="${claseFila}">
                    <td>${u.usuario_id}</td>
                    <td>${nombreMostrar}</td>
                    <td>${u.mail}</td>
                    <td><span class="badge bg-light text-dark border">${u.rol}</span></td>
                    <td>
                        <button class="btn btn-primary btn-sm me-1" 
                            onclick="logic.contactarUsuario(${u.usuario_id})"
                            ${esMiUsuario ? 'disabled' : ''}>💬</button>
                        
                        ${botonAccion}
                    </td>
                </tr>
            `;
            });

            html += '</tbody></table>';
            contenedor.innerHTML = html;

        } catch (error) {
            contenedor.innerHTML = `<div class="alert alert-danger p-2">Error: ${error.message}</div>`;
        }
    },

    async revivirUsuario(id) {
        if (!confirm(`¿Deseas revivir el acceso al usuario ID ${id}?`)) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3000/api/usuarios/${id}/revivir`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                alert('Usuario revivido exitosamente');
                this.cargarUsuarios(); 
            } else {
                const data = await res.json();
                throw new Error(data.error || 'Error del servidor');
            }
            
        } catch (error) {
            console.error(error);
            alert('Error al revivir: ' + error.message);
        }
    },

    async eliminarUsuario(id) {
        if (!confirm(`¿Seguro que deseas eliminar al usuario ID ${id}?`)) return;
        try {
            await api.delete(`/usuarios/${id}`);
            alert('Usuario eliminado correctamente');
            this.cargarUsuarios(); 
        } catch (error) {
            alert('Error al eliminar: ' + error.message);
        }
    },
    async darseDeBaja() {
        const confirmacion = prompt('Estas seguro de eliminar tu cuenta?\n\nEscribe "ELIMINAR" para confirmar.\n(Esta accion desactiva tu acceso).');
        
        if (confirmacion !== "ELIMINAR") {
            if (confirmacion) alert("Cancelado: escribir ELIMINAR.");
            return;
        }

        try {
            const res = await api.delete('/usuarios/me');
            
            if (res.message) {
                alert("Tu cuenta ha sido eliminada");
                auth.logout(); // Sacamos al usuario y borramos token
            }
        } catch (error) {
            alert("No se pudo eliminar la cuenta: " + error.message);
        }
    },

    // ==================================================
    // 2. LÓGICA DE CLIENTE: BILLETERA
    // ==================================================

    async obtenerSaldo() {
        const display = document.getElementById('display-saldo');
        const navSaldo = document.getElementById('nav-saldo');
        if(!display) return;

        display.textContent = '...';
        
        try {
            const res = await api.get('/transaccion/saldo'); 
            if (res.saldo !== undefined) {
                const saldoFormato = parseFloat(res.saldo).toFixed(2);
                display.textContent = `$${saldoFormato}`;
                if(navSaldo) navSaldo.textContent = `Saldo: $${saldoFormato}`;
            }
        } catch (error) {
            console.error("Fallo al obtener saldo:", error);
            display.textContent = '$0.00 (Error)';
        }
    },

    async recargarSaldo(e) {
        e.preventDefault();
        const input = document.getElementById('monto-recarga');
        const monto = parseFloat(input.value);

        if (!monto || monto <= 0) return alert("Monto inválido");
        if(!confirm(`¿Recargar $${monto}?`)) return;

        try {
            const res = await api.post('/transaccion/recargar', { monto });
            if (res.nuevoSaldo !== undefined) {
                alert("¡Recarga exitosa!");
                input.value = ''; 
                this.obtenerSaldo(); 
            }
        } catch (error) {
            alert("Error en la recarga: " + error.message);
        }
    },

    // ==================================================
    // 3. LÓGICA DE CLIENTE: CATÁLOGO Y COMPRA (NUEVO)
    // ==================================================

    async cargarCatalogo() {
        const contenedor = document.getElementById('catalogo-container');
        if (!contenedor) return;

        contenedor.innerHTML = '<p class="text-center">Cargando catálogo...</p>';

        try {
            const procesos = await api.get('/procesos');
            
            if (!procesos || procesos.length === 0) {
                contenedor.innerHTML = '<p class="text-center">No hay servicios disponibles.</p>';
                return;
            }

            let html = '<div class="row">';
            procesos.forEach(proc => {
                html += `
                    <div class="col-md-6 mb-3">
                        <div class="card h-100 border-0 shadow-sm">
                            <div class="card-body text-center">
                                <div class="fs-1 mb-2">📦</div>
                                <h5 class="card-title">${proc.nombre}</h5>
                                <p class="card-text small text-muted">${proc.descripcion || ''}</p>
                                <h4 class="text-primary">$${proc.costo}</h4>
                                <button class="btn btn-outline-primary w-100 mt-2" 
                                    onclick="logic.abrirModalSolicitud('${proc._id}', '${proc.nombre}', ${proc.costo})">
                                    Configurar y Solicitar
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            contenedor.innerHTML = html;
        } catch (error) {
            contenedor.innerHTML = `<p class="text-danger">Error: ${error.message}</p>`;
        }
    },
    
    sensoresCache: [],

    async abrirModalSolicitud(idProceso, nombreProceso, costo) {
        // 1. Resetear UI
        document.getElementById('solicitud-proceso-id').value = idProceso;
        document.getElementById('modal-mensaje-costo').innerHTML = 
            `Contratar: <strong>${nombreProceso}</strong><br>Costo: <strong>$${costo}</strong>`;
        
        // Resetear Fechas (Semana pasada)
        const hoy = new Date();
        const haceSemana = new Date();
        haceSemana.setDate(hoy.getDate() - 7);
        document.getElementById('solicitud-inicio').value = haceSemana.toISOString().slice(0, 10);
        document.getElementById('solicitud-fin').value = hoy.toISOString().slice(0, 10);

        // 2. Cargar Ciudades (Una sola vez)
        const selectCiudad = document.getElementById('solicitud-ciudad');
        const selectSensor = document.getElementById('solicitud-sensor');
        
        // Reset selects
        selectSensor.innerHTML = '<option disabled selected>Elige Ciudad y Tipo</option>';
        selectSensor.disabled = true;
        this.sensoresCache = []; // Limpiar caché

        try {
            const ciudades = await api.get('/medicion/ciudades');
            selectCiudad.innerHTML = '<option value="" selected disabled>Selecciona Ciudad</option>';
            ciudades.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.text = c;
                selectCiudad.appendChild(opt);
            });
            
            new bootstrap.Modal(document.getElementById('modalSolicitud')).show();
        } catch (e) {
            alert("Error cargando ciudades");
        }
    },
// --- LÓGICA SEGURA DE FILTRADO ---
    async cargarSensoresFiltrados() {
        const ciudad = document.getElementById('solicitud-ciudad').value;
        const tipo = document.getElementById('solicitud-tipo').value;
        const selectSensor = document.getElementById('solicitud-sensor');
        
        if (!ciudad) return; 

        selectSensor.innerHTML = '<option>Cargando...</option>';
        selectSensor.disabled = true;

        try {
            // 1. Pedimos datos al backend
            const sensores = await api.get(`/medicion/sensores?ciudad=${encodeURIComponent(ciudad)}`);
            
            // 2. Filtramos en memoria (CON PROTECCIÓN)
            const sensoresFiltrados = sensores.filter(s => {
                // Si elegimos 'todos', pasan todos
                if (tipo === 'todos') return true;
                
                // PROTECCIÓN: Si el sensor no tiene config, asumimos que no pasa el filtro
                // Esto evita el error "Cannot read properties of undefined"
                const tipoSensor = s.configuracion?.tipo_sensor; 
                
                return tipoSensor.toLowerCase() === tipo.toLowerCase();
            });

            // 3. Renderizar
            selectSensor.innerHTML = '';
            
            if (sensoresFiltrados.length === 0) {
                selectSensor.innerHTML = '<option disabled selected>No hay sensores de este tipo</option>';
            } else {
                // Opción por defecto
                const defaultOpt = document.createElement('option');
                defaultOpt.text = `Seleccione (${sensoresFiltrados.length} disponibles)`;
                defaultOpt.value = "";
                defaultOpt.selected = true;
                defaultOpt.disabled = true;
                selectSensor.appendChild(defaultOpt);

                sensoresFiltrados.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s._id;
                    // Mostramos el tipo para que veas que funcionó
                    const tipoMuestra = s.configuracion?.tipo_sensor || 'Desconocido';
                    opt.text = `${s.nombre} [${tipoMuestra}]`;
                    selectSensor.appendChild(opt);
                });
                selectSensor.disabled = false;
            }

        } catch (e) {
            console.error(e); // Ver error en consola
            selectSensor.innerHTML = '<option disabled>Error al cargar</option>';
        }
    },

    // --- MODAL: Paso 2 (Cargar sensores al cambiar ciudad) ---
    async cargarSensoresPorCiudad(ciudad) {
        const selectSensor = document.getElementById('solicitud-sensor');
        selectSensor.disabled = true;
        selectSensor.innerHTML = '<option>Cargando sensores...</option>';

        try {
            // Encodeamos la ciudad por si tiene espacios
            const sensores = await api.get(`/medicion/sensores?ciudad=${encodeURIComponent(ciudad)}`);
            
            selectSensor.innerHTML = '';
            
            if(sensores.length === 0) {
                selectSensor.innerHTML = '<option disabled>Sin sensores en esta ciudad</option>';
            } else {
                // Agregamos opción por defecto
                const defaultOpt = document.createElement('option');
                defaultOpt.text = "Selecciona un sensor...";
                defaultOpt.value = "";
                defaultOpt.selected = true;
                defaultOpt.disabled = true;
                selectSensor.appendChild(defaultOpt);

                sensores.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s._id;
                    opt.text = s.nombre;
                    selectSensor.appendChild(opt);
                });
                selectSensor.disabled = false;
            }
        } catch (e) {
            selectSensor.innerHTML = '<option disabled>Error al cargar</option>';
            alert("Error al filtrar sensores: " + e.message);
        }
    },

    // --- MODAL: Paso 3 (Confirmar Compra) ---
    async confirmarCompra() {
        const procesoId = document.getElementById('solicitud-proceso-id').value;
        const sensorId = document.getElementById('solicitud-sensor').value;
        const fechaInicioRaw = document.getElementById('solicitud-inicio').value;
        const fechaFinRaw = document.getElementById('solicitud-fin').value;
        const umbral = document.getElementById('solicitud-umbral').value;

        // Validaciones
        if (!sensorId) return alert("Debes seleccionar un sensor de la lista.");
        if (!fechaInicioRaw || !fechaFinRaw) return alert("Selecciona las fechas.");

        // Conversión de fechas para el Backend (ISO con hora)
        const fechaInicio = new Date(fechaInicioRaw + 'T00:00:00').toISOString();
        const fechaFin = new Date(fechaFinRaw + 'T23:59:59').toISOString();

        if (new Date(fechaInicio) > new Date(fechaFin)) return alert("La fecha de inicio no puede ser mayor a la de fin.");

        const parametros = {
            sensorId: sensorId,
            fechaInicio: fechaInicio,
            fechaFin: fechaFin,
            umbral: umbral ? parseFloat(umbral) : 30
        };

        // UI Feedback
        const btnConfirmar = document.querySelector('#modalSolicitud .btn-success');
        const textoOriginal = btnConfirmar.textContent;
        btnConfirmar.disabled = true;
        btnConfirmar.textContent = "Procesando...";

        try {
            const res = await api.post('/transaccion/solicitar', {
                procesoId: procesoId,
                parametros: parametros
            });

            if (res.status === 'success') {
                // Cerrar modal
                const modalEl = document.getElementById('modalSolicitud');
                const modal = bootstrap.Modal.getInstance(modalEl);
                modal.hide();

                alert(`¡Éxito! Solicitud #${res.ticket.solicitud_id} procesada.`);
                this.obtenerSaldo();      
                this.cargarHistorial();   
            }
        } catch (error) {
            console.error(error);
            alert("Error en la compra: " + error.message);
        } finally {
            btnConfirmar.disabled = false;
            btnConfirmar.textContent = textoOriginal;
        }
    },


    // ==================================================
    // 4. LÓGICA DE CLIENTE: HISTORIAL Y REPORTES
    // ==================================================

    async cargarHistorial() {
        const contenedor = document.getElementById('tabla-historial-container');
        if(!contenedor) return;
        
        contenedor.innerHTML = '<p class="text-center">Cargando...</p>';

        try {
            const usuario = JSON.parse(localStorage.getItem('usuario'));
            const historial = await api.get(`/transaccion/historial/${usuario.usuario_id}`);

            if (!historial || historial.length === 0) {
                contenedor.innerHTML = '<p class="text-center text-muted">No hay solicitudes.</p>';
                return;
            }

            let html = `
                <table class="table table-sm table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Fecha</th>
                            <th>Estado</th>
                            <th>Factura</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            historial.forEach(item => {
                const fecha = new Date(item.fechaSolicitud).toLocaleDateString();
                let badgeClass = 'bg-secondary';
                let estadoTexto = 'Pendiente';
                
                if (item.isCompleted) { badgeClass = 'bg-success'; estadoTexto = 'Listo'; }
                else if (item.resultado && item.resultado.includes('ERROR')) { badgeClass = 'bg-danger'; estadoTexto = 'Error'; }

                // Codificar para pasar al otro HTML
                const datosSeguros = encodeURIComponent(JSON.stringify(item));

                html += `
                    <tr>
                        <td><small>${fecha}</small></td>
                        <td><span class="badge ${badgeClass}">${estadoTexto}</span></td>
                        <td>${item.factura_id ? `#${item.factura_id}` : '-'}</td>
                        <td>
                            <button class="btn btn-sm btn-primary py-0" 
                                onclick="logic.verDetalle('${datosSeguros}')">
                                Ver
                            </button>
                        </td>
                    </tr>
                `;
            });

            html += '</tbody></table>';
            contenedor.innerHTML = html;

        } catch (error) {
            console.error(error);
            contenedor.innerHTML = `<p class="text-danger">Error cargando historial.</p>`;
        }
    },


    verDetalle(datosString) {
        try {
            const datos = JSON.parse(decodeURIComponent(datosString));
            localStorage.setItem('temp_reporte_detalle', JSON.stringify(datos));
            window.location.href = 'reporte.html';
        } catch (e) {
            console.error(e);
            alert("Error al abrir el reporte.");
        }
    },

    // ==================================================
    // 5. INICIALIZADORES
    // ==================================================
    
    initCliente() {
        this.obtenerSaldo();
        this.cargarCatalogo();
        this.cargarHistorial();
        
        const form = document.getElementById('form-recarga');
        if (form) {
            form.addEventListener('submit', (e) => this.recargarSaldo(e));
        }
    },

    async contactarUsuario(usuarioId) {
        // Inicia chat privado
        try {
            const res = await api.post('/mensajeria/privado', { destinatarioId: usuarioId });
            if(res._id) {
                alert("Chat creado. Ve a la sección Mensajes.");
            }
        } catch (e) {
            alert("Error contactando usuario: " + e.message);
        }
    },

// ==================================================
    // 6. LÓGICA DE TÉCNICO: INGESTA MANUAL
    // ==================================================

    async initTecnico() {
        const select = document.getElementById('tec-sensor-id');
        if (!select) return;

        select.addEventListener('change', () => {
            this.cargarHistorialSensor(select.value);
        });

        try {
            // Reutilizamos el endpoint que ya creamos para el cliente (/api/medicion/sensores)
            const sensores = await api.get('/medicion/sensores'); 
            
            select.innerHTML = '<option value="" selected disabled>Seleccione un sensor</option>';
            
            if (!sensores || sensores.length === 0) {
                select.innerHTML = '<option disabled>No hay sensores registrados</option>';
            } else {
                sensores.forEach(s => {
                    const option = document.createElement('option');
                    option.value = s._id; // ID de Mongo
                    // Mostramos Nombre y Ciudad para identificarlo fácil
                    option.text = `${s.nombre} (${s.ubicacion.ciudad})`;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error(error);
            select.innerHTML = '<option disabled>Error cargando lista</option>';
        }
        
        // Listener del formulario
        const form = document.getElementById('form-medicion');
        if (form) {
            form.addEventListener('submit', (e) => this.enviarMedicionManual(e));
        }
    },

    async enviarMedicionManual(e) {
        e.preventDefault();
        
        const sensorId = document.getElementById('tec-sensor-id').value;
        const temp = parseFloat(document.getElementById('tec-temperatura').value);
        const hum = parseFloat(document.getElementById('tec-humedad').value);
        const fechaInput = document.getElementById('tec-fecha').value;
        if (!sensorId) return alert("Debes elegir un sensor.");

        // Payload para el backend
        const payload = {
            sensor_id: sensorId,
            temperatura: temp,
            humedad: hum
        };
        // Si el usuario eligió fecha, la agregamos. Si no, el backend pondrá Date.now()
        if (fechaInput) {
            payload.timestamp = new Date(fechaInput).toISOString();
        }

        try {
            // Llamada al endpoint de ingesta (Backend/Mongo)
            const res = await api.post('/medicion/registro', payload);
            
            if (res.message) {
                alert(`Medición registrada con éxito.`);
                // Limpiar campos numéricos pero dejar el sensor seleccionado para carga rápida
                document.getElementById('tec-temperatura').value = '';
                document.getElementById('tec-humedad').value = '';
                document.getElementById('tec-temperatura').focus();
                document.getElementById('tec-fecha').value = '';

                this.cargarHistorialSensor(sensorId);
            }
        } catch (error) {
            alert("Error al enviar medición: " + error.message);
        }
    },

    async cargarHistorialSensor(sensorId) {
        const tbody = document.getElementById('tabla-mediciones-tecnico');
        tbody.innerHTML = '<tr><td colspan="3">Cargando...</td></tr>';

        try {
            const mediciones = await api.get(`/medicion/historial/${sensorId}`);
            
            tbody.innerHTML = '';

            if (!mediciones || mediciones.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" class="text-muted">No hay mediciones registradas.</td></tr>';
                return;
            }

            mediciones.forEach(m => {
                const fecha = new Date(m.timestamp).toLocaleString();
                tbody.innerHTML += `
                    <tr>
                        <td>${fecha}</td>
                        <td><strong>${m.temperatura}</strong></td>
                        <td>${m.humedad}</td>
                    </tr>
                `;
            });

        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-danger">Error: ${error.message}</td></tr>`;
        }
    },

    // Helper para el botón de refrescar
    actualizarTablaTecnico() {
        const id = document.getElementById('tec-sensor-id').value;
        if (id) this.cargarHistorialSensor(id);
    },
};