import { Router } from 'express';
import { authenticateToken } from '@breezy/shared';
import { sendMessage, getConversation } from '../controllers/dmController';

const router = Router();

router.use(authenticateToken);

router.post('/send', sendMessage);
router.get('/conversation/:userId', getConversation);

export default router;
