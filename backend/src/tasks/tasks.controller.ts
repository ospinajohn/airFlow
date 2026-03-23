import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(@Request() req) {
    return this.tasksService.findAll(req.user.userId);
  }

  @Post()
  create(@Request() req, @Body() createTaskDto: Prisma.TaskCreateWithoutUserInput) {
    return this.tasksService.create({
      ...createTaskDto,
      user: { connect: { id: req.user.userId } },
    });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: Prisma.TaskUpdateInput) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
