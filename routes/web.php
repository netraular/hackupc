<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ChatController; // Chat de texto
use App\Http\Controllers\SttController;  // Nuevo para STT
use App\Http\Controllers\TtsController;  // Nuevo para TTS
use App\Http\Controllers\CarExperienceController;

// --- Rutas para el Chat (Solo Texto) ---
Route::get('/chat', [ChatController::class, 'index'])->name('chat.index'); // Muestra la vista del chat de texto
Route::post('/chat/send', [ChatController::class, 'sendMessage'])->name('chat.send'); // Recibe texto y llama a n8n
Route::post('/chat/stt-transcribe', [SttController::class, 'transcribeForChat'])->name('chat.stt.transcribe');
// --- Fin Rutas Chat ---

// --- Rutas para Prueba STT ---
Route::get('/stt-test', [SttController::class, 'showTestView'])->name('stt.test'); // Muestra la vista de prueba STT
Route::post('/stt-transcribe', [SttController::class, 'transcribeAudio'])->name('stt.transcribe'); // Procesa el audio STT
// --- Fin Rutas STT ---

// --- Rutas para Prueba TTS ---
Route::get('/tts-test', [TtsController::class, 'showTestView'])->name('tts.test'); // Muestra la vista de prueba TTS
Route::post('/tts-synthesize', [TtsController::class, 'synthesizeText'])->name('tts.synthesize'); // Genera el audio TTS
// --- Fin Rutas TTS ---


Route::get('/', [CarExperienceController::class, 'index'])->name('home');


Route::get('dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');


Route::get('/ar', function () {
    return view('ar_experience/ar');
})->name('ar');

Route::get('/livechat', function () {
    return view('ar_experience/livechat');
})->name('livechat');

Route::get('/webdemo', function () {
    return view('ar_experience/webdemo');
})->name('webdemo');

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';