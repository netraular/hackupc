document.addEventListener('DOMContentLoaded', function() {

    const aboutButton = document.getElementById('about-us-button');
    const popupId = 'about-us-popup'; // ID que usaremos para el popup
    let popupElement = null; // Variable para guardar la referencia al popup una vez creado

    // --- Datos de los miembros del equipo ---
    // Puedes modificar esta información fácilmente aquí
    const teamMembers = [
        {
            name: "Raúl Aquilué Rubio",
            githubUser: "netraular", // Usado para la imagen .png
            website: "https://raular.com",
            websiteText: "Portfolio"
        },
        {
            name: "Alexis Gabriel Díaz Fajardo",
            githubUser: "alekzihz",
            website: "#", // Cambia '#' por la URL real
            websiteText: "Sitio Web"
        },
        // --- Añade más miembros aquí ---
        // {
        //  name: "Nombre Integrante 3",
        //  githubUser: "usuario3", // Reemplaza con el usuario de GitHub
        //  website: "#",
        //  websiteText: "Sitio Web"
        // },
    ];

    /**
     * Crea el elemento DOM completo del popup con sus contenidos.
     * @returns {HTMLElement} El elemento div principal del popup (overlay).
     */
    function createPopupHtml() {
        // 1. Overlay principal
        const overlay = document.createElement('div');
        overlay.id = popupId;
        overlay.className = 'popup-overlay'; // Usa las clases CSS existentes
        // display: none por defecto (se cambiará a flex para mostrar)
        overlay.style.display = 'none';

        // 2. Contenido del popup
        const content = document.createElement('div');
        content.className = 'popup-content';

        // 3. Botón de cerrar
        const closeButton = document.createElement('button');
        closeButton.id = 'close-popup-button'; // Mantener ID para estilos/funcionalidad
        closeButton.className = 'close-button';
        closeButton.setAttribute('aria-label', 'Cerrar');
        closeButton.innerHTML = '×'; // '×' character
        closeButton.addEventListener('click', hidePopup); // Añadir listener directamente
        content.appendChild(closeButton);

        // 4. Título
        const title = document.createElement('h2');
        title.textContent = 'About us';
        content.appendChild(title);

        // 5. Contenedor de miembros
        const membersContainer = document.createElement('div');
        membersContainer.className = 'team-members';

        // 6. Crear cada bloque de miembro dinámicamente
        teamMembers.forEach(member => {
            const memberInfo = document.createElement('div');
            memberInfo.className = 'member-info';

            const avatar = document.createElement('img');
            avatar.src = `https://github.com/${member.githubUser}.png`;
            avatar.alt = `Avatar de ${member.name}`;
            avatar.className = 'github-avatar';
            memberInfo.appendChild(avatar);

            const details = document.createElement('div');
            details.className = 'member-details';

            const nameP = document.createElement('p');
            nameP.className = 'member-name';
            nameP.textContent = member.name;
            details.appendChild(nameP);

            if (member.website && member.website !== '#') { // Solo añadir enlace si existe
                const websiteLink = document.createElement('a');
                websiteLink.href = member.website;
                websiteLink.target = '_blank';
                websiteLink.rel = 'noopener noreferrer';
                websiteLink.className = 'member-website';
                websiteLink.textContent = member.websiteText || 'Sitio Web'; // Texto por defecto
                details.appendChild(websiteLink);
            }

            memberInfo.appendChild(details);
            membersContainer.appendChild(memberInfo);
        });

        content.appendChild(membersContainer);
        overlay.appendChild(content);

        return overlay;
    }

    /** Muestra el popup (creándolo si es la primera vez) */
    function showPopup() {
        // Si el popup no ha sido creado aún, créalo y añádelo al body
        if (!popupElement) {
            popupElement = createPopupHtml();
            document.body.appendChild(popupElement);
            console.log("Popup 'About Us' creado y añadido al DOM.");
        }
        // Muestra el popup usando flex (definido en tu CSS para centrar)
        popupElement.style.display = 'flex';
    }

    /** Oculta el popup */
    function hidePopup() {
        if (popupElement) {
            popupElement.style.display = 'none';
        }
    }

    // --- Event Listeners ---

    // 1. Listener para el botón "Sobre Nosotros"
    if (aboutButton) {
        aboutButton.addEventListener('click', showPopup);
    } else {
        console.warn('Botón "about-us-button" no encontrado.');
    }

    // 2. Listener para cerrar al hacer clic fuera del contenido
    //    (Se añade al window, pero solo actúa si el popup existe y está visible)
    window.addEventListener('click', function(event) {
        // Si el popup existe, está visible (display=flex) y el clic fue en el overlay (no en el contenido)
        if (popupElement && popupElement.style.display === 'flex' && event.target === popupElement) {
            hidePopup();
        }
    });

    // Nota: El listener del botón de cerrar se añade dentro de createPopupHtml()

});