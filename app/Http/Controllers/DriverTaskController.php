<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;

class DriverTaskController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Driver/MyTasks', [
            'tasks' => Task::where('driver_id', auth()->id())
                ->latest()
                ->get(),
        ]);
    }

    public function poll(): JsonResponse
    {
        return response()->json(
            Task::where('driver_id', auth()->id())
                ->latest()
                ->get()
        );
    }

    public function updateStatus(Task $task): JsonResponse
    {
        if ($task->driver_id !== auth()->id()) {
            abort(403);
        }

        request()->validate([
            'status' => ['required', 'in:pending,in_progress,completed'],
        ]);

        $task->update([
            'status' => request('status'),
        ]);

        return response()->json($task);
    }

public function store(): JsonResponse
{
    request()->validate([
        'title' => ['required', 'string', 'max:255'],
        'description' => ['nullable', 'string'],
    ]);

    $task = Task::create([
        'driver_id' => auth()->id(),
        'title' => request('title'),
        'description' => request('description'),
        'status' => 'pending',
    ]);

    return response()->json($task, 201);
}

public function destroy(Task $task): JsonResponse
{
    if ($task->driver_id !== auth()->id()) {
        abort(403);
    }

    $task->delete();

    return response()->json([
        'message' => 'Task deleted successfully.',
    ]);
}
    
}