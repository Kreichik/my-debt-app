// api/admin/getUsers.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Тут можно добавить проверку на админа, если нужно, но пока это некритично
  try {
    const debts = await prisma.debt.findMany({
      select: {
        telegramUserId: true, // Выбираем только ID пользователей
      },
    });
    // Получаем только уникальные ID
    const userIds = [...new Set(debts.map(d => d.telegramUserId))];
    res.status(200).json(userIds);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}