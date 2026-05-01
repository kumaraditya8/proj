import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

const projectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
});

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (role === 'admin') {
      const projects = await prisma.project.findMany({
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true, role: true } } }
          },
          tasks: true,
        }
      });
      return res.json(projects);
    }

    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: { userId: userId }
        }
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } }
        },
        tasks: true,
      }
    });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const data = projectSchema.parse(req.body);
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        color: data.color || '#3b82f6',
        members: {
          create: {
            userId: userId,
          }
        }
      },
      include: {
        members: true,
      }
    });

    res.status(201).json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid data', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProjectDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } }
        },
        tasks: {
          include: { assignee: { select: { id: true, name: true } } }
        },
      }
    });

    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const addMember = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    await prisma.projectMember.create({
      data: {
        projectId: id,
        userId: userId,
      }
    });

    res.json({ message: 'Member added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const removeMember = async (req: AuthRequest, res: Response) => {
  try {
    const { id, userId } = req.params;

    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId: id,
          userId: userId,
        }
      }
    });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
