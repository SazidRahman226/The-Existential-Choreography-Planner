import { TaskService } from '../services/taskService.js';
import { User } from '../models/user.js';
import { Task } from '../models/task.js';
import mongoose from 'mongoose';
import {
    calculateXP,
    calculateLevel,
    getTitleForLevel,
    getEnergyCost,
    getEnergyWarning,
    isFirstSessionToday,
    shouldFullRecharge,
    xpForLevel
} from '../utils/gamification.js';

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

    /**
     * PATCH /tasks/:id/complete
     * 
     * Post-task review endpoint. Calculates XP using the formula from
     * GAMIFICATION_SYSTEM.md, updates user energy/points/level, and
     * returns the full XP breakdown.
     */
    completeTask = async (req, res) => {
        try {
            const taskId = req.params.id;

            // Validate taskId is a valid MongoDB ObjectId
            if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
                return res.status(400).json({ message: 'Invalid or missing task ID' });
            }

            const {
                outcome,          // 'completed' | 'completed_late' | 'failed' | 'skipped'
                overtimeMinutes = 0,
                timeRemainingPercent = 0,
                reason,           // failure reason key
                note,             // optional free-text note
                actualTime,       // seconds actually spent
                usedFocusOverlay = false,
                streakCount = 0,
                sessionMode       // e.g., 'zen' — for Zen energy recovery
            } = req.body;

            // 1. Get the task
            const task = await taskService.getTaskById(taskId);
            if (!task) return res.status(404).json({ message: 'Task not found' });

            // 2. Get the user and apply passive energy regen
            const userId = req.user._id;
            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ message: 'User not found' });

            // Apply passive energy regeneration
            await user.updateEnergy();

            // Check for full recharge (8+ hours away)
            if (shouldFullRecharge(user.lastSessionDate)) {
                user.energy = 100;
            }

            // 3. Check if this is the first session today
            const firstFlowToday = isFirstSessionToday(user.lastSessionDate);

            // 3.5. Personal record detection
            const isPersonalRecord = (
                (outcome === 'completed') &&
                actualTime &&
                (task.bestTime === null || actualTime < task.bestTime)
            );

            // 4. Calculate XP
            const xpResult = calculateXP({
                difficulty: task.difficulty || 'medium',
                outcome,
                overtimeMinutes,
                timeRemainingPercent,
                userEnergy: user.energy,
                streakCount,
                usedFocusOverlay,
                isFirstFlowToday: firstFlowToday,
                isPersonalRecord
            });

            // 5. Deduct energy (never blocks — clamp to 0)
            const energyCost = getEnergyCost(task.difficulty || 'medium');
            user.energy = Math.max(0, user.energy - energyCost);

            // Zen mode energy recovery bonus
            if (sessionMode === 'zen' && outcome === 'completed') {
                user.energy = Math.min(100, user.energy + 5);
            }

            // First flow of the day energy bonus
            if (firstFlowToday) {
                user.energy = Math.min(100, user.energy + 10);
            }

            // 6. Add XP and recalculate level
            const oldLevel = user.level;
            user.points += xpResult.earnedXP;
            user.level = calculateLevel(user.points);
            const newTitle = getTitleForLevel(user.level);
            const levelUp = user.level > oldLevel;

            // 7. Update last session date
            user.lastSessionDate = new Date();

            // 8. Save user
            await user.save();

            // 9. Update task: status, points, history entry, and best time
            const taskStatus = outcome === 'failed' || outcome === 'skipped' ? 'failed' : 'completed';
            const estimatedTime = (task.duration || 1) * 60;

            const historyEntry = {
                date: new Date(),
                outcome,
                reason: reason || undefined,
                note: note || undefined,
                actualTime: actualTime || estimatedTime,
                estimatedTime,
                earnedXP: xpResult.earnedXP
            };

            const updateOps = {
                $set: {
                    status: taskStatus,
                    points: xpResult.earnedXP,
                    ...(isPersonalRecord ? { bestTime: actualTime } : {})
                },
                $push: { history: historyEntry }
            };

            await Task.findByIdAndUpdate(taskId, updateOps);

            // 10. Calculate XP progress info
            const currentLevelXP = xpForLevel(user.level);
            const nextLevelXP = xpForLevel(user.level + 1);
            const xpInCurrentLevel = user.points - currentLevelXP;
            const xpNeededForNextLevel = nextLevelXP - currentLevelXP;

            // 11. Return response
            res.json({
                earnedXP: xpResult.earnedXP,
                breakdown: xpResult.breakdown,
                newTotalXP: user.points,
                newEnergy: user.energy,
                newLevel: user.level,
                oldLevel,
                levelUp,
                title: newTitle,
                xpProgress: {
                    current: xpInCurrentLevel,
                    needed: xpNeededForNextLevel,
                    percent: Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100)
                },
                energyWarning: getEnergyWarning(user.energy),
                isPersonalRecord
            });
        } catch (error) {
            console.error('Error completing task:', error);
            res.status(500).json({ message: 'Error completing task' });
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

    /**
     * GET /tasks/:id/history
     * Returns last 5 history entries, best time, and suggested duration.
     */
    getTaskHistory = async (req, res) => {
        try {
            const task = await taskService.getTaskById(req.params.id);
            if (!task) return res.status(404).json({ message: 'Task not found' });

            const history = (task.history || [])
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5);

            // Calculate suggested duration from successful completions
            const successfulTimes = (task.history || [])
                .filter(h => h.outcome === 'completed' && h.actualTime)
                .map(h => h.actualTime)
                .sort((a, b) => a - b);

            let suggestedDuration = null;
            if (successfulTimes.length >= 3) {
                const mid = Math.floor(successfulTimes.length / 2);
                const medianSeconds = successfulTimes.length % 2 === 0
                    ? (successfulTimes[mid - 1] + successfulTimes[mid]) / 2
                    : successfulTimes[mid];
                suggestedDuration = Math.max(1, Math.round(medianSeconds / 60));
            }

            res.json({
                history,
                bestTime: task.bestTime,
                suggestedDuration,
                totalAttempts: (task.history || []).length
            });
        } catch (error) {
            console.error('Error fetching task history:', error);
            res.status(500).json({ message: 'Error fetching task history' });
        }
    }
}
