import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function MyTasks({ tasks }) {
    const [taskList, setTaskList] = useState(tasks);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const fetchTasks = async () => {
        const response = await fetch('/driver/tasks/poll');
        const data = await response.json();
        setTaskList(data);
    };

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

    const getCsrfToken = () => {
        return document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');
    };

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

    useEffect(() => {
        const interval = setInterval(fetchTasks, 5000);

        return () => clearInterval(interval);
    }, []);

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

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    My Tasks
                </h2>
            }
        >
            <Head title="My Tasks" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h1 className="mb-4 text-2xl font-bold">
                                Driver Task Inbox
                            </h1>

                            <form
                                onSubmit={createTask}
                                className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4"
                            >
                                <h2 className="mb-3 text-lg font-semibold">
                                    Demo Controls: Add Task
                                </h2>

                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(event) => setTitle(event.target.value)}
                                        placeholder="Task title"
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />

                                    <textarea
                                        value={description}
                                        onChange={(event) => setDescription(event.target.value)}
                                        placeholder="Task description"
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />

                                    <button
                                        type="submit"
                                        className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                                    >
                                        Add Task
                                    </button>
                                </div>
                            </form>

                            {taskList.length === 0 ? (
                                <p className="text-gray-500">
                                    No tasks assigned yet.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {taskList.map((task) => (
                                        <div
                                            key={task.id}
                                            className="rounded-lg border border-gray-200 p-4"
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <h2 className="text-lg font-semibold">
                                                    {task.title}
                                                </h2>

                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClass(task.status)}`}
                                                >
                                                    {task.status}
                                                </span>
                                            </div>

                                            {task.description && (
                                                <p className="mt-2 text-sm text-gray-600">
                                                    {task.description}
                                                </p>
                                            )}

                                            {task.due_at && (
                                                <p className="mt-2 text-xs text-gray-400">
                                                    Due: {task.due_at}
                                                </p>
                                            )}

                                            <div className="mt-4 flex gap-2">
                                                {task.status === 'pending' && (
                                                    <button
                                                        onClick={() =>
                                                            updateStatus(
                                                                task.id,
                                                                'in_progress',
                                                            )
                                                        }
                                                        className="rounded bg-yellow-500 px-3 py-1 text-sm font-medium text-white hover:bg-yellow-600"
                                                    >
                                                        Start
                                                    </button>
                                                )}

                                                {task.status ===
                                                    'in_progress' && (
                                                    <button
                                                        onClick={() =>
                                                            updateStatus(
                                                                task.id,
                                                                'completed',
                                                            )
                                                        }
                                                        className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700"
                                                    >
                                                        Complete
                                                    </button>
                                                )}

                                                {task.status === 'completed' && (
                                                    <span className="text-sm font-medium text-green-600">
                                                        Task completed
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => deleteTask(task.id)}
                                                    className="rounded bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}