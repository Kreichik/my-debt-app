// api/registerUser.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { userId, userName } = req.body; // Получаем и имя
  if (!userId) return res.status(400).json({ error: 'User ID is required' });

  try {
    const existingRecord = await prisma.debt.findFirst({
      where: { telegramUserId: String(userId) },
    });

    if (!existingRecord) {
      await prisma.debt.create({
        data: {
          telegramUserId: String(userId),
          telegramUserName: userName, // Сохраняем имя
          amount: 0,
          description: 'User Registration Entry',
          status: 'PAID',
        },
      });
      return res.status(201).json({ message: 'User registered' });
    } else {
      // Если пользователь уже есть, обновим его имя на всякий случай
      await prisma.debt.updateMany({
          where: { telegramUserId: String(userId) },
          data: { telegramUserName: userName },
      });
    }
    return res.status(200).json({ message: 'User already exists' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to register user' });
  }
}