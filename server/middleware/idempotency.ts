import { Request, Response, NextFunction } from 'express';

// In-memory idempotency cache (PostgreSQL table `idempotency_keys` equivalent)
const idempotencyStore = new Map<string, { status: number; body: any; createdAt: number }>();

export const handleIdempotency = (req: Request, res: Response, next: NextFunction) => {
  const idempotencyKey = req.headers['idempotency-key'] as string;
  if (!idempotencyKey) {
    return next();
  }

  const tenantKey = `${req.businessId || 'default'}_${idempotencyKey}`;
  const existing = idempotencyStore.get(tenantKey);

  if (existing) {
    // Return cached response immediately to prevent duplicate charge / inventory deduction
    res.setHeader('X-Idempotent-Replay', 'true');
    return res.status(existing.status).json(existing.body);
  }

  // Intercept json send to cache the result
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    idempotencyStore.set(tenantKey, {
      status: res.statusCode,
      body,
      createdAt: Date.now(),
    });
    return originalJson(body);
  };

  next();
};

// In-memory sliding window rate limiter
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimiter = (limit = 120, windowMs = 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = (req.ip || 'ip') + '_' + (req.businessId || 'biz');
    const now = Date.now();
    const entry = requestCounts.get(key);

    if (!entry || now > entry.resetTime) {
      requestCounts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (entry.count >= limit) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please slow down.',
          message_am: 'ጥያቄዎች በዝተዋል። እባክዎ ጥቂት ሰከንዶች ቆይተው እንደገና ይሞክሩ።',
          status: 429,
        },
        timestamp: new Date().toISOString(),
      });
    }

    entry.count += 1;
    next();
  };
};
