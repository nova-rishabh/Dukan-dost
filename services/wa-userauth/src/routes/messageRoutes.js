import express from 'express';
import crypto from 'node:crypto';
import { config } from '../config.js';
import { normalizeMobile } from '../storage/userStore.js';
import { defaultBerryAdapter } from '../messaging/berryAdapter.js';

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

/**
 * Added for Dukaan Dost: lets a trusted app send one text through the paired WhatsApp device.
 * Guarded by the same appKey/appSecret pair as result verification, size-limited and rate-limited.
 * The calling app is responsible for only sending what its signed-in owner asked to send.
 */
export function createMessageRouter(options = {}) {
  const router = express.Router();
  const adapter = options.adapter || defaultBerryAdapter;
  const apps = options.allowedApps || config.allowedApps;
  const maxPerMinute = options.maxPerMinute || 20;
  const recent = new Map();

  router.post('/send', async (req, res) => {
    try {
      const { appKey, appSecret, to, text } = req.body || {};
      const secret = apps.get(String(appKey || ''));
      if (!secret || !safeEqual(secret, appSecret ?? '')) {
        return res.status(401).json({ success: false, error: 'Invalid app credentials.' });
      }
      const norm = normalizeMobile(to);
      if (!norm || norm.length < 8) {
        return res.status(400).json({ success: false, error: 'Invalid recipient number.' });
      }
      if (typeof text !== 'string' || !text.trim() || text.length > 1000) {
        return res.status(400).json({ success: false, error: 'Message text is required (1000 characters at most).' });
      }
      const now = Date.now();
      const hits = (recent.get(appKey) || []).filter((t) => now - t < 60_000);
      if (hits.length >= maxPerMinute) {
        res.setHeader('Retry-After', '60');
        return res.status(429).json({ success: false, error: 'Too many messages. Wait a minute.' });
      }
      hits.push(now);
      recent.set(appKey, hits);

      const result = await adapter.sendMessage(norm, text);
      if (!result.success) {
        return res.status(503).json({ success: false, error: result.error || 'WhatsApp is not paired or connected.', whatsappStatus: result.status });
      }
      return res.status(200).json({ success: true, id: result.id || null, simulated: !!result.simulated });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Message dispatch failed.' });
    }
  });

  return router;
}
