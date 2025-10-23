// api/getDebts.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Получаем ID пользователя из параметров запроса
  // Например, /api/getDebts?userId=12345
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // Ищем в базе все записи, где telegramUserId совпадает с полученным
    const debts = await prisma.debt.findMany({
      where: {
        telegramUserId: String(userId), // Приводим к строке на всякий случай
      },
      orderBy: {
        createdAt: 'desc', // Сортируем от новых к старым
      },
    });

    // Отправляем найденные долги в формате JSON
    return res.status(200).json(debts);
  } catch (error) {
    console.error('Request error', error);
    return res.status(500).json({ error: 'Error fetching debts' });
  }
}