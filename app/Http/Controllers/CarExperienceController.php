<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\View\View; // Importa la clase View

class CarExperienceController extends Controller // O HomeController si usaste ese nombre
{
    /**
     * Muestra la página principal de la experiencia AR del coche.
     *
     * @return \Illuminate\View\View
     */
    public function index(): View // Puedes usar type hinting para el retorno
    {
        // Aquí podrías cargar datos del coche o del manual si fuera necesario
        // $carData = ...;
        // $manualInfo = ...;

        // Devuelve la vista, pasando datos si los tienes
        return view('3d_experience/web' /*, compact('carData', 'manualInfo') */);
    }
}