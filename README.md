# DriverTask – Driver “My Tasks” Inbox Documentation

## Project Summary

This project is a small Laravel + Inertia React application created for the intern task:

> **Build a “My Tasks” inbox for drivers using query + Inertia page + polling.**

The application allows a logged-in driver to view assigned tasks, receive updates through polling, and update task status from the task inbox page.

For demo/testing purposes, the page also includes simple controls for adding and deleting tasks without needing a separate admin panel.

---

## Tech Stack Used

### Backend
- Laravel 12
- PHP
- MySQL
- Laravel Breeze authentication
- Inertia.js Laravel adapter

### Frontend
- React through Inertia
- JSX
- Tailwind CSS
- Vite

### Authentication
- Laravel Breeze login/register
- Authenticated routes using Laravel `auth` middleware

---

## Main Features Completed

### Core Requirements
- User registration and login
- Authenticated driver task inbox page
- Query tasks assigned to the logged-in user
- Render tasks through an Inertia React page
- Poll backend every 5 seconds for task updates

### Task Actions
- Start task: `pending` → `in_progress`
- Complete task: `in_progress` → `completed`
- Add task using demo form
- Delete task
- Status color badges

---

## How the Feature Works

### 1. Driver logs in
The user registers or logs in using the Breeze authentication pages.

### 2. Driver opens My Tasks
The driver visits:

```text
http://127.0.0.1:8000/driver/tasks
```

### 3. Laravel queries assigned tasks
The controller gets tasks where:

```php
driver_id = auth()->id()
```

This ensures the logged-in driver only sees their own assigned tasks.

### 4. Inertia renders the React page
Laravel renders:

```php
Inertia::render('Driver/MyTasks')
```

This loads:

```text
resources/js/Pages/Driver/MyTasks.jsx
```

### 5. React polls the backend
The frontend sends a request every 5 seconds to:

```text
/driver/tasks/poll
```

This allows new or updated tasks to appear without manually refreshing the browser.

---

## Important File Paths

These are the main files added or edited for the task.

---

## 1. Task Model

### Path

```text
app/Models/Task.php
```

### Purpose

Defines the `Task` model and allows mass assignment for task fields.

