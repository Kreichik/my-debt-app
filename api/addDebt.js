import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 918550382; // Твой ID

// Функция для проверки подлинности данных от Telegram
function validateTelegramData(initData) {
  if (!initData || !BOT_TOKEN) return false;

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  params.delete('hash');
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  return calculatedHash === hash;
}


export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { userId, amount, description, initData } = req.body;

    // --- ГЛАВНАЯ ПРОВЕРКА БЕЗОПАСНОСТИ ---
    const isValid = validateTelegramData(initData);
    const requestUser = new URLSearchParams(initData).get('user');
    const requestUserId = requestUser ? JSON.parse(decodeURIComponent(requestUser)).id : null;

    if (!isValid || requestUserId !== ADMIN_ID) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    // ------------------------------------

    if (!userId || !amount || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newDebt = await prisma.debt.create({
      data: {
        telegramUserId: String(userId),
        amount: parseFloat(amount),
        description: description,
      },
    });

    return res.status(201).json(newDebt);
  } catch (error) {
    console.error('Request error', error);
    return res.status(500).json({ error: 'Error creating debt' });
  }
}