// api/registerUser.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // Проверяем, есть ли у этого пользователя хоть какие-то записи
    const existingRecord = await prisma.debt.findFirst({
      where: { telegramUserId: String(userId) },
    });

    // Если записей нет ВООБЩЕ, то создаем одну "регистрационную"
    if (!existingRecord) {
      await prisma.debt.create({
        data: {
          telegramUserId: String(userId),
          amount: 0, // Нулевая сумма
          description: 'User Registration Entry', // Служебное описание
          status: 'PAID', // Сразу помечаем как "погашенный", чтобы не влиял на сумму долга
        },
      });
      return res.status(201).json({ message: 'User registered' });
    }

    // Если записи уже есть, ничего не делаем
    return res.status(200).json({ message: 'User already exists' });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to register user' });
  }
}