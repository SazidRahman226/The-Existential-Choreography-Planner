import { FlowService } from '../services/flowService.js';
import { Flow } from '../models/flow.js';
import { User } from '../models/user.js';
import { calculateLevel, getTitleForLevel, xpForLevel } from '../utils/gamification.js';
import { checkAchievements } from '../utils/achievements.js';

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

            // Check ownership, admin role, or approved public status
            if (flow.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin' && flow.publicStatus !== 'approved') {
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

            // Always load user for stat tracking
            const user = await User.findById(req.user._id);
            if (!user) return res.status(404).json({ message: 'User not found' });

            const oldLevel = user.level;

            // Add bonus XP
            if (bonusXP > 0) {
                user.points += bonusXP;
                user.level = calculateLevel(user.points);
            }

            // Update flow stats
            if (!user.stats) user.stats = {};
            user.stats.flowsCompleted = (user.stats.flowsCompleted || 0) + 1;

            // Perfect run tracking
            if (onTimePercent >= 100) {
                user.stats.perfectRuns = (user.stats.perfectRuns || 0) + 1;
            }

            // Consecutive days tracking
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const lastActive = user.stats.lastActiveDate ? new Date(user.stats.lastActiveDate) : null;
            if (lastActive) {
                lastActive.setHours(0, 0, 0, 0);
                const diffDays = Math.round((today - lastActive) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    // Consecutive day
                    user.stats.consecutiveDays = (user.stats.consecutiveDays || 0) + 1;
                } else if (diffDays > 1) {
                    // Streak broken
                    user.stats.consecutiveDays = 1;
                }
                // diffDays === 0 means same day, don't change
            } else {
                user.stats.consecutiveDays = 1;
            }
            user.stats.lastActiveDate = new Date();

            // Check achievements
            const newBadges = checkAchievements(user);
            let badgeBonusXP = 0;
            const unlockedBadges = [];

            for (const badge of newBadges) {
                user.badges.push({ key: badge.key, unlockedAt: new Date() });
                badgeBonusXP += badge.xpBonus;
                unlockedBadges.push({
                    key: badge.key,
                    name: badge.name,
                    emoji: badge.emoji,
                    xpBonus: badge.xpBonus
                });
            }

            if (badgeBonusXP > 0) {
                user.points += badgeBonusXP;
                user.level = calculateLevel(user.points);
            }

            const newLevel = user.level;
            const levelUp = newLevel > oldLevel;
            const title = getTitleForLevel(newLevel);

            await user.save();

            res.json({
                bonusXP,
                bonusLabel,
                newTotalXP: user.points,
                newLevel,
                oldLevel,
                levelUp,
                title,
                unlockedBadges,
                badgeBonusXP
            });
        } catch (error) {
            console.error('Error completing flow:', error);
            res.status(500).json({ message: 'Error completing flow' });
        }
    }

    /**
     * GET /flows/public
     * Paginated public flow gallery with search and tag filtering.
     * No auth required.
     */
    getPublicFlows = async (req, res) => {
        try {
            const { page = 1, limit = 12, search = '', tag = '', sort = 'newest' } = req.query;
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const filter = { publicStatus: 'approved', isPublic: true };

            if (search) {
                filter.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }

            if (tag) {
                filter.tags = tag;
            }

            let sortOption = { createdAt: -1 }; // newest
            if (sort === 'popular') sortOption = { cloneCount: -1 };
            if (sort === 'oldest') sortOption = { createdAt: 1 };

            const [flows, total] = await Promise.all([
                Flow.find(filter)
                    .populate('userId', 'fullName username avatar level')
                    .sort(sortOption)
                    .skip(skip)
                    .limit(parseInt(limit))
                    .select('title description tags cloneCount flowData.nodes createdAt userId'),
                Flow.countDocuments(filter)
            ]);

            // Compute node count from flowData
            const enriched = flows.map(f => {
                const obj = f.toObject();
                obj.nodeCount = Array.isArray(obj.flowData?.nodes) ? obj.flowData.nodes.length : 0;
                delete obj.flowData; // Don't send full flowData to gallery
                return obj;
            });

            res.json({
                flows: enriched,
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit))
            });
        } catch (error) {
            console.error('Error fetching public flows:', error);
            res.status(500).json({ message: 'Error fetching public flows' });
        }
    }

    /**
     * POST /flows/:id/clone
     * Deep-copies a public flow into the current user's account.
     */
    cloneFlow = async (req, res) => {
        try {
            const sourceFlow = await Flow.findById(req.params.id);
            if (!sourceFlow) return res.status(404).json({ message: 'Flow not found' });
            if (sourceFlow.publicStatus !== 'approved' && sourceFlow.userId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Cannot clone a private flow' });
            }

            // Deep copy flowData, reset all node statuses to pending
            const clonedData = JSON.parse(JSON.stringify(sourceFlow.flowData));
            if (clonedData.nodes) {
                clonedData.nodes.forEach(node => {
                    if (node.data) node.data.status = 'pending';
                });
            }

            const newFlow = await Flow.create({
                userId: req.user._id,
                title: `${sourceFlow.title} (Cloned)`,
                description: sourceFlow.description,
                flowData: clonedData,
                tags: [...sourceFlow.tags],
                clonedFrom: sourceFlow._id,
                isPublic: false
            });

            // Increment clone count on source
            await Flow.findByIdAndUpdate(sourceFlow._id, { $inc: { cloneCount: 1 } });

            // Track stat for achievements
            const user = await User.findById(req.user._id);
            if (user) {
                if (!user.stats) user.stats = {};
                user.stats.flowsCreated = (user.stats.flowsCreated || 0) + 1;
                await user.save();
            }

            res.status(201).json(newFlow);
        } catch (error) {
            console.error('Error cloning flow:', error);
            res.status(500).json({ message: 'Error cloning flow' });
        }
    }

    /**
     * PATCH /flows/:id/toggle-public
     * User requests publication (private → pending) or withdraws (pending/approved/rejected → private).
     */
    togglePublic = async (req, res) => {
        try {
            const flow = await Flow.findById(req.params.id);
            if (!flow) return res.status(404).json({ message: 'Flow not found' });
            if (flow.userId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            if (flow.publicStatus === 'private' || flow.publicStatus === 'rejected') {
                // Request publication → goes to pending
                flow.publicStatus = 'pending';
                flow.reviewNote = '';
            } else {
                // Withdraw from pending/approved → back to private
                flow.publicStatus = 'private';
                flow.isPublic = false;
            }

            if (req.body.tags) flow.tags = req.body.tags;
            await flow.save();

            res.json({ publicStatus: flow.publicStatus, isPublic: flow.isPublic, tags: flow.tags });
        } catch (error) {
            console.error('Error toggling public:', error);
            res.status(500).json({ message: 'Error toggling public status' });
        }
    }

    /**
     * GET /flows/pending  (Admin only)
     * List all flows awaiting admin review.
     */
    getPendingFlows = async (req, res) => {
        try {
            const flows = await Flow.find({ publicStatus: 'pending' })
                .populate('userId', 'fullName username avatar level')
                .sort({ updatedAt: -1 })
                .select('title description tags flowData.nodes createdAt updatedAt userId publicStatus');

            const enriched = flows.map(f => {
                const obj = f.toObject();
                obj.nodeCount = Array.isArray(obj.flowData?.nodes) ? obj.flowData.nodes.length : 0;
                delete obj.flowData;
                return obj;
            });

            res.json(enriched);
        } catch (error) {
            console.error('Error fetching pending flows:', error);
            res.status(500).json({ message: 'Error fetching pending flows' });
        }
    }

    /**
     * PATCH /flows/:id/review  (Admin only)
     * Approve or reject a pending flow.
     * Body: { action: 'approve' | 'reject', note?: string }
     */
    reviewFlow = async (req, res) => {
        try {
            const { action, note } = req.body;
            if (!['approve', 'reject'].includes(action)) {
                return res.status(400).json({ message: 'Action must be "approve" or "reject"' });
            }

            const flow = await Flow.findById(req.params.id);
            if (!flow) return res.status(404).json({ message: 'Flow not found' });

            if (action === 'approve') {
                flow.publicStatus = 'approved';
                flow.isPublic = true;
                flow.reviewNote = note || '';
            } else {
                flow.publicStatus = 'rejected';
                flow.isPublic = false;
                flow.reviewNote = note || 'Your flow was not approved for public sharing.';
            }

            await flow.save();
            res.json({ publicStatus: flow.publicStatus, reviewNote: flow.reviewNote });
        } catch (error) {
            console.error('Error reviewing flow:', error);
            res.status(500).json({ message: 'Error reviewing flow' });
        }
    }
}
