// Espera a que el contenido del DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {

    // Obtener referencias a los elementos del DOM
    const aboutButton = document.getElementById('about-us-button');
    const aboutPopup = document.getElementById('about-us-popup');
    const closePopupButton = document.getElementById('close-popup-button');

    // Verificar si los elementos existen antes de añadir listeners
    if (aboutButton && aboutPopup) {
        // Mostrar el popup al hacer clic en el botón "About Us"
        aboutButton.addEventListener('click', function() {
            aboutPopup.style.display = 'block'; // Muestra el popup
        });
    }

    if (closePopupButton && aboutPopup) {
        // Ocultar el popup al hacer clic en el botón de cerrar
        closePopupButton.addEventListener('click', function() {
            aboutPopup.style.display = 'none'; // Oculta el popup
        });
    }

    // Opcional: Cerrar el popup si se hace clic fuera de él
    window.addEventListener('click', function(event) {
        // Si el clic fue fuera del contenido del popup Y el popup está visible
        if (aboutPopup && event.target === aboutPopup && aboutPopup.style.display === 'block') {
            aboutPopup.style.display = 'none';
        }
    });

});