import { Router } from 'express';
import { createStaff, getStaff, updateStaff } from '../controllers/staff.controller';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Semua route staff mewajibkan autentikasi JWT
router.use(authenticateJWT);
router.use(authorizeRole('pimpinan_ditmawa', 'pimpinan_fakultas'));

router.post('/', createStaff);       // POST /api/staff
router.get('/', getStaff);           // GET /api/staff
router.put('/:id', updateStaff);     // PUT /api/staff/:id

export default router;
