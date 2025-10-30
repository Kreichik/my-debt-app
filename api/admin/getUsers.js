// api/admin/getUsers.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    // Группируем по ID, чтобы получить уникальных пользователей
    const users = await prisma.debt.groupBy({
      by: ['telegramUserId', 'telegramUserName'],
      orderBy: {
        telegramUserName: 'asc',
      },
    });
    // Форматируем для удобства фронтенда
    const formattedUsers = users.map(u => ({
      id: u.telegramUserId,
      name: u.telegramUserName || `User ${u.telegramUserId}`, // Если имени нет, покажем ID
    }));
    res.status(200).json(formattedUsers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}