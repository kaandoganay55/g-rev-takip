"use client";

import { useState } from 'react';
import Calendar from 'react-calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, isSameDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import 'react-calendar/dist/Calendar.css';

interface Task {
  _id: string;
  title: string;
  description: string;
  priority?: string;
  category?: string;
  completed?: boolean;
  deadline?: Date;
  createdAt?: Date;
}

interface CalendarViewProps {
  tasks: Task[];
  onToggleComplete: (taskId: string, currentStatus: boolean) => void;
}

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onToggleComplete }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showTasks, setShowTasks] = useState(false);

  // Seçilen tarihteki görevler
  const selectedDateTasks = tasks.filter(task => {
    if (!task.deadline) return false;
    return isSameDay(new Date(task.deadline), selectedDate);
  });

  // Tarihte görev var mı kontrol et
  const hasTasksOnDate = (date: Date): boolean => {
    return tasks.some(task => {
      if (!task.deadline) return false;
      return isSameDay(new Date(task.deadline), date);
    });
  };

  // Tarihteki görev sayısı
  const getTaskCountOnDate = (date: Date): number => {
    return tasks.filter(task => {
      if (!task.deadline) return false;
      return isSameDay(new Date(task.deadline), date);
    }).length;
  };

  // Takvim tile içeriği
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const taskCount = getTaskCountOnDate(date);
      if (taskCount > 0) {
        return (
          <div className="flex justify-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
          </div>
        );
      }
    }
    return null;
  };

  // Takvim tile class name
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      if (hasTasksOnDate(date)) {
        return 'has-tasks';
      }
    }
    return null;
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'acil': return 'bg-red-100 text-red-800 border-red-200';
      case 'yüksek': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'orta': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'düşük': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'acil': return '🔴';
      case 'yüksek': return '🟠';
      case 'orta': return '🟡';
      case 'düşük': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Takvim */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📅</span>
            <span>Takvim Görünümü</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full">
            <Calendar
              onChange={(value) => {
                if (value instanceof Date) {
                  setSelectedDate(value);
                  setShowTasks(true);
                }
              }}
              value={selectedDate}
              tileContent={tileContent}
              tileClassName={tileClassName}
              locale="tr-TR"
              className="w-full border-none"
            />
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Deadline olan günler</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seçilen tarihteki görevler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <span>📋</span>
              <span>
                {format(selectedDate, 'dd MMMM yyyy', { locale: tr })} Görevleri
              </span>
            </span>
            {selectedDateTasks.length > 0 && (
              <Badge variant="outline">
                {selectedDateTasks.length} görev
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDateTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📅</div>
              <h3 className="font-medium">Bu tarihte görev yok</h3>
              <p className="text-sm mt-1">Başka bir tarih seçin</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDateTasks.map(task => (
                <Card key={task._id} className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => onToggleComplete(task._id, task.completed || false)}
                        className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          task.completed 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'border-gray-300 hover:border-green-400'
                        }`}
                      >
                        {task.completed && '✓'}
                      </button>
                      <div className="flex-1 min-w-0">
                        <h5 className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                          {task.title}
                        </h5>
                        <p className={`text-sm mt-1 ${task.completed ? 'text-gray-500' : 'text-gray-600'}`}>
                          {task.description}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                            {getPriorityIcon(task.priority)} {task.priority}
                          </Badge>
                          {task.category && (
                            <Badge variant="outline" className="text-xs">
                              📁 {task.category}
                            </Badge>
                          )}
                          {task.completed && (
                            <Badge variant="secondary" className="text-xs">
                              ✅ Tamamlandı
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarView; 