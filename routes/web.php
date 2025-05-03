<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ChatController; // Asegúrate de importar tu controlador

Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('home');

// --- Rutas para el Chat con n8n ---
Route::get('/chat', [ChatController::class, 'index'])->name('chat.index'); // Muestra la vista del chat
Route::post('/chat/send', [ChatController::class, 'sendMessage'])->name('chat.send'); // Recibe el mensaje del usuario y llama al webhook
// --- Fin Rutas Chat ---

Route::get('dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');


Route::get('/ar', function () {
    return view('ar_experience/ar');
})->name('ar');

Route::get('/webdemo', function () {
    return view('ar_experience/webdemo');
})->name('webdemo');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
