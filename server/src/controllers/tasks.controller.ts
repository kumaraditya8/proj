import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

const taskSchema = z.object({
  title: z.string().min(1),
  projectId: z.string(),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (role === 'admin') {
      const tasks = await prisma.task.findMany({
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } }
        }
      });
      return res.json(tasks);
    }

    const tasks = await prisma.task.findMany({
      where: {
        project: {
          members: {
            some: { userId: userId }
          }
        }
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } }
      }
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const data = taskSchema.parse(req.body);

    const task = await prisma.task.create({
      data: {
        title: data.title,
        projectId: data.projectId,
        assigneeId: data.assigneeId || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } }
      }
    });

    res.status(201).json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid data', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateTaskStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "todo" | "in-progress" | "done"

    const task = await prisma.task.update({
      where: { id },
      data: { status },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } }
      }
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
