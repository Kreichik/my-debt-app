// api/admin/getDebtsForUser.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });

  try {
    const debts = await prisma.debt.findMany({
      where: { telegramUserId: String(userId) },
      orderBy: { issuedAt: 'desc' }, // Сортируем по дате выдачи
    });
    res.status(200).json(debts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch debts' });
  }
}