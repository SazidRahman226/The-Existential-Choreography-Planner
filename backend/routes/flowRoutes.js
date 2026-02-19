import { Router } from 'express';
import { FlowController } from '../controllers/flowController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();
const flowController = new FlowController();

// Apply authentication middleware to all flow routes
router.use(authenticateJWT);

router.get('/', flowController.getAll);
router.post('/', flowController.create);
router.get('/:id', flowController.getById);
router.put('/:id', flowController.update);
router.delete('/:id', flowController.delete);
router.patch('/:id/complete-flow', flowController.completeFlow);

export default router;
