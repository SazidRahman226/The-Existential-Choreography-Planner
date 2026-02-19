import { FlowService } from '../services/flowService.js';
import { User } from '../models/user.js';
import { calculateLevel, getTitleForLevel, xpForLevel } from '../utils/gamification.js';

const flowService = new FlowService();

export class FlowController {
    getAll = async (req, res) => {
        try {
            const flows = await flowService.getUserFlows(req.user._id);
            res.json(flows);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching flows' });
        }
    }

    create = async (req, res) => {
        try {
            const flow = await flowService.createFlow(req.user._id, req.body);
            res.status(201).json(flow);
        } catch (error) {
            res.status(500).json({ message: 'Error creating flow' });
        }
    }

    getById = async (req, res) => {
        try {
            const flow = await flowService.getFlowById(req.params.id);
            if (!flow) return res.status(404).json({ message: 'Flow not found' });

            // Check ownership or public status
            if (flow.userId.toString() !== req.user._id.toString() && !flow.isPublic) {
                return res.status(403).json({ message: 'Access denied' });
            }

            res.json(flow);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching flow details' });
        }
    }

    update = async (req, res) => {
        try {
            const flow = await flowService.updateFlow(req.user._id, req.params.id, req.body);
            res.json(flow);
        } catch (error) {
            if (error.message === 'Unauthorized') {
                return res.status(403).json({ message: 'Unauthorized update' });
            }
            if (error.message === 'Flow not found') {
                return res.status(404).json({ message: 'Flow not found' });
            }
            res.status(500).json({ message: 'Error updating flow' });
        }
    }

    delete = async (req, res) => {
        try {
            const result = await flowService.deleteFlow(req.user._id, req.params.id);
            res.json({ message: 'Flow deleted successfully' });
        } catch (error) {
            if (error.message === 'Unauthorized') {
                return res.status(403).json({ message: 'Unauthorized delete' });
            }
            if (error.message === 'Flow not found') {
                return res.status(404).json({ message: 'Flow not found' });
            }
            res.status(500).json({ message: 'Error deleting flow' });
        }
    }

    /**
     * PATCH /flows/:id/complete-flow
     * 
     * Awards flow completion bonus XP based on performance.
     * - All tasks on time → +100 XP "Perfect Run 🏆"
     * - ≥80% on time → +50 XP "Great Run 🔥"
     * - <80% → +0 XP
     */
    completeFlow = async (req, res) => {
        try {
            const { completedOnTime = 0, totalTasks = 0 } = req.body;

            if (totalTasks === 0) {
                return res.json({ bonusXP: 0, bonusLabel: null });
            }

            const onTimePercent = (completedOnTime / totalTasks) * 100;

            let bonusXP = 0;
            let bonusLabel = null;

            if (onTimePercent >= 100) {
                bonusXP = 100;
                bonusLabel = 'Perfect Run 🏆';
            } else if (onTimePercent >= 80) {
                bonusXP = 50;
                bonusLabel = 'Great Run 🔥';
            }

            let levelUp = false;
            let newLevel = null;
            let oldLevel = null;
            let title = null;
            let newTotalXP = null;

            if (bonusXP > 0) {
                const user = await User.findById(req.user._id);
                if (user) {
                    oldLevel = user.level;
                    user.points += bonusXP;
                    user.level = calculateLevel(user.points);
                    newLevel = user.level;
                    levelUp = newLevel > oldLevel;
                    title = getTitleForLevel(newLevel);
                    newTotalXP = user.points;
                    await user.save();
                }
            }

            res.json({
                bonusXP,
                bonusLabel,
                newTotalXP,
                newLevel,
                oldLevel,
                levelUp,
                title
            });
        } catch (error) {
            console.error('Error completing flow:', error);
            res.status(500).json({ message: 'Error completing flow' });
        }
    }
}
