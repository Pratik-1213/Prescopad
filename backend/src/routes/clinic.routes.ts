import { Router } from 'express';
import * as ClinicController from '../controllers/clinic.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Get clinic details
router.get('/', ClinicController.getClinic);

// Create or update clinic (doctor only)
router.put('/', ClinicController.createOrUpdateClinic);

// Join a clinic (assistant only - provide doctor's phone)
router.post('/join', ClinicController.joinClinic);

// Get doctor online status (for assistants to check)
router.get('/doctor-status', ClinicController.getDoctorStatus);

export default router;
