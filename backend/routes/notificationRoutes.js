import express from 'express';
import { getNotifications, markNotificationRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.put('/:id/read', markNotificationRead);

// Register FCM device token
router.post('/register-token', async (req, res, next) => {
  try {
    const { token, device, browser, platform } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'FCM Token required' });
    }

    const user = req.user;
    const existingTokenIdx = user.notificationTokens.findIndex(t => t.token === token);
    if (existingTokenIdx > -1) {
      user.notificationTokens[existingTokenIdx].updatedAt = new Date();
      if (device) user.notificationTokens[existingTokenIdx].device = device;
      if (browser) user.notificationTokens[existingTokenIdx].browser = browser;
      if (platform) user.notificationTokens[existingTokenIdx].platform = platform;
    } else {
      user.notificationTokens.push({
        token,
        device: device || '',
        browser: browser || '',
        platform: platform || '',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await user.save();
    res.json({ success: true, message: 'FCM Token registered successfully' });
  } catch (error) {
    next(error);
  }
});

// Unregister FCM device token
router.post('/unregister-token', async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'FCM Token required' });
    }

    const user = req.user;
    user.notificationTokens = user.notificationTokens.filter(t => t.token !== token);
    await user.save();

    res.json({ success: true, message: 'FCM Token unregistered successfully' });
  } catch (error) {
    next(error);
  }
});

// Get user notification preferences
router.get('/settings', (req, res) => {
  const settings = req.user.notificationSettings || {
    pushEnabled: true,
    sessions: true,
    dietPlans: true,
    results: true,
    subscriptions: true,
    marketing: false
  };
  res.json({ success: true, data: settings });
});

// Update user notification preferences
router.put('/settings', async (req, res, next) => {
  try {
    const { pushEnabled, sessions, dietPlans, results, subscriptions, marketing } = req.body;
    const user = req.user;

    user.notificationSettings = {
      pushEnabled: pushEnabled !== undefined ? pushEnabled : (user.notificationSettings?.pushEnabled ?? true),
      sessions: sessions !== undefined ? sessions : (user.notificationSettings?.sessions ?? true),
      dietPlans: dietPlans !== undefined ? dietPlans : (user.notificationSettings?.dietPlans ?? true),
      results: results !== undefined ? results : (user.notificationSettings?.results ?? true),
      subscriptions: subscriptions !== undefined ? subscriptions : (user.notificationSettings?.subscriptions ?? true),
      marketing: marketing !== undefined ? marketing : (user.notificationSettings?.marketing ?? false)
    };

    await user.save();
    res.json({ success: true, message: 'Notification settings updated successfully', data: user.notificationSettings });
  } catch (error) {
    next(error);
  }
});

export default router;
