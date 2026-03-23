import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const tasks = await this.prisma.task.findMany({
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    });

    if (tasks.length === 0) {
      return {
        message: 'No hay tareas disponibles en este momento.',
        data: [],
      };
    }

    return tasks;
  }

  async create(data: Prisma.TaskCreateInput) {
    return this.prisma.task.create({ data });
  }

  async update(id: string, data: Prisma.TaskUpdateInput) {
    return this.prisma.task.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.task.delete({
      where: { id },
    });
  }
}
