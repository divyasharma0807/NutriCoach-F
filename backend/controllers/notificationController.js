import Notification from '../models/Notification.js';

// @desc    Get notifications for logged in user
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res, next) => {
  const user = req.user;

  try {
    let notifications;
    if (user.role === 'admin') {
      notifications = await Notification.find({ recipientType: 'admin' }).sort({ createdAt: -1 });
    } else {
      notifications = await Notification.find({
        recipientType: user.role,
        recipientId: user._id
      }).sort({ createdAt: -1 });
    }

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markNotificationRead = async (req, res, next) => {
  const notifId = req.params.id;

  try {
    const notification = await Notification.findById(notifId);
    if (!notification) {
      res.status(404);
      throw new Error('Notification not found');
    }

    // Verify ownership
    if (notification.recipientType !== 'admin' && notification.recipientId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to read this notification');
    }

    notification.read = true;
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    next(error);
  }
};
