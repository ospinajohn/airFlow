import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(@Request() req) {
    return this.tasksService.findAll(req.user.userId);
  }

  @Post()
  create(@Request() req, @Body() createTaskDto: CreateTaskDto) {
    const { projectId, ...rest } = createTaskDto;
    return this.tasksService.create({
      ...rest,
      user: { connect: { id: req.user.userId } },
      ...(projectId ? { project: { connect: { id: projectId } } } : {}),
    });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    const { projectId, ...rest } = updateTaskDto;
    return this.tasksService.update(id, {
      ...rest,
      ...(projectId !== undefined
        ? { project: { connect: { id: projectId } } }
        : {}),
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
