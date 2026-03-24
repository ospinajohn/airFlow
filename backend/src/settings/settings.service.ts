import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async findByUserId(userId: string) {
    let settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await this.prisma.userSettings.create({
        data: {
          userId,
          autoStartPomodoro: false,
          showKanbanHealthCheck: true,
          weekStartsOn: 1,
          vibrationEnabled: true,
          theme: 'dark',
        },
      });
    }

    return settings;
  }

  async update(userId: string, data: any) {
    return this.prisma.userSettings.upsert({
      where: { userId },
      update: {
        autoStartPomodoro: data.autoStartPomodoro,
        showKanbanHealthCheck: data.showKanbanHealthCheck,
        weekStartsOn: data.weekStartsOn,
        vibrationEnabled: data.vibrationEnabled,
        theme: data.theme,
      },
      create: {
        userId,
        ...data,
      },
    });
  }
}
