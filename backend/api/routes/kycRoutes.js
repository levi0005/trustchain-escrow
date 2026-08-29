import express from 'express';
import adminAuth from '../middleware/adminAuth.js';
import authMiddleware from '../middleware/auth.js';
import { authorizeBodyAddress, authorizeParamAddress } from '../middleware/authorization.js';
import kycController from '../controllers/kycController.js';
import {
  stellarAddressParam,
  stellarAddressBody,
  handleValidationErrors,
} from '../../middleware/validation.js';

const router = express.Router();

/**
 * Express middleware that buffers the raw, unparsed request body onto
 * `req.rawBody` before JSON parsing runs. Required so the Sumsub webhook
 * handler can verify the HMAC signature against the exact bytes Sumsub sent.
 *
 * @param {import('express').Request} req - Incoming request; the raw body is attached as `req.rawBody`.
 * @param {import('express').Response} _res - Unused.
 * @param {import('express').NextFunction} next - Invoked once the body has been fully read.
 * @returns {void}
 */
const captureRawBody = (req, _res, next) => {
  let data = '';
  req.on('data', (chunk) => (data += chunk));
  req.on('end', () => {
    req.rawBody = data;
    next();
  });
};

/**
 * @route  POST /api/kyc/token
 * @desc   Generate a Sumsub SDK access token for the frontend widget.
 * @body   { address: string }
 * @param  {import('express').Request} req - Request; `req.body.address` is the Stellar address to generate a token for.
 * @param  {import('express').Response} res - Sends `{ token }` on success, or an error status on failure.
 * @returns {Promise<void>}
 */
router.post(
  '/token',
  authMiddleware,
  stellarAddressBody('address'),
  handleValidationErrors,
  authorizeBodyAddress('address'),
  kycController.getToken,
);

/**
 * @route  GET /api/kyc/status/:address
 * @desc   Get KYC verification status for a Stellar address.
 * @param  {import('express').Request} req - Request; `req.params.address` is the Stellar address to look up.
 * @param  {import('express').Response} res - Sends the KYC status record for the address.
 * @returns {Promise<void>}
 */
router.get(
  '/status/:address',
  authMiddleware,
  stellarAddressParam('address'),
  handleValidationErrors,
  authorizeParamAddress('address'),
  kycController.getStatus,
);

/**
 * @route  POST /api/kyc/webhook
 * @desc   Sumsub webhook endpoint — updates verification status.
 * @param  {import('express').Request} req - Request; `req.rawBody` (set by {@link captureRawBody}) is used to verify the Sumsub signature.
 * @param  {import('express').Response} res - Acknowledges receipt of the webhook.
 * @returns {Promise<void>}
 */
router.post('/webhook', captureRawBody, express.json(), kycController.webhook);

/**
 * @route  GET /api/kyc/admin
 * @desc   Admin-only listing of KYC records.
 * @param  {import('express').Request} req - Request; supports pagination/filter query params handled by the controller.
 * @param  {import('express').Response} res - Sends the paginated list of KYC records.
 * @returns {Promise<void>}
 */
router.get('/admin', adminAuth, kycController.adminList);

export default router;
