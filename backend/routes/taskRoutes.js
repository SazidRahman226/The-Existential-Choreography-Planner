import { Router } from 'express';
import { TaskController } from '../controllers/taskController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();
const taskController = new TaskController();

// Apply authentication middleware to all task routes
router.use(authenticateJWT);

router.get('/', taskController.getAll);
router.post('/', taskController.create);
router.get('/:id', taskController.getById);
router.put('/:id', taskController.update);
router.delete('/:id', taskController.delete);

export default router;
