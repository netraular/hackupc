document.addEventListener('DOMContentLoaded', () => {
    const fabButton = document.getElementById('fab-toggle-button');
    const fabPanel = document.getElementById('fab-action-panel');
    const panelSections = fabPanel ? fabPanel.querySelectorAll('.panel-section') : [];
    const navTabs = fabPanel ? fabPanel.querySelectorAll('.panel-nav-tab') : [];

    // --- Validación inicial ---
    if (!fabButton || !fabPanel) {
        console.warn("FAB Button o Panel no encontrado. La funcionalidad del FAB está desactivada.");
        return; // Salir si los elementos esenciales no existen
    }

    // --- Visibilidad del Panel ---
    function togglePanel() {
        fabPanel.classList.toggle('active');
        // Opcional: Cambiar icono del FAB cuando el panel está abierto/cerrado
        const icon = fabButton.querySelector('i'); // Asume que usas Font Awesome u similar
        if (icon) {
            icon.classList.toggle('fa-plus'); // Ícono cuando cerrado
            icon.classList.toggle('fa-times'); // Ícono cuando abierto
        }
    }

    // --- Cambio entre Secciones del Panel ---
    function setActiveSection(targetId) {
        // Ocultar todas las secciones y desactivar todas las pestañas
        panelSections.forEach(section => section.classList.remove('active'));
        navTabs.forEach(tab => tab.classList.remove('active'));

        // Activar la sección y pestaña objetivo
        const targetSection = document.getElementById(targetId);
        const targetTab = fabPanel.querySelector(`.panel-nav-tab[data-target="${targetId}"]`);

        if (targetSection) {
            targetSection.classList.add('active');
            console.log(`Sección activada: ${targetId}`);
        } else {
            console.warn(`Sección objetivo no encontrada: ${targetId}`);
        }
        if (targetTab) {
            targetTab.classList.add('active');
        }
    }

    // --- Event Listeners ---

    // 1. Click en el FAB para mostrar/ocultar panel
    fabButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Evita que el click se propague al document (para cerrar)
        togglePanel();
    });

    // 2. Click en las pestañas de navegación del panel
    navTabs.forEach(tab => {
        tab.addEventListener('click', (event) => {
            event.stopPropagation();
            const targetId = tab.dataset.target; // Obtiene el ID del data-target
            if (targetId) {
                setActiveSection(targetId);
            }
        });
    });

    // 3. (Opcional) Cerrar el panel si se hace clic fuera de él
    document.addEventListener('click', (event) => {
        // Si el panel está activo Y el clic NO fue dentro del panel NI en el botón FAB
        if (fabPanel.classList.contains('active') &&
            !fabPanel.contains(event.target) &&
            !fabButton.contains(event.target))
        {
            togglePanel(); // Cierra el panel
        }
    });

    // --- Inicialización ---
    // Asegurarse de que la primera pestaña/sección esté activa al cargar
    const initialActiveTab = fabPanel.querySelector('.panel-nav-tab');
    if (initialActiveTab && initialActiveTab.dataset.target) {
        setActiveSection(initialActiveTab.dataset.target);
    } else if (panelSections.length > 0) {
        // Si no hay pestañas, activar la primera sección directamente
        panelSections[0].classList.add('active');
         console.log(`Sección inicial activada directamente: ${panelSections[0].id}`);
    }

    console.log("Controlador del FAB inicializado.");

});