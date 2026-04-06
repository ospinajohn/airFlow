-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "pomodoroAutoStartBreaks" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pomodoroCyclesUntilLongBreak" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "pomodoroLongBreakDuration" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "pomodoroShortBreakDuration" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "pomodoroWorkDuration" INTEGER NOT NULL DEFAULT 25;
