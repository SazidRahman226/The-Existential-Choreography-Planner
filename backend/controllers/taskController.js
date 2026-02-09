import { TaskService } from '../services/taskService.js';
import { User } from '../models/user.js';

const taskService = new TaskService();

export class TaskController {
    getAll = async (req, res) => {
        try {
            const tasks = await taskService.getAllTasks();
            res.json(tasks);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching tasks' });
        }
    }

    create = async (req, res) => {
        try {
            const task = await taskService.addTask(req.body);
            res.status(201).json(task);
        } catch (error) {
            res.status(500).json({ message: 'Error creating task' });
        }
    }

    getById = async (req, res) => {
        try {
            const task = await taskService.getTaskById(req.params.id);
            if (!task) return res.status(404).json({ message: 'Task not found' });
            res.json(task);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching task' });
        }
    }

    update = async (req, res) => {
        try {
            const taskId = req.params.id;
            const updates = req.body;

            // Get existing task to check current status and prerequisites
            const existingTask = await taskService.getTaskById(taskId);
            if (!existingTask) return res.status(404).json({ message: 'Task not found' });

            // Detect Status Change
            if (updates.status && updates.status !== existingTask.status) {

                // 1. Check Prerequisites if marking as completed or in-progress
                if (['completed', 'in-progress'].includes(updates.status)) {
                    if (existingTask.prerequisites && existingTask.prerequisites.length > 0) {
                        const incompletePrereqs = existingTask.prerequisites.filter(p => p.status !== 'completed');
                        if (incompletePrereqs.length > 0) {
                            return res.status(400).json({
                                message: `Cannot start task. Prerequisites incomplete: ${incompletePrereqs.map(p => p.title).join(', ')}`
                            });
                        }
                    }
                }

                // 2. Handle Completion (Points & Energy)
                if (updates.status === 'completed' && existingTask.status !== 'completed') {
                    // Start transaction or just update user carefully
                    // Assuming basic auth, we get userId from req.user
                    const userId = req.user._id; // authenticateJWT attaches user
                    const user = await User.findById(userId);

                    if (user) {
                        // Check Energy
                        if (user.energy < existingTask.energyCost) {
                            return res.status(400).json({ message: 'Not enough energy to complete this task!' });
                        }

                        // Deduct Energy, Add Points
                        user.energy -= existingTask.energyCost;
                        user.points += existingTask.pointsReward;

                        // Update levels logic could go here later

                        await user.save();
                    }
                }
            }

            const task = await taskService.updateTask(taskId, updates);
            res.json(task);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error updating task' });
        }
    }

    delete = async (req, res) => {
        try {
            const task = await taskService.deleteTask(req.params.id);
            if (!task) return res.status(404).json({ message: 'Task not found' });
            res.json({ message: 'Task deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error deleting task' });
        }
    }
}
