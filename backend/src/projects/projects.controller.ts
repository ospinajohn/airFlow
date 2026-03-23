import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll(@Request() req) {
    return this.projectsService.findAll(req.user.userId);
  }

  @Post()
  create(@Request() req, @Body() createProjectDto: Prisma.ProjectCreateWithoutUserInput) {
    return this.projectsService.create({
      ...createProjectDto,
      user: { connect: { id: req.user.userId } },
    });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: Prisma.ProjectUpdateInput) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
