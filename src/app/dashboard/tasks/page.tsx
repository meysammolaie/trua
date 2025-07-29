
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Gift, Sparkles, Zap, CheckCircle } from "lucide-react";
import { getTasksAction, Task } from "@/app/actions/tasks";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const fetchedTasks = await getTasksAction();
        setTasks(fetchedTasks);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "There was a problem fetching the task list.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="ml-4">Loading tasks...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Tasks & Rewards</h1>
      </div>

      {tasks.length === 0 ? (
        <Card className="text-center p-10 flex flex-col items-center">
            <Sparkles className="w-16 h-16 text-primary mb-4" />
            <CardTitle className="text-2xl font-bold mb-2">Exciting News Coming Soon!</CardTitle>
            <CardDescription className="max-w-md mx-auto">
                We are preparing new opportunities for you to increase your income. By completing simple tasks that will appear in this section in the future, you can receive USD and Gold as rewards. Stay tuned!
            </CardDescription>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <Card key={task.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>{task.title}</CardTitle>
                </div>
                <CardDescription>{task.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="p-3 rounded-lg bg-muted flex items-center justify-center gap-2">
                    <Gift className="w-5 h-5 text-yellow-500"/>
                    <span className="font-bold">Reward:</span>
                    <span className="font-mono text-lg text-green-400">${task.rewardAmount.toLocaleString()}</span>
                </div>
              </CardContent>
              <div className="p-4 border-t">
                  <Button className="w-full" disabled>
                      <CheckCircle className="mr-2 h-4 w-4"/>
                      Completed (Coming Soon)
                  </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
