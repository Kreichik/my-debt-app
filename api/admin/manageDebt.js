// api/admin/manageDebt.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ADMIN_ID = 918550382; // Твой ID для проверки

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Простая проверка на админа по ID из тела запроса
  const { adminId, action, payload } = req.body;
  if (adminId !== ADMIN_ID) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    switch (action) {
      // --- Добавление нового долга ---
      case 'ADD_DEBT': {
        const { targetUserId, amount, description, issuedAt } = payload;
        const newDebt = await prisma.debt.create({
          data: {
            telegramUserId: String(targetUserId),
            amount: parseFloat(amount),
            description,
            issuedAt: issuedAt ? new Date(issuedAt) : new Date(),
          },
        });
        return res.status(201).json(newDebt);
      }

      // --- Полное погашение одного долга ---
      case 'MARK_AS_PAID': {
        const { debtId } = payload;
        const updatedDebt = await prisma.debt.update({
          where: { id: parseInt(debtId) },
          data: { status: 'PAID' },
        });
        return res.status(200).json(updatedDebt);
      }
      
      // --- Частичное погашение (самая сложная логика) ---
      case 'PARTIAL_PAYMENT': {
        const { targetUserId, paymentAmount } = payload;
        let amountToRepay = parseFloat(paymentAmount);

        // Находим все непогашенные долги пользователя, от старых к новым
        const unpaidDebts = await prisma.debt.findMany({
          where: { telegramUserId: String(targetUserId), status: 'UNPAID' },
          orderBy: { issuedAt: 'asc' },
        });

        for (const debt of unpaidDebts) {
          if (amountToRepay <= 0) break;
          
          if (amountToRepay >= debt.amount) {
            // Если сумма платежа больше или равна долгу, гасим его полностью
            await prisma.debt.update({
              where: { id: debt.id },
              data: { status: 'PAID' },
            });
            amountToRepay -= debt.amount;
          } else {
            // Если сумма меньше, уменьшаем долг и выходим из цикла
            await prisma.debt.update({
              where: { id: debt.id },
              data: { amount: debt.amount - amountToRepay },
            });
            amountToRepay = 0;
          }
        }
        return res.status(200).json({ message: 'Payment applied successfully' });
      }

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'An error occurred' });
  }
}