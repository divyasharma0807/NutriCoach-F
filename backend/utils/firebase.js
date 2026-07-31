import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import Client from '../models/Client.js';
import Coach from '../models/Coach.js';
import Admin from '../models/Admin.js';

let messagingInstance = null;

try {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey) {
    privateKey = privateKey.replace(/^['"]|['"]$/g, '');
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (projectId && clientEmail && privateKey) {
    let app;
    if (getApps().length === 0) {
      const credential = cert({
        projectId,
        clientEmail,
        privateKey,
      });
      app = initializeApp({ credential });
    } else {
      app = getApps()[0];
    }
    messagingInstance = getMessaging(app);
  } else {
    console.warn('Firebase configuration missing. Push notifications will be logged but not sent via FCM.');
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error);
}

/**
 * Sends a push notification to a specific recipient.
 * @param {Object} doc - The Notification model instance.
 */
export const sendPushForNotification = async (doc) => {
  try {
    const { recipientType, recipientId, text, type } = doc;

    // 1. Identify recipient(s) and fetch notification tokens and settings
    let recipients = [];
    if (recipientType === 'admin') {
      if (recipientId) {
        const adminUser = await Admin.findById(recipientId);
        if (adminUser) recipients.push(adminUser);
      } else {
        // broadcast to all admins
        const admins = await Admin.find({});
        recipients = admins;
      }
    } else if (recipientType === 'coach') {
      const coachUser = await Coach.findById(recipientId);
      if (coachUser) recipients.push(coachUser);
    } else if (recipientType === 'client') {
      const clientUser = await Client.findById(recipientId);
      if (clientUser) recipients.push(clientUser);
    }

    if (recipients.length === 0) {
      return;
    }

    for (const user of recipients) {
      // 2. Cross-reference notificationSettings and pushEnabled status
      const settings = user.notificationSettings || {
        pushEnabled: true,
        sessions: true,
        dietPlans: true,
        results: true,
        subscriptions: true,
        marketing: false
      };

      if (!settings.pushEnabled) {
        continue;
      }

      // Filter by sub-types
      const isSession = type && (type.startsWith('session') || type.includes('meeting'));
      const isDiet = type && (type.includes('diet') || type.includes('meal') || type.includes('plan'));
      const isResult = type && type.includes('result');
      const isSubscription = type && (type.includes('subscription') || type.includes('expire') || type.includes('renew') || type.includes('payment'));
      const isMarketing = type && type.includes('marketing');

      if (isSession && settings.sessions === false) {
        continue;
      }
      if (isDiet && settings.dietPlans === false) {
        continue;
      }
      if (isResult && settings.results === false) {
        continue;
      }
      if (isSubscription && settings.subscriptions === false) {
        continue;
      }
      if (isMarketing && settings.marketing === false) {
        continue;
      }

      // 3. Collect active device tokens
      const tokens = (user.notificationTokens || []).map(t => t.token);
      if (tokens.length === 0) continue;

      // 4. Construct payload title and click action
      let title = 'NutriCoach Update';
      let clickAction = '/dashboard';

      const userRole = user.role || 'client'; // fallback

      if (isSession) {
        title = 'Session Scheduled';
        clickAction = '/dashboard?section=dashboard';
      } else if (isDiet) {
        title = 'Diet Plan Update';
        clickAction = userRole === 'client' ? '/dashboard?section=diet-plan' : '/dashboard?section=diet-schedule';
      } else if (isResult) {
        title = 'Transformation Result';
        clickAction = userRole === 'client' ? '/dashboard?section=coach-results' : '/dashboard?section=results';
      } else if (isSubscription) {
        title = 'Subscription Alert';
        clickAction = '/dashboard?section=dashboard';
      }

      // Custom notification overrides if present
      if (doc.title) title = doc.title;

      const payload = {
        notification: {
          title,
          body: text || doc.message || 'You have a new update.',
        },
        data: {
          click_action: clickAction,
          notification_id: doc._id.toString()
        }
      };
      if (!messagingInstance) {
        continue;
      }

      // 5. Send FCM message
      const response = await messagingInstance.sendEachForMulticast({
        tokens,
        notification: payload.notification,
        data: payload.data
      });

      // 6. Token Cleanup: if there are any failures, find and remove stale tokens
      if (response.failureCount > 0) {
        const badTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const error = resp.error;
            if (error.code === 'messaging/invalid-registration-token' ||
                error.code === 'messaging/registration-token-not-registered') {
              badTokens.push(tokens[idx]);
            }
          }
        });

        if (badTokens.length > 0) {
          user.notificationTokens = user.notificationTokens.filter(t => !badTokens.includes(t.token));
          await user.save();
        }
      }
    }
  } catch (error) {
    console.error('[NOTIFICATION DEBUG] Error in sendPushForNotification utility:', error);
  }
};
