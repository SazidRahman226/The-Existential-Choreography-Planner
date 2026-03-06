import { Router } from 'express';
import { FlowController } from '../controllers/flowController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { isAdmin } from '../middleware/adminMiddleware.js';

const router = Router();
const flowController = new FlowController();

// Public route — no auth required
router.get('/public', flowController.getPublicFlows);

// Apply authentication middleware to all remaining flow routes
router.use(authenticateJWT);

// Admin-only routes (MUST be before /:id to avoid route conflicts)
router.get('/pending', isAdmin, flowController.getPendingFlows);

router.get('/', flowController.getAll);
router.post('/', flowController.create);
router.get('/:id', flowController.getById);
router.put('/:id', flowController.update);
router.delete('/:id', flowController.delete);
router.patch('/:id/complete-flow', flowController.completeFlow);
router.post('/:id/clone', flowController.cloneFlow);
router.patch('/:id/toggle-public', flowController.togglePublic);
router.patch('/:id/review', isAdmin, flowController.reviewFlow);

export default router;
