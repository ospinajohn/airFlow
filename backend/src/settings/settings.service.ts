import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { UpdateSettingsDto } from './dto/update-settings.dto';

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

  async update(userId: string, data: UpdateSettingsDto) {
    const updateData: Prisma.UserSettingsUpdateInput = {};

    if (data.autoStartPomodoro !== undefined) {
      updateData.autoStartPomodoro = data.autoStartPomodoro;
    }
    if (data.showKanbanHealthCheck !== undefined) {
      updateData.showKanbanHealthCheck = data.showKanbanHealthCheck;
    }
    if (data.weekStartsOn !== undefined) {
      updateData.weekStartsOn = data.weekStartsOn;
    }
    if (data.vibrationEnabled !== undefined) {
      updateData.vibrationEnabled = data.vibrationEnabled;
    }
    if (data.theme !== undefined) {
      updateData.theme = data.theme;
    }

    return this.prisma.userSettings.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        autoStartPomodoro: data.autoStartPomodoro ?? false,
        showKanbanHealthCheck: data.showKanbanHealthCheck ?? true,
        weekStartsOn: data.weekStartsOn ?? 1,
        vibrationEnabled: data.vibrationEnabled ?? true,
        theme: data.theme ?? 'dark',
      },
    });
  }
}
