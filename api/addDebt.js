// api/addDebt.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Мы ожидаем, что данные придут методом POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Вытаскиваем данные из тела запроса
    const { userId, amount, description } = req.body;

    // Простая валидация: проверяем, что все нужные данные пришли
    if (!userId || !amount || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Создаем новую запись в базе данных
    const newDebt = await prisma.debt.create({
      data: {
        telegramUserId: String(userId),
        amount: parseFloat(amount), // Превращаем строку в число
        description: description,
      },
    });

    // Отправляем обратно созданную запись в качестве подтверждения
    // Статус 201 означает "Created"
    return res.status(201).json(newDebt);
  } catch (error) {
    console.error('Request error', error);
    return res.status(500).json({ error: 'Error creating debt' });
  }
}