### Important Code

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    protected $fillable = [
        'driver_id',
        'title',
        'description',
        'status',
        'due_at',
    ];
}
```

---

## 2. Tasks Table Migration

### Path

```text
database/migrations/xxxx_xx_xx_xxxxxx_create_tasks_table.php
```

### Purpose

Creates the `tasks` table in MySQL.

### Important Fields

```php
$table->id();
$table->foreignId('driver_id')->constrained('users')->cascadeOnDelete();
$table->string('title');
$table->text('description')->nullable();
$table->string('status')->default('pending');
$table->timestamp('due_at')->nullable();
$table->timestamps();
```

### Notes

The `driver_id` is connected to the `users` table. For this demo, each registered user acts as a driver.

---

## 3. Driver Task Controller

### Path

```text
app/Http/Controllers/DriverTaskController.php
```

### Purpose

Handles:
- Showing the task inbox page
- Polling tasks
- Updating task status
- Creating demo tasks
- Deleting demo tasks

### Methods Added

#### `index()`

Loads the Inertia task inbox page.

```php
public function index(): Response
{
    return Inertia::render('Driver/MyTasks', [
        'tasks' => Task::where('driver_id', auth()->id())
            ->latest()
            ->get(),
    ]);
}
```

#### `poll()`

Returns the latest tasks as JSON for polling.

```php
public function poll(): JsonResponse
{
    return response()->json(
        Task::where('driver_id', auth()->id())
            ->latest()
            ->get()
    );
}
```

#### `updateStatus()`

Updates task status.

```php
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
```

#### `store()`

Creates a new task for the logged-in user.

```php
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
```

#### `destroy()`

Deletes a task owned by the logged-in user.

```php
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
```

---

## 4. Web Routes

### Path

```text
routes/web.php
```

### Purpose

Defines the authenticated driver task routes.

### Routes Added

```php
use App\Http\Controllers\DriverTaskController;
use App\Models\Task;
```

Inside the authenticated route group:

```php
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
```

### Optional Temporary Test Route

This route was used earlier for quick testing:

```php
// Temporary Test Route - used only for demo/testing
// Route::get('/create-test-task', function () {
//     Task::create([
//         'driver_id' => auth()->id(),
//         'title' => 'Deliver Package to Warehouse',
//         'description' => 'Pickup items and deliver before 5PM.',
//         'status' => 'pending',
//     ]);
//
//     return 'Test task created!';
// });
```

For final submission, this route can be removed or commented out because the page already has an Add Task form.

---

## 5. Inertia React Page

### Path

```text
resources/js/Pages/Driver/MyTasks.jsx
```

### Purpose

This is the main frontend page for the Driver Task Inbox.

It handles:
- Displaying task cards
- Polling every 5 seconds
- Adding demo tasks
- Starting tasks
- Completing tasks
- Deleting tasks
- Showing status badge colors

### Important State

```jsx
const [taskList, setTaskList] = useState(tasks);
const [title, setTitle] = useState('');
const [description, setDescription] = useState('');
```

### Polling Function

```jsx
const fetchTasks = async () => {
    const response = await fetch('/driver/tasks/poll');
    const data = await response.json();
    setTaskList(data);
};
```

### Polling Interval

```jsx
useEffect(() => {
    const interval = setInterval(fetchTasks, 5000);

    return () => clearInterval(interval);
}, []);
```

### Status Update Function

```jsx
const updateStatus = async (taskId, status) => {
    if (!taskId) {
        console.error('Missing task ID:', taskId);
        alert('Task ID is missing. Check console.');
        return;
    }

    const token = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content');

    const response = await fetch(`/driver/tasks/${taskId}/status`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-CSRF-TOKEN': token,
        },
        body: JSON.stringify({ status }),
    });

    if (!response.ok) {
        const errorText = await response.text();

        console.error('Failed to update task:', response.status, errorText);
        alert('Failed to update task. Open Inspect → Console.');

        return;
    }

    await fetchTasks();
};
```

### Create Task Function

```jsx
const createTask = async (event) => {
    event.preventDefault();

    if (!title.trim()) {
        alert('Task title is required.');
        return;
    }

    const response = await fetch('/driver/tasks', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-CSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify({
            title,
            description,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to create task:', response.status, errorText);
        alert('Failed to create task. Check console.');
        return;
    }

    setTitle('');
    setDescription('');
    await fetchTasks();
};
```

### Delete Task Function

```jsx
const deleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) {
        return;
    }

    const response = await fetch(`/driver/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'X-CSRF-TOKEN': getCsrfToken(),
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to delete task:', response.status, errorText);
        alert('Failed to delete task. Check console.');
        return;
    }

    await fetchTasks();
};
```

### Status Badge Colors

```jsx
const getStatusBadgeClass = (status) => {
    if (status === 'pending') {
        return 'bg-yellow-100 text-yellow-700';
    }

    if (status === 'in_progress') {
        return 'bg-blue-100 text-blue-700';
    }

    if (status === 'completed') {
        return 'bg-green-100 text-green-700';
    }

    return 'bg-gray-100 text-gray-700';
};
```

---

## 6. Blade App Layout

### Path

```text
resources/views/app.blade.php
```

### Purpose

The CSRF meta tag is needed so `PATCH`, `POST`, and `DELETE` requests from React do not fail with a `419 CSRF token mismatch`.

### Important Code

Inside `<head>`:

```blade
<meta name="csrf-token" content="{{ csrf_token() }}">
```

Example:

```blade
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title inertia>{{ config('app.name', 'Laravel') }}</title>

    @routes
    @viteReactRefresh
    @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
    @inertiaHead
</head>
```

---

## 7. Authenticated Layout Navigation

### Path

```text
resources/js/Layouts/AuthenticatedLayout.jsx
```

### Purpose

Adds a navigation link to the My Tasks page.

### Code Added

```jsx
<NavLink
    href={route('driver.tasks')}
    active={route().current('driver.tasks')}
>
    My Tasks
</NavLink>
```

Place it near the existing Dashboard nav link.

---

## Commands Used

### Create Laravel Project

```bash
cd /c/InternshipCode
composer create-project laravel/laravel drivertask
cd drivertask
```

### Install Breeze React/Inertia

```bash
composer require laravel/breeze --dev
php artisan breeze:install react
npm install
npm run build
```

### Configure Database

Create a MySQL database:

```text
drivertask
```

Update `.env`:

```env
APP_NAME=DriverTask
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=drivertask
DB_USERNAME=root
DB_PASSWORD=
```

### Run Migration

```bash
php artisan migrate:fresh
```

### Create Task Model and Migration

```bash
php artisan make:model Task -m
php artisan migrate
```

### Create Controller

```bash
php artisan make:controller DriverTaskController
```

### Run Development Servers

Terminal 1:

```bash
php artisan serve
```

Terminal 2:

```bash
npm run dev
```

---

## Testing Checklist

Use this checklist before submission.

### Authentication
- [ ] Register works
- [ ] Login works
- [ ] Dashboard opens after login

### My Tasks Page
- [ ] `/driver/tasks` opens
- [ ] Page title shows “Driver Task Inbox”
- [ ] Task cards display correctly

### Polling
- [ ] Add a task
- [ ] Wait 5 seconds
- [ ] Confirm task list refreshes automatically
- [ ] Open the page in another tab and confirm updates appear after polling

### Status Updates
- [ ] Pending task shows Start button
- [ ] Clicking Start changes status to `in_progress`
- [ ] In-progress task shows Complete button
- [ ] Clicking Complete changes status to `completed`
- [ ] Completed task shows “Task completed”

### Demo Controls
- [ ] Add Task form works
- [ ] Empty title validation works
- [ ] Delete button works
- [ ] Delete confirmation appears

### Error Checks
- [ ] Browser console has no important red errors
- [ ] Laravel terminal has no server errors
- [ ] No `419 CSRF token mismatch`
- [ ] No missing task ID errors

---

## Demo Explanation

You can explain the feature like this:

```text
I built a Driver My Tasks inbox using Laravel, Inertia, React, and MySQL. The page queries tasks assigned to the authenticated driver and polls the backend every 5 seconds to show new or updated tasks. Drivers can update task status from pending to in progress to completed. I also added demo controls for creating and deleting tasks so the polling behavior can be tested without needing a separate admin panel.
```

---

## Notes About Admin vs Driver Responsibility

In a real Thumbworx-style system:

```text
Admin / Dispatcher / Logistic staff = create, edit, assign, delete tasks
Driver = view assigned tasks and update status
```

For this demo project, the Add Task and Delete buttons are placed on the driver page only for testing and demonstration.

Recommended final wording:

```text
The driver page focuses on viewing assigned tasks and updating task status. I also added simple demo controls for creating and deleting tasks so the polling behavior can be tested without requiring a separate admin panel.
```

---

## Possible Future Improvements

These can be added later if needed:

- Separate admin task management page
- Assign tasks to different drivers
- Task priority
- Due date picker
- Search and filter
- Task counts by status
- Real-time updates using Laravel Echo/Pusher instead of polling
- Role-based authorization
- Pagination
- Better validation messages
- Toast notifications
- Edit task modal

---

## Final Project Path

```text
C:\InternshipCode\drivertask
```

Main feature path:

```text
C:\InternshipCode\drivertask\resources\js\Pages\Driver\MyTasks.jsx
```
