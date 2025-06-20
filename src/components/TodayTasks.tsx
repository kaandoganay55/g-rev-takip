"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { isToday, isPast, format } from 'date-fns';
import { tr } from 'date-fns/locale';

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

interface TodayTasksProps {
  tasks: Task[];
  onToggleComplete: (taskId: string, currentStatus: boolean) => void;
}

const TodayTasks: React.FC<TodayTasksProps> = ({ tasks, onToggleComplete }) => {
  // Bugünün görevleri (deadline'ı bugün olan veya deadline'ı geçmiş olan)
  const todayTasks = tasks.filter(task => {
    if (!task.deadline) return false;
    const deadlineDate = new Date(task.deadline);
    return isToday(deadlineDate) || isPast(deadlineDate);
  });

  // Deadline'ı geçmiş görevler
  const overdueTasks = todayTasks.filter(task => {
    if (!task.deadline) return false;
    const deadlineDate = new Date(task.deadline);
    return isPast(deadlineDate) && !isToday(deadlineDate) && !task.completed;
  });

  // Bugünkü görevler
  const dueTodayTasks = todayTasks.filter(task => {
    if (!task.deadline) return false;
    const deadlineDate = new Date(task.deadline);
    return isToday(deadlineDate);
  });

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
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <span>📅</span>
          <span>Bugünün Görevleri</span>
          {todayTasks.length > 0 && (
            <Badge variant="outline" className="ml-auto">
              {todayTasks.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Deadline'ı geçmiş görevler */}
        {overdueTasks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-red-600 flex items-center space-x-1">
              <span>⚠️</span>
              <span>Süresi Geçenler ({overdueTasks.length})</span>
            </h4>
            {overdueTasks.map(task => (
              <Card key={task._id} className="border-red-200 bg-red-50">
                <CardContent className="p-3">
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={() => onToggleComplete(task._id, task.completed || false)}
                      className={`mt-1 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        task.completed 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-gray-300 hover:border-green-400'
                      }`}
                    >
                      {task.completed && '✓'}
                    </button>
                    <div className="flex-1 min-w-0">
                      <h5 className={`font-medium text-sm ${task.completed ? 'line-through text-gray-500' : ''}`}>
                        {task.title}
                      </h5>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                          {getPriorityIcon(task.priority)} {task.priority}
                        </Badge>
                        {task.deadline && (
                          <span className="text-xs text-red-600">
                            {format(new Date(task.deadline), 'dd MMM', { locale: tr })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Bugünkü görevler */}
        {dueTodayTasks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-blue-600 flex items-center space-x-1">
              <span>🎯</span>
              <span>Bugün Bitenler ({dueTodayTasks.length})</span>
            </h4>
            {dueTodayTasks.map(task => (
              <Card key={task._id} className="border-blue-200 bg-blue-50">
                <CardContent className="p-3">
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={() => onToggleComplete(task._id, task.completed || false)}
                      className={`mt-1 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        task.completed 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-gray-300 hover:border-green-400'
                      }`}
                    >
                      {task.completed && '✓'}
                    </button>
                    <div className="flex-1 min-w-0">
                      <h5 className={`font-medium text-sm ${task.completed ? 'line-through text-gray-500' : ''}`}>
                        {task.title}
                      </h5>
                                             <div className="flex items-center space-x-2 mt-1">
                         <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                           {getPriorityIcon(task.priority)} {task.priority}
                         </Badge>
                         <span className="text-xs text-blue-600">Bugün</span>
                       </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Görev yoksa */}
        {todayTasks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="font-medium">Bugün için görev yok!</h3>
            <p className="text-sm mt-1">Yeni görevler ekleyebilirsiniz</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TodayTasks; 