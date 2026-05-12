<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DriverTaskController;
use App\Models\Task;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {


    // Profile Routes
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Driver Task Routes
    Route::get('/driver/tasks', [DriverTaskController::class, 'index'])
        ->name('driver.tasks');

    Route::get('/driver/tasks/poll', [DriverTaskController::class, 'poll'])
        ->name('driver.tasks.poll');

    // Driver Task Status Update
    Route::patch('/driver/tasks/{task}/status', [DriverTaskController::class, 'updateStatus'])
        ->name('driver.tasks.updateStatus');    

    // Demo Task Management Routes
    Route::post('/driver/tasks', [DriverTaskController::class, 'store'])
        ->name('driver.tasks.store');

    Route::delete('/driver/tasks/{task}', [DriverTaskController::class, 'destroy'])
        ->name('driver.tasks.destroy');    
    

    // Temporary Test Route
    // Route::get('/create-test-task', function () {

    //     Task::create([
    //         'driver_id' => auth()->id(),
    //         'title' => 'Deliver Package to Warehouse',
    //         'description' => 'Pickup items and deliver before 5PM.',
    //         'status' => 'pending',
    //     ]);

    //     return 'Test task created!';
    // });
});

require __DIR__.'/auth.php